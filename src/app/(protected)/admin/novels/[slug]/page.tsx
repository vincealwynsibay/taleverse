import CreateChapterButton from "@/components/CreateChapterButton";
import { getNovel } from "@/lib/actions/novel.action";
import { getCurrentUser } from "@/lib/actions/user.action";
import Link from "next/link";
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

  console.log(novel);

  return (
    <div>
      <CreateChapterButton slug={slug} novelId={novel.data.id} />
      <h1>{novel.data.title}</h1>
      <p>{novel.data.synopsis}</p>

      {/* all chapters */}
      <div className="flex flex-col gap-2">
        {novel.data.chapter.length > 0 &&
          novel.data.chapter.map((chapter) => {
            return (
              <div key={chapter.id} className="flex flex-row gap-3">
                <Link href={`/admin/novels/${slug}/chapters/${chapter.id}`}>
                  {chapter.title}
                </Link>
                <p>{chapter.published ? "published" : "not published"}</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
