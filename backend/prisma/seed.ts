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
};

const CATALOG: SeedProduct[] = [
  { slug: 'camiseta-blanca', name: 'Camiseta blanca premium', category: 'camisetas', price: 59000, sizes: ['S', 'M', 'L', 'XL'] },
  { slug: 'camiseta-negra', name: 'Camiseta negra cuello redondo', category: 'camisetas', price: 65000, sizes: ['S', 'M', 'L', 'XL'] },
  { slug: 'camiseta-grafica', name: 'Camiseta estampada urbana', category: 'camisetas', price: 72000, sizes: ['M', 'L', 'XL'] },
  { slug: 'polo-pique', name: 'Polo piqué clásico', category: 'polos', price: 89000, sizes: ['S', 'M', 'L'] },
  { slug: 'polo-largo', name: 'Polo manga larga', category: 'polos', price: 95000, sizes: ['M', 'L', 'XL'] },
  { slug: 'polo-rayas', name: 'Polo rayado marinero', category: 'polos', price: 105000, sizes: ['S', 'M', 'L'] },
  { slug: 'oversize-blanca', name: 'Camiseta oversize blanca', category: 'oversize', price: 98000, sizes: ['S', 'M', 'L', 'XL'] },
  { slug: 'oversize-caqui', name: 'Camiseta oversize caquí', category: 'oversize', price: 115000, sizes: ['M', 'L', 'XL'] },
  { slug: 'oversize-capucha', name: 'Oversise con capucha', category: 'oversize', price: 124000, sizes: ['M', 'L', 'XL'] },
  { slug: 'vestir-azul', name: 'Camisa azul oxford', category: 'camisas-vestir', price: 149000, sizes: ['15', '15.5', '16', '16.5'] },
  { slug: 'vestir-blanca', name: 'Camisa blanca lino', category: 'camisas-vestir', price: 169000, sizes: ['15', '15.5', '16', '17'] },
  { slug: 'vestir-negra', name: 'Camisa negra slim', category: 'camisas-vestir', price: 189000, sizes: ['15.5', '16', '16.5', '17'] },
  { slug: 'deportiva-camiseta', name: 'Camiseta dry-fit entrenamiento', category: 'deportiva', price: 119000, sizes: ['S', 'M', 'L', 'XL'] },
  { slug: 'deportiva-short', name: 'Short deportivo ligero', category: 'deportiva', price: 135000, sizes: ['S', 'M', 'L', 'XL'] },
  { slug: 'deportiva-conjunto', name: 'Conjunto gimnasio 2 piezas', category: 'deportiva', price: 149000, sizes: ['M', 'L', 'XL'] },
  { slug: 'buzo-canguro', name: 'Buzo canguro con bolsillo', category: 'buzos', price: 129000, sizes: ['S', 'M', 'L', 'XL'] },
  { slug: 'buzo-cremallera', name: 'Buzo cremallera completa', category: 'buzos', price: 145000, sizes: ['M', 'L', 'XL'] },
  { slug: 'buzo-lana', name: 'Buzo lana tejida', category: 'buzos', price: 159000, sizes: ['M', 'L', 'XL'] },
  { slug: 'sudadera-gris', name: 'Sudadera gris jogger', category: 'sudaderas', price: 109000, sizes: ['S', 'M', 'L', 'XL'] },
  { slug: 'sudadera-negra', name: 'Sudadera negra básica', category: 'sudaderas', price: 125000, sizes: ['M', 'L', 'XL'] },
  { slug: 'sudadera-degradado', name: 'Sudadera degradada', category: 'sudaderas', price: 139000, sizes: ['S', 'M', 'L'] },
  { slug: 'jean-recto', name: 'Jean recto clásico', category: 'jeans', price: 139000, sizes: ['28', '30', '32', '34', '36'] },
  { slug: 'jean-skinny', name: 'Jean skinny elástico', category: 'jeans', price: 159000, sizes: ['28', '30', '32', '34'] },
  { slug: 'jean-wide', name: 'Jean wide leg', category: 'jeans', price: 179000, sizes: ['30', '32', '34', '36', '38'] },
  { slug: 'zapato-running', name: 'Tenis running livianos', category: 'zapatos', price: 229000, sizes: ['38', '39', '40', '41', '42', '43', '44'] },
  { slug: 'zapato-casual', name: 'Casual urbano piel', category: 'zapatos', price: 289000, sizes: ['39', '40', '41', '42', '43'] },
  { slug: 'zapato-botin', name: 'Botín cuero sintético', category: 'zapatos', price: 349000, sizes: ['38', '39', '40', '41', '42'] },
  { slug: 'gafa-aviador', name: 'Gafas aviador espejo', category: 'gafas', price: 159000, sizes: ['Única'] },
  { slug: 'gafa-wayfarer', name: 'Gafas wayfarer clásicas', category: 'gafas', price: 199000, sizes: ['Única'] },
  { slug: 'gafa-deportiva', name: 'Gafas deportivas polarizadas', category: 'gafas', price: 259000, sizes: ['Única'] },
  { slug: 'reloj-malla', name: 'Reloj malla acero', category: 'relojes', price: 389000, sizes: ['Única'] },
  { slug: 'reloj-cuero', name: 'Reloj correa cuero', category: 'relojes', price: 549000, sizes: ['Única'] },
  { slug: 'reloj-smart', name: 'Smartwatch deportivo', category: 'relojes', price: 799000, sizes: ['Única'] },
  { slug: 'locion-citrus', name: 'Loción cítrica 100 ml', category: 'lociones', price: 89000, sizes: ['50 ml', '100 ml'] },
  { slug: 'locion-woody', name: 'Loción amaderada 100 ml', category: 'lociones', price: 119000, sizes: ['100 ml', '200 ml'] },
  { slug: 'locion-noche', name: 'Loción noche intensa 100 ml', category: 'lociones', price: 149000, sizes: ['50 ml', '100 ml', '200 ml'] },
];

async function main() {
  console.log('Sembrando catálogo…');

  for (const [index, item] of CATALOG.entries()) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: { name: item.name, category: item.category },
      create: { slug: item.slug, name: item.name, category: item.category },
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
