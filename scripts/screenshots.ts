/**
 * Captures the README / portfolio screenshots from a running dev server.
 *
 *   DEV_AS=reader pnpm dev      # in one terminal (no Clerk keys)
 *   pnpm screenshots            # in another; writes docs/screenshots/*.jpeg
 *
 * Run `pnpm demo:reset` first for clean data.
 */
import { mkdir } from "node:fs/promises";
import { chromium, type BrowserContext, type Page } from "@playwright/test";

const BASE = process.env.SCREENSHOT_URL ?? "http://localhost:3000";
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;

type Shot = {
  name: string;
  path: string;
  persona?: "guest" | "reader" | "admin";
  theme?: "light" | "dark";
  reader?: "paper" | "sepia" | "night" | "auto";
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
      await page.getByRole("button", { name: "Reading settings" }).click();
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
];

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
    const settings = { font: "sans", size: 2, leading: 1, width: 1, theme: shot.reader };
    cookies.push({ name: "tv_reader", value: encodeURIComponent(JSON.stringify(settings)), domain: "localhost", path: "/" });
  }
  await ctx.addCookies(cookies);
  await ctx.addInitScript((theme) => localStorage.setItem("theme", theme), shot.theme ?? "dark");
  return ctx;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const shot of shots) {
    const ctx = await contextFor(browser, shot);
    const page = await ctx.newPage();
    await page.goto(BASE + shot.path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    if (shot.prepare) await shot.prepare(page);
    await page.screenshot({ path: `${OUT}${shot.name}.jpeg`, type: "jpeg", quality: 82, fullPage: shot.fullPage });
    console.log(`  ${shot.name}`);
    await ctx.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
