/** Brand colours, converted from the app's OKLCH tokens (src/app/globals.css). */

function oklchToHex(l: number, c: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const [L, M, S] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const lin = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
  const gamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  return "#" + lin.map((x) => Math.round(Math.min(1, Math.max(0, gamma(x))) * 255).toString(16).padStart(2, "0")).join("");
}

export const palette = {
  /** Accent on light backgrounds (--primary, light). */
  teal: oklchToHex(0.6, 0.118, 184.7),
  /** Accent on dark backgrounds (--primary, dark). */
  tealBright: oklchToHex(0.72, 0.13, 182),
  /** Page background, dark (default theme). */
  ink: oklchToHex(0.17, 0.012, 262),
  /** Cards / raised surfaces, dark. */
  inkRaised: oklchToHex(0.205, 0.014, 262),
  /** Borders, dark. */
  inkLine: oklchToHex(0.28, 0.014, 262),
  /** Text on dark. */
  paper: oklchToHex(0.93, 0.008, 260),
  /** Muted text on dark. */
  mist: oklchToHex(0.66, 0.015, 260),
  /** Page background, light. */
  snow: oklchToHex(0.985, 0.002, 260),
  /** Text on light. */
  night: oklchToHex(0.2, 0.015, 260),
  /** Reader "sepia" theme. */
  sepia: oklchToHex(0.93, 0.035, 80),
};
