/**
 * The subset of BlockNote's document JSON that Taleverse stores and renders.
 * The editor is restricted to these block types, and the reader renders them
 * on the server (see components/reader/ChapterBody.tsx).
 */
export type TextStyles = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  textColor?: string;
  backgroundColor?: string;
};

export type StyledText = { type: "text"; text: string; styles?: TextStyles };
export type LinkContent = { type: "link"; href: string; content: StyledText[] };
export type InlineContent = StyledText | LinkContent;

type BaseBlock = { id?: string; children?: Block[]; props?: Record<string, unknown> };

export type Block =
  | (BaseBlock & { type: "paragraph"; content?: InlineContent[] })
  | (BaseBlock & { type: "heading"; content?: InlineContent[]; props?: { level?: number } & Record<string, unknown> })
  | (BaseBlock & { type: "quote"; content?: InlineContent[] })
  | (BaseBlock & { type: "image"; props?: { url?: string; caption?: string; name?: string } & Record<string, unknown> })
  | (BaseBlock & { type: "divider" })
  | (BaseBlock & { type: string; content?: unknown });

export function asBlocks(json: unknown): Block[] {
  return Array.isArray(json) ? (json as Block[]) : [];
}

export function paragraph(text: string): Block {
  return { type: "paragraph", content: [{ type: "text", text, styles: {} }] };
}

/** Plain text of one block's inline content. */
export function blockText(block: Block): string {
  const content = (block as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  return content
    .map((c: InlineContent) => (c.type === "link" ? c.content.map((t) => t.text).join("") : c.type === "text" ? c.text : ""))
    .join("");
}

export function countWords(blocks: Block[]): number {
  let n = 0;
  for (const b of blocks) {
    const words = blockText(b).trim().split(/\s+/).filter(Boolean);
    n += words.length;
    if (b.children?.length) n += countWords(b.children);
  }
  return n;
}

/**
 * The teaser a locked chapter shows: the first few non-empty blocks, capped by
 * word count. Only this ever leaves the server for a locked chapter.
 */
export function previewBlocks(blocks: Block[], maxWords = 120): Block[] {
  const out: Block[] = [];
  let words = 0;
  for (const b of blocks) {
    const w = blockText(b).trim().split(/\s+/).filter(Boolean).length;
    if (w === 0 && b.type !== "image") continue;
    out.push({ ...b, children: [] });
    words += w;
    if (words >= maxWords || out.length >= 4) break;
  }
  return out;
}
