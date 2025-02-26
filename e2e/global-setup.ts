import { prepareE2eDatabase } from "./prepare-db";

const PORT = Number(process.env.E2E_PORT ?? 47213);

// Every route the specs visit. The dev server compiles routes on first request
// and can 404 or stall while it does; compiling them up front keeps tests honest.
const WARM = [
  "/",
  "/novels",
  "/novels/dracula",
  "/novels/dracula/1",
  "/novels/dracula/25",
  "/novels/frankenstein",
  "/novels/frankenstein/1",
  "/novels/the-time-machine",
  "/genres/horror",
  "/schedule",
  "/library",
  "/credits",
  "/admin",
  "/admin/novels/the-time-machine",
  "/admin/novels/dracula",
  "/sitemap.xml",
];

async function warm(base: string, path: string, cookie: string) {
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      const res = await fetch(base + path, { headers: { cookie } });
      if (res.status < 400) return;
    } catch {
      /* server still starting */
    }
    if (Date.now() > deadline) throw new Error(`Warm-up failed for ${path}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

/** Fresh demo state for every run, then compile every route the specs use. */
export default async function globalSetup() {
  await prepareE2eDatabase();
  const base = `http://localhost:${PORT}`;
  for (const path of WARM) {
    await warm(base, path, `tv_dev_as=${path.startsWith("/admin") ? "admin" : "reader"}`);
  }
}
