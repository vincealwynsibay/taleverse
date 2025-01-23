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
  const [fontSize, setFontSize] = useState(0);

  return (
    <div>
      <ChapterNavbar
        chapters={chapters}
        chapter={chapter}
        config={{ fontFamily, fontSize }}
        handleFontFamilyChange={setFontFamily}
      />

      <ChapterView chapter={chapter} config={{ fontFamily, fontSize }} />
    </div>
  );
}
