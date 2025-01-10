import { getNovels } from "@/lib/actions/novel.action";
import { getCurrentUser } from "@/lib/actions/user.action";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getCurrentUser();

  if (user.data?.user.role !== "ADMIN") {
    redirect("/");
  }

  const novels = await getNovels();

  if (!novels) {
    return null;
  }

  console.log(novels);

  return (
    <div>
      <div className="flex flex-row items-center justify-normal flex-wrap gap-4 mx-4">
        {novels.data &&
          novels.data?.map((novel) => {
            return (
              <div
                key={novel.id}
                className="px-4 py-2 radius-sm border-gray-400 border-2"
              >
                <Link href={`/admin/novels/${novel.slug}`}>
                  <h1 className="text-xl font-bold">{novel.title}</h1>
                </Link>
                <div className="">
                  <p>{novel.author}</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
