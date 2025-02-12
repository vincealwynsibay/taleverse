"use client";

import { Chapter, Novel } from "@prisma/client";
import MaxWidthWrapper from "./MaxWidthWrapper";
import {
  ArrowDownUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import React, { useEffect, useRef, useState } from "react";
import { getNovelPublishedChaptersWithPagination } from "@/lib/actions/chapter.action";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./ui/button";
import { Input } from "./ui/input";

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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const chapterCount = useRef(0);
  const itemsPerPage = 10;

  console.log("init", chapters);
  useEffect(() => {
    let ignore = false;
    const initializeChapters = async () => {
      const initialChapters = await getNovelPublishedChaptersWithPagination(
        novel.id,
        undefined,
        itemsPerPage,
        1,
        sort
      );
      console.log("initialChapteres", initialChapters);
      if (!ignore) {
        chapterCount.current = initialChapters.data?.totalCount ?? 0;
        setChapters(initialChapters.data?.chapters ?? []);
      }
    };

    initializeChapters();
    return () => {
      ignore = true;
    };
  }, [novel.id, sort]);

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(() => newPage);
    const newChapters = await getNovelPublishedChaptersWithPagination(
      novel.id,
      undefined,
      itemsPerPage,
      newPage,
      sort
    );
    chapterCount.current = newChapters.data?.totalCount ?? 0;
    setChapters(() => newChapters.data?.chapters ?? []);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setQuery(() => value);
    const newChapters = await getNovelPublishedChaptersWithPagination(
      novel.id,
      parseInt(value),
      itemsPerPage,
      1,
      sort
    );
    setCurrentPage(() => 1);
    chapterCount.current = newChapters.data?.totalCount ?? 0;
    setChapters(() => newChapters.data?.chapters ?? []);
  };

  const handleSortClick = async () => {
    let newSort: "asc" | "desc" = "asc";
    setSort((prev) => {
      if (prev === "asc") {
        newSort = "desc";
        return "desc";
      } else {
        newSort = "asc";
        return "asc";
      }
    });

    const newChapters = await getNovelPublishedChaptersWithPagination(
      novel.id,
      parseInt(query),
      itemsPerPage,
      1,
      newSort
    );
    setCurrentPage(() => 1);
    chapterCount.current = newChapters.data?.totalCount ?? 0;
    setChapters(() => newChapters.data?.chapters ?? []);
  };

  return (
    <MaxWidthWrapper className="mx-auto flex flex-col gap-4 px-5 mt-5">
      <div className="flex items-center gap-4">
        <Input
          startIcon={Search}
          placeholder="Enter Chapter Number"
          onChange={handleSearchChange}
          value={query}
        />
        <Button className="gap-2" onClick={handleSortClick}>
          <ArrowDownUp />
          {sort === "asc" ? "Newest First" : "Oldest First"}
        </Button>
      </div>
      {chapters.length > 0 &&
        chapters.map((chapter) => {
          return (
            <Link key={chapter.id} href={`/novels/${slug}/${chapter.slug}`}>
              <div className="flex gap-8 items-center">
                <span className="text-lg font-bold">
                  {chapter.order_number}
                </span>
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
            {
              length: Math.min(
                Math.ceil(chapterCount.current / itemsPerPage),
                7
              ),
            },
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
          {chapterCount.current > 7 && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              {Array.from(
                { length: Math.min(3, chapterCount.current - 7) }, // Ensure we only render up to 3 pages
                (_, i) =>
                  chapterCount.current -
                  (Math.min(3, chapterCount.current - 7) - 1) +
                  i
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
                if (
                  currentPage == Math.ceil(chapterCount.current / itemsPerPage)
                )
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
