import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { fetchCategories, CatalogCategories, CatalogFilters } from '../api/catalog';

/**
 * Estado de navegación de la tienda (colección y segmento) compartido entre
 * el encabezado superior y la pantalla de Tienda.
 */

export type Bubble = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent?: boolean; // Ofertas resaltada en otro color
  filters: CatalogFilters;
};

export const SEGMENT_LABEL: Record<string, string> = {
  mujer: 'Mujer',
  hombre: 'Hombre',
  unisex: 'Unisex',
  ninos: 'Niños',
};

const COLLECTION_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  basicos: 'shirt-outline',
  streetwear: 'flash-outline',
  deportivo: 'barbell-outline',
};

/** Burbujas de colección: Lo Nuevo, Ofertas, Más vendidos y las colecciones del backend. */
export function buildBubbles(meta: CatalogCategories | null): Bubble[] {
  return [
    { id: 'lo-nuevo', label: 'Lo Nuevo', icon: 'sparkles-outline', filters: { onlyNew: true } },
    { id: 'ofertas', label: 'Ofertas', icon: 'pricetag-outline', accent: true, filters: { onlySale: true } },
    { id: 'mas-vendidos', label: '+ Vendidos', icon: 'trending-up-outline', filters: { onlyBest: true } },
    ...(meta?.colecciones ?? []).map((c) => ({
      id: c.slug,
      label: c.name.split(' ')[0],
      icon: COLLECTION_ICON[c.slug] ?? 'layers-outline',
      filters: { tag: c.slug },
    })),
  ];
}

/** Opciones de segmento: Todo + los segmentos que maneja el local. */
export function buildSegments(meta: CatalogCategories | null): Array<{ id: string; label: string }> {
  return [
    { id: 'todo', label: 'Todo' },
    ...(meta?.segments ?? []).map((s) => ({ id: s, label: SEGMENT_LABEL[s] ?? s })),
  ];
}

type ShopNav = {
  bubble: string;
  setBubble: (id: string) => void;
  segment: string;
  setSegment: (id: string) => void;
  category: string; // '' = todas las categorías
  setCategory: (slug: string) => void;
  meta: CatalogCategories | null;
};

const ShopNavContext = createContext<ShopNav | null>(null);

export function ShopNavProvider({ children }: { children: React.ReactNode }) {
  const [bubble, setBubble] = useState('lo-nuevo');
  const [segment, setSegment] = useState('todo');
  const [category, setCategory] = useState('');
  const [meta, setMeta] = useState<CatalogCategories | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  const value = useMemo(
    () => ({ bubble, setBubble, segment, setSegment, category, setCategory, meta }),
    [bubble, segment, category, meta],
  );
  return <ShopNavContext.Provider value={value}>{children}</ShopNavContext.Provider>;
}

export function useShopNav(): ShopNav {
  const value = useContext(ShopNavContext);
  if (!value) throw new Error('useShopNav debe usarse dentro de ShopNavProvider');
  return value;
}
