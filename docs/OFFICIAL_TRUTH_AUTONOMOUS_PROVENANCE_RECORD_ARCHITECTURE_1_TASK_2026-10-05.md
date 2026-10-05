# Official Truth autonomous provenance record architecture 1 — Task

Date: 5 October 2026
Issue: #854
Status: **BINDING / DOCS-ONLY ARCHITECTURE / PRE-F8 / NO PERSISTENCE / NO RETENTION DECISION / NO DB / NO RULE ACCEPTANCE**

## 1. Baseline

Repository: `Jetnity/jetnity`
Baseline: `main@2f27956cc9fd4289d30f258a5ee8eeaaa60aafec`
Machine mode at dispatch: `NORMAL`

Binding current state:
- B01 Account OfficialEvaluation wiring is merged and post-merge verified.
- Development Official Truth v2 hardening/registration foundation exists.
- Development accepted Evidence rows remain 0; Rule rows remain 0.
- Production Official Truth v2 remains absent.
- Production extractor registry remains empty.
- F8 remains OPEN.
- #851 / #853 are delivered docs-only slices under TL CI gating and are strictly separate from this work.

The binding sequence in #751 still names:
15. **Autonomous provenance record — unstarted**
16. **F8 acceptance composition — open / not started**

This task addresses only item 15 at architecture level.

## 2. Writer

Logical writer:
**Jetnity Official Truth autonomous provenance record architecture 1**

Generation: **1**

Execution:
**Codex Desktop — new session**

Required model:
`gpt-6-astra` / `xhigh`.

Standing #751 autonomous execution directive applies through normal validation, commit and push.

Keep PR Draft.
Never Ready.
Never merge.
No automatic follow-up slice.

## 3. Goal

Specify the smallest source-neutral, immutable, non-personal provenance envelope that a future autonomous Official Truth acceptance path must produce **before** any persistence or Rule acceptance can be considered.

The record must answer, without relying on logs or model prose:

- What exact candidate fact was produced?
- What exact canonical rule scope/cell was being evaluated?
- Which exact accepted Evidence/support versions were re-proven?
- Which exact official content items/representations/profile versions were bound?
- Which exact fresh source-content hashes were observed in the same trusted request?
- Which extractor id/version/schema family produced the fact?
- Which composition policy id/version ran, if any?
- Which applicability/fact schema pins were in force?
- Which review/proof identity bound the request?
- Which server-owned reference/retrieval times matter?
- What exact deterministic result/hash proves that the record refers to the same candidate that later acceptance sees?

The design must not contain traveller/person data.

## 4. Required live reads

At minimum read current live implementations/docs for:

- `lib/readiness/official-truth-same-request-proof-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-composition-server.ts` or current equivalent if present
- `lib/readiness/rule-claims.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/official-truth-content-identity.ts`
- `lib/readiness/official-truth-store-server.ts`
- current review packet / proof witness implementation
- #772/#774/#777/#781/#787/#799/#801/#803 architecture/report material
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
- #751 current binding sequence
- #294 only as product truth boundary
- #741 only as future F8 goal/gate context

Live code wins over historical prose.

## 5. Trust and authority boundary

The provenance record must be created only from trusted server-held material already present in the same autonomous request.

It must never accept authority from caller-supplied:

- sourceSnapshot
- sourceContentHash
- retrievedAt
- source/content/profile ids
- Evidence ids
- Rule scope
- extractor id/version
- policy id/version
- review packet/proof id
- clock/reference time
- candidate fact
- model/plugin output
- provenance object itself

The record is a **receipt**, not a bearer capability.

Possessing or replaying it must never authorize:
- extraction;
- Evidence acceptance;
- Rule acceptance;
- F8;
- store writes;
- provider activation.

## 6. Minimum semantic fields to decide

Independently determine the exact minimum record. Evaluate at least:

### A. Record identity/version
- record schema/version;
- deterministic record hash/fingerprint;
- no mutable timestamp-only identity;
- whether a unique local record id is necessary or optional.

### B. Candidate binding
- canonical candidate fact hash;
- canonical RuleScope key / decoded scope identity;
- requirement/fact kind;
- schema family and applicability/fact schema pins;
- exact invariant proving acceptance receives the same candidate object/value.

### C. Extractor binding
- extractor id;
- extractor version;
- source family id;
- schema family/output contract version;
- exact selected registry key;
- whether build/commit SHA belongs in the record or is only operational metadata.

### D. Composition binding
When composition ran:
- policy id/version;
- exact assignment/policy registry identity;
- exact support item set;
- composition seal/result identity;
- provenance for every required legal field/branch/atom.

When composition did not run:
- explicit `policy=null`, not omission.

Do not conflate explicit-primary with composition.

### E. Support/evidence binding
- accepted Evidence version ids;
- source id;
- content item id/version;
- representation id/version;
- content identity verifier/profile id/version;
- canonical request/final URL where already part of reviewed identity;
- source content hash that was re-proven fresh;
- evidence quality;
- freshness/reference-time relationship.

Determine what is redundant because Evidence/version rows already bind it versus what must still be copied into an immutable receipt to make later audit possible without relying on mutable joins.

