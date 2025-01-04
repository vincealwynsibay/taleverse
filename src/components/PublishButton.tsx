"use client";

import { publishChapter } from "@/lib/actions/chapter.action";
import { Button } from "./ui/button";

export default function PublishButton({
  chapterId,
  saving,
}: {
  chapterId: number;
  saving: boolean;
}) {
  const handlePublishChapter = async () => {
    await publishChapter(chapterId);
  };

  return (
    <Button onClick={() => handlePublishChapter()} disabled={saving}>
      Publish
    </Button>
  );
}
