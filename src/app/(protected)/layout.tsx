import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Logged In</h1>
      {children}
    </div>
  );
}
