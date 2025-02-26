/**
 * Reader typography preferences. Stored in a cookie (not localStorage) so the
 * server renders the chapter with the reader's settings: no flash of default
 * styles on load.
 */
export type ReaderSettings = {
  /** "readable" is Atkinson Hyperlegible, designed for low-vision and dyslexic readers. */
  font: "serif" | "sans" | "readable";
  size: number; // index into SIZES
  leading: number; // index into LEADINGS
  width: number; // index into WIDTHS
  theme: "auto" | "paper" | "sepia" | "night";
  /** Spaced paragraphs (web) or indented ones (book). */
  paragraphs: "spaced" | "indented";
  justify: boolean;
  /** Auto-scroll speed, index into SCROLL_SPEEDS. */
  speed: number;
  /** How auto-scroll moves: a slow continuous creep, or a page at a time. */
  autoStyle: "creep" | "jump";
  /** Floating "42%" pill. */
  showPercent: boolean;
  /** Floating "Ch. 3 / 25" pill. */
  showChapter: boolean;
  /** Tap the left/right third of the page to move a screen; middle toggles controls. */
  tapZones: boolean;
  /** Continuous scrolling, or book-like pages. */
  layout: "scroll" | "paged";
  /** Page-turn animation in paged layout. */
  pageTurn: "flip" | "slide" | "none";
  /** Dim everything but the paragraph being read. */
  focus: boolean;
  /** Night-light warmth, 0 (off) to 3. */
  warmth: number;
  /** Show paragraph comment bubbles. */
  paragraphComments: boolean;
};

export const READER_COOKIE = "tv_reader";
export const SIZES = ["0.9375rem", "1rem", "1.0625rem", "1.1875rem", "1.3125rem", "1.4375rem"];
export const LEADINGS = [1.55, 1.75, 1.95];
export const WIDTHS = ["34rem", "40rem", "48rem"];
/** Pixels per second. */
export const SCROLL_SPEEDS = [18, 28, 40, 56, 80];

export const defaultReaderSettings: ReaderSettings = {
  font: "sans",
  size: 2,
  leading: 1,
  width: 1,
  theme: "auto",
  paragraphs: "spaced",
  justify: false,
  speed: 1,
  autoStyle: "creep",
  showPercent: true,
  showChapter: false,
  tapZones: false,
  layout: "scroll",
  pageTurn: "flip",
  focus: false,
  warmth: 0,
  paragraphComments: true,
};

const inRange = (n: unknown, len: number, fallback: number) =>
  typeof n === "number" && Number.isInteger(n) && n >= 0 && n < len ? n : fallback;

export function parseReaderSettings(raw: string | undefined): ReaderSettings {
  if (!raw) return defaultReaderSettings;
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    const d = defaultReaderSettings;
    return {
      font: v.font === "serif" || v.font === "readable" ? v.font : "sans",
      size: inRange(v.size, SIZES.length, d.size),
      leading: inRange(v.leading, LEADINGS.length, d.leading),
      width: inRange(v.width, WIDTHS.length, d.width),
      theme: ["auto", "paper", "sepia", "night"].includes(v.theme) ? v.theme : d.theme,
      paragraphs: v.paragraphs === "indented" ? "indented" : "spaced",
      justify: v.justify === true,
      speed: inRange(v.speed, SCROLL_SPEEDS.length, d.speed),
      autoStyle: v.autoStyle === "jump" ? "jump" : "creep",
      showPercent: v.showPercent !== false,
      showChapter: v.showChapter === true,
      tapZones: v.tapZones === true,
      layout: v.layout === "paged" ? "paged" : "scroll",
      pageTurn: v.pageTurn === "slide" || v.pageTurn === "none" ? v.pageTurn : "flip",
      focus: v.focus === true,
      warmth: inRange(v.warmth, 4, 0),
      paragraphComments: v.paragraphComments !== false,
    };
  } catch {
    return defaultReaderSettings;
  }
}

export function readerStyle(s: ReaderSettings): React.CSSProperties {
  return {
    "--reader-size": SIZES[s.size],
    "--reader-leading": String(LEADINGS[s.leading]),
    "--reader-width": WIDTHS[s.width],
  } as React.CSSProperties;
}
