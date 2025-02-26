/**
 * Generates the Taleverse logo set as pure-path SVGs (no font dependency):
 *   brand/logo/mark.svg                 teal tile with a "t" and a turned page corner
 *   brand/logo/mark-{white,black}.svg   one-colour marks
 *   brand/logo/wordmark-{dark,light}.svg
 *   brand/logo/lockup-{dark,light}.svg  mark + wordmark
 * and the app icons used by Next (src/app/icon.svg).
 *
 *   pnpm brand:logo
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import opentype from "opentype.js";
import { palette } from "./palette";

const root = new URL("../../", import.meta.url);
const out = new URL("brand/logo/", root);

async function font(weight: 700 | 800) {
  const buf = await readFile(new URL(`brand/fonts/Geist-${weight}.ttf`, root));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/** Text as an SVG path, with letter-spacing in em. Returns path data and advance width. */
function textPath(f: opentype.Font, text: string, size: number, x: number, baseline: number, tracking = 0) {
  let cursor = x;
  const parts: string[] = [];
  for (const ch of text) {
    const g = f.charToGlyph(ch);
    parts.push(g.getPath(cursor, baseline, size).toPathData(2));
    cursor += (g.advanceWidth! / f.unitsPerEm) * size + tracking * size;
  }
  return { d: parts.join(""), width: cursor - x - tracking * size };
}

/** The mark: 512×512 rounded tile, centred "t", top-right corner turned like a page. */
function mark(f: opentype.Font, opts: { tile: string; tileTo?: string; glyph: string; fold?: string; foldShade?: string }) {
  const S = 512;
  const R = 116;
  const F = 132; // fold size
  const g = f.charToGlyph("t");
  const size = 360;
  const bb = g.getBoundingBox();
  const scale = size / f.unitsPerEm;
  const gw = (bb.x2 - bb.x1) * scale;
  const gh = (bb.y2 - bb.y1) * scale;
  const x = (S - gw) / 2 - bb.x1 * scale - 14;
  const baseline = (S + gh) / 2 + 10 - (bb.y1 * scale > 0 ? 0 : -bb.y1 * scale) + 6;
  const glyph = g.getPath(x, baseline, size).toPathData(2);
  // Tile with the top-right corner cut off along the fold line.
  const tile = `M${R} 0H${S - F}L${S} ${F}V${S - R}A${R} ${R} 0 0 1 ${S - R} ${S}H${R}A${R} ${R} 0 0 1 0 ${S - R}V${R}A${R} ${R} 0 0 1 ${R} 0Z`;
  // The turned-over flap.
  const flap = `M${S - F} 0V${F - 26}A26 26 0 0 0 ${S - F + 26} ${F}H${S}Z`;
  const fill = opts.tileTo ? "url(#tv-tile)" : opts.tile;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  ${opts.tileTo ? `<defs><linearGradient id="tv-tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${opts.tileTo}"/><stop offset="1" stop-color="${opts.tile}"/></linearGradient></defs>` : ""}
  <path d="${tile}" fill="${fill}"/>
  ${opts.fold ? `<path d="${flap}" fill="${opts.fold}"/>` : ""}
  ${opts.foldShade ? `<path d="M${S - F} ${F - 26}A26 26 0 0 0 ${S - F + 26} ${F}H${S}L${S - F + 10} ${F + 18}Z" fill="${opts.foldShade}" opacity="0.35"/>` : ""}
  <path d="${glyph}" fill="${opts.glyph}"/>
</svg>
`;
}

function wordmark(f: opentype.Font, tale: string, verse: string) {
  const size = 100;
  const tracking = -0.035;
  const a = textPath(f, "tale", size, 0, 0, tracking);
  const b = textPath(f, "verse", size, a.width + tracking * size, 0, tracking);
  const width = a.width + b.width + tracking * size;
  // Bounds from the font metrics so every variant shares one box.
  const ascent = (f.ascender / f.unitsPerEm) * size;
  const descent = (-f.descender / f.unitsPerEm) * size;
  const h = ascent + descent;
  const shift = (d: string) => d; // paths are drawn at baseline 0; viewBox handles the offset
  return {
    width,
    height: h,
    svg: (pad = 0) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-ascent - pad} ${(width + pad * 2).toFixed(1)} ${(h + pad * 2).toFixed(1)}" width="${Math.round(width + pad * 2)}" height="${Math.round(h + pad * 2)}">
  <path d="${shift(a.d)}" fill="${tale}"/>
  <path d="${shift(b.d)}" fill="${verse}"/>
</svg>
`,
    inner: () => `<path d="${a.d}" fill="${tale}"/><path d="${b.d}" fill="${verse}"/>`,
    ascent,
  };
}

function lockup(markSvg: string, wm: ReturnType<typeof wordmark>) {
  const markSize = wm.height * 0.86;
  const gap = markSize * 0.32;
  const w = markSize + gap + wm.width;
  const inner = markSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${wm.height.toFixed(1)}" width="${Math.round(w)}" height="${Math.round(wm.height)}">
  <g transform="translate(0 ${((wm.height - markSize) / 2).toFixed(1)}) scale(${(markSize / 512).toFixed(4)})">${inner}</g>
  <g transform="translate(${(markSize + gap).toFixed(1)} ${wm.ascent.toFixed(1)})">${wm.inner()}</g>
</svg>
`;
}

async function main() {
  await mkdir(out, { recursive: true });
  const bold = await font(700);
  const heavy = await font(800);
  const p = palette;

  // Solid fills only: gradients render unreliably in favicons and some rasterisers.
  const markColor = mark(heavy, { tile: p.teal, glyph: "#ffffff", fold: p.tealBright });
  const files: Record<string, string> = { "mark.svg": markColor };
  // One-colour marks: the "t" is cut out of the tile with a mask (its strokes overlap, so even-odd won't do).
  for (const [name, color] of [["mark-white.svg", "#ffffff"], ["mark-black.svg", "#111111"]] as const) {
    const svg = mark(heavy, { tile: "#fff", glyph: "#000", fold: "#000" });
    const paths = [...svg.matchAll(/<path d="([^"]+)" fill="(#[0-9a-f]+)"\/>/g)];
    const tile = paths[0][1];
    const cut = paths.slice(1).map((m) => `<path d="${m[1]}" fill="#000"/>`).join("");
    files[name] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs><mask id="tv-cut"><path d="${tile}" fill="#fff"/>${cut}</mask></defs>
  <path d="${tile}" fill="${color}" mask="url(#tv-cut)"/>
</svg>
`;
  }

  const wmDark = wordmark(bold, p.paper, p.tealBright);
  const wmLight = wordmark(bold, p.night, p.teal);
  files["wordmark-dark.svg"] = wmDark.svg(4);
  files["wordmark-light.svg"] = wmLight.svg(4);
  files["lockup-dark.svg"] = lockup(markColor, wmDark);
  files["lockup-light.svg"] = lockup(markColor, wmLight);

  for (const [name, svg] of Object.entries(files)) await writeFile(new URL(name, out), svg);
  // Favicon / app icon for Next's file conventions.
  await writeFile(new URL("src/app/icon.svg", root), markColor);
  console.log(`wrote ${Object.keys(files).length} logo files + src/app/icon.svg`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
