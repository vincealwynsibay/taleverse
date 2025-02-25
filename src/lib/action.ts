import "server-only";
import { z } from "zod";
import { AuthError } from "./auth";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; code?: string };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string, code?: string): ActionResult<never> => ({ ok: false, error, code });

/**
 * Wraps a server action body: auth and validation failures become typed
 * results the UI can show, and anything unexpected is logged and hidden.
 */
export async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.reason);
    if (e instanceof z.ZodError) return fail(e.issues[0]?.message ?? "Invalid input", "invalid");
    // Next.js uses thrown errors for redirect()/notFound(); let those through.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    console.error(e);
    return fail("Something went wrong. Please try again.");
  }
}
