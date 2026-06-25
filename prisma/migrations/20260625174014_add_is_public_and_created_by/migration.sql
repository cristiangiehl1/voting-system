/*
  Warnings:

  - Added the required column `createdById` to the `Option` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VotingList" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
