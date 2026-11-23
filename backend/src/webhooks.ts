import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendMail } from './mailer';

const prisma = new PrismaClient();
const router = Router();

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || '';

/**
 * POST /webhooks/payment
 *
 * Confirmación silenciosa de la pasarela de pago (Wompi, ePayco…).
 * Seguridad: firma HMAC-SHA256 del cuerpo crudo en el header "x-signature".
 * Idempotencia: si la orden ya está pagada, se responde 200 sin repetir efectos.
 */
router.post('/payment', async (req: Request, res: Response) => {
  try {
    // 1) Validación de firma criptográfica
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

    // 2) Cuerpo del evento
    const { orderNumber, status, paymentReference } = req.body as {
      orderNumber?: unknown;
      status?: unknown;
      paymentReference?: unknown;
    };

    if (typeof orderNumber !== 'string') {
      res.status(400).json({ error: 'Falta orderNumber' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Orden no encontrada' });
      return;
    }

    // 3) Idempotencia: la pasarela puede reenviar el mismo evento
    if (order.status !== 'pendiente_pago') {
      res.json({ ok: true, alreadyProcessed: true, status: order.status });
      return;
    }

    // 4) Efectos del resultado
    if (status === 'APPROVED') {
      // Confirma la reserva: baja el stock físico y libera la reserva
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const updated = await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "stock" = "stock" - ${item.quantity},
                "reserved" = "reserved" - ${item.quantity}
            WHERE "sku" = ${item.productId}
              AND "reserved" >= ${item.quantity}`;
          if (updated === 0) {
            throw new Error(`stock_insuficiente:${item.productId}`);
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'pagado',
            paymentReference:
              typeof paymentReference === 'string' && paymentReference ? paymentReference : null,
          },
        });
      });

      const paid = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: true },
      });

      // 5) Correo transaccional con la factura
      const itemsHtml = paid.items
        .map(
          (i) =>
            `<tr><td style="padding:6px 0;color:#E8ECF4;">${i.name ?? i.productId} · Talla ${i.size} × ${i.quantity}</td><td style="padding:6px 0;color:#E8ECF4;text-align:right;">$${(i.unitPrice * i.quantity).toLocaleString('es-CO')}</td></tr>`,
        )
        .join('');

      const html = `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #050A16; color: #E8ECF4; border-radius: 16px;">
          <h2 style="color: #6D9DF3; letter-spacing: 2px; margin: 0 0 16px;">Shopping</h2>
          <p>¡Pago confirmado! Tu pedido <strong>#${paid.orderNumber}</strong> quedó en estado <strong>PAGADO</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:18px 0;">
            ${itemsHtml}
            <tr><td colspan="2" style="border-top:1px solid rgba(255,255,255,0.15);"></td></tr>
            <tr><td style="padding-top:8px;color:#9ECEFF;font-weight:600;">Total pagado</td><td style="padding-top:8px;color:#9ECEFF;font-weight:600;text-align:right;">$${paid.total.toLocaleString('es-CO')}</td></tr>
          </table>
          <p style="font-size:13px;color:rgba(214,222,234,0.65);">Tiempo estimado de entrega: 3 a 5 días hábiles. Te avisaremos cuando tu pedido salga del local.</p>
        </div>
      `;

      try {
        await sendMail({
          to: paid.customerEmail ?? 'cliente@shopping.app',
          subject: `Pago confirmado · Pedido #${paid.orderNumber}`,
          html,
        });
      } catch (mailErr) {
        console.error('[webhook:payment:mailer]', mailErr);
      }

      res.json({ ok: true, status: 'pagado' });
      return;
    }

    // Pago declinado o fallido → orden cancelada y reserva liberada
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.$executeRaw`
          UPDATE "ProductVariant"
          SET "reserved" = GREATEST("reserved" - ${item.quantity}, 0)
          WHERE "sku" = ${item.productId}`;
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'cancelado' },
      });
    });
    res.json({ ok: true, status: 'cancelado' });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('stock_insuficiente')) {
      res.status(409).json({ error: 'Stock insuficiente al confirmar el pago' });
      return;
    }
    console.error('[webhook:payment]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
