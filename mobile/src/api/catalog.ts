import { api } from './client';

export type CatalogCategory = {
  id: number;
  slug: string;
  name: string;
  type: string;
  imageUrl: string | null;
};

export type CatalogCategories = {
  segments: string[]; // solo los que el local maneja (mujer, hombre, unisex, ninos…)
  prendas: CatalogCategory[];
  colecciones: CatalogCategory[];
};

export type CatalogProduct = {
  id: string; // slug
  ref: string | null; // referencia pública opaca del servidor
  name: string;
  category: string;
  categoryName: string;
  audience: string;
  tags: string[];
  price: number;
  discountPrice: number | null;
  image: string | null;
  isNew: boolean;
  sold: number;
  sizes: Array<{ size: string; available: number; price: number }>;
};

export type CatalogFilters = {
  segment?: string;
  category?: string;
  tag?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyNew?: boolean;
  onlySale?: boolean;
  onlyBest?: boolean;
  sort?: 'recientes' | 'precio-asc' | 'precio-desc' | 'vendidos';
  slugs?: string[]; // solo estos productos (stock del carrito)
};

/** Categorías dinámicas del local (prendas, colecciones y segmentos presentes). */
export function fetchCategories() {
  return api<CatalogCategories>('/catalog/categories');
}

export type CatalogSizeOption = { size: string; inStock: boolean };

/** Productos del catálogo con filtros y orden aplicados en el servidor.
 *  `sizes` es el universo de tallas del contexto actual (solo las de la
 *  categoría/segmento visible), marcando cuáles tienen stock. */
export function fetchProducts(filters: CatalogFilters = {}) {
  const params = new URLSearchParams();
  if (filters.segment && filters.segment !== 'todo') params.set('segment', filters.segment);
  if (filters.category) params.set('category', filters.category);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.size) params.set('size', filters.size);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.onlyNew) params.set('new', '1');
  if (filters.onlySale) params.set('sale', '1');
  if (filters.onlyBest) params.set('best', '1');
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.slugs?.length) params.set('slugs', filters.slugs.join(','));
  const query = params.toString();
  return api<{ products: CatalogProduct[]; sizes: CatalogSizeOption[] }>(
    `/catalog/products${query ? `?${query}` : ''}`,
  );
}
