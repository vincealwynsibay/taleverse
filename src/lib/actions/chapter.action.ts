"use server";

import { Prisma } from "@prisma/client";
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
      throw new Error("Novel not found.")
    }

    const chapter = await prisma.chapter.create({
      data: {
        title: `Untitled Chapter ${novel?._count.chapter}`,
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
