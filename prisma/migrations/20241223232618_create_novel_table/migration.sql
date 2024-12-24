-- CreateTable
CREATE TABLE "Novel" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "synopsis" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "releaseYear" TEXT NOT NULL DEFAULT '',
    "totalViews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Novel_pkey" PRIMARY KEY ("id")
);
