# Meine Reisen Premium Hub UX 1 — Report

Date: 1 October 2026
Issue: #694
Draft PR: #695
Logical agent: **Jetnity My Trips premium hub UX 1**
Generation: **1**
Session: https://cursor.com/agents/bc-da4e6583-e231-4ffd-b545-a7cece411714
`originalModelName=grok-4.7-high-fast`. Not Auto.

## Head

- Measured code head: `463ea8ab5d519a98f06f12ac3762f6af5a61daad`
- Merge-base with `origin/main`: `98c9099bee1715f741e4aec87c2c386e9e5344ad` (Merge #689)
- At measurement: 4 ahead / 0 behind that main
- Baseline named in the task: `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`
- Integrated main commits are the #689 registry preparation-slot files. This slice did not edit them.

The evidence commit that adds this report is the pushed tip. It does not change the measured UI.

## What changed

Presentation only. AP-3 membership, device-calendar timing, search, the 200-row boundary, Error != Empty, archive provenance and guest/account routes stay on the existing functions.

- Empty groups stay visible as real counts and the existing sentences. Full card grids render only for groups that contain trips.
- When nothing is active, Kommend is the visual priority. An active trip keeps Aktiv first.
- Each account trip is one shell: the trip link and Archivieren/Wiederherstellen are siblings. The button is not inside the link.
- Search stays local, at least 16px, at least 44px tall. No new fetch.
- The hub is no longer stretched to the viewport, so removed empty sections do not reappear as blank space above the footer.

## Page height, PO-like state

Same harness, two upcoming trips, every other normal group empty. Heights are `document.documentElement.scrollHeight` and include the public header, account nav and footer.

| Viewport | Before | After | Delta |
| --- | ---: | ---: | ---: |
| 320×568 | 2378 | 2064 | −314 |
| 360×800 | 2378 | 2100 | −278 |
| 390×844 | 2354 | 2040 | −314 |
| 412×915 | 2354 | 2040 | −314 |
| 430×932 | 2354 | 2040 | −314 |
| 768×1024 | 1967 | 1627 | −340 |
| 820×1180 | 2123 | 1627 | −496 |
| 1024×768 | 1531 | 1207 | −324 |
| 1280×800 | 1531 | 1207 | −324 |
| 1440×900 | 1531 | 1207 | −324 |
| 1728×1117 | 1664 | 1207 | −457 |
| 1920×1080 | 1627 | 1207 | −420 |
| 844×390 | 1927 | 1627 | −300 |
| 360×800 at 200% text | 5567 | 5366 | −201 |
| 1440×900 at 125% zoom | 1912 | 1506 | −406 |
| 1440×900 at 150% zoom | 2293 | 1842 | −451 |

360×800 moved by 36px between two production runs. The other phone widths stayed on the −314px line. Before was measured with `next dev`; after with `next start` on `463ea8ab`.

## Gates

- `npm test`: 4219 pass / 0 fail. The first run failed one throwaway PostgreSQL proof because `initdb` was absent. PostgreSQL 16 was installed locally and the full suite then passed.
- `npm run typecheck`: pass
- `npm run lint`: pass
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`: pass
- `git diff --check`: pass
- `npm run build`: pass
- Production visual matrix on `http://127.0.0.1:3491`: `fehlerZahl` 0 across the required viewports and states. Evidence: `docs/evidence/my-trips-premium-hub-ux-1/`.

The matrix checked overflow, 44px targets on compact widths, 16px search text, archive outside the trip link, keyboard focus on the trip link, search match and no-match, empty account, read error, and the 200-row notice. No hub request to flight, hotel, activity or readiness APIs.

## Not done

No DB, Auth, provider, Production or indexing change. The audit route stays fail-closed in Production. Cursor does not Ready or merge and does not start a follow-up.

Next step: independent Technical-Lead review of the exact pushed tip, including code, the cross-device matrix and the archive control.
