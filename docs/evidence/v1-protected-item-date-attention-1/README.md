# V1 Protected Item Date Attention 1 — evidence

Bounded synthetic evidence for Draft PR #520 / issue #519.

This is **not** an authenticated Preview/Production click-through, not a real-device test, and not a general UX audit.

| File | What it is |
| --- | --- |
| `render-harness.ts` | Temporary harness outside product routes. Renders the **actual** `TripWorkspaceJetztWichtig` with compiled `styles/globals.css`. |
| `html/date-mismatch.html` | Static markup + compiled product CSS. Banner names the source commit. |
| `screenshots/date-mismatch_390.png` | Phone 390×844 of that actual component. |
| `screenshots/date-mismatch_1024.png` | Desktop 1024×768 of that actual component. |
| `manifest.json` | Attention ids/copy, CSS provenance, overflow measurements, omitted systems. |
| `reconstruction.json` | Source commit / working-tree pin used for the captures. |
| `commands.json` | Author-run local gates. |

## Source pin

Screenshots were taken on a **clean** tree at product commit `948ad2fcffd7cc170feebd19fe0a94baed54fc72`. That commit contains the attention projection and tests. This evidence commit does not change `lib/trips/attention.ts`.

## What the fixture proves

Four assigned protected items keep `startsOn=2026-09-12` on owning `dayDate=2026-09-19` (zero-price, booked-only, provider, booking-link). The existing Jetzt-wichtig surface shows three mismatches and `4 weitere Hinweise anzeigen`. All-clear copy is absent. A non-commercial note and an unassigned protected item do not appear as this signal.

## What it does not prove

- Live trip-workspace session, Auth, RLS, or guest storage
- Provider/model/paid call or booking-state change
- Real-device contrast/lab acceptance
- That the later freeze/docs commit was the rendered product tree
