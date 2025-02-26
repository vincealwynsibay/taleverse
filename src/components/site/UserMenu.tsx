"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { BookMarked, Coins, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authEnabled } from "@/lib/flags";
import { DemoButtons } from "./DemoButtons";
import { SearchBox } from "./SearchBox";

type HeaderViewer = { username: string; imageUrl: string | null; isAdmin: boolean; isDemo: boolean } | null;

function SignOutItem() {
  const { signOut } = useClerk();
  return (
    <DropdownMenuItem onSelect={() => signOut({ redirectUrl: "/" })}>
      <LogOut /> Sign out
    </DropdownMenuItem>
  );
}

export function UserMenu({ viewer }: { viewer: NonNullable<HeaderViewer> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-8">
            {viewer.imageUrl && <AvatarImage src={viewer.imageUrl} alt="" />}
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {viewer.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="truncate">{viewer.username}</span>
          {viewer.isDemo && <Badge variant="secondary">Demo</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/library">
            <BookMarked /> Library
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/credits">
            <Coins /> Credits
          </Link>
        </DropdownMenuItem>
        {viewer.isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboard /> Admin
            </Link>
          </DropdownMenuItem>
        )}
        {authEnabled && (
          <>
            <DropdownMenuSeparator />
            <SignOutItem />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The ☰ menu next to the logo: navigation, genres, and the demo for guests. */
export function MenuSheet({ viewer, genres }: { viewer: HeaderViewer; genres: { name: string; slug: string }[] }) {
  const links = [
    { href: "/", label: "Home" },
    { href: "/novels", label: "Browse all" },
    { href: "/novels?sort=rating", label: "Top rated" },
    { href: "/schedule", label: "Release schedule" },
    ...(viewer ? [{ href: "/library", label: "Library" }, { href: "/credits", label: "Credits" }] : []),
    ...(viewer?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-xs gap-0 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">
            tale<span className="text-primary">verse</span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <SearchBox className="md:hidden" />
          <nav className="flex flex-col">
            {links.map((l) => (
              <SheetClose asChild key={l.href}>
                <Link href={l.href} className="rounded-md px-2 py-2 text-sm hover:bg-accent">
                  {l.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
          <div>
            <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">Genres</p>
            <div className="flex flex-wrap gap-1.5 px-2">
              {genres.map((g) => (
                <SheetClose asChild key={g.slug}>
                  <Link href={`/genres/${g.slug}`} className="rounded-md border px-2 py-1 text-xs hover:border-primary hover:text-primary">
                    {g.name}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </div>
          {!viewer && (
            <div className="space-y-3 rounded-md border bg-muted/40 p-3">
              <p className="text-sm text-muted-foreground">No sign-up needed: use a shared demo account.</p>
              <DemoButtons layout="stack" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
