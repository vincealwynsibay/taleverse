"use client";

import { createChapter } from "@/lib/actions/chapter.action";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

export default function CreateChapterButton({
  slug,
  novelId,
}: {
  slug: string;
  novelId: number;
}) {
  const handleCreateChapter = async () => {
    // create a new chapter with random title
    const chapter = await createChapter(novelId);
    if (!chapter.data) {
      return;
    }

    // redirect to new chapter
    redirect(`/admin/novels/${slug}/chapters/${chapter.data.id}`);
  };

  return (
    <Button onClick={() => handleCreateChapter()}>
      <Plus /> Add New Chapter
    </Button>
  );
}
