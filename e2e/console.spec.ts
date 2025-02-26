import { expect, test } from "@playwright/test";
import { signInAs, type Persona } from "./helpers";

// Hydration mismatches and runtime errors only show up in the browser console.
const pages: [Persona, string][] = [
  ["guest", "/"],
  ["guest", "/novels"],
  ["guest", "/novels/dracula"],
  ["guest", "/novels/dracula/1"],
  ["reader", "/"],
  ["reader", "/novels/dracula/1"],
  ["reader", "/novels/dracula/25"],
  ["reader", "/schedule"],
  ["reader", "/library"],
  ["reader", "/credits"],
  ["admin", "/admin"],
  ["admin", "/admin/novels/dracula"],
];

// Known, harmless dev-mode notices.
const ignored = [/script tag while rendering React component/i, /Download the React DevTools/i];

for (const [persona, path] of pages) {
  test(`${path} as ${persona} renders without console errors`, async ({ page, context }) => {
    await signInAs(context, persona);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !ignored.some((r) => r.test(m.text()))) errors.push(m.text());
    });
    // Name the failing URL, since the console message alone doesn't.
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${new URL(r.url()).pathname}`);
    });
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500); // hydration finishes after network idle
    expect(errors).toEqual([]);
  });
}
