// Datos de ejemplo. Más adelante esto vendrá de Firestore (o de tu backend).

export type Product = {
  id: string;
  name: string;
  category: 'chaquetas' | 'jeans' | 'vestidos' | 'blusas' | 'camisas';
  price: number; // en pesos colombianos
  sizes: Array<'S' | 'M' | 'L' | 'XL'>;
  image: string; // URL o require() de la foto del producto
  cutoutImage?: string; // versión sin fondo para el probador
};

export const products: Product[] = [
  {
    id: 'chaqueta-lino',
    name: 'Chaqueta de lino',
    category: 'chaquetas',
    price: 189000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://example.com/chaqueta-lino.jpg',
  },
  {
    id: 'jean-recto',
    name: 'Jean recto',
    category: 'jeans',
    price: 139000,
    sizes: ['S', 'M', 'L'],
    image: 'https://example.com/jean-recto.jpg',
  },
  {
    id: 'vestido-midi',
    name: 'Vestido midi',
    category: 'vestidos',
    price: 219000,
    sizes: ['S', 'M', 'L'],
    image: 'https://example.com/vestido-midi.jpg',
  },
];

export const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
