"use server";

import { Chapter, Novel, Prisma } from "@prisma/client";
import prisma from "../db";
import { checkUser } from "./common";
import { generateSlug } from "../utils";
import { auth } from "@clerk/nextjs/server";
import { isBefore } from "date-fns";

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
    const { userId } = await auth();
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { clerkId: userId } });
    }

    const limit = per_page;
    const offset = (page - 1) * limit;

    // const [column, order] = (sort.split(".") as [
    //   keyof Chapter,
    //   "asc" | "desc" | undefined
    // ]) ?? ["order_number", "desc"]

    // check if user is authorized to view chapter

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
        publishedAt: {
          lte: new Date(),
        },
        // search
        novelId: novelId,
      },
      select: {
        id: true,
        title: true,
        order_number: true,
        slug: true,
        publishedAt: true,
        publicAt: true,
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

    const existingPurchases =
      user &&
      (await prisma.purchasedChapter.findMany({
        where: {
          userId: user.id,
        },
      }));

    const isSubscribed =
      user &&
      user.stripeSubscriptionId &&
      user.stripeCurrentPeriodEnd! > new Date();
    // if not authorize, change title to Spoiler
    const parsedChapters = chapters.map((chapter) => {
      if (!chapter.publicAt) return chapter;

      if (chapter.publicAt && isBefore(chapter.publicAt, new Date())) {
        return { ...chapter };
      }

      if (isSubscribed) {
        return { ...chapter, isSubscribed: true };
      }

      if (existingPurchases?.some((p) => p.chapterId === chapter.id)) {
        return { ...chapter, isBought: true };
      }

      return {
        ...chapter,
        title: "Spoiler",
      };
    });

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
          lte: new Date(),
        },
      },
    });

    return {
      data: {
        chapters: parsedChapters,
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
          lte: new Date(),
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
      return isValidUser.message;
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

export async function schedulePublicRelease(
  chapterId: number,
  publicReleaseDate: Date
) {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser.message;
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
        publicAt: publicReleaseDate,
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
      return isValidUser.message;
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
      return isValidUser.message;
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
      return isValidUser.message;
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
      return isValidUser.message;
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
      return isValidUser.message;
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
