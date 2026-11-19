-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "conset" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "aiDecision" TEXT,
    "aiReason" TEXT,
    "aiCategory" TEXT,
    "aiRaw" TEXT,
    "aiError" TEXT,
    "aiProvider" TEXT,
    "overriddenBy" TEXT,
    "overriddenAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryEvent" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entry_slug_key" ON "Entry"("slug");

-- CreateIndex
CREATE INDEX "Entry_status_createdAt_idx" ON "Entry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Entry_aiCategory_idx" ON "Entry"("aiCategory");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_contact_key" ON "Entry"("contact");

-- CreateIndex
CREATE INDEX "EntryEvent_entryId_createdAt_idx" ON "EntryEvent"("entryId", "createdAt");

-- AddForeignKey
ALTER TABLE "EntryEvent" ADD CONSTRAINT "EntryEvent_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
