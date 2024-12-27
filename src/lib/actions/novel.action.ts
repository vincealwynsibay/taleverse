"use server";

import { FormState } from "@/types/types";
import { checkUser } from "./common";
import { novelSchema } from "../validation";
import prisma from "../db";
import { Prisma } from "@prisma/client";
import { generateSlug } from "../utils";

export async function createNovel(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const isValidUser = await checkUser();
  if (!isValidUser.success) {
    return isValidUser;
  }

  const validatedFields = novelSchema.safeParse({
    title: formData.get("title"),
    synopsis: formData.get("synopsis"),
    author: formData.get("author"),
    releaseYear: formData.get("releaseYear"),
  });

  if (!validatedFields.success) {
    console.log(validatedFields.error.issues.map((err) => err.message + "\n"));
    return {
      message: "Please fix errors in form",
      fields: validatedFields.data,
      success: false,
    };
  }

  try {
    await prisma.novel.create({
      data: {
        title: validatedFields.data.title,
        synopsis: validatedFields.data.synopsis,
        author: validatedFields.data.author,
        releaseYear: validatedFields.data.releaseYear,
        slug: generateSlug(validatedFields.data.title)
      },
    });
    return { message: "Novel created successfully.", success: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      console.log(e.code)
      if (e.code === "P2002") {
        return { message: "This novel title has already been taken.", success: false };
      }
    }
    return { message: e.message, success: false };
  }
}

export async function getNovels() {
  const isValidUser = await checkUser();
  if (!isValidUser.success) {
    return isValidUser;
  }

  const novels = await prisma.novel.findMany() ?? [];

  return {
    data: novels,
  };
}

export async function getNovel(slug: string) {
  const isValidUser = await checkUser();
  if (!isValidUser.success) {
    return isValidUser;
  }

  const novel = await prisma.novel.findFirst({
    where: {
      slug: slug,
    },
  });

  return {
    data: novel
  };
}
