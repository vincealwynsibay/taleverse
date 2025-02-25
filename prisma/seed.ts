import { createClient } from "../src/lib/db";
import { seedCatalog, seedCommunity } from "../src/lib/seed";

const db = createClient();

async function main() {
  console.log("Seeding catalog…");
  await seedCatalog(db);
  console.log("Seeding community…");
  await seedCommunity(db);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
