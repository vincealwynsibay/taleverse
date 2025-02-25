import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthAside, AuthSetupNotice } from "@/components/site/AuthAside";
import { authEnabled } from "@/lib/flags";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="container-page grid items-start gap-10 py-12 md:grid-cols-2">
      <AuthAside />
      <div className="flex justify-center md:justify-end">
        {authEnabled ? <SignIn /> : <AuthSetupNotice />}
      </div>
    </div>
  );
}
