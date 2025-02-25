import { prepareE2eDatabase } from "./prepare-db";

/** Fresh demo state for every run, including when reusing an already-running dev server. */
export default async function globalSetup() {
  await prepareE2eDatabase();
}
