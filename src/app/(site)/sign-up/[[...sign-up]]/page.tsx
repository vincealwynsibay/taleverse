import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthAside, AuthSetupNotice } from "@/components/site/AuthAside";
import { authEnabled } from "@/lib/flags";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <div className="container-page grid items-start gap-10 py-12 md:grid-cols-2">
      <AuthAside />
      <div className="flex justify-center md:justify-end">
        {authEnabled ? <SignUp /> : <AuthSetupNotice />}
      </div>
    </div>
  );
}
