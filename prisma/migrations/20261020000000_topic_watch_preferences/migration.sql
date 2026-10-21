-- Preserve existing watches; false rows record explicit topic opt-outs.
ALTER TABLE "forums"."TopicWatch" ADD COLUMN "watching" BOOLEAN NOT NULL DEFAULT true;
