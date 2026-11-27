-- Datos de pago y envío guardados en el perfil del usuario
ALTER TABLE "User" ADD COLUMN "docType" TEXT;
ALTER TABLE "User" ADD COLUMN "docNumber" TEXT;
