import { Novel } from "@prisma/client";
import Image from "next/image";
import Ratings from "./Ratings";
import Link from "next/link";

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
            <h3>{novel.author ?? ""}</h3>

            <div className="flex gap-2">
              {/* rating */}
              <Ratings rating={3.5} size={15} />
              <div className="flex gap-1 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="rgba(119,119,119,1)"
                  className="w-5 h-5"
                >
                  <path d="M21 18H6C5.44772 18 5 18.4477 5 19C5 19.5523 5.44772 20 6 20H21V22H6C4.34315 22 3 20.6569 3 19V4C3 2.89543 3.89543 2 5 2H21V18ZM16 9V7H8V9H16Z"></path>
                </svg>
                {/* no. of chapters */}
                <span>5 chapters</span>
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
