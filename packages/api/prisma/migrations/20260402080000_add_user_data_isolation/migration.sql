-- Create a default admin user for existing data
INSERT INTO "users" ("id", "username", "passwordHash", "role", "createdAt", "updatedAt")
SELECT 'default-admin', 'admin', '$2b$10$placeholder', 'SUPERADMIN', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "users" LIMIT 1);

-- Add userId columns (nullable first)
ALTER TABLE "art_pieces" ADD COLUMN "userId" TEXT;
ALTER TABLE "collections" ADD COLUMN "userId" TEXT;
ALTER TABLE "notes" ADD COLUMN "userId" TEXT;

-- Assign existing data to the first admin user
UPDATE "art_pieces" SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1) WHERE "userId" IS NULL;
UPDATE "collections" SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1) WHERE "userId" IS NULL;
UPDATE "notes" SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1) WHERE "userId" IS NULL;

-- Make userId NOT NULL
ALTER TABLE "art_pieces" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "collections" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "notes" ALTER COLUMN "userId" SET NOT NULL;

-- Drop old unique constraint on collection name
ALTER TABLE "collections" DROP CONSTRAINT IF EXISTS "collections_name_key";

-- Add new unique constraint (name per user)
CREATE UNIQUE INDEX "collections_name_userId_key" ON "collections"("name", "userId");

-- Add foreign keys
ALTER TABLE "art_pieces" ADD CONSTRAINT "art_pieces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
