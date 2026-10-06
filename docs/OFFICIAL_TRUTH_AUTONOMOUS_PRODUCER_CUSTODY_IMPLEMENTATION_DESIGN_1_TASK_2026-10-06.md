# Official Truth autonomous producer and metadata-custody implementation design 1 — Task

Date: 6 October 2026
Issue: #862
Repository: Jetnity/jetnity
Baseline: `main@9adfc04ffe90693dedc059f07a396751a0625157`
Branch: `docs/official-truth-autonomous-producer-custody-design-1`
Machine mode at dispatch: `NORMAL`

Logical agent: **Jetnity Official Truth autonomous producer custody implementation design 1**
Generation: **1**

## 1. Objective

Produce one independently reviewable **docs-only implementation design** for the smallest private server-side producer/custody layer that can later emit the already-accepted autonomous provenance objects from **actual trusted same-request custody**.

This task does not implement that producer. It closes the design seam between the merged trust/custody architecture and the merged provenance persistence architecture so a later runtime slice can be bounded precisely.

The design must preserve all existing fail-closed Official Truth invariants and must not move F8 forward by assertion.

## 2. Binding inputs — read before designing

Live/repository truth wins over this task if a conflict is found. Start by re-reading:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `.jetnity/operating-mode.json`
4. Issue #751 current top/current-writer section
5. Issue #741 current autonomous Official Truth directive/status
6. Issue #862
7. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md` (#855)
8. `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA_2_DORMANT_RUNTIME_FOUNDATION_1_2026-10-06.md` and relevant merged #857 runtime/types if that filename/path differs on live main
9. `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_2026-10-06.md` (#859)
10. `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_2026-10-06.md` (#861)
11. current implementations involved in source catalog, content identity, Evidence acceptance/reproof, review packet v3, same-request proof/extraction, extractor/policy selection and Official Truth store boundaries.

Do not infer a contract from filenames alone. Read the actual current code.

## 3. Product/enabler justification

Jetnity is not being built as a generic planner. This slice is a trust-enabler for the Travel Operating System: Entry Requirements must be traceable to exact official-source custody and deterministic provenance instead of model output, caller metadata or mutable current state.

It directly supports:
- **Entscheiden** — recommendations can be tied to proven sources and exact rule context.
- **Reisebereit sein** — Entry/Transit readiness must remain evidence-backed and fail closed.
- Multi-Citizenship / Entry Decision capability.
- Future autonomous Official Truth under #741 without weakening the trust boundary.

This is not a competitor-parity feature and does not alter the binding build order.

## 4. Required design outputs

Design the exact future private producer/custody flow, including all of the following.

### A. Trusted object ownership and call graph

Define which server-owned component creates or resolves each authoritative object and how it flows through one invocation:

- independently admitted global regulatory cell;
- original server retrieval observation;
- validity derivation and accepted-origin Evidence custody;
- exact eligible Evidence version resolution;
- code-owned exact required-support selection;
- selected-support manifest;
- representation/global/non-personal qualification;
- frozen catalog/profile/registry/definition/schema/proof/freshness pins;
- safe proposal-null review material and exact existing v3 `reviewPacketKey` construction;
- same-request proof/extraction inputs and outputs;
- initial request URLs and final URL identity;
- composition phase-A / phase-B metadata where applicable;
- actual deterministic fact/seal;
- unchanged #855 `AutonomousProvenanceReceiptV1`;
- separate immutable #861 custody dependency binding.

Show exact ownership boundaries and a sequence/call graph. A caller-supplied ID, version, pin, hash, review key or DTO shape must never become authority merely because it resolves.

### B. Candidate runtime seams

Specify narrowly bounded candidate modules/interfaces/types for a later implementation. Reconcile them against the candidate paths already proposed by #861/#859 rather than inventing duplicate worlds.

At minimum assess these proposed seams:
- `official-truth-global-cell-admission-server.ts`
- `official-truth-evidence-metadata-custody-server.ts`
- `official-truth-support-selection-server.ts`
- `official-truth-global-representation-qualification.ts`
- `official-truth-autonomous-review-material-server.ts`
- existing same-request proof/extraction servers
- #855 autonomous provenance record producer
- the future #859 persistence adapter boundary

For each seam define:
- trusted inputs;
- untrusted/hint inputs;
- returned value;
- failure vocabulary;
- whether it can perform network/DB/state mutation;
- whether its output is historical identity, live authority, or both;
- which later component is allowed to consume it.

Do not allocate a public/browser endpoint.

### C. Issuance and resolver encapsulation

Define how custody artifacts are issued and later resolved without turning identifiers into bearer capabilities.

The design must prove:
- selection is independently authorized before exact-ID resolution;
- no generic `loadByIdAndTrust()` path exists;
- current/latest registry/catalog rows cannot fill missing historical custody;
- stored accepted-looking Evidence cannot backfill absent original server metadata;
- hash equality cannot establish source/authenticity by itself.

### D. Safe review-packet v3 seam

The current safe autonomous path must create proposal-null review material **from inception** and preserve the exact existing v3 key algorithm.

Design an internal seam that:
- does not accept a prebuilt external review envelope as authority;
- does not sanitize/rewrite a non-null proposal into null;
- does not fabricate historical retrieval/reference times;
- preserves the exact key/preimage contract required by current code;
- makes unsafe reuse structurally difficult.

### E. Complete execution-context capture

Define exactly where the future producer captures facts that cannot be reconstructed later, including:
- actual initial request URLs;
- actual final URL/representation;
- retrieval completion/reference timing;
- selected catalog/profile version;
- extractor/policy selection and registry snapshot;
- composition pre-HTTP/phase-A and result/phase-B identity where relevant;
- exact schema/output/proof/freshness pins;
- support/citation/assignment relationships;
- actual canonical fact and seal.

If current functions discard required context, identify the precise seam that must be widened later. Do not silently recompute from current state.

### F. Receipt + custody binding relationship

The #855 receipt bytes and fingerprint are frozen by accepted architecture.

Design must:
- keep `AutonomousProvenanceReceiptV1` unchanged;
- keep #859 canonical byte/fingerprint semantics unchanged;
- emit #861 custody dependencies as a separate immutable historical binding/artifact;
- define equality/cross-checks between receipt fields and custody binding;
- state what must happen atomically in memory before any future persistence call;
- make clear that persistence success grants no Evidence/Rule/F8 authority.

If a safe implementation truly requires a receipt semantic change, classify the design **NOT READY** and explain the versioning requirement. Do not modify v1 by convenience.

### G. Failure model

Produce a closed deterministic failure matrix covering at least:
- global cell missing/ineligible/scope mismatch;
- original custody missing;
- accepted-origin mismatch;
- Evidence identity/version drift;
- duplicate/ambiguous support selection;
- caller support-set mismatch;
- representation not globally/non-personally qualified;
- unsafe/non-null review proposal;
- v3 identity drift;
- catalog/profile/registry/definition pin missing or inconsistent;
- source changed/fresh reproof failed;
- composition metadata incomplete;
- schema/applicability incompatibility;
- required execution context discarded/unavailable;
- privacy rejection;
- receipt projection mismatch;
- custody dependency mismatch.

No failure may degrade to “best effort” Official Truth.

### H. Privacy/minimization

Keep the producer global/non-personal. Explicitly reject:
- traveller/user/trip IDs;
- passport/document numbers;
- MRZ;
- birth date;
- residence history tied to a person;
- request/session identifiers;
- IP/cookies;
- prompts/model conversations;
- secrets/tokens;
- raw personal preimages or hashes of personal/model material.

Do not use hashing as a privacy laundering mechanism.

### I. Adversarial/conformance design

Specify tests a later runtime implementation must satisfy, including:
- forged correct-looking DTO;
- valid ID supplied by untrusted caller;
- current row equal to missing historical object;
- same hash under different source/representation context;
- stale/expired Evidence;
- content change between original and fresh proof;
- non-null model proposal;
- duplicate support;
- foreign citation;
- missing initial URL;
- incomplete composition phase data;
- unknown schema/artifact version;
- applicability schema-1/schema-2 drift;
- perfect persisted receipt with missing custody;
- retry/replay of old receipt or review key;
- dual-citizenship/traveller-derived scope accidentally entering the global producer.

### J. Implementation slicing proposal

End with the **smallest safe later runtime slice sequence**, but do not start it.

The proposed sequence must distinguish:
1. pure producer/custody runtime foundation;
2. safe same-request integration/context capture;
3. provenance receipt + custody-binding emission;
4. persistence implementation, only after its own #859 design/lifecycle prerequisites;
5. F8/Rule acceptance, separately gated.

If any earlier step actually requires a Product-Owner gate, identify it explicitly.

## 5. Hard non-scope

Do **not**:
- implement runtime code;
- change tests except no-op/mechanical docs checks;
- add SQL, migrations, tables, RPCs, triggers, policies, grants or RLS;
- call or mutate Supabase;
- apply Development or Production changes;
- choose retention duration or deletion policy;
- accept Evidence or Rule Claims;
- design or implement F8 acceptance authority beyond preserving its boundary;
- activate/register source/profile/extractor/policy;
- use paid/provider/model/live external calls;
- create/rotate/read secrets;
- alter Auth/AAL/roles/capabilities;
- modify public UI, Trip Workspace or provider flows;
- modify #855 receipt semantics/bytes;
- modify global continuity files;
- start a follow-up slice.

## 6. Exact allowed files

The seeded TASK is immutable after dispatch:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_1_TASK_2026-10-06.md`

Agent may create only:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_1_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_1_SELF_REVIEW_2026-10-06.md`

No other file changes.

## 7. Required delivery evidence

Before STOP:
- re-fetch/fetch `origin/main` and report exact main;
- report branch exact head;
- report merge-base / ahead / behind;
- report exact changed-file list;
- prove TASK blob unchanged;
- run `git diff --check`;
- run relevant repository operating-mode/document hygiene checks if available;
- report CI/Preview truth only if actually available; never call queued/pending “PASS”;
- report exact available agent/session/model evidence;
- write REPORT, HANDOFF and SELF_REVIEW;
- identify P0/P1/P2/P3 findings if any;
- state clearly whether classification is:
  - `AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_READY`, or
  - `AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_NOT_READY`.

## 8. Governance / STOP

- Stay Draft.
- Do not mark Ready.
- Do not merge.
- Agent self-review is not Technical-Lead PASS.
- Do not start a follow-up slice.
- Any discovered special Product-Owner gate must be reported, not crossed.
- STOP after committing and pushing the authorized branch and posting exact delivery evidence for independent Technical-Lead review.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
