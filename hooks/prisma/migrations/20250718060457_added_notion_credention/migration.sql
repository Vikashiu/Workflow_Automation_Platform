-- CreateTable
CREATE TABLE "NotionCredential" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "workspaceName" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotionCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotionCredential_userId_key" ON "NotionCredential"("userId");
