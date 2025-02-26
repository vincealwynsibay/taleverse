"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteReviewAction, saveReviewAction } from "@/app/actions/reader";
import { RatingStars } from "@/components/RatingStars";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Review = {
  id: number;
  rating: number;
  body: string;
  createdAt: Date;
  user: { id: number; username: string; imageUrl: string | null };
};

const labels = ["", "Didn't work for me", "It was okay", "Liked it", "Really liked it", "Loved it"];

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div className="flex" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="rounded p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Star className={cn("size-6 transition-colors", n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{labels[shown]}</span>
    </div>
  );
}

export function ReviewForm({ novelId, existing }: { novelId: number; existing: { rating: number; body: string } | null }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [editing, setEditing] = useState(!existing);
  const [pending, start] = useTransition();

  if (!editing && existing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-4">
        <p className="flex items-center gap-2 text-sm">
          You rated this <RatingStars value={existing.rating} />
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit review
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await deleteReviewAction(novelId);
                if (!res.ok) toast.error(res.error);
                else {
                  setRating(0);
                  setBody("");
                  setEditing(true);
                  router.refresh();
                }
              })
            }
          >
            <Trash2 /> Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-3 rounded-md border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveReviewAction({ novelId, rating, body });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Review posted");
            setEditing(false);
            router.refresh();
          }
        });
      }}
    >
      <StarInput value={rating} onChange={setRating} />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you think? No spoilers for the latest chapters, please."
        rows={3}
        maxLength={2000}
        aria-label="Your review"
      />
      <div className="flex justify-end gap-2">
        {existing && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending || rating === 0}>
          {existing ? "Update review" : "Post review"}
        </Button>
      </div>
    </form>
  );
}

export function ReviewList({ reviews, viewerId }: { reviews: Review[]; viewerId: number | null }) {
  return (
    <ul className="space-y-6">
      {reviews.map((r) => (
        <li key={r.id} className="flex gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-secondary text-xs font-semibold">{r.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-semibold">
                {r.user.username}
                {r.user.id === viewerId && <span className="ml-1 font-normal text-muted-foreground">(you)</span>}
              </span>
              <RatingStars value={r.rating} size={13} />
              <time suppressHydrationWarning className="text-xs text-muted-foreground" dateTime={new Date(r.createdAt).toISOString()}>
                {formatDistanceToNowStrict(new Date(r.createdAt), { addSuffix: true })}
              </time>
            </div>
            <p className="mt-1 text-[0.95rem] leading-relaxed text-pretty text-foreground/90">{r.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SignInToReview() {
  return (
    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-2">
        Sign in
      </Link>{" "}
      or try the demo to rate and review.
    </p>
  );
}
