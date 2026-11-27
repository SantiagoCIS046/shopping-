import { api } from './client';

/** Pide el enlace de pago de Wompi para un pedido pendiente del usuario. */
export function getPaymentLink(orderNumber: string) {
  return api<{ url: string }>(`/payments/wompi/link/${orderNumber}`, { method: 'POST' });
}
