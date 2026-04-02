-- DropIndex
DROP INDEX "collections_name_key";

-- CreateIndex
CREATE INDEX "art_pieces_userId_idx" ON "art_pieces"("userId");

-- CreateIndex
CREATE INDEX "art_pieces_collectionId_idx" ON "art_pieces"("collectionId");

-- CreateIndex
CREATE INDEX "art_pieces_userId_createdAt_idx" ON "art_pieces"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "art_pieces_userId_isFavorite_idx" ON "art_pieces"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "art_pieces_userId_mediaType_idx" ON "art_pieces"("userId", "mediaType");

-- CreateIndex
CREATE INDEX "collections_userId_idx" ON "collections"("userId");

-- CreateIndex
CREATE INDEX "collections_parentId_idx" ON "collections"("parentId");

-- CreateIndex
CREATE INDEX "notes_artPieceId_idx" ON "notes"("artPieceId");

-- CreateIndex
CREATE INDEX "notes_userId_idx" ON "notes"("userId");
