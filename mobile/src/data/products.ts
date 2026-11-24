import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

// Catálogo de la tienda.
// Cada producto incluye una fotografía de alta resolución.
// Si alguna imagen no carga o falla la red, ProductImage muestra
// automáticamente la plantilla con gradiente y el icono de su categoría.

export type CategoryIcon = ComponentProps<typeof Ionicons>['name'];

export type Category = {
  id: string;
  label: string;
  icon: CategoryIcon;
};

export const CATEGORIES: Category[] = [
  { id: 'camisetas', label: 'Camisetas', icon: 'shirt-outline' },
  { id: 'polos', label: 'Polos', icon: 'shirt-sharp' },
  { id: 'oversize', label: 'Oversize', icon: 'expand-outline' },
  { id: 'camisas-vestir', label: 'Camisas de vestir', icon: 'business-outline' },
  { id: 'deportiva', label: 'Deportiva', icon: 'fitness-outline' },
  { id: 'buzos', label: 'Buzos', icon: 'snow-outline' },
  { id: 'sudaderas', label: 'Sudaderas', icon: 'layers-outline' },
  { id: 'jeans', label: 'Jeans', icon: 'square-outline' },
  { id: 'zapatos', label: 'Zapatos', icon: 'footsteps-outline' },
  { id: 'gafas', label: 'Gafas', icon: 'glasses-outline' },
  { id: 'relojes', label: 'Relojes', icon: 'watch-outline' },
  { id: 'lociones', label: 'Lociones', icon: 'water-outline' },
];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number; // en pesos colombianos, sin decimales
  sizes: string[];
  /** URL de la foto del producto; sin URL se usa la plantilla de categoría. */
  image?: string | null;
};

export const products: Product[] = [
  // Camisetas
  {
    id: 'camiseta-blanca',
    name: 'Camiseta blanca premium',
    category: 'camisetas',
    price: 59000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'camiseta-negra',
    name: 'Camiseta negra cuello redondo',
    category: 'camisetas',
    price: 65000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'camiseta-grafica',
    name: 'Camiseta estampada urbana',
    category: 'camisetas',
    price: 72000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
  },
  // Polos
  {
    id: 'polo-pique',
    name: 'Polo piqué clásico',
    category: 'polos',
    price: 89000,
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1625910513413-5b8df7255963?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'polo-largo',
    name: 'Polo manga larga',
    category: 'polos',
    price: 95000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'polo-rayas',
    name: 'Polo rayado marinero',
    category: 'polos',
    price: 105000,
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
  },
  // Oversize
  {
    id: 'oversize-blanca',
    name: 'Camiseta oversize blanca',
    category: 'oversize',
    price: 98000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'oversize-caqui',
    name: 'Camiseta oversize caquí',
    category: 'oversize',
    price: 115000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'oversize-capucha',
    name: 'Oversise con capucha',
    category: 'oversize',
    price: 124000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  },
  // Camisas de vestir
  {
    id: 'vestir-azul',
    name: 'Camisa azul oxford',
    category: 'camisas-vestir',
    price: 149000,
    sizes: ['15', '15.5', '16', '16.5'],
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'vestir-blanca',
    name: 'Camisa blanca lino',
    category: 'camisas-vestir',
    price: 169000,
    sizes: ['15', '15.5', '16', '17'],
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'vestir-negra',
    name: 'Camisa negra slim',
    category: 'camisas-vestir',
    price: 189000,
    sizes: ['15.5', '16', '16.5', '17'],
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80',
  },
  // Deportiva
  {
    id: 'deportiva-camiseta',
    name: 'Camiseta dry-fit entrenamiento',
    category: 'deportiva',
    price: 119000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'deportiva-short',
    name: 'Short deportivo ligero',
    category: 'deportiva',
    price: 135000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'deportiva-conjunto',
    name: 'Conjunto gimnasio 2 piezas',
    category: 'deportiva',
    price: 149000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  },
  // Buzos
  {
    id: 'buzo-canguro',
    name: 'Buzo canguro con bolsillo',
    category: 'buzos',
    price: 129000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'buzo-cremallera',
    name: 'Buzo cremallera completa',
    category: 'buzos',
    price: 145000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'buzo-lana',
    name: 'Buzo lana tejida',
    category: 'buzos',
    price: 159000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=800&q=80',
  },
  // Sudaderas
  {
    id: 'sudadera-gris',
    name: 'Sudadera gris jogger',
    category: 'sudaderas',
    price: 109000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sudadera-negra',
    name: 'Sudadera negra básica',
    category: 'sudaderas',
    price: 125000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sudadera-degradado',
    name: 'Sudadera degradada',
    category: 'sudaderas',
    price: 139000,
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  },
  // Jeans
  {
    id: 'jean-recto',
    name: 'Jean recto clásico',
    category: 'jeans',
    price: 139000,
    sizes: ['28', '30', '32', '34', '36'],
    image: 'https://images.unsplash.com/photo-1542272604-780c96856478?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'jean-skinny',
    name: 'Jean skinny elástico',
    category: 'jeans',
    price: 159000,
    sizes: ['28', '30', '32', '34'],
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'jean-wide',
    name: 'Jean wide leg',
    category: 'jeans',
    price: 179000,
    sizes: ['30', '32', '34', '36', '38'],
    image: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=800&q=80',
  },
  // Zapatos
  {
    id: 'zapato-running',
    name: 'Tenis running livianos',
    category: 'zapatos',
    price: 229000,
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'zapato-casual',
    name: 'Casual urbano piel',
    category: 'zapatos',
    price: 289000,
    sizes: ['39', '40', '41', '42', '43'],
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'zapato-botin',
    name: 'Botín cuero sintético',
    category: 'zapatos',
    price: 349000,
    sizes: ['38', '39', '40', '41', '42'],
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80',
  },
  // Gafas
  {
    id: 'gafa-aviador',
    name: 'Gafas aviador espejo',
    category: 'gafas',
    price: 159000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gafa-wayfarer',
    name: 'Gafas wayfarer clásicas',
    category: 'gafas',
    price: 199000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gafa-deportiva',
    name: 'Gafas deportivas polarizadas',
    category: 'gafas',
    price: 259000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80',
  },
  // Relojes
  {
    id: 'reloj-malla',
    name: 'Reloj malla acero',
    category: 'relojes',
    price: 389000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'reloj-cuero',
    name: 'Reloj correa cuero',
    category: 'relojes',
    price: 549000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'reloj-smart',
    name: 'Smartwatch deportivo',
    category: 'relojes',
    price: 799000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
  },
  // Lociones
  {
    id: 'locion-citrus',
    name: 'Loción cítrica 100 ml',
    category: 'lociones',
    price: 89000,
    sizes: ['50 ml', '100 ml'],
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'locion-woody',
    name: 'Loción amaderada 100 ml',
    category: 'lociones',
    price: 119000,
    sizes: ['100 ml', '200 ml'],
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'locion-noche',
    name: 'Loción noche intensa 100 ml',
    category: 'lociones',
    price: 149000,
    sizes: ['50 ml', '100 ml', '200 ml'],
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
  },
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function categoryIcon(id: string): CategoryIcon {
  return CATEGORIES.find((c) => c.id === id)?.icon ?? 'prism-outline';
}

export function productsByCategory(id: string): Product[] {
  return products.filter((p) => p.category === id);
}

export const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
