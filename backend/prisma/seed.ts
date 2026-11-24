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
  // Camisetas
  {
    slug: 'camiseta-blanca',
    name: 'Camiseta blanca premium',
    category: 'camisetas',
    price: 59000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'camiseta-negra',
    name: 'Camiseta negra cuello redondo',
    category: 'camisetas',
    price: 65000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'camiseta-grafica',
    name: 'Camiseta estampada urbana',
    category: 'camisetas',
    price: 72000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
  },
  // Polos
  {
    slug: 'polo-pique',
    name: 'Polo piqué clásico',
    category: 'polos',
    price: 89000,
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1625910513413-5b8df7255963?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'polo-largo',
    name: 'Polo manga larga',
    category: 'polos',
    price: 95000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'polo-rayas',
    name: 'Polo rayado marinero',
    category: 'polos',
    price: 105000,
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
  },
  // Oversize
  {
    slug: 'oversize-blanca',
    name: 'Camiseta oversize blanca',
    category: 'oversize',
    price: 98000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'oversize-caqui',
    name: 'Camiseta oversize caquí',
    category: 'oversize',
    price: 115000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'oversize-capucha',
    name: 'Oversise con capucha',
    category: 'oversize',
    price: 124000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  },
  // Camisas de vestir
  {
    slug: 'vestir-azul',
    name: 'Camisa azul oxford',
    category: 'camisas-vestir',
    price: 149000,
    sizes: ['15', '15.5', '16', '16.5'],
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'vestir-blanca',
    name: 'Camisa blanca lino',
    category: 'camisas-vestir',
    price: 169000,
    sizes: ['15', '15.5', '16', '17'],
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'vestir-negra',
    name: 'Camisa negra slim',
    category: 'camisas-vestir',
    price: 189000,
    sizes: ['15.5', '16', '16.5', '17'],
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80',
  },
  // Deportiva
  {
    slug: 'deportiva-camiseta',
    name: 'Camiseta dry-fit entrenamiento',
    category: 'deportiva',
    price: 119000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'deportiva-short',
    name: 'Short deportivo ligero',
    category: 'deportiva',
    price: 135000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'deportiva-conjunto',
    name: 'Conjunto gimnasio 2 piezas',
    category: 'deportiva',
    price: 149000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  },
  // Buzos
  {
    slug: 'buzo-canguro',
    name: 'Buzo canguro con bolsillo',
    category: 'buzos',
    price: 129000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'buzo-cremallera',
    name: 'Buzo cremallera completa',
    category: 'buzos',
    price: 145000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'buzo-lana',
    name: 'Buzo lana tejida',
    category: 'buzos',
    price: 159000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=800&q=80',
  },
  // Sudaderas
  {
    slug: 'sudadera-gris',
    name: 'Sudadera gris jogger',
    category: 'sudaderas',
    price: 109000,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'sudadera-negra',
    name: 'Sudadera negra básica',
    category: 'sudaderas',
    price: 125000,
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'sudadera-degradado',
    name: 'Sudadera degradada',
    category: 'sudaderas',
    price: 139000,
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  },
  // Jeans
  {
    slug: 'jean-recto',
    name: 'Jean recto clásico',
    category: 'jeans',
    price: 139000,
    sizes: ['28', '30', '32', '34', '36'],
    image: 'https://images.unsplash.com/photo-1542272604-780c96856478?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'jean-skinny',
    name: 'Jean skinny elástico',
    category: 'jeans',
    price: 159000,
    sizes: ['28', '30', '32', '34'],
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'jean-wide',
    name: 'Jean wide leg',
    category: 'jeans',
    price: 179000,
    sizes: ['30', '32', '34', '36', '38'],
    image: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=800&q=80',
  },
  // Zapatos
  {
    slug: 'zapato-running',
    name: 'Tenis running livianos',
    category: 'zapatos',
    price: 229000,
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'zapato-casual',
    name: 'Casual urbano piel',
    category: 'zapatos',
    price: 289000,
    sizes: ['39', '40', '41', '42', '43'],
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'zapato-botin',
    name: 'Botín cuero sintético',
    category: 'zapatos',
    price: 349000,
    sizes: ['38', '39', '40', '41', '42'],
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80',
  },
  // Gafas
  {
    slug: 'gafa-aviador',
    name: 'Gafas aviador espejo',
    category: 'gafas',
    price: 159000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'gafa-wayfarer',
    name: 'Gafas wayfarer clásicas',
    category: 'gafas',
    price: 199000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'gafa-deportiva',
    name: 'Gafas deportivas polarizadas',
    category: 'gafas',
    price: 259000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80',
  },
  // Relojes
  {
    slug: 'reloj-malla',
    name: 'Reloj malla acero',
    category: 'relojes',
    price: 389000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'reloj-cuero',
    name: 'Reloj correa cuero',
    category: 'relojes',
    price: 549000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'reloj-smart',
    name: 'Smartwatch deportivo',
    category: 'relojes',
    price: 799000,
    sizes: ['Única'],
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
  },
  // Lociones
  {
    slug: 'locion-citrus',
    name: 'Loción cítrica 100 ml',
    category: 'lociones',
    price: 89000,
    sizes: ['50 ml', '100 ml'],
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'locion-woody',
    name: 'Loción amaderada 100 ml',
    category: 'lociones',
    price: 119000,
    sizes: ['100 ml', '200 ml'],
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'locion-noche',
    name: 'Loción noche intensa 100 ml',
    category: 'lociones',
    price: 149000,
    sizes: ['50 ml', '100 ml', '200 ml'],
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
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
