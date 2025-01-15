"use client";

import { cn } from "@/lib/utils";
import { Novel } from "@prisma/client";
import { ChevronLeft, ChevronRight, List, Settings } from "lucide-react";
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

export default function ChapterNavbar({ novel }: { novel: Novel }) {
  const prevScrollPos = useRef(0);
  const [show, setShow] = useState(true);

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
            href="#"
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
            <Image
              className="w-8 object-contain"
              src={"/assets/bookcover.png"}
              width={0}
              height={0}
              sizes="100vw"
              alt={`${novel.title} cover`}
            />
            <div className="flex flex-col">
              <span className=" font-bold ">Chapter 12</span>
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
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Chapter List</SheetTitle>
              </SheetHeader>
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
            href="#"
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
