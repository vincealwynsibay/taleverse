import { Chapter, Novel } from "@prisma/client";
import ChapterContent from "./ChapterContent";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { cn } from "@/lib/utils";
import { fontSizes } from "@/lib/common";

export default function ChapterReader({
  chapter,
  config,
}: {
  chapter: Chapter & { novel: Novel };
  config: {
    fontFamily: string;
    fontSizeIndex: number;
  };
}) {
  return (
    <MaxWidthWrapper className="mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold">{chapter.title}</h1>
        <div
          className={cn(
            config.fontFamily,
            `${fontSizes[config.fontSizeIndex].size}`
          )}
        >
          <ChapterContent content={chapter.content} />
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
