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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DemoButtons } from "./DemoButtons";
import { SearchBox } from "./SearchBox";

type HeaderViewer = { username: string; imageUrl: string | null; isAdmin: boolean; isDemo: boolean } | null;

export function UserMenu({ viewer }: { viewer: NonNullable<HeaderViewer> }) {
  const { signOut } = useClerk();
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ redirectUrl: "/" })}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileNav({ viewer }: { viewer: HeaderViewer }) {
  const links = [
    { href: "/novels", label: "Browse" },
    { href: "/schedule", label: "Release schedule" },
    ...(viewer ? [{ href: "/library", label: "Library" }, { href: "/credits", label: "Credits" }] : []),
    ...(viewer?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Taleverse</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4">
          <SearchBox />
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-2 py-2 text-base hover:bg-accent">
                {l.label}
              </Link>
            ))}
          </nav>
          {!viewer && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No sign-up needed: jump in with a demo account.</p>
              <DemoButtons layout="stack" />
              <Button asChild variant="link" className="px-0">
                <Link href="/sign-in">Sign in with your own account</Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DemoMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="hidden sm:inline-flex">
          Try the demo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <p className="mb-3 text-sm text-muted-foreground">
          Shared demo accounts, reset nightly. The reader starts with 25 credits; the admin can edit and schedule chapters.
        </p>
        <DemoButtons layout="stack" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
