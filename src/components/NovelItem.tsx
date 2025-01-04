import { Novel } from "@prisma/client";
import Image from "next/image";
import Ratings from "./Ratings";
import Link from "next/link";
import { BookText } from "lucide-react";

export default function NovelItem({ novel }: { novel: Novel }) {
  console.log(novel);

  return (
    <div>
      <Link href={`/novels/${novel.slug}`}>
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <div className="">
            <Image
              src={"/assets/bookcover.png"}
              alt={`${novel.title} book cover`}
              width="0"
              height="0"
              sizes="100vw"
              className="w-28 h-auto rounded-sm"
            />
          </div>
          <div className="">
            <h2 className="font-bold text-lg">{novel.title}</h2>
            <h3 className="text-gray-400">{novel.author ?? ""}</h3>

            <div className="flex gap-2">
              {/* rating */}
              <Ratings variant="yellow" rating={3.5} size={15} />
              <div className="flex gap-1 items-center">
                <BookText className="fill-gray-400 text-background w-5 h-5" />
                {/* no. of chapters */}
                <span className="text-gray-400">5 chapters</span>
              </div>
            </div>
            {/* recent chapters */}
            <div className="flex flex-col gap-1">
              {novel.synopsis.substring(0, 100)}
              {novel.synopsis.length > 100 ? "..." : ""}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
