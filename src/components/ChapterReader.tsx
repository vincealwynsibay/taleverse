"use client";
import { Chapter, Novel } from "@prisma/client";
import { useState } from "react";
import ChapterNavbar from "./ChapterNavbar";
import ChapterView from "./ChapterView";
import { fontSizes } from "@/lib/common";

export default function ChapterReader({
  chapter,
  chapters,
}: {
  chapter: Chapter & { novel: Novel };
  chapters: Chapter[];
}) {
  // sans, serif, mono
  const [fontFamily, setFontFamily] = useState("font-mono");
  const [fontSizeIndex, setFontSizeIndex] = useState(0);

  console.log(fontSizeIndex);

  const handlePrevFontSize = () => {
    if (fontSizeIndex - 1 < 0) return;
    setFontSizeIndex(() => fontSizeIndex - 1);
  };

  const handleNextFontSize = () => {
    if (fontSizeIndex + 1 >= fontSizes.length) return;
    setFontSizeIndex(() => fontSizeIndex + 1);
  };

  return (
    <div>
      <ChapterNavbar
        chapters={chapters}
        chapter={chapter}
        config={{ fontFamily, fontSizeIndex }}
        handleFontFamilyChange={setFontFamily}
        handlePrevFontSize={handlePrevFontSize}
        handleNextFontSize={handleNextFontSize}
      />

      <ChapterView chapter={chapter} config={{ fontFamily, fontSizeIndex }} />
    </div>
  );
}
