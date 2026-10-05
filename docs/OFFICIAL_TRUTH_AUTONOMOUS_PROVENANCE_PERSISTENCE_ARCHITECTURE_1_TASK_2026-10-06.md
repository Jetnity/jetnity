# Official Truth autonomous provenance persistence architecture 1 — Task

Date: 6 October 2026
Issue: #858
Status: **BINDING / DOCS-ONLY PERSISTENCE ARCHITECTURE / NO SQL / NO MIGRATION / NO RETENTION POLICY / NO DB WRITE / NO F8**

## 1. Baseline

Repository: `Jetnity/jetnity`
Baseline: `main@7fb95414db6b7e4de12bea0df29b2c771081b9d4`
Machine mode at dispatch: `NORMAL`

Merged prerequisite:
- #855 — `AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_READY_FOR_PERSISTENCE_DESIGN`

Parallel active slice:
- #856 / Draft PR #857 — Applicability Schema 2 dormant runtime foundation 1
- #857 owns only its named runtime/test/docs paths
- this persistence writer is docs-only and owns only its own five docs

Zero path overlap is mandatory.

## 2. Writer

Logical writer:
**Jetnity Official Truth autonomous provenance persistence architecture 1**

Generation: **1**

Execution:
**Codex Desktop — new session**

Required model:
`gpt-6-astra` / `xhigh`.

Standing #751 autonomous execution directive applies through commit + push.

Keep Draft.
Never Ready or merge.
STOP after delivery.
No automatic follow-up slice.

## 3. Binding semantic input

The merged semantic contract is:

`docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md`

Its accepted classification:
`AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_READY_FOR_PERSISTENCE_DESIGN`

This persistence design MUST NOT weaken, reinterpret or expand that semantic receipt.

In particular:
- receipt is success-only;
- receipt is immutable;
- receipt/fingerprint is not authority or a bearer capability;
- traveller-derived/personal scopes are rejected before receipt creation;
- no PII/hash-of-PII is admitted;
- historical receipt cannot establish current freshness;
- retention/lifecycle remains a separate Product-Owner/Security/Privacy gate;
- F8/Rule acceptance remain separate;
- `regelKandidatAkzeptieren` remains canonical and untouched.

If persistence needs a semantic field that #855 did not define, STOP and classify the gap. Do not silently extend the semantic payload.

## 4. Goal

Specify the smallest persistence model that can durably store an already-produced `AutonomousProvenanceReceiptV1` and later verify historical integrity without relying on mutable current application state.

The design must answer:

1. What exactly is the persisted immutable receipt object?
2. What key identifies it?
3. How are canonical bytes preserved so canonical JSON semantics are not changed by database JSON normalization/reordering?
4. How are immutable referenced artifacts/dependencies made resolvable by exact digest/version?
5. Which relationships are copied into the receipt versus resolved through an immutable artifact closure?
6. How is duplicate/idempotent insertion handled?
7. How is mutation prevented?
8. How can historical verification report dependency missing/corrupt without falling back to current/latest state?
9. What is readable by which server roles/classes?
10. How can a later Rule version refer to a provenance receipt without turning the receipt into acceptance authority?
11. What remains intentionally undecided for retention/lifecycle?
12. What exact Product-Owner gate would be required before any real DB apply?

## 5. Required live reads

Read current live implementations/docs at minimum:

- merged #855 semantic architecture + report/handoff
- `lib/readiness/official-truth-store-server.ts`
- relevant Official Truth v2 migrations/schema/RPC architecture docs
- current Evidence/version identity schema
- content identity/catalog/version architecture
- source registry and profile/version architecture
- extractor/policy registry pin architecture
- current RLS/service-role patterns used by Official Truth v2
- current Development/Production truth in #751
- #294 product truth boundary
- #741 only as future F8 context

Do not mutate DB or call Supabase write tools.

Live code/repository truth wins over old docs.

## 6. Persistence model requirements

### A. Receipt row/object

Determine whether the minimal logical persisted receipt should contain at least:

- `recordFingerprint` as immutable semantic key;
- receipt schema/version;
- canonical payload bytes/text exactly matching `ot-provenance-json-v1`;
- optional parsed/index projection only if it cannot become authority;
- insertion/audit metadata only if operational and clearly outside semantic fingerprint;
- no mutable lifecycle/status field that changes receipt meaning.

Decide whether:
- canonical payload should be stored as canonical UTF-8 text/bytes;
- JSONB alone is insufficient because key/order/serialization may not preserve canonical bytes;
- any parsed JSON projection is secondary/non-authoritative.

Do not produce SQL.

### B. Content-addressed immutable artifact closure

