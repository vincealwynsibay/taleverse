import { Chapter, Novel } from "@prisma/client";
import ChapterContent from "./ChapterContent";

export default function ChapterView({
  chapter,
}: {
  chapter: Chapter & { novel: Novel };
}) {
  console.log(chapter);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-bold">{chapter.title}</h1>
      <ChapterContent content={chapter.content} />
    </div>
  );
}
