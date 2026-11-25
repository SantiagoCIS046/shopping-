import { PrismaClient } from '@prisma/client';

/**
 * Semilla del catálogo: crea los productos y una variante por talla
 * con precio y stock propios. Precios y tallas espejan el catálogo
 * de la app (mobile/src/data/products.ts); el backend es la fuente
 * de verdad de precio y stock.
 */
const prisma = new PrismaClient();

type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  price: number;
  sizes: string[];
  image: string;
};

const CATALOG: SeedProduct[] = [
  // 01 Camisetas
  {
    slug: 'camiseta-blanca',
    name: 'Camiseta blanca premium',
    category: 'camisetas',
    price: 59000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/camisetas-01.jpg',
  },
  {
    slug: 'camiseta-negra',
    name: 'Camiseta negra cuello redondo',
    category: 'camisetas',
    price: 65000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/camisetas-02.jpg',
  },
  {
    slug: 'camiseta-grafica',
    name: 'Camiseta estampada urbana',
    category: 'camisetas',
    price: 72000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/camisetas-03.jpg',
  },
  // 02 Polos
  {
    slug: 'polo-pique',
    name: 'Polo piqué clásico',
    category: 'polos',
    price: 89000,
    sizes: ['S', 'M', 'L'],
    image: '/uploads/products/polos-01.jpg',
  },
  {
    slug: 'polo-largo',
    name: 'Polo manga larga',
    category: 'polos',
    price: 95000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/polos-02.jpg',
  },
  {
    slug: 'polo-rayas',
    name: 'Polo rayado marinero',
    category: 'polos',
    price: 105000,
    sizes: ['S', 'M', 'L'],
    image: '/uploads/products/polos-03.jpg',
  },
  // 03 Oversize
  {
    slug: 'oversize-blanca',
    name: 'Camiseta oversize blanca',
    category: 'oversize',
    price: 98000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/oversize-01.jpg',
  },
  {
    slug: 'oversize-caqui',
    name: 'Camiseta oversize caquí',
    category: 'oversize',
    price: 115000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/oversize-02.jpg',
  },
  {
    slug: 'oversize-capucha',
    name: 'Oversise con capucha',
    category: 'oversize',
    price: 124000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/oversize-03.jpg',
  },
  // 04 Camisas de vestir
  {
    slug: 'vestir-azul',
    name: 'Camisa azul oxford',
    category: 'camisas-vestir',
    price: 149000,
    sizes: ['15', '15.5', '16', '16.5'],
    image: '/uploads/products/camisas-de-vestir-01.jpg',
  },
  {
    slug: 'vestir-blanca',
    name: 'Camisa blanca lino',
    category: 'camisas-vestir',
    price: 169000,
    sizes: ['15', '15.5', '16', '17'],
    image: '/uploads/products/camisas-de-vestir-02.jpg',
  },
  {
    slug: 'vestir-negra',
    name: 'Camisa negra slim',
    category: 'camisas-vestir',
    price: 189000,
    sizes: ['15.5', '16', '16.5', '17'],
    image: '/uploads/products/camisas-de-vestir-03.jpg',
  },
  // 05 Deportiva
  {
    slug: 'deportiva-camiseta',
    name: 'Camiseta dry-fit entrenamiento',
    category: 'deportiva',
    price: 119000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/deportiva-01.jpg',
  },
  {
    slug: 'deportiva-short',
    name: 'Short deportivo ligero',
    category: 'deportiva',
    price: 135000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/deportiva-02.jpg',
  },
  {
    slug: 'deportiva-conjunto',
    name: 'Conjunto gimnasio 2 piezas',
    category: 'deportiva',
    price: 149000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/deportiva-03.jpg',
  },
  // 06 Buzos
  {
    slug: 'buzo-canguro',
    name: 'Buzo canguro con bolsillo',
    category: 'buzos',
    price: 129000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/buzos-01.jpg',
  },
  {
    slug: 'buzo-cremallera',
    name: 'Buzo cremallera completa',
    category: 'buzos',
    price: 145000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/buzos-02.jpg',
  },
  {
    slug: 'buzo-lana',
    name: 'Buzo lana tejida',
    category: 'buzos',
    price: 159000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/buzos-03.jpg',
  },
  // 07 Sudaderas
  {
    slug: 'sudadera-gris',
    name: 'Sudadera gris jogger',
    category: 'sudaderas',
    price: 109000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/uploads/products/sudaderas-01.jpg',
  },
  {
    slug: 'sudadera-negra',
    name: 'Sudadera negra básica',
    category: 'sudaderas',
    price: 125000,
    sizes: ['M', 'L', 'XL'],
    image: '/uploads/products/sudaderas-02.jpg',
  },
  {
    slug: 'sudadera-degradado',
    name: 'Sudadera degradada',
    category: 'sudaderas',
    price: 139000,
    sizes: ['S', 'M', 'L'],
    image: '/uploads/products/sudaderas-03.jpg',
  },
  // 08 Jeans
  {
    slug: 'jean-recto',
    name: 'Jean recto clásico',
    category: 'jeans',
    price: 139000,
    sizes: ['28', '30', '32', '34', '36'],
    image: '/uploads/products/jeans-01.jpg',
  },
  {
    slug: 'jean-skinny',
    name: 'Jean skinny elástico',
    category: 'jeans',
    price: 159000,
    sizes: ['28', '30', '32', '34'],
    image: '/uploads/products/jeans-02.jpg',
  },
  {
    slug: 'jean-wide',
    name: 'Jean wide leg',
    category: 'jeans',
    price: 179000,
    sizes: ['30', '32', '34', '36', '38'],
    image: '/uploads/products/jeans-03.jpg',
  },
  // 09 Zapatos
  {
    slug: 'zapato-running',
    name: 'Tenis running livianos',
    category: 'zapatos',
    price: 229000,
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    image: '/uploads/products/zapatos-01.jpg',
  },
  {
    slug: 'zapato-casual',
    name: 'Casual urbano piel',
    category: 'zapatos',
    price: 289000,
    sizes: ['39', '40', '41', '42', '43'],
    image: '/uploads/products/zapatos-02.jpg',
  },
  {
    slug: 'zapato-botin',
    name: 'Botín cuero sintético',
    category: 'zapatos',
    price: 349000,
    sizes: ['38', '39', '40', '41', '42'],
    image: '/uploads/products/zapatos-03.jpg',
  },
  // 10 Gafas
  {
    slug: 'gafa-aviador',
    name: 'Gafas aviador espejo',
    category: 'gafas',
    price: 159000,
    sizes: ['Única'],
    image: '/uploads/products/gafas-01.jpg',
  },
  {
    slug: 'gafa-wayfarer',
    name: 'Gafas wayfarer clásicas',
    category: 'gafas',
    price: 199000,
    sizes: ['Única'],
    image: '/uploads/products/gafas-02.jpg',
  },
  {
    slug: 'gafa-deportiva',
    name: 'Gafas deportivas polarizadas',
    category: 'gafas',
    price: 259000,
    sizes: ['Única'],
    image: '/uploads/products/gafas-03.jpg',
  },
  // 11 Relojes
  {
    slug: 'reloj-malla',
    name: 'Reloj malla acero',
    category: 'relojes',
    price: 389000,
    sizes: ['Única'],
    image: '/uploads/products/relojes-01.jpg',
  },
  {
    slug: 'reloj-cuero',
    name: 'Reloj correa cuero',
    category: 'relojes',
    price: 549000,
    sizes: ['Única'],
    image: '/uploads/products/relojes-02.jpg',
  },
  {
    slug: 'reloj-smart',
    name: 'Smartwatch deportivo',
    category: 'relojes',
    price: 799000,
    sizes: ['Única'],
    image: '/uploads/products/relojes-03.jpg',
  },
  // 12 Lociones
  {
    slug: 'locion-citrus',
    name: 'Loción cítrica 100 ml',
    category: 'lociones',
    price: 89000,
    sizes: ['50 ml', '100 ml'],
    image: '/uploads/products/lociones-01.jpg',
  },
  {
    slug: 'locion-woody',
    name: 'Loción amaderada 100 ml',
    category: 'lociones',
    price: 119000,
    sizes: ['100 ml', '200 ml'],
    image: '/uploads/products/lociones-02.jpg',
  },
  {
    slug: 'locion-noche',
    name: 'Loción noche intensa 100 ml',
    category: 'lociones',
    price: 149000,
    sizes: ['50 ml', '100 ml', '200 ml'],
    image: '/uploads/products/lociones-03.jpg',
  },
];

async function main() {
  console.log('Sembrando catálogo…');

  for (const [index, item] of CATALOG.entries()) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: { name: item.name, category: item.category, image: item.image },
      create: { slug: item.slug, name: item.name, category: item.category, image: item.image },
    });

    for (const size of item.sizes) {
      const sku = `${item.slug}--${size}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: { price: item.price, size },
        create: {
          sku,
          productId: product.id,
          size,
          price: item.price,
          stock: 12 + ((index + size.length) % 3) * 6, // 12-24 unidades
        },
      });
    }
  }

  const variants = await prisma.productVariant.count();
  console.log(`Listo: ${CATALOG.length} productos, ${variants} variantes con stock.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
