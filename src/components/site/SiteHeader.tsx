import Link from "next/link";
import { Coins } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getBalance } from "@/lib/credits";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { DemoMenu, MobileNav, UserMenu } from "./UserMenu";

export async function SiteHeader() {
  const viewer = await getViewer();
  const balance = viewer ? await getBalance(db, viewer.id) : null;
  const headerViewer = viewer && { username: viewer.username, imageUrl: viewer.imageUrl, isAdmin: viewer.isAdmin, isDemo: viewer.isDemo };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/65">
      <div className="container-page flex h-16 items-center gap-3">
        <MobileNav viewer={headerViewer} />
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/novels">Browse</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/schedule">Schedule</Link>
          </Button>
          {viewer && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/library">Library</Link>
            </Button>
          )}
        </nav>
        <SearchBox className="mx-auto hidden w-full max-w-xs md:block" />
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          {headerViewer ? (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 font-semibold tabular-nums" aria-label={`${balance} credits`}>
                <Link href="/credits">
                  <Coins className="text-amber-500" />
                  {balance}
                </Link>
              </Button>
              <UserMenu viewer={headerViewer} />
            </>
          ) : (
            <>
              <DemoMenu />
              <Button asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t">
      <div className="container-page flex flex-col gap-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Logo className="text-base text-foreground" />
        <p className="max-w-md">
          A portfolio project. Novels are public-domain texts from{" "}
          <a href="https://www.gutenberg.org" className="underline underline-offset-2 hover:text-foreground">
            Project Gutenberg
          </a>
          ; payments run in Stripe test mode.
        </p>
        <nav className="flex gap-4">
          <Link href="/novels" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/schedule" className="hover:text-foreground">
            Schedule
          </Link>
          <a href="https://github.com/vincealwynsibay/taleverse" className="hover:text-foreground">
            Source
          </a>
        </nav>
      </div>
    </footer>
  );
}
