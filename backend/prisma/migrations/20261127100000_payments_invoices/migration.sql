-- Documento del cliente y datos de factura electrónica
ALTER TABLE "Order" ADD COLUMN "customerDocType" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerDocNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "invoiceNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "invoiceStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "invoiceError" TEXT;
