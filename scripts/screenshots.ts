/**
 * Captures the README / portfolio screenshots from a running dev server.
 *
 *   DEV_AS=reader pnpm dev      # in one terminal (no Clerk keys)
 *   pnpm screenshots            # in another; writes docs/screenshots/*.jpeg
 *
 * Run `pnpm demo:reset` first for clean data.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type BrowserContext, type Page } from "@playwright/test";

const BASE = process.env.SCREENSHOT_URL ?? "http://localhost:3000";
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;

type Shot = {
  name: string;
  path: string;
  persona?: "guest" | "reader" | "admin";
  theme?: "light" | "dark";
  reader?: "paper" | "sepia" | "night" | "auto";
  /** Extra reader settings merged into the cookie (e.g. paged layout). */
  readerExtra?: Record<string, unknown>;
  /** Capture just this element instead of the viewport. */
  element?: string;
  mobile?: boolean;
  fullPage?: boolean;
  /** Runs after load, before the capture. */
  prepare?: (page: Page) => Promise<void>;
};

/** Centers the unlock card, with the fading preview above it. */
const scrollToPaywall = async (page: Page) => {
  await page.getByText("This chapter is in early access").evaluate((el) => {
    const card = el.closest("div.relative") ?? el;
    const rect = card.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2) - 40 });
  });
  await page.waitForTimeout(600);
};

