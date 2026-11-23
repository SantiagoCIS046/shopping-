import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESERVATION_MINUTES = Number(process.env.RESERVATION_MINUTES) || 15;

/**
 * Libera las reservas de inventario de las órdenes cuyo pago nunca
 * llegó (pendiente_pago por más de RESERVATION_MINUTES) y las pasa
 * a cancelado. Devuelve cuántas órdenes expiraron.
 */
export async function sweepExpiredOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - RESERVATION_MINUTES * 60 * 1000);

  const expired = await prisma.order.findMany({
    where: { status: 'pendiente_pago', createdAt: { lt: cutoff } },
    include: { items: true },
    take: 50,
  });

  for (const order of expired) {
    try {
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
      console.log(`[reservas] Orden ${order.orderNumber} expirada; inventario liberado`);
    } catch (err) {
      console.error(`[reservas] Error liberando ${order.orderNumber}`, err);
    }
  }

  return expired.length;
}

/** Barrido automático cada 60 segundos mientras el backend esté encendido. */
export function startReservationSweeper(): void {
  console.log(`Reservas de inventario: liberación automática a los ${RESERVATION_MINUTES} min`);
  setInterval(() => {
    sweepExpiredOrders().catch((err) => console.error('[reservas]', err));
  }, 60_000);
}
