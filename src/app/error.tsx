"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        We couldn&apos;t load this page. It&apos;s probably temporary.
        {error.digest && <span className="mt-1 block text-xs">Reference: {error.digest}</span>}
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
