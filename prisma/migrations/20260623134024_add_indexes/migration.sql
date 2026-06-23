-- CreateIndex
CREATE INDEX "Option_listId_idx" ON "Option"("listId");

-- CreateIndex
CREATE INDEX "Participant_listId_idx" ON "Participant"("listId");

-- CreateIndex
CREATE INDEX "Vote_optionId_idx" ON "Vote"("optionId");
