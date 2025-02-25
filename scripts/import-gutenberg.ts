/**
 * Downloads the catalog from Project Gutenberg and writes prisma/seed-data/<slug>.json.
 * Run once (`pnpm import:gutenberg`); the output is committed so seeding needs no network.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { catalog } from "../src/lib/seed/catalog";
import { isGenericTitle, splitBook } from "../src/lib/seed/gutenberg";

const cacheDir = new URL("./.cache/", import.meta.url);
const outDir = new URL("../prisma/seed-data/", import.meta.url);

async function fetchBook(id: number): Promise<string> {
  const file = new URL(`pg${id}.txt`, cacheDir);
  if (existsSync(file)) return readFile(file, "utf8");
  const res = await fetch(`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`, {
    headers: { "User-Agent": "taleverse-seed/1.0" },
  });
  if (!res.ok) throw new Error(`Gutenberg ${id}: HTTP ${res.status}`);
  const text = await res.text();
  await mkdir(cacheDir, { recursive: true });
  await writeFile(file, text);
  return text;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const book of catalog) {
    const chapters = splitBook(await fetchBook(book.gutenbergId), book.split).map((c) => ({
      title: isGenericTitle(c.title) ? "" : c.title,
      paragraphs: c.paragraphs,
    }));
    const words = chapters.reduce((n, c) => n + c.paragraphs.join(" ").split(/\s+/).length, 0);
    await writeFile(
      new URL(`${book.slug}.json`, outDir),
      JSON.stringify({ slug: book.slug, source: `https://www.gutenberg.org/ebooks/${book.gutenbergId}`, chapters }) + "\n",
    );
    console.log(`${book.slug.padEnd(36)} ${String(chapters.length).padStart(3)} chapters  ${words.toLocaleString()} words`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
