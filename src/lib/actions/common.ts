"use server"
import { auth } from "@clerk/nextjs/server";
import prisma from "../db";



export async function checkUser() {
    const { userId: clerkId } = await auth();

  if (!clerkId) {
    return {message: "You must be signed in to perform this action.", success: false};
  }

  
  const user = await prisma.user.findFirst({
    where: {
      clerkId: clerkId,
    },
  });

  if (!user) {
    return {message: "User does not exist.", success: false};
  }

  return { message: "User exist", success:true}
}