import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

export type CatalogVariant = { size: string; available: number; price: number };

export type CatalogProduct = {
  id: string; // slug
  ref: string | null; // referencia pública opaca (la que ve el cliente)
  name: string;
  category: string; // slug de la categoría de prenda
  categoryName: string;
  audience: string;
  tags: string[];
  price: number; // mejor precio entre variantes
  discountPrice: number | null;
  image: string | null;
  isNew: boolean;
  sold: number;
  sizes: CatalogVariant[];
};

async function soldByProduct(): Promise<Map<string, number>> {
  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
  });
  // sku = "jean-recto--32" → slug del producto antes del "--"
  const map = new Map<string, number>();
  for (const row of grouped) {
    const slug = row.productId.split('--')[0];
    map.set(slug, (map.get(slug) ?? 0) + (row._sum.quantity ?? 0));
  }
  return map;
}

/** GET /catalog/categories — categorías activas + segmentos presentes */
router.get('/categories', async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  const audiences = await prisma.product.findMany({
    where: { categoryId: { not: null } },
    select: { audience: true },
    distinct: ['audience'],
  });

  res.json({
    // Pestañas de segmento (solo las que el local realmente maneja)
    segments: audiences.map((a) => a.audience),
    prendas: categories.filter((c) => c.type === 'prenda'),
    colecciones: categories.filter((c) => c.type === 'coleccion'),
  });
});

/**
 * GET /catalog/products — filtros y orden del catálogo:
 * segment, category, tag, size (talla con stock), minPrice/maxPrice,
 * new=1, sale=1, best=1 y sort (recientes|precio-asc|precio-desc|vendidos).
 */
router.get('/products', async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  const segment = q.segment && q.segment !== 'todo' ? q.segment : undefined;
  const category = q.category || undefined;
  const tag = q.tag || undefined;
  const size = q.size || undefined;
  const minPrice = q.minPrice ? Number(q.minPrice) : undefined;
  const maxPrice = q.maxPrice ? Number(q.maxPrice) : undefined;
  const onlyNew = q.new === '1';
  const onlySale = q.sale === '1';
  const onlyBest = q.best === '1';
  const sort = q.sort ?? 'recientes';
  // slugs=a,b → solo esos productos (la app pide el stock real de su carrito)
  const slugs = q.slugs ? q.slugs.split(',').filter(Boolean) : undefined;

  const where = {
    categoryId: { not: null },
    ...(slugs ? { slug: { in: slugs } } : {}),
    ...(segment ? { audience: segment } : {}),
    ...(category ? { categoryRef: { slug: category } } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(onlySale ? { discountPrice: { not: null } } : {}),
    ...(onlyNew ? { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    include: { variants: true, categoryRef: true },
    orderBy: sort === 'recientes' ? { createdAt: 'desc' } : undefined,
    take: 100,
  });

  const sold = await soldByProduct();

  let mapped: CatalogProduct[] = products.map((p) => {
    const price = Math.min(...p.variants.map((v) => v.price));
    const effective = p.discountPrice ?? price;
    return {
      id: p.slug,
      ref: p.publicRef,
      name: p.name,
      category: p.categoryRef?.slug ?? p.category,
      categoryName: p.categoryRef?.name ?? p.category,
      audience: p.audience,
      tags: p.tags,
      price,
      discountPrice: p.discountPrice,
      image: p.image,
      isNew: p.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      sold: sold.get(p.slug) ?? 0,
      sizes: p.variants
        .map((v) => ({
          size: v.size,
          available: Math.max(0, v.stock - v.reserved),
          price: p.discountPrice ?? v.price, // precio efectivo (oferta si aplica)
        }))
        .sort((a, b) => a.size.localeCompare(b.size, 'es', { numeric: true })),
    };
  });

  // Universo de tallas del contexto actual (sin aplicar el filtro de talla):
  // si el usuario está viendo Camisas, solo salen tallas de camisas;
  // si ve Zapatos, solo tallas de calzado. Se marca cuáles tienen stock.
  const sizeMap = new Map<string, boolean>();
  for (const p of mapped) {
    for (const s of p.sizes) {
      sizeMap.set(s.size, (sizeMap.get(s.size) ?? false) || s.available > 0);
    }
  }
  const sizes = [...sizeMap.entries()]
    .map(([sizeName, inStock]) => ({ size: sizeName, inStock }))
    .sort((a, b) => a.size.localeCompare(b.size, 'es', { numeric: true }));

  // Filtros que dependen del resultado mapeado
  if (size) {
    mapped = mapped.filter((p) => p.sizes.some((s) => s.size === size && s.available > 0));
  }
  if (minPrice !== undefined && !Number.isNaN(minPrice)) {
    mapped = mapped.filter((p) => (p.discountPrice ?? p.price) >= minPrice);
  }
  if (maxPrice !== undefined && !Number.isNaN(maxPrice)) {
    mapped = mapped.filter((p) => (p.discountPrice ?? p.price) <= maxPrice);
  }
  if (onlyBest) {
    mapped = mapped.filter((p) => p.sold > 0).sort((a, b) => b.sold - a.sold);
  }
  if (sort === 'precio-asc') {
    mapped.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
  }
  if (sort === 'precio-desc') {
    mapped.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
  }

  res.json({ products: mapped, sizes });
});

export default router;
