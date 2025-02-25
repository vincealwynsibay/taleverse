"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { buyCreditPackAction } from "@/app/actions/credits";
import { Button } from "@/components/ui/button";

export function BuyPackButton({ packId, label, highlight }: { packId: number; label: string; highlight?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      className="w-full"
      variant={highlight ? "default" : "outline"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await buyCreditPackAction(packId);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          const url = res.data.redirectUrl;
          if (url.startsWith("http")) window.location.assign(url); // Stripe Checkout
          else {
            router.push(url);
            router.refresh();
          }
        })
      }
    >
      {pending && <LoaderCircle className="animate-spin" />}
      {label}
    </Button>
  );
}
