import { createClient } from "../src/lib/db";
import { resetDemo } from "../src/lib/seed";

const db = createClient();

resetDemo(db)
  .then(() => console.log("Demo reset."))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
