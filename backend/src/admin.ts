import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';
import { isAdminEmail } from './adminAccess';
import { sweepExpiredOrders } from './reservations';
import { sendMail } from './mailer';

const prisma = new PrismaClient();
const router = Router();

/** Middleware: exige sesión Y correo administrador (ADMIN_EMAILS). */
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as Request & { userId?: string }).userId;
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  if (!user || !isAdminEmail(user.email)) {
    res.status(403).json({ error: 'Solo el administrador puede entrar aquí' });
    return;
  }
  next();
}

router.use(requireAuth, requireAdmin);

/**
 * GET /admin/orders?status=pagado — pedidos de toda la tienda,
 * filtrables por estado (pagado = para empacar hoy).
 */
router.get('/orders', async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' && req.query.status ? req.query.status : undefined;
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
    take: 100,
  });
  res.json({ orders });
});

/**
 * PATCH /admin/orders/:orderNumber/ship
 * Marca el pedido como enviado con transportadora y número de guía,
 * y dispara el correo de rastreo al cliente.
 */
router.patch('/orders/:orderNumber/ship', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { carrier, trackingNumber } = req.body as { carrier?: unknown; trackingNumber?: unknown };

    if (typeof carrier !== 'string' || carrier.trim().length < 2) {
      return res.status(400).json({ error: 'Escribe la transportadora' });
    }
    if (typeof trackingNumber !== 'string' || trackingNumber.trim().length < 4) {
      return res.status(400).json({ error: 'Escribe el número de guía' });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (order.status !== 'pagado' && order.status !== 'enviado') {
      return res.status(409).json({ error: 'Solo se pueden enviar pedidos pagados' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'enviado',
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
      },
    });

    // Correo con la guía de rastreo
    const itemsHtml = order.items
      .map(
        (i) =>
          `<li style="color:#E8ECF4;">${i.name ?? i.productId} · Talla ${i.size} × ${i.quantity}</li>`,
      )
      .join('');

    const html = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #050A16; color: #E8ECF4; border-radius: 16px;">
        <h2 style="color: #6D9DF3; letter-spacing: 2px; margin: 0 0 16px;">Shopping</h2>
        <p>¡Buenas noticias! Tu pedido <strong>#${order.orderNumber}</strong> salió del local.</p>
        <p>
          <strong style="color:#9ECEFF;">Transportadora:</strong> ${carrier.trim()}<br/>
          <strong style="color:#9ECEFF;">Número de guía:</strong> ${trackingNumber.trim()}
        </p>
        <ul style="padding-left:18px;margin:14px 0;">${itemsHtml}</ul>
        <p style="font-size:13px;color:rgba(214,222,234,0.65);">Con tu guía puedes rastrear el pedido en la página o app de la transportadora. Entrega estimada: 2 a 4 días hábiles.</p>
      </div>
    `;

    try {
      await sendMail({
        to: order.customerEmail ?? 'cliente@shopping.app',
        subject: `Tu pedido #${order.orderNumber} va en camino · ${carrier.trim()}`,
        html,
      });
    } catch (mailErr) {
      console.error('[admin:ship:mailer]', mailErr);
    }

    res.json({ order: updated });
  } catch (err) {
    console.error('[admin:ship]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /admin/sweeper/run — ejecuta el barrido de reservas vencidas
 * (también corre solo cada minuto; este endpoint es para pruebas).
 */
router.post('/sweeper/run', async (_req: Request, res: Response) => {
  const cancelled = await sweepExpiredOrders();
  res.json({ ok: true, cancelled });
});

export default router;
