CREATE TABLE "forums"."ChallengeForumWatch" (
    "challengeId" VARCHAR(64) NOT NULL,
    "memberId" VARCHAR(64) NOT NULL,
    "watching" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChallengeForumWatch_pkey" PRIMARY KEY ("challengeId", "memberId")
);

CREATE INDEX "ChallengeForumWatch_memberId_idx" ON "forums"."ChallengeForumWatch"("memberId");
