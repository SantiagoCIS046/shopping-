-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "reserved" INTEGER NOT NULL DEFAULT 0;

