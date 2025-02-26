/**
 * Renders the marketing kit from HTML templates with headless Chrome:
 * logo PNGs, app icons, README hero, social headers, posters, Product Hunt
 * gallery and framed screenshots. Everything lands in brand/ (and app icons
 * in src/app and public/).
 *
 *   pnpm screenshots   # fresh docs/screenshots first (needs DEV_AS=reader pnpm dev)
 *   pnpm brand:logo
 *   pnpm brand:render
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { palette as P } from "./palette";

const ROOT = path.resolve(new URL("../../", import.meta.url).pathname);
const BRAND = path.join(ROOT, "brand");
const BUILD = path.join(BRAND, ".build");
const SHOTS = path.join(ROOT, "docs/screenshots");
const COVERS = path.join(ROOT, "public/covers");
const file = (p: string) => `file://${p}`;
const shot = (name: string) => file(path.join(SHOTS, `${name}.jpeg`));

const TAGLINE = "Serial fiction, one chapter at a time.";
const FEATURES = ["Page-flip reader", "Read-aloud", "Paragraph comments", "Early access, made fair"];

// ─── Shared building blocks ──────────────────────────────────────────────────

const css = `
@font-face { font-family: Geist; font-weight: 400; src: url(${file(path.join(BRAND, "fonts/Geist-400.ttf"))}); }
@font-face { font-family: Geist; font-weight: 500; src: url(${file(path.join(BRAND, "fonts/Geist-500.ttf"))}); }
@font-face { font-family: Geist; font-weight: 600; src: url(${file(path.join(BRAND, "fonts/Geist-600.ttf"))}); }
@font-face { font-family: Geist; font-weight: 700; src: url(${file(path.join(BRAND, "fonts/Geist-700.ttf"))}); }
@font-face { font-family: Geist; font-weight: 800; src: url(${file(path.join(BRAND, "fonts/Geist-800.ttf"))}); }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; }
body { font-family: Geist, sans-serif; background: ${P.ink}; color: ${P.paper}; overflow: hidden; -webkit-font-smoothing: antialiased; }
.teal { color: ${P.tealBright}; }
.mist { color: ${P.mist}; }
.h { font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; }
.chip { display: inline-flex; align-items: center; gap: .45em; border: 1px solid ${P.inkLine}; background: ${P.inkRaised}; color: ${P.paper}; border-radius: 999px; padding: .5em 1em; font-weight: 500; white-space: nowrap; }
.chip::before { content: ""; width: .5em; height: .5em; border-radius: 99px; background: ${P.tealBright}; }
.browser { border-radius: 14px; overflow: hidden; background: ${P.inkRaised}; border: 1px solid ${P.inkLine}; box-shadow: 0 30px 80px rgb(0 0 0 / .5); }
.browser .bar { height: 36px; display: flex; align-items: center; gap: 7px; padding: 0 14px; background: ${P.inkRaised}; border-bottom: 1px solid ${P.inkLine}; }
.browser .bar i { width: 11px; height: 11px; border-radius: 99px; background: ${P.inkLine}; display: block; }
.browser .bar span { margin-left: 18px; flex: 1; max-width: 340px; height: 22px; border-radius: 6px; background: ${P.ink}; color: ${P.mist}; font-size: 12px; display: flex; align-items: center; padding-left: 10px; }
.browser img { display: block; width: 100%; }
.phone { border-radius: 46px; padding: 11px; background: #07080b; border: 1px solid #2a2e38; box-shadow: 0 30px 80px rgb(0 0 0 / .55); position: relative; }
.phone img { display: block; width: 100%; border-radius: 36px; }
.phone::after { content: ""; position: absolute; top: 22px; left: 50%; transform: translateX(-50%); width: 28%; height: 24px; border-radius: 99px; background: #07080b; }
`;

const logoSvg = async (name: string, align = "xMinYMid") =>
  (await readFile(path.join(BRAND, "logo", name), "utf8")).replace(/width="\d+" height="\d+"/, `width="100%" height="100%" preserveAspectRatio="${align} meet"`);

const browser = (img: string, width: number, url = "taleverse") =>
  `<div class="browser" style="width:${width}px"><div class="bar"><i></i><i></i><i></i><span>${url}</span></div><img src="${img}"></div>`;
const phone = (img: string, width: number, style = "") => `<div class="phone" style="width:${width}px;${style}"><img src="${img}"></div>`;

async function coverList() {
  return (await readdir(COVERS)).filter((f) => f.endsWith(".jpg")).sort();
}
const coverImg = (f: string, w: number, style = "") =>
  `<img src="${file(path.join(COVERS, f))}" style="width:${w}px;aspect-ratio:2/3;object-fit:cover;border-radius:${Math.max(4, w * 0.04)}px;box-shadow:0 14px 34px rgb(0 0 0/.45);${style}">`;

const page = (body: string, extraCss = "") => `<!doctype html><html><head><meta charset="utf-8"><style>${css}${extraCss}</style></head><body>${body}</body></html>`;

// ─── Templates ───────────────────────────────────────────────────────────────

type Job = { out: string; width: number; height: number; scale?: number; html: () => Promise<string> };

async function jobs(): Promise<Job[]> {
  const lockup = await logoSvg("lockup-dark.svg");
  const mark = await logoSvg("mark.svg");
  const covers = await coverList();

  const hero = async (w: number, h: number, big: number) =>
    page(`
<div style="position:absolute;inset:0;padding:${h * 0.1}px ${w * 0.06}px;display:flex;flex-direction:column;justify-content:center;gap:${h * 0.04}px;width:${w * 0.47}px">
  <div style="height:${big * 0.75}px">${lockup}</div>
  <h1 class="h" style="font-size:${big * 0.92}px">Serial fiction,<br><span class="teal">one chapter</span><br>at a time.</h1>
  <p class="mist" style="font-size:${big * 0.3}px;line-height:1.45;max-width:30ch">Read the classics free. Unlock new chapters early. Turn the page with a reader built for long nights.</p>
  <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:${big * 0.22}px">${FEATURES.map((f) => `<span class="chip">${f}</span>`).join("")}</div>
</div>
<div style="position:absolute;left:${w * 0.5}px;top:${h * 0.11}px">${browser(shot("home"), w * 0.62)}</div>
<div style="position:absolute;left:${w * 0.47}px;top:${h * 0.34}px">${phone(shot("mobile-reader-paged"), w * 0.17)}</div>
`);

  const list: Job[] = [
    // README + Open Graph
    { out: "readme-hero.png", width: 1600, height: 800, html: () => hero(1600, 800, 64) },
    { out: "og.png", width: 1200, height: 630, html: () => hero(1200, 630, 50) },

    // X / Twitter header: covers wall with the tagline over it.
    {
      out: "x-header.png",
      width: 1500,
      height: 500,
      html: async () =>
        page(`
<div style="position:absolute;inset:-40px;display:flex;gap:18px;transform:rotate(-6deg);opacity:.55">${[...covers, ...covers].slice(0, 14).map((c) => coverImg(c, 150)).join("")}</div>
<div style="position:absolute;inset:0;background:linear-gradient(90deg, ${P.ink} 25%, ${P.ink}cc 55%, transparent)"></div>
<div style="position:absolute;left:470px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:22px">
  <div style="height:56px">${lockup}</div>
  <h1 class="h" style="font-size:52px">${TAGLINE.replace("one chapter", '<span class="teal">one chapter</span>')}</h1>
</div>`),
    },

    // LinkedIn banner
    {
      out: "linkedin-banner.png",
      width: 1584,
      height: 396,
      html: async () =>
        page(`
<div style="position:absolute;right:-30px;top:30px;display:flex;gap:16px">${covers.slice(0, 8).map((c, i) => coverImg(c, 120, `transform:translateY(${i % 2 ? 40 : 0}px)`)).join("")}</div>
<div style="position:absolute;inset:0;background:linear-gradient(90deg, ${P.ink} 40%, ${P.ink}aa 62%, transparent)"></div>
<div style="position:absolute;left:96px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:18px">
  <div style="height:48px">${lockup}</div>
  <h1 class="h" style="font-size:44px">${TAGLINE.replace("one chapter", '<span class="teal">one chapter</span>')}</h1>
</div>`),
    },

    // Instagram post (4:5): the reader on a phone.
    {
      out: "instagram-post.png",
      width: 1080,
      height: 1350,
      html: async () =>
        page(`
<div style="position:absolute;inset:0;padding:96px 88px;display:flex;flex-direction:column;gap:28px">
  <div style="height:54px">${lockup}</div>
  <h1 class="h" style="font-size:86px">A reader built<br>for <span class="teal">long nights.</span></h1>
</div>
<div style="position:absolute;left:88px;top:430px">${phone(shot("mobile-reader-paged"), 400)}</div>
<div style="position:absolute;left:560px;top:470px;display:flex;flex-direction:column;align-items:flex-start;gap:16px;font-size:28px">${["Page flip", "Read aloud", "Focus mode", "Night light", "Paragraph comments"].map((f) => `<span class="chip">${f}</span>`).join("")}</div>
<div style="position:absolute;left:560px;top:880px;display:flex;gap:18px">${covers.slice(3, 6).map((c) => coverImg(c, 130)).join("")}</div>`),
    },

    // Instagram story (9:16)
    {
      out: "instagram-story.png",
      width: 1080,
      height: 1920,
      html: async () =>
        page(`
<div style="position:absolute;top:150px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:30px;text-align:center">
  <div style="height:64px;width:420px">${await logoSvg("lockup-dark.svg", "xMidYMid")}</div>
  <h1 class="h" style="font-size:92px">Turn the page.</h1>
  <p class="mist" style="font-size:36px">17 classics · free to start</p>
</div>
<div style="position:absolute;left:70px;top:520px;transform:rotate(-4deg)">${phone(shot("mobile-reader-paragraph"), 470)}</div>
<div style="position:absolute;left:540px;top:600px;transform:rotate(4deg)">${phone(shot("mobile-reader-paged"), 470)}</div>
<div style="position:absolute;bottom:150px;left:0;right:0;text-align:center"><span class="chip" style="font-size:34px;padding:.6em 1.4em">Read chapter 1 free</span></div>`),
    },

    // Covers poster (4:5) and print A3 version of the same design.
    ...(["poster-covers.png", "poster-a3-print.png"] as const).map(
      (out): Job => ({
        out: out === "poster-a3-print.png" ? "poster-a3-print.jpg" : out,
        width: 1080,
        height: out === "poster-a3-print.png" ? 1527 : 1350, // A3 is 1:1.414
        scale: out === "poster-a3-print.png" ? 3508 / 1080 : 1,
        html: async () => {
          const h = out === "poster-a3-print.png" ? 1527 : 1350;
          const grid = [...covers].slice(0, 15);
          return page(`
<div style="position:absolute;inset:0;padding:80px 72px;display:flex;flex-direction:column;gap:${h > 1400 ? 56 : 40}px">
  <div style="height:58px">${lockup}</div>
  <h1 class="h" style="font-size:78px">The classics,<br><span class="teal">one chapter</span> at a time.</h1>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:18px">${grid.map((c) => coverImg(c, 172)).join("")}</div>
  <p class="mist" style="font-size:24px;margin-top:auto">17 public-domain novels · page-flip reader · read-aloud · paragraph comments</p>
</div>`);
        },
      }),
    ),

    // Product Hunt gallery (1270×760)
    ...[
      { n: 1, title: "Your next obsession,<br>one shelf away.", sub: "Real first-edition covers, trending shelves, latest updates.", art: () => browser(shot("home"), 700, "taleverse") },
      {
        n: 2,
        title: "A reader that<br><span class=teal>turns the page.</span>",
        sub: "Scroll or pages with a 3D flip. Auto-scroll, read-aloud, focus mode and a night light.",
        art: () => `<div style="display:flex;gap:28px;align-items:flex-end">${phone(shot("mobile-reader-paged"), 290)}${phone(shot("mobile-reader-settings"), 290, "transform:translateY(-40px)")}</div>`,
      },
      {
        n: 3,
        title: "Talk about<br><span class=teal>the exact line.</span>",
        sub: "Paragraph comments and Reddit-style threads with replies and votes.",
        art: () => `<div style="display:flex;gap:28px;align-items:flex-end">${phone(shot("mobile-reader-paragraph"), 290)}<img src="${shot("comments")}" style="width:340px;border-radius:14px;border:1px solid ${P.inkLine};box-shadow:0 30px 80px rgb(0 0 0/.5)"></div>`,
      },
      {
        n: 4,
        title: "Early access,<br><span class=teal>made fair.</span>",
        sub: "New chapters unlock with credits, then go free for everyone a week later.",
        art: () => `<div style="display:flex;gap:28px;align-items:flex-end">${phone(shot("mobile-paywall"), 290)}${browser(shot("credits"), 420)}</div>`,
      },
    ].map(
      (g): Job => ({
        out: `product-hunt-${g.n}.png`,
        width: 1270,
        height: 760,
        html: async () =>
          page(`
<div style="position:absolute;left:72px;top:0;bottom:0;width:380px;display:flex;flex-direction:column;justify-content:center;gap:22px">
  <div style="width:56px;height:56px">${mark}</div>
  <h1 class="h" style="font-size:50px">${g.title}</h1>
  <p class="mist" style="font-size:20px;line-height:1.5">${g.sub}</p>
</div>
<div style="position:absolute;left:500px;top:0;bottom:0;display:flex;align-items:center">${g.art()}</div>`),
      }),
    ),

    // Framed screenshots for posts and docs.
    { out: "screens/desktop-home.png", width: 1500, height: 960, scale: 1, html: async () => page(`<div style="padding:40px">${browser(shot("home"), 1420)}</div>`) },
    { out: "screens/desktop-novel.png", width: 1500, height: 960, scale: 1, html: async () => page(`<div style="padding:40px">${browser(shot("novel-dark"), 1420)}</div>`) },
    { out: "screens/desktop-reader.png", width: 1500, height: 960, scale: 1, html: async () => page(`<div style="padding:40px">${browser(shot("reader-paged"), 1420)}</div>`) },
    ...["mobile-reader-paged", "mobile-reader-paragraph", "mobile-reader-settings", "mobile-reader-chapters", "mobile-reader-playing", "mobile-home"].map(
      (n): Job => ({ out: `screens/${n.replace("mobile-", "phone-")}.png`, width: 520, height: 1060, scale: 2, html: async () => page(`<div style="padding:40px">${phone(shot(n), 440)}</div>`) }),
    ),
  ];
  return list;
}

// ─── Logos & icons as PNG ────────────────────────────────────────────────────

async function logoJobs(): Promise<Job[]> {
  const svg = async (name: string) => await logoSvg(name);
  const markSizes = [16, 32, 48, 180, 192, 512, 1024];
  const jobsOut: Job[] = markSizes.map((s) => ({
    out: `logo/png/mark-${s}.png`,
    width: s,
    height: s,
    scale: 1, // named by exact pixel size
    html: async () => page(`<div style="width:${s}px;height:${s}px">${await svg("mark.svg")}</div>`, "body{background:transparent}"),
  }));
  for (const [name, w, h] of [
    ["lockup-dark", 1200, 300],
    ["lockup-light", 1200, 300],
    ["wordmark-dark", 1000, 260],
    ["wordmark-light", 1000, 260],
    ["mark-white", 512, 512],
    ["mark-black", 512, 512],
  ] as const) {
    jobsOut.push({
      out: `logo/png/${name}.png`,
      width: w,
      height: h,
      html: async () => page(`<div style="width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center">${await svg(`${name}.svg`)}</div>`, "body{background:transparent}"),
    });
  }
  return jobsOut;
}

/** brand/index.html: one page previewing the whole kit (relative links, opens from disk). */
async function writeGallery(outs: string[]) {
  const fig = (src: string, cls = "") => `<figure${cls ? ` class="${cls}"` : ""}><img src="${src}" alt="${src}"><figcaption>${src}</figcaption></figure>`;
  const logos = ["mark", "lockup-dark", "wordmark-dark", "mark-white"].map((n) => fig(`logo/${n}.svg`, "s"));
  const lightLogos = ["lockup-light", "mark-black"].map((n) => fig(`logo/${n}.svg`, "l"));
  const social = outs.filter((o) => !o.includes("/"));
  const screens = outs.filter((o) => o.startsWith("screens/"));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Taleverse brand kit</title>
<style>body{background:${P.ink};color:${P.paper};font-family:system-ui,sans-serif;margin:0;padding:32px}h1{margin:0 0 4px}p{color:${P.mist};margin:0}h2{font-weight:600;margin:40px 0 12px}div{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}figure{margin:0}img{max-width:min(560px,100%);max-height:560px;border:1px solid ${P.inkLine};border-radius:8px}figcaption{color:${P.mist};font-size:13px;margin-top:6px}.s img{max-height:140px}.l img{background:${P.snow};padding:12px;max-height:120px}</style></head><body>
<h1>Taleverse brand kit</h1><p>Usage, colours and where to post each file: README.md. Regenerate with pnpm brand:render.</p>
<h2>Logo</h2><div>${[...logos, ...lightLogos].join("")}</div>
<h2>Social &amp; posters</h2><div>${social.map((o) => fig(o)).join("")}</div>
<h2>Framed screenshots</h2><div>${screens.map((o) => fig(o)).join("")}</div>
</body></html>
`;
  await writeFile(path.join(BRAND, "index.html"), html);
  console.log("  index.html");
}

async function main() {
  await mkdir(BUILD, { recursive: true });
  const all = [...(await logoJobs()), ...(await jobs())];
  const browserApp = await chromium.launch();
  for (const job of all) {
    const scale = job.scale ?? 2;
    const ctx = await browserApp.newContext({ viewport: { width: job.width, height: job.height }, deviceScaleFactor: scale });
    const p = await ctx.newPage();
    const htmlPath = path.join(BUILD, job.out.replace(/\//g, "_") + ".html");
    await writeFile(htmlPath, await job.html());
    await p.goto(file(htmlPath), { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    const out = path.join(BRAND, job.out);
    await mkdir(path.dirname(out), { recursive: true });
    if (out.endsWith(".jpg")) await p.screenshot({ path: out, type: "jpeg", quality: 92 });
    else await p.screenshot({ path: out, omitBackground: job.out.startsWith("logo/") });
    await ctx.close();
    console.log(`  ${job.out}`);
  }
  await browserApp.close();

  // App icons used by the site.
  const icons: [string, string][] = [
    ["logo/png/mark-180.png", "src/app/apple-icon.png"],
    ["logo/png/mark-192.png", "public/icon-192.png"],
    ["logo/png/mark-512.png", "public/icon-512.png"],
  ];
  for (const [from, to] of icons) await writeFile(path.join(ROOT, to), await readFile(path.join(BRAND, from)));
  await writeGallery(all.map((j) => j.out));

  // favicon.ico (16/32/48) needs ImageMagick; skip quietly without it.
  try {
    execFileSync("convert", [path.join(BRAND, "logo/png/mark-48.png"), "-define", "icon:auto-resize=48,32,16", path.join(ROOT, "src/app/favicon.ico")]);
  } catch {
    console.warn("  ImageMagick not found: src/app/favicon.ico not updated");
  }
  console.log("  app icons copied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
