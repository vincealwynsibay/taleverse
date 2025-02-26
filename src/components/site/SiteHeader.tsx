import Link from "next/link";
import { Bookmark, Coins } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getBalance } from "@/lib/credits";
import { db } from "@/lib/db";
import { authEnabled } from "@/lib/flags";
import { getGenres } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { MenuSheet, UserMenu } from "./UserMenu";

export async function SiteHeader() {
  const viewer = await getViewer();
  const [balance, genres] = await Promise.all([viewer ? getBalance(db, viewer.id) : null, getGenres()]);
  const headerViewer = viewer && { username: viewer.username, imageUrl: viewer.imageUrl, isAdmin: viewer.isAdmin, isDemo: viewer.isDemo };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-lg">
      <div className="container-page flex h-14 items-center gap-2">
        <Logo />
        <MenuSheet viewer={headerViewer} genres={genres.map((g) => ({ name: g.name, slug: g.slug }))} />
        <SearchBox className="mx-auto hidden w-full max-w-sm md:block" shortcut />
        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" aria-label="Library">
            <Link href="/library">
              <Bookmark />
            </Link>
          </Button>
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
              <Button asChild variant="ghost" size="sm" className="ml-1">
                <Link href="/sign-in">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={authEnabled ? "/sign-up" : "/sign-in"}>Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const columns = [
    {
      title: "Discover",
      links: [
        ["Trending", "/novels"],
        ["Top rated", "/novels?sort=rating"],
        ["Recently updated", "/novels?sort=updated"],
        ["Release schedule", "/schedule"],
      ],
    },
    {
      title: "You",
      links: [
        ["Library", "/library"],
        ["Credits", "/credits"],
        ["Sign in", "/sign-in"],
      ],
    },
    {
      title: "Site",
      links: [
        ["Source code", "https://github.com/vincealwynsibay/taleverse"],
        ["Project Gutenberg", "https://www.gutenberg.org"],
      ],
    },
  ];
  return (
    <footer className="mt-20 border-t">
      <div className="container-page grid gap-8 py-10 text-sm sm:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-xs text-xs text-muted-foreground">
            A portfolio project. Novels are public-domain texts from Project Gutenberg; payments run in Stripe test mode.
          </p>
        </div>
        {columns.map((c) => (
          <nav key={c.title} className="space-y-2">
            <p className="font-medium">{c.title}</p>
            <ul className="space-y-1.5 text-muted-foreground">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-page flex justify-between border-t py-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} taleverse</span>
        <a href="#main" className="hover:text-foreground">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
