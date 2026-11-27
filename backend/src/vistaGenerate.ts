import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';

/**
 * Probador de IA (Vista): genera la imagen del usuario con las prendas elegidas.
 *
 * Flujo:
 *  1. POST /vista/generate → valida, crea un trabajo y responde { jobId } al instante.
 *  2. El trabajo llama al servidor de IA en la GPU (VISTA_GPU_URL) en segundo plano.
 *  3. GET /vista/jobs/:id → la app consulta el estado hasta que esté "done".
 */

const prisma = new PrismaClient();
const router = Router();

// Espacio de Hugging Face que hace la prueba virtual (se puede cambiar por tu propio servidor)
const HF_SPACE = (process.env.VISTA_HF_SPACE ?? 'https://tonyassi-fashion-try-on.hf.space').replace(/\/$/, '');
const HF_TOKEN = process.env.HF_TOKEN ?? '';
const GPU_TIMEOUT_MS = 120_000;
const MAX_GARMENTS = 5;
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
const GEN_DIR = path.join(UPLOADS_ROOT, 'vista');

// Parte del cuerpo que cubre cada categoría. Solo se permite una prenda por parte.
const SLOT_BY_CATEGORY: Record<string, string> = {
  camisetas: 'top',
  polos: 'top',
  oversize: 'top',
  'camisas-vestir': 'top',
  buzos: 'top',
  sudaderas: 'top',
  deportiva: 'top',
  jeans: 'bottom',
  zapatos: 'shoes',
  gafas: 'gafas',
  gorras: 'gorra',
  bolsos: 'bolso',
};

type Garment = { sku: string; slot: string; name: string; category: string; imagePath: string | null };

/** Carga las prendas desde la base de datos y valida el límite de la pasarela Vista. */
async function resolveGarments(skus: string[]): Promise<{ garments: Garment[] } | { error: string }> {
  if (skus.length === 0) return { error: 'Elige al menos una prenda' };
  if (skus.length > MAX_GARMENTS) return { error: `Máximo ${MAX_GARMENTS} prendas por look` };

  const garments: Garment[] = [];
  const slotsUsed = new Set<string>();
  for (const sku of skus) {
    const [slug] = sku.split('--');
    const product = await prisma.product.findUnique({ where: { slug }, include: { categoryRef: true } });
    if (!product) return { error: `Producto no encontrado: ${slug}` };
    const category = product.categoryRef?.slug ?? product.category;
    const slot = SLOT_BY_CATEGORY[category];
    if (!slot) return { error: `La categoría "${category}" no se puede probar` };
    if (slotsUsed.has(slot)) return { error: 'Solo puedes elegir una prenda por parte del cuerpo' };
    slotsUsed.add(slot);
    garments.push({ sku, slot, name: product.name, category, imagePath: product.image });
  }
  return { garments };
}

