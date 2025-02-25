import { execSync } from "node:child_process";
import pg from "pg";

export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://taleverse:taleverse@localhost:5432/taleverse_e2e";

/** Creates the E2E database if needed, migrates it, and resets it to the demo seed. Idempotent. */
export async function prepareE2eDatabase() {
  const url = new URL(E2E_DATABASE_URL);
  const name = url.pathname.slice(1);
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
  if (!exists.rowCount) await admin.query(`CREATE DATABASE "${name.replace(/"/g, "")}"`);
  await admin.end();

  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };
  execSync("pnpm prisma migrate deploy", { env, stdio: "pipe" });
  execSync("pnpm demo:reset", { env, stdio: "pipe" });
}

// `tsx e2e/prepare-db.ts` runs it directly (before the web server starts).
if (import.meta.url === `file://${process.argv[1]}`) {
  prepareE2eDatabase().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
