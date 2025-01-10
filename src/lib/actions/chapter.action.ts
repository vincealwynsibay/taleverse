"use server";

import { Prisma } from "@prisma/client";
import prisma from "../db";
import { checkUser } from "./common";
import { generateSlug } from "../utils";

export async function getNovelPublishedChapters(novelId: number) {
  try {
    const isValidUser = await checkUser();
    if (!isValidUser.success) {
      return isValidUser;
    }

    const chapters = await prisma.chapter.findMany({
      where: {
        novelId: novelId,
        published: true
      },
    })


    return {
      data: chapters,
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
