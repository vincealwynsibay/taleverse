import NovelItem from "@/components/NovelItem";
import { getNovels } from "@/lib/actions/novel.action";

export default async function Page() {
  const novels = await getNovels();

  if (!novels) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mx-4 md:grid md:grid-cols-3 ">
        {novels.data &&
          novels.data?.map((novel) => {
            return <NovelItem key={novel.id} novel={novel} />;
          })}
      </div>
    </div>
  );
}
