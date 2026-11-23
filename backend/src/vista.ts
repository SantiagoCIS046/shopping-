import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';
import { isAdminEmail } from './adminAccess';

const prisma = new PrismaClient();
const router = Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'vista');

export type VistaGarment = {
  sku: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
  size: string;
};

/**
 * POST /vista/tryons — Paso 1 y 4 del flujo: registra la sesión del
 * probador con las prendas del carrito y devuelve sus datos enriquecidos
 * desde la base de datos (nombre, precio, imagen, categoría).
 */
router.post('/tryons', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    const { skus } = req.body as { skus?: unknown };

    if (!Array.isArray(skus) || skus.length === 0 || skus.length > 50) {
      return res.status(400).json({ error: 'Envía las prendas de tu carrito a probar' });
    }
    const cleanSkus = skus.filter((s): s is string => typeof s === 'string' && s.length > 0);
    if (cleanSkus.length === 0) {
      return res.status(400).json({ error: 'Las prendas del carrito no son válidas' });
    }

    // Enriquece contra la base de datos: solo prendas que existen
    const variants = await prisma.productVariant.findMany({
      where: { sku: { in: cleanSkus } },
      include: { product: { include: { categoryRef: true } } },
    });
    if (variants.length === 0) {
      return res.status(404).json({ error: 'No encontramos esas prendas en el catálogo' });
    }

    const garments: VistaGarment[] = variants.map((v) => ({
      sku: v.sku,
      name: v.product.name,
      price: v.price,
      image: v.product.image,
      category: v.product.categoryRef?.slug ?? v.product.category,
      size: v.size,
    }));

    const session = await prisma.tryOn.create({
      data: { userId, skus: garments.map((g) => g.sku) },
    });

    res.status(201).json({ id: session.id, garments });
  } catch (err) {
    console.error('[vista:session]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /vista/tryons/:id/result — Paso 6: guarda la imagen compuesta
 * del look únicamente si el usuario decide guardarlo.
 * Body: { imageBase64 } (JPEG sin el prefijo data:)
 */
router.post('/tryons/:id/result', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    const { id } = req.params;
    const { imageBase64 } = req.body as { imageBase64?: unknown };

    const session = await prisma.tryOn.findUnique({ where: { id } });
    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Sesión de prueba no encontrada' });
    }
    if (typeof imageBase64 !== 'string' || imageBase64.length < 100) {
      return res.status(400).json({ error: 'La imagen del look no es válida' });
    }
    if (imageBase64.length > 8_000_000) {
      return res.status(413).json({ error: 'La imagen es demasiado grande' });
    }

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const fileName = `${id}.jpg`;
    await fs.promises.writeFile(
      path.join(UPLOADS_DIR, fileName),
      Buffer.from(imageBase64, 'base64'),
    );

    const updated = await prisma.tryOn.update({
      where: { id },
      data: { imageUrl: `/uploads/vista/${fileName}` },
    });

    res.status(201).json({ id: updated.id, imageUrl: updated.imageUrl, createdAt: updated.createdAt });
  } catch (err) {
    console.error('[vista:result]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** GET /vista/tryons — looks guardados del usuario (historial) */
router.get('/tryons', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId?: string }).userId;
  const looks = await prisma.tryOn.findMany({
    where: { userId, imageUrl: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({ looks });
});

/** GET /vista/stats — (admin) prendas más probadas del local */
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId?: string }).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!isAdminEmail(user?.email)) {
    res.status(403).json({ error: 'Solo el administrador puede ver estas estadísticas' });
    return;
  }

  const sessions = await prisma.tryOn.findMany({ select: { skus: true } });
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const sku of s.skus) {
      counts.set(sku, (counts.get(sku) ?? 0) + 1);
    }
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sku, tries]) => ({ sku, tries }));

  const variants = await prisma.productVariant.findMany({
    where: { sku: { in: top.map((t) => t.sku) } },
    include: { product: true },
  });
  const bySku = new Map(variants.map((v) => [v.sku, v]));

  res.json({
    totalSessions: sessions.length,
    top: top.map((t) => ({
      sku: t.sku,
      tries: t.tries,
      name: bySku.get(t.sku)?.product.name ?? t.sku,
    })),
  });
});

export default router;
