"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, ok, run } from "@/lib/action";
import { asBlocks, countWords } from "@/lib/blocks";
import { slugify } from "@/lib/utils";
import { storeImage, UploadError } from "@/lib/uploads";

const id = z.number().int().positive();

const novelInput = z.object({
  title: z.string().trim().min(2, "Title is too short.").max(120),
  author: z.string().trim().min(2, "Author is required.").max(80),
  synopsis: z.string().trim().min(20, "Write a synopsis of at least 20 characters.").max(2000),
  releaseYear: z.coerce.number().int().min(1000).max(2100).optional().or(z.literal("").transform(() => undefined)),
  status: z.enum(["ONGOING", "COMPLETED", "HIATUS"]),
  genres: z.array(z.string()).max(5, "Pick up to 5 genres."),
  coverHue: z.coerce.number().int().min(0).max(360).default(200),
});

function parseNovelForm(form: FormData) {
  return novelInput.parse({
    title: form.get("title"),
    author: form.get("author"),
    synopsis: form.get("synopsis"),
    releaseYear: form.get("releaseYear") ?? "",
    status: form.get("status") ?? "ONGOING",
    genres: form.getAll("genres").map(String),
    coverHue: form.get("coverHue") ?? 200,
  });
}

async function coverFrom(form: FormData) {
  const file = form.get("cover");
  return file instanceof File && file.size > 0 ? storeImage(file, "covers") : undefined;
}

function isUnique(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function createNovelAction(form: FormData) {
  return run(async () => {
    await requireAdmin();
    const input = parseNovelForm(form);
    const slug = slugify(input.title);
    if (!slug) return fail("Title needs some letters or numbers.");
    try {
      const coverUrl = await coverFrom(form);
      const novel = await db.novel.create({
        data: {
          ...input,
          slug,
          coverUrl,
          genres: { connect: input.genres.map((s) => ({ slug: s })) },
        },
      });
      revalidatePath("/", "layout");
      return ok({ slug: novel.slug });
    } catch (e) {
      if (e instanceof UploadError) return fail(e.message);
      if (isUnique(e)) return fail("A novel with that title already exists.");
      throw e;
    }
  });
}

export async function updateNovelAction(novelId: number, form: FormData) {
  return run(async () => {
    await requireAdmin();
    const input = parseNovelForm(form);
    try {
      const coverUrl = await coverFrom(form);
      const novel = await db.novel.update({
        where: { id: id.parse(novelId) },
        data: {
          ...input,
          ...(coverUrl && { coverUrl }),
          ...(form.get("removeCover") === "on" && { coverUrl: null }),
          genres: { set: input.genres.map((s) => ({ slug: s })) },
        },
      });
      revalidatePath("/", "layout");
      return ok({ slug: novel.slug });
    } catch (e) {
      if (e instanceof UploadError) return fail(e.message);
      if (isUnique(e)) return fail("A novel with that title already exists.");
      throw e;
    }
  });
}

export async function deleteNovelAction(novelId: number) {
  return run(async () => {
    await requireAdmin();
    await db.novel.delete({ where: { id: id.parse(novelId) } });
    revalidatePath("/", "layout");
    return ok(undefined);
  });
}

export async function createChapterAction(novelId: number) {
  return run(async () => {
    await requireAdmin();
    const novel = await db.novel.findUnique({ where: { id: id.parse(novelId) }, select: { slug: true } });
    if (!novel) return fail("Novel not found.");
    // Retry once if two admins create a chapter at the same moment.
    for (let attempt = 0; attempt < 2; attempt++) {
      const last = await db.chapter.findFirst({ where: { novelId }, orderBy: { number: "desc" }, select: { number: true } });
      try {
        const chapter = await db.chapter.create({ data: { novelId, number: (last?.number ?? 0) + 1, title: "" } });
        return ok({ slug: novel.slug, number: chapter.number });
      } catch (e) {
        if (!isUnique(e)) throw e;
      }
    }
    return fail("Couldn't create the chapter. Try again.");
  });
}

const ALLOWED_BLOCKS = new Set(["paragraph", "heading", "quote", "image", "divider"]);
const MAX_CONTENT_BYTES = 1_000_000;

const chapterInput = z.object({
  title: z.string().trim().max(150),
  content: z.string().max(MAX_CONTENT_BYTES, "This chapter is too long to save in one piece."),
});

export async function saveChapterAction(chapterId: number, input: z.input<typeof chapterInput>) {
  return run(async () => {
    await requireAdmin();
    const { title, content } = chapterInput.parse(input);
    let blocks;
    try {
      blocks = asBlocks(JSON.parse(content)).filter((b) => ALLOWED_BLOCKS.has(b.type));
    } catch {
      return fail("Chapter content is not valid.");
    }
    const chapter = await db.chapter.update({
      where: { id: id.parse(chapterId) },
      data: { title, content: blocks as object[], wordCount: countWords(blocks) },
      select: { number: true, updatedAt: true, novel: { select: { slug: true } } },
    });
    revalidatePath(`/novels/${chapter.novel.slug}/${chapter.number}`);
    return ok({ savedAt: chapter.updatedAt.toISOString() });
  });
}

const scheduleInput = z
  .object({
    publishedAt: z.iso.datetime({ offset: true }).nullable(),
    freeAt: z.iso.datetime({ offset: true }).nullable(),
    unlockPrice: z.number().int().min(1, "Price must be at least 1 credit.").max(100),
  })
  .refine((v) => !v.freeAt || (v.publishedAt && new Date(v.freeAt) > new Date(v.publishedAt)), {
    message: "The free date must be after the publish date.",
  });

/** Draft (no publish date), scheduled/published, and optional early-access window. */
export async function scheduleChapterAction(chapterId: number, input: z.input<typeof scheduleInput>) {
  return run(async () => {
    await requireAdmin();
    const v = scheduleInput.parse(input);
    const chapter = await db.chapter.update({
      where: { id: id.parse(chapterId) },
      data: {
        publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
        freeAt: v.publishedAt && v.freeAt ? new Date(v.freeAt) : null,
        unlockPrice: v.unlockPrice,
      },
      select: { novelId: true, number: true, novel: { select: { slug: true } } },
    });
    await db.novel.update({ where: { id: chapter.novelId }, data: { updatedAt: new Date() } });
    revalidatePath("/", "layout");
    return ok(undefined);
  });
}

export async function deleteChapterAction(chapterId: number) {
  return run(async () => {
    await requireAdmin();
    const chapter = await db.chapter.delete({ where: { id: id.parse(chapterId) }, select: { novel: { select: { slug: true } } } });
    revalidatePath("/", "layout");
    return ok({ slug: chapter.novel.slug });
  });
}

/** Image upload from the chapter editor. */
export async function uploadChapterImageAction(form: FormData) {
  return run(async () => {
    await requireAdmin();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file received.");
    try {
      return ok({ url: await storeImage(file, "chapters") });
    } catch (e) {
      if (e instanceof UploadError) return fail(e.message);
      throw e;
    }
  });
}
