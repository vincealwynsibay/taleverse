/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Novel` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Novel_title_key" ON "Novel"("title");
