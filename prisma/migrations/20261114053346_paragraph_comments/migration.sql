-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "paragraph" INTEGER;

-- CreateIndex
CREATE INDEX "Comment_chapterId_paragraph_idx" ON "Comment"("chapterId", "paragraph");
