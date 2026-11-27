import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';
import { settleOrder } from './settlement';

/**
 * Pagos con Wompi.
 * - POST /payments/wompi/link/:orderNumber → URL de pago con firma de integridad.
 * - POST /payments/wompi/events → webhook de Wompi, validado con checksum.
 * Las claves vienen de variables de entorno; nunca se escriben en el código.
 */

const prisma = new PrismaClient();
const router = Router();

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY ?? '';
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET ?? '';
const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET ?? '';
const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';

const sha256 = (text: string) => crypto.createHash('sha256').update(text).digest('hex');

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Lee una ruta tipo "transaction.amount_in_cents" dentro de un objeto. */
function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((obj, key) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
    return undefined;
  }, source);
}

/** POST /payments/wompi/link/:orderNumber — URL de pago firmada para un pedido del usuario. */
router.post('/wompi/link/:orderNumber', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET) {
      return res.status(500).json({ error: 'La pasarela de pago no está configurada' });
    }
    const userId = (req as Request & { userId?: string }).userId;
    const order = await prisma.order.findUnique({ where: { orderNumber: req.params.orderNumber } });
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (order.status !== 'pendiente_pago') {
      return res.status(409).json({ error: 'Este pedido ya no está pendiente de pago' });
    }

    const amountCents = Math.round(order.total * 100);
    // Firma de integridad: SHA256(referencia + monto + moneda + secreto de integridad)
    const signature = sha256(`${order.orderNumber}${amountCents}COP${WOMPI_INTEGRITY_SECRET}`);
    const params = new URLSearchParams({
      'public-key': WOMPI_PUBLIC_KEY,
      currency: 'COP',
      'amount-in-cents': String(amountCents),
      reference: order.orderNumber,
      'signature:integrity': signature,
    });

    if (order.customerEmail) {
      params.set('customer-data:email', order.customerEmail);
    }
    if (order.customerDocNumber) {
      params.set('customer-data:legal-id', order.customerDocNumber);
    }
    if (order.customerDocType) {
      params.set('customer-data:legal-id-type', order.customerDocType);
    }
    if (order.phone) {
      const cleanPhone = order.phone.replace(/\D/g, '');
      if (cleanPhone) {
        params.set('customer-data:phone-number', cleanPhone);
        params.set('customer-data:phone-number-prefix', '+57');
      }
    }
    res.json({ url: `${WOMPI_CHECKOUT_URL}?${params.toString()}` });
  } catch (err) {
    console.error('[payments:wompi:link]', err);
    res.status(500).json({ error: 'No pudimos generar el enlace de pago' });
  }
});

