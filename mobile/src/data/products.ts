import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type CategoryIcon = ComponentProps<typeof Ionicons>['name'];

export type Category = {
  id: string;
  label: string;
  icon: CategoryIcon;
  imageUrl?: string;
};

export const CATEGORIES: Category[] = [
  { id: 'camisetas', label: 'Camisetas', icon: 'shirt-outline', imageUrl: '/uploads/products/camisetas-01.jpg' },
  { id: 'polos', label: 'Polos', icon: 'shirt-sharp', imageUrl: '/uploads/products/polos-01.jpg' },
  { id: 'oversize', label: 'Oversize', icon: 'expand-outline', imageUrl: '/uploads/products/oversize-01.jpg' },
  { id: 'camisas-vestir', label: 'Camisas de vestir', icon: 'business-outline', imageUrl: '/uploads/products/camisas-de-vestir-01.jpg' },
  { id: 'deportiva', label: 'Deportiva', icon: 'fitness-outline', imageUrl: '/uploads/products/deportiva-01.jpg' },
  { id: 'buzos', label: 'Buzos', icon: 'snow-outline', imageUrl: '/uploads/products/buzos-01.jpg' },
  { id: 'sudaderas', label: 'Sudaderas', icon: 'layers-outline', imageUrl: '/uploads/products/sudaderas-01.jpg' },
  { id: 'jeans', label: 'Jeans', icon: 'square-outline', imageUrl: '/uploads/products/jeans-01.jpg' },
  { id: 'zapatos', label: 'Zapatos', icon: 'footsteps-outline', imageUrl: '/uploads/products/zapatos-01.jpg' },
  { id: 'gafas', label: 'Gafas', icon: 'glasses-outline', imageUrl: '/uploads/products/gafas-01.jpg' },
  { id: 'relojes', label: 'Relojes', icon: 'watch-outline', imageUrl: '/uploads/products/relojes-01.jpg' },
  { id: 'lociones', label: 'Lociones', icon: 'water-outline', imageUrl: '/uploads/products/lociones-01.jpg' },
];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number; // en pesos colombianos, sin decimales
  sizes: string[];
  /** Ruta o URL de la foto del producto. */
  image?: string | null;
};

/**
 * Mapeo directo a los assets locales (1024x1024 px, fondo blanco puro).
 * Garantiza renderizado con 0ms de latencia y funcionamiento 100% offline.
 */
export const PRODUCT_LOCAL_IMAGES: Record<string, any> = {
  // 01 Camisetas
  'camiseta-blanca': require('../../assets/products/camisetas-01.jpg'),
  'camiseta-negra': require('../../assets/products/camisetas-02.jpg'),
  'camiseta-grafica': require('../../assets/products/camisetas-03.jpg'),

  // 02 Polos
  'polo-pique': require('../../assets/products/polos-01.jpg'),
  'polo-largo': require('../../assets/products/polos-02.jpg'),
  'polo-rayas': require('../../assets/products/polos-03.jpg'),

  // 03 Oversize
  'oversize-blanca': require('../../assets/products/oversize-01.jpg'),
  'oversize-caqui': require('../../assets/products/oversize-02.jpg'),
  'oversize-capucha': require('../../assets/products/oversize-03.jpg'),

  // 04 Camisas de vestir
  'vestir-azul': require('../../assets/products/camisas-de-vestir-01.jpg'),
  'vestir-blanca': require('../../assets/products/camisas-de-vestir-02.jpg'),
  'vestir-negra': require('../../assets/products/camisas-de-vestir-03.jpg'),

  // 05 Deportiva
  'deportiva-camiseta': require('../../assets/products/deportiva-01.jpg'),
  'deportiva-short': require('../../assets/products/deportiva-02.jpg'),
  'deportiva-conjunto': require('../../assets/products/deportiva-03.jpg'),

  // 06 Buzos
  'buzo-canguro': require('../../assets/products/buzos-01.jpg'),
  'buzo-cremallera': require('../../assets/products/buzos-02.jpg'),
  'buzo-lana': require('../../assets/products/buzos-03.jpg'),

  // 07 Sudaderas
  'sudadera-gris': require('../../assets/products/sudaderas-01.jpg'),
  'sudadera-negra': require('../../assets/products/sudaderas-02.jpg'),
  'sudadera-degradado': require('../../assets/products/sudaderas-03.jpg'),

  // 08 Jeans
  'jean-recto': require('../../assets/products/jeans-01.jpg'),
  'jean-skinny': require('../../assets/products/jeans-02.jpg'),
  'jean-wide': require('../../assets/products/jeans-03.jpg'),

  // 09 Zapatos
  'zapato-running': require('../../assets/products/zapatos-01.jpg'),
  'zapato-casual': require('../../assets/products/zapatos-02.jpg'),
  'zapato-botin': require('../../assets/products/zapatos-03.jpg'),

  // 10 Gafas
  'gafa-aviador': require('../../assets/products/gafas-01.jpg'),
  'gafa-wayfarer': require('../../assets/products/gafas-02.jpg'),
  'gafa-deportiva': require('../../assets/products/gafas-03.jpg'),

  // 11 Relojes
  'reloj-malla': require('../../assets/products/relojes-01.jpg'),
  'reloj-cuero': require('../../assets/products/relojes-02.jpg'),
  'reloj-smart': require('../../assets/products/relojes-03.jpg'),

  // 12 Lociones
  'locion-citrus': require('../../assets/products/lociones-01.jpg'),
  'locion-woody': require('../../assets/products/lociones-02.jpg'),
  'locion-noche': require('../../assets/products/lociones-03.jpg'),
};

