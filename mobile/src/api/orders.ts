import { api } from './client';

/** Ítem del carrito identificado por la variante (talla) del producto. */
export type OrderItemInput = {
  sku: string; // "jean-recto--32"
  quantity: number;
};

export type ShippingAddress = {
  city: string;
  address: string;
  neighborhood: string;
};

export type CreatedOrder = {
  id: string;
  orderNumber: string;
  subtotal: number;
  taxName: string;
  taxAmount: number;
  shipping: number;
  total: number;
  status: string;
};

export type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string; // sku
    name: string | null; // snapshot del nombre
    size: string;
    quantity: number;
    unitPrice: number;
  }>;
};

/** Crea el pedido: los precios y el stock los valida el backend. */
export function createOrder(input: {
  items: OrderItemInput[];
  paymentMethod: string;
  country: string;
  customerEmail: string;
  phone: string;
  shippingAddress: ShippingAddress;
}) {
  return api<CreatedOrder>('/orders', {
    method: 'POST',
    body: input,
  });
}

/** Historial de pedidos del usuario. */
export function listOrders() {
  return api<{ orders: OrderHistoryItem[] }>('/orders');
}
