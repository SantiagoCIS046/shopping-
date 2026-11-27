import { useEffect, useState } from 'react';
import { CatalogProduct, fetchProducts } from '../api/catalog';

export type VariantStock = { size: string; available: number; price: number };
export type StockEntry = { ref: string | null; price: number; sizes: VariantStock[] };
export type StockIndex = Record<string, StockEntry>;

/** Índice por id de producto (slug) con stock, precio efectivo y referencia del servidor. */
export function buildStockIndex(products: CatalogProduct[]): StockIndex {
  const index: StockIndex = {};
  for (const p of products) {
    index[p.id] = { ref: p.ref, price: p.discountPrice ?? p.price, sizes: p.sizes };
  }
  return index;
}

export function variantOf(index: StockIndex | null, productId: string, size: string): VariantStock | undefined {
  return index?.[productId]?.sizes.find((s) => s.size === size);
}

/**
 * Stock y precios reales del servidor para los productos indicados.
 * Devuelve null mientras carga o si no hay conexión (en ese caso el servidor
 * valida igual al crear el pedido).
 */
export function useStockIndex(slugs: string[], active = true): StockIndex | null {
  const key = [...new Set(slugs)].sort().join(',');
  const [index, setIndex] = useState<StockIndex | null>(null);

  // `active` = la pantalla está visible: al volver a abrirla se vuelve a consultar
  useEffect(() => {
    if (!active) return undefined;
    if (!key) {
      setIndex({});
      return undefined;
    }
    let cancelled = false;
    fetchProducts({ slugs: key.split(',') })
      .then((data) => {
        if (!cancelled) setIndex(buildStockIndex(data.products));
      })
      .catch(() => {
        if (!cancelled) setIndex(null);
      });
    return () => {
      cancelled = true;
    };
  }, [key, active]);

  return index;
}
