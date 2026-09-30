# Jetnity Trip Workspace Premium Experience 3 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #660
Draft PR: #661
Branch: `feat/trip-workspace-premium-experience-3`
Baseline: `main@a2685812022258610e0cf34d926695b7067e55df`
Integrated main: `1ea6ddd03a290683d3d787823621c535a611a90f` (#655 Next.js 16.3.8)
Phone-mode runtime: `3a1be4b706495a89746e1f970c4568c90ae22a45`
Evidence re-run while HEAD was: `50496df9250f4e0744b1336068ea01710d8a9ebf`
Agent: **Jetnity Trip Workspace premium experience 3**, Generation 1
Session: https://cursor.com/agents/bc-9dce6347-3fab-49a7-a9b8-ca3c988b2c44
`originalModelName`: `grok-4.7-high-fast`

Required model Grok 4.7 High Fast was available before editing. No Auto substitution.

This file is the delivery record. It is not a Technical-Lead PASS, Ready, or merge.

## 1. What changed

Presentation only. The accepted four-mode shell, URL contract, focus rules, lazy mounting and truth stay.

- One dark-green identity (`data-workspace-identity`) carries the title, route, and Zeitraum / Reisende / Budget as one fact list. Budget uses the existing amount or “Noch offen”. Saved state and delete stay in a quieter slot.
- Phone mode navigation is a 2×2 segment so Übersicht, Reiseplan, Organisieren and Vorbereitung are all visible at 360 and 390. From 640px it is one segmented row. Labels, `aria-current="page"` and history semantics are unchanged. The selected control is scrolled inside the bar, not the page.
- “Reise ändern” and “Reisebegleiter fragen” stay two separate 44px actions. Panels still mount on first open. The assistant still changes nothing.
- “Jetzt wichtig” is a dark attention queue. No new action, no red urgency, no invented official check.
- Destination context stays compact when the existing empty path applies. The “not yet reliable” sentence is unchanged.
- Flüge / Unterkunft / Aktivitäten / Mobilität are one connected card. Phone is one column. From 640px it is 2×2. Status text is the existing coverage text.
- Reiseplan, Organisieren and Vorbereitung share the same card radius, border and spacing. Their forms and data paths are unchanged.

`TripWorkspaceJetztWichtig.tsx` and `TripWorkspaceDestinationEssentials.tsx` are outside the primary allowlist because sections 7.5 and 7.6 are implemented there. The edits are presentation. Density attributes and empty copy are unchanged.

## 2. What was measured

Production-like Chrome audit, `next start` on `http://127.0.0.1:3456`, `JETNITY_UI_AUDIT=1`. Provider and assistant routes intercepted. Synthetic trip only.

Evidence: `docs/evidence/trip-workspace-premium-experience-3/audit.json`
Re-run `2026-09-30T20:35:52.974Z`. The JSON `sha` field is `50496df9250f4e0744b1336068ea01710d8a9ebf` because the script stamps `git rev-parse HEAD`. The production server was the Next.js 16.3.8 build of the phone-mode runtime `3a1be4b7`. Docs commits do not change that render. Result **PASS**, `fehler` empty, 12 recorded viewport steps. Compact and wide interaction flows are enforced by the same run; a failure would be listed in `fehler`.

On `b8a026db` the mode bar was one scrolling row with a hidden scrollbar. At 360 and 390, Vorbereitung sat fully outside that bar. `3a1be4b7` is that defect fix and nothing else: a 2×2 segment below 640px.

| Surface | Result |
| --- | --- |
| 360×800 modes | four buttons, 157×44, all inside the bar, nowrap, no page overflow |
| 390×844 modes | four buttons, 172×44, all inside the bar |
| 768 and up | one row, all inside the bar |
| 200% at 360 | root font 32px, four buttons 135×88, all inside the bar, no page overflow |
| Domains | one column under 640px; two columns from 768px |
| First paint | flight search unmounted, assistant unmounted, zero provider/assistant requests |
| Actions | both controls ≥44px; guest has “Reise ändern” and “Entwurf verwerfen”, no assistant |
| History | plan keeps `spur=bleibt`; reload, Back and Forward restore Reiseplan; invalid query becomes Übersicht and keeps `spur=bleibt` |
| Search | opening Flüge does not mount search; “Flug suchen” mounts the form and does not call a provider |
| Focus | compact Zurück returns to the flight control; desktop Escape clears the domain; keyboard Vorbereitung heading stays clear of sticky chrome |
| Reduced motion | `prefers-reduced-motion` active and `animationName` is `none` |

A pixel read of `overview_360x800.png` shows the word Vorbereitung as one ink band (rows 539–546), not a wrapped second line.

## 3. Local gates on this runtime

| Gate | Result |
| --- | --- |
| `npm test` | 4099 pass, 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | exit 0. Full-tree warnings remain, including existing `react-hooks/set-state-in-effect` in `TripWorkspace.tsx` and `TripWorkspacePlan.tsx`. No new error. |
| `npm run build` | pass, Next.js 16.3.8, 25 static pages. Setup check warns that no `.env` / `.env.local` exists. |
| `check:setup:ci`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:operating-mode` | pass |
| `check:schema-bezug` | exit 0. Existing note: local/unapplied `admin_account_counts_v1`. Not part of this slice. |
| Premium audit | PASS, re-run `2026-09-30T20:35:52.974Z`, JSON sha `50496df9` |

## 4. Parallel safety

Re-read before this delivery:

- #655 is merged at `1ea6ddd03a290683d3d787823621c535a611a90f`. This branch contains that main and is 0 behind `origin/main`.
- #659 changed files are icon, favicon, brand and its own docs/tests. No `components/trips/TripWorkspace*` path.
- `docs/ACTIVE_WORK_STATUS.md` and `JETNITY_START_HERE.md` were not edited.

## 5. Earlier remote head

`b8a026db1872133ee7fe9287ad85a93962085135` is 0 behind `main@1ea6ddd03a290683d3d787823621c535a611a90f`. GitHub Actions `36770631331` was SUCCESS and Vercel Preview `dpl_26CJthTRJ8KcikVTWw8SfJXQ4Qtt` was READY for that head. There were no GitHub or Vercel review threads. Those checks do not approve `3a1be4b7` or any later docs tip. An earlier push attempt of the phone-mode fix was rejected with HTTP 401; this record is the retry.

## 6. Exact-head remote for this delivery

Not filled until the evidence commit is on `origin` and its Actions run, Auth job and Vercel Preview are terminal. This section is updated only with ids that were actually read.

## 7. Not claimed

No physical device. No signed-in account shell beyond the audit route and the guest local trip. No Production, provider, payment, Auth or schema change. A later docs commit does not inherit an older green check.

Cursor does not mark Ready and does not merge.