#855 requires exact dependency artifacts to remain resolvable by digest without mutable joins.

Design the minimal logical artifact persistence layer.

Each immutable artifact must be identified by a complete immutable key such as:
- artifact semantic id;
- version;
- digest;
- artifact contract/type;
- canonical bytes or exact immutable representation needed for historical verification.

Decide:
- one generic immutable-artifact store vs multiple artifact-specific logical stores;
- how digest collision/mismatch is treated;
- idempotent re-insert of identical bytes;
- rejection of same id/version with different bytes;
- transitive dependency manifest/edges;
- finite closure/bounds;
- no `latest` resolution.

Do not decide retention duration.

### C. Receipt ↔ artifact dependency set

Define the exact relationship between a receipt and its dependency closure.

Requirements:
- deterministic and immutable;
- no mutable foreign-key interpretation through "current" rows;
- historical verifier can distinguish:
  - present + matching;
  - missing;
  - digest mismatch/corrupt;
  - unknown artifact contract/version;
- missing artifact => historical audit incomplete/fail closed;
- never substitute latest/current artifact.

### D. Append-only/idempotency

Specify:
- insert by `recordFingerprint`;
- exact duplicate insert semantics;
- same fingerprint + different canonical bytes = integrity violation;
- no update of semantic payload;
- no mutable superseded flag on prior receipts;
- later corrected fact => new receipt/fingerprint;
- later Rule lifecycle/supersession relation belongs to Rule lifecycle, not receipt mutation.

### E. Later Rule reference boundary

Design only the persistence relationship, not acceptance.

A later accepted Rule version may reference an immutable receipt fingerprint/id.

The persistence architecture must guarantee:
- that reference does not prove acceptance;
- receipt existence does not authorize Rule creation;
- Rule acceptance still needs live trusted execution under separately authorized F8/acceptance logic;
- historical receipt cannot be replayed as freshness.

No F8 policy design.

### F. Access / RLS / service boundary principles

Specify logical access policy only.

Minimum:
- no public/anon direct write;
- no normal authenticated traveller write;
- no client-provided receipt DTO as authority;
- write path only from a separately authorized private server producer after semantic validation;
- historical reads preferably private/admin/server unless a later product requirement authorizes public provenance display;
- no service-role leakage to browser;
- no arbitrary update/delete API in this architecture.

If Development uses service RPCs, document conceptual privilege/RLS requirements without creating them.

### G. Privacy

Persistence must not weaken #855 privacy admission.

No:
- user/traveller/trip ids
- session/request ids
- IP/cookies
- personal document ids
- prompts/model conversations
- raw page bodies
- secrets/tokens
- hash of personal values

If DB operational metadata could become correlating/personal, keep it outside the semantic receipt and flag lifecycle/privacy gate.

### H. Retention boundary

DO NOT decide:
- number of days/years;
- "forever";
- delete/tombstone semantics;
- legal retention basis;
- backup retention;
- archival tier;
- erasure policy.

Instead define which retention/lifecycle questions the separate Product-Owner/Security/Privacy gate must answer before persistence implementation/Production.

Architecture may say "append-only while retained" but not "retain indefinitely".

### I. Development/Production boundary

Design only.

No:
- SQL
- migration
- Development apply
- Production apply
- Supabase mutation
- RPC creation
- table creation

End with explicit future gates:
1. persistence implementation design/SQL slice;
2. retention/lifecycle decision;
3. Development apply/review;
4. F8/acceptance integration;
5. Production Product-Owner approval.

Do not collapse them.

## 7. Storage-shape alternatives

Evaluate at least these alternatives and choose one or explain NOT_READY:

### Option 1
One immutable receipt table/object with canonical bytes + content-addressed artifact store + immutable dependency links.

### Option 2
Fully denormalized receipt containing all artifact bytes.

### Option 3
Receipt row pointing only to current application/catalog rows.

Option 3 should be rejected unless you can prove it meets #855's no-mutable-join requirement.

Assess:
- auditability;
- integrity;
- duplication;
- bounded size;
- migration/versioning;
- failure behavior;
- privacy;
- independence from current state.

Do not optimize prematurely for storage cost.

## 8. Canonical bytes and integrity

Define:
- exact stored canonical payload representation;
- recomputation of `recordFingerprint`;
- read path verifies canonical bytes before parsed projection is trusted;
- reject/flag malformed canonical bytes;
- parsed projection never overrides canonical receipt;
- DB serialization must not redefine canonicalization;
- no signing/HMAC requirement unless separately justified; a digest is identity/integrity, not server authority.

