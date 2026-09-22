# Intelligent Admin Model Usage Attention 1 — Evidence

Date: 22 September 2026  
Kind: **synthetic component render with compiled product CSS**  
Authenticated Preview / Production click-through: **BLOCKED_ACCESS**

These files are local, dependency-injected renders of `AdminModellnutzungHinweisAnsicht`. They are **not** proof that an entitled Admin session loaded `/admin` on Preview or Production. No auth bypass, signup, secret or remote probe was used.

CSS provenance: `styles/globals.css` compiled via `tailwindcss/nesting` + `tailwindcss` + `autoprefixer` (105145 bytes). Not a hand-copied token subset.

## Cases

| Case | Viewport files | What it shows |
| --- | --- | --- |
| available | `screenshots/available_{320,390,1280}.png` | Role grant; recorded rows readable; coverage, not finance |
| empty | `screenshots/empty_{320,390,1280,390-200,1280-200}.png` | No recorded rows; not null spend; investigate hop |
| unavailable | `screenshots/unavailable_{320,390,1280,390-200,1280-200}.png` plus `unavailable_1280_focus.png` | Failed read, not empty; visible keyboard focus on `/admin/provider-ops` |
| unknown | `screenshots/unknown_{320,390,1280}.png` | Evidence unknown; not empty |
| stale | `screenshots/stale_{320,390,1280,390-200,1280-200}.png` | Original item time `11:57:00 UTC` + `vor 3 Minuten`; stale available is attention |
| denied | `screenshots/denied_{320,390,1280}.png` | `forbidden`; no coverage line; no hop; no loader |
| break-glass | `screenshots/break-glass_{320,390,1280}.png` | DB-backed model-usage not attributed; banner is not the proof |

Harness: `render-harness.ts` (temporary, outside product routes). Manifest: `manifest.json` including overflow/focus measurements. HTML snapshots: `html/`.

Measured overflow (all cases × 320/390/1280, plus 200% text on empty/unavailable/stale at 390/1280): `overflowing: false`, `cardsBeyondShell: 0`. Focusable investigate links appear only on allowed role source states.

## Limits

- This is compiled-product-CSS component evidence, not a branded authenticated Preview pixel match of `/admin`.
- No real-device claim.
- No blanket accessibility audit claim. Keyboard/focus contracts are in `lib/admin/analyst/model-usage-render.test.ts`.
- Existing authorized Admin Preview credentials were not available to this session. Access is recorded as **BLOCKED_ACCESS**, not manufactured.
