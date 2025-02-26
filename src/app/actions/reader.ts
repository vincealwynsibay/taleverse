"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { unlockChapter } from "@/lib/credits";
import { fail, ok, run } from "@/lib/action";
import { clamp } from "@/lib/utils";
import { refreshRating } from "@/lib/ratings";

const id = z.number().int().positive();

export async function unlockChapterAction(chapterId: number) {
  return run(async () => {
    const viewer = await requireViewer();
    const res = await unlockChapter(db, viewer.id, id.parse(chapterId));
    if (!res.ok) {
      if (res.reason === "insufficient-credits") {
        return fail(`You need ${res.price} credits but have ${res.balance}.`, "insufficient-credits");
      }
      return fail(res.reason === "not-found" ? "Chapter not found." : "This chapter is already free.", res.reason);
    }
    revalidatePath("/novels/[slug]/[chapter]", "page");
    return ok({ balance: res.balance });
  });
}

export async function toggleLibraryAction(novelId: number) {
  return run(async () => {
    const viewer = await requireViewer();
    const key = { userId_novelId: { userId: viewer.id, novelId: id.parse(novelId) } };
    const existing = await db.libraryEntry.findUnique({ where: key });
    if (existing) await db.libraryEntry.delete({ where: key });
    else await db.libraryEntry.create({ data: { userId: viewer.id, novelId } });
    revalidatePath("/library");
    return ok({ inLibrary: !existing });
  });
}

/** Called by the reader while scrolling (throttled client-side). */
export async function saveProgressAction(chapterId: number, position: number) {
  return run(async () => {
    const viewer = await requireViewer();
    const chapter = await db.chapter.findUnique({ where: { id: id.parse(chapterId) }, select: { novelId: true } });
    if (!chapter) return fail("Chapter not found.");
    const pos = clamp(z.number().finite().parse(position), 0, 1);
    await db.readingProgress.upsert({
      where: { userId_novelId: { userId: viewer.id, novelId: chapter.novelId } },
      update: { chapterId, position: pos },
      create: { userId: viewer.id, novelId: chapter.novelId, chapterId, position: pos },
    });
    return ok(undefined);
  });
}

const reviewInput = z.object({
  novelId: id,
  rating: z.number().int().min(1, "Pick a rating").max(5),
  body: z.string().trim().min(10, "Write at least a sentence (10+ characters).").max(2000, "Keep it under 2000 characters."),
});

export async function saveReviewAction(input: z.input<typeof reviewInput>) {
  return run(async () => {
    const viewer = await requireViewer();
    const { novelId, rating, body } = reviewInput.parse(input);
    const novel = await db.novel.findUnique({ where: { id: novelId }, select: { slug: true } });
    if (!novel) return fail("Novel not found.");
    await db.$transaction(async (tx) => {
      await tx.review.upsert({
        where: { userId_novelId: { userId: viewer.id, novelId } },
        update: { rating, body },
        create: { userId: viewer.id, novelId, rating, body },
      });
      await refreshRating(tx, novelId);
    });
    revalidatePath(`/novels/${novel.slug}`);
    return ok(undefined);
  });
}

export async function deleteReviewAction(novelId: number) {
  return run(async () => {
    const viewer = await requireViewer();
    const novel = await db.novel.findUnique({ where: { id: id.parse(novelId) }, select: { slug: true } });
    if (!novel) return fail("Novel not found.");
    await db.$transaction(async (tx) => {
      await tx.review.deleteMany({ where: { userId: viewer.id, novelId } });
      await refreshRating(tx, novelId);
    });
    revalidatePath(`/novels/${novel.slug}`);
    return ok(undefined);
  });
}

const commentInput = z.object({
  chapterId: id,
  parentId: id.optional(),
  body: z.string().trim().min(1, "Say something first.").max(2000, "Keep comments under 2000 characters."),
});

const COMMENT_COOLDOWN_MS = 5_000;

export async function postCommentAction(input: z.input<typeof commentInput>) {
  return run(async () => {
    const viewer = await requireViewer();
    const { chapterId, body, parentId } = commentInput.parse(input);
    const last = await db.comment.findFirst({ where: { userId: viewer.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    if (last && Date.now() - last.createdAt.getTime() < COMMENT_COOLDOWN_MS) {
      return fail("You're commenting a little fast. Try again in a few seconds.", "rate-limited");
    }
    const chapter = await db.chapter.findUnique({ where: { id: chapterId }, select: { number: true, novel: { select: { slug: true } } } });
    if (!chapter) return fail("Chapter not found.");
    if (parentId) {
      const parent = await db.comment.findUnique({ where: { id: parentId }, select: { chapterId: true, deletedAt: true } });
      if (!parent || parent.chapterId !== chapterId) return fail("That comment no longer exists.");
      if (parent.deletedAt) return fail("You can't reply to a deleted comment.");
    }
    const comment = await db.comment.create({ data: { userId: viewer.id, chapterId, body, parentId } });
    revalidatePath(`/novels/${chapter.novel.slug}/${chapter.number}`);
    return ok({ id: comment.id });
  });
}

export async function deleteCommentAction(commentId: number) {
  return run(async () => {
    const viewer = await requireViewer();
    const comment = await db.comment.findUnique({
      where: { id: id.parse(commentId) },
      select: { userId: true, _count: { select: { replies: true } }, chapter: { select: { number: true, novel: { select: { slug: true } } } } },
    });
    if (!comment) return fail("Comment not found.");
    if (comment.userId !== viewer.id && !viewer.isAdmin) return fail("You can only delete your own comments.", "forbidden");
    // Keep the thread intact if people replied; otherwise remove it outright.
    if (comment._count.replies > 0) await db.comment.update({ where: { id: commentId }, data: { deletedAt: new Date(), body: "" } });
    else await db.comment.delete({ where: { id: commentId } });
    revalidatePath(`/novels/${comment.chapter.novel.slug}/${comment.chapter.number}`);
    return ok(undefined);
  });
}

/** Up (1), down (-1) or clear (0) a vote. Score and vote change together. */
export async function voteCommentAction(commentId: number, value: number) {
  return run(async () => {
    const viewer = await requireViewer();
    const v = z.union([z.literal(-1), z.literal(0), z.literal(1)]).parse(value);
    const cid = id.parse(commentId);
    const score = await db.$transaction(async (tx) => {
      const existing = await tx.commentVote.findUnique({ where: { userId_commentId: { userId: viewer.id, commentId: cid } } });
      const delta = v - (existing?.value ?? 0);
      if (v === 0) await tx.commentVote.deleteMany({ where: { userId: viewer.id, commentId: cid } });
      else
        await tx.commentVote.upsert({
          where: { userId_commentId: { userId: viewer.id, commentId: cid } },
          update: { value: v },
          create: { userId: viewer.id, commentId: cid, value: v },
        });
      const updated = await tx.comment.update({ where: { id: cid }, data: { score: { increment: delta } }, select: { score: true } });
      return updated.score;
    });
    return ok({ score });
  });
}
