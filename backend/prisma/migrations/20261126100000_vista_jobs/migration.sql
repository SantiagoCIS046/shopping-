-- CreateTable
CREATE TABLE "VistaJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skus" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VistaJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VistaJob" ADD CONSTRAINT "VistaJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
