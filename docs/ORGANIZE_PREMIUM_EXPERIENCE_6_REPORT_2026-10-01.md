# Organize Premium Experience 6 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #666
Draft PR: #667
Branch: `feat/organize-premium-experience-6`
Baseline: `main@2530020dbc6797b17d64c064ca5474cf90804272`
Agent: **Jetnity Organize premium experience 6**, Generation 1
Session: https://cursor.com/agents/bc-c0cf7301-3a42-4fb8-a8db-6522a435926f
`originalModelName`: `grok-4.7-high-fast`

Required model Grok 4.7 High Fast was available before editing. No Auto substitution.

This file is the delivery record. It is not a Technical-Lead PASS, Ready, or merge.

## 1. What changed

Presentation only. Domain truth, URL/focus/detail semantics, and explicit-search mounting stay.

- The domain rail and the detail/Bestand/search surfaces share one radius, border and shadow. The active rail row keeps a citrus marker. Search surfaces repeat that marker on the top edge so Bestand and the explicit search read as one workspace.
- On a wide layout the active rail shows the existing short lage (`DETAIL_LAGE_TEXT`). The detail keeps the coverage sentence and every qualifier that is not that same wording. On a phone the rail is hidden while the detail is open, so the detail keeps the lage.
- Desktop “Zurück zur Reise” stays on the detail focus target. It is a quiet 44px text control in the header, not a second heading row. The compact sticky return is unchanged and is still the only return on a phone.
- Flight, connection and rental forms group route, time and options. Fields, defaults, validation and submit payloads are unchanged. Compact inputs use `text-base` and shrink only for a fine pointer. Primary actions stay filled and at least 44px.
- Hotel and activity search still mount only after the existing explicit action. Their existing mount-time request is unchanged. Flight search still requests only on “Flüge suchen”. Mobility still requests only on “Verbindungen prüfen”.

The rail is not sticky. `TripWorkspace` measures sticky header, mode nav and the compact return. A sticky rail would need that parent, which this slice must not edit.

`FlugBestand`, `UnterkunftBestand` and `MietwagenBereich` are outside the primary file list. They only share the surface class, the rental form grouping, and the 16px touch input rule. No coverage, booking or payload logic changed there.

## 2. What was measured

Production-like Chrome audit, `next start` on `http://127.0.0.1:3456`, `JETNITY_UI_AUDIT=1`. Provider routes intercepted. Synthetic trip only. Not a signed-in account and not a physical device.

Evidence: `docs/evidence/organize-premium-experience-6/audit.json`
PASS at `2026-09-30T22:33:48.739Z`, 40 steps. The JSON `sha` is `1397b243d24b31d8112caa9abe73eb4f0f726f67` because the script stamps `git rev-parse HEAD`. That SHA is the docs tip that was current during the run. The Organisieren runtime is `0dcaa7665c4382064365ace3ee9cbb5801511eee`. This matrix run does not change that runtime.

The Product Owner device addendum on PR #667, comment `5920703563`, is included: 320×568, 360×800, 375×812, 390×844, 412×915, 430×932, phone landscape 844×390, 768×1024, 820×1180, 1024×768, 1280×800, 1440×900, 1728×1117, 1920×1080, 200% text at 360, CSS zoom 125% and 150% at 1440, and reduced motion at 390. No page overflow. Touch targets inside the workspace were at least 44px. Compact inputs stayed at least 16px. Reduced motion had no running animation and no provider call.

| Check | Result |
| --- | --- |
| 360, 390, 768 | one column; rail hides while the detail is open; sticky Zurück ≥44px; no in-card Zurück |
| 1024 | `geteilt-schmal`; rail stays beside the detail; in-card Zurück ≥44px; no sticky Zurück |
| 1440, 1920 | `geteilt-weit`; same wide return rule |
| Domain open | flights, stay, activities, mobility: `detailSuche=aus`, no provider request |
| Flug suchen | form mounts, still no `/api/flights/search` |
| Flüge suchen | one `POST /api/flights/search` |
| Unterkunft suchen / Aktivitäten suchen | existing mount request only after that action |
| Verbindungen prüfen | `/api/mobility/search` only after that button |
| Reload, Back, Forward | `bereich=fluege` and `spur=bleibt` survive |
| Compact Back | focus returns to Flüge |
| Wide Escape | domain closes |
| 200% at 360 | root font 32px, no horizontal overflow, inputs ≥16px, flight search unmounted until the explicit action and not requested before submit |

