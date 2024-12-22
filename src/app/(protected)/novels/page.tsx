import { getCurrentUser } from "@/lib/actions/user.action";
import { redirect } from "next/navigation";

export default async function Page({}) {
  const user = await getCurrentUser();
  if (user.data?.user.role !== "ADMIN") {
    redirect("/sign-in");
  }

  return <div className="">Hello, admin</div>;
}
