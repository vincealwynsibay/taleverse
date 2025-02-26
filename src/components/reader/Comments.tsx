"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCommentAction, postCommentAction } from "@/app/actions/reader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Comment = { id: number; body: string; createdAt: Date; user: { id: number; username: string } };

export function Comments({
  chapterId,
  comments,
  viewer,
}: {
  chapterId: number;
  comments: Comment[];
  viewer: { id: number; isAdmin: boolean } | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  return (
    <section className="mx-auto max-w-[var(--reader-width)] px-5 pt-4 pb-16 font-sans" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="mb-6 flex items-center gap-2 font-display text-xl font-semibold">
        <MessageCircle className="size-5 opacity-60" aria-hidden /> {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {viewer ? (
        <form
          className="mb-8 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await postCommentAction({ chapterId, body });
              if (!res.ok) toast.error(res.error);
              else {
                setBody("");
                router.refresh();
              }
            });
          }}
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Thoughts on this chapter?"
            rows={3}
            maxLength={1000}
            aria-label="Write a comment"
            className="border-current/15 bg-transparent"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending || !body.trim()}>
              Post comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="mb-8 text-sm opacity-70">
          <Link href="/sign-in" className="font-medium underline underline-offset-2">
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}

      <ul className="space-y-6">
        {comments.map((c) => (
          <li key={c.id} className="group flex gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-current/10 text-[0.65rem] font-semibold">{c.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{c.user.username}</span>
                <time suppressHydrationWarning className="text-xs opacity-55" dateTime={new Date(c.createdAt).toISOString()}>
                  {formatDistanceToNowStrict(new Date(c.createdAt), { addSuffix: true })}
                </time>
                {viewer && (viewer.id === c.user.id || viewer.isAdmin) && (
                  <button
                    type="button"
                    aria-label="Delete comment"
                    className="ml-auto opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100! focus-visible:opacity-100"
                    onClick={() =>
                      start(async () => {
                        const res = await deleteCommentAction(c.id);
                        if (!res.ok) toast.error(res.error);
                        else router.refresh();
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </p>
              <p className="mt-0.5 text-[0.95rem] leading-relaxed whitespace-pre-line">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
