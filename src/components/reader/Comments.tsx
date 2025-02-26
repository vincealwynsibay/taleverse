"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowBigDown, ArrowBigUp, Link2, MessageCircle, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCommentAction, postCommentAction, voteCommentAction } from "@/app/actions/reader";
import { cn, formatCompact } from "@/lib/utils";

export type CommentData = {
  id: number;
  parentId: number | null;
  /** Set for paragraph comments; null for the chapter discussion. */
  paragraph: number | null;
  body: string;
  score: number;
  deleted: boolean;
  createdAt: Date;
  myVote: number;
  user: { id: number; username: string; isAdmin: boolean } | null;
};

type Node = CommentData & { children: Node[]; descendants: number };
type Sort = "top" | "new" | "old";
type Viewer = { id: number; isAdmin: boolean } | null;

const MAX_DEPTH = 6;

function buildTree(comments: CommentData[], sort: Sort): Node[] {
  const byId = new Map<number, Node>(comments.map((c) => [c.id, { ...c, children: [], descendants: 0 }]));
  const roots: Node[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const cmp = (a: Node, b: Node) => {
    if (sort === "top") return b.score - a.score || +new Date(b.createdAt) - +new Date(a.createdAt);
    if (sort === "new") return +new Date(b.createdAt) - +new Date(a.createdAt);
    return +new Date(a.createdAt) - +new Date(b.createdAt);
  };
  // Drop deleted comments that nobody replied to, then sort and count.
  const prune = (nodes: Node[]): Node[] =>
    nodes
      .map((n) => ({ ...n, children: prune(n.children) }))
      .filter((n) => !(n.deleted && n.children.length === 0));
  const walk = (nodes: Node[]): number =>
    nodes.sort(cmp).reduce((total, node) => {
      node.descendants = walk(node.children);
      return total + 1 + node.descendants;
    }, 0);
  const pruned = prune(roots);
  walk(pruned);
  return pruned;
}

/**
 * Reddit-style threaded discussion: nested replies with thread lines you can
 * click to collapse, up/down votes, Top/New/Old sorting and inline replies.
 */
export function Comments({ chapterId, comments, viewer }: { chapterId: number; comments: CommentData[]; viewer: Viewer }) {
  const [sort, setSort] = useState<Sort>("top");
  // Paragraph comments live in their own threads (see ParagraphComments).
  const chapterComments = useMemo(() => comments.filter((c) => c.paragraph === null), [comments]);
  const tree = useMemo(() => buildTree(chapterComments, sort), [chapterComments, sort]);
  const count = chapterComments.filter((c) => !c.deleted).length;

  return (
    <section className="mx-auto max-w-[var(--reader-width)] px-5 pt-4 pb-16 font-sans" aria-labelledby="comments-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="comments-heading" className="flex items-center gap-2 text-lg font-semibold">
          <MessageCircle className="size-5 opacity-60" aria-hidden /> {count} {count === 1 ? "comment" : "comments"}
        </h2>
        <div className="flex items-center gap-1 rounded-md border border-current/15 p-0.5 text-xs" role="radiogroup" aria-label="Sort comments">
          {(["top", "new", "old"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={sort === s}
              onClick={() => setSort(s)}
              className={cn("rounded px-2.5 py-1 capitalize", sort === s ? "bg-primary/15 font-medium text-primary" : "opacity-70 hover:opacity-100")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {viewer ? (
        <Composer chapterId={chapterId} placeholder="What did you think of this chapter?" />
      ) : (
        <p className="mb-6 rounded-md border border-dashed border-current/20 px-4 py-3 text-sm opacity-80">
          <Link href="/sign-in" className="font-medium underline underline-offset-2">
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}

      {tree.length === 0 ? (
        <p className="py-8 text-center text-sm opacity-60">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {tree.map((node) => (
            <Thread key={node.id} node={node} depth={0} chapterId={chapterId} viewer={viewer} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Composer({
  chapterId,
  parentId,
  paragraph,
  placeholder,
  autoFocus,
  onDone,
}: {
  chapterId: number;
  parentId?: number;
  paragraph?: number;
  placeholder: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className={cn("rounded-lg border border-current/15 focus-within:border-primary/60", !parentId && "mb-2")}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await postCommentAction({ chapterId, body, parentId, paragraph });
          if (!res.ok) return void toast.error(res.error);
          setBody("");
          onDone?.();
          router.refresh();
        });
      }}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        maxLength={2000}
        autoFocus={autoFocus}
        aria-label={parentId ? "Write a reply" : "Write a comment"}
        className="block w-full resize-y bg-transparent px-3 py-2 text-sm outline-none placeholder:opacity-50"
      />
      <div className="flex justify-end gap-2 border-t border-current/10 px-2 py-1.5">
        {onDone && (
          <button type="button" onClick={onDone} className="rounded-md px-3 py-1 text-xs opacity-70 hover:opacity-100">
            Cancel
          </button>
        )}
        <button type="submit" disabled={pending || !body.trim()} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-40">
          {parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}

function Votes({ comment, viewer }: { comment: CommentData; viewer: Viewer }) {
  const router = useRouter();
  const [vote, setVote] = useState(comment.myVote);
  const [score, setScore] = useState(comment.score);
  const [, start] = useTransition();

  const cast = (value: 1 | -1) => {
    if (!viewer) return router.push("/sign-in");
    const next = vote === value ? 0 : value;
    setScore((s) => s + next - vote); // optimistic
    setVote(next);
    start(async () => {
      const res = await voteCommentAction(comment.id, next);
      if (!res.ok) {
        toast.error(res.error);
        setScore(comment.score);
        setVote(comment.myVote);
      } else setScore(res.data.score);
    });
  };

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => cast(1)}
        aria-label="Upvote"
        aria-pressed={vote === 1}
        className={cn("rounded p-0.5 hover:bg-current/10", vote === 1 ? "text-primary" : "opacity-60 hover:opacity-100")}
      >
        <ArrowBigUp className={cn("size-5", vote === 1 && "fill-current")} />
      </button>
      <span className={cn("min-w-5 text-center text-xs font-semibold tabular-nums", vote === 1 && "text-primary", vote === -1 && "text-blue-400")}>
        {formatCompact(score)}
      </span>
      <button
        type="button"
        onClick={() => cast(-1)}
        aria-label="Downvote"
        aria-pressed={vote === -1}
        className={cn("rounded p-0.5 hover:bg-current/10", vote === -1 ? "text-blue-400" : "opacity-60 hover:opacity-100")}
      >
        <ArrowBigDown className={cn("size-5", vote === -1 && "fill-current")} />
      </button>
    </div>
  );
}

function Thread({ node, depth, chapterId, viewer }: { node: Node; depth: number; chapterId: number; viewer: Viewer }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showDeep, setShowDeep] = useState(false);
  const [, start] = useTransition();
  const canDelete = viewer && node.user && (viewer.id === node.user.id || viewer.isAdmin);
  const initials = node.user?.username.slice(0, 2).toUpperCase() ?? "··";

  return (
    <li id={`comment-${node.id}`} className="scroll-mt-20">
      <div className="flex gap-2">
        {/* Avatar + thread line (click the line to collapse, like Reddit) */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand thread" : "Collapse thread"}
            aria-expanded={!collapsed}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-semibold",
              node.user?.isAdmin ? "bg-primary text-primary-foreground" : "bg-current/10",
            )}
          >
            {collapsed ? "+" : initials}
          </button>
          {!collapsed && (node.children.length > 0 || replying) && (
            <button type="button" onClick={() => setCollapsed(true)} aria-label="Collapse thread" className="group mt-1 flex w-4 flex-1 justify-center">
              <span className="w-px bg-current/15 group-hover:w-0.5 group-hover:bg-primary" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs">
            <span className={cn("font-medium", node.deleted && "italic opacity-60")}>{node.user ? node.user.username : "[deleted]"}</span>
            {node.user?.isAdmin && <span className="rounded-sm bg-primary/15 px-1 text-[0.65rem] font-medium text-primary">Author</span>}
            <span className="opacity-40">·</span>
            <time suppressHydrationWarning className="opacity-55" dateTime={new Date(node.createdAt).toISOString()}>
              {formatDistanceToNowStrict(new Date(node.createdAt), { addSuffix: true })}
            </time>
            {collapsed && node.descendants > 0 && (
              <span className="opacity-55">
                · {node.descendants} {node.descendants === 1 ? "reply" : "replies"} hidden
              </span>
            )}
          </p>

          {!collapsed && (
            <>
              <p className={cn("mt-1 text-[0.95rem] leading-relaxed whitespace-pre-line", node.deleted && "italic opacity-50")}>
                {node.deleted ? "Comment deleted." : node.body}
              </p>
              {!node.deleted && (
                <div className="mt-1 -ml-1 flex items-center gap-1 text-xs">
                  <Votes comment={node} viewer={viewer} />
                  {viewer && depth < MAX_DEPTH && (
                    <button
                      type="button"
                      onClick={() => setReplying((r) => !r)}
                      className="flex items-center gap-1 rounded px-2 py-1 opacity-70 hover:bg-current/10 hover:opacity-100"
                    >
                      <MessageSquare className="size-3.5" /> Reply
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(`${location.origin}${location.pathname}#comment-${node.id}`);
                      toast.success("Link copied");
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 opacity-70 hover:bg-current/10 hover:opacity-100"
                  >
                    <Link2 className="size-3.5" /> Share
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() =>
                        start(async () => {
                          const res = await deleteCommentAction(node.id);
                          if (!res.ok) toast.error(res.error);
                          else router.refresh();
                        })
                      }
                      className="flex items-center gap-1 rounded px-2 py-1 opacity-70 hover:bg-current/10 hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  )}
                </div>
              )}

              {replying && (
                <div className="mt-2">
                  <Composer
                    chapterId={chapterId}
                    parentId={node.id}
                    placeholder={`Reply to ${node.user?.username ?? "comment"}`}
                    autoFocus
                    onDone={() => setReplying(false)}
                  />
                </div>
              )}

              {node.children.length > 0 &&
                (depth + 1 >= MAX_DEPTH && !showDeep ? (
                  <button type="button" onClick={() => setShowDeep(true)} className="mt-2 text-xs font-medium text-primary hover:underline">
                    Continue this thread ({node.descendants} more) →
                  </button>
                ) : (
                  <ul className="mt-3 space-y-4">
                    {node.children.map((child) => (
                      <Thread key={child.id} node={child} depth={depth + 1} chapterId={chapterId} viewer={viewer} />
                    ))}
                  </ul>
                ))}
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/** One paragraph's discussion: the quoted passage, its threads and a composer. */
export function ParagraphComments({
  chapterId,
  paragraph,
  quote,
  comments,
  viewer,
}: {
  chapterId: number;
  paragraph: number;
  quote: string;
  comments: CommentData[];
  viewer: Viewer;
}) {
  const tree = useMemo(() => buildTree(comments.filter((c) => c.paragraph === paragraph), "top"), [comments, paragraph]);
  return (
    <div className="space-y-5 px-4 pb-8 font-sans">
      {quote && (
        <blockquote className="line-clamp-6 border-l-2 border-primary/60 pl-3 text-sm leading-relaxed italic opacity-80">{quote}</blockquote>
      )}
      {viewer ? (
        <Composer chapterId={chapterId} paragraph={paragraph} placeholder="Say something about this passage" autoFocus={tree.length === 0} />
      ) : (
        <p className="rounded-md border border-dashed border-current/20 px-4 py-3 text-sm opacity-80">
          <Link href="/sign-in" className="font-medium underline underline-offset-2">
            Sign in
          </Link>{" "}
          to comment on this passage.
        </p>
      )}
      {tree.length === 0 ? (
        <p className="py-4 text-center text-sm opacity-60">No comments on this paragraph yet.</p>
      ) : (
        <ul className="space-y-5">
          {tree.map((node) => (
            <Thread key={node.id} node={node} depth={0} chapterId={chapterId} viewer={viewer} />
          ))}
        </ul>
      )}
    </div>
  );
}
