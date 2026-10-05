# Official Truth GOV.UK Profile Activation 1 — Task

Date: 4 October 2026
Issue: #824
Status: **BINDING / CODE-ONLY SINGLE-PROFILE ACTIVATION / NO DB WRITE / NO REGISTRATION / NO F8**

## 1. Authority and live baseline

Technical Lead selected this slice after post-merge verification of #823.

- baseline main: `49cef6463da0bce02a8127214cc93b6eaded2a57` (Merge #823)
- machine mode: `NORMAL`
- canonical current-state index: #751
- prerequisite #823: merged/post-merge verified
- post-merge CI: `37225807875` SUCCESS
- exact Production deployment: `dpl_5b6GaxaL3117RYkkXoj6Wr3GhKrR` READY / `jetnity.com` / `aliasError=null`
- Development Official Truth remains data-empty
- Production Official Truth v2 remains absent
- no Product-Owner registration-write authorization exists

Live evidence wins. If main/mode/#751/#748 or an overlapping writer materially changes before edits, STOP and report the drift.

## 2. Writer

Logical writer: **Jetnity Official Truth GOV.UK profile activation 1**, Generation 1.

Execution environment: **Codex Desktop**.

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

Do not silently substitute another model. Report exact session/model evidence at delivery.

Codex is implementation writer only:
- do not mark Ready;
- do not merge;
- do not start follow-up;
- do not execute hosted database writes.

## 3. Goal

Activate exactly one already-built deterministic content-identity profile in the production code-owned registry:

`GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE`

Binding identity:
- id: `govuk-eta-national-list-content-api-en`
- version: `1`
- current: `true`

The profile implementation is already reviewed and merged in:
`lib/readiness/official-truth-govuk-content-api-identity-profile.ts`

Do **not** modify its semantic/parser/verifier implementation in this slice.

## 4. Required production change

In:
`lib/readiness/official-truth-content-identity.ts`

- import exactly the existing GOV.UK profile definition;
- set `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY` to an `Object.freeze([...])` containing exactly that one existing profile object;
- no dynamic registration API;
- no environment-selected profile;
- no caller-supplied production profile;
- no second registry;
- no lazy/network/database import side effect.

Review the type-only reverse dependency from the profile module and prove the one runtime import introduces no harmful runtime cycle.

## 5. Allowed files

Production:
1. `lib/readiness/official-truth-content-identity.ts`

Existing tests allowed:
2. `lib/readiness/official-truth-content-identity.test.ts`
3. `lib/readiness/official-truth-content-identity-r2.test.ts`
4. `lib/readiness/official-truth-govuk-content-api-identity-profile.test.ts`
5. `lib/readiness/official-truth-source-catalog-server.test.ts`
6. `lib/readiness/official-truth-server-owned-retrieval.test.ts`

Slice docs:
7. this immutable TASK
8. `docs/OFFICIAL_TRUTH_GOVUK_PROFILE_ACTIVATION_1_REPORT_2026-10-04.md`
9. `docs/OFFICIAL_TRUTH_GOVUK_PROFILE_ACTIVATION_1_HANDOFF_2026-10-04.md`
10. `docs/OFFICIAL_TRUTH_GOVUK_PROFILE_ACTIVATION_1_SELF_REVIEW_2026-10-04.md`

Do not change the profile implementation file itself.

If a safe implementation genuinely requires another production/runtime file, STOP and explain the dependency rather than expanding scope.

## 6. Canonical prerequisites to read

At minimum:
- `JETNITY_START_HERE.md`
- `.jetnity/operating-mode.json`
- Technical-Lead operating standard
- live #751 and new relevant #748 evidence
- #821 registration audit/report/handoff
- #823 gateway task/report/handoff
- `lib/readiness/official-truth-content-identity.ts`
- `lib/readiness/official-truth-govuk-content-api-identity-profile.ts`
- `lib/readiness/official-truth-server-owned-retrieval.ts`
- the allowed tests above

## 7. Registry invariants

After activation, prove:

1. registry length is exactly 1;
2. registry is frozen;
3. entry object is the exact existing exported profile object, not a cloned/redeclared lookalike;
4. profile id exactly `govuk-eta-national-list-content-api-en`;
5. profile version exactly 1;
6. current exactly true;
7. verifier function is the existing reviewed verifier;
8. no second current/version profile exists;
9. no dynamic mutator/register function is added;
10. no model/plugin/database content can create executable profile authority.

Do not alter `ContentIdentityProfileDefinition`, R1 validation semantics or evidence identity semantics unless a concrete blocker is found; if so STOP.

## 8. Importer / blast-radius guard

The old verifier tests intentionally proved zero non-test production importers of the GOV.UK profile module.

Update that guard narrowly:

- allow exactly one intended non-test runtime importer:
  `lib/readiness/official-truth-content-identity.ts`;
- keep all other non-test importer paths forbidden;
- retain finite exact-path assertions;
- type-only import from the profile module back to the content-identity contract is not an additional runtime importer;
- prove importing `official-truth-content-identity.ts` and the profile registry does not trigger network/DB access or execute the verifier.

No route/API/UI file may import the profile directly.

## 9. R1 / R2 expectations

Update tests that currently assume registry emptiness.

R1:
- exact singleton registry/id/version/current/frozen assertions;
- existing graph with the activated exact profile succeeds where otherwise structurally valid;
- unknown profile/version still fails `profile_unavailable`;
- duplicate profile/current/version and malformed profile definitions remain fail-closed;
- authority/content separation and URL/source negative cases remain unchanged.

R2:
- split the prior “all registries empty” assumption:
  - content-identity profile registry = exactly one GOV.UK profile;
  - trusted-fact extractor registry remains EMPTY;
  - composition-policy registry remains EMPTY;
  - region-pin registry remains EMPTY;
  - any other trust registry intended empty remains empty;
- no real extractor/composition/region-pin/Rule fact/F8 is activated.

## 10. Gateway default-registry proof

The merged `contentItemRegistrieren` gateway must now have an acceptance proof using the **normal default profile registry**, not only injected `identityProfiles`.

Use injected transport/catalog data only; do not contact hosted Supabase.

Prove:
- an exact structurally valid item/representation using `govuk-eta-national-list-content-api-en` v1 can pass profile availability with **no explicit identityProfiles dependency injection**;
- unknown/wrong profile/version remains fail-closed before write;
- the gateway still does not execute the profile verifier during registration;
- no profile activation changes source authority, URL conflict, replay, response exact-key or no-write-on-validation-failure guarantees.

This test is structural registration eligibility only. It does not claim GOV.UK HTTP origin or legal truth.

## 11. Retrieval/default-profile proof

Use existing server-owned retrieval test seams only.

Prove the default code-owned registry can resolve exactly the activated profile for a correctly bound synthetic/test National-List identity path without caller profile injection.

Retain:
- exact profile id/version/current selection;
- exactly one match requirement;
- wrong/unknown/retired profile fails;
- final tuple rebind remains exact;
- verifier receives only trusted server-owned response material;
- no caller-supplied profile implementation becomes authority.

No fresh GOV.UK network call is required or allowed for this test.

## 12. Production missing-v2 fail-closed

Production database currently lacks Official Truth v2.

Activation of code must **not** turn absent DB/RPC into empty success or fallback.

Tests must prove:
- missing/unavailable v2 catalog RPC remains failure;
- no v1 fallback;
- no registration attempt after catalog failure;
- no hidden auto-migration/apply;
- no service-role secret exposure.

Do not touch Production or Development DB from implementation/tests.

## 13. Dormancy / side-effect invariants

Activation means only executable profile availability in code.

It must not:
- fetch GOV.UK on import;
- read or write Supabase on import;
- create a source/catalog row;
- call `contentItemRegistrieren`;
- call `quelleRegistrieren`;
- call an extractor;
- accept Evidence/Rule truth;
- activate composition/region pin/F8;
- alter provider/runtime selection;
- introduce recurring cost.

Add/import-time adversarial proof where needed.

## 14. Hard non-scope

Absolutely no:
- profile implementation changes;
- GOV.UK source/content registration;
- Development DB write;
- Production DB write/apply;
- migration/schema/RLS/Auth/grant changes;
- source extractor registration;
- composition policy registration;
- region pin activation;
- Evidence/Rule fact persistence;
- `regelKandidatAkzeptieren` change;
- F8;
- route/UI/browser registration;
- provider/secret/payment;
- public launch/indexing;
- follow-up slice.

## 15. Validation

Run on final tree:

- `git diff --check`
- `npm run check:operating-mode`
- focused R1/R2/profile/source-gateway/retrieval tests
- full `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run build`

No fabricated PASS. Environment-blocked local tests must be reported honestly; exact-head Linux CI remains a Technical-Lead gate.

Before delivery:
- re-fetch main/mode/#751/#748;
- prove task seed byte-identical;
- exact diff/scope;
- merge-base/ahead/behind;
- exact final head;
- exact model/session evidence;
- no hosted DB/government write/network;
- adversarial self-review of importer boundary, runtime cycle, exact singleton registry, default-registry gateway/retrieval path and DB-absent fail-closed behavior.

## 16. Deliverables

Create REPORT, HANDOFF, SELF_REVIEW.

Keep PR Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready.
Do not merge.
Do not register GOV.UK.
Do not write Development.
Do not start F8.
