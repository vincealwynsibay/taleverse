"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { createNovelAction, updateNovelAction } from "@/app/actions/admin";
import { NovelCover } from "@/components/NovelCover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Novel = {
  id: number;
  title: string;
  author: string;
  synopsis: string;
  releaseYear: number | null;
  status: "ONGOING" | "COMPLETED" | "HIATUS";
  coverUrl: string | null;
  coverHue: number;
  genres: { slug: string }[];
};

export function NovelForm({ novel, genres }: { novel?: Novel; genres: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(novel?.title ?? "");
  const [author, setAuthor] = useState(novel?.author ?? "");
  const [hue, setHue] = useState(novel?.coverHue ?? 200);
  const [preview, setPreview] = useState<string | null>(novel?.coverUrl ?? null);
  const [selected, setSelected] = useState<Set<string>>(new Set(novel?.genres.map((g) => g.slug)));

  return (
    <form
      className="grid gap-8 md:grid-cols-[220px_1fr]"
      action={(form) =>
        start(async () => {
          const res = novel ? await updateNovelAction(novel.id, form) : await createNovelAction(form);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success(novel ? "Novel saved" : "Novel created");
          router.push(`/admin/novels/${res.data.slug}`);
          router.refresh();
        })
      }
    >
      <div className="space-y-3">
        <NovelCover title={title || "Untitled"} author={author} coverUrl={preview} hue={hue} />
        <div className="space-y-1.5">
          <Label htmlFor="cover">Cover image</Label>
          <Input
            id="cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : (novel?.coverUrl ?? null));
            }}
          />
          <p className="text-xs text-muted-foreground">Optional. Without one, a typographic cover is generated.</p>
        </div>
        {novel?.coverUrl && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="removeCover" onChange={(e) => setPreview(e.target.checked ? null : novel.coverUrl)} /> Remove cover
          </label>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="coverHue">Generated cover colour</Label>
          <input
            id="coverHue"
            name="coverHue"
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required minLength={2} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
          <div className="space-y-1.5">
            <Label htmlFor="author">Author</Label>
            <Input id="author" name="author" required value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="releaseYear">First published</Label>
            <Input id="releaseYear" name="releaseYear" inputMode="numeric" pattern="[0-9]{4}" placeholder="2026" defaultValue={novel?.releaseYear ?? ""} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="synopsis">Synopsis</Label>
          <Textarea id="synopsis" name="synopsis" required minLength={20} rows={5} defaultValue={novel?.synopsis} />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Status</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            {(["ONGOING", "COMPLETED", "HIATUS"] as const).map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="status" value={s} defaultChecked={(novel?.status ?? "ONGOING") === s} className="accent-primary" />
                {s[0] + s.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Genres (up to 5)</legend>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => {
              const on = selected.has(g.slug);
              return (
                <label
                  key={g.slug}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                    on ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                  )}
                >
                  <input
                    type="checkbox"
                    name="genres"
                    value={g.slug}
                    checked={on}
                    className="sr-only"
                    onChange={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(g.slug)) next.delete(g.slug);
                        else next.add(g.slug);
                        return next;
                      })
                    }
                  />
                  {g.name}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" />}
            {novel ? "Save changes" : "Create novel"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
