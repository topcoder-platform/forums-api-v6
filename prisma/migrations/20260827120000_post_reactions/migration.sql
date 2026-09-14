-- CreateEnum
CREATE TYPE "forums"."PostReactionType" AS ENUM ('THUMBS_UP', 'THUMBS_DOWN');

-- CreateTable
CREATE TABLE "forums"."PostReaction" (
    "postId" VARCHAR(14) NOT NULL,
    "memberId" VARCHAR(64) NOT NULL,
    "reaction" "forums"."PostReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("postId", "memberId")
);

-- CreateIndex
CREATE INDEX "PostReaction_memberId_idx" ON "forums"."PostReaction"("memberId");

-- CreateIndex
CREATE INDEX "PostReaction_postId_reaction_idx" ON "forums"."PostReaction"("postId", "reaction");

-- AddForeignKey
ALTER TABLE "forums"."PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "forums"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
