-- AlterTable: Add Yousign fields to SignatureRequest
ALTER TABLE "SignatureRequest" ADD COLUMN IF NOT EXISTS "yousignRequestId" TEXT;
ALTER TABLE "SignatureRequest" ADD COLUMN IF NOT EXISTS "yousignStatus" TEXT;
ALTER TABLE "SignatureRequest" ADD COLUMN IF NOT EXISTS "certificatUrl" TEXT;

-- CreateIndex: Unique on yousignRequestId
CREATE UNIQUE INDEX IF NOT EXISTS "SignatureRequest_yousignRequestId_key" ON "SignatureRequest"("yousignRequestId");

-- CreateTable: CronRun for monitoring cron executions
CREATE TABLE IF NOT EXISTS "CronRun" (
    "id" TEXT NOT NULL,
    "cronName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,

    CONSTRAINT "CronRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CronRun_cronName_idx" ON "CronRun"("cronName");
CREATE INDEX IF NOT EXISTS "CronRun_startedAt_idx" ON "CronRun"("startedAt");
