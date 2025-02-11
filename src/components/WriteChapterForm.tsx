"use client";

import { Chapter, Prisma } from "@prisma/client";
import PublishButton from "./PublishButton";
import { Button } from "./ui/button";
import Link from "next/link";
import ChapterEditor from "./ChapterEditor";
import React, { useState } from "react";
import { Input } from "./ui/input";
import { Block } from "@blocknote/core";
import { updateChapter } from "@/lib/actions/chapter.action";
import { useRouter } from "next/navigation";
import { isAfter } from "date-fns";
import useDebounce from "@/hooks/useDebounce";

export default function WriteChapterForm({
  slug,
  chapterSlug,
  chapter,
}: {
  slug: string;
  chapterSlug: string;
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

  const debouncedRequest = useDebounce(async () => {
    setIsSaving(() => true);

    await updateChapter(chapter.id, {
      title: title,
      content: JSON.stringify(blocks),
    });
    setIsSaving(() => false);
    setIsChanged(() => false);
  });

  if (!chapter) return null;

  const isPublished =
    chapter.publishedAt && isAfter(chapter.publishedAt, new Date());
  const handleClickSave = async () => {
    setIsSaving(() => true);

    // check if published
    if (isPublished) {
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

    if (!isPublished) {
      debouncedRequest();
    }
  };

  const handleContentChange = async (newDocument: Block[]) => {
    setBlocks(() => newDocument);
    setIsChanged(() => true);

    if (!isPublished) {
      debouncedRequest();
    }
  };

  console.log(blocks);

  return (
    <div className="flex flex-col gap-2">
      <div className="">
        <span>
          {isPublished && isChanged && "Published with unsaved changes"}
        </span>
        <span>{!isPublished && (isSaving ? "isSaving" : "Saved")}</span>
      </div>
      <div className="flex gap-2">
        {!isPublished && (
          <>
            <PublishButton chapterId={chapter.id} isSaving={isSaving} />
            <Button asChild disabled={isSaving}>
              <Link href={`/admin/novels/${slug}/${chapterSlug}/preview`}>
                Preview
              </Link>
            </Button>
          </>
        )}

        {isPublished && (
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

      <div className=""></div>

      <ChapterEditor
        blocks={blocks}
        handleContentChange={handleContentChange}
      />
    </div>
  );
}
