-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('QUEUED', 'DISCOVERING', 'INGESTING', 'REPORTING', 'COMPLETE', 'ERROR');

-- CreateEnum
CREATE TYPE "PaperSource" AS ENUM ('SEMANTIC_SCHOLAR', 'ARXIV');

-- CreateEnum
CREATE TYPE "AgentName" AS ENUM ('DISCOVERY', 'INGESTION', 'REPORT');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'ERROR', 'SKIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "paperLimit" INTEGER NOT NULL DEFAULT 20,
    "status" "ProjectStatus" NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paper" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" "PaperSource" NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "year" INTEGER,
    "venue" TEXT,
    "abstractText" TEXT,
    "pdfUrl" TEXT,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "summaryProblem" TEXT,
    "summaryMethod" TEXT,
    "summaryDataset" TEXT,
    "summaryResults" TEXT,
    "summaryLimits" TEXT,
    "bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "agentName" "AgentName" NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Paper_projectId_idx" ON "Paper"("projectId");

-- CreateIndex
CREATE INDEX "Paper_externalId_idx" ON "Paper"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_projectId_key" ON "Report"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_shareToken_key" ON "Report"("shareToken");

-- CreateIndex
CREATE INDEX "AgentRun_projectId_idx" ON "AgentRun"("projectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
