// Asigna una referencia pública opaca a todos los productos que aún no la tienen.
// Uso: npx tsx scripts/fill-public-refs.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { publicRefFor } from '../src/productRef';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ where: { publicRef: null }, select: { id: true, slug: true } });
  for (const p of products) {
    await prisma.product.update({ where: { id: p.id }, data: { publicRef: publicRefFor(p.slug) } });
  }
  console.log(`Referencias asignadas: ${products.length}`);
}

main().finally(() => prisma.$disconnect());
