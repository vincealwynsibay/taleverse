import type { Block, InlineContent } from "../blocks";

/** "_italic_ text" -> inline content with italic runs. */
export function parseInline(text: string): InlineContent[] {
  const out: InlineContent[] = [];
  const re = /_([^_]+)_/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index), styles: {} });
    out.push({ type: "text", text: m[1], styles: { italic: true } });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last), styles: {} });
  return out;
}

/** Seed markup (see scripts/lib/gutenberg.ts) -> BlockNote blocks. */
export function markupToBlocks(paragraphs: string[]): Block[] {
  return paragraphs.map((p): Block => {
    if (p === "---") return { type: "divider", children: [] };
    if (p.startsWith("> ")) return { type: "quote", content: parseInline(p.slice(2)), children: [] };
    return { type: "paragraph", content: parseInline(p), children: [] };
  });
}
