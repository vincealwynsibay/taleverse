/**
 * Feature flags safe to read on both server and client (NEXT_PUBLIC_ vars are
 * inlined at build time).
 *
 * Without Clerk keys the app runs in read-only mode: browsing and reading free
 * chapters work, while sign-in, demo accounts and purchases are disabled. A
 * fresh clone is useful before any accounts are set up.
 */
export const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
