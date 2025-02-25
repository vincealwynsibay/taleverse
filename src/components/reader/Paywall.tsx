"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { Coins, Hourglass, LoaderCircle, LockKeyholeOpen } from "lucide-react";
import { toast } from "sonner";
import { unlockChapterAction } from "@/app/actions/reader";
import { DemoButtons } from "@/components/site/DemoButtons";
import { Button } from "@/components/ui/button";

type Props = {
  chapterId: number;
  price: number;
  freeAt: string;
  balance: number | null; // null = signed out
  returnTo: string;
};

export function Paywall({ chapterId, price, freeAt, balance, returnTo }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const freeIn = formatDistanceToNowStrict(new Date(freeAt));
  const canAfford = balance !== null && balance >= price;

  const unlock = () =>
    start(async () => {
      const res = await unlockChapterAction(chapterId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Unlocked! ${res.data.balance} credits left.`);
      router.refresh();
    });

  return (
    <div className="relative mt-2 rounded-3xl border border-current/10 bg-[color-mix(in_oklch,var(--reader-bg)_92%,var(--primary))] p-6 text-center font-sans shadow-xl sm:p-8">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <LockKeyholeOpen className="size-6" aria-hidden />
      </div>
      <h2 className="font-display text-2xl font-semibold">This chapter is in early access</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm opacity-75">
        Read it now for <strong className="text-primary">{price} credits</strong>, or wait: it&apos;s free for everyone in{" "}
        <span className="font-medium">{freeIn}</span>.
      </p>

      {balance === null ? (
        <div className="mt-6 space-y-3">
          <DemoButtons className="justify-center" redirectTo={returnTo} />
          <p className="text-xs opacity-60">
            The demo reader starts with 25 credits. Or{" "}
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`} className="underline underline-offset-2">
              sign in
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3">
          {canAfford ? (
            <Button size="lg" onClick={unlock} disabled={pending} className="min-w-56">
              {pending ? <LoaderCircle className="animate-spin" /> : <Coins />}
              Unlock for {price} credits
            </Button>
          ) : (
            <Button asChild size="lg" className="min-w-56">
              <Link href={`/credits?return=${encodeURIComponent(returnTo)}`}>
                <Coins /> Get credits
              </Link>
            </Button>
          )}
          <p className="flex items-center gap-1.5 text-xs opacity-65">
            <Coins className="size-3.5 text-amber-500" aria-hidden /> You have {balance} credits
            {!canAfford && <> · need {price - balance} more</>}
          </p>
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs opacity-55">
        <Hourglass className="size-3.5" aria-hidden /> Early access keeps new chapters coming. Everything goes free after a week.
      </p>
    </div>
  );
}
