-- Add candidate email to DepotToken for automatic capture during file deposit
ALTER TABLE "DepotToken" ADD COLUMN IF NOT EXISTS "candidatEmail" VARCHAR(255);
