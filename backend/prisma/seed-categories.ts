import { PrismaClient } from '@prisma/client';

/**
 * Semilla de categorías dinámicas y metadatos de producto:
 * - Categorías de prenda (nivel 2, configurables por cada local)
 * - Colecciones (nivel A de la home: Básicos, Streetwear, Deportivo)
 * - Segmento (audience), etiquetas de estilo y precios de oferta
 */
const prisma = new PrismaClient();

const GARMENT_CATEGORIES: Array<{ slug: string; name: string; imageUrl: string }> = [
  {
    slug: 'camisetas',
    name: 'Camisetas',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'polos',
    name: 'Polos',
    imageUrl: 'https://images.unsplash.com/photo-1625910513413-5b8df7255963?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'oversize',
    name: 'Oversize',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'camisas-vestir',
    name: 'Camisas de vestir',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'deportiva',
    name: 'Deportiva',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'buzos',
    name: 'Buzos',
    imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'sudaderas',
    name: 'Sudaderas',
    imageUrl: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'jeans',
    name: 'Jeans',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856478?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'zapatos',
    name: 'Zapatos',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'gafas',
    name: 'Gafas',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'relojes',
    name: 'Relojes',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'lociones',
    name: 'Lociones',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
  },
];

const COLLECTIONS: Array<{ slug: string; name: string; tag: string; imageUrl: string }> = [
  {
    slug: 'basicos',
    name: 'Básicos',
    tag: '#basico',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'streetwear',
    name: 'Streetwear',
    tag: '#urbano',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'deportivo',
    name: 'Deportivo',
    tag: '#gym',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
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
      update: { name: cat.name, type: 'prenda', displayOrder: index, imageUrl: cat.imageUrl },
      create: { slug: cat.slug, name: cat.name, type: 'prenda', displayOrder: index, imageUrl: cat.imageUrl },
    });
  }

  for (const [index, col] of COLLECTIONS.entries()) {
    await prisma.category.upsert({
      where: { slug: col.slug },
      update: { name: col.name, type: 'coleccion', displayOrder: 100 + index, imageUrl: col.imageUrl },
      create: { slug: col.slug, name: col.name, type: 'coleccion', displayOrder: 100 + index, imageUrl: col.imageUrl },
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

  const catCount = await prisma.category.count();
  console.log(`Listo: ${catCount} categorías dinámicas sembradas.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
