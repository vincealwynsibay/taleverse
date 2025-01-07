"use server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../db";
import {v2 as cloudinary, UploadApiResponse} from "cloudinary"
import { uploadPreset } from "../cloudinary";


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

export async function uploadImage(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const uploadResult: UploadApiResponse | undefined = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          upload_preset: uploadPreset
        }, function (error, result) {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        })
        .end(buffer);
      });
  return uploadResult
}
