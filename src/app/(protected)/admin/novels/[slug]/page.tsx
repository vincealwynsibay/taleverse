import { Button } from "@/components/ui/button";
import { getNovel } from "@/lib/actions/novel.action";
import { getCurrentUser } from "@/lib/actions/user.action";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (user.data?.user.role !== "ADMIN") {
    redirect("/sign-in");
  }

  const novel = await getNovel((await params).slug);
  console.log(novel);

  if (!novel.data) return null;

  const createChapter = () => {
    // create a new chapter with random title
    // redirect to new chapter
  };

  return (
    <div>
      <Button asChild onClick={() => createChapter()}>
        <Plus /> Add New Chapter
      </Button>
      <h1>{novel.data.title}</h1>
      <p>{novel.data.synopsis}</p>
    </div>
  );
}
