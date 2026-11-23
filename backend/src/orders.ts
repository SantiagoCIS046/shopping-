import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
const router = Router();

const PAYMENT_METHODS = new Set(['transfer', 'pse', 'nequi', 'card']);

// Impuestos nacionales por país — misma tabla que mobile/src/shop/pricing.ts
const COUNTRY_TAXES: Record<string, { name: string; rate: number }> = {
  CO: { name: 'IVA', rate: 0.19 },
  MX: { name: 'IVA', rate: 0.16 },
  AR: { name: 'IVA', rate: 0.21 },
  CL: { name: 'IVA', rate: 0.19 },
  PE: { name: 'IGV', rate: 0.18 },
  EC: { name: 'IVA', rate: 0.15 },
  ES: { name: 'IVA', rate: 0.21 },
  US: { name: 'Sales Tax', rate: 0.07 },
};

const SHIPPING_COST = 15000;
const FREE_SHIPPING_FROM = 300000;

type ItemInput = { sku?: unknown; quantity?: unknown };

async function nextOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  // ORD-1001, ORD-1002… con reintento si choca con una orden previa
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const candidate = `ORD-${1000 + count + attempt}`;
    const exists = await prisma.order.findUnique({ where: { orderNumber: candidate } });
    if (!exists) return candidate;
  }
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * POST /orders
 *
 * Crea el pedido en estado PENDIENTE validando stock real por variante.
 * Los precios salen de la base de datos (nunca del cliente) y los ítems
 * quedan como snapshot para que el historial no cambie con precios nuevos.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    const buyer = await prisma.user.findUnique({ where: { id: userId } });

    const { items, paymentMethod, country, customerEmail, phone, shippingAddress } = req.body as {
      items?: ItemInput[];
      paymentMethod?: unknown;
      country?: unknown;
      customerEmail?: unknown;
      phone?: unknown;
      shippingAddress?: unknown;
    };

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ error: 'El carrito está vacío o es demasiado grande' });
    }
    if (typeof paymentMethod !== 'string' || !PAYMENT_METHODS.has(paymentMethod)) {
      return res.status(400).json({ error: 'Método de pago inválido' });
    }

    const email =
      typeof customerEmail === 'string' && customerEmail.trim() ? customerEmail.trim().toLowerCase() : buyer?.email;
    if (!email) {
      return res.status(400).json({ error: 'Necesitamos un correo para notificarte el pedido' });
    }

    const countryCode = typeof country === 'string' && COUNTRY_TAXES[country] ? country : 'CO';
    const tax = COUNTRY_TAXES[countryCode];

    // Resuelve variantes por SKU: precio y stock salen del servidor
    const skus = items.map((i) => (typeof i.sku === 'string' ? i.sku : ''));
    if (skus.some((s) => !s)) {
      return res.status(400).json({ error: 'Uno de los productos no es válido' });
    }
    const variants = await prisma.productVariant.findMany({ where: { sku: { in: skus } }, include: { product: true } });
    const bySku = new Map(variants.map((v) => [v.sku, v]));

    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      name: string;
      size: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const item of items) {
      const sku = item.sku as string;
      const quantity = Number(item.quantity);
      const variant = bySku.get(sku);

      if (!variant || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({ error: 'Uno de los productos del carrito no es válido' });
      }
      if (variant.stock < quantity) {
        return res.status(409).json({
          error: `Solo quedan ${variant.stock} unidades de ${variant.product.name} (talla ${variant.size})`,
        });
      }

      subtotal += variant.price * quantity;
      orderItems.push({
        productId: variant.sku,
        name: variant.product.name, // snapshot
        size: variant.size,
        quantity,
        unitPrice: variant.price, // precio del servidor
      });
    }

    const taxAmount = Math.round(subtotal * tax.rate);
    const shippingCost = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
    const total = subtotal + taxAmount + shippingCost;

    try {
      const order = await prisma.$transaction(async (tx) => {
        // Reserva atómica: bloquea las unidades mientras el cliente paga
        for (const item of orderItems) {
          const reservedRows = await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "reserved" = "reserved" + ${item.quantity}
            WHERE "sku" = ${item.productId}
              AND ("stock" - "reserved") >= ${item.quantity}`;
          if (reservedRows === 0) {
            throw new Error(`reserva_fallida:${item.productId}`);
          }
        }

        return tx.order.create({
          data: {
            orderNumber: await nextOrderNumber(),
            paymentMethod,
            customerEmail: email,
            phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
            shippingAddress:
              shippingAddress && typeof shippingAddress === 'object' ? shippingAddress : undefined,
            subtotal,
            shippingCost,
            taxName: `${tax.name} (${Math.round(tax.rate * 100)}%)`,
            taxAmount,
            total,
            userId: userId ?? null,
            items: { create: orderItems },
          },
          include: { items: true },
        });
      });

      res.status(201).json({
        id: order.id,
        orderNumber: order.orderNumber,
        subtotal,
        taxName: order.taxName,
        taxAmount,
        shipping: shippingCost,
        total: order.total,
        status: order.status,
      });
    } catch (txErr) {
      if (txErr instanceof Error && txErr.message.startsWith('reserva_fallida')) {
        const sku = txErr.message.split(':')[1];
        const variant = bySku.get(sku);
        const available = variant ? variant.stock - variant.reserved : 0;
        return res.status(409).json({
          error: `Quedan ${Math.max(0, available)} unidades disponibles de ${variant?.product.name ?? 'el producto'} (talla ${variant?.size ?? '?'})`,
        });
      }
      throw txErr;
    }
  } catch (err) {
    console.error('[orders:create]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** GET /orders — historial de pedidos del usuario */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId?: string }).userId;
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
  res.json({ orders });
});

export default router;
