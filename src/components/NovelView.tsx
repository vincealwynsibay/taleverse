import { Novel } from "@prisma/client";
import Ratings from "./Ratings";
import { BookOpenText, Eye, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Image from "next/image";
import MaxWidthWrapper from "./MaxWidthWrapper";

export default function NovelView({ novel }: { novel: Novel }) {
  console.log(novel);

  const rating = 3.5;
  const totalChapters = 1234;
  const views = "4.11M";
  const reviews = 12;
  const isCompleted = false;
  return (
    <div className="relative">
      <div className="w-full h-full absolute overflow-hidden z-10">
        <div className="will-change: transform; transform: translateY(-14.1386%) scale(1);">
          <Image
            className="blur w-full h-auto"
            src={"/assets/bookcover.png"}
            width={0}
            height={0}
            sizes="100vw"
            alt={`${novel.title} cover`}
          />
        </div>
      </div>
      <div
        className="h-[280px] z-10 absolute lg:relative"
        style={{
          backgroundImage:
            "linear-gradient(0deg, hsl(var(--background)), transparent)",
        }}
      ></div>
      <section className="bg-background lg:z-10 relative shadow-md">
        <MaxWidthWrapper className="mx-auto px-5">
          <div className="grid grid-cols-12 gap-6">
            <div className="order-2 lg:order-1 col-span-12 lg:col-span-9 flex flex-col gap-2 pt-16">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">
                  {novel.title.toWellFormed()}
                </h1>
                <div className="flex gap-2 items-center">
                  <Ratings variant="yellow" rating={rating} size={15} />
                  <span className="text-sm">{rating}</span>
                </div>
              </div>
              <span
                className={cn(
                  "px-2 py-2 rounded-sm w-fit text-[0.65rem] inline font-semibold bg-opacity-5",
                  isCompleted
                    ? "bg-red-200 text-red-600"
                    : "bg-green-200 text-green-400"
                )}
              >
                {isCompleted ? "COMPLETED" : "ONGOING"}
              </span>
              <p>Author: {novel.author}</p>
              <p className="text-muted-foreground">{novel.synopsis}</p>
              <div className="flex flex-row gap-10 items-center [&>:not(:last-child)]:border-r border-r-white ">
                <div className="pr-8">
                  <span className="text-sm font-light">Chapters</span>
                  <div className="flex flex-row items-center gap-2">
                    <BookOpenText className="w-4 h-4" />{" "}
                    <span className="text-lg font-bold">{totalChapters}</span>
                  </div>
                </div>
                <div className="pr-8">
                  <span className="text-sm font-light">Views</span>
                  <div className="flex flex-row items-center gap-2">
                    <Eye className="w-4 h-4" />{" "}
                    <span className="text-lg font-bold">{views}</span>
                  </div>
                </div>
                <div className="pr-8">
                  <span className="text-sm font-light">Reviews</span>
                  <div className="flex flex-row items-center gap-2">
                    <SquarePen className="w-4 h-4" />{" "}
                    <span className="text-lg font-bold">{reviews}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-4 mt-2">
                <Button size="lg">Start Reading</Button>
                <Button variant={"secondary"} size="lg">
                  Read Latest Chapter
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 col-span-12 lg:col-span-3 lg:-translate-y-[130px]">
              <div className="z-12 p-1 bg-background rounded overflow-hidden">
                <Image
                  className="w-full h-auto border-background rounded-lg object-fit"
                  src="/assets/bookcover.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  alt={`${novel.title} cover`}
                />
              </div>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </div>
  );
}
