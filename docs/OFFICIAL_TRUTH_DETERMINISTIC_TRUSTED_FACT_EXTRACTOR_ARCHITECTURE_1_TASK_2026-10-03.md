# Official Truth Deterministic Trusted-Fact Extractor Architecture 1 — Task

Date: 3 October 2026
Issue: #773
Branch: `docs/official-truth-deterministic-trusted-fact-extractor-architecture-1`
Baseline: `main@a7ad77743327c01821cf2532ca253a3220c857e8`
Logical agent: **Jetnity Official Truth deterministic trusted-fact extractor architecture 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Design, docs-only, the missing deterministic non-model source contract for future autonomous `trustedRuleFact`.

Merged audit #771 proved that none of the eight current Rule fact kinds is autonomously derivable today. This architecture must define how Jetnity can add such derivation safely without converting model/research prose into Official Truth.

Do not implement an extractor.

## 2. Binding reads

Read live main first, then at minimum:

1. `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_REPORT_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_REPORT_2026-10-03.md`
3. `docs/JETNITY_ENTRY_REQUIREMENTS_OFFICIAL_TRUTH_AUTONOMY_DIRECTIVE_2026-10-02.md`
4. `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
5. `lib/readiness/rule-claims.ts`
6. `lib/readiness/evidence.ts`
7. `lib/readiness/official-truth-rule-review-packet.ts`
8. `lib/readiness/official-truth-server-held-source-registry.ts`
9. `lib/readiness/official-truth-store-server.ts`
10. Issue #294 comments `5935531376` and `5935581800` for CH-01..CH-10 continuity.

Live evidence wins.

## 3. Permanent rule

Model/plugin/suggestion/research output alone may never become `trustedRuleFact`.

The architecture must define a deterministic path where every field of a complete `RegelFakt` is derived from **server-reproved official material or an explicitly versioned deterministic composition policy**.

No legal default.
No “model agrees”.
No proposal copy.
No inference from missing text.
Unknown/missing/ambiguous/conflicting structure = block/research gap, never `not_required`.

## 4. Extractor registry contract

Design an explicit extractor registry/contract, including at minimum:

- stable `extractorId`;
- explicit version;
- supported `RegelFaktArt`;
- allowed official `sourceId` / source family;
- allowed URL/path/content-type/schema family where needed;
- exact input shape from the future same-request proof graph;
- exact output: complete structured `RegelFakt` or fail-closed reason;
- no access to Rule Candidate `proposal`, suggestion/model/plugin output, or caller trusted fact;
- deterministic/pure behavior;
- no network call of its own;
- bounded parsing;
- no PII;
- source drift detection / schema mismatch behavior;
- field-level support/provenance rules for multi-source composition.

The extractor output itself is not acceptance. F8 would still call the canonical `regelKandidatAkzeptieren` later.

## 5. Which official material is eligible

Classify source representations suitable for autonomous extraction, for example:

- stable official JSON/API fields;
- official machine-readable structured data;
- stable source-specific HTML tables/labelled fields with an allowlisted parser;
- other explicitly versioned source-specific structures.

Address arbitrary prose explicitly:
- a general-purpose regex/LLM reading arbitrary government prose must **not** be considered a deterministic trusted-fact extractor;
- if narrowly source-specific prose parsing could ever qualify, define the strict conditions and drift guards required, or classify it as human-review only.

## 6. Source drift

Define fail-closed behavior when:
- expected schema/selector/key disappears;
- row/heading meaning changes;
- duplicate/conflicting values appear;
- units/qualifiers become unknown;
- source moves domains;
- source is stale;
- source snapshot hash changes but parser no longer recognizes the exact structure.

Do not infer through drift. Route to research/review.

## 7. All eight fact kinds

For each current fact kind:
- `requirement_effect`
- `visa_options`
- `stay_limit`
- `passport_validity`
- `blank_passport_pages`
- `transit_conditions`
- `official_actions`
- `temporal_rule`

Define:
- the complete target fields;
- the type of deterministic official source representation required;
- whether one source can prove it or a versioned composition policy is required;
- what must block;
- what must never be defaulted.

Do not choose real legal values.

## 8. First implementation sequence

Determine the smallest safe sequence after this architecture.

Important:
- `blank_passport_pages` is the smallest fact schema but that does **not** automatically make it the best first extractor if official sources are only prose.
- Prefer the first fact/source family for which actual official material is structurally deterministic.
- If no concrete source family can be proven from repository evidence, recommend:
  1. extractor framework/registry runtime first;
  2. then one separately researched/verified source-specific extractor.
- Do not invent a source family merely to create a first implementation.

Classify the next runtime step precisely.

## 9. Accepted-claim provenance

Analyze whether autonomous accepted claims need durable binding to:
- extractor id/version;
- source/support version ids;
- reviewPacketKey or equivalent proof identity;
- deterministic policy version.

Current claim/store schema may not carry all of these.

Do **not** add a migration. State whether:
- existing Evidence support ids + code version are sufficient;
- a later audit/provenance record is required;
- a schema/retention change would be a separate Product-Owner/security gate.

Do not silently require a Production schema change in this docs slice.

## 10. CH-01..CH-10 reuse

The 64 Swiss-passport destinations are valuable Candidate Evidence and source/provenance work. The architecture must preserve them.

Define the correct reuse path:
- do not re-research all 64 from scratch;
- normalize the existing batches;
- retain their official URLs, scopes, gaps/conflicts/stale flags;
- re-fetch/revalidate official sources where exact current snapshot/structure is needed;
- pass deterministic-source cases through source-specific extractors once available;
- pass non-deterministic/prose-only cases through the human/trusted review path;
- only accepted Evidence/Rule Claims become reusable Official Truth;
- never treat a research-chat conclusion itself as autonomous trusted fact.

CH-11 remains not automatically planned.

## 11. Security / privacy

- no passport numbers/MRZ/scans/biometrics/health records;
- global Official Truth remains non-personal regulatory knowledge;
- one credential option = one regulatory cell;
- no source/provider licensing shortcut;
- provider truth remains separate from first-party official source truth.

## 12. Allowed files

Create only:

- `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_SELF_REVIEW_2026-10-03.md`

Do not edit this task file.
Do not edit runtime/test/migration/global-current-state files.

## 13. Hard boundaries

No runtime/test change.
No migration/Supabase mutation.
No Auth/AAL/role/RLS change.
No route/UI/store.
No provider/model/plugin/live API call.
No secrets/cost.
No #626 implementation.
No F8 implementation.
No CH batch import.
No follow-up slice.
Stay Draft.
Do not Ready or merge.

## 14. Validation / STOP

- fetch live main;
- finish 0 behind;
- inspect sufficient exact code/source continuity evidence;
- `git diff --check`;
- operating-mode guard;
- only the four architecture output docs + TL-owned task seed may differ;
- push exact review head;
- report session id and `originalModelName`;
- STOP for independent TL review.