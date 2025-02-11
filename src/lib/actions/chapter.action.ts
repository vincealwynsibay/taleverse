"use server";

import { Chapter, Novel, Prisma } from "@prisma/client";
import prisma from "../db";
import { checkUser } from "./common";
import { generateSlug } from "../utils";

export async function getChapterByOrderNumber(
  novelId: number,
  order_number: number
) {
  try {
    const chapter = await prisma.chapter.findFirst({
      where: {
        novelId: novelId,
        order_number: order_number,
      },
      include: {
        novel: true,
      },
    });

    if (!chapter) {
      throw new Error("Chapter does not exist");
    }

    return {
      data: {
        chapter,
      },
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function getNovelPublishedChaptersWithPagination(
  novelId: number,
  chap_number?: number,
  per_page: number = 10,
  page: number = 1,
  sort: "asc" | "desc" = "asc"
) {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }

    const limit = per_page;
    const offset = (page - 1) * limit;
    console.log(limit, offset, page, chap_number, sort);

    // const [column, order] = (sort.split(".") as [
    //   keyof Chapter,
    //   "asc" | "desc" | undefined
    // ]) ?? ["order_number", "desc"]

    const chapters = await prisma.chapter.findMany({
      where: {
        ...(chap_number && {
          OR: [
            {
              order_number: chap_number,
            },
            {
              order_number: {
                gte: chap_number,
                lte: parseInt(chap_number + "9"),
              },
            },
          ],
        }),
        // search
        novelId: novelId,
        publishedAt: {
          gte: new Date(),
        },
      },
      // pagination
      skip: offset,
      take: per_page,
      // // sort
      orderBy: [
        {
          order_number: sort,
        },
      ],
    });

    console.log("chap", chap_number);

    const totalCount = await prisma.chapter.count({
      where: {
        ...(chap_number && {
          OR: [
            {
              order_number: chap_number,
            },
            {
              order_number: {
                gte: chap_number,
                lte: parseInt(chap_number + "9"),
              },
            },
          ],
        }),
        // search
        novelId: novelId,
        publishedAt: {
          gte: new Date(),
        },
      },
    });

    return {
      data: {
        chapters,
        totalCount,
      },
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function getPrevNextChapters({
  currentOrderNumber,
  offset,
  direction,
}: {
  novelId: number;
  currentOrderNumber: number;
  offset: number;
  direction: string;
}) {
  const targetChapterNumber =
    direction === "prev"
      ? currentOrderNumber - offset
      : currentOrderNumber + offset;

  // Fetch the chapter
  const chapter: (Chapter & { novel: Novel }) | null =
    await prisma.chapter.findFirst({
      where: {
        order_number: targetChapterNumber,
      },
      include: {
        novel: true,
      },
    });

  return chapter;
}

export async function getNovelPublishedChapters(
  novelId: number,
  sort: "asc" | "desc" = "asc"
) {
  try {
    const chapters = await prisma.chapter.findMany({
      where: {
        // search
        novelId: novelId,
        publishedAt: {
          gte: new Date(),
        },
      },
      include: {
        novel: true,
      },
      // sort
      orderBy: [
        {
          order_number: sort,
        },
      ],
    });

    return {
      data: chapters,
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function publishChapter(chapterId: number, publishDate: Date) {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
      },
      include: {
        novel: true,
      },
    });

    if (!chapter) {
      throw new Error("Chapter not found.");
    }

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        publishedAt: publishDate,
      },
    });

    return {
      data: updatedChapter,
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function createChapter(novelId: number) {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }

    const novel = await prisma.novel.findFirst({
      where: {
        id: novelId,
      },
      include: {
        _count: {
          select: {
            chapter: true,
          },
        },
      },
    });

    if (!novel) {
      throw new Error("Novel not found.");
    }

    const chapter = await prisma.chapter.create({
      data: {
        title: `Untitled Chapter ${novel?._count.chapter}`,
        novelId: novelId,
        slug: generateSlug(`chapter ${novel?._count.chapter}`),
        order_number: novel?._count.chapter,
      },
    });

    return {
      message: "Novel Chapter successfully created",
      data: chapter,
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function getNovelChapter(chapterId: number) {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
      },
      include: {
        novel: true,
      },
    });

    return {
      data: chapter,
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function getNovelChapterBySlug(slug: string) {
  try {
    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: slug,
      },
      include: {
        novel: true,
      },
    });

    return {
      data: chapter,
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function updateChapterContent(
  chapterId: number,
  newContent: string
) {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
      },
    });

    if (!chapter) {
      throw new Error("Chapter not found.");
    }

    console.log(JSON.parse(newContent));

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        content: JSON.parse(newContent) as Prisma.JsonArray,
      },
    });

    return {
      data: updatedChapter,
      success: true,
    };
  } catch (e) {
    console.error(e.message);
    return { message: e.message, success: false };
  }
}

export async function updateChapter(
  chapterId: number,
  chapterObject: { content: string; title: string }
) {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
      },
    });

    if (!chapter) {
      throw new Error("Chapter not found.");
    }

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        title: chapterObject.title,
        content: JSON.parse(chapterObject.content) as Prisma.JsonArray,
      },
    });

    return {
      data: updatedChapter,
      success: true,
    };
  } catch (e) {
    console.error(e.message);
    return { message: e.message, success: false };
  }
}

export async function updateChapterTitle(chapterId: number, newTitle: string) {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
      },
    });

    if (!chapter) {
      throw new Error("Chapter not found.");
    }

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        title: newTitle,
      },
    });

    return {
      data: updatedChapter,
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}