const shots: Shot[] = [
  { name: "home", path: "/", theme: "dark" },
  { name: "home-light", path: "/", theme: "light", persona: "guest" },
  { name: "home-full", path: "/", theme: "dark", fullPage: true },
  { name: "browse", path: "/novels", theme: "light" },
  { name: "genre", path: "/genres/horror", theme: "dark" },
  { name: "novel", path: "/novels/dracula", theme: "light" },
  { name: "novel-dark", path: "/novels/treasure-island", theme: "dark", fullPage: true },
  // Reading pages are captured as a guest so they don't overwrite the demo reader's saved progress.
  { name: "reader", path: "/novels/dracula/1", reader: "night", persona: "guest" },
  { name: "reader-paper", path: "/novels/pride-and-prejudice/1", reader: "paper", persona: "guest" },
  { name: "reader-sepia", path: "/novels/the-adventures-of-sherlock-holmes/1", reader: "sepia", persona: "guest" },
  {
    name: "reader-settings",
    path: "/novels/alices-adventures-in-wonderland/1",
    persona: "guest",
    reader: "paper",
    theme: "light",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Reader settings" }).click();
      await page.waitForTimeout(500);
    },
  },
  { name: "paywall", path: "/novels/dracula/25", reader: "sepia", prepare: scrollToPaywall },
  { name: "paywall-guest", path: "/novels/frankenstein/25", persona: "guest", reader: "night", prepare: scrollToPaywall },
  { name: "schedule", path: "/schedule", theme: "dark" },
  { name: "library", path: "/library", theme: "light" },
  { name: "credits", path: "/credits", theme: "dark" },
  { name: "admin", path: "/admin", persona: "admin", theme: "dark" },
  { name: "admin-novel", path: "/admin/novels/dracula", persona: "admin", theme: "light" },
  {
    name: "admin-editor",
    path: "/admin/novels/dracula/chapters/26",
    persona: "admin",
    theme: "light",
    prepare: async (page) => {
      await page.getByText(/Saved \d/).waitFor();
    },
  },
  { name: "mobile-home", path: "/", theme: "dark", mobile: true },
  { name: "mobile-novel", path: "/novels/dracula", theme: "light", mobile: true },
  { name: "mobile-reader", path: "/novels/treasure-island/1", reader: "sepia", mobile: true, persona: "guest" },
  { name: "mobile-paywall", path: "/novels/dracula/25", reader: "night", mobile: true, prepare: scrollToPaywall },
  {
    name: "mobile-reader-settings",
    path: "/novels/dracula/3",
    persona: "guest",
    mobile: true,
    prepare: async (page) => {
      await page.getByRole("button", { name: "Reader settings" }).click();
      await page.waitForTimeout(500);
    },
  },
  {
    name: "mobile-reader-chapters",
    path: "/novels/treasure-island/4",
    persona: "guest",
    mobile: true,
    prepare: async (page) => {
      await page.getByRole("button", { name: /^Ch\. 4/ }).click();
      await page.waitForTimeout(500);
    },
  },
  {
    name: "mobile-reader-playing",
    path: "/novels/frankenstein/5",
    persona: "guest",
    reader: "sepia",
    mobile: true,
    prepare: async (page) => {
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(300);
      await page.mouse.click(195, 420); // tap to show the controls
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: "Start auto-scroll" }).click();
      await page.waitForTimeout(1500);
    },
  },
  { name: "mobile-reader-paged", path: "/novels/peter-pan/1", persona: "guest", reader: "paper", mobile: true, readerExtra: { layout: "paged", justify: true } },
  {
    name: "mobile-reader-paragraph",
    path: "/novels/dracula/1",
    reader: "night",
    mobile: true,
    prepare: async (page) => {
      await page.locator('#chapter-body [data-p="1"] .pc-bubble').click();
      await page.waitForTimeout(700);
    },
  },
  {
    name: "comments",
    path: "/novels/dracula/1",
    theme: "dark",
    element: 'section[aria-labelledby="comments-heading"]',
    prepare: async (page) => {
      // The reader's fixed bars would be captured on top of the section.
      await page.addStyleTag({ content: "header, footer { display: none !important; }" });
    },
  },
  {
    name: "reader-paged",
    path: "/novels/the-wonderful-wizard-of-oz/1",
    persona: "guest",
    reader: "sepia",
    readerExtra: { layout: "paged", justify: true },
  },

  // ── Reader: finding things ──
  {
    name: "search",
    path: "/",
    theme: "dark",
    prepare: async (page) => {
      await page.getByRole("combobox", { name: "Search novels" }).first().fill("the");
      await page.getByRole("option").first().waitFor();
      await page.waitForTimeout(300);
    },
  },
  { name: "novel-reviews", path: "/novels/pride-and-prejudice", theme: "dark", element: "#reviews" },
  { name: "mobile-menu", path: "/", theme: "dark", mobile: true, prepare: async (page) => {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.waitForTimeout(600);
    } },

  // ── Reader: reading tools ──
  {
    name: "reader-chapters",
    path: "/novels/treasure-island/4",
    persona: "guest",
    reader: "night",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Chapters" }).first().click();
      await page.waitForTimeout(600);
    },
  },
  {
    name: "reader-define",
    path: "/novels/dracula/1",
    persona: "guest",
    reader: "paper",
    prepare: async (page) => {
      // Select one word in the third paragraph, as a reader would with a double-click.
      await page.evaluate(() => {
        const p = document.querySelector('#chapter-body [data-p="2"]')!;
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const m = /\b[a-z]{7,}\b/.exec(node.textContent ?? "");
          if (m) {
            const range = document.createRange();
            range.setStart(node, m.index);
            range.setEnd(node, m.index + m[0].length);
            const sel = window.getSelection()!;
            sel.removeAllRanges();
            sel.addRange(range);
            return;
          }
        }
      });
      await page.getByRole("button", { name: "Define" }).click();
      await page.waitForTimeout(2500); // dictionary lookup
    },
  },
  {
    name: "reader-focus",
    path: "/novels/jane-eyre/1",
    persona: "guest",
    reader: "night",
    readerExtra: { focus: true },
    prepare: async (page) => {
      await page.evaluate(() => window.scrollBy(0, 900));
      await page.waitForTimeout(900);
    },
  },
  { name: "reader-night-light", path: "/novels/frankenstein/3", persona: "guest", reader: "paper", readerExtra: { warmth: 3 } },
  { name: "reader-readable", path: "/novels/the-call-of-the-wild/1", persona: "guest", reader: "sepia", readerExtra: { font: "readable", size: 3 } },

  // ── Reader: account ──
  { name: "mobile-library", path: "/library", theme: "dark", mobile: true },
  { name: "mobile-credits", path: "/credits", theme: "dark", mobile: true },

  // ── Writer (admin) ──
  { name: "admin-new-novel", path: "/admin/novels/new", persona: "admin", theme: "dark" },
  { name: "admin-preview", path: "/novels/dracula/27", persona: "admin", reader: "paper" },
  { name: "mobile-admin", path: "/admin", persona: "admin", theme: "dark", mobile: true },
  {
    name: "mobile-admin-editor",
    path: "/admin/novels/dracula/chapters/26",
    persona: "admin",
    theme: "light",
    mobile: true,
    prepare: async (page) => {
      await page.getByText(/Saved \d/).waitFor();
    },
  },
];

