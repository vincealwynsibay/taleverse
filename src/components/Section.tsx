import Link from "next/link";
import { cn } from "@/lib/utils";

/** A plain titled block: heading, optional "more" link, hairline underneath. */
export function Section({
  title,
  href,
  hrefLabel = "More",
  className,
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-baseline justify-between gap-4 border-b pb-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="shrink-0 text-sm text-muted-foreground hover:text-primary">
            {hrefLabel} ›
          </Link>
        )}
      </div>
      {children}
    </section>
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
