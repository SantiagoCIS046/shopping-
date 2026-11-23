import { api } from './client';
import type { OrderHistoryItem } from './orders';

export type AdminOrder = OrderHistoryItem & {
  carrier: string | null;
  trackingNumber: string | null;
  customerEmail: string | null;
};

/** Pedidos de toda la tienda, filtrables por estado (para empacar: pagado). */
export function listAdminOrders(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return api<{ orders: AdminOrder[] }>(`/admin/orders${query}`);
}

/** Marca un pedido como enviado con transportadora y número de guía. */
export function shipOrder(orderNumber: string, carrier: string, trackingNumber: string) {
  return api<{ order: AdminOrder }>(`/admin/orders/${encodeURIComponent(orderNumber)}/ship`, {
    method: 'PATCH',
    body: { carrier, trackingNumber },
  });
}
