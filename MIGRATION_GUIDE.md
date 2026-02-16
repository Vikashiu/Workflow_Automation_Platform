/**
 * Migration Helper for Template Resolution
 * Run these steps to apply the schema changes to your database
 */

/*
 * MIGRATION STEPS:
 *
 * 1. After updating schema.prisma files, run in each backend directory:
 *
 *    cd primaryBackend
 *    npx prisma migrate dev --name add_templates_and_payload
 *
 *    cd ../hooks
 *    npx prisma migrate dev --name add_templates_and_payload
 *
 *    cd ../worker
 *    npx prisma migrate dev --name add_templates_and_payload
 *
 *    cd ../processor
 *    npx prisma migrate dev --name add_templates_and_payload
 *
 * 2. If you encounter issues, you can reset (WARNING: deletes all data):
 *
 *    npx prisma migrate reset --force
 *
 * 3. Verify the migrations ran successfully:
 *
 *    npx prisma migrate status
 *
 * SCHEMA CHANGES:
 * 
 * Trigger table:
 *   + samplePayload JSON DEFAULT '{}'
 *
 * ZapRun table:
 *   + payload JSON DEFAULT '{}'
 */

// SQL equivalent (if migrations fail):

/*
-- Add samplePayload to Trigger
ALTER TABLE "Trigger" ADD COLUMN "samplePayload" JSONB DEFAULT '{}';

-- Add payload to ZapRun
ALTER TABLE "ZapRun" ADD COLUMN "payload" JSONB DEFAULT '{}';

-- Create indexes for performance (optional)
CREATE INDEX "ZapRun_payload" ON "ZapRun" USING GIN ("payload");
CREATE INDEX "Trigger_samplePayload" ON "Trigger" USING GIN ("samplePayload");
*/
