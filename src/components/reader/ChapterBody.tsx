import type { ReactNode } from "react";
import type { Block, InlineContent, StyledText } from "@/lib/blocks";

/**
 * Renders stored BlockNote JSON as semantic HTML on the server. Only the block
 * and style types the editor allows are rendered; anything else is dropped.
 * No dangerouslySetInnerHTML, and no editor JavaScript shipped to readers.
 */
function safeHref(href: string) {
  try {
    const u = new URL(href, "https://taleverse.local");
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? href : null;
  } catch {
    return null;
  }
}

function renderText(t: StyledText, key: number): ReactNode {
  let node: ReactNode = t.text;
  const s = t.styles ?? {};
  if (s.code) node = <code>{node}</code>;
  if (s.bold) node = <strong>{node}</strong>;
  if (s.italic) node = <em>{node}</em>;
  if (s.underline) node = <u>{node}</u>;
  if (s.strike) node = <s>{node}</s>;
  return <span key={key}>{node}</span>;
}

function renderInline(content: InlineContent[] | undefined): ReactNode {
  if (!Array.isArray(content)) return null;
  return content.map((c, i) => {
    if (c.type === "link") {
      const href = safeHref(c.href);
      const inner = c.content.map((t, j) => renderText(t, j));
      return href ? (
        <a key={i} href={href} rel="noopener noreferrer nofollow" target="_blank">
          {inner}
        </a>
      ) : (
        <span key={i}>{inner}</span>
      );
    }
    return c.type === "text" ? renderText(c, i) : null;
  });
}

function alignment(block: Block): React.CSSProperties | undefined {
  const a = block.props?.textAlignment;
  return a === "center" || a === "right" || a === "justify" ? { textAlign: a } : undefined;
}

function renderBlock(block: Block, key: number): ReactNode {
  const content = (block as { content?: InlineContent[] }).content;
  switch (block.type) {
    case "paragraph": {
      const inline = renderInline(content);
      return (
        <p key={key} style={alignment(block)}>
          {inline}
        </p>
      );
    }
    case "heading": {
      const level = Number(block.props?.level) || 2;
      const Tag = level <= 2 ? "h2" : "h3";
      return (
        <Tag key={key} style={alignment(block)}>
          {renderInline(content)}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote key={key} className="whitespace-pre-line">
          {renderInline(content)}
        </blockquote>
      );
    case "divider":
      return <hr key={key} />;
    case "image": {
      const url = typeof block.props?.url === "string" ? safeHref(block.props.url) : null;
      if (!url) return null;
      const caption = typeof block.props?.caption === "string" ? block.props.caption : "";
      return (
        <figure key={key}>
          {/* Chapter images are author content from Cloudinary or /uploads; plain img keeps the renderer dependency-free. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={caption} loading="lazy" className="mx-auto" />
          {caption && <figcaption className="mt-2 text-center text-sm opacity-70">{caption}</figcaption>}
        </figure>
      );
    }
    default:
      return null;
  }
}

export function ChapterBody({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map(renderBlock)}</>;
}
