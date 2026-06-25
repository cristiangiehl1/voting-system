-- AlterTable: add nullable first
ALTER TABLE "Option" ADD COLUMN "createdById" TEXT;

-- Backfill existing options with the list owner's ID
UPDATE "Option"
SET "createdById" = "VotingList"."createdById"
FROM "VotingList"
WHERE "Option"."listId" = "VotingList"."id";

-- Now safe to set NOT NULL
ALTER TABLE "Option" ALTER COLUMN "createdById" SET NOT NULL;

-- AlterTable
ALTER TABLE "VotingList" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
