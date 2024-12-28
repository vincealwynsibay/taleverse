"use server";

import prisma from "../db";
import { checkUser } from "./common";

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
      return { message: "Novel not found.", success: false };
    }

    const chapter = await prisma.chapter.create({
      data: {
        title: `Untitled Chapter ${novel?._count.chapter}`,
        content: "",
        novelId: novelId,
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
    });

    console.log(JSON.stringify(chapter));

    return {
      data: chapter,
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}
