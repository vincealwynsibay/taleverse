# Taleverse brand kit

Everything you need to post Taleverse anywhere. Open [`index.html`](index.html) for a preview of the whole kit on one page. All assets are generated from code, so they stay in sync with the product:

```bash
DEV_AS=reader pnpm dev   # in one terminal
pnpm screenshots         # fresh docs/screenshots
pnpm brand:logo          # brand/logo/*.svg + src/app/icon.svg
pnpm brand:render        # every PNG below, plus the app icons
```

## Name and tagline

- **Name:** Taleverse. Written as one word with a capital T in sentences. The logo wordmark is all lowercase: **tale**verse.
- **Tagline:** *Serial fiction, one chapter at a time.*
- **One-liner:** A web-novel platform: read the classics free, unlock new chapters early with credits, and turn the page in a reader built for long nights.
- **Voice:** Plain, warm and specific. Talk about books and reading, not "AI", "next-gen" or "revolutionary". Short sentences. Name the actual feature ("page flip", "read-aloud") rather than a vague benefit.

## Logo

| File | Use |
|---|---|
| `logo/lockup-dark.svg` | Default. Mark + wordmark on dark backgrounds |
| `logo/lockup-light.svg` | Mark + wordmark on light backgrounds |
| `logo/mark.svg` | Avatars, favicons, app icons, tight spaces |
| `logo/wordmark-{dark,light}.svg` | Where the mark is already shown nearby |
| `logo/mark-{white,black}.svg` | One-colour printing, watermarks, embossing |
| `logo/png/` | PNG versions: mark at 16–1024 px, lockups and wordmarks at 2× |

The mark is a teal tile with a lowercase **t** and a turned-down page corner (the top right).

- Keep clear space around the logo equal to half the mark's height.
- Minimum sizes: mark 16 px, lockup 96 px wide.
- Don't recolour, stretch, rotate, outline, add shadows or put the colour mark on busy photos. Use the white mark on photos instead.

## Colour

| Name | Hex | Use |
|---|---|---|
| Teal | `#009689` | Accent on light backgrounds, the logo tile |
| Bright teal | `#00beab` | Accent on dark backgrounds, "verse" in the dark wordmark |
| Ink | `#0d0f15` | Main dark background |
| Ink raised | `#14171e` | Cards and panels on dark |
| Ink line | `#252930` | Borders on dark |
| Paper | `#e5e8ed` | Text on dark |
| Mist | `#8d939c` | Secondary text on dark |
| Snow | `#f9fafb` | Light background |
| Night | `#12161d` | Text on light |
| Sepia | `#f4e6ce` | Reader sepia theme |

Dark is the default look. Teal is the only accent: use it for one phrase in a headline or one button, never as a background wash or gradient. Source of truth: `scripts/brand/palette.ts` (converted from the app's OKLCH tokens).

## Type

- **Geist** (headings 700, tight letter-spacing −0.035em; body 400–500). Bundled in `fonts/`.
- **Geist Mono** for numbers, code and keyboard shortcuts.
- **Atkinson Hyperlegible** is the reader's "Readable" typeface. It is part of the product, not the brand.

## Assets and where to post them

| File | Size | Where |
|---|---|---|
| `readme-hero.png` | 1600 × 800 (2×) | Top of the GitHub README, portfolio case study |
| `og.png` | 1200 × 630 (2×) | Link previews, Dev.to/Hashnode cover, Slack/Discord shares |
| `x-header.png` | 1500 × 500 (2×) | X / Twitter profile header |
| `linkedin-banner.png` | 1584 × 396 (2×) | LinkedIn profile or project banner |
| `instagram-post.png` | 1080 × 1350 (2×) | Instagram / LinkedIn / Threads feed post |
| `instagram-story.png` | 1080 × 1920 (2×) | Stories, Reels cover, TikTok |
| `poster-covers.png` | 1080 × 1350 (2×) | Feed post, Dribbble/Behance shot |
| `poster-a3-print.jpg` | 3508 × 4961 (A3 at 300 dpi) | Print |
| `product-hunt-1..4.png` | 1270 × 760 (2×) | Product Hunt gallery, portfolio slides, Behance |
| `screens/desktop-*.png` | 1500 × 960 | Browser-framed desktop screenshots |
| `screens/phone-*.png` | 520 × 1060 (2×) | Phone-framed mobile screenshots |
| `../docs/screenshots/*.jpeg` | raw | 30 unframed screenshots of every view |

The site's own social image is `src/app/opengraph-image.tsx` (rendered per page by Next). The app icons (`src/app/icon.svg`, `src/app/apple-icon.png`, `public/icon-192.png`, `public/icon-512.png`) are written by the scripts above.

## Ready-to-paste copy

**Short (X / Threads):**
> I built Taleverse, a web-novel platform. 17 public-domain classics, a reader with page flip, read-aloud and paragraph comments, and early-access chapters that go free a week later. Next.js 16, Postgres, Stripe.

**LinkedIn / portfolio:**
> Taleverse is a full-stack web-novel platform I designed and built. Readers get a mobile-first reader (scroll or page-flip, read-aloud, focus mode, night light, tap-to-define), threaded and paragraph-level comments, and a library that remembers where they stopped. Behind it: an append-only credit ledger with idempotent Stripe payments, early-access rules in one pure function, scheduled publishing with a block editor, and a one-click demo that resets every night.

## Art credits

Covers and banners are public-domain first-edition covers and illustrations. Per-book credits are in `prisma/seed-data/art.json` and shown on each novel page.
