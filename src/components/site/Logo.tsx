import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wordmark: "tale" + accent "verse". */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("text-lg font-bold tracking-tight whitespace-nowrap", className)} aria-label="Taleverse home">
      tale<span className="text-primary">verse</span>
    </Link>
  );
}