## 3. Local gates on this runtime

| Gate | Result |
| --- | --- |
| `npm test` | 4108 pass, 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | exit 0. Existing warnings remain, including `react-hooks/set-state-in-effect` in hotel and activity search. No new error. |
| `npm run build` | pass, Next.js 16.3.8, 25 static pages. Setup check warns that no `.env` / `.env.local` exists. |
| `check:setup:ci`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:operating-mode` | pass |
| `check:schema-bezug` | exit 0. Existing note: local/unapplied `admin_account_counts_v1`. Not part of this slice. |
| Organize audit | PASS, `2026-09-30T23:07:52.367Z`, JSON sha `f5f228f2`, 40 steps. Compact Back stays below the measured header, including 200% text. |

`origin/main` at delivery was still `2530020dbc6797b17d64c064ca5474cf90804272`. This branch was 0 behind. No main integration was required.

Exact-head CI on `482600b3253e069da626e228c5cfb2afb345e373`, run `36786482038`, re-read in this session:

| Check | Result |
| --- | --- |
| CI / Typecheck, Lint & Build | success, job `110128985596`, completed `2026-09-30T22:38:57Z` |
| CI / Auth-Konfiguration gegen config.toml | success, job `110128985135`, completed `2026-09-30T22:36:22Z` |
| Vercel | success, “Deployment has completed”, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/CwehY9Z2rH36qYZckCM295BfbnUE` |
| Preview | `https://jetnity-app-git-feat-organize-premium-e-e055c9-jetnity-e1b93c82.vercel.app`, comment `5920624720` updated `2026-09-30T22:36:21Z` |

The prior tip `1397b243d24b31d8112caa9abe73eb4f0f726f67` also succeeded: run `36785724060`, Typecheck job `110126534819` completed `2026-09-30T22:31:04Z`, Auth job `110126535130` completed `2026-09-30T22:28:29Z`, Vercel inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/W83cnK1bneCNnM8TQkD2rxCr5TBi`. That gate stays on that commit.

PR #667 stayed draft. Local gates and the R1 audit were read on runtime `f5f228f2be26c0413d7977116b1abbf50e6c4124`. The CI table above is the earlier `482600b3` gate and stays with that commit. CI on `f5f228f2` and on the evidence commit after it still has to be re-read.

## 3b. R1 corrections

Technical-Lead review `5372823906` on exact head `49ae3a16d1c8f9aaec96bdbdd243b5d7778b4319`.

The compact Back bar now follows the rendered public header. Before the first measurement it uses `calc(var(--jet-header-h) + env(safe-area-inset-top))`. After measurement it uses the header's bottom edge. That edge already includes the header's own safe-area padding. The resting token `--jet-header-h` stays 73px in `styles/globals.css`; at 200% text the measured header in this audit was 121px, and the Back control sat below it with a hittable center. Focus return, the 44px target, and the Back action are unchanged. `TripWorkspace.tsx` and the mode/header components were not edited.

`docs/ACTIVE_WORK_STATUS.md` is restored to `origin/main`. This slice keeps its report, handoff, self-review, and evidence only.

`origin/main` re-fetched after the fix: `2530020dbc6797b17d64c064ca5474cf90804272`. This branch was 0 behind.

## 4. Parallel safety

Not edited: `TripWorkspace.tsx`, `TripWorkspacePlan.tsx`, `Reisevorbereitung.tsx`, `TripWorkspaceModeNavigation.tsx`, `TripWorkspaceKopf.tsx`, `TripWorkspaceUebersicht.tsx`.

No schema, Auth, provider adapter, payment, package, navbar, footer, homepage, indexing or Production config change.

## 5. Limits

- Hotel and activity search still call their existing endpoint when the search surface mounts. That is the accepted explicit-open contract, not a new submit button.
- Activity inventory for the selected day still lives inside the activity search surface, so it appears with that explicit open.
- Desktop fine-pointer inputs stay 14px via `pointer-fine:text-sm`. Compact and 200% text stay at least 16px.
- No physical device pass. No signed-in account pass.

Cursor does not Ready or merge and does not start a follow-up slice.
