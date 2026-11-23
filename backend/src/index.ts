import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './auth';
import ordersRouter from './orders';
import webhooksRouter from './webhooks';
import adminRouter from './admin';
import catalogRouter from './catalog';
import vistaRouter from './vista';
import { startReservationSweeper } from './reservations';

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
// rawBody: necesario para validar la firma HMAC del webhook de pagos.
// limit 8mb: permite guardar la imagen del look del probador Vista.
app.use(
  express.json({
    limit: '8mb',
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Autenticación: register, login, me, forgot-password, reset-password
app.use('/auth', authRouter);

// Pedidos: crear y listar
app.use('/orders', ordersRouter);

// Webhooks de la pasarela de pago (confirmación silenciosa)
app.use('/webhooks', webhooksRouter);

// Panel administrativo (solo correos en ADMIN_EMAILS)
app.use('/admin', adminRouter);

// Catálogo dinámico (categorías, filtros y orden)
app.use('/catalog', catalogRouter);

// Probador Vista: sesiones, guardado de looks y estadísticas
app.use('/vista', vistaRouter);

// Imágenes guardadas (looks del probador)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/products', async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { variants: true },
  });
  res.json(products);
});

// Escucha en todas las interfaces para que el celular en la misma red pueda conectarse.
app.listen(port, '0.0.0.0', () => {
  console.log(`API lista en http://localhost:${port}`);
  startReservationSweeper();
});

// reload: catalogo y webhooks

// reload: admin emails
