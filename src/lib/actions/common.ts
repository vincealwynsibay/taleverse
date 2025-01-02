"use server"
import { auth } from "@clerk/nextjs/server";
import prisma from "../db";



export async function checkUser() {
    const { userId: clerkId } = await auth();

  if (!clerkId) {
    return {message: "You must be signed in to perform this action.", success: false, data: undefined};
  }
  
  const user = await prisma.user.findFirst({
    where: {
      clerkId: clerkId,
    },
  });

  if (!user) {
    return {message: "User does not exist.", success: false, data: undefined};
  }

  return { message: "User exist", success:true}
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