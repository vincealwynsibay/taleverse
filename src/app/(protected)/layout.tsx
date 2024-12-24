import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  return (
    <div>
      <h1>Logged In</h1>
      {children}
    </div>
  );
}
