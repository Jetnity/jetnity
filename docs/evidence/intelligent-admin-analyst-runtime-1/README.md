# Intelligent Admin Analyst Runtime 1 — Evidence

Date: 21 September 2026  
Kind: **synthetic component render**  
Authenticated Preview / Production click-through: **BLOCKED_ACCESS**

These files are local, dependency-injected renders of `AdminLagehinweiseAnsicht`. They are **not** proof that an entitled Admin session loaded `/admin` on Preview or Production. No auth bypass, signup, secret or remote probe was used.

## Cases

| Case | Viewport files | What it shows |
| --- | --- | --- |
| attention | `screenshots/attention_{320,390,1280}.png` | Role grant; airports unavailable; investigate link only |
| coverage | `screenshots/coverage_{320,390,1280}.png` | No-signal / expected coverage; no investigate hop |
| denied | `screenshots/denied_{320,390,1280}.png` | `forbidden`; no coverage line; no hop; no loader |
| stale | `screenshots/stale_{320,390,1280}.png` | Original item time + `vor 90 Sekunden`; stale healthy is attention |
| break-glass | `screenshots/break-glass_{320,390,1280}.png` | DB-backed airports not attributed; banner is not the proof |

Harness: `render-harness.ts` (temporary, outside product routes). Manifest: `manifest.json`. HTML snapshots: `html/`.

## Limits

- Tailwind product tokens are approximated; this is layout/copy evidence, not a branded Preview pixel match.
- No real-device claim.
- No blanket accessibility audit claim. Keyboard/focus contracts are in `lib/admin/analyst/lagehinweise-render.test.ts`.
