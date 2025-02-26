import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  author?: string;
  coverUrl?: string | null;
  hue?: number;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  priority?: boolean;
};

/**
 * A book cover. Uploaded art when there is some, otherwise a generated
 * typographic cover in the novel's hue so the shelf still looks designed.
 */
export function NovelCover({ title, author, coverUrl, hue = 200, className, size = "md", priority }: Props) {
  const base = cn("relative aspect-[2/3] shrink-0 overflow-hidden rounded-sm border border-black/10 dark:border-white/10", className);

  if (coverUrl) {
    return (
      <div className={base}>
        <Image src={coverUrl} alt={`Cover of ${title}`} fill sizes="(max-width: 640px) 40vw, 240px" className="object-cover" priority={priority} />
      </div>
    );
  }

  // Flat, paperback-style: one solid colour, a darker band, plain type.
  const bg = `oklch(0.45 0.09 ${hue})`;
  const band = `oklch(0.32 0.07 ${hue})`;

  if (size === "xs") {
    return (
      <div
        role="img"
        aria-label={`Cover of ${title}`}
        className={cn(base, "flex items-center justify-center text-sm font-semibold text-white/90")}
        style={{ background: bg }}
      >
        {title.replace(/^(the|a|an)\s+/i, "")[0]}
      </div>
    );
  }

  const titleSize = { sm: "text-[0.65rem]", md: "text-sm", lg: "text-xl" }[size];
  const authorSize = { sm: "text-[0.5rem]", md: "text-[0.65rem]", lg: "text-xs" }[size];
  const shortTitle = title.split(/[;:]/)[0];

  return (
    <div role="img" aria-label={`Cover of ${title}`} className={cn(base, "flex flex-col text-white")} style={{ background: bg }}>
      <div className="flex flex-1 items-end p-[10%]">
        <p className={cn("leading-tight font-semibold text-balance", titleSize)}>{shortTitle}</p>
      </div>
      {author && (
        <p className={cn("truncate px-[10%] py-[7%] text-white/85", authorSize)} style={{ background: band }}>
          {author}
        </p>
      )}
    </div>
  );
}
