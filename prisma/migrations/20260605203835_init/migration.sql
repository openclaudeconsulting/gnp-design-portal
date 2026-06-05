-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "siteCity" TEXT,
    "siteCounty" TEXT,
    "siteState" TEXT,
    "siteZip" TEXT,
    "designWindMph" INTEGER,
    "exposureCategory" TEXT,
    "riskCategory" TEXT,
    "widthFt" INTEGER,
    "lengthFt" INTEGER,
    "eaveHeightFt" INTEGER,
    "totalLow" REAL,
    "totalHigh" REAL,
    "configJson" TEXT NOT NULL,
    "quoteJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "sealedAt" DATETIME,
    "notes" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Job_siteState_idx" ON "Job"("siteState");
