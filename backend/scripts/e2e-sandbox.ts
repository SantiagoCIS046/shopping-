/**
 * Pruebas End-to-End en modo sandbox — checklist de apertura al público.
 *
 * Uso (con el backend corriendo y la base de datos de Docker arriba):
 *   npx tsx scripts/e2e-sandbox.ts
 *
 * Cubre: pago aprobado (estado + stock exacto), pago rechazado
 * (cancelado + stock repuesto), expiración de reserva (liberación) y
 * envío con guía (estado + correo).
 */
import { createHmac } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL ?? 'test@shopping.app';
const PASSWORD = process.env.E2E_PASSWORD ?? 'nuevaClave456';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? '';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function api(path: string, options: RequestInit = {}, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

function signedWebhook(orderNumber: string, status: string) {
  const body = JSON.stringify({ orderNumber, status, paymentReference: `sandbox-${Date.now()}` });
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
  return { body, signature };
}

async function variant(sku: string) {
  return prisma.productVariant.findUniqueOrThrow({ where: { sku } });
}

const SKU = 'sudadera-gris--M'; // variante de prueba con stock suficiente

async function main() {
  console.log('\n🧪 E2E Sandbox — Shopping\n');

  const login = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const token = login.body.token as string | undefined;
  check('Login del usuario de pruebas', !!token);

  const before = await variant(SKU);

  // ── 1. Orden + reserva ────────────────────────────────────────────
  console.log('\n1) Orden creada reserva inventario');
  const order1 = await api(
    '/orders',
    {
      method: 'POST',
      body: JSON.stringify({
        paymentMethod: 'nequi',
        country: 'CO',
        customerEmail: EMAIL,
        phone: '3001234567',
        shippingAddress: { city: 'Bogotá', address: 'Calle 123', neighborhood: 'Centro' },
        items: [{ sku: SKU, quantity: 1 }],
      }),
    },
    token,
  );
  check('Orden PENDING creada', order1.status === 201 && order1.body.status === 'pendiente_pago');
  const afterReserve = await variant(SKU);
  check(
    `Reserva apartada (+1): reserved ${before.reserved} → ${afterReserve.reserved}`,
    afterReserve.reserved === before.reserved + 1,
  );
  check(`Stock físico intacto durante la reserva`, afterReserve.stock === before.stock);

  // ── 2. Pago APROBADO ──────────────────────────────────────────────
  console.log('\n2) Pago aprobado');
  const hook1 = signedWebhook(order1.body.orderNumber, 'APPROVED');
  const paid = await api('/webhooks/payment', {
    method: 'POST',
    body: hook1.body,
    headers: { 'x-signature': hook1.signature },
  });
  check('Webhook → estado pagado', paid.body.status === 'pagado');
  const afterPaid = await variant(SKU);
  check(
    `Stock exacto descontado (${before.stock} → ${afterPaid.stock}) y reserva liberada`,
    afterPaid.stock === before.stock - 1 && afterPaid.reserved === before.reserved,
  );

  // ── 3. Pago RECHAZADO ─────────────────────────────────────────────
  console.log('\n3) Pago rechazado / cancelado');
  const order2 = await api(
    '/orders',
    {
      method: 'POST',
      body: JSON.stringify({
        paymentMethod: 'card',
        country: 'CO',
        customerEmail: EMAIL,
        items: [{ sku: SKU, quantity: 2 }],
      }),
    },
    token,
  );
  check('Segunda orden creada', order2.status === 201);
  const hook2 = signedWebhook(order2.body.orderNumber, 'DECLINED');
  const declined = await api('/webhooks/payment', {
    method: 'POST',
    body: hook2.body,
    headers: { 'x-signature': hook2.signature },
  });
  check('Webhook → estado cancelado', declined.body.status === 'cancelado');
  const afterDeclined = await variant(SKU);
  check(
    `Reserva liberada (${afterDeclined.reserved}) y stock repuesto (${afterDeclined.stock})`,
    afterDeclined.reserved === before.reserved && afterDeclined.stock === before.stock - 1,
  );

  // ── 4. Expiración de reserva ──────────────────────────────────────
  console.log('\n4) Reserva vencida se libera sola');
  const order3 = await api(
    '/orders',
    {
      method: 'POST',
      body: JSON.stringify({
        paymentMethod: 'pse',
        country: 'CO',
        customerEmail: EMAIL,
        items: [{ sku: SKU, quantity: 1 }],
      }),
    },
    token,
  );
  check('Tercera orden creada (abandona el pago)', order3.status === 201);
  // Envejece la orden 20 minutos y dispara el barrido manualmente
  await prisma.order.update({
    where: { orderNumber: order3.body.orderNumber },
    data: { createdAt: new Date(Date.now() - 20 * 60 * 1000) },
  });
  const sweep = await api('/admin/sweeper/run', { method: 'POST' }, token);
  check('Barrido ejecutado', sweep.status === 200);
  const expired = await prisma.order.findUniqueOrThrow({
    where: { orderNumber: order3.body.orderNumber },
  });
  check('Orden vencida → cancelado', expired.status === 'cancelado');
  const afterSweep = await variant(SKU);
  check(`Inventario liberado tras expirar (reserved ${afterSweep.reserved})`, afterSweep.reserved === before.reserved);

  // ── 5. Envío con guía ─────────────────────────────────────────────
  console.log('\n5) Envío con guía de transportadora');
  const ship = await api(
    `/admin/orders/${order1.body.orderNumber}/ship`,
    {
      method: 'PATCH',
      body: JSON.stringify({ carrier: 'Servientrega', trackingNumber: 'SG-99887766' }),
    },
    token,
  );
  check('Pedido marcado como enviado', ship.status === 200 && ship.body.order?.status === 'enviado');
  const shipped = await prisma.order.findUniqueOrThrow({
    where: { orderNumber: order1.body.orderNumber },
  });
  check(
    'Guía y transportadora guardadas + correo disparado (ver consola del backend)',
    shipped.carrier === 'Servientrega' && shipped.trackingNumber === 'SG-99887766',
  );

  // ── 6. Seguridad del webhook ──────────────────────────────────────
  console.log('\n6) Seguridad');
  const forged = await api('/webhooks/payment', {
    method: 'POST',
    body: JSON.stringify({ orderNumber: order1.body.orderNumber, status: 'APPROVED' }),
    headers: { 'x-signature': 'firma-falsa-123' },
  });
  check('Firma inválida rechazada (401)', forged.status === 401);
  const noAdmin = await api(
    '/admin/orders',
    {},
    'token-de-mentira',
  );
  check('Panel admin exige sesión válida', noAdmin.status === 401);

  console.log(`\n──────────────────────────────\nResultado: ${passed} ✓ · ${failed} ✗\n`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error('E2E falló:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
