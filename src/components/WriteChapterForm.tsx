"use client";

import { Chapter } from "@prisma/client";
import PublishButton from "./PublishButton";
import { Button } from "./ui/button";
import Link from "next/link";
import ChapterEditor from "./ChapterEditor";
import { useState } from "react";

export default function WriteChapterForm({
  slug,
  chapter,
}: {
  slug: string;
  chapter: Chapter;
}) {
  const [isChanged, setIsChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  if (!chapter) return null;

  return (
    <div>
      <span>
        {chapter.published && isChanged && "Published with unsaved changes"}
      </span>
      <span>{!chapter.published && (saving ? "Saving" : "Saved")}</span>
      <div className="flex gap-2">
        {!chapter.published && (
          <>
            <PublishButton chapterId={chapter.id} saving={saving} />
            <Button asChild disabled={saving}>
              <Link
                href={`/admin/novels/${slug}/chapters/${chapter.id}/preview`}
              >
                Preview
              </Link>
            </Button>
          </>
        )}

        {chapter.published && (
          <Button onClick={() => setSaving(() => true)} disabled={saving}>
            Save
          </Button>
        )}
      </div>

      <ChapterEditor
        handleSave={setSaving}
        handleChange={setIsChanged}
        published={chapter.published}
        saving={saving}
        chapterId={chapter.id}
        content={chapter.content}
        slug={slug}
      />
    </div>
  );
}