/** Gallery sections and captions, in display order. Every shot needs one. */
const gallery: { title: string; intro: string; shots: Record<string, string> }[] = [
  {
    title: "Discover",
    intro: "Browsing as a reader: the home page, the catalogue and a novel's page.",
    shots: {
      home: "Home: spotlight, continue reading, trending, latest updates",
      "home-full": "The whole home page",
      "home-light": "Light theme, signed out",
      browse: "Browse with genre, status and sort filters",
      genre: "A genre page",
      search: "Search as you type (Ctrl K)",
      novel: "Novel page",
      "novel-dark": "Novel page with banner art and the full chapter list",
      "novel-reviews": "Ratings and reviews",
      schedule: "Release schedule",
      "mobile-home": "Home on a phone",
      "mobile-menu": "Phone menu",
      "mobile-novel": "Novel page on a phone",
    },
  },
  {
    title: "Read",
    intro: "The reader: docked bars that hide on tap, scroll or page-flip layouts, and comfort settings.",
    shots: {
      reader: "Night theme",
      "reader-paper": "Paper theme",
      "reader-sepia": "Sepia theme",
      "reader-paged": "Page mode with justified text",
      "reader-settings": "Reader settings",
      "reader-chapters": "Chapter list",
      "reader-define": "Select a word to define it",
      "reader-focus": "Focus mode dims all but the current paragraph",
      "reader-night-light": "Night light (warm filter)",
      "reader-readable": "Atkinson Hyperlegible, the readable typeface",
      "mobile-reader": "Reader on a phone",
      "mobile-reader-paged": "Page mode on a phone",
      "mobile-reader-settings": "Settings sheet",
      "mobile-reader-chapters": "Chapter sheet",
      "mobile-reader-playing": "Auto-scroll with the mini player",
    },
  },
  {
    title: "Talk",
    intro: "Comments on a single paragraph, and threaded chapter discussions with votes.",
    shots: {
      "mobile-reader-paragraph": "Paragraph comments from the margin",
      comments: "Threaded chapter comments with replies and votes",
    },
  },
  {
    title: "Pay",
    intro: "Early access: new chapters cost credits for a week, then go free.",
    shots: {
      paywall: "Early-access chapter, signed in",
      "paywall-guest": "Early-access chapter, signed out",
      "mobile-paywall": "Paywall on a phone",
      credits: "Credits: balance, packs and history",
      "mobile-credits": "Credits on a phone",
      library: "Library with reading progress",
      "mobile-library": "Library on a phone",
    },
  },
  {
    title: "Write (admin)",
    intro: "The admin is the writer: create novels, write chapters in a block editor, and schedule releases.",
    shots: {
      admin: "Overview: catalogue, release queue and store activity",
      "admin-new-novel": "New novel",
      "admin-novel": "A novel's chapters with release state",
      "admin-editor": "Chapter editor with release scheduling",
      "admin-preview": "Previewing a scheduled chapter as a reader",
      "mobile-admin": "Admin overview on a phone",
      "mobile-admin-editor": "Chapter editor on a phone",
    },
  },
];

