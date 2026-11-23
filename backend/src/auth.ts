import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendMail } from './mailer';
import { isAdminEmail } from './adminAccess';

const prisma = new PrismaClient();
const router = Router();

// ---------- Configuración de seguridad ----------
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambia-esto';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m'; // access token de vida corta
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS) || 30;
const BCRYPT_ROUNDS = 12;

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64;
const LOGIN_MAX_FAILS = 5; // intentos fallidos consecutivos antes de bloquear
const LOGIN_BLOCK_MINUTES = 10;

// Hash falso para comparar cuando el usuario no existe (evita medir el tiempo
// y enumerar usuarios por respuesta rápida)
const DUMMY_HASH = bcrypt.hashSync('valor-que-nunca-coincide', BCRYPT_ROUNDS);

type Credentials = { name?: string; email?: string; password?: string };

function publicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Política de contraseña: obligatoria, 8-64 caracteres. */
function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Escribe tu contraseña';
  }
  if (password.length < PASSWORD_MIN) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  }
  if (password.length > PASSWORD_MAX) {
    return `La contraseña no puede superar ${PASSWORD_MAX} caracteres`;
  }
  return null;
}

// ---------- Rate limiting del login (en memoria; en producción, Redis) ----------
type LoginAttempt = { fails: number; blockedUntil: number };
const loginAttempts = new Map<string, LoginAttempt>();

function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'desconocida';
}

function loginKey(req: Request, email: string): string {
  return `${email}|${clientIp(req)}`;
}

function blockedMinutesFor(entry: LoginAttempt | undefined): number {
  if (!entry) return 0;
  const remainingMs = entry.blockedUntil - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 60_000) : 0;
}

function registerFailedAttempt(key: string): void {
  const entry = loginAttempts.get(key) ?? { fails: 0, blockedUntil: 0 };
  entry.fails += 1;
  if (entry.fails >= LOGIN_MAX_FAILS) {
    entry.blockedUntil = Date.now() + LOGIN_BLOCK_MINUTES * 60_000;
    entry.fails = 0;
  }
  loginAttempts.set(key, entry);
}

// ---------- Tokens ----------
function makeAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Refresh token opaco: se guarda solo su hash SHA-256, con expiry y revocación. */
async function issueRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { tokenHash: sha256(token), userId, expiresAt },
  });
  return token;
}

/** Sesión completa: access token corto + refresh token + usuario público. */
async function buildSession(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return {
    token: makeAccessToken(user.id),
    refreshToken: await issueRefreshToken(user.id),
    user: publicUser(user),
  };
}

/** Middleware: exige header "Authorization: Bearer <access token>" */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    _res.status(401).json({ error: 'No autorizado' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    (req as Request & { userId?: string }).userId = payload.sub;
    next();
  } catch {
    _res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}

// ---------- Endpoints ----------

/** POST /auth/register — crea la cuenta y devuelve sesión */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as Credentials;
    const cleanName = (name ?? '').trim();
    const cleanEmail = (email ?? '').trim().toLowerCase();

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Escribe tu nombre completo' });
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ error: 'El correo no es válido' });
    }
    const badPassword = passwordProblem(password);
    if (badPassword) {
      return res.status(400).json({ error: badPassword });
    }
    const validPassword = password as string;

    const exists = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (exists) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este correo' });
    }

    const passwordHash = await bcrypt.hash(validPassword, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { name: cleanName, email: cleanEmail, passwordHash },
    });

    res.status(201).json(await buildSession(user.id));
  } catch (err) {
    console.error('[auth:register]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** POST /auth/login — valida credenciales con límite de intentos y mensaje genérico */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as Credentials;
    const cleanEmail = (email ?? '').trim().toLowerCase();

    if (!cleanEmail || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Escribe tu correo y contraseña' });
    }

    const key = loginKey(req, cleanEmail);
    const blockedFor = blockedMinutesFor(loginAttempts.get(key));
    if (blockedFor > 0) {
      return res.status(429).json({
        error: `Demasiados intentos fallidos. Espera ${blockedFor} minuto(s) e inténtalo de nuevo.`,
      });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    const passwordOk = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    // Mensaje genérico: nunca revela si falló el correo o la contraseña
    if (!user || !passwordOk) {
      registerFailedAttempt(key);
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    loginAttempts.delete(key);
    res.json(await buildSession(user.id));
  } catch (err) {
    console.error('[auth:login]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** POST /auth/refresh — rota el refresh token y emite un access token nuevo */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({ error: 'Falta el refresh token' });
    }

    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
    });

    if (!record) {
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
    }

    // Reuso de un token ya revocado: posible robo → se revocan TODAS las sesiones
    if (record.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
    }

    if (record.expiresAt < new Date()) {
      await prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
    }

    // Rotación: el token presentado se revoca y se emite uno nuevo
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    res.json(await buildSession(record.userId));
  } catch (err) {
    console.error('[auth:refresh]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** POST /auth/logout — revoca el refresh token de esta sesión */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: sha256(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[auth:logout]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** GET /auth/me — devuelve el usuario de la sesión activa */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId?: string }).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(401).json({ error: 'Sesión inválida' });
  }
  res.json({ user: { ...publicUser(user), isAdmin: isAdminEmail(user.email) } });
});

