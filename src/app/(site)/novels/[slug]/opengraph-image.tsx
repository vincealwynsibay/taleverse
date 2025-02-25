import { getNovel } from "@/lib/queries";
import { ogCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Novel on Taleverse";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const novel = await getNovel((await params).slug);
  if (!novel) return ogCard({ eyebrow: "Taleverse", title: "Serial fiction", hue: 30 });
  return ogCard({
    eyebrow: novel.genres.map((g) => g.name).join(" · ") || "Serial fiction",
    title: novel.title,
    subtitle: novel.author,
    hue: novel.coverHue,
    meta: [
      ...(novel.ratingCount ? [`Rated ${novel.ratingAvg.toFixed(1)} by ${novel.ratingCount} readers`] : []),
      novel.status === "ONGOING" ? "Ongoing" : "Completed",
    ],
  });
}
