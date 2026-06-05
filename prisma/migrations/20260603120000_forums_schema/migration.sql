-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "forums";

-- Add nanoid support for dbgenerated("nanoid()") defaults.
CREATE OR REPLACE FUNCTION nanoid(size int DEFAULT 14)
RETURNS text AS $$
DECLARE
  id text := '';
  i int := 0;
  urlAlphabet char(64) := 'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW';
  randomHex text;
  byteValue int;
BEGIN
  IF size IS NULL OR size < 1 THEN
    RAISE EXCEPTION 'nanoid size must be >= 1';
  END IF;

  WHILE i < size LOOP
    randomHex := md5(random()::text || clock_timestamp()::text || i::text);
    byteValue := ('x' || substr(randomHex, 1, 2))::bit(8)::int;
    id := id || substr(urlAlphabet, (byteValue & 63) + 1, 1);
    i := i + 1;
  END LOOP;

  RETURN id;
END
$$ LANGUAGE PLPGSQL VOLATILE;

-- CreateTable
CREATE TABLE "forums"."Topic" (
    "id" VARCHAR(14) NOT NULL DEFAULT nanoid(),
    "parentTopicId" VARCHAR(14),
    "challengeId" VARCHAR(64),
    "roleName" VARCHAR(128),
    "title" VARCHAR(255) NOT NULL,
    "isAnnouncement" BOOLEAN NOT NULL DEFAULT false,
    "authorMemberId" VARCHAR(64) NOT NULL,
    "authorHandle" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedByMemberId" VARCHAR(64),

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forums"."Post" (
    "id" VARCHAR(14) NOT NULL DEFAULT nanoid(),
    "topicId" VARCHAR(14) NOT NULL,
    "parentType" VARCHAR(16) NOT NULL,
    "parentId" VARCHAR(14) NOT NULL,
    "authorMemberId" VARCHAR(64) NOT NULL,
    "authorHandle" VARCHAR(128) NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedByMemberId" VARCHAR(64),

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forums"."TopicClosure" (
    "ancestorTopicId" VARCHAR(14) NOT NULL,
    "descendantTopicId" VARCHAR(14) NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "TopicClosure_pkey" PRIMARY KEY ("ancestorTopicId","descendantTopicId")
);

-- CreateTable
CREATE TABLE "forums"."TopicWatch" (
    "topicId" VARCHAR(14) NOT NULL,
    "memberId" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicWatch_pkey" PRIMARY KEY ("topicId","memberId")
);

-- CreateTable
CREATE TABLE "forums"."TopicReadState" (
    "topicId" VARCHAR(14) NOT NULL,
    "memberId" VARCHAR(64) NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicReadState_pkey" PRIMARY KEY ("topicId","memberId")
);

-- CreateIndex
CREATE INDEX "Topic_parentTopicId_idx" ON "forums"."Topic"("parentTopicId");

-- CreateIndex
CREATE INDEX "Topic_challengeId_idx" ON "forums"."Topic"("challengeId");

-- CreateIndex
CREATE INDEX "Topic_roleName_idx" ON "forums"."Topic"("roleName");

-- CreateIndex
CREATE INDEX "Topic_deletedAt_idx" ON "forums"."Topic"("deletedAt");

-- CreateIndex
CREATE INDEX "Topic_isAnnouncement_createdAt_idx" ON "forums"."Topic"("isAnnouncement", "createdAt");

-- CreateIndex
CREATE INDEX "Post_topicId_createdAt_idx" ON "forums"."Post"("topicId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_topicId_parentType_parentId_idx" ON "forums"."Post"("topicId", "parentType", "parentId");

-- CreateIndex
CREATE INDEX "Post_deletedAt_idx" ON "forums"."Post"("deletedAt");

-- CreateIndex
CREATE INDEX "TopicClosure_ancestorTopicId_depth_idx" ON "forums"."TopicClosure"("ancestorTopicId", "depth");

-- CreateIndex
CREATE INDEX "TopicClosure_descendantTopicId_depth_idx" ON "forums"."TopicClosure"("descendantTopicId", "depth");

-- CreateIndex
CREATE INDEX "TopicWatch_memberId_idx" ON "forums"."TopicWatch"("memberId");

-- CreateIndex
CREATE INDEX "TopicReadState_memberId_idx" ON "forums"."TopicReadState"("memberId");

-- CreateIndex
CREATE INDEX "TopicReadState_lastReadAt_idx" ON "forums"."TopicReadState"("lastReadAt");

-- AddForeignKey
ALTER TABLE "forums"."Topic" ADD CONSTRAINT "Topic_parentTopicId_fkey" FOREIGN KEY ("parentTopicId") REFERENCES "forums"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forums"."Post" ADD CONSTRAINT "Post_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "forums"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forums"."TopicClosure" ADD CONSTRAINT "TopicClosure_ancestorTopicId_fkey" FOREIGN KEY ("ancestorTopicId") REFERENCES "forums"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forums"."TopicClosure" ADD CONSTRAINT "TopicClosure_descendantTopicId_fkey" FOREIGN KEY ("descendantTopicId") REFERENCES "forums"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forums"."TopicWatch" ADD CONSTRAINT "TopicWatch_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "forums"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forums"."TopicReadState" ADD CONSTRAINT "TopicReadState_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "forums"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
