import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

/**
 * SOLO PARA PRUEBAS DE PAGO: pone todas las variantes y ofertas en $1.000.
 * Antes guarda los precios originales en un JSON para poder restaurarlos.
 * Uso: npx tsx scripts/set-test-prices.ts
 */
const prisma = new PrismaClient();
const TEST_PRICE = 1000;

async function main() {
  const products = await prisma.product.findMany({ include: { variants: true } });

  const backup = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    discountPrice: p.discountPrice,
    variants: p.variants.map((v) => ({ id: v.id, sku: v.sku, price: v.price })),
  }));
  const backupPath = path.join(__dirname, 'prices-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { discountPrice: p.discountPrice === null ? null : TEST_PRICE },
    });
    await prisma.productVariant.updateMany({
      where: { productId: p.id },
      data: { price: TEST_PRICE },
    });
  }

  console.log(`Productos actualizados: ${products.length}`);
  console.log(`Respaldo de precios originales: ${backupPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
