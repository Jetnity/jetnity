# V1 Account Graph Read Completeness 1 — Status

Stand: 21. September 2026  
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / AUTHOR SELF-REVIEW ONLY**

## First receipt

| Item | Value |
| --- | --- |
| Agent | **Jetnity V1 account graph read completeness 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) — no Auto, no substitute |
| Session | `bc-7aea55a7-c218-4b66-8fdf-a546dbbe6b74` |
| Session rename | UI rename not supported / not performed |
| Issue | #529 |
| Draft PR | #531 |
| Branch | `fix/v1-account-graph-read-completeness-1` |
| Task seed | `4e1df6d00532c6b44f48c522b006db9feef295ec` |
| Assigned baseline `main` | `e818c13ed009932bc06be1382a89467866699995` |
| Parallel sibling | #532 / issue #530 owns guest storage/create only — not written here |

This is a new Generation1 session, not a restart of #517 / #526 / #528.

## Plan (before source edits)

**Goal.** Close TA-R3 at the account graph read boundary: a missing Foundation-E child relation or a structurally incomplete canonical party must not become a successful `Reisegraph`. Use the existing `Lesung.problem` contract. Do not add Trip/Traveller/readiness flags.

**Live defect.** `reiseLaden` retries `TRIP_GRAPH_SELECT_LEGACY` when `foundationERelationFehlt`, then maps through `reiseAus` / `partyAusZeilen`. Missing child arrays plus leftover CH/passport columns become one citizenship and one document. Canonical empty arrays are already kept empty.

**Implementation.**

1. `lib/trips/foundation-e-select.ts` — truthful header (fallback only for the narrowly detected missing relation; not a claim that Production lacks child tables). Add `accountGraphKinderVollstaendig`: traveller relation must be an array; every actual traveller must have both child arrays loaded. Empty party and empty children are complete.
2. `lib/trips/account-graph-read.ts` — injectable orchestration used by `reiseLaden` and tests. Canonical read first. Missing-relation detector may run one legacy select. Nonempty fallback → sanitized `Lesung.problem` / `zeilen: null` **before** mapping. Empty fallback stays absent/not-owned. Fallback/canonical transport errors keep `lese()`. Canonical success with any missing/null/non-array child fails closed before mapping; no filtering of incomplete travellers. Complete rows map unchanged.
3. `lib/trips/daten.ts` — `reiseLaden` only: call the orchestration. Keep RLS/no-`user_id` filter, `limit(1)`, existing mapper (`reiseAus` + `tageEtappenZuordnen`).
4. Tests in `lib/trips/account-graph-read.test.ts` plus helper cases in `foundation-e-select.test.ts`. Execute the real orchestration with injected responses. Prove mapper-not-called on incomplete/legacy-nonempty paths. Prove named `reiseLaden` consumers stop before use via the existing problem-before-use contract and the injectable Safety caller. No source-regex policy tests.
5. Own STATUS / HANDOFF / SELF_REVIEW / DECISION / evidence. No global continuity files. No guest/create, types, schema, Auth, provider or mutation edits.

**Availability tradeoff.** Exceptional incomplete account reads make that trip workspace/actions unavailable. No claim of deleted data. Canonical complete/empty path unchanged.

**Non-scope.** Parallel #532. Shared Trip/Traveller/readiness types. Guest `partyAusZeilen` semantics. Production SQL/Auth. Ready/Merge/follow-up. Autonomous rebase onto later main.

**Traveller context.** Relevant. Structural load completeness is checked per traveller. Multiple citizenships/documents stay multiple. Loaded empty children stay empty. Credential sufficiency is not evaluated.

## Behaviour

- `accountGraphLesen` is the injectable production orchestration used by `reiseLaden`.
- Complete canonical multi-citizenship/multi-document parties map unchanged, including selected document→citizenship associations.
- Canonical `trip_travellers: []` and loaded empty child arrays stay valid empty. Leftover singular columns cannot refill them on this path.
- Detected missing child relation still runs one legacy select. Nonempty fallback → sanitized `Lesung.problem` / `zeilen: null` before `reiseAus`. Empty fallback stays absent/not-owned. Fallback errors keep `lese()`.
- Canonical success with any missing/null/non-array child, including mixed travellers, fails closed before mapping.
- Other canonical errors, null-data/no-error and thrown readers do not retry and do not become empty success.
- Named consumers already stop on `problem`. Safety is executed as a real caller. No out-of-scope expansion requested.

## Scope held

Written only the owned account-read files, named tests, own docs and evidence. See `docs/evidence/v1-account-graph-read-completeness-1/changed-path-manifest.md`.

Traveller context is relevant: completeness is checked per traveller; multiple legal credential options stay multiple; loaded empties stay empty; no credential rule invented.

## Author-run gates

Focused orchestration/party tests: **PASS** (18/18 on the new suites plus existing `reisende.test.ts`).  
Full typecheck / lint / test / hygiene / build results belong in the freeze PR comment after the exact head is frozen.
