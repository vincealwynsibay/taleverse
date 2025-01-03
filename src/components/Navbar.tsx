"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Menu, Moon, Search, Sun, User } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme } from "next-themes";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const isAuth = false;

  return (
    <div className="container px-4 py-2 max-w-6xl mx-auto">
      <nav className=" flex justify-between items-center gap-4 w-full">
        <div className="items-center justify-between gap-4 hidden md:flex">
          <Link href="/" className="font-bold text-lg">
            taleverse.
          </Link>
          <Link href="/">Homepage</Link>
          <Link href="/">Series</Link>
        </div>

        <div className="contents md:hidden">
          <Sheet>
            <SheetTitle className="hidden">
              <VisuallyHidden.Root>x</VisuallyHidden.Root>
            </SheetTitle>
            <SheetTrigger>
              <Button variant="outline" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side={"left"}>
              <div className="flex flex-col gap-2 text-lg">
                <Link href="/">Taleverse</Link>
                <Link href="/">Homepage</Link>
                <Link href="/">Series</Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="w-full h-fit relative">
          <Input startIcon={Search} />
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
          {isAuth ? (
            <>
              {/* dark mode toggle */}
              {/* account dropdown */}
              <Button>
                <User />
              </Button>
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
