-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_listId_fkey";

-- RenameTable
ALTER TABLE "Candidate" RENAME TO "Option";

-- RenameColumn
ALTER TABLE "Vote" RENAME COLUMN "candidateId" TO "optionId";

-- RenameIndex
ALTER INDEX "Vote_voterId_candidateId_key" RENAME TO "Vote_voterId_optionId_key";

-- RenameConstraint (PK constraint stays with old table name after RENAME)
ALTER INDEX "Candidate_pkey" RENAME TO "Option_pkey";

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_listId_fkey" FOREIGN KEY ("listId") REFERENCES "VotingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
