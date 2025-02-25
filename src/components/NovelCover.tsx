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
  const base = cn(
    "relative aspect-[2/3] shrink-0 overflow-hidden rounded-md shadow-[0_1px_2px_rgb(0_0_0/0.2),0_8px_24px_-8px_rgb(0_0_0/0.35)] ring-1 ring-black/10",
    className,
  );

  if (coverUrl) {
    return (
      <div className={base}>
        <Image src={coverUrl} alt={`Cover of ${title}`} fill sizes="(max-width: 640px) 40vw, 240px" className="object-cover" priority={priority} />
      </div>
    );
  }

  if (size === "xs") {
    return (
      <div
        role="img"
        aria-label={`Cover of ${title}`}
        className={cn(base, "flex items-center justify-center font-display text-lg font-semibold text-white/90")}
        style={{ background: `linear-gradient(160deg, oklch(0.5 0.12 ${hue}), oklch(0.28 0.08 ${(hue + 30) % 360}))` }}
      >
        {title.replace(/^(the|a|an)\s+/i, "")[0]}
      </div>
    );
  }

  const titleSize = { sm: "text-[0.7rem]", md: "text-base", lg: "text-2xl" }[size];
  const authorSize = { sm: "text-[0.5rem]", md: "text-[0.65rem]", lg: "text-xs" }[size];
  const shortTitle = title.split(/[;:]/)[0];

  return (
    <div
      role="img"
      aria-label={`Cover of ${title}`}
      className={cn(base, "flex flex-col justify-between text-white")}
      style={{
        background: `radial-gradient(120% 80% at 20% 0%, oklch(0.62 0.13 ${hue}) 0%, transparent 60%),
          linear-gradient(160deg, oklch(0.42 0.11 ${hue}) 0%, oklch(0.24 0.07 ${(hue + 30) % 360}) 100%)`,
      }}
    >
      {/* spine shading + paper grain */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/30 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 3px)" }}
      />
      <div className={cn("relative px-[12%] pt-[14%]", size === "sm" && "px-[10%] pt-[12%]")}>
        <div className="mb-[8%] h-px w-1/3 bg-white/60" />
        <p className={cn("font-display leading-[1.05] font-semibold tracking-tight text-balance", titleSize)}>{shortTitle}</p>
      </div>
      {author && (
        <p className={cn("relative px-[12%] pb-[12%] font-sans tracking-[0.18em] text-white/80 uppercase", authorSize)}>
          {author}
        </p>
      )}
    </div>
  );
}
