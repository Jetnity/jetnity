# Official Truth Applicability Canonical Wiring Runtime 1 — Self-Review

Date: 3 October 2026
Issue: #798
Draft PR: #799
Branch: `feat/official-truth-applicability-canonical-wiring-1`
Baseline: `main@e6c2ae309a9d4e419fbbb38719969d5d40abb5ab`
Logical agent: **Jetnity Official Truth applicability canonical wiring runtime 1**, Generation 1
Session: https://cursor.com/agents/bc-2b43f956-a705-4f8a-84c4-38c38645e965
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## Scope check

The task allows:

- `lib/readiness/rule-claims.ts`
- `lib/readiness/rule-claims.test.ts`
- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`
- test-only extractor and same-request tests
- the report, this self-review, and the handoff

The task seed was not edited. `.jetnity/operating-mode.json` was not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited because the task names an exact file allowlist and these three delivery docs. The handoff carries the continuity fields. Foundation slice #794 recorded the same limit.

These source files were not edited: `lib/readiness/regulierungs-anwendbarkeit.ts`, `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`, `lib/readiness/official-truth-same-request-extraction-server.ts`. No `supabase/**`, `app/**`, or `components/**` diff against `main@e6c2ae30`.

## Order check

`37be473d` adds the store guard and the new claim-error members before `ef0f4d4c` widens the parser. The review tip contains both. Splitting them across PRs would leave a window where schema-1 facts could be accepted and then flattened into columns that cannot store `schema` or `applicability`.

## Contract check

`regelFaktLesen` is still the only semantic parser. `regelFaktKanonischLesen` returns `regelFaktLesen(...)`. `regelKandidatAkzeptieren` calls `regelFaktLesen` for `trustedRuleFact` only.

`rule-claims.ts` imports the two fact-shape readers. It does not import `regulierungsKontextLesen`, `regulierungsWirkungAuswerten`, `regulierungsVisaOptionAuswerten`, `regulierungsAusdruckAuswerten`, or `regelAnwendbarkeitFingerprint`.

Every schema-1 fact, including unconditional, returns `applicability_not_persistable` before `transportAus`, `claimPayload`, `faktSpalten`, and `transport.aufrufen`. The guard index in the writer sits before those calls. Legacy successful payloads stay on the existing column shape. Legacy flat conditional fails closed and does not call the RPC.

`OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` is `Object.freeze([])`. The extractor and same-request proofs inject definitions only in tests.

## Deliberate mappings

These are inside the task, and a reviewer should see them explicitly:

- `applicability_not_persistable` is a store-writer result. It is not a `RegelClaimFehler`.
- `PersistierbarerRegelFakt` is an `Exclude` on the widened `RegelFakt`. The store does not import the applicability module and does not duplicate the schema-1 interfaces.
- `context_conflict` maps to `invalid_fact`. Fact parsing does not call the context reader, so acceptance does not return `context_conflict`.
- Legacy conditional drops the reader's `auswertung` object. The public error is only `legacy_conditional_without_payload`.
- `node_bound_exceeded` shares the `faktGrund` passthrough with depth, branch, and operand. Only those three bounds have dedicated parser tests in this slice.
- Visa options keep `requirement_type_mismatch` when the requirement type is not `visa`, then delegate.

## What I did not do

I did not add a migration. I did not apply SQL. I did not register a production extractor. I did not evaluate a traveller during acceptance. I did not put `rule-applicability:v1` on an accepted claim. I did not emit `reg-eval-ctx:v1`. I did not start F8 or a follow-up slice.

## Author gate note

The focused files passed 114/114 on `ef0f4d4c` before this gate block was written. The full-suite, typecheck, lint, build, and hygiene results below are that same tree. If a line says a command failed, that failure stands.

## Gates

Author gates of `ef0f4d4c288ac23efee71b5d72a264e8999c6ad4`, on this working tree, 3 October 2026, before the documentation commit. The review head is the branch tip that contains this file. Re-fetch it. `ef0f4d4c` is the implementation head, not the review head after this commit.

- Focused `rule-claims.test.ts`, `official-truth-store-server.test.ts`, `regulierungs-anwendbarkeit.test.ts`, `official-truth-trusted-fact-extractor-registry.test.ts`, `official-truth-same-request-extraction-server.test.ts`, `rule-claim-store-schema.test.ts`: 114 pass / 0 fail / 9 suites. Exit 0.
- `npm test`: 4596 pass / 0 fail / 768 suites. Exit 0.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0. 148 problems, 0 errors, 148 warnings. None are in the owned files.
- `npm run build`: exit 0. Next.js 16.3.8 (Turbopack). 25 static pages.
- `npm run check:operating-mode`: PASS.
- `npm run check:dead`: exit 0. 646 start points, 1300 reachable, 0 unreached.
- `npm run check:exports`: exit 0. 0 exports without a caller.
- `npm run check:deps`: exit 0. 11 dependencies, 0 unused.
- `npm run check:api-schutz`: exit 0. 12 admin routes.
- `npm run check:schema-bezug`: exit 0. LOCAL/UNAPPLIED RPCs unchanged: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, `official_truth_store_accepted_v1`.
- `git diff --check`: exit 0.

`origin/main` at gate time: `e6c2ae309a9d4e419fbbb38719969d5d40abb5ab`. This branch was 0 behind. No remote database. No SQL applied. Local PostgreSQL 16 binaries exist so the existing throwaway store proof can call `initdb`. The system cluster was not started.
