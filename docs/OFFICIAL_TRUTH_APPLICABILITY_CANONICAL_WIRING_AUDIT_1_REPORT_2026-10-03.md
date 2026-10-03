# Official Truth Applicability Canonical Wiring Audit 1 — Report

Date: 3 October 2026
Issue: #796
Draft PR: #797
Branch: `docs/official-truth-applicability-canonical-wiring-audit-1`
Baseline: `main@ac36175d4c64aaab6be7c83f2731a83473feba85`
Task: `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_TASK_2026-10-03.md`
Task seed: `b70775314cb2c357937756a59e5765bc45ba49c0` is not the review head.
Logical agent: **Jetnity Official Truth applicability canonical wiring audit 1**
Generation: **1**
Session: https://cursor.com/agents/bc-107ee745-44ac-4d35-9a53-bdc22f24337d
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge. No runtime follow-up is started.

## Classification

`CANONICAL_WIRING_READY_FOR_RUNTIME_SLICE`

**All schema-1 facts are non-persistable until an applicability-aware schema exists.**

Schema-1 unconditional facts are not safe to flatten. The proof is in the audit, section 6.

## What this audit decided

Live code on the baseline still has one private parser, `regelFaktLesen`. `regelFaktKanonischLesen` and `regelKandidatAkzeptieren` both call it. The applicability module has no production importer. The production extractor registry is an empty frozen array. The same-request success object already carries `RegelFakt` and does not call acceptance. The store serializes requirement effects as `effect` plus `visa_mode`, and visa options as ordinal, `visa_mode`, `eligibility`, and `mandate`. The RPC rebuilds the same flat JSON for idempotency. There is no applicability column and no fact reconstruction reader.

The later wiring slice:

- imports the existing fact unions and the two readers into `rule-claims.ts` only;
- keeps `regelFaktLesen` as the only semantic parser;
- does not call the traveller evaluator, the context reader, or the fingerprint helper from acceptance;
- returns `applicability_not_persistable` from `akzeptierteRegelClaimSpeichern` before `transportAus` and before `faktSpalten` for every schema-1 fact;
- leaves `applicability_not_persistable` off `RegelClaimFehler`;
- adds `legacy_conditional_without_payload`, `mixed_outcome`, and the existing reader bound and provenance codes to `RegelClaimFehler`;
- does not put `rule-applicability:v1` on `AkzeptierteRegelClaim`;
- does not add `reg-eval-ctx:v1`;
- keeps the production extractor registry empty;
- updates the importer lock so `rule-claims.ts` is the only new importer;
- lands the guard and the parser widening on one head, in one pull request.

Architecture section 13 required the writer to reject branched facts. It did not prove that flattening a schema-1 unconditional fact preserves identity. This audit does that proof and tightens the guard to every schema-1 fact. The tightening refuses a write. It does not add a table, a cost, or a product surface.

## Files

Created:

- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_SELF_REVIEW_2026-10-03.md`

The task seed is already on the branch and was not edited by the audit commit. R1 restored `docs/ACTIVE_WORK_STATUS.md` byte-for-byte to `main@ac36175d4c64aaab6be7c83f2731a83473feba85`. It is not an audit output.

Not edited: `docs/ACTIVE_WORK_STATUS.md`, `lib/**`, `app/**`, `components/**`, `types/**`, `supabase/**`, the task seed, `.jetnity/operating-mode.json`, provider selection, and the requirements engine.

A dirty `next-env.d.ts` was present at session start and was restored. It is not part of this slice.

## Boundary

No runtime wiring. No DB read, migration, or apply. No extractor registration. No source parser. No route or UI. No provider, model, or plugin. No CH import. No F8. No Production change. `requirementsProviderAus()` was not changed.

The claim key remains the scope hash `rule-scope:v1:`. Traveller context stays out of global rule acceptance. Multiple citizenships stay on the existing scope cell. This audit does not choose a passport and does not invent a visa rule.

## Gates

Local, on this docs tree, before the delivery commit:

- `git diff --check`: exit 0.
- `npm run check:operating-mode`: PASS.
- `git fetch origin main` immediately before commit: `origin/main` is `ac36175d4c64aaab6be7c83f2731a83473feba85`. This branch was 1 ahead and 0 behind. The ahead commit is the task seed `b70775314cb2c357937756a59e5765bc45ba49c0`. Re-fetch before treating a later SHA as current `main`.

Not run, because this slice edits no runtime, SQL, or package manifest:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`
- `auth:pruefen`

No remote database was contacted. Nothing was applied. Exact-head GitHub CI and Vercel for this branch tip exist only after the push. This report does not invent a run id.

## Security, database, cost

No new route, no service role use, no secret, no persistence, and no production migration. The audit's binding instruction to the later slice is to return before the service-role client is constructed when a fact is schema 1. No new running cost. No provider and no paid call.

## Risks

Flattening schema-1 unconditional facts would make a later applicability backfill ambiguous and would make idempotency treat a schema-1 fact as the legacy row. The wiring slice must refuse all schema-1 persistence.

The personal-key denylist is duplicated. Requirement-effect and visa-option parsing will use the applicability copy after delegation. The other fact kinds keep the claim copy. Unifying them is a later slice and does not block wiring.

The dormant writer still trusts its `trustedRuleFact` argument. A proposal object passed as that argument can still parse. This audit does not close that hole and does not turn agreement into proof.

Historical `conditional` effects remain legal in SQL. New acceptance of that flat effect fails closed. No migration is required to keep old rows readable, and this audit did not check whether any environment contains such a row.

## Next step

Independent Technical-Lead review of the exact branch tip. Cursor does not Ready or merge and does not start the runtime wiring slice.
