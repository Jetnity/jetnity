# V1 Workspace Status Language 1 — Status

Stand: 21. September 2026  
Status: **SL-R1/SL-R2 CORRECTION IN PROGRESS / DRAFT / NOT READY / NOT MERGED / AUTHOR SELF-REVIEW ONLY**

## Arbeitsblock / Ziel

Accepted #506 VUX-3: replace internal “Abdeckung / bestimmbar / Lage / Pflichtlücke” wording on overview, coverage attention and gap details with understandable German status and next-step copy. Keep every underlying distinction.

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `fix/v1-workspace-status-language-1` |
| Issue | #525 |
| Draft PR | #526 |
| Assigned baseline | `main@4278cd047b907b218fe64c122c4eed7dd61e0a7e` |
| Task seed | `f6372928b994c6ac00dac8fc82deee0a856a2376` |
| Product tree used for screenshots | **`7a143fecdf0647bfa059653f96cc8c1eca5d6656` (clean)** |
| Re-read `origin/main` before freeze | `4278cd047b907b218fe64c122c4eed7dd61e0a7e` — **no drift**; this branch is ahead only with this slice |
| Agent | **Jetnity V1 workspace status language 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) — no Auto |
| Session | `bc-d6388e7d-7896-4902-a4d0-efd5dcbe4cce` |
| Session rename | UI rename not supported / not performed |

Exact freeze SHA and CI/Auth/Preview IDs belong in the freeze PR comment.

## Behaviour

- Unknown stays uncertain: “Noch unklar” / “Stand noch unklar”. Known-open still says not selected only when the existing branch proves it.
- Partial, selected, booked and no-needed keep distinct copy. Counts and route fragments stay in the canonical summaries.
- Gap eyebrow no longer labels every panel as “Lücke”. Unknown → “Noch unklar”, activities → “Optional”, covered-by-flight → “Hinweis”, known open → “Noch offen”, `belegt` / no-needed → “Kein offener Punkt” (not “Vorhanden”).
- Overview `belegt` is inventory-neutral: “Keine bekannten offenen Punkte” / “N von 4 Bereichen ohne bekannten offenen Punkt”. Same-place zero-item stays `belegt` with “Kein Flugabschnitt erforderlich” / “Keine Verbindung erforderlich”.
- Next-step copy matches offered actions. Mobility `belegt` does not promise a search or existing entries when `sucheAnbietbar=false`. It does not promise a provider, live check or “Anbieter folgt”.
- `item.date_mismatch` and non-coverage attention titles are unchanged.
- Coverage texts still come from `flugAbdeckung` / `unterkunftAbdeckung` / `mobilitaetsAbdeckung`. No second string-parsing formatter.

## TL review 5271416938

Reviewed head `5b80a8213fecab575ae5d47aed76ea970baa7d50`. Same session.

- **SL-R1:** first-slice “vorhanden” converted no-known-gap/not-needed into inventory existence. Neutral copy now valid for both actual coverage and zero-item same-place.
- **SL-R2:** mobility `belegt` next-step no longer says a search will start or that entries exist.

## Scope held

Written only:

- `lib/trips/uebersicht.ts`
- `lib/trips/attention.ts` (`coverageTitel` only)
- `lib/trips/detail.ts` (lage/fallback/next-step strings + display helpers from already-derived gap fields)
- `components/trips/TripWorkspaceDetail.tsx` (gap eyebrow/status/secondary)
- `lib/trips/flug-abdeckung.ts` (`abschnittWort` / `zusammenfassungAus` strings)
- `lib/trips/naechte-abdeckung.ts` (`zusammenfassungAus` strings)
- `lib/mobility/kanten.ts` (`statusWort` / `zusammenfassungAus` strings)
- matching tests, new `lib/trips/workspace-status-language-1.test.ts`
- `scripts/v1-workspace-status-language-1-audit.mjs`
- own `docs/V1_WORKSPACE_STATUS_LANGUAGE_1_{TASK,STATUS,HANDOFF,SELF_REVIEW}_2026-09-21.md`
- own `docs/evidence/v1-workspace-status-language-1/`

Not written: #520 date-mismatch logic, non-coverage attention, Bestand “bestimmbar” residual, planner/Feld layout (#528), types, DB/Auth/RLS, storage, package/lockfile, `ACTIVE_WORK_STATUS.md`.

Traveller context is not relevant. No citizenship/document/credential collection.

## Author-run gates (not TL PASS)

| Check | Result |
| --- | --- |
| focused wording/state tests | **PASS** including `workspace-status-language-1.test.ts` |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors; 138 pre-existing warnings) |
| `npm test` | **3659/3659 PASS** on product tree `7a143fec` |
| `npm run build` | **PASS** |
| `check:dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | **PASS** |
| synthetic browser 390 / 1440 | **PASS** on clean `7a143fec`; compiled product CSS via `next dev`; provider/model intercepted |

No live provider, model, account or DB probe. Exact-head CI / Auth / Preview IDs belong in the freeze PR comment.

## Sicherheit / Kosten

No secrets, paid calls, DB/Auth/RLS mutation, provider activation or new running cost.

## Next step

**ChatGPT / Technical Lead** independent exact-head code and visual/interaction review. Cursor does not Ready, merge, or start a follow-up.
