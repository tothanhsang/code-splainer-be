-- CreateTable
CREATE TABLE "spec_analyses" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "analysisFocus" TEXT,
    "analysisResult" JSONB,
    "overview" TEXT,
    "userStories" JSONB,
    "features" JSONB,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spec_analyses_pkey" PRIMARY KEY ("id")
);
