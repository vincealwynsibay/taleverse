import { DemoButtons } from "./DemoButtons";

export function AuthAside() {
  return (
    <div className="max-w-md pt-4">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Just looking around?</h1>
      <p className="mt-3 text-muted-foreground">
        Skip the sign-up. The demo accounts are shared and reset every night. The reader starts with 25 credits to spend on early-access chapters;
        the admin can write, edit and schedule chapters.
      </p>
      <DemoButtons className="mt-6" />
      <p className="mt-8 text-sm text-muted-foreground">New accounts get 10 free credits.</p>
    </div>
  );
}

export function AuthSetupNotice() {
  return (
    <div className="max-w-sm rounded-2xl border border-dashed p-6 text-sm">
      <p className="font-display text-lg font-semibold">Accounts aren&apos;t configured</p>
      <p className="mt-2 text-muted-foreground">
        This server has no Clerk keys, so it runs read-only. Run <code className="rounded bg-muted px-1">npx clerk@latest init</code> to create
        temporary dev keys, then restart the dev server.
      </p>
    </div>
  );
}
