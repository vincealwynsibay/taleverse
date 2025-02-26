import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Block } from "@/lib/blocks";
import { ChapterBody } from "./ChapterBody";

const render = (blocks: Block[]) => renderToStaticMarkup(<ChapterBody blocks={blocks} />);

describe("ChapterBody", () => {
  it("renders paragraphs with inline styles", () => {
    const html = render([
      { type: "paragraph", content: [{ type: "text", text: "It was ", styles: {} }, { type: "text", text: "late", styles: { italic: true, bold: true } }] },
    ]);
    expect(html).toBe("<p data-p=\"0\"><span>It was </span><span><em><strong>late</strong></em></span></p>");
  });

  it("escapes text instead of injecting HTML", () => {
    const html = render([{ type: "paragraph", content: [{ type: "text", text: "<script>alert(1)</script>" }] }]);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops javascript: links but keeps the text", () => {
    const html = render([
      { type: "paragraph", content: [{ type: "link", href: "javascript:alert(1)", content: [{ type: "text", text: "click" }] }] },
    ]);
    expect(html).not.toContain("href");
    expect(html).toContain("click");
  });

  it("opens safe links with rel=noopener", () => {
    const html = render([{ type: "paragraph", content: [{ type: "link", href: "https://example.com", content: [{ type: "text", text: "x" }] }] }]);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });

  it("renders headings, quotes and dividers, and ignores unknown blocks", () => {
    const html = render([
      { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Part two" }] },
      { type: "quote", content: [{ type: "text", text: "a\nb" }] },
      { type: "divider" },
      { type: "table", content: [] } as Block,
    ]);
    expect(html).toContain("<h3>");
    expect(html).toContain("<blockquote");
    expect(html).toContain("<hr/>");
    expect(html).not.toContain("table");
  });
});
