# V1 Workspace Status Language 1 — Status

Stand: 21. September 2026  
Status: **IMPLEMENTED / AUTHOR SELF-REVIEW ONLY / DRAFT / NOT READY / NOT MERGED**

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
| Agent | **Jetnity V1 workspace status language 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) — no Auto |
| Session | `bc-d6388e7d-7896-4902-a4d0-efd5dcbe4cce` |
| Session rename | UI rename not supported / not performed |

Exact freeze SHA and CI/Auth/Preview IDs belong in the freeze PR comment.

## Behaviour

- Unknown stays uncertain: “Noch unklar” / “Stand noch unklar”. Known-open still says not selected only when the existing branch proves it.
- Partial, selected, booked and no-needed keep distinct copy. Counts and route fragments stay in the canonical summaries.
- Gap eyebrow no longer labels every panel as “Lücke”. Unknown → “Noch unklar”, activities → “Optional”, covered-by-flight → “Hinweis”, known open → “Noch offen”.
- Next-step copy asks to check trip data and existing entries. It does not promise a provider, live check or “Anbieter folgt”.
- `item.date_mismatch` and non-coverage attention titles are unchanged.
- Coverage texts still come from `flugAbdeckung` / `unterkunftAbdeckung` / `mobilitaetsAbdeckung`. No second string-parsing formatter.

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

## Author-run gates

Recorded after the product commit. Exact-head IDs stay in the freeze PR comment.

## Sicherheit / Kosten

No secrets, paid calls, DB/Auth/RLS mutation, provider activation or new running cost.

## Next step

**ChatGPT / Technical Lead** independent exact-head code and visual/interaction review. Cursor does not Ready, merge, or start a follow-up.
