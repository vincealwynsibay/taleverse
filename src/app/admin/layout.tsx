import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Per-viewer pages: never prerender or cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Taleverse" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?redirect_url=/admin");
  // Don't reveal that the admin area exists to non-admins.
  if (!viewer.isAdmin) notFound();

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg">
        <div className="container-page flex h-14 items-center gap-4">
          <Logo className="text-lg" />
          <Badge variant="secondary">Admin</Badge>
          <nav className="ml-4 flex items-center gap-1 text-sm">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">Overview</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/novels/new">New novel</Link>
            </Button>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {viewer.isDemo && <span className="hidden text-xs text-muted-foreground sm:inline">Demo admin · changes reset nightly</span>}
            <ThemeToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                View site <ExternalLink />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
