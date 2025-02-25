/**
 * Reader typography preferences. Stored in a cookie (not localStorage) so the
 * server renders the chapter with the reader's settings: no flash of default
 * styles on load.
 */
export type ReaderSettings = {
  font: "serif" | "sans";
  size: number; // index into SIZES
  leading: number; // index into LEADINGS
  width: number; // index into WIDTHS
  theme: "auto" | "paper" | "sepia" | "night";
};

export const READER_COOKIE = "tv_reader";
export const SIZES = ["1rem", "1.0625rem", "1.1875rem", "1.3125rem", "1.4375rem"];
export const LEADINGS = [1.6, 1.8, 2];
export const WIDTHS = ["34rem", "40rem", "48rem"];

export const defaultReaderSettings: ReaderSettings = { font: "serif", size: 2, leading: 1, width: 1, theme: "auto" };

const inRange = (n: unknown, len: number, fallback: number) =>
  typeof n === "number" && Number.isInteger(n) && n >= 0 && n < len ? n : fallback;

export function parseReaderSettings(raw: string | undefined): ReaderSettings {
  if (!raw) return defaultReaderSettings;
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    const d = defaultReaderSettings;
    return {
      font: v.font === "sans" ? "sans" : "serif",
      size: inRange(v.size, SIZES.length, d.size),
      leading: inRange(v.leading, LEADINGS.length, d.leading),
      width: inRange(v.width, WIDTHS.length, d.width),
      theme: ["auto", "paper", "sepia", "night"].includes(v.theme) ? v.theme : d.theme,
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
