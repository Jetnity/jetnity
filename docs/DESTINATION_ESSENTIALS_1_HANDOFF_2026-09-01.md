# Destination Essentials 1 – Handoff

Stand: 1. September 2026  
Status: **IMPLEMENTED / GATES GREEN ON EXACT HEAD / STOP FOR TECHNICAL-LEAD REVIEW**

## Identity

- Issue: #393
- PR: https://github.com/Jetnity/jetnity/pull/394 (Draft)
- Task: `docs/DESTINATION_ESSENTIALS_1_TASK_2026-09-01.md`
- Branch: `feat/phase-1-destination-essentials-1`
- Cursor-Agent: `Jetnity destination essentials 1`
- Generation: **1**
- Session: `bc-0dde2838-bb7b-4e97-b94a-6ac95002e2a2`
- Multi-Agent: **SINGLE_AGENT**
- Canonical base: `main@c4b6bf3266a9a6aa88a2f3e22e51007b6fb38a08`
- Implementation/gate head: `ad5b10311a00179484dedc69f116ae2fa26b9d4d`
- Continuity-docs head after this handoff: see latest branch SHA after the status commit
- Main drift at handoff: **none** — `origin/main` still `c4b6bf3266a9a6aa88a2f3e22e51007b6fb38a08`

## What landed

Presentation-only Destination Essentials in the existing Trip Workspace overview.

- `lib/trips/destination-essentials.ts` projects `Trip.stages[]` and joins already supplied Official / Safety / Seasonal evaluations.
- `components/trips/TripWorkspaceDestinationEssentials.tsx` renders ordered destination cards.
- Existing `ReiseSicherheit`, `ReisezeitHinweise` and `Reisevorbereitung` remain the canonical domain surfaces.

## Changed files

- `lib/trips/destination-essentials.ts`
- `lib/trips/destination-essentials.test.ts`
- `components/trips/TripWorkspaceDestinationEssentials.tsx`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `lib/account/uebersicht-grenzen.test.ts`
- `lib/account/reise-gruppen-grenzen.test.ts`
- `ARCHITECTURE.md`
- `DECISIONS.md` (ADR-0207)
- `ROADMAP.md`
- `JETNITY_HANDOFF.md`
- `JETNITY_START_HERE.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/DESTINATION_ESSENTIALS_1_TASK_2026-09-01.md`
- `docs/DESTINATION_ESSENTIALS_1_HANDOFF_2026-09-01.md`
- `docs/DESTINATION_ESSENTIALS_1_SELF_REVIEW_2026-09-01.md`
- `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`

## Truth rules preserved

- destination Official ≠ transit Official
- `unknown` / `unavailable` / `stale` / `recheck_needed` never become `not_required`
- Safety / Seasonal match only explicit `affectedRefs` with `kind: 'stage'`
- only validated `OfficialEvaluation.action` is actionable; `sourceUrl` stays source/information
- missing evidence stays `Noch keine verlässlichen Hinweise verfügbar`
- no visited inference
- no commercial search mount

## Tests and gates on exact head `ad5b1031`

| Gate | Result |
| --- | --- |
| Targeted Destination Essentials tests | pass |
| Relevant Attention / Übersicht / Safety / Seasonal / Readiness tests | 79 pass |
| Full repository suite | **3124 pass / 0 fail** |
| `npm run typecheck` | pass |
| `npm run lint` | pass (0 errors; pre-existing warnings elsewhere) |
| `npm run build` | pass |
| `check:exports` / `check:dead` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub CI `33499805181` | **SUCCESS** on exact head |
| Vercel Preview deployment `6199680801` | **success** on exact head |
| Vercel dashboard | `https://vercel.com/jetnity-e1b93c82/jetnity-app/H1BD8fr76uhUafCyfCJ3iuywUm7g` |
| Preview URL | `https://jetnity-4gzrbd8s8-jetnity-e1b93c82.vercel.app` — SSO-gated; `x-robots-tag: noindex` |
| `/sw.js` | not introduced |
| Console errors in local UI evidence | none |

## Mobile / desktop evidence

Local audit harness `/ui-audit/trip-workspace` with `JETNITY_UI_AUDIT=1`:

- empty evidence remains `Noch keine verlässlichen Hinweise verfügbar`
- Bali stage shows Official `required`, Safety `important_notice`, Seasonal `timing_check`
- Ubud (same country, no stage refs) shares Official destination truth and keeps Safety/Seasonal empty
- no Flug-Suche auto-mount
- same IA on 390×844 and 1280×800

Artifacts:

- `/opt/cursor/artifacts/destination_essentials_mobile_empty.png`
- `/opt/cursor/artifacts/destination_essentials_mobile_evidence.png`
- `/opt/cursor/artifacts/destination_essentials_desktop_evidence.png`
- `/opt/cursor/artifacts/destination_essentials_ui_evidence.json`

## Non-scope confirmation

No Supabase/DB/RLS/Auth mutation. No provider/secret/paid/live call. No World Map. No TW-8/TW-9. No service worker/offline/push. No indexing/domain cutover. No hard-coded destination facts.

## Next

Independent Technical-Lead Exact-Head review.  
**DO NOT mark Ready. DO NOT merge.**  
**STOP FOR TECHNICAL-LEAD REVIEW.**