/** docs/screenshots/README.md: every shot, grouped, so GitHub renders a gallery. */
async function writeGallery() {
  const captioned = new Set(gallery.flatMap((g) => Object.keys(g.shots)));
  const missing = shots.filter((s) => !captioned.has(s.name)).map((s) => s.name);
  if (missing.length) throw new Error(`No gallery caption for: ${missing.join(", ")}`);
  const mobile = new Set(shots.filter((s) => s.mobile).map((s) => s.name));
  const lines = ["# Screenshots", "", `Every view of Taleverse, captured by \`pnpm screenshots\` (${shots.length} images). Desktop shots are 1440 px wide; phone shots are 390 px at 2×.`, ""];
  for (const g of gallery) {
    lines.push(`## ${g.title}`, "", g.intro, "");
    const names = Object.keys(g.shots);
    const desktop = names.filter((n) => !mobile.has(n));
    const phone = names.filter((n) => mobile.has(n));
    for (let i = 0; i < desktop.length; i += 2) {
      const row = desktop.slice(i, i + 2);
      lines.push(`| ${row.map((n) => g.shots[n]).join(" | ")} |`, `|${row.map(() => "---").join("|")}|`, `| ${row.map((n) => `<a href="${n}.jpeg"><img src="${n}.jpeg" alt="${g.shots[n]}"></a>`).join(" | ")} |`, "");
    }
    for (let i = 0; i < phone.length; i += 3) {
      const row = phone.slice(i, i + 3);
      lines.push(`| ${row.map((n) => g.shots[n]).join(" | ")} |`, `|${row.map(() => "---").join("|")}|`, `| ${row.map((n) => `<img src="${n}.jpeg" alt="${g.shots[n]}" width="260">`).join(" | ")} |`, "");
    }
  }
  await writeFile(`${OUT}README.md`, lines.join("\n"));

  // The same gallery as a page that opens straight from disk.
  const fig = (n: string, caption: string) =>
    `<figure class="${mobile.has(n) ? "phone" : ""}"><a href="${n}.jpeg"><img src="${n}.jpeg" alt="${caption}" loading="lazy"></a><figcaption>${caption}</figcaption></figure>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Taleverse screenshots</title>
<style>body{background:#0d0f15;color:#e5e8ed;font-family:system-ui,sans-serif;margin:0;padding:32px;max-width:1500px}p{color:#8d939c}h2{margin:44px 0 4px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:20px;align-items:start}.grid.phones{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}figure{margin:0}img{width:100%;border:1px solid #252930;border-radius:8px;display:block}figcaption{color:#8d939c;font-size:13px;margin-top:6px}</style></head><body>
<h1>Taleverse screenshots</h1><p>${shots.length} views, captured by <code>pnpm screenshots</code>. Click any image for full size.</p>
${gallery
  .map((g) => {
    const names = Object.keys(g.shots);
    const d = names.filter((n) => !mobile.has(n));
    const ph = names.filter((n) => mobile.has(n));
    return `<h2>${g.title}</h2><p>${g.intro}</p>${d.length ? `<div class="grid">${d.map((n) => fig(n, g.shots[n])).join("")}</div>` : ""}${ph.length ? `<div class="grid phones" style="margin-top:20px">${ph.map((n) => fig(n, g.shots[n])).join("")}</div>` : ""}`;
  })
  .join("\n")}
</body></html>
`;
  await writeFile(`${OUT}index.html`, html);
}

async function contextFor(browser: Awaited<ReturnType<typeof chromium.launch>>, shot: Shot): Promise<BrowserContext> {
  const ctx = await browser.newContext({
    ...(shot.mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }),
    colorScheme: shot.theme ?? "dark",
  });
  const cookies: { name: string; value: string; domain: string; path: string }[] = [
    { name: "tv_dev_as", value: shot.persona ?? "reader", domain: "localhost", path: "/" },
  ];
  if (shot.reader) {
    const settings = { font: "sans", size: 2, leading: 1, width: 1, theme: shot.reader, ...shot.readerExtra };
    cookies.push({ name: "tv_reader", value: encodeURIComponent(JSON.stringify(settings)), domain: "localhost", path: "/" });
  }
  await ctx.addCookies(cookies);
  await ctx.addInitScript((theme) => localStorage.setItem("theme", theme), shot.theme ?? "dark");
  return ctx;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await writeGallery();
  const only = process.argv.slice(2);
  const browser = await chromium.launch();
  for (const shot of only.length ? shots.filter((s) => only.includes(s.name)) : shots) {
    const ctx = await contextFor(browser, shot);
    const page = await ctx.newPage();
    await page.goto(BASE + shot.path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    if (shot.prepare) await shot.prepare(page);
    if (shot.element) await page.locator(shot.element).screenshot({ path: `${OUT}${shot.name}.jpeg`, type: "jpeg", quality: 82 });
    else await page.screenshot({ path: `${OUT}${shot.name}.jpeg`, type: "jpeg", quality: 82, fullPage: shot.fullPage });
    console.log(`  ${shot.name}`);
    await ctx.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
