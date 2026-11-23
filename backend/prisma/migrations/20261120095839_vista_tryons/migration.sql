-- CreateTable
CREATE TABLE "TryOn" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "skus" TEXT[],
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TryOn" ADD CONSTRAINT "TryOn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

