import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { resetDemo } from "@/lib/seed";

export const maxDuration = 60;

/** Nightly demo reset (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`). */
export async function GET(request: Request) {
  if (!env.cronSecret || request.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const log: string[] = [];
  await resetDemo(db, { log: (m) => log.push(m) });
  return Response.json({ ok: true, log });
}
