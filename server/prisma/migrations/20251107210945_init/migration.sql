/*
  Warnings:

  - You are about to drop the column `humidity` on the `DataPoint` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `DataPoint` table. All the data in the column will be lost.
  - Added the required column `type` to the `DataPoint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `DataPoint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DataPoint" DROP COLUMN "humidity",
DROP COLUMN "temperature",
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passw" TEXT NOT NULL,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
