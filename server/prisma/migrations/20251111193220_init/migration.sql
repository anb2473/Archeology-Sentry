/*
  Warnings:

  - Added the required column `userId` to the `DataPoint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DataPoint" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "DataPoint" ADD CONSTRAINT "DataPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
