import CreateChapterButton from "@/components/CreateChapterButton";
import { getNovel } from "@/lib/actions/novel.action";
import { getCurrentUser } from "@/lib/actions/user.action";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (user.data?.user.role !== "ADMIN") {
    redirect("/sign-in");
  }

  const slug = (await params).slug;
  const novel = await getNovel(slug);

  if (!novel.data) return null;

  return (
    <div>
      <CreateChapterButton slug={slug} novelId={novel.data.id} />
      <h1>{novel.data.title}</h1>
      <p>{novel.data.synopsis}</p>
    </div>
  );
}
