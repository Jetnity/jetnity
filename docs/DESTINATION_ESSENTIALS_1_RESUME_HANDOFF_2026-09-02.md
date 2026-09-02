# Destination Essentials 1 – Resume / Main-Reconciliation Handoff

Stand: 2. September 2026  
Status: **RECONCILED ONTO CURRENT MAIN / LOCAL GATES GREEN / STOP FOR TECHNICAL-LEAD REVIEW**

## Identity

- Issue: #393
- PR: https://github.com/Jetnity/jetnity/pull/394 (Draft)
- Resume task: `docs/DESTINATION_ESSENTIALS_1_RESUME_TASK_2026-09-02.md`
- Original task: `docs/DESTINATION_ESSENTIALS_1_TASK_2026-09-01.md`
- Branch: `feat/phase-1-destination-essentials-1`
- Cursor-Agent: `Jetnity destination essentials 1`
- Generation: **1**
- Session: `bc-0dde2838-bb7b-4e97-b94a-6ac95002e2a2`
- Multi-Agent: **SINGLE_AGENT**
- Technical-Lead resume-task commit: `9d6b5f9a668e8ba54bc36dc7c409105aa38e2402`
- Live `origin/main` at reconcile: `ed41dd17b4b456899d9e4ae11694efe3b10739a9`
- Merge-base after reconcile: `ed41dd17b4b456899d9e4ae11694efe3b10739a9`
- Ahead/behind vs `origin/main` after reconcile push: **12 ahead / 0 behind**
- Local-gate head before this handoff commit: `7f49b8dd1b885c736f1be79f71cd2a06bd3c5522`
- Exact head after this handoff: **this commit on the branch tip**

Historical heads `00183a37...` / `52b9866d...` and their CI/Preview/self-review are **not** current exact-head evidence.

## What was reconstructed

Fetched live `origin/main` first. SHA matched the resume-task baseline: `ed41dd17` (`Persist new ChatGPT handoff checkpoint (#416)`).

Current main already contains:

- closed Flight Multi-Leg (ADR-0207);
- closed 0..N Flight orchestration (ADR-0208 / PR #414);
- provider selection deferred;
- Destination Essentials previously marked deferred.

Official / Safety / Seasonal TypeScript contracts have **zero drift** vs this slice. Trip Workspace files were untouched on main except our Destination Essentials insertions.

## Reconciliation method

Not a blind rebase. Merged `origin/main` into the feature branch, then merged the versioned resume-task commit `9d6b5f9a` so it remains in history.

Conflicted canonical docs taken from current main, then only Destination Essentials resume pointers were added:

- `JETNITY_START_HERE.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`

## Contract correction

The stale branch had numbered Destination Essentials as ADR-0207. Current main already uses ADR-0207 for Flight Multi-Leg. The Destination Essentials decision is now **ADR-0209**. Flight ADR-0207/0208 were not rewritten.

## Preserved Destination Essentials behavior

Still correct on current main and kept:

- stage order / identity; duplicate-country stages stay distinct;
- no country inference from labels;
- destination Official ≠ transit Official;
- unknown/unavailable/stale/recheck remain distinct from `not_required`;
- mixed current credential/traveller Official outcomes stay `option_abhaengig` / `reisende_abhaengig` / `option_und_reisende_abhaengig`;
- details use `officialCredentialLabel`;
- validated Official action only; identical href keeps action;
- Safety/Seasonal only via explicit `kind: 'stage'` refs;
- Safety/Seasonal source label is official only for `official_*`;
- omitted evaluations stay empty (`Noch keine verlässlichen Hinweise verfügbar`);
- `loestSucheAus: false`.

## Production evidence limitation

Unchanged and still true on current main:

- `TripWorkspaceAuditClient` can inject Official/Safety/Seasonal evaluations;
- `KontoArbeitsbereich` and `GastArbeitsbereich` do **not** pass those props;
- Guest/Account therefore render the honest empty Destination Essentials state;
- no hidden API, fixture, or new runtime data source was added.

## Changed files versus current `origin/main`

Runtime / tests:

- `lib/trips/destination-essentials.ts`
- `lib/trips/destination-essentials.test.ts`
- `components/trips/TripWorkspaceDestinationEssentials.tsx`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `lib/account/uebersicht-grenzen.test.ts`
- `lib/account/reise-gruppen-grenzen.test.ts`

Docs (main-preserving plus Destination Essentials resume / ADR-0209):

- `ARCHITECTURE.md`
- `DECISIONS.md`
- `ROADMAP.md`
- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/DESTINATION_ESSENTIALS_1_TASK_2026-09-01.md`
- `docs/DESTINATION_ESSENTIALS_1_RESUME_TASK_2026-09-02.md`
- `docs/DESTINATION_ESSENTIALS_1_HANDOFF_2026-09-01.md`
- `docs/DESTINATION_ESSENTIALS_1_SELF_REVIEW_2026-09-01.md`
- `docs/DESTINATION_ESSENTIALS_1_RESUME_HANDOFF_2026-09-02.md`
- `docs/JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`

Flight / provider / DB files from main are present via merge and identical to `origin/main`. They are not Destination Essentials edits.

## Local gates on `7f49b8dd`

| Gate | Result |
| --- | --- |
| Destination Essentials + account-boundary tests | **26/26 pass** |
| Full repository suite | **3172 pass / 0 fail** |
| `npm run typecheck` | pass |
| `npm run lint` | pass (0 errors; 138 pre-existing warnings) |
| `npm run build` | pass |
| `check:exports` / `check:dead` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub CI / Vercel Preview | must be read for **the branch tip after this handoff commit** |

## Mobile / desktop evidence

Local audit harness `/ui-audit/trip-workspace` with `JETNITY_UI_AUDIT=1` on `http://127.0.0.1:3462`:

- empty evaluations stay `Noch keine verlässlichen Hinweise verfügbar`;
- Florenz: Official `required`, Safety `important_notice`; Rom Seasonal `timing_check`;
- Official action and source remain distinct; no Flug-Suche auto-mount (`data-destination-search=nein`);
- same IA on 390×844 and 1280×800;
- console errors: none.

Artifacts:

- `/opt/cursor/artifacts/destination_essentials_resume_mobile_empty.png`
- `/opt/cursor/artifacts/destination_essentials_resume_mobile_evidence.png`
- `/opt/cursor/artifacts/destination_essentials_resume_desktop_evidence.png`
- `/opt/cursor/artifacts/destination_essentials_resume_ui_evidence.json`

## Non-scope confirmation

No Supabase/DB/RLS/Auth mutation. No provider/secret/paid/live call. No Production S6. No Commercial Provenance writer. No TW-8/TW-9. No World Map. No service worker/offline/push. No indexing/domain cutover. No hard-coded destination facts. No Flight contract rewrite.

## Next

Independent Technical-Lead Exact-Head review of the reconciled Draft PR.  
**DO NOT mark Ready. DO NOT merge.**  
**STOP FOR TECHNICAL-LEAD REVIEW.**
