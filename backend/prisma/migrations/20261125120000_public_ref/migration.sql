ALTER TABLE "Product" ADD COLUMN "publicRef" TEXT;
CREATE UNIQUE INDEX "Product_publicRef_key" ON "Product"("publicRef");