### F. Same-request proof identity
- reviewPacketKey or equivalent proof identity;
- F7 witness fields if applicable;
- serverReferenceTime;
- fresh retrieval completion times;
- proof-registry/catalog snapshot identity where available;
- exact ruleScopeKey rebind result.

No raw page body or raw review packet.

### G. Outcome and failure semantics
Define whether the architecture creates provenance only for successful trusted fact production or also for blocked/failed attempts.

If failures are retained, they must not silently become durable personal/security logs and must remain a separately gated observability concern.

Do not smuggle error logging/retention into this architecture.

## 7. Privacy / data minimisation

The autonomous provenance record is global Official Truth provenance, not traveller history.

Must exclude:
- user id
- traveller id
- trip id
- document number
- passport number
- MRZ
- birth date
- personal residence history
- request IP
- cookies/session ids
- prompts/model conversations
- free-text traveller answers
- raw government response bodies
- screenshots
- secrets/tokens

If the canonical RuleScope contains any personal/request-specific values not suitable for global persistence, specify the safe non-personal projection or prove why the canonical stored Rule scope remains global regulatory knowledge.

No hash of PII merely to hide it.

## 8. Retention boundary

This architecture MUST NOT choose or implement a persistence retention policy.

It must clearly separate:

1. **semantic provenance record contract** — this slice;
2. **persistence schema** — future separately reviewed design;
3. **retention/lifecycle policy** — explicit separate Product-Owner/security/privacy gate;
4. **Production apply** — separate Product-Owner gate.

Do not propose “store forever” or an arbitrary number of days.

Do not create a migration.

## 9. F8 boundary

The record architecture must be sufficient for a later F8 design to verify:

- fact came from a trusted deterministic path;
- exact extractor/policy versions;
- exact accepted supports;
- same-request fresh retrieval;
- source/content identity match;
- exact canonical candidate;
- no caller/model authority.

But this task must not design the autonomous approval policy itself beyond naming the provenance inputs F8 would require.

No acceptance constructor changes.

`regelKandidatAkzeptieren` remains the sole canonical constructor.

## 10. Record immutability and replay

Specify:
- canonical serialization/fingerprint rules;
- ordering rules;
- duplicate handling;
- version changes;
- whether records are append-only if ever persisted;
- whether record mutation is forbidden;
- how a later corrected Rule links to superseding provenance without editing history;
- replay semantics: a historical provenance record cannot be replayed as current freshness authority.

Freshness must be re-proven in a new trusted request.

## 11. Decision

End with exactly one:

### `AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_READY_FOR_PERSISTENCE_DESIGN`

Only if the semantic record is fully bounded, non-personal, source-neutral and cannot act as an authority token.

OR:

### `AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_NOT_READY`

List exact remaining design/evidence gaps.

READY authorizes only later TL consideration of a persistence/retention architecture slice.
It does not authorize persistence, retention policy, F8 or Rule acceptance.

## 12. Required architecture output

Specify at minimum:

- exact proposed record type/fields;
- required vs nullable fields;
- canonical serialization;
- fingerprint;
- invariants;
- trust-source table per field;
- explicit-primary example;
- composed example;
- adversarial replay/forgery examples;
- privacy classification per field;
- failure/blocked-attempt decision;
- compatibility/versioning;
- downstream interfaces;
- exact later implementation/persistence candidate paths, clearly non-authoritative;
- exact unresolved gates.

All new names are **PROPOSAL / NOT IMPLEMENTED**.

## 13. Parallel collision guard

Active delivered/gated PRs:
- #851 applicability schema architecture
- #853 JP identity/retrieval audit

This slice owns only its own docs namespace.

Before work and before push:
- live-read main/mode/#751/#748/#854/PR;
- inspect #851/#853 Changed Files;
- prove zero path overlap;
- STOP on overlap.

Do not sync or edit #851/#853.

## 14. Hard prohibitions

Absolutely no:
- runtime/code/test changes
- migration
- Supabase/DB access or mutation
- persistence schema
- retention policy decision
- source/content/profile registration
- extractor registration/activation
- composition policy activation
- accepted Evidence
- Rule acceptance
- F8
- provider activation
- Production
- CH import/CH-11
- Trip Workspace/B01
- paid/provider/model API integration
- Ready/Merge
- follow-up slice

## 15. Allowed files

Immutable TASK:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_TASK_2026-10-05.md`

Delivery only:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_REPORT_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_HANDOFF_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_SELF_REVIEW_2026-10-05.md`

No other file.

## 16. Validation / STOP

Before push:
- TASK blob unchanged;
- exact five-file diff;
- merge-base/ahead/behind;
- zero overlap with #851/#853;
- `git diff --check`;
- operating-mode gate;
- exact session/model/effort.

Commit and push autonomously.

Read exact-head CI/Vercel if available. If GitHub hosted-runner outage still leaves CI queued/cancelled, report that honestly; do not invent PASS and do not rerun indefinitely.

Then STOP for independent Technical-Lead exact-head review.

Do not Ready.
Do not merge.
Do not start persistence/F8/follow-up.
