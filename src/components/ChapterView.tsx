import { Chapter, Novel } from "@prisma/client";
import ChapterContent from "./ChapterContent";
import MaxWidthWrapper from "./MaxWidthWrapper";

export default function ChapterView({
  chapter,
}: {
  chapter: Chapter & { novel: Novel };
}) {
  console.log(chapter);

  return (
    <MaxWidthWrapper className="mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold">{chapter.title}</h1>
        <ChapterContent content={chapter.content} />
      </div>
    </MaxWidthWrapper>
  );
}
