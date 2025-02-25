"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { BookOpen, LoaderCircle, PenTool } from "lucide-react";
import { toast } from "sonner";
import { startDemoAction, type Persona } from "@/app/actions/demo";
import { Button } from "@/components/ui/button";
import { authEnabled } from "@/lib/flags";
import { cn } from "@/lib/utils";

export function useDemoSignIn() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [persona, setPersona] = useState<Persona | null>(null);

  const start = (p: Persona, redirectTo?: string) => {
    setPersona(p);
    startTransition(async () => {
      const res = await startDemoAction(p);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const attempt = await signIn.ticket({ ticket: res.data.ticket });
      if (attempt.error) {
        toast.error(attempt.error.message ?? "Couldn't start the demo.");
        return;
      }
      await signIn.finalize();
      toast.success(p === "admin" ? "Signed in as the demo admin" : "Signed in as the demo reader: 25 credits to spend");
      router.push(redirectTo ?? (p === "admin" ? "/admin" : "/"));
      router.refresh();
    });
  };

  return { start, pending, persona };
}

type DemoButtonsProps = { className?: string; redirectTo?: string; layout?: "row" | "stack" };

export function DemoButtons(props: DemoButtonsProps) {
  // authEnabled is a build-time constant, so this never switches hooks at runtime.
  return authEnabled ? <EnabledDemoButtons {...props} /> : <DisabledDemoButtons {...props} />;
}

function DisabledDemoButtons({ className, layout = "row" }: DemoButtonsProps) {
  return (
    <div className={cn("flex gap-2", layout === "stack" ? "flex-col" : "flex-wrap", className)}>
      <Button size="lg" disabled title="Add Clerk keys to enable demo accounts">
        <BookOpen /> Try as a reader
      </Button>
      <Button size="lg" variant="outline" disabled title="Add Clerk keys to enable demo accounts">
        <PenTool /> Try as an admin
      </Button>
      <p className="w-full text-xs text-muted-foreground">Demo accounts need Clerk keys (see README). Reading free chapters works without them.</p>
    </div>
  );
}

function EnabledDemoButtons({ className, redirectTo, layout = "row" }: DemoButtonsProps) {
  const { start, pending, persona } = useDemoSignIn();
  return (
    <div className={cn("flex gap-2", layout === "stack" ? "flex-col" : "flex-wrap", className)}>
      <Button onClick={() => start("reader", redirectTo)} disabled={pending} size="lg">
        {pending && persona === "reader" ? <LoaderCircle className="animate-spin" /> : <BookOpen />}
        Try as a reader
      </Button>
      <Button onClick={() => start("admin")} disabled={pending} size="lg" variant="outline">
        {pending && persona === "admin" ? <LoaderCircle className="animate-spin" /> : <PenTool />}
        Try as an admin
      </Button>
    </div>
  );
}
