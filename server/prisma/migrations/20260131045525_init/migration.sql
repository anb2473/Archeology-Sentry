-- AlterTable
ALTER TABLE "User" ADD COLUMN     "x" INTEGER,
ADD COLUMN     "y" INTEGER;

-- CreateTable
CREATE TABLE "Boundary" (
    "id" SERIAL NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,

    CONSTRAINT "Boundary_pkey" PRIMARY KEY ("id")
);
