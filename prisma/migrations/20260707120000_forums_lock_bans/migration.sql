-- AlterTable
ALTER TABLE "forums"."Topic"
ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lockedAt" TIMESTAMP(3),
ADD COLUMN "lockedByMemberId" VARCHAR(64);

-- CreateTable
CREATE TABLE "forums"."MemberBan" (
    "id" VARCHAR(14) NOT NULL DEFAULT nanoid(),
    "memberId" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByMemberId" VARCHAR(64),
    "removedAt" TIMESTAMP(3),
    "removedByMemberId" VARCHAR(64),

    CONSTRAINT "MemberBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forums"."IpBan" (
    "id" VARCHAR(14) NOT NULL DEFAULT nanoid(),
    "ipAddress" VARCHAR(45) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByMemberId" VARCHAR(64),
    "removedAt" TIMESTAMP(3),
    "removedByMemberId" VARCHAR(64),

    CONSTRAINT "IpBan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "IpBan_ipAddress_host_check" CHECK (
        "ipAddress" = host("ipAddress"::inet)
        AND masklen("ipAddress"::inet) = CASE
            WHEN family("ipAddress"::inet) = 4 THEN 32
            WHEN family("ipAddress"::inet) = 6 THEN 128
            ELSE 0
        END
    )
);

-- CreateIndex
CREATE INDEX "MemberBan_memberId_idx" ON "forums"."MemberBan"("memberId");

-- CreateIndex
CREATE INDEX "MemberBan_removedAt_idx" ON "forums"."MemberBan"("removedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MemberBan_memberId_active_key" ON "forums"."MemberBan"("memberId") WHERE "removedAt" IS NULL;

-- CreateIndex
CREATE INDEX "IpBan_ipAddress_idx" ON "forums"."IpBan"("ipAddress");

-- CreateIndex
CREATE INDEX "IpBan_removedAt_idx" ON "forums"."IpBan"("removedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IpBan_ipAddress_active_key" ON "forums"."IpBan"("ipAddress") WHERE "removedAt" IS NULL;
