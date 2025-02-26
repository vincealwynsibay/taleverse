import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Section({
  title,
  eyebrow,
  href,
  hrefLabel = "See all",
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("container-page mt-16", className)}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="mb-1 font-mono text-xs font-semibold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>}
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="group flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            {hrefLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-dashed px-6 py-14 text-center", className)}>
      <p className="font-display text-xl font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
