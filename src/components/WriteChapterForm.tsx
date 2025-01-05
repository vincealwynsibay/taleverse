"use client";

import { Chapter, Prisma } from "@prisma/client";
import PublishButton from "./PublishButton";
import { Button } from "./ui/button";
import Link from "next/link";
import ChapterEditor from "./ChapterEditor";
import React, { useState } from "react";
import { Input } from "./ui/input";
import { Block } from "@blocknote/core";
import {
  updateChapter,
  updateChapterContent,
  updateChapterTitle,
} from "@/lib/actions/chapter.action";
import { useRouter } from "next/navigation";

export default function WriteChapterForm({
  slug,
  chapter,
}: {
  slug: string;
  chapter: Chapter;
}) {
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(chapter.title);

  const contentObject = chapter.content as Prisma.JsonArray;
  const [blocks, setBlocks] = useState<Block[]>(
    contentObject.length > 0 ? (contentObject as Block[]) : []
  );

  const router = useRouter();

  if (!chapter) return null;

  const handleClickSave = async () => {
    setIsSaving(() => true);

    if (chapter.published) {
      const updatedChapter = await updateChapter(chapter.id, {
        title: title,
        content: JSON.stringify(blocks),
      });

      setIsSaving(() => false);
      setIsChanged(() => false);
      if (!updatedChapter) return;
      router.push(`/novels/${slug}`);
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsChanged(() => true);

    if (!chapter.published) {
      setIsSaving(() => true);
      await updateChapterTitle(chapter.id, title);
      setIsSaving(() => false);
      setIsChanged(() => false);
    }
  };

  const handleContentChange = async (newDocument: Block[]) => {
    setBlocks(() => newDocument);
    setIsChanged(() => true);

    if (!chapter.published) {
      setIsSaving(() => true);
      await updateChapterContent(chapter.id, JSON.stringify(blocks));
      setIsSaving(() => false);
      setIsChanged(() => false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="">
        <span>
          {chapter.published && isChanged && "Published with unsaved changes"}
        </span>
        <span>{!chapter.published && (isSaving ? "isSaving" : "Saved")}</span>
      </div>
      <div className="flex gap-2">
        {!chapter.published && (
          <>
            <PublishButton chapterId={chapter.id} isSaving={isSaving} />
            <Button asChild disabled={isSaving}>
              <Link
                href={`/admin/novels/${slug}/chapters/${chapter.id}/preview`}
              >
                Preview
              </Link>
            </Button>
          </>
        )}

        {chapter.published && (
          <Button onClick={() => handleClickSave()} disabled={isSaving}>
            Save
          </Button>
        )}
      </div>

      <div className="">
        <Input
          onChange={handleTitleChange}
          type="text"
          placeholder="Title"
          value={title}
        />
      </div>

      <ChapterEditor
        blocks={blocks}
        handleContentChange={handleContentChange}
      />
    </div>
  );
}
