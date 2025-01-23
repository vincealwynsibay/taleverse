"use client";
import { Chapter, Novel } from "@prisma/client";
import ChapterNavbar from "./ChapterNavbar";
import ChapterView from "./ChapterView";
import { fontSizes } from "@/lib/common";
import useLocalStorage from "@/hooks/useLocalStorage";

export default function ChapterReader({
  chapter,
  chapters,
}: {
  chapter: Chapter & { novel: Novel };
  chapters: Chapter[];
}) {
  // sans, serif, mono
  const [fontFamily, setFontFamily] = useLocalStorage(
    "fontFamily",
    "font-serif"
  );
  const [fontSizeIndex, setFontSizeIndex] = useLocalStorage("fontSizeIndex", 0);

  const handlePrevFontSize = () => {
    if (fontSizeIndex - 1 < 0) return;
    setFontSizeIndex(fontSizeIndex - 1);
  };

  const handleNextFontSize = () => {
    if (fontSizeIndex + 1 >= fontSizes.length) return;
    setFontSizeIndex(fontSizeIndex + 1);
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
