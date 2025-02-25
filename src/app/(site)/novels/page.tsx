import type { Metadata } from "next";
import { BrowseView } from "@/components/novel/BrowseView";

export const metadata: Metadata = { title: "Browse novels" };

export default async function BrowsePage({ searchParams }: PageProps<"/novels">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return (
    <BrowseView
      basePath="/novels"
      title="The shelf"
      intro="Every novel on Taleverse. Filter by genre and status, or sort by what other readers love."
      params={{ q: one(sp.q), status: one(sp.status), sort: one(sp.sort) }}
    />
  );
}
