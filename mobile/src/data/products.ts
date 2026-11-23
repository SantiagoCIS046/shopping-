import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

// Catálogo de la tienda. Hoy vive en la app; más adelante vendrá de la API.
// Sin URL de imagen se muestra una plantilla elegante de la categoría
// (components/ProductImage), así la app se ve completa mientras
// llegan las fotos reales del local.

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
  { id: 'camiseta-blanca', name: 'Camiseta blanca premium', category: 'camisetas', price: 59000, sizes: ['S', 'M', 'L', 'XL'], image: null },
  { id: 'camiseta-negra', name: 'Camiseta negra cuello redondo', category: 'camisetas', price: 65000, sizes: ['S', 'M', 'L', 'XL'], image: null },
  { id: 'camiseta-grafica', name: 'Camiseta estampada urbana', category: 'camisetas', price: 72000, sizes: ['M', 'L', 'XL'], image: null },
  // Polos
  { id: 'polo-pique', name: 'Polo piqué clásico', category: 'polos', price: 89000, sizes: ['S', 'M', 'L'], image: null },
  { id: 'polo-largo', name: 'Polo manga larga', category: 'polos', price: 95000, sizes: ['M', 'L', 'XL'], image: null },
  { id: 'polo-rayas', name: 'Polo rayado marinero', category: 'polos', price: 105000, sizes: ['S', 'M', 'L'], image: null },
  // Oversize
  { id: 'oversize-blanca', name: 'Camiseta oversize blanca', category: 'oversize', price: 98000, sizes: ['S', 'M', 'L', 'XL'], image: null },
  { id: 'oversize-caqui', name: 'Camiseta oversize caquí', category: 'oversize', price: 115000, sizes: ['M', 'L', 'XL'], image: null },
  { id: 'oversize-capucha', name: 'Oversise con capucha', category: 'oversize', price: 124000, sizes: ['M', 'L', 'XL'], image: null },
  // Camisas de vestir
  { id: 'vestir-azul', name: 'Camisa azul oxford', category: 'camisas-vestir', price: 149000, sizes: ['15', '15.5', '16', '16.5'], image: null },
  { id: 'vestir-blanca', name: 'Camisa blanca lino', category: 'camisas-vestir', price: 169000, sizes: ['15', '15.5', '16', '17'], image: null },
  { id: 'vestir-negra', name: 'Camisa negra slim', category: 'camisas-vestir', price: 189000, sizes: ['15.5', '16', '16.5', '17'], image: null },
  // Deportiva
  { id: 'deportiva-camiseta', name: 'Camiseta dry-fit entrenamiento', category: 'deportiva', price: 119000, sizes: ['S', 'M', 'L', 'XL'], image: null },
  { id: 'deportiva-short', name: 'Short deportivo ligero', category: 'deportiva', price: 135000, sizes: ['S', 'M', 'L', 'XL'], image: null },
  { id: 'deportiva-conjunto', name: 'Conjunto gimnasio 2 piezas', category: 'deportiva', price: 149000, sizes: ['M', 'L', 'XL'], image: null },
  // Buzos
  { id: 'buzo-canguro', name: 'Buzo canguro con bolsillo', category: 'buzos', price: 129000, sizes: ['S', 'M', 'L', 'XL'], image: null },
  { id: 'buzo-cremallera', name: 'Buzo cremallera completa', category: 'buzos', price: 145000, sizes: ['M', 'L', 'XL'], image: null },
  { id: 'buzo-lana', name: 'Buzo lana tejida', category: 'buzos', price: 159000, sizes: ['M', 'L', 'XL'], image: null },
  // Sudaderas
  { id: 'sudadera-gris', name: 'Sudadera gris jogger', category: 'sudaderas', price: 109000, sizes: ['S', 'M', 'L', 'XL'], image: null },
  { id: 'sudadera-negra', name: 'Sudadera negra básica', category: 'sudaderas', price: 125000, sizes: ['M', 'L', 'XL'], image: null },
  { id: 'sudadera-degradado', name: 'Sudadera degradada', category: 'sudaderas', price: 139000, sizes: ['S', 'M', 'L'], image: null },
  // Jeans
  { id: 'jean-recto', name: 'Jean recto clásico', category: 'jeans', price: 139000, sizes: ['28', '30', '32', '34', '36'], image: null },
  { id: 'jean-skinny', name: 'Jean skinny elástico', category: 'jeans', price: 159000, sizes: ['28', '30', '32', '34'], image: null },
  { id: 'jean-wide', name: 'Jean wide leg', category: 'jeans', price: 179000, sizes: ['30', '32', '34', '36', '38'], image: null },
  // Zapatos
  { id: 'zapato-running', name: 'Tenis running livianos', category: 'zapatos', price: 229000, sizes: ['38', '39', '40', '41', '42', '43', '44'], image: null },
  { id: 'zapato-casual', name: 'Casual urbano piel', category: 'zapatos', price: 289000, sizes: ['39', '40', '41', '42', '43'], image: null },
  { id: 'zapato-botin', name: 'Botín cuero sintético', category: 'zapatos', price: 349000, sizes: ['38', '39', '40', '41', '42'], image: null },
  // Gafas
  { id: 'gafa-aviador', name: 'Gafas aviador espejo', category: 'gafas', price: 159000, sizes: ['Única'], image: null },
  { id: 'gafa-wayfarer', name: 'Gafas wayfarer clásicas', category: 'gafas', price: 199000, sizes: ['Única'], image: null },
  { id: 'gafa-deportiva', name: 'Gafas deportivas polarizadas', category: 'gafas', price: 259000, sizes: ['Única'], image: null },
  // Relojes
  { id: 'reloj-malla', name: 'Reloj malla acero', category: 'relojes', price: 389000, sizes: ['Única'], image: null },
  { id: 'reloj-cuero', name: 'Reloj correa cuero', category: 'relojes', price: 549000, sizes: ['Única'], image: null },
  { id: 'reloj-smart', name: 'Smartwatch deportivo', category: 'relojes', price: 799000, sizes: ['Única'], image: null },
  // Lociones
  { id: 'locion-citrus', name: 'Loción cítrica 100 ml', category: 'lociones', price: 89000, sizes: ['50 ml', '100 ml'], image: null },
  { id: 'locion-woody', name: 'Loción amaderada 100 ml', category: 'lociones', price: 119000, sizes: ['100 ml', '200 ml'], image: null },
  { id: 'locion-noche', name: 'Loción noche intensa 100 ml', category: 'lociones', price: 149000, sizes: ['50 ml', '100 ml', '200 ml'], image: null },
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
