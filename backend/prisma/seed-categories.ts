import { PrismaClient } from '@prisma/client';

/**
 * Semilla de categorías dinámicas y metadatos de producto:
 * - Categorías de prenda (nivel 2, configurables por cada local)
 * - Colecciones (nivel A de la home: Básicos, Streetwear, Deportivo)
 * - Segmento (audience), etiquetas de estilo y precios de oferta
 */
const prisma = new PrismaClient();

const GARMENT_CATEGORIES: Array<{ slug: string; name: string }> = [
  { slug: 'camisetas', name: 'Camisetas' },
  { slug: 'polos', name: 'Polos' },
  { slug: 'oversize', name: 'Oversize' },
  { slug: 'camisas-vestir', name: 'Camisas de vestir' },
  { slug: 'deportiva', name: 'Deportiva' },
  { slug: 'buzos', name: 'Buzos' },
  { slug: 'sudaderas', name: 'Sudaderas' },
  { slug: 'jeans', name: 'Jeans' },
  { slug: 'zapatos', name: 'Zapatos' },
  { slug: 'gafas', name: 'Gafas' },
  { slug: 'relojes', name: 'Relojes' },
  { slug: 'lociones', name: 'Lociones' },
];

const COLLECTIONS: Array<{ slug: string; name: string; tag: string }> = [
  { slug: 'basicos', name: 'Básicos', tag: '#basico' },
  { slug: 'streetwear', name: 'Streetwear', tag: '#urbano' },
  { slug: 'deportivo', name: 'Deportivo', tag: '#gym' },
];

// Segmento por slug de producto (los no listados quedan unisex)
const AUDIENCE: Record<string, string> = {
  'vestir-azul': 'hombre',
  'vestir-blanca': 'mujer',
  'vestir-negra': 'hombre',
  'polo-pique': 'hombre',
  'buzo-cremallera': 'hombre',
  'sudadera-degradado': 'mujer',
  'gafa-wayfarer': 'mujer',
};

// Etiquetas por categoría de prenda (+ extra por slug)
const TAGS_BY_CATEGORY: Record<string, string[]> = {
  camisetas: ['#basico'],
  polos: ['#casual'],
  oversize: ['#urbano'],
  'camisas-vestir': ['#formal', '#casual'],
  deportiva: ['#gym'],
  buzos: ['#urbano', '#casual'],
  sudaderas: ['#urbano', '#casual'],
  jeans: ['#casual'],
  zapatos: ['#urbano'],
  gafas: ['#accesorio'],
  relojes: ['#accesorio', '#formal'],
  lociones: ['#accesorio'],
};
const EXTRA_TAGS: Record<string, string[]> = {
  'camiseta-grafica': ['#urbano'],
  'jean-skinny': ['#urbano'],
  'zapato-running': ['#gym'],
  'deportiva-camiseta': ['#basico'],
};

// Ofertas activas (precio rebajado — alimentan la burbuja Ofertas)
const DISCOUNTS: Record<string, number> = {
  'camiseta-blanca': 49000,
  'jean-recto': 109000,
  'polo-rayas': 89000,
};

async function main() {
  console.log('Sembrando categorías dinámicas…');

  for (const [index, cat] of GARMENT_CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, type: 'prenda', displayOrder: index },
      create: { slug: cat.slug, name: cat.name, type: 'prenda', displayOrder: index },
    });
  }

  for (const [index, col] of COLLECTIONS.entries()) {
    await prisma.category.upsert({
      where: { slug: col.slug },
      update: { name: col.name, type: 'coleccion', displayOrder: 100 + index },
      create: { slug: col.slug, name: col.name, type: 'coleccion', displayOrder: 100 + index },
    });
  }

  const all = await prisma.product.findMany();
  for (const product of all) {
    const categorySlug = product.category || 'camisetas';
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    const tags = [...(TAGS_BY_CATEGORY[categorySlug] ?? []), ...(EXTRA_TAGS[product.slug] ?? [])];
    await prisma.product.update({
      where: { id: product.id },
      data: {
        categoryId: category?.id ?? null,
        audience: AUDIENCE[product.slug] ?? 'unisex',
        tags,
        discountPrice: DISCOUNTS[product.slug] ?? null,
      },
    });
  }

  const counts = {
    prendas: await prisma.category.count({ where: { type: 'prenda' } }),
    colecciones: await prisma.category.count({ where: { type: 'coleccion' } }),
    productos: await prisma.product.count(),
    ofertas: await prisma.product.count({ where: { discountPrice: { not: null } } }),
  };
  console.log('Listo:', JSON.stringify(counts));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
