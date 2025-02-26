import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      {/* an open book whose pages form a "T" */}
      <path d="M8 10.5c2.6-.9 5.3-.6 8 1v11c-2.7-1.6-5.4-1.9-8-1z" className="fill-primary-foreground/90" />
      <path d="M24 10.5c-2.6-.9-5.3-.6-8 1v11c2.7-1.6 5.4-1.9 8-1z" className="fill-primary-foreground/70" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-base font-semibold tracking-tight", className)}>
      <LogoMark />
      <span>Taleverse</span>
    </Link>
  );
}
