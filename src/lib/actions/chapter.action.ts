"use server";

import { Prisma } from "@prisma/client";
import prisma from "../db";
import { checkUser } from "./common";
import { generateSlug } from "../utils";

export async function getNovelPublishedChapters(novelId: number, chap_number?: number, per_page: number = 10, page: number = 1, sort: "asc" | "desc" = "asc") {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }
    
    const limit = per_page
    const offset = (page - 1) * limit 
    console.log(limit, offset, page, chap_number, sort)

    // const [column, order] = (sort.split(".") as [
    //   keyof Chapter,
    //   "asc" | "desc" | undefined
    // ]) ?? ["order_number", "desc"]


    const chapters = await prisma.chapter.findMany({
      where: {
        ...(chap_number && {OR: [
          {
            order_number: chap_number,
          },
          {
            order_number: {
              gte: chap_number,
              lte: parseInt(chap_number + "9") 
            }
          }
      ]}),
        // search
        novelId: novelId,
        published: false
      },
      // pagination
      skip: offset,
      take: per_page,
      // // sort
      orderBy: [{
        order_number: sort 
      }]
    })

    console.log("chap", chap_number)

    const totalCount = await prisma.chapter.count({
      where: {
        ...(chap_number && {OR: [
          {
            order_number: chap_number
          },
          {
              order_number: {
                  gte: chap_number,
                  lte: parseInt(chap_number + "9") 
                }
              }
          ]}),
          // search
        novelId: novelId,
        published: false
      },
    })


    return {
      data: {
        chapters,
        totalCount
      },
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function publishChapter(chapterId: number) {
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
        novel: true
      }
    });

    if (!chapter) {
      throw new Error("Chapter not found.")
    }

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId
      },
      data: {
        published: true
      }
    })

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
      throw new Error("Novel not found.")
    }

    const chapter = await prisma.chapter.create({
      data: {
        title: `Untitled Chapter ${novel?._count.chapter}`,
        novelId: novelId,
        slug: generateSlug(`chapter ${novel?._count.chapter}`),
        published: false,
        order_number: novel?._count.chapter
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
        novel: true
      }
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
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: slug,
      },
      include: {
        novel: true
      }
    });

    return {
      data: chapter,
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function updateChapterContent(chapterId: number, newContent: string) {
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
      throw new Error("Chapter not found.")
    }

    console.log(JSON.parse(newContent))

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        content: JSON.parse(newContent) as Prisma.JsonArray
      }
    })

    return {
      data: updatedChapter,
      success: true,
    };
  } catch (e) {
    console.error(e.message)
    return { message: e.message, success: false };
  }
}

export async function updateChapter(chapterId: number, chapterObject: {content: string, title: string}) {
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
      throw new Error("Chapter not found.")
    }


    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        title: chapterObject.title,
        content: JSON.parse(chapterObject.content) as Prisma.JsonArray
      }
    })

    return {
      data: updatedChapter,
      success: true,
    };
  } catch (e) {
    console.error(e.message)
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
      throw new Error("Chapter not found.")
    }


    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        title: newTitle
      }
    })

    return {
      data: updatedChapter,
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}
