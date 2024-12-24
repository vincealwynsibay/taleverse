"use server"
import { auth } from "@clerk/nextjs/server";
import prisma from "../db";


export async function getCurrentUser() {
    const { userId } = await auth();

  if (!userId) {
    return { message: "You must be signed in to perform this action." };
  }

  const user = await prisma.user.findFirst({
    where: {
      clerkId: userId,
    },
  });

  if (!user) {
    return { message: "User does not exist." };
  }
  return {
    data: {
        user
    }
  }
}