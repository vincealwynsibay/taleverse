import Editor from "@/components/Editor";
// import NovelItemPreview from "@/components/NovelItemPreview";
import { latestNovelUpdates } from "@/lib/actions/novel.action";

export default async function Home() {
  const latestNovels = await latestNovelUpdates();

  if (!latestNovels.data) {
    return null;
  }

  return (
    <div className="">
      <Editor />
      {/* <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        recent chapters
        {latestNovels.data &&
          latestNovels.data.map((novel) => {
            return <NovelItemPreview key={novel.id} novel={novel} />;
          })}
      </div> */}
    </div>
  );
}