If cryptographic signing is proposed, explain why it is necessary and do not make it a hidden requirement without key-management architecture. Prefer the minimum sufficient design.

## 9. Versioning and migrations

Architecture must specify:
- receipt schema version remains explicit;
- artifact contract versions explicit;
- unknown versions fail closed;
- new schema version creates new parser/reader contract;
- historical records are not rewritten into a new version merely because code changes;
- migrations may add supporting columns/indexes later but may not alter canonical receipt bytes.

No actual migration.

## 10. Historical integrity reader

Design the read-only verification flow conceptually:

1. locate receipt by exact fingerprint;
2. load canonical bytes;
3. verify shape/version/canonicalization;
4. recompute fingerprint;
5. enumerate exact immutable artifact dependency closure;
6. verify artifact IDs/versions/digests/bytes;
7. verify closure/edge integrity;
8. return bounded historical result:
   - valid
   - receipt_corrupt
   - dependency_missing
   - dependency_corrupt
   - unsupported_version

Reader result must mean historical consistency only.

It must not:
- re-run extraction;
- refresh sources;
- accept Evidence;
- accept Rules;
- write DB;
- authorize F8;
- claim current freshness.

## 11. Bounded size / abuse controls

Specify technical upper bounds for:
- receipt canonical bytes;
- number of direct artifact dependencies;
- transitive artifacts;
- dependency edges;
- individual artifact bytes;
- total closure bytes/depth.

Prefer deriving conservative limits from existing #855/schema bounds when possible.

Do not invent enormous/unbounded JSON or recursive graphs.

A future implementation must reject over-limit input before storage.

## 12. Decision

End with exactly one:

### `AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_READY_FOR_IMPLEMENTATION_DESIGN`

Only if:
- immutable canonical receipt persistence is completely specified;
- artifact closure is historically resolvable without mutable joins;
- idempotency/mutation/failure/access/privacy boundaries are closed;
- retention remains correctly separate;
- no DB/F8 authority is implied.

OR:

### `AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_NOT_READY`

List exact unresolved design/evidence gaps.

READY authorizes only later Technical-Lead consideration of a separate persistence implementation/SQL design slice, after the retention/lifecycle gate relationship is re-evaluated.

It does not authorize SQL, migration, Development/Production apply, retention policy, Rule acceptance or F8.

## 13. Required output

Architecture must include:

- exact logical entities;
- required fields/types conceptually;
- authoritative vs secondary/non-authoritative fields;
- primary/unique key strategy;
- canonical bytes strategy;
- artifact store strategy;
- dependency link/closure strategy;
- idempotency rules;
- mutation prohibitions;
- privilege/RLS principles;
- privacy classification;
- historical reader algorithm;
- bounded failure reasons;
- versioning strategy;
- storage alternatives comparison;
- adversarial test matrix;
- future implementation candidate paths/tables/RPCs clearly marked **PROPOSAL / NOT IMPLEMENTED**;
- exact remaining gates.

Do not generate SQL.

## 14. Parallel guard

Active writer:
- #856 / Draft PR #857 — Schema-2 dormant runtime foundation

Before work and before push:
- re-read main/mode/#751/#748/#858/PR;
- inspect #857 current Changed Files;
- prove zero overlap;
- STOP on overlap.

Do not edit or sync #857.

## 15. Hard prohibitions

Absolutely no:
- runtime/code/test changes
- SQL
- migration
- Supabase/DB write
- Development apply
- Production apply
- retention/lifecycle decision
- source/content/profile registration
- extractor/policy activation
- autonomous provenance producer/store implementation
- accepted Evidence
- Rule acceptance
- F8
- provider activation
- CH import/CH-11
- Trip Workspace/B01
- secrets/keys
- Ready/Merge
- follow-up slice

## 16. Allowed files

Immutable TASK:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_TASK_2026-10-06.md`

Delivery only:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_SELF_REVIEW_2026-10-06.md`

No other files.

## 17. Validation / STOP

Before push:
- live re-read main/mode/#751/#748/#858/PR/#857;
- prove zero path overlap;
- immutable TASK blob;
- exact five-file diff;
- merge-base/ahead/behind;
- `git diff --check`;
- operating-mode gate;
- working tree clean;
- exact session/model/effort.

Commit + push autonomously.

Read exact-head CI and Vercel Preview. If hosted CI is delayed, report actual status; do not invent PASS.

Then report:
- exact remote head;
- exact changed files;
- task blob;
- merge-base / ahead / behind;
- zero-overlap proof;
- final classification;
- CI/Vercel;
- session/model/effort;
- unresolved gates.

Keep Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready.
Do not merge.
Do not start implementation, retention or F8.
