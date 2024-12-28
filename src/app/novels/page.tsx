import { getNovels } from "@/lib/actions/novel.action";
import Link from "next/link";

export default async function Page() {
  const novels = await getNovels();

  if (!novels) {
    return null;
  }

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
                <Link href={`/novels/${novel.slug}`}>
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