/** POST /payments/wompi/events — webhook de Wompi (evento transaction.updated). */
router.post('/wompi/events', async (req: Request, res: Response) => {
  try {
    if (!WOMPI_EVENTS_SECRET) {
      return res.status(500).json({ error: 'Webhook no configurado' });
    }

    const event = req.body as {
      event?: unknown;
      data?: unknown;
      timestamp?: unknown;
      signature?: { properties?: unknown; checksum?: unknown };
    };
    const props = event.signature?.properties;
    const checksum = event.signature?.checksum;
    if (!Array.isArray(props) || typeof checksum !== 'string' || typeof event.timestamp !== 'number') {
      return res.status(400).json({ error: 'Evento inválido' });
    }

    // Checksum: valores de "signature.properties" + timestamp + secreto de eventos
    const values = props.map((p) => {
      const v = readPath(event.data, String(p));
      return v === undefined || v === null ? '' : String(v);
    });
    const expected = sha256(`${values.join('')}${event.timestamp}${WOMPI_EVENTS_SECRET}`);
    if (!safeEqual(expected, checksum.toLowerCase())) {
      console.warn('[payments:wompi] checksum inválido');
      return res.status(401).json({ error: 'Firma inválida' });
    }

    if (event.event !== 'transaction.updated') {
      return res.json({ ok: true, ignored: true });
    }

    const tx = (event.data as { transaction?: { id?: unknown; status?: unknown; reference?: unknown; amount_in_cents?: unknown } })
      ?.transaction;
    if (!tx || typeof tx.reference !== 'string') {
      return res.status(400).json({ error: 'Transacción inválida' });
    }
    if (tx.status === 'PENDING') {
      return res.json({ ok: true, pending: true });
    }

    const result = await settleOrder(
      tx.reference,
      tx.status === 'APPROVED',
      typeof tx.id === 'string' ? tx.id : null,
      typeof tx.amount_in_cents === 'number' ? tx.amount_in_cents : undefined,
    );
    res.status(result.httpStatus).json(result.body);
  } catch (err) {
    console.error('[payments:wompi:events]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY ?? '';
const WOMPI_API = (process.env.WOMPI_BASE_URL ?? 'https://sandbox.wompi.co/v1').replace(/\/$/, '');

type WompiTx = { id: string; status: string; amount_in_cents: number };

/**
 * POST /payments/wompi/card — cobra el pedido con un token de tarjeta creado en la app.
 * La tarjeta nunca llega a este servidor: la app la envía directo a Wompi y aquí solo llega el token.
 */
router.post('/wompi/card', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!WOMPI_PUBLIC_KEY || !WOMPI_PRIVATE_KEY || !WOMPI_INTEGRITY_SECRET) {
      return res.status(500).json({ error: 'La pasarela de pago no está configurada' });
    }
    const userId = (req as Request & { userId?: string }).userId;
    const { orderNumber, cardToken } = req.body as { orderNumber?: unknown; cardToken?: unknown };
    if (typeof orderNumber !== 'string' || typeof cardToken !== 'string' || !cardToken) {
      return res.status(400).json({ error: 'Faltan datos del pago' });
    }

    const order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order || order.userId !== userId) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (order.status !== 'pendiente_pago') {
      return res.status(409).json({ error: 'Este pedido ya no está pendiente de pago' });
    }

    // Token de aceptación: de un solo uso, así que se pide para cada pago
    const merchantRes = await fetch(`${WOMPI_API}/merchants/info`, {
      headers: { 'X-Merchant-Public-Key': WOMPI_PUBLIC_KEY },
    });
    const merchant = (await merchantRes.json()) as { data?: { presigned_acceptance?: { acceptance_token?: string } } };
    const acceptanceToken = merchant.data?.presigned_acceptance?.acceptance_token;
    if (!merchantRes.ok || !acceptanceToken) {
      return res.status(502).json({ error: 'No pudimos preparar el pago con la pasarela' });
    }

    const amountCents = Math.round(order.total * 100);
    const txRes = await fetch(`${WOMPI_API}/transactions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_in_cents: amountCents,
        currency: 'COP',
        customer_email: order.customerEmail,
        reference: order.orderNumber,
        signature: sha256(`${order.orderNumber}${amountCents}COP${WOMPI_INTEGRITY_SECRET}`),
        acceptance_token: acceptanceToken,
        payment_method: { type: 'CARD', token: cardToken, installments: 1 },
      }),
    });
    const txBody = (await txRes.json()) as { data?: WompiTx; error?: { reason?: string } };
    if (!txRes.ok || !txBody.data) {
      return res.status(400).json({ error: txBody.error?.reason ?? 'La pasarela rechazó la tarjeta' });
    }

    // La transacción nace en PENDING: se consulta hasta que tenga resultado (máx. ~30 s)
    let tx: WompiTx = txBody.data;
    for (let i = 0; i < 15 && tx.status === 'PENDING'; i += 1) {
      await new Promise((r) => setTimeout(r, 2000));
      const st = await fetch(`${WOMPI_API}/transactions/${tx.id}`, {
        headers: { Authorization: `Bearer ${WOMPI_PRIVATE_KEY}` },
      });
      tx = ((await st.json()) as { data: WompiTx }).data;
    }

    if (tx.status === 'PENDING') {
      return res.json({ status: 'PENDING', message: 'Estamos confirmando tu pago. Te avisaremos por correo.' });
    }

    const result = await settleOrder(order.orderNumber, tx.status === 'APPROVED', tx.id, tx.amount_in_cents);
    res.status(result.httpStatus).json({ ...result.body, transactionStatus: tx.status });
  } catch (err) {
    console.error('[payments:wompi:card]', err);
    res.status(500).json({ error: 'No pudimos procesar el pago. Intenta de nuevo.' });
  }
});

export default router;
