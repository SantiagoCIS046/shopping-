# Shopping — Tienda de ropa móvil (Expo + Express + PostgreSQL)

App móvil de e-commerce para promocionar y vender las prendas de un local de ropa:
catálogo por categorías, reel tipo TikTok, probador "Vista" sobre tu foto,
carrito persistente, checkout con impuestos, pagos con webhook, panel administrativo
y políticas legales (Colombia).

## Arquitectura

| Capa | Tecnología | Ubicación |
|---|---|---|
| App móvil | Expo SDK 58 · React Native 0.88 · TypeScript | `mobile/` |
| API | Express 4 · TypeScript · tsx watch | `backend/src/` |
| Base de datos | PostgreSQL 16 (Docker) + Prisma ORM | `docker-compose.yml` · `backend/prisma/` |

## Puesta en marcha

```bash
# 1) Base de datos (puerto 5433 — el 5432 suele estar ocupado por un PostgreSQL local)
docker compose up -d

# 2) Backend
cd backend
npm install
npx prisma migrate deploy      # aplica todas las migraciones
npx tsx prisma/seed.ts         # sembró: 36 productos · 117 variantes con stock
npm run dev                    # API en http://localhost:3000

# 3) Móvil (en otra terminal)
cd mobile
npm install
# → revisa src/config.ts: API_URL debe apuntar a la IP LAN de la máquina del backend
npx expo start
```

**Usuario de pruebas (admin):** `test@shopping.app` / `nuevaClave456`

## Variables de entorno (`backend/.env`)

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Postgres (host `5433`) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Access token (30 min por seguridad) |
| `REFRESH_TTL_DAYS` | Refresh token rotativo (30 días) |
| `APP_RESET_URL` | Link del correo de recuperar contraseña (deep link) |
| `SMTP_*` / `EMAIL_FROM` | Correos transaccionales (sin SMTP se imprimen en consola) |
| `PAYMENT_WEBHOOK_SECRET` | Firma HMAC-SHA256 del webhook de la pasarela |
| `ADMIN_EMAILS` | Correos con acceso al panel administrativo |
| `RESERVATION_MINUTES` | Minutos de reserva de inventario (15) |

Móvil (`mobile/src/config.ts`): `API_URL` (IP LAN del backend) y `COUNTRY_CODE`
(impuesto nacional: CO 19%, MX 16%, AR 21%, PE 18%, CL 19%, EC 15%, ES 21%, US ~7%).

## Flujos implementados

**Autenticación** — registro/login con validación 8–64 caracteres, mensajes genéricos,
rate limiting (5 intentos → 10 min de bloqueo), bcrypt(12), access token 30 min +
refresh token rotativo con detección de reuso, recuperación por correo con deep link,
login único (sesión en el llavero del dispositivo). HTTPS obligatorio fuera de desarrollo.

**Tienda** — intro con scroll que desvanece hacia el login; nav inferior glass
(Tienda · Vista · Carrito · Perfil); dashboard con carruseles por categoría;
ficha con tallas y probador Vista (arrastrar/pellizcar/rotar/opacidad); reel vertical.

**Carrito y checkout** — carrito persistente con cantidades, envío gratis desde $300.000;
checkout en acordeón (Contacto → Envío → Pago) con resumen colapsable, teclados
nativos, botón fijo "Pagar $X" y checkbox de aceptación legal.

**Pedidos e inventario** — orden PENDING **reserva** inventario 15 minutos
(atómico por variante); webhook con firma HMAC e idempotencia: APROBADO →
descuenta stock exacto + correo con factura; DECLINADO → cancela y libera;
expirado → barrido automático cada minuto. Snapshots de nombre/precio por item.

**Administración** — panel en el perfil (solo `ADMIN_EMAILS`): pedidos por estado,
marcar enviado con transportadora + guía → correo de rastreo al cliente.

**Legal** — términos, cambios/devoluciones (30 días, etiquetas puestas) y
tratamiento de datos (Ley 1581) visibles en la app; checkbox obligatorio en
registro y checkout. Las pasarelas los exigen para producción.

## Pruebas End-to-End (sandbox)

Con el backend corriendo:

```bash
cd backend
npx tsx scripts/e2e-sandbox.ts
```

Cubre (17 verificaciones): reserva de inventario, pago aprobado (estado + stock
exacto + correo), pago rechazado (cancelado + stock repuesto), expiración de
reserva (liberación automática), envío con guía, firma inválida rechazada y
panel admin protegido.

## Checklist para producción

- [ ] Cuenta real en la pasarela (Wompi/Bold/ePayco): configurar el secret del webhook y las tarjetas de prueba del sandbox
- [ ] Servir la API detrás de HTTPS (el móvil la exige fuera de desarrollo)
- [ ] DNS del dominio: registros SPF, DKIM y DMARC para que los correos no caigan en Spam
- [ ] Políticas legales también en un sitio web con footer (requisito de la pasarela)
- [ ] Datos de contacto reales en `mobile/src/screens/LegalScreen.tsx`
- [ ] Fotos reales de los productos (campo `image` del catálogo)
- [ ] Mover el catálogo del móvil a la base de datos (los precios ya se validan en el servidor)
