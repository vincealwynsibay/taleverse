import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** A titled block: "Title ›" (links to the full list), with an optional control on the right. */
export function Section({
  title,
  href,
  aside,
  className,
  children,
}: {
  title: string;
  href?: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">
          {href ? (
            <Link href={href} className="group inline-flex items-center gap-0.5 hover:text-primary">
              {title}
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ) : (
            title
          )}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Small rounded chip used for a section's filter / range control. */
export function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
      {children}
    </Link>
  );
}

export function EmptyState({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-md border border-dashed px-6 py-12 text-center", className)}>
      <p className="font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
