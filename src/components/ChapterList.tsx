"use client";

import { Chapter, Novel } from "@prisma/client";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import React, { useEffect, useState } from "react";
import { getNovelPublishedChapters } from "@/lib/actions/chapter.action";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

export default function ChapterList({
  slug,
  novel,
}: {
  slug: string;
  novel: Novel & {
    _count: {
      chapter: number;
    };
  };
}) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const chapterCount = novel._count.chapter;
  const itemsPerPage = 10;

  useEffect(() => {
    let ignore = false;
    const initializeChapters = async () => {
      const initialChapters = await getNovelPublishedChapters(
        novel.id,
        undefined,
        itemsPerPage,
        1
      );
      if (!ignore) {
        setChapters(initialChapters.data ?? []);
      }
    };

    initializeChapters();
    return () => {
      ignore = true;
    };
  }, [novel.id]);

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(() => newPage);
    const newChapters = await getNovelPublishedChapters(
      novel.id,
      undefined,
      itemsPerPage,
      newPage
    );
    console.log("mew", newChapters);
    setChapters(newChapters.data ?? []);
  };

  console.log(chapters);

  // console.log(currentPage);
  // const fetchChapters = async (page) => {
  //   const newChapters = await getNovelPublishedChapters(
  //     novel.id,
  //     undefined,
  //     2,
  //     page
  //   );
  //   setChapters(newChapters.data!);
  //   setCurrentPage(page);
  // };

  // console.log("chapters", chapters, novel._count.chapter);

  return (
    <MaxWidthWrapper className="mx-auto flex flex-col gap-4 px-5">
      {chapters.length > 0 &&
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
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <a
              onClick={async (e) => {
                e.preventDefault();
                if (currentPage == 1) return;
                await handlePageChange(currentPage - 1);
              }}
              className={cn(
                "gap-1 pl-2.5",
                currentPage > 1 && "cursor-pointer",
                buttonVariants({
                  variant: currentPage > 1 ? "outline" : "ghost",
                  size: "default",
                })
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </a>
          </PaginationItem>
          {Array.from(
            { length: Math.min(Math.ceil(chapterCount / 2), 7) },
            (_, i) => i + 1
          ).map((ele) => {
            return (
              <PaginationItem key={ele}>
                <a
                  href=""
                  onClick={async (e) => {
                    e.preventDefault();
                    await handlePageChange(ele);
                  }}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                    })
                  )}
                >
                  {ele}
                </a>
              </PaginationItem>
            );
          })}
          {chapterCount > 7 && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              {Array.from(
                { length: Math.min(3, chapterCount - 7) }, // Ensure we only render up to 3 pages
                (_, i) => chapterCount - (Math.min(3, chapterCount - 7) - 1) + i
              ).map((ele) => {
                return (
                  <PaginationItem key={ele}>
                    <a
                      href=""
                      onClick={async (e) => {
                        e.preventDefault();
                        await handlePageChange(ele);
                      }}
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                        })
                      )}
                    >
                      {ele}
                    </a>
                  </PaginationItem>
                );
              })}
            </>
          )}
          <PaginationItem>
            <a
              onClick={async (e) => {
                e.preventDefault();
                if (currentPage == Math.ceil(chapterCount / itemsPerPage))
                  return;
                await handlePageChange(currentPage + 1);
              }}
              className={cn(
                "gap-1 pl-2.5",
                currentPage > 1 && "cursor-pointer",
                buttonVariants({
                  variant: currentPage > 1 ? "outline" : "ghost",
                  size: "default",
                })
              )}
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </a>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </MaxWidthWrapper>
  );
}
