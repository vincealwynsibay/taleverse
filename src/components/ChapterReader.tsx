"use client";
import { Chapter, Novel } from "@prisma/client";
import ChapterNavbar from "./ChapterNavbar";
import ChapterView from "./ChapterView";
import { fontSizes } from "@/lib/common";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { getChapterByOrderNumber } from "@/lib/actions/chapter.action";
import MaxWidthWrapper from "./MaxWidthWrapper";
export default function ChapterReader({
  chapter,
  chapters,
}: {
  chapter: Chapter & { novel: Novel };
  chapters: Chapter[];
}) {
  // sans, serif, mono
  const [fontFamily, setFontFamily] = useLocalStorage(
    "fontFamily",
    "font-serif"
  );
  const [fontSizeIndex, setFontSizeIndex] = useLocalStorage("fontSizeIndex", 0);
  const [startRef, startInView] = useInView();
  const [endRef, endInView] = useInView();

  // const fetchChaptersQuery = async ({
  //   pageParam = { offset: 0, nextOffset: 0, direction: "next" },
  // }: {
  //   pageParam: { offset: number; direction: string };
  // }) => {
  //   const { prevOffset, nextOffset, direction } = pageParam;
  //   const chaps123 = await getPrevNextChapters({
  //     novelId: chapter.id,
  //     currentOrderNumber: chapter.order_number,
  //     offset,
  //     direction,
  //   });

  //   console.log("chaps123", chaps123);

  //   return chaps123;
  // };
  const fetchChaptersQuery = async ({
    pageParam = { order_number: chapter.order_number },
  }: {
    pageParam: { order_number: number };
  }) => {
    const { order_number } = pageParam;
    const chaps123 = await getChapterByOrderNumber(
      chapter.novelId,
      order_number
    );

    console.log("chaps123", chaps123);

    return chaps123;
  };

  const {
    data: chaps,
    fetchNextPage,
    hasNextPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
    hasPreviousPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["chaps"],
    queryFn: ({ pageParam }) => fetchChaptersQuery({ pageParam }),
    initialPageParam: {
      order_number: chapter.order_number,
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.data?.chapter.order_number;
      return currentPage &&
        currentPage !== chapters[chapters.length - 1].order_number
        ? {
            order_number: currentPage + 1,
          }
        : undefined;
    },
    getPreviousPageParam: (lastPage) => {
      const currentPage = lastPage.data?.chapter.order_number;
      return currentPage && currentPage !== 0
        ? {
            order_number: currentPage - 1,
          }
        : undefined;
    },
  });

  const prevScrollPos = useRef(0);
  const [show, setShow] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const handleScroll = () => {
    const currentScrollPos = window.scrollY;
    setHasScrolled(true);

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

  useEffect(() => {
    if (endInView && hasNextPage) {
      console.log("nice nice");
      fetchNextPage();
    }
  }, [endInView, fetchNextPage, hasNextPage]);
  useEffect(() => {
    if (
      startInView &&
      hasPreviousPage &&
      chaps &&
      chaps.pages.length > 0 &&
      hasScrolled
    ) {
      console.log("nice nice");
      fetchPreviousPage();
    }
  }, [startInView, fetchPreviousPage, hasPreviousPage, chaps, hasScrolled]);

  const handlePrevFontSize = () => {
    if (fontSizeIndex - 1 < 0) return;
    setFontSizeIndex(fontSizeIndex - 1);
  };

  const handleNextFontSize = () => {
    if (fontSizeIndex + 1 >= fontSizes.length) return;
    setFontSizeIndex(fontSizeIndex + 1);
  };

  return (
    <MaxWidthWrapper className="mx-auto">
      {" "}
      <ChapterNavbar
        chapters={chapters}
        chapter={chapter}
        show={show}
        config={{ fontFamily, fontSizeIndex }}
        handleFontFamilyChange={setFontFamily}
        handlePrevFontSize={handlePrevFontSize}
        handleNextFontSize={handleNextFontSize}
      />
      <div ref={startRef} className="mt-4 w-full">
        {isFetchingPreviousPage && !isLoading && (
          <p>Loading previous chapters...</p>
        )}
      </div>
      {isLoading && <div>Loading..</div>}
      <div className="flex flex-col gap-4">
        {chaps &&
          chaps.pages?.map((chapterItem) => {
            if (!chapterItem) return null;
            return (
              <ChapterView
                key={chapterItem.data?.chapter.id}
                chapter={chapterItem.data!.chapter!}
                config={{ fontFamily, fontSizeIndex }}
              />
            );
          })}
      </div>
      <div className="">
        {hasNextPage && !isLoading && (
          <div ref={endRef}>Loading next chapters...</div>
        )}
      </div>
    </MaxWidthWrapper>
  );
}
