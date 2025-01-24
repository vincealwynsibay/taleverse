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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { fontSizes } from "@/lib/common";

export default function ChapterNavbar({
  chapter,
  chapters,
  config,
  handleFontFamilyChange,
  handlePrevFontSize,
  handleNextFontSize,
}: {
  chapter: Chapter & { novel: Novel };
  chapters: Chapter[];
  config: {
    fontFamily: string;
    fontSizeIndex: number;
  };
  handleFontFamilyChange: (value: string) => void;

  handlePrevFontSize: () => void;
  handleNextFontSize: () => void;
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
                <SheetTitle>Reader Settings</SheetTitle>
                <SheetDescription>
                  Style the text the way you want.
                </SheetDescription>

                <div className="flex items-center justify-between mt-8 ">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold">Font Size</h3>
                    <p className="text-sm">
                      {fontSizes[config.fontSizeIndex].name}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant={"outline"}
                      onClick={() => handlePrevFontSize()}
                      disabled={config.fontSizeIndex == 0}
                    >
                      <ChevronLeft />
                    </Button>

                    <p
                      className={cn(
                        "min-w-[40px] text-center",
                        config.fontFamily,
                        `${fontSizes[config.fontSizeIndex].size}`
                      )}
                    >
                      Aa
                    </p>

                    <Button
                      variant={"outline"}
                      onClick={() => handleNextFontSize()}
                      disabled={config.fontSizeIndex == fontSizes.length - 1}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>

                {/* three buttons for font family */}
                <div className="">
                  <h3 className="text-sm font-bold">Font Family</h3>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <Button
                      variant={"outline"}
                      className="py-12 font-bold font-sans flex flex-col"
                      onClick={() => handleFontFamilyChange("font-sans")}
                    >
                      <div className="text-sm font-medium">Sans</div>
                      <div className="text-xs inline-block font-light whitespace-normal">
                        Modern and Simple
                      </div>
                    </Button>
                    <Button
                      variant={"outline"}
                      className="py-12 font-bold font-serif flex flex-col"
                      onClick={() => handleFontFamilyChange("font-serif")}
                    >
                      <div className="text-sm font-medium">Serif</div>
                      <div className="text-xs inline-block font-light whitespace-normal">
                        {" "}
                        Classic and Elegant
                      </div>
                    </Button>
                    <Button
                      variant={"outline"}
                      className="py-12 font-bold font-mono flex flex-col"
                      onClick={() => handleFontFamilyChange("font-mono")}
                    >
                      <div className="text-sm font-medium">Mono</div>
                      <div className="text-xs inline-block font-light whitespace-normal">
                        Fixed-width
                      </div>
                    </Button>
                  </div>
                </div>
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
