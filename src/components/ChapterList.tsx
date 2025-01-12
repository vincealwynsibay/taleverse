import { Chapter } from "@prisma/client";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { Calendar } from "lucide-react";
import Link from "next/link";

export default function ChapterList({
  slug,
  chapters,
}: {
  slug: string;
  chapters: Chapter[];
}) {
  if (!chapters) return null;

  return (
    <MaxWidthWrapper className="mx-auto flex flex-col gap-4 px-5">
      {chapters &&
        chapters.map((chapter, idx) => {
          return (
            <Link key={chapter.id} href={`/novels/${slug}/${chapter.slug}`}>
              <div className="flex gap-8 items-center">
                <span className="text-lg font-bold">{idx}</span>
                <div className="">
                  <p className="text-lg font-bold">{chapter.title}</p>
                  <span className="flex gap-2 items-center text-gray-400">
                    <Calendar className="w-4 h-4" /> June 1, 2024
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
    </MaxWidthWrapper>
  );
}
