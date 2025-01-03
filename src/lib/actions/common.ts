"use server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../db";

export async function checkUser() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("You must be signed in to perform this action.")
    }

    const user = await prisma.user.findFirst({
      where: {
        clerkId: clerkId,
      },
    });

    if (!user) {
      throw new Error("User does not exist.")
    }

    return { message: "User exist", success: true };
  } catch (err) {
    return { message: err.message, data: undefined, success: false };
  }
}

export async function uploadFile(file: File) {
  const body = new FormData();
  body.append("file", file);

  const ret = await fetch("https://tmpfiles.org/api/v1/upload", {
    method: "POST",
    body: body,
  });
  return (await ret.json()).data.url.replace(
    "tmpfiles.org/",
    "tmpfiles.org/dl/"
  );
}
