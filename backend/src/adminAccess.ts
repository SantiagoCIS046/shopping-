/**
 * Correos autorizados como administradores de la tienda (variable
 * ADMIN_EMAILS, separados por coma). Quien no esté en la lista no
 * puede usar el panel administrativo.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
