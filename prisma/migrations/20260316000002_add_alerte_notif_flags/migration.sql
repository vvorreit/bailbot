-- Track J-30 and J-7 notification status to avoid duplicate sends
ALTER TABLE "AlerteBail" ADD COLUMN IF NOT EXISTS "notifJ30Envoyee" BOOLEAN DEFAULT false;
ALTER TABLE "AlerteBail" ADD COLUMN IF NOT EXISTS "notifJ7Envoyee" BOOLEAN DEFAULT false;
