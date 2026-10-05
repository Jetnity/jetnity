# Intelligent Admin Analyst Runtime 1 — Evidence

Date: 21 September 2026  
Kind: **synthetic component render with compiled product CSS**  
Authenticated Preview / Production click-through: **BLOCKED_ACCESS**

These files are local, dependency-injected renders of `AdminLagehinweiseAnsicht`. They are **not** proof that an entitled Admin session loaded `/admin` on Preview or Production. No auth bypass, signup, secret or remote probe was used.

CSS provenance: `styles/globals.css` compiled via `tailwindcss/nesting` + `tailwindcss` + `autoprefixer` (103597 bytes). Not a hand-copied token subset.

## Cases

| Case | Viewport files | What it shows |
| --- | --- | --- |
| attention | `screenshots/attention_{320,390,1280}.png` | Role grant; airports unavailable; investigate link only |
| coverage | `screenshots/coverage_{320,390,1280}.png` | Fresh no-signal mixed clock: `11:59:30 UTC` + `vor 30 Sekunden`; collection remains `12:00:00.000Z` |
| denied | `screenshots/denied_{320,390,1280}.png` | `forbidden`; no coverage line; no hop; no loader |
| stale | `screenshots/stale_{320,390,1280}.png` | Original item time `11:58:30 UTC` + `vor 90 Sekunden`; stale healthy is attention |
| break-glass | `screenshots/break-glass_{320,390,1280}.png` | DB-backed airports not attributed; banner is not the proof |

Harness: `render-harness.ts` (temporary, outside product routes). Manifest: `manifest.json` including overflow/focus measurements. HTML snapshots: `html/`.

Measured overflow (all five cases × 320/390/1280): `overflowing: false`, `cardsBeyondShell: 0`. Focusable investigate links appear only on attention and stale.

## Limits

- This is compiled-product-CSS component evidence, not a branded authenticated Preview pixel match of `/admin`.
- No real-device claim.
- No blanket accessibility audit claim. Keyboard/focus contracts are in `lib/admin/analyst/lagehinweise-render.test.ts`.
