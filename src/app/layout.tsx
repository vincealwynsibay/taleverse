import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/lib/env";
import { authEnabled } from "@/lib/flags";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: "Taleverse: serial fiction, one chapter at a time", template: "%s · Taleverse" },
  description:
    "Read serialized novels chapter by chapter. Free back catalogue, early access to the newest chapters, and a reader built for long nights.",
  openGraph: { siteName: "Taleverse", type: "website" },
};

export const viewport: Viewport = {
  // Keeps the editor toolbar above the on-screen keyboard on mobile (BlockNote).
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const page = (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster richColors closeButton position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
  return authEnabled ? <ClerkProvider>{page}</ClerkProvider> : page;
}
