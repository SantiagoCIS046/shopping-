import { PrismaClient } from '@prisma/client';
import { sendMail } from './mailer';
import { issueInvoice } from './invoices';

const prisma = new PrismaClient();

export type SettleOutcome = { httpStatus: number; body: Record<string, unknown> };

/**
 * Aplica el resultado de un pago a un pedido. Lo usan los webhooks de la pasarela.
 * - Idempotente: si el pedido ya no está pendiente de pago, no repite efectos.
 * - Si el pago es aprobado: confirma el stock, envía el correo y emite la factura.
 * - Si no es aprobado: cancela el pedido y libera la reserva.
 */
export async function settleOrder(
  orderNumber: string,
  approved: boolean,
  paymentReference: string | null,
  amountCents?: number,
): Promise<SettleOutcome> {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) return { httpStatus: 404, body: { error: 'Orden no encontrada' } };

  if (order.status !== 'pendiente_pago') {
    return { httpStatus: 200, body: { ok: true, alreadyProcessed: true, status: order.status } };
  }

  if (!approved) {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.$executeRaw`
          UPDATE "ProductVariant"
          SET "reserved" = GREATEST("reserved" - ${item.quantity}, 0)
          WHERE "sku" = ${item.productId}`;
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'cancelado' } });
    });
    return { httpStatus: 200, body: { ok: true, status: 'cancelado' } };
  }

  // Seguridad: el monto cobrado debe ser exactamente el del pedido
  if (amountCents !== undefined && amountCents !== Math.round(order.total * 100)) {
    return { httpStatus: 400, body: { error: 'El monto no coincide con el pedido' } };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Confirma la reserva: baja el stock físico y libera la reserva
      for (const item of order.items) {
        const updated = await tx.$executeRaw`
          UPDATE "ProductVariant"
          SET "stock" = "stock" - ${item.quantity},
              "reserved" = "reserved" - ${item.quantity}
          WHERE "sku" = ${item.productId}
            AND "reserved" >= ${item.quantity}`;
        if (updated === 0) throw new Error(`stock_insuficiente:${item.productId}`);
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'pagado', paymentReference },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('stock_insuficiente')) {
      return { httpStatus: 409, body: { error: 'Stock insuficiente al confirmar el pago' } };
    }
    throw err;
  }

  const paid = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { items: true, user: true },
  });

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
    console.error('[settle:mailer]', mailErr);
  }

  // La factura no bloquea la confirmación del pago: si falla, queda registrada con error
  void issueInvoice(paid).catch((err) => console.error('[settle:invoice]', err));

  return { httpStatus: 200, body: { ok: true, status: 'pagado' } };
}
