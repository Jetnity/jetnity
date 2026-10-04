# Official Truth Content Identity R2 Wiring 1 — Scope Amendment 2

Date: 4 October 2026
Issue: #814
Draft PR: #815
Baseline main: `30aa083dc752bf499dfc5a09448d06bd36d3ba64`
Original immutable task: `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_TASK_2026-10-04.md`
Original dispatch head: `7185c60dd78604a5105b207a855fc74620195fc0`
Scope Amendment 1: `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_SCOPE_AMENDMENT_1_2026-10-04.md`
Second blocked documentation head: `b30c9a897ba43877debec9a0332aeefbb33f2fec`
Logical writer: **same Jetnity Official Truth coordinated content identity wiring R2**
Generation: **1**
Execution environment: **same Codex Desktop session**
Required model: **GPT-6 Astra — Sehr hoch**

## Reason for amendment

After Scope Amendment 1, the same Codex writer correctly resumed the pre-edit semantic audit and found three additional **test-only ownership dependencies**.

Independent Technical-Lead review confirms all three are genuine compatibility tests that must move with R2. No additional production importer outside the original finite closure is demonstrated as requiring change.

The required tests are:

1. `lib/readiness/official-truth-review-suggestion.test.ts`
2. `lib/readiness/evidence-store-schema.test.ts`
3. `lib/readiness/rule-claim-store-schema.test.ts`

These are now authorized in PR #815.

No other file is authorized by this amendment.

## A. Review suggestion test

`official-truth-review-suggestion.ts` remains an external production importer that delegates packet/fingerprint reconstruction and does not itself need a production edit on current evidence.

Its test does need reconciliation because it currently hard-codes:
- `review-packet:v2:`;
- source-only synthetic packet/support fixtures.

Required change:

- upgrade only the synthetic fixtures and expected fingerprint format to the canonical R2 review identity produced by the in-scope packet/fingerprint modules;
- retain all existing advisory-only, privacy, citation, immutability, no-acceptance and no-store assertions;
- do not add trusted authority to review suggestion;
- do not broaden its production API unless the in-scope production fingerprint/packet contract itself requires it;
- do not turn the suggestion into a bearer or F8 path.

## B. Evidence store schema test

`evidence-store-schema.test.ts` is partly a **historical SQL contract test** for the original
`official_truth_private_evidence_store_schema_1` migration and partly a current TypeScript-runtime contract test.

R2 must not rewrite history.

Required reconciliation:

- preserve assertions proving the historical v1 migration used its original `ev1_` and `evidence-key:v2:` formats where those assertions are explicitly about that historical migration text;
- update only the assertions about the **current live runtime contract** in `lib/readiness/evidence.ts` to the canonical R2 `ev2_` / `evidence-key:v3:` contract;
- if the test currently assumes historical SQL and current runtime must have identical format constants, split that assertion clearly into:
  - historical-v1 schema expectation; and
  - current-v2 runtime expectation;
- do not edit historical migrations.

The test must make the coexistence intentional rather than masking it.

## C. Rule Claim store schema test

`rule-claim-store-schema.test.ts` is likewise partly a historical static schema contract and partly a runtime constructor/acceptance fixture.

Required reconciliation:

- preserve all static assertions for the historical Rule Claim migration, fact tables, normalization rules and transit semantics unless a current in-scope runtime contract explicitly requires a changed expectation;
- upgrade only the synthetic runtime Evidence/Rule fixtures used for successful constructor/acceptance tests so they carry valid R2 ContentItemRef / representation/profile / ev2-v3 identity;
- use existing in-scope R1/R2 helpers, not handwritten fake identity serialization;
- keep `regelKandidatAkzeptieren` as the sole canonical Rule acceptance constructor;
- preserve negative tests for malformed facts, normalization and source/quality restrictions;
- do not use source-only Evidence to produce a successful R2 trusted acceptance fixture.

No DB call or live store call may be added.

## D. Original scope remains binding

The original task plus Scope Amendment 1 remain fully binding.

Authorized outside-original-closure files are now exactly five:

1. `scripts/db/verwendung.mjs`
2. `lib/admin/account-counts-delivery/schema-reference.test.ts`
3. `lib/readiness/official-truth-review-suggestion.test.ts`
4. `lib/readiness/evidence-store-schema.test.ts`
5. `lib/readiness/rule-claim-store-schema.test.ts`

No recursive expansion is granted.

Still forbidden:

- Supabase migration edit/create/apply;
- Development/Production mutation;
- generated DB types;
- package/config changes;
- route/app/component/provider/traveller code;
- real source/content/profile/GOV.UK/CTA registration;
- real extractor/composition policy;
- region pin registration;
- schema-1 persistence;
- F8;
- #626;
- launch/indexing.

## E. Validation expectations

After implementing R2, the same writer must run the full original validation matrix plus these three tests explicitly.

Required interpretation:

- historical migration tests may continue to assert historical v1 SQL formats;
- current runtime assertions must prove v2/ev2/v3 semantics;
- there must be no test that makes source-only / ev1 trusted runtime behavior pass merely for backward compatibility;
- legacy input may remain only as explicit fail-closed/rejection coverage.

If any further outside-closure file becomes necessary, STOP again.

## Resume protocol

Same Codex session / same logical writer / same Generation 1 must:

1. fetch branch and confirm this amendment exists;
2. re-read original task + Amendments 1 and 2;
3. re-read live main/mode/#751/#748;
4. confirm no overlapping writer;
5. resume the **full R2 implementation**, not only test edits;
6. apply Amendments 1 and 2 only as needed by the actual R2 cutover;
7. run the complete exact-head validation matrix;
8. remain Draft;
9. never Ready/merge;
10. report exact final head and STOP for independent TL review.

This amendment does not authorize a new writer, new branch, DB action, real registration, or F8.
