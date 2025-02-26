import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <p className="text-6xl font-semibold text-primary">404</p>
      <div>
        <h1 className="text-lg font-semibold">This page has been torn out</h1>
        <p className="mt-2 text-muted-foreground">The chapter or novel you&apos;re looking for doesn&apos;t exist, or isn&apos;t out yet.</p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/novels">Browse novels</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/schedule">Release schedule</Link>
        </Button>
      </div>
    </main>
  );
}
