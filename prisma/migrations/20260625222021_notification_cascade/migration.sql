-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_listId_fkey" FOREIGN KEY ("listId") REFERENCES "VotingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
