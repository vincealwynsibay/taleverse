import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CircleCheck, Coins, CreditCard, Sparkles } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { paymentsMode } from "@/lib/env";
import { fulfillCheckoutSessionById } from "@/lib/payments";
import { getCreditsData } from "@/lib/queries";
import { cn, formatUsd } from "@/lib/utils";
import { BuyPackButton } from "@/components/credits/BuyPackButton";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Credits" };

export default async function CreditsPage({ searchParams }: PageProps<"/credits">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?redirect_url=/credits");
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const sessionId = one(sp.session_id);
  const purchase = one(sp.purchase);
  const returnTo = one(sp.return);
  const safeReturn = returnTo?.startsWith("/novels/") ? returnTo : null;

  // Fulfil on return too, in case the webhook hasn't arrived (or isn't set up locally).
  if (purchase === "success" && sessionId) await fulfillCheckoutSessionById(sessionId, viewer.id);

  const { balance, packs, history } = await getCreditsData(viewer.id);
  const mode = paymentsMode();

  return (
    <div className="container-page py-10">
      {safeReturn && (
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link href={safeReturn}>
            <ArrowLeft /> Back to your chapter
          </Link>
        </Button>
      )}

      {purchase === "success" && (
        <div role="status" className="mb-8 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm">
          <CircleCheck className="size-5 text-success" aria-hidden />
          <span>
            Payment received, credits added. Happy reading!
            {safeReturn && (
              <>
                {" "}
                <Link href={safeReturn} className="font-medium underline underline-offset-2">
                  Continue your chapter →
                </Link>
              </>
            )}
          </span>
        </div>
      )}
      {purchase === "cancelled" && (
        <p role="status" className="mb-8 rounded-2xl border p-4 text-sm text-muted-foreground">
          Checkout cancelled. You weren&apos;t charged.
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <header className="mb-8">
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Credits</h1>
            <p className="mt-2 text-muted-foreground">Credits unlock early-access chapters. Most chapters cost 5.</p>
          </header>

          <div className="mb-10 flex items-center gap-4 rounded-3xl border bg-card p-6">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-400/15">
              <Coins className="size-7 text-amber-500" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your balance</p>
              <p className="font-display text-4xl font-semibold tabular-nums">{balance}</p>
            </div>
          </div>

          <h2 className="mb-4 font-display text-xl font-semibold">Top up</h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {packs.map((p) => (
              <li
                key={p.id}
                className={cn("relative flex flex-col rounded-2xl border bg-card p-5", p.highlight && "border-primary/50 ring-2 ring-primary/20")}
              >
                {p.highlight && (
                  <span className="absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-primary-foreground uppercase">
                    <Sparkles className="size-3" /> Best value
                  </span>
                )}
                <p className="text-sm text-muted-foreground">{p.name}</p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{p.credits}</p>
                <p className="text-xs text-muted-foreground">
                  credits · about {Math.floor(p.credits / 5)} chapters
                </p>
                <div className="mt-5">
                  <BuyPackButton packId={p.id} highlight={p.highlight} label={`Buy for ${formatUsd(p.priceCents)}`} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <CreditCard className="mt-px size-4 shrink-0" aria-hidden />
            {mode === "stripe" ? (
              <span>
                Payments run in <strong>Stripe test mode</strong>. Use card <code className="rounded bg-muted px-1 py-0.5">4242 4242 4242 4242</code>, any future
                expiry and any CVC.
              </span>
            ) : (
              <span>Stripe isn&apos;t configured on this server, so purchases are simulated and credited instantly.</span>
            )}
          </p>
        </div>

        <aside>
          <h2 className="mb-4 font-display text-xl font-semibold">History</h2>
          <ol className="divide-y rounded-2xl border bg-card">
            {history.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{e.description}</p>
                  <p className="text-xs text-muted-foreground">{format(e.createdAt, "MMM d, h:mm a")}</p>
                </div>
                <span className={cn("shrink-0 font-semibold tabular-nums", e.delta > 0 ? "text-success" : "text-muted-foreground")}>
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </span>
              </li>
            ))}
            {history.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">No transactions yet.</li>}
          </ol>
        </aside>
      </div>
    </div>
  );
}
