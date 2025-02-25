import { describe, expect, it } from "vitest";
import { chapterState } from "../access";
import { countWords, previewBlocks } from "../blocks";
import { splitBook, titleCase, isGenericTitle } from "./gutenberg";
import { markupToBlocks, parseInline } from "./markup";
import { buildSchedule } from "./schedule";

const now = new Date("2026-06-01T12:00:00Z");

describe("buildSchedule", () => {
  it("makes every chapter of a complete novel free", () => {
    const states = buildSchedule(10, "complete", now).map((s) => chapterState(s, now));
    expect(new Set(states)).toEqual(new Set(["free"]));
  });

  it("ends an ongoing novel with 3 early-access and 2 scheduled chapters", () => {
    const states = buildSchedule(12, "ongoing", now).map((s) => chapterState(s, now));
    expect(states.slice(-5)).toEqual(["early-access", "early-access", "early-access", "scheduled", "scheduled"]);
    expect(states.slice(0, 7).every((s) => s === "free")).toBe(true);
  });

  it("releases chapters in order", () => {
    const slots = buildSchedule(20, "ongoing", now);
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].publishedAt.getTime()).toBeGreaterThan(slots[i - 1].publishedAt.getTime());
    }
  });
});

describe("gutenberg splitter", () => {
  const book = [
    "Some licence text",
    "*** START OF THE PROJECT GUTENBERG EBOOK TEST ***",
    "CONTENTS",
    "CHAPTER I.",
    "CHAPTER II.",
    "",
    "CHAPTER I.",
    "The Beginning",
    "",
    `It was a _dark_ and stormy night, and the ${"words ".repeat(160)}`,
    "continued on the next line.",
    "",
    "    A verse line",
    "    and another",
    "",
    "CHAPTER II.",
    "The End of It",
    "",
    `Everything ended--quietly. ${"more ".repeat(160)}`,
    "",
    "THE END",
    "*** END OF THE PROJECT GUTENBERG EBOOK TEST ***",
    "Trailing licence",
  ].join("\n");

  const chapters = splitBook(book, { heading: /^CHAPTER [IVX]+\.$/, subtitles: true });

  it("skips the table of contents and boilerplate", () => {
    expect(chapters.map((c) => c.title)).toEqual(["The Beginning", "The End of It"]);
  });
  it("unwraps hard line breaks and converts double dashes", () => {
    expect(chapters[0].paragraphs[0]).toMatch(/words continued on the next line\.$/);
    expect(chapters[1].paragraphs[0]).toMatch(/^Everything ended—quietly\./);
  });
  it("keeps indented verse as a quote with line breaks", () => {
    expect(chapters[0].paragraphs[1]).toBe("> A verse line\nand another");
  });
  it("drops the closing THE END", () => {
    expect(chapters[1].paragraphs.at(-1)).not.toMatch(/THE END/);
  });
  it("title-cases shouting headings but leaves mixed case alone", () => {
    expect(titleCase("A SCANDAL IN BOHEMIA")).toBe("A Scandal in Bohemia");
    expect(titleCase("JONATHAN HARKER’S JOURNAL--_continued_")).toBe("Jonathan Harker’s Journal (continued)");
    expect(titleCase("Down the Rabbit-Hole")).toBe("Down the Rabbit-Hole");
    expect(isGenericTitle("Chapter 12")).toBe(true);
    expect(isGenericTitle("Letter 1")).toBe(false);
  });
});

describe("markup and blocks", () => {
  it("parses _italic_ runs", () => {
    expect(parseInline("a _b_ c")).toEqual([
      { type: "text", text: "a ", styles: {} },
      { type: "text", text: "b", styles: { italic: true } },
      { type: "text", text: " c", styles: {} },
    ]);
  });
  it("maps markup to block types", () => {
    expect(markupToBlocks(["text", "> verse", "---"]).map((b) => b.type)).toEqual(["paragraph", "quote", "divider"]);
  });
  it("counts words and caps previews", () => {
    const blocks = markupToBlocks(Array.from({ length: 10 }, () => "one two three four five ".repeat(10)));
    expect(countWords(blocks)).toBe(500);
    const preview = previewBlocks(blocks, 120);
    expect(preview.length).toBe(3); // 50 + 50 + 50 words reaches the cap
    expect(countWords(preview)).toBeLessThan(countWords(blocks));
  });
});
