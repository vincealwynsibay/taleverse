/**
 * Turns a Project Gutenberg plain-text ebook into chapters of compact markup:
 *   "plain paragraph with _italic_ words"
 *   "> verse or quoted block\nkeeps its line breaks"
 *   "---"  (section break)
 * prisma/seed.ts expands this markup into BlockNote blocks.
 */
export type BookConfig = {
  /** Matches a chapter heading line (after trimming). Capture group 1, if any, is an inline title. */
  heading: RegExp;
  /** The heading is followed by a short subtitle line that is the chapter's title. */
  subtitles?: boolean;
  /** Lines that mark a section break inside a chapter (e.g. "II." in Sherlock Holmes stories). */
  sectionBreak?: RegExp;
  /** Segments shorter than this are tables of contents or front matter. */
  minWords?: number;
  /**
   * The book repeats its headings in a table of contents: when the same heading
   * line appears twice, keep only the later (real) one.
   */
  dedupe?: boolean;
  /** The whole text is indented by this many spaces (strip it before parsing). */
  indent?: number;
};

export type SplitChapter = { title: string; paragraphs: string[] };

const SMALL_WORDS = new Set(["a", "an", "and", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);

export function titleCase(input: string): string {
  const continued = /[-—]+\s*_?continued_?\.?$/i.test(input.trim());
  const s = input
    .trim()
    .replace(/[-—]+\s*_?continued_?\.?$/i, "")
    .replace(/_/g, "")
    .replace(/--/g, " — ")
    .trim()
    .replace(/\.$/, "");
  const suffix = continued ? " (continued)" : "";
  const letters = s.replace(/[^A-Za-z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (!letters || upper / letters.length < 0.7) return s + suffix; // already mixed case
  const cased = s
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.replace(/^(\W*)(\w)/, (_, p, c) => p + c.toUpperCase())))
    .join("")
    .trim();
  return cased + suffix;
}

/** "Chapter 12" carries no information beyond the number; treat it as untitled. */
export const isGenericTitle = (t: string) => /^chapter [0-9ivxlc]+\.?$/i.test(t.trim());

export function stripBoilerplate(raw: string): string {
  const text = raw.replace(/\r\n?/g, "\n");
  const start = text.search(/^\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG.*$/m);
  const end = text.search(/^\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG.*$/m);
  const body = text.slice(start >= 0 ? text.indexOf("\n", start) + 1 : 0, end >= 0 ? end : undefined);
  // Illustration captions: keep a chapter heading hidden inside one, drop the rest.
  return body.replace(/\[Illustration[^\]]*\]/g, (m) => {
    const heading = m.match(/\b(chapter [ivxlc]+\.?)/i);
    return heading ? `\n\n${heading[1].toUpperCase()}\n\n` : "\n";
  });
}

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

function toParagraphs(lines: string[], cfg: BookConfig): string[] {
  const out: string[] = [];
  const chunks = lines.join("\n").split(/\n\s*\n/);
  for (const chunk of chunks) {
    const raw = chunk.replace(/\s+$/, "");
    if (!raw.trim()) continue;
    const rawLines = raw.split("\n");
    if (cfg.sectionBreak && rawLines.length === 1 && cfg.sectionBreak.test(rawLines[0].trim())) {
      if (out.length && out[out.length - 1] !== "---") out.push("---");
      continue;
    }
    if (/^\s*(\*\s*){3,}$/.test(raw)) {
      if (out.length && out[out.length - 1] !== "---") out.push("---");
      continue;
    }
    // Every line indented: verse, a letter heading or a quotation. Keep line breaks.
    const indented = rawLines.every((l) => /^\s{2,}\S/.test(l));
    if (indented && rawLines.length > 1) {
      out.push("> " + rawLines.map((l) => l.trim()).join("\n"));
      continue;
    }
    const text = rawLines
      .map((l) => l.trim())
      .join(" ")
      .replace(/--/g, "—")
      .replace(/\s+/g, " ")
      .trim();
    if (text) out.push(text);
  }
  while (out[0] === "---") out.shift();
  while (out[out.length - 1] === "---") out.pop();
  return out;
}

export function splitBook(raw: string, cfg: BookConfig): SplitChapter[] {
  const strip = cfg.indent ? new RegExp(`^ {1,${cfg.indent}}`) : null;
  const lines = stripBoilerplate(raw)
    .split("\n")
    .map((l) => (strip ? l.replace(strip, "") : l));
  const marks: { line: number; inlineTitle?: string }[] = [];
  lines.forEach((l, i) => {
    const m = l.trim().match(cfg.heading);
    // Inline title: whichever capture group matched (alternations can use several).
    if (m) marks.push({ line: i, inlineTitle: m.slice(1).find(Boolean)?.trim() });
  });
  if (cfg.dedupe) {
    const lastIndex = new Map<string, number>();
    marks.forEach((m, i) => lastIndex.set(lines[m.line].trim(), i));
    for (let i = marks.length - 1; i >= 0; i--) {
      if (lastIndex.get(lines[marks[i].line].trim()) !== i) marks.splice(i, 1);
    }
  }

  const chapters: SplitChapter[] = [];
  marks.forEach((mark, idx) => {
    let bodyStart = mark.line + 1;
    const bodyEnd = idx + 1 < marks.length ? marks[idx + 1].line : lines.length;
    let title = mark.inlineTitle ? titleCase(mark.inlineTitle) : "";

    if (cfg.subtitles && !title) {
      // First non-empty line within the next 3, if it's a short one-line paragraph.
      for (let j = bodyStart; j < Math.min(bodyStart + 3, bodyEnd); j++) {
        const t = lines[j].trim();
        if (!t) continue;
        const next = (lines[j + 1] ?? "").trim();
        if (t.length <= 60 && !next) {
          title = titleCase(t.replace(/\.$/, ""));
          bodyStart = j + 1;
        }
        break;
      }
    }

    const paragraphs = toParagraphs(lines.slice(bodyStart, bodyEnd), cfg);
    const words = paragraphs.reduce((n, p) => n + wordCount(p), 0);
    if (words < (cfg.minWords ?? 150)) return; // TOC entry, front matter
    chapters.push({ title, paragraphs });
  });

  // Trailing "THE END" and similar.
  const last = chapters[chapters.length - 1];
  if (last) {
    while (last.paragraphs.length && /^(the end|finis)\.?$/i.test(last.paragraphs[last.paragraphs.length - 1])) {
      last.paragraphs.pop();
    }
  }
  return chapters;
}
