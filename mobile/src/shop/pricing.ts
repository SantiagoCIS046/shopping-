import { COUNTRY_CODE } from '../config';

/**
 * Impuestos nacionales: cada país tiene su IVA/impuesto al consumo.
 * El país se configura en src/config.ts (COUNTRY_CODE) y el mismo
 * cálculo se replica en el backend al crear el pedido.
 */
export type CountryTax = { name: string; rate: number };

export const COUNTRY_TAXES: Record<string, CountryTax> = {
  CO: { name: 'IVA', rate: 0.19 }, // Colombia
  MX: { name: 'IVA', rate: 0.16 }, // México
  AR: { name: 'IVA', rate: 0.21 }, // Argentina
  CL: { name: 'IVA', rate: 0.19 }, // Chile
  PE: { name: 'IGV', rate: 0.18 }, // Perú
  EC: { name: 'IVA', rate: 0.15 }, // Ecuador
  ES: { name: 'IVA', rate: 0.21 }, // España
  US: { name: 'Sales Tax', rate: 0.07 }, // Estados Unidos (aprox.)
};

export const FREE_SHIPPING_FROM = 300000; // envío gratis desde este subtotal

/**
 * Envío por tramos según el subtotal (sin impuestos).
 * Debe coincidir con shippingFor() en backend/src/orders.ts.
 */
export const SHIPPING_TIERS: Array<{ upTo: number; cost: number }> = [
  { upTo: 50000, cost: 3000 },
  { upTo: 150000, cost: 6000 },
  { upTo: FREE_SHIPPING_FROM, cost: 10000 },
];

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_FROM) return 0;
  return SHIPPING_TIERS.find((t) => subtotal < t.upTo)?.cost ?? 0;
}

export type Totals = {
  taxLabel: string;
  taxRate: number;
  taxAmount: number;
  shipping: number;
  freeShipping: boolean;
  missingForFreeShipping: number;
  total: number;
};

/** Calcula subtotal → impuesto nacional + envío → total a pagar. */
export function calcTotals(subtotal: number, country: string = COUNTRY_CODE): Totals {
  const tax = COUNTRY_TAXES[country] ?? COUNTRY_TAXES.CO;
  const taxAmount = Math.round(subtotal * tax.rate);
  const freeShipping = subtotal >= FREE_SHIPPING_FROM;
  const shipping = shippingFor(subtotal);
  return {
    taxLabel: `${tax.name} (${Math.round(tax.rate * 100)}%)`,
    taxRate: tax.rate,
    taxAmount,
    shipping,
    freeShipping,
    missingForFreeShipping: Math.max(0, FREE_SHIPPING_FROM - subtotal),
    total: subtotal + taxAmount + shipping,
  };
}
