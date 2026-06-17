-- CreateTable
CREATE TABLE "SystemSnapshot" (
    "id" SERIAL NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpuPct" DOUBLE PRECISION NOT NULL,
    "memPct" DOUBLE PRECISION NOT NULL,
    "swapPct" DOUBLE PRECISION,
    "tempC" DOUBLE PRECISION,
    "powerW" DOUBLE PRECISION,
    "batteryPct" DOUBLE PRECISION,

    CONSTRAINT "SystemSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemSnapshot_capturedAt_idx" ON "SystemSnapshot"("capturedAt");
