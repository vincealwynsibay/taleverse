"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { BookText, House, Menu, Moon, Search, Sun, User } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { SignOutButton, useAuth } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState } from "react";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { isSignedIn, userId } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  console.log(isSignedIn, userId);

  return (
    <div className="border-b-[1px] border-b-border mb-4">
      <nav className="container px-4 py-2 max-w-6xl mx-auto flex justify-between items-center gap-4 w-full">
        <div className="items-center justify-between gap-4 hidden md:flex">
          <Link href="/" className="font-bold text-lg text-teal-600">
            taleverse.
          </Link>
          <Link href="/" className="text-sm">
            Homepage
          </Link>
          <Link href="/novels" className="text-sm">
            Series
          </Link>
        </div>

        <div className="contents md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTitle className="hidden">
              <VisuallyHidden.Root>x</VisuallyHidden.Root>
            </SheetTitle>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side={"left"}>
              <SheetTitle></SheetTitle>
              <div className="flex flex-col gap-8 mt-8 ">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-400 text-sm"
                  onClick={() => setSheetOpen(false)}
                >
                  <House className="fill-gray-400 text-background w-5 aspect-square" />
                  Homepage
                </Link>
                <Link
                  href="/novels"
                  className="flex items-center gap-2 text-gray-400 text-sm"
                  onClick={() => setSheetOpen(false)}
                >
                  <BookText className="fill-gray-400 text-background w-5 aspect-square" />
                  Series
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="w-full h-fit relative">
          <Input startIcon={Search} placeholder="Search by title or author" />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              theme == "light" ? setTheme("dark") : setTheme("light")
            }
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          {isSignedIn ? (
            <>
              {/* dark mode toggle */}
              {/* account dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <User />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/admin/novels">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <SignOutButton>Logout</SignOutButton>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/sign-in">Login</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
