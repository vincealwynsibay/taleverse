import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Literata } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/lib/env";
import { authEnabled } from "@/lib/flags";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const literata = Literata({ subsets: ["latin"], variable: "--font-literata", display: "swap", style: ["normal", "italic"] });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz", "SOFT"] });

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: "Taleverse: serial fiction, one chapter at a time", template: "%s · Taleverse" },
  description:
    "Read serialized novels chapter by chapter. Free back catalogue, early access to the newest chapters, and a reader built for long nights.",
  openGraph: { siteName: "Taleverse", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#14161c" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const page = (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${literata.variable} ${fraunces.variable}`}>
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
