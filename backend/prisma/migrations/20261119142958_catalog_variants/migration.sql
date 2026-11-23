-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "shippingAddress" JSONB,
ADD COLUMN     "shippingCost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxName" TEXT NOT NULL DEFAULT 'IVA (19%)',
ALTER COLUMN "total" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "imageUrl",
DROP COLUMN "price",
DROP COLUMN "sizes",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "addresses" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'Única',
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: las ordenes existentes toman su id como numero de orden
UPDATE "Order" SET "orderNumber" = "id" WHERE "orderNumber" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
UPDATE "Product" SET "slug" = 'producto-' || "id" WHERE "slug" = '';
ALTER TABLE "Product" ALTER COLUMN "slug" DROP DEFAULT;
