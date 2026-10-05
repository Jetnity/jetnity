# GOV.UK ETA National List Registration Audit 1 — Task

Date: 4 October 2026
Issue: #820
Baseline: `main@93ad2e447353af6bf380c2df1be190baeeb39888`
Branch: `docs/govuk-national-list-registration-audit-1`
Logical writer: **Jetnity GOV.UK ETA National List registration audit 1**
Generation: **1**
Execution environment: **Codex Desktop**
Required model: **GPT-6 Astra — Sehr hoch**
Status: **DOCS/AUDIT ONLY / NO REGISTRATION / NO DB MUTATION / NO PROFILE ACTIVATION / NO F8**

## Purpose

Define the exact, fail-closed future registration plan for Jetnity's first real Official Truth identity in **Development only**:

1. one GOV.UK authority/domain source;
2. one ETA National List content item;
3. one English Content API representation;
4. one already-implemented code-owned identity profile.

This audit must decide exact local ids, exact payloads, exact operation ordering, exact pre/post readbacks and the smallest safe next implementation/apply step.

It must **not** register anything.

Live repository/database evidence overrides this task if anything changed after the baseline.

## Binding startup gate

Before research:

1. fetch live `origin/main`;
2. require exact baseline `93ad2e447353af6bf380c2df1be190baeeb39888`, otherwise STOP;
3. require machine mode `NORMAL`;
4. read Issue #751;
5. read #748 MATERIAL newer than marker `5978621253`;
6. inspect open PRs/writers;
7. confirm #820 / this branch is the only overlapping Official Truth writer;
8. read this complete task;
9. re-read the complete merged source-identity, R1, S1, R2, #816 audit and #818 verifier docs;
10. inspect live Development v2 catalog **read-only** and require all source/content/Evidence/Rule data still empty;
11. inspect Production **read-only** and require Official Truth v2 schema/RPCs still absent;
12. do not edit this task seed.

Read at minimum:

- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_ITEM_IDENTITY_FOUNDATION_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_SCHEMA_RPC_V2_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_DEVELOPMENT_S1_APPLY_LOG_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_REPORT_2026-10-04.md`
- `lib/readiness/source-registry.ts`
- `lib/readiness/official-truth-content-identity.ts`
- `lib/readiness/official-truth-source-catalog-server.ts`
- `lib/readiness/official-truth-govuk-content-api-identity-profile.ts`
- `supabase/migrations/20261004010705_official_truth_content_identity_2.sql`

## Allowed material files

Exactly five docs files may differ from main:

1. this immutable task seed;
2. `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_2026-10-04.md`;
3. `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_REPORT_2026-10-04.md`;
4. `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_HANDOFF_2026-10-04.md`;
5. `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_SELF_REVIEW_2026-10-04.md`.

No code, test, config, migration or generated-type edit.

## Known architecture constraints to re-prove

### Authority/domain source

Current source registry:
- sourceId grammar: `^[a-z][a-z0-9_-]{1,63}$`;
- source class must be `official_authority`;
- authority name required;
- domain registration is exact authority trust;
- overlapping/equal parent-child domains across sourceIds are forbidden;
- one registered domain is therefore shared by all reviewed content items hosted under that source.

### Content identity

Current content identity:
- local id grammar: `^[a-z][a-z0-9_-]{1,63}$`;
- external id namespace/value are separate;
- ContentItemRef = `(sourceId, contentItemId)`;
- representation id is separate;
- current initial item/representation version must be 1;
- exact URL ownership is reserved;
- profile id/version must exist in the code-owned profile registry for a normal live graph read.

### Critical current registry ordering constraint

The implemented profile:

`govuk-eta-national-list-content-api-en`, version 1

exists in code but is **not** in:

`OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY`.

Normal live `quellenKatalogLesen()` rebuilds the graph using the production profile registry. Therefore:

- a source-only catalog row can remain readable with an empty profile registry;
- a content representation referencing the new profile cannot become a valid normal live graph while that profile is unavailable;
- registering the content row first would intentionally make live catalog reconstruction fail closed with `profile_unavailable`.

The audit must independently verify this and define a safe order.

## Official evidence for source semantics

Use official GOV.UK / UK government primary material to prove or reject the source-level identity.

The audit must decide whether this candidate source is correct:

```json
{
  "source_id": "govuk",
  "source_class": "official_authority",
  "publisher_name": "GOV.UK",
  "authority_name": "UK Government",
  "domains": ["www.gov.uk"]
}
```

Questions that must be answered:

1. Is `govuk` the correct authority/domain trust identity rather than `home-office`?
2. Does official evidence support `GOV.UK` as the publishing platform/source and `UK Government` as the authority-level label?
3. Is exact domain `www.gov.uk` preferable to broader `gov.uk`?
4. Would using `home-office` as sourceId incorrectly monopolize the shared GOV.UK domain and prevent later other-department content?
5. Does `www.gov.uk` exact authority trust remain sufficiently narrow while allowing the reviewed Content API URL?
6. Are any additional domains required for the first representation? If not, they must not be registered speculatively.

Do not rely on blogs or general web knowledge.

If the candidate source metadata cannot be cleanly supported, classify BLOCKED rather than inventing names.

## Candidate local identity ids

Audit these proposed local ids:

- sourceId: `govuk`
- contentItemId: `eta-national-list`
- representationId: `content-api-en`
- identityProfileId: `govuk-eta-national-list-content-api-en`
- identityProfileVersion: 1

Requirements:
- all ids fit canonical grammar;
- ids describe Jetnity-local identity, not mutable GOV.UK title/date;
- future Appendix ETA can coexist as another contentItemId under the same sourceId;
- future HTML can coexist as another representationId of the same ContentItemRef;
- no id contains citizenship or legal outcome;
- no id depends on current content hash or timestamp.

If a different id is safer, select one canonical replacement and justify it.

## Exact source registration payload

Produce the exact future v2 payload for source registration:

```json
{
  "operation": "register_source",
  "source": {
    "source_id": "...",
    "source_class": "official_authority",
    "publisher_name": "...",
    "authority_name": "...",
    "domains": ["..."]
  }
}
```

Audit against:
- TypeScript `quelleRegistrieren`;
- SQL v2 RPC validation;
- domain overlap rules;
- exact duplicate idempotence;
- conflicting duplicate behavior.

State whether future execution should use the existing `quelleRegistrieren` gateway or direct RPC. Prefer the existing validated gateway unless a concrete blocker exists.

## Exact content-item registration payload

Produce the exact future v2 `register_content_item` payload.

Candidate item values:

- source_id: selected sourceId;
- content_item_id: selected contentItemId;
- external_id_namespace: `govuk-content-id`;
- external_content_id: `2b25b3d4-4eaa-4859-a34e-c7869c114c15`;
- content_item_version: 1;
- current: true;
- expected_publisher_ids:
  `["06056197-bc69-4147-aa28-070bca132178"]`;
- expected_authority_ids:
  `["06056197-bc69-4147-aa28-070bca132178"]`.

Candidate representation:

- representation_id: selected representationId;
- representation_version: 1;
- current: true;
- request_urls:
  `["https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list"]`;
- expected_final_url: same URL;
- expected_media_type: `application/json`;
- identity_profile_id: `govuk-eta-national-list-content-api-en`;
- identity_profile_version: 1;
- expected_locale: `en`;
- expected_schema: `manual_section`.

Audit every field against:
- current R1 parser grammar;
- S1 SQL RPC validation;
- exact URL authorization;
- external identity uniqueness;
- URL reservation uniqueness;
- initial-version/current constraints;
- publisher/authority pin constraints;
- duplicate/idempotent behavior.

## Registration gateway gap

Current TypeScript source-catalog gateway exports a strict `quelleRegistrieren` helper for `register_source`.

The audit must determine whether there is currently a strict exported TypeScript helper for `register_content_item`.

If none exists:
- do **not** recommend raw ad-hoc RPC from UI/chat as the normal registration path;
- decide whether the smallest safe next code slice must add a typed strict `contentItemRegistrieren`/equivalent gateway with pre-validation, exact result parsing and injected-transport tests;
- specify exact ownership/tests;
- no implementation in this audit.

## Profile registry activation ordering

Audit these possible orders and choose exactly one:

### Order A
1. activate the proven profile in the code-owned production registry;
2. merge/post-merge verify;
3. register GOV.UK source in Development;
4. readback;
5. register National List content item/representation in Development;
6. live v2 catalog readback + verifier smoke.

### Order B
1. register source in Development;
2. activate profile in code;
3. register item.

### Order C
1. register source + item before profile activation.

Order C is presumed unsafe because normal live graph reconstruction should fail `profile_unavailable`; independently confirm.

The selected order must minimize:
- unreadable intermediate catalog states;
- domain trust without usable content identity;
- Production behavior changes;
- rollback complexity.

Remember: adding the profile to the code registry changes web runtime code in Production, but Production Official Truth DB/RPCs are absent, so it must remain fail-closed. The audit must prove or reject that assumption from current R2 behavior.

## Development-only registration safety

Determine whether a later Development registration can be authorized safely.

Required preconditions:
- Development migration history unchanged and exact S1 applied;
- `20261002154952` remains intentionally unapplied;
- current catalog/data rows still empty before first registration;
- Production v2 objects absent;
- mode NORMAL;
- no overlapping writer;
- exact main/profile-activation head known.

Required postconditions after future source registration:
- v2 catalog read succeeds;
- one source, zero content items;
- domain resolution maps exact API URL to selected source;
- no content representation is eligible yet.

Required postconditions after future item registration:
- one source;
- one content item/version;
- one representation/version;
- exact URL reservation(s);
- catalog reconstructs with the activated code-owned profile;
- exact URL resolves one current representation;
- sibling Appendix ETA URL remains unregistered;
- all Evidence/Rule tables remain empty;
- no source/item is written to Production.

## Rollback and forward-only reality

There is no casual delete/unregister path in the current v2 catalog contract.

The audit must state:
- registrations should be treated as forward-only authoritative catalog writes;
- an error requires a separately designed forward correction/retirement migration or operation;
- therefore payloads must be independently reviewed before apply;
- source-only intermediate registration is not automatically rolled back by later content failure;
- idempotent replay is allowed only for exact identical payload.

Do not propose direct DELETE/TRUNCATE as rollback.

## Independent post-apply verification requirement

Based on the prior Development apply governance finding, the future registration action must include:

- Product-Owner authorization for the Development write;
- Technical Lead executor;
- independent read-only verifier after each write step, separate from the executor where practical;
- GitHub apply/registration log containing exact payload hash/redacted-safe payload, response/outcome and readbacks;
- no Production access except read-only absence verification.

This audit must define the exact verification checklist but perform no write.

## Profile activation decision

The audit must decide whether the **next code slice** should:

- add exactly `GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE` to the production registry;
- add/retain tests proving only that one profile is active/current;
- prove Production with missing v2 DB stays fail-closed;
- optionally add the missing strict content-item registration gateway if needed.

Or whether those should be two separate slices.

Prefer the smallest independently reviewable sequence; do not combine unrelated activation and DB write.

## No legal extraction conclusion

Even after future identity registration:

- extractor registry remains empty;
- composition policy remains empty;
- region pin remains empty;
- no trusted legal fact exists yet;
- F8 remains OPEN.

Identity registration is not legal-rule extraction.

## Required adversarial registration plan cases

Explicitly cover:

1. sourceId `home-office` + `www.gov.uk` and why it is accepted/rejected;
2. sourceId `govuk` + `www.gov.uk`;
3. overbroad domain `gov.uk`;
4. extra speculative publishing domains;
5. conflicting same sourceId metadata;
6. second source claiming `www.gov.uk`;
7. same external GOV.UK content_id under second local contentItemId;
8. same exact API URL under second item;
9. Appendix ETA content_id with National List local id;
10. Appendix ETA URL registered as National List representation;
11. profile id absent from code registry;
12. wrong profile version;
13. source only, no item;
14. item registration before source;
15. item registration before profile activation;
16. exact duplicate source replay;
17. exact duplicate item replay;
18. changed payload replay;
19. Production DB still absent during profile-code activation;
20. future second Home Office/GOV.UK content item on same source.

## Required classification

Exactly one:

### `GOVUK_NATIONAL_LIST_REGISTRATION_PLAN_READY`

Only if:
- exact source identity is justified;
- exact local ids are selected;
- exact source and content payloads are valid;
- safe profile-activation/Development-write ordering is defined;
- no hidden gateway/rollback ambiguity remains;
- next bounded slices are clear.

### `GOVUK_NATIONAL_LIST_REGISTRATION_PLAN_BLOCKED`

If any material ambiguity remains.

Do not weaken authority/domain or content identity constraints to force READY.

## Required outputs

Create only:
- `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_GOVUK_NATIONAL_LIST_REGISTRATION_AUDIT_1_SELF_REVIEW_2026-10-04.md`

Together with immutable task seed: exactly 5 changed files.

Report:
- exact final head/model;
- official URLs used;
- live read-only Development/Production observations;
- selected source/local ids;
- exact JSON payloads;
- activation/registration sequence;
- gateway decision;
- rollback/forward-correction decision;
- Product-Owner/independent-verifier gates;
- classification;
- smallest next slice(s).

## Validation before STOP

- re-fetch main/mode/#751/#748;
- confirm no writer collision;
- exactly 5 docs files;
- task seed byte-identical;
- no code/test/migration/config change;
- `git diff --check`;
- operating-mode guard;
- no DB mutation;
- no registry activation;
- no source/content registration;
- no extractor/policy/pin/F8;
- exact final head.

Remain Draft.
Do not Ready.
Do not merge.
Do not start profile activation or Development registration.

STOP for independent Technical-Lead exact-head review.