/** Lee la imagen de la prenda desde uploads/ en base64 (null si no existe). */
function garmentImageBase64(imagePath: string | null): string | null {
  if (!imagePath) return null;
  const local = path.join(UPLOADS_ROOT, imagePath.replace(/^\/?uploads\//, ''));
  if (!fs.existsSync(local)) return null;
  return fs.readFileSync(local).toString('base64');
}

function hfHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}`, ...extra } : extra;
}

/** Sube un archivo al espacio y devuelve la ruta que usa el modelo. */
async function hfUpload(bytes: Buffer, name: string): Promise<string> {
  const form = new FormData();
  form.append('files', new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }), name);
  const res = await fetch(`${HF_SPACE}/gradio_api/upload`, { method: 'POST', headers: hfHeaders(), body: form });
  if (!res.ok) throw new Error(`La subida al servidor de IA falló (${res.status})`);
  const [filePath] = (await res.json()) as string[];
  return filePath;
}

/** Una pasada del modelo: persona + una prenda → imagen generada. */
async function hfTryOn(personPath: string, garmentPath: string): Promise<Buffer<ArrayBuffer>> {
  const call = await fetch(`${HF_SPACE}/gradio_api/call/generate`, {
    method: 'POST',
    headers: hfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      data: [
        { path: personPath, meta: { _type: 'gradio.FileData' } },
        { path: garmentPath, meta: { _type: 'gradio.FileData' } },
      ],
    }),
  });
  if (!call.ok) throw new Error(`El servidor de IA respondió ${call.status}`);
  const { event_id } = (await call.json()) as { event_id: string };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GPU_TIMEOUT_MS);
  try {
    const sse = await fetch(`${HF_SPACE}/gradio_api/call/generate/${event_id}`, {
      headers: hfHeaders(),
      signal: controller.signal,
    });
    const text = await sse.text();
    const match = text.match(/event: complete\ndata: (.*)/);
    if (!match) throw new Error('El servidor de IA no devolvió resultado (cuota agotada o error del modelo)');
    const [file] = JSON.parse(match[1]) as Array<{ url: string }>;
    const img = await fetch(file.url, { headers: hfHeaders() });
    if (!img.ok) throw new Error('No se pudo descargar la imagen generada');
    return Buffer.from(await img.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Genera el look: aplica cada prenda una por una sobre la foto del usuario.
 * El modelo cambia una prenda por pasada, así que con varias prendas se encadenan.
 */
async function callGpu(photoBase64: string, garments: Garment[]): Promise<Buffer<ArrayBuffer>> {
  if (!HF_TOKEN) throw new Error('Falta HF_TOKEN en el backend');
  let current = Buffer.from(photoBase64, 'base64');
  for (const garment of garments) {
    const garmentB64 = garmentImageBase64(garment.imagePath);
    if (!garmentB64) throw new Error(`Falta la imagen de la prenda "${garment.name}" en el servidor`);
    const personPath = await hfUpload(current, 'person.jpg');
    const garmentPath = await hfUpload(Buffer.from(garmentB64, 'base64'), 'garment.jpg');
    current = await hfTryOn(personPath, garmentPath);
  }
  return current;
}

async function runJob(jobId: string, photoBase64: string, garments: Garment[]) {
  await prisma.vistaJob.update({ where: { id: jobId }, data: { status: 'processing' } });
  try {
    const image = await callGpu(photoBase64, garments);
    fs.mkdirSync(GEN_DIR, { recursive: true });
    const fileName = `gen-${jobId}.webp`;
    fs.writeFileSync(path.join(GEN_DIR, fileName), image);
    await prisma.vistaJob.update({
      where: { id: jobId },
      data: { status: 'done', resultUrl: `/uploads/vista/${fileName}` },
    });
  } catch (err) {
    await prisma.vistaJob.update({
      where: { id: jobId },
      data: { status: 'failed', error: err instanceof Error ? err.message : 'Error desconocido' },
    });
  }
}

/** POST /vista/generate — crea el trabajo y responde al instante. */
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId?: string }).userId;
  const { photo, skus } = req.body as { photo?: unknown; skus?: unknown };

  if (typeof photo !== 'string' || photo.length < 100) {
    return res.status(400).json({ error: 'Envía la foto en base64' });
  }
  if (!Array.isArray(skus) || !skus.every((s) => typeof s === 'string')) {
    return res.status(400).json({ error: 'Las prendas deben ser una lista de SKUs' });
  }

  const resolved = await resolveGarments(skus as string[]);
  if ('error' in resolved) return res.status(400).json({ error: resolved.error });

  const job = await prisma.vistaJob.create({
    data: { userId: userId!, skus: skus as string[], status: 'pending' },
  });

  // Se procesa en segundo plano; la app consulta el estado con GET /vista/jobs/:id
  void runJob(job.id, photo.replace(/^data:image\/\w+;base64,/, ''), resolved.garments);

  res.status(202).json({ jobId: job.id, status: 'pending' });
});

/** GET /vista/jobs/:id — estado del trabajo (solo del propio usuario). */
router.get('/jobs/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId?: string }).userId;
  const job = await prisma.vistaJob.findUnique({ where: { id: req.params.id } });
  if (!job || job.userId !== userId) return res.status(404).json({ error: 'Trabajo no encontrado' });
  res.json({ jobId: job.id, status: job.status, resultUrl: job.resultUrl, error: job.error });
});

export default router;
