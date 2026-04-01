-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "parentId" TEXT;

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "artPieceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_artPieceId_fkey" FOREIGN KEY ("artPieceId") REFERENCES "art_pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
