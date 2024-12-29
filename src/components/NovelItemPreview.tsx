import { Chapter, Novel } from "@prisma/client";
import { Clock3 } from "lucide-react";
import Image from "next/image";

export default function NovelItemPreview({
  novel,
}: {
  novel: Novel & { chapter: Chapter[] };
}) {
  console.log(novel);

  if (novel.chapter && novel.chapter.length == 0) return null;

  const latestChapter = novel.chapter[novel.chapter.length - 1];
  return (
    <div>
      <Image
        src={"/assets/bookcover.png"}
        alt={`${novel.title} book cover`}
        width="0"
        height="0"
        sizes="100vw"
        className="w-52 h-auto rounded-sm"
      />
      <h2 className="font-bold text-lg">{latestChapter.title}</h2>
      <h3 className="text-sm flex gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="rgba(119,119,119,1)"
          className="w-5 h-5"
        >
          <path d="M21 18H6C5.44772 18 5 18.4477 5 19C5 19.5523 5.44772 20 6 20H21V22H6C4.34315 22 3 20.6569 3 19V4C3 2.89543 3.89543 2 5 2H21V18ZM16 9V7H8V9H16Z"></path>
        </svg>{" "}
        {novel.title}
      </h3>
      <p className="text-gray-600 text-sm flex gap-1 items-center">
        {" "}
        <Clock3 className="stroke-gray-600 w-5 h-5" />2 hours ago
      </p>
      {/* now - time published */}
    </div>
  );
}
