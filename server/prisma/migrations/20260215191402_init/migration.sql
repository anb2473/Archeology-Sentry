/*
  Warnings:

  - You are about to drop the column `userId` on the `DataPoint` table. All the data in the column will be lost.
  - You are about to drop the column `x` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `y` on the `User` table. All the data in the column will be lost.
  - Added the required column `sensorId` to the `DataPoint` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."DataPoint" DROP CONSTRAINT "DataPoint_userId_fkey";

-- AlterTable
ALTER TABLE "DataPoint" DROP COLUMN "userId",
ADD COLUMN     "sensorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "x",
DROP COLUMN "y";

-- CreateTable
CREATE TABLE "Sensor" (
    "id" SERIAL NOT NULL,
    "x" INTEGER,
    "y" INTEGER,
    "name" TEXT NOT NULL,
    "passw" TEXT NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_name_key" ON "Sensor"("name");

-- AddForeignKey
ALTER TABLE "DataPoint" ADD CONSTRAINT "DataPoint_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
