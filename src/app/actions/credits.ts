"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/auth";
import { fail, ok, run } from "@/lib/action";
import { startCreditPurchase } from "@/lib/payments";

export async function buyCreditPackAction(packId: number) {
  return run(async () => {
    const viewer = await requireViewer();
    const pack = await db.creditPack.findFirst({ where: { id: z.number().int().parse(packId), active: true } });
    if (!pack) return fail("That pack isn't available.");
    return ok(await startCreditPurchase(viewer, pack));
  });
}
