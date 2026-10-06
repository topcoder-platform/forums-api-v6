-- Additive only: no existing Topic, Post, watch, read-state, or challenge rows change.
CREATE TABLE "forums"."PublicForumCategory" (
 "topicId" VARCHAR(14) PRIMARY KEY REFERENCES "forums"."Topic"("id"),
 "description" TEXT NOT NULL DEFAULT '', "displayAs" VARCHAR(16) NOT NULL,
 "sortOrder" INTEGER NOT NULL, "readRoles" TEXT[] NOT NULL,
 "createRoles" TEXT[] NOT NULL, "replyRoles" TEXT[] NOT NULL,
 "legacyId" INTEGER NOT NULL UNIQUE, "legacySlug" TEXT NOT NULL, "source" JSONB NOT NULL,
 CONSTRAINT "PublicForumCategory_displayAs_check" CHECK ("displayAs" IN ('Categories','Discussions'))
);
CREATE TABLE "forums"."PublicForumRoleMember" (
 "roleName" VARCHAR(128) NOT NULL, "memberId" VARCHAR(64) NOT NULL,
 PRIMARY KEY ("roleName", "memberId")
);
CREATE INDEX "PublicForumRoleMember_memberId_idx" ON "forums"."PublicForumRoleMember"("memberId");
CREATE TABLE "forums"."PublicForumImportRecord" (
 "entityType" VARCHAR(32) NOT NULL, "sourceId" VARCHAR(64) NOT NULL,
 "targetId" VARCHAR(64) NOT NULL, "sourceHash" VARCHAR(64) NOT NULL,
 "targetHash" VARCHAR(64) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY ("entityType", "sourceId"), UNIQUE ("entityType", "targetId")
);
