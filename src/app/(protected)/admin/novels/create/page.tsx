import CreateNovelForm from "@/components/CreateNovelForm";
import { getCurrentUser } from "@/lib/actions/user.action";
import { redirect } from "next/navigation";

// redirect to /novel-name/
export default async function Page() {
  const user = await getCurrentUser();

  if (user.data?.user.role !== "ADMIN") {
    redirect("/sign-in");
  }

  return (
    <div>
      <CreateNovelForm />
    </div>
  );
}
