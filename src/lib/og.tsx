import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Static Fraunces SemiBold (SIL Open Font License); Satori can't use variable fonts.
const display = readFile(path.join(process.cwd(), "src/assets/fonts/Fraunces-SemiBold.ttf"));

export const ogSize = { width: 1200, height: 630 };

/** Shared 1200×630 social card. Satori needs inline styles and flex layout. */
export async function ogCard({ eyebrow, title, subtitle, hue, meta }: { eyebrow: string; title: string; subtitle?: string; hue: number; meta?: string[] }) {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#14161c", color: "#f1ece4", padding: 64, gap: 56 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 300,
            height: 450,
            alignSelf: "center",
            borderRadius: 14,
            padding: 32,
            background: `linear-gradient(160deg, hsl(${hue} 45% 42%), hsl(${(hue + 30) % 360} 40% 18%))`,
            boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ width: 80, height: 2, background: "rgba(255,255,255,0.6)" }} />
            <div style={{ fontSize: 40, lineHeight: 1.05, fontFamily: "Fraunces" }}>{title.split(/[;:]/)[0]}</div>
          </div>
          {subtitle && <div style={{ fontSize: 16, letterSpacing: 3, textTransform: "uppercase", opacity: 0.8 }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, gap: 20 }}>
          <div style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: "#ee8a55" }}>{eyebrow}</div>
          <div style={{ fontSize: 68, lineHeight: 1.02, fontFamily: "Fraunces" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 32, color: "#b6ad9f" }}>{subtitle}</div>}
          {meta && meta.length > 0 && <div style={{ display: "flex", gap: 28, fontSize: 26, color: "#b6ad9f", marginTop: 12 }}>{meta.map((m) => <div key={m}>{m}</div>)}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 36, fontSize: 30, fontFamily: "Fraunces" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#e0703a" }} />
            Taleverse
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: [{ name: "Fraunces", data: await display, weight: 600, style: "normal" }] },
  );
}
