import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { settleOrder } from './settlement';

const router = Router();

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || '';

/**
 * POST /webhooks/payment
 *
 * Confirmación genérica de una pasarela de pago.
 * Seguridad: firma HMAC-SHA256 del cuerpo crudo en el header "x-signature".
 * La lógica del pedido vive en settlement.ts (idempotente).
 */
router.post('/payment', async (req: Request, res: Response) => {
  try {
    if (!WEBHOOK_SECRET) {
      console.error('[webhook:payment] PAYMENT_WEBHOOK_SECRET no configurado');
      res.status(500).json({ error: 'Webhook no configurado' });
      return;
    }

    const signature = req.header('x-signature') ?? '';
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw) {
      res.status(400).json({ error: 'Cuerpo inválido' });
      return;
    }

    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
    const signatureClean = signature.replace(/^sha256=/, '').toLowerCase();
    const valid =
      signatureClean.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signatureClean, 'hex'), Buffer.from(expected, 'hex'));

    if (!valid) {
      console.warn('[webhook:payment] firma inválida');
      res.status(401).json({ error: 'Firma inválida' });
      return;
    }

    const { orderNumber, status, paymentReference } = req.body as {
      orderNumber?: unknown;
      status?: unknown;
      paymentReference?: unknown;
    };
    if (typeof orderNumber !== 'string') {
      res.status(400).json({ error: 'Falta orderNumber' });
      return;
    }

    const result = await settleOrder(
      orderNumber,
      status === 'APPROVED',
      typeof paymentReference === 'string' && paymentReference ? paymentReference : null,
    );
    res.status(result.httpStatus).json(result.body);
  } catch (err) {
    console.error('[webhook:payment]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
