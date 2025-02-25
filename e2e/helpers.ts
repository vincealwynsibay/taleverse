import type { BrowserContext } from "@playwright/test";

export type Persona = "guest" | "reader" | "admin";

/** Picks who the dev server treats this browser as (see devViewer in src/lib/auth.ts). */
export async function signInAs(context: BrowserContext, persona: Persona) {
  await context.addCookies([{ name: "tv_dev_as", value: persona, domain: "localhost", path: "/" }]);
}
