import { ogCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Taleverse: serial fiction, one chapter at a time";

export default function Image() {
  return ogCard({
    eyebrow: "Serial fiction · one chapter at a time",
    title: "Stories worth staying up for.",
    hue: 15,
    meta: ["Free back catalogue", "Early access with credits"],
  });
}
