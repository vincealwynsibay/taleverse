"use client";

import { cn } from "@/lib/utils";
import { Chapter, Novel } from "@prisma/client";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  List,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import MaxWidthWrapper from "./MaxWidthWrapper";

export default function ChapterNavbar({
  chapter,
  chapters,
}: {
  chapter: Chapter & { novel: Novel };
  chapters: Chapter[];
}) {
  const prevScrollPos = useRef(0);
  const [show, setShow] = useState(true);
  const novel = chapter.novel;
  const prevChapter = chapters.find(
    (c) => c.order_number === chapter.order_number - 1
  );
  const nextChapter = chapters.find(
    (c) => c.order_number === chapter.order_number + 1
  );

  const handleScroll = () => {
    const currentScrollPos = window.scrollY;

    if (currentScrollPos > prevScrollPos.current) {
      setShow(() => false);
    } else {
      setShow(() => true);
    }

    prevScrollPos.current = currentScrollPos;
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!novel) return null;

  return (
    <div
      className={cn(
        "border-b-[1px] border-b-border mb-4 z-50 bg-background sticky",
        show ? "top-0" : ""
      )}
    >
      <MaxWidthWrapper className="mx-auto py-2 flex flex-row flex-1 flex-grow  items-stretch justify-between ">
        <div className="flex items-end gap-4">
          <Link
            href={
              prevChapter
                ? `/novels/${novel.slug}/${prevChapter.slug}`
                : `/novels/${novel.slug}`
            }
            className={cn(
              "gap-1 pl-2.5 cursor-pointer ",
              buttonVariants({
                variant: "outline",
                size: "default",
              })
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>

          <div className="flex flex-row items-end gap-4">
            <Link href={`/novels/${novel.slug}`}>
              <Image
                className="w-8 object-contain"
                src={"/assets/bookcover.png"}
                width={0}
                height={0}
                sizes="100vw"
                alt={`${novel.title} cover`}
              />
            </Link>
            <div className="flex flex-col">
              <span className=" font-bold ">{chapter.title}</span>
              <span className="text-sm text-muted-foreground">
                {novel.title}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant={"outline"} size={"icon"}>
                <List />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-scroll">
              <SheetHeader>
                <SheetTitle>Chapter List</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-5">
                {chapters.length > 0 &&
                  chapters.map((c) => {
                    return (
                      <Link key={c.id} href={`/novels/${novel.slug}/${c.slug}`}>
                        <div className="flex gap-8 items-center">
                          <span className="text-lg font-bold">
                            {c.order_number}
                          </span>
                          <div className="">
                            <p className="text-lg font-bold">{c.title}</p>
                            <span className="flex gap-2 items-center text-gray-400">
                              <Calendar className="w-4 h-4" /> June 1, 2024
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant={"outline"} size={"icon"}>
                <Settings />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Link
            href={
              nextChapter
                ? `/novels/${novel.slug}/${nextChapter.slug}`
                : `/novels/${novel.slug}`
            }
            className={cn(
              "gap-1 pl-2.5 cursor-pointer",
              buttonVariants({
                variant: "outline",
                size: "default",
              })
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
