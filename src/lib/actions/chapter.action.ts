"use server";

import prisma from "../db";
import { checkUser } from "./common";

export async function createChapter(novelId: number) {
  const isValidUser = await checkUser();
  if (!isValidUser.success) {
    return isValidUser;
  }

  console.log(novelId);
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

  const chapter = await prisma.chapter.create({
    data: {
      title: `Untitled Chapter ${novel?._count.chapter}`,
      content: "",
      novelId: novelId,
      published: false,
    },
  });

  console.log(JSON.stringify(chapter));

  return {
    message: "Novel Chapter successfully created",
    data: {
      chapter,
      novel
    },
    success: true,
  };

  // if (!chapter) {
  //   return {message: "Something went wrong", success: false}
  // }
}