export const products: Product[] = [
  // Camisetas
  {
    id: 'camiseta-blanca',
    name: 'Camiseta blanca premium',
    category: 'camisetas',
    price: 59000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/camisetas-01.jpg',
  },
  {
    id: 'camiseta-negra',
    name: 'Camiseta negra cuello redondo',
    category: 'camisetas',
    price: 65000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/camisetas-02.jpg',
  },
  {
    id: 'camiseta-grafica',
    name: 'Camiseta estampada urbana',
    category: 'camisetas',
    price: 72000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/camisetas-03.jpg',
  },
  // Polos
  {
    id: 'polo-pique',
    name: 'Polo piqué clásico',
    category: 'polos',
    price: 89000,
    sizes: ['S', 'M', 'L'],
    image: '/uploads/products/polos-01.jpg',
  },
  {
    id: 'polo-largo',
    name: 'Polo manga larga',
    category: 'polos',
    price: 95000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/polos-02.jpg',
  },
  {
    id: 'polo-rayas',
    name: 'Polo rayado marinero',
    category: 'polos',
    price: 105000,
    sizes: ['S', 'M', 'L'],
    image: '/uploads/products/polos-03.jpg',
  },
  // Oversize
  {
    id: 'oversize-blanca',
    name: 'Camiseta oversize blanca',
    category: 'oversize',
    price: 98000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/oversize-01.jpg',
  },
  {
    id: 'oversize-caqui',
    name: 'Camiseta oversize caquí',
    category: 'oversize',
    price: 115000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/oversize-02.jpg',
  },
  {
    id: 'oversize-capucha',
    name: 'Oversise con capucha',
    category: 'oversize',
    price: 124000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/oversize-03.jpg',
  },
  // Camisas de vestir
  {
    id: 'vestir-azul',
    name: 'Camisa azul oxford',
    category: 'camisas-vestir',
    price: 149000,
    sizes: ['15', '15.5', '16', '16.5'],
    image: '/uploads/products/camisas-de-vestir-01.jpg',
  },
  {
    id: 'vestir-blanca',
    name: 'Camisa blanca lino',
    category: 'camisas-vestir',
    price: 169000,
    sizes: ['15', '15.5', '16', '17'],
    image: '/uploads/products/camisas-de-vestir-02.jpg',
  },
  {
    id: 'vestir-negra',
    name: 'Camisa negra slim',
    category: 'camisas-vestir',
    price: 189000,
    sizes: ['15.5', '16', '16.5', '17'],
    image: '/uploads/products/camisas-de-vestir-03.jpg',
  },
  // Deportiva
  {
    id: 'deportiva-camiseta',
    name: 'Camiseta dry-fit entrenamiento',
    category: 'deportiva',
    price: 119000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/deportiva-01.jpg',
  },
  {
    id: 'deportiva-short',
    name: 'Short deportivo ligero',
    category: 'deportiva',
    price: 135000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/deportiva-02.jpg',
  },
  {
    id: 'deportiva-conjunto',
    name: 'Conjunto gimnasio 2 piezas',
    category: 'deportiva',
    price: 149000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/deportiva-03.jpg',
  },
  // Buzos
  {
    id: 'buzo-canguro',
    name: 'Buzo canguro con bolsillo',
    category: 'buzos',
    price: 129000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/buzos-01.jpg',
  },
  {
    id: 'buzo-cremallera',
    name: 'Buzo cremallera completa',
    category: 'buzos',
    price: 145000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/buzos-02.jpg',
  },
  {
    id: 'buzo-lana',
    name: 'Buzo lana tejida',
    category: 'buzos',
    price: 159000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/buzos-03.jpg',
  },
  // Sudaderas
  {
    id: 'sudadera-gris',
    name: 'Sudadera gris jogger',
    category: 'sudaderas',
    price: 109000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/sudaderas-01.jpg',
  },
  {
    id: 'sudadera-negra',
    name: 'Sudadera negra básica',
    category: 'sudaderas',
    price: 125000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/sudaderas-02.jpg',
  },
  {
    id: 'sudadera-degradado',
    name: 'Sudadera degradada',
    category: 'sudaderas',
    price: 139000,
    sizes: ['S', 'M', 'L'],
    image: '/uploads/products/sudaderas-03.jpg',
  },
  // Jeans
  {
    id: 'jean-recto',
    name: 'Jean recto clásico',
    category: 'jeans',
    price: 139000,
    sizes: ['28', '30', '32', '34', '36'],
    image: '/uploads/products/jeans-01.jpg',
  },
  {
    id: 'jean-skinny',
    name: 'Jean skinny elástico',
    category: 'jeans',
    price: 159000,
    sizes: ['28', '30', '32', '34'],
    image: '/uploads/products/jeans-02.jpg',
  },
  {
    id: 'jean-wide',
    name: 'Jean wide leg',
    category: 'jeans',
    price: 179000,
    sizes: ['30', '32', '34', '36', '38'],
    image: '/uploads/products/jeans-03.jpg',
  },
  // Zapatos
  {
    id: 'zapato-running',
    name: 'Tenis running livianos',
    category: 'zapatos',
    price: 229000,
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    image: '/uploads/products/zapatos-01.jpg',
  },
  {
    id: 'zapato-casual',
    name: 'Casual urbano piel',
    category: 'zapatos',
    price: 289000,
    sizes: ['39', '40', '41', '42', '43'],
    image: '/uploads/products/zapatos-02.jpg',
  },
  {
    id: 'zapato-botin',
    name: 'Botín cuero sintético',
    category: 'zapatos',
    price: 349000,
    sizes: ['38', '39', '40', '41', '42'],
    image: '/uploads/products/zapatos-03.jpg',
  },
  // Gafas
  {
    id: 'gafa-aviador',
    name: 'Gafas aviador espejo',
    category: 'gafas',
    price: 159000,
    sizes: ['Única'],
    image: '/uploads/products/gafas-01.jpg',
  },
  {
    id: 'gafa-wayfarer',
    name: 'Gafas wayfarer clásicas',
    category: 'gafas',
    price: 199000,
    sizes: ['Única'],
    image: '/uploads/products/gafas-02.jpg',
  },
  {
    id: 'gafa-deportiva',
    name: 'Gafas deportivas polarizadas',
    category: 'gafas',
    price: 259000,
    sizes: ['Única'],
    image: '/uploads/products/gafas-03.jpg',
  },
  // Relojes
  {
    id: 'reloj-malla',
    name: 'Reloj malla acero',
    category: 'relojes',
    price: 389000,
    sizes: ['Única'],
    image: '/uploads/products/relojes-01.jpg',
  },
  {
    id: 'reloj-cuero',
    name: 'Reloj correa cuero',
    category: 'relojes',
    price: 549000,
    sizes: ['Única'],
    image: '/uploads/products/relojes-02.jpg',
  },
  {
    id: 'reloj-smart',
    name: 'Smartwatch deportivo',
    category: 'relojes',
    price: 799000,
    sizes: ['Única'],
    image: '/uploads/products/relojes-03.jpg',
  },
  // Lociones
  {
    id: 'locion-citrus',
    name: 'Loción cítrica 100 ml',
    category: 'lociones',
    price: 89000,
    sizes: ['50 ml', '100 ml'],
    image: '/uploads/products/lociones-01.jpg',
  },
  {
    id: 'locion-woody',
    name: 'Loción amaderada 100 ml',
    category: 'lociones',
    price: 119000,
    sizes: ['100 ml', '200 ml'],
    image: '/uploads/products/lociones-02.jpg',
  },
  {
    id: 'locion-noche',
    name: 'Loción noche intensa 100 ml',
    category: 'lociones',
    price: 149000,
    sizes: ['50 ml', '100 ml', '200 ml'],
    image: '/uploads/products/lociones-03.jpg',
  },
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function categoryIcon(id: string): CategoryIcon {
  return CATEGORIES.find((c) => c.id === id)?.icon ?? 'prism-outline';
}

const CATEGORY_CODES: Record<string, string> = {
  camisetas: 'CAM',
  polos: 'POL',
  oversize: 'OVS',
  'camisas-vestir': 'CVE',
  deportiva: 'DEP',
  buzos: 'BUZ',
  sudaderas: 'SUD',
  jeans: 'JEA',
  zapatos: 'ZAP',
  gafas: 'GAF',
  relojes: 'REL',
  lociones: 'LOC',
};

/** Referencia legible del producto, p. ej. "CAM-001" (código de categoría + posición). */
export function productRef(product: Product): string {
  const code = CATEGORY_CODES[product.category] ?? 'GEN';
  const pos = products.filter((p) => p.category === product.category).findIndex((p) => p.id === product.id) + 1;
  return `${code}-${String(pos).padStart(3, '0')}`;
}

export function productsByCategory(id: string): Product[] {
  return products.filter((p) => p.category === id);
}

export const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
