import { getGenres } from "@/lib/queries";
import { NovelForm } from "@/components/admin/NovelForm";

export const metadata = { title: "New novel" };

export default async function NewNovelPage() {
  const genres = await getGenres();
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">New novel</h1>
      <div className="rounded-2xl border bg-card p-6">
        <NovelForm genres={genres} />
      </div>
    </div>
  );
}
