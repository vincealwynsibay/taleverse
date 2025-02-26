import Link from "next/link";
import { X } from "lucide-react";
import { getGenres, listNovels, sortOptions, type SortKey } from "@/lib/queries";
import { NovelRow } from "@/components/novel/NovelCard";
import { EmptyState } from "@/components/Section";
import { cn } from "@/lib/utils";

type Params = { q?: string; genre?: string; status?: string; sort?: string };

/** Filter state lives entirely in the URL, so results are linkable and work without JS. */
export async function BrowseView({ params, basePath, title, intro }: { params: Params; basePath: string; title: string; intro?: string }) {
  const [{ novels, sort, status }, genres] = await Promise.all([listNovels(params), getGenres()]);
  // Genre is part of the path (/genres/horror), everything else is a query param.
  const href = (patch: Partial<Params>) => {
    const { genre: _genre, ...rest } = { ...params, ...patch };
    void _genre;
    const qs = new URLSearchParams(Object.entries(rest).filter(([, v]) => v) as [string, string][]);
    return qs.size ? `${basePath}?${qs}` : basePath;
  };
  const pill = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
      active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-muted-foreground">{intro}</p>}
        {params.q && (
          <p className="mt-4 flex items-center gap-2 text-sm">
            Results for <strong>&ldquo;{params.q}&rdquo;</strong>
            <Link href={href({ q: undefined })} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" /> clear
            </Link>
          </p>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-8">
          <div>
            <h2 className="mb-2 font-mono text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Genre</h2>
            <nav className="flex flex-wrap gap-1 lg:flex-col lg:items-start">
              <Link href={`/novels${params.sort ? `?sort=${params.sort}` : ""}`} className={pill(!params.genre)}>
                All genres
              </Link>
              {genres.map((g) => (
                <Link key={g.id} href={`/genres/${g.slug}${params.sort ? `?sort=${params.sort}` : ""}`} className={pill(params.genre === g.slug)}>
                  {g.name}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h2 className="mb-2 font-mono text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Status</h2>
            <nav className="flex flex-wrap gap-1 lg:flex-col lg:items-start">
              {[
                [undefined, "Any"],
                ["ONGOING", "Ongoing"],
                ["COMPLETED", "Completed"],
              ].map(([value, label]) => (
                <Link key={label} href={href({ status: value })} className={pill(status === value)}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <p className="text-sm text-muted-foreground tabular-nums">
              {novels.length} {novels.length === 1 ? "novel" : "novels"}
            </p>
            <nav className="-mx-1 flex gap-1 overflow-x-auto" aria-label="Sort">
              {(Object.keys(sortOptions) as SortKey[]).map((key) => (
                <Link key={key} href={href({ sort: key === "popular" ? undefined : key })} className={pill(sort === key)}>
                  {sortOptions[key].label}
                </Link>
              ))}
            </nav>
          </div>
          {novels.length ? (
            <div className="-mx-3 grid gap-1">
              {novels.map((n) => (
                <NovelRow key={n.id} novel={n} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing on this shelf">Try a different genre, or clear your search.</EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
