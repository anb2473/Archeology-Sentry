-- CreateTable
CREATE TABLE "Alert" (
    "sensorId" INTEGER NOT NULL,
    "datatype" TEXT,
    "min" INTEGER,
    "max" INTEGER,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "id" SERIAL NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Alert_name_key" ON "Alert"("name");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
