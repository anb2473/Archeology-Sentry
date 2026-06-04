-- AlterTable
ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "condition" TEXT NOT NULL DEFAULT 'outside';
ALTER TABLE "Alert" ALTER COLUMN "min" SET DATA TYPE DOUBLE PRECISION USING "min"::double precision;
ALTER TABLE "Alert" ALTER COLUMN "max" SET DATA TYPE DOUBLE PRECISION USING "max"::double precision;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AlertEvent" (
    "id" SERIAL NOT NULL,
    "alertId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
