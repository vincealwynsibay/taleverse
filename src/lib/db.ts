import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "./env";

function createClient(url = env.databaseUrl) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();
if (!env.isProduction) globalForPrisma.prisma = db;

export { createClient };
export type Db = PrismaClient;
/** Either the client or an interactive-transaction client. */
export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
