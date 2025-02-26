import { Atkinson_Hyperlegible } from "next/font/google";

// Loaded only for reader pages: the optional dyslexia-friendly typeface.
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-atkinson", display: "swap" });

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return <div className={atkinson.variable}>{children}</div>;
}
