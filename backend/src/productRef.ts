import crypto from 'crypto';

/**
 * Referencia pública opaca de un producto. Se deriva con HMAC-SHA256 usando
 * una clave que solo vive en el servidor (CATALOG_REF_SECRET): sin la clave
 * no se puede deducir ni fabricar una referencia válida a partir del slug.
 */
export function publicRefFor(slug: string): string {
  const secret = process.env.CATALOG_REF_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('CATALOG_REF_SECRET debe tener al menos 32 caracteres');
  }
  const digest = crypto.createHmac('sha256', secret).update(slug).digest('base64url');
  return `RF-${digest.slice(0, 10).toUpperCase()}`;
}