/** PATCH /auth/profile — actualiza el nombre del usuario */
router.patch('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    const { name } = req.body as { name?: unknown };
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('[auth:profile]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** POST /auth/change-password — cambia la contraseña verificando la actual */
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    const currentOk =
      typeof currentPassword === 'string' &&
      (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!currentOk) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    const badPassword = passwordProblem(newPassword);
    if (badPassword) {
      return res.status(400).json({ error: badPassword });
    }

    const passwordHash = await bcrypt.hash(newPassword as string, BCRYPT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      // Cierra todas las sesiones activas por seguridad
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('[auth:change-password]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** POST /auth/forgot-password — envía el enlace de recuperación por correo */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const cleanEmail = ((req.body as Credentials).email ?? '').trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
        },
      });

      const base = process.env.APP_RESET_URL || 'tiendaropa://reset-password';
      const link = `${base}?token=${token}`;
      const html = `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #050A16; color: #E8ECF4; border-radius: 16px;">
          <h2 style="color: #6D9DF3; letter-spacing: 2px; margin: 0 0 16px;">Shopping</h2>
          <p>Hola ${user.name},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace expira en <strong>1 hora</strong>.</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${link}" style="background: #3E7BFA; color: #FFFFFF; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Crear nueva contraseña</a>
          </p>
          <p style="font-size: 13px; color: rgba(214,222,234,0.6);">Si no pediste este cambio, ignora este correo. Tu contraseña actual sigue siendo la misma.</p>
          <p style="font-size: 12px; color: rgba(214,222,234,0.4); word-break: break-all;">${link}</p>
        </div>
      `;

      try {
        await sendMail({
          to: cleanEmail,
          subject: 'Restablece tu contraseña · Shopping',
          html,
          devLink: link,
        });
      } catch (mailErr) {
        console.error('[auth:forgot-password:mailer]', mailErr);
      }
    }

    // Respuesta genérica: no revelar si el correo existe o no
    res.json({ ok: true });
  } catch (err) {
    console.error('[auth:forgot-password]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** POST /auth/reset-password — guarda la nueva contraseña con el token del correo */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token) {
      return res.status(400).json({ error: 'Falta el token de recuperación' });
    }
    const badPassword = passwordProblem(password);
    if (badPassword) {
      return res.status(400).json({ error: badPassword });
    }
    const validPassword = password as string;

    const reset = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return res.status(400).json({ error: 'El enlace es inválido o ya expiró. Pide uno nuevo.' });
    }

    const passwordHash = await bcrypt.hash(validPassword, BCRYPT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Invalida cualquier otro token pendiente de este usuario
      prisma.passwordResetToken.deleteMany({
        where: { userId: reset.userId, usedAt: null },
      }),
      // Y cierra todas las sesiones activas por seguridad
      prisma.refreshToken.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('[auth:reset-password]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
