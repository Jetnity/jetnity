# Official Truth Accepted Store Trip Integration 1 — author design checkpoint V1

Date: 2026-11-08. Issue #1155 / Draft PR #1156.
Author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**.
Actual session: `/root/accepted_store_trip_integration_writer`.
Baseline: `e1fe0c696ade9f39b417772b5c065f87530204d6`.
Frozen TASK commit: `874407aac71d6fdb086a6cba230fe95200eb860f`; TASK blob `e3336c869472fe50e94473797c1555419f6d82a6`.

**DESIGN ONLY / MATERIAL IMPLEMENTATION NOT STARTED / ROOT ARCHITECTURE ACK REQUIRED.**
This checkpoint proposes a finite engineering protocol; it is not authority to enable a source, install a hosted candidate, or claim a production accepted reader.

## 1. Existing contracts actually read

The initial checks read the frozen TASK, operating standard, AGENTS, NORMAL mode, current #751 V6 / #917 V6 / #1154 post-merge receipts and the protected-original retention direction. The older startup/ACTIVE_WORK_STATUS pointers are historical; the new Root dispatch is the current author identity.

Exact relevant baseline definitions:

- `official-truth-ch-de-application-pilot-1/evaluate-server.ts`, blob `975206af1755dba3282193f456d1f92d92f8d0ad`: complete current-request canonical packet / execution-context / Rule acceptance and final checks, but no accepted persistence.
- `context.ts` `25dafee0f06353785972efafe0fc2db90183372b` and `scope-server.ts` `bf4da504e58c850602190f822ef454bcbda029c1`: explicit persisted declaration, exact current graph and credential selection.
- `authority-candidate.sql` `407c28bc7623f659e49c3f408bee28302ef717e1`: the actual `require_current_owner_session_v1()` takes Auth user/session/profile SHARE NOWAIT locks and evaluates a fresh clock after those locks. No caller identity or break-glass substitute.
- Legacy claim schema `e70c5a2a617bcd2905b455fe27bd9792608dcb9c`: UNIQUE(rule_scope_key, fact_kind), typed fact row and Evidence FKs. Content-identity V2 `2ce0dd5fcc2438fef0cb99e5487f1a0e1b90528e`: current writer returns idempotent only for exact current fact/support equality; otherwise 23505. It does not update claims.
- Old M1–M4 `36b525580509069039ca6787c25a0a5b94155986`: synthetic-only review/admission/key contracts; no accepted legacy FK. These restrictions cannot be relabelled.
- Existing eight-table provenance SQL and `verifyIntegratedPilotBundle` / explicitly local closure profile prove historical complete bytes and semantic closure, not fresh authority.
- `lib/trips/daten.ts` `3f498e2b750f62348fe8edd42c904a8040f41adc`: actual own-Trip read under authenticated RLS; private trip graph must never move to service-role reading.
- `lib/supabase/server.ts` `1d394cfb6cc158ad0f979d7cd5bfe6526ece8f18`: session client has no scoped fetch/AbortSignal option; auth/session initialization can do work outside PostgREST query abortSignal. This needs the narrow bounded-transport amendment below.
- `useOfficialTruthPilot.ts` `41fd00ad3bbe0e53c1583f46c41a4a85153b503e`: transient pilot protected, but bare server arrays have no independent version/lifetime. New reader results will have their own hook and cannot be masked by pilot.invalid.

No held #1131 implementation was read, copied, or modified; no hosted SQL was run.

## 2. Chosen transport: two principals, three transactions, one final authority gate

Use the existing Supabase HTTP clients, not a new PostgreSQL driver. Every RPC is a separate actual POST transaction. No claim that a lock or transaction survives an HTTP return.

There are two server-owned clients with independent principals:

1. The existing authenticated user-cookie client, with bounded fetch added without changing identity semantics. Only it invokes reservation and final authority checks.
2. A cookie-less service client, created only after compiled deployment binding, exact target, key binding and independent witness binding pass. It can transfer original bytes and prepare material. It cannot finalize acceptance or substitute a service key for a user JWT.

No request accepts these clients, keys, source/registry, contract, facts, receipts, reviewed flags or authority callbacks.

### Proposed explicit RPCs

All live-source names below are confined to the new package's `database-server.ts`; all definitions are only in its UNAPPLIED `accepted-store-candidate.sql`.

| RPC | Granted caller | Payload / effect |
| --- | --- | --- |
| `official_truth_trip_store_reserve_v1` | authenticated only | Fixed operation publish or read; for read only own trip UUID and expected revision. DB selects its admitted compiled-contract slot. Fresh #1142 gate creates a short-lived unpredictable token bound to user/session/JWT expiry, operation and immutable contract pins. No raw material. |
| `official_truth_trip_store_prepare_v1` | service_role only | Exact reserved publish token plus server-generated canonical material and original bytes. Validates bounded full closure and stores encrypted provisional bytes. Does not insert accepted history. |
| `official_truth_trip_store_snapshot_v1` | service_role only | Exact reserved read token plus server-owned key/witness. Returns a strict complete stored snapshot and marks that exact snapshot identity on the token. Raw originals stay server-side. |
| `official_truth_trip_store_finalize_v1` | authenticated only | Exact token and operation-bound expected digest, no facts/bytes/actor claims. Same actual user/session, fresh original JWT budget, all currentness locks/rechecks and unchanged #1142 guard. Publishes prepared material atomically, or final-validates the exact read snapshot. Token is one-use. |
| `official_truth_trip_store_confirm_v1` | service_role only | Exact publish token/digest; separate fresh transaction reads actually committed version, complete binding and finalized state. No mutation/retry of publication. Distinguishes successful function return from durable COMMIT. |
| `official_truth_trip_store_cleanup_v1` | service_role only | Cancel exactly owned provisional token, or process a fixed bounded batch of expired provisional tokens/ciphertexts. Cannot delete accepted history or accepted originals. |

The DB reserves no token unless the new candidate's finite admission row is present and exactly bound. Candidate installation creates no admission. The product compiled binding also remains absent. A direct authenticated caller can at most reserve/finalize its own opaque token; it cannot manufacture the prepared material or read originals. The native proof will attack every RPC directly, not only the Next handler.

The service principal never changes request.jwt.claims or impersonates an owner. Actual final authority is under the authenticated PostgREST request. Reservation is not an accepted Rule, a durable decision, or a reusable positive capability.

## 3. Actual fresh acceptance producer

New private orchestration `producer-server.ts` has a no-input-source API, accepting only AbortSignal. No HTTP mutation route is added.

After default/deployment/target/key/witness checks, it:
1. Authenticates the real user and obtains a fresh publish reservation using #1142.
2. Selects the sole compiled exact global cell/application/source contract itself; loads the current catalog using the bounded owned transport.
3. Performs the unchanged protected source retrieval, exact source/representation/profile/currentness/full-byte hash checks and contract validity derivation.
4. Executes the existing `officialTruthRegelReviewBelege`, packet fingerprint, null-proposal Rule Candidate, deterministic `officialTruthTrustedFactExtrahieren` and one-use `consumeOfficialTruthTrustedFactExecutionContext`, then `regelKandidatAkzeptieren`. The returned fact and selected code definition must be the exact actually executed context.
5. Constructs the historical provenance bytes ONLY from those fresh actual values. Historical constructors/DecisionIntent are serialization/check material, not permission. No synthetic historical accepted flag enters this path.
6. Prepares immutable complete material through the service-only RPC. The private stage binds the review packet, exact ordered support/version identities, source bytes, current code/contract pins and observed predecessor.
7. Rechecks code-owned state, invokes authenticated Finalize, awaits its settled response, then uses a distinct fresh Confirm request. Unknown ACK, abort, rollback or missing committed rows returns unknown/unavailable and is never automatically retried.
8. Advances/checks the external witness through its compiled server-only binding. Witness failure prevents success; it cannot reset the witness from DB head.

Finalize stores the minimal non-personal protected decision (policy/version, reviewed packet identity, verified-at and acceptance time) after the real #1142 gate. User/session/Trip references remain only in short-lived private authorization records, not global receipt, accepted version or original vault.

The existing #1131 framing/completeness hold remains a separate P1. This producer composes the frozen retrieval; the local fixture demonstrates complete synthetic bytes. It does not repair or certify actual real-source native framing. Real original completeness remains blocked by that separate hold.

## 4. One versioned accepted model with explicit legacy projection

New schema `official_accepted_trip_private`, no direct application table grants, enabled/forced RLS. Proposed records:

- `admissions`: immutable exact deployment/application/global-cell/source/profile/definition/key-policy pins; empty by default.
- `reservations`: short-lived own-user/session/operation/expiry token and staged/snapshotted/finalized state; personal references stay here.
- `staged_publications`: strictly bounded prepared manifest and encrypted provisional original, no accepted status.
- `versions`: immutable version identity = the existing receipt fingerprint; exact rule_scope_key/fact_kind, legacy claim_id, predecessor fingerprint, decision_id, accepted_at, provenance FK and projection digest.
- `version_supports`: immutable ordered receipt-version→accepted Evidence version→opaque original pin mapping; exact scoped FK to legacy `official_evidence_versions`. One primary support for this version.
- `decisions`: immutable non-personal protected-decision identity and exact review packet/support binding.
- `originals` and `ciphertexts`: separate private bounded encrypted-original storage, preserving immutable origin/hash/identity/expiry, no raw original in provenance.
- `current_versions`: exactly one current pointer per rule_scope_key/fact_kind, CAS to the observed predecessor, never latest/first/LIMIT guessing.
- `events` and `head`: bounded append-only contiguous hash-linked lifecycle with independent epoch/sequence/hash witness; source/profile/contract/rule withdrawal, conflict, supersession, expiry/disposal are irreversible in this candidate.

The existing eight-table provenance store supplies the immutable exact fact and closure bytes; `versions` is a binding ledger, not a second fact engine. Older accepted version facts/support/origin/decision are never overwritten.

For first acceptance, the canonical current legacy writer inserts accepted Evidence/Claim/support/typed requirement-effect rows inside the same final transaction. Existing unbound legacy claim at that cell is a conflict; it is not silently adopted or backfilled.

For succession, the candidate must first prove the current legacy projection equals the bound predecessor. In the SAME transaction it inserts new immutable Evidence/provenance/version/support/original/decision rows, updates only the legacy current projection and current pointer, and appends supersession/acceptance events. The old current Claim's scope/identity remains fixed. Allowed existing-table changes are precisely:
- UPDATE `private.official_rule_claims.accepted_at` and corresponding accepted quality/state fields only within the already fixed scope/fact kind;
- UPDATE the one `private.official_rule_claim_requirement_effect` effect/visa_mode row;
- DELETE/INSERT only that claim's `private.official_rule_claim_support` current projection, preserving every old support in immutable version_supports and Evidence;
- no UPDATE/DELETE of accepted Evidence, receipt/artifact bytes, historical decision/version/original metadata.

The old writer remains unchanged: exact match against current materialization is idempotent, differing facts/supports still fail 23505. The new reader compares every current fact/support/scope/acceptance field against the exact immutable current version. A bare claim_id FK never qualifies a version. Rollback restores pointer, legacy materialization, history insertion and lifecycle as a unit.

This explicit projection DML needs Root's candidate-only amendment; it does not authorize hosted schema changes.

## 5. Lock order, currentness and original preservation

Use READ COMMITTED VOLATILE functions with finite lock/statement timeout; fail on stronger isolation. Fixed acquisition order for material operations:
1. Relevant existing catalog tables in SHARE mode, matching the canonical writer.
2. Legacy Evidence/Claim/support tables at the canonical writer's SHARE ROW EXCLUSIVE mode for publish; SHARE for read validation.
3. Existing provenance publication advisory lock (exclusive for publication, shared for snapshot/final read); old publisher re-acquires its already-held lock.
4. New lifecycle head and exact current pointer (UPDATE for mutation, SHARE for read); then exact reservation/stage.
5. For read, current own Trip and relevant graph tables/rows, with NOWAIT where needed to abort cross-contract inversions.
6. Existing #1142 own Auth user→session→profile guard LAST, after relevant waits.
7. Fresh clock, expiry/current-version/scope/catalog/contract/source/profile checks, then final action. No further unowned wait after authorization.

The independent final read linearization is this last locked check. Later revocation cannot retroactively erase an already shown offline result; bounded display expiry and mandatory re-read prevent indefinite reuse.

The old M1–M4 source/review/key CHECKs and old 23-column repeatable-read reader remain unchanged. The new snapshot RPC does not pretend it can call that read-only transaction entry while also writing a token. It uses existing underlying complete retained-closure verification under its own explicit locked snapshot and serializes all actual bytes/edges for the unchanged TypeScript verifier. This requires an explicit new reader protocol review, not weakening the old protocol.

The existing explicitly local closure profile remains structural proof only; it is not silently promoted to real production proof. No production binding exists. If the same complete new bundle cannot satisfy the unchanged approved closure contract without a new profile, return that exact depth/profile mismatch to Root before changing any bound.

## 6. Trip graph and scope: no revision-only assumption

The first global cell is compiled independently of a user Trip:
- destination DE, no transit;
- exact selected citizenship set CH and linked CH ordinary passport;
- explicit tourism and direct CH→DE application contract;
- a finite compiled evaluation-date slot with `validity.mode=travel_date` and its exact date, plus both-date application/legal bounds.

The consumer selects a unique compiled slot matching the actual Trip start date. It does not replace a fixture date or derive a new global cell from caller input. Dual-citizenship selected travellers or dates without an exact admitted slot remain unsupported for this bounded version; other people and multiple document options are allowed, but only the explicitly selected matching cell is positive. The selected exact citizenship set and both dates must match the compiled contract and original source validity. No Schema1/2 expansion.

`pilotScope`, `pilotContextCurrent`, `declarationReferencesValid`, `pilotContextFingerprint` remain the canonical selection checks.

The existing graph revisions cover stages/days/items and Trip fields, but the read does not assume every traveller/document write increments Trip revision. Therefore reservation/final verification additionally bind a bounded complete canonical DB snapshot digest of the own Trip, persisted metadata/declaration, stages/days/items, travellers, citizenships and documents. Include row identities and MVCC change markers in that short-lived concurrency digest, alongside actual values, to detect delete/recreate/ABA; these markers are not durable custody evidence and never enter global provenance or client output.

Reader order is: initial own RLS Trip read → Reserve captures graph snapshot → second own RLS Trip read used for projection → stored material snapshot → original reproof/engine → final own Trip read → authenticated Finalize under graph/currentness locks. The second read is between reservation and final checks; comparison requires matching full context fingerprint, not just revision or the old stored graphFingerprint. Any missing fallback context, concurrent graph change or ambiguous row set refuses.

## 7. Server-owned reader, deadlines and cleanup

`reader-server.ts` external API accepts strictly `{tripId, revision}` plus AbortSignal. The product entry does not accept an already asserted Trip, positive reader, registry or proof DTO.

After own Auth/RLS/selection checks and a read reservation, a fresh service Snapshot request loads:
current version, exact legacy projection, complete accepted Evidence/supports/decision, full immutable provenance bytes/edges, original ciphertext metadata and decrypted full bytes, lifecycle/independent-witness position and exact origin/freshness/retention limits. Producer memory is not used.

Re-run the actual canonical source identity, Evidence acceptance, null-proposal packet, selected deterministic extractor, exact execution context and Rule acceptance over original stored bytes. Compare canonical fact/packet/support/closure to stored history. A self-consistently rehashed false fact must reject. Reading does not change retrievedAt.

Only after that produces the narrow provider rows does the unchanged `requirementsFuerReise` run for the actually loaded Trip. Exactly the selected visa cell may be positive. Finalize then revalidates all mutable inputs and returns only sanitized confirmation. Runtime compiled bindings are checked again after every await and before return.

A request lifetime uses monotonic time and the earliest confirmed deadline. Each RPC starts within remaining budget, and absolute source/JWT/retention/application limits are converted conservatively from the RPC start; response delivery never resets the budget. No Promise.race that abandons started SDK work. Abort reaches fetch, all started work is awaited to settle, then cleanup completes under its own short bounded cleanup budget. Late final success cannot publish.

Prepare is a committed provisional record. Add actual cleanup/reconciliation: canceled/expired stage removal of ciphertext and token, strict rows/bytes/quota, bounded explicit sweep, and tested cancellation-before/after-stage-commit races. Accepted history is never cleanup input. A lost final ACK returns unknown; subsequent cleanup cannot delete an actually finalized version.

Key and independent witness must both be present in the compiled server-only deployment binding. The witness cannot be derived from the current database. Restore to an earlier epoch/head, sequence gaps, missing originals, withdrawn/conflicted/expired data and ambiguity all refuse.

## 8. Workspace and endpoint

Thin `app/api/readiness/accepted-store/route.ts` delegates to new package `request-server.ts`.

POST body is exactly `{tripId, revision}`. Strict own-origin/optional same-origin sec-fetch-site, bounded JSON, current Auth, existing per-user readiness rate limiting, non-disclosing missing/foreign Trip handling, revision409 and explicit error/unavailable distinction. Gate absent means zero Auth/client/DB/source work. The endpoint never fetches or accepts a government source.

Narrow shared result `result.ts`: closed status/reason, tripId/revision/contextFingerprint, exact rule/Evidence refs, original sourceCheckedAt, fresh readAt and bounded expiresAt/display budget, and existing OfficialEvaluation[]. No originals/proof objects/key/actor/session data.

Separate `useAcceptedStoreTruth.ts` owns result/request generation/abort/dirty state and monotonic display deadline. Visible result is synchronously derived against current Trip and expiry during render, not first repaired in an Effect. Edit invalidates immediately; matching confirmed new Trip plus fresh read can become current despite old pilot.invalid. Wrong-trip/older responses, failure, hidden/pagehide/visibility restoration, expiry, cancellation or backward wall clock cannot revive a positive. Rerender does not restart the timer.

KontoArbeitsbereich invalidates both paths on existing relevant edits. An explicit stored re-read invalidates prior pilot display; pilot save/check invalidates the stored display, so a failed newer action cannot fall back to an old positive from the other path. Existing source/time/person/document rendering is reused. Guest unchanged. Closed availability renders no functioning new action and makes no fetch.

The authenticated Trip page may provide a strictly bound server-read envelope only through the same reader entry; no implicit source fetch or promotion. Initial unknown is acceptable when no confirmed stored read exists. A focused explicit re-read action is the required recovery path.

## 9. Concrete files / requested narrow amendments

New product files under `lib/readiness/official-truth-accepted-store-trip-integration-1/`:
`binding-server.ts`, `lifetime-server.ts`, `database-server.ts`, `canonical-server.ts`, `provenance-server.ts`, `producer-server.ts`, `reader-server.ts`, `request-server.ts`, `result.ts`, `workspace-state.ts`.

New test/candidate files under `scripts/db/official-truth-accepted-store-trip-integration-1/`:
`accepted-store-candidate.sql`, `schema.ts`, `fixtures.ts`, `native-proof.ts`, `browser-proof.ts`, and exact test-only module/HTTP adapters as necessary. All native fixture/harness helpers remain outside lib/app/components.

Discovered entries: `lib/readiness/official-truth-accepted-store-trip-integration-1.test.ts` and `...-workspace.test.ts` (or one native parent also running the mounted stage). They must run in Core, never an optional skip.

Existing narrow integrations:
- `lib/readiness/trip-official-evaluations-server.ts`: new protected Trip-reference read delegate, legacy null-provider function retained;
- `app/(public)/reisen/[tripId]/page.tsx`: bounded result/availability props;
- `components/trips/KontoArbeitsbereich.tsx`: dual invalidation and separate reader display/action;
- new `components/trips/useAcceptedStoreTruth.ts`, plus one small button/status component if required;
- no broad redesign or core Requirements change.

**Requested explicit amendment A — bounded existing session infrastructure:** add optional AbortSignal/scoped transport tracking support to the existing `createServerComponentClient` factory (same cookies, anon key, target, authentication, no changed authority), and pass the existing optional reiseLaden signal through to this client. Existing no-argument callers unchanged. New service client uses the same bounded fetch pattern privately. This avoids pretending query.abortSignal also bounds Auth token refresh. No auth policy/MFA/session semantics are changed.

**Requested explicit amendment B — canonical source transport use:** permit ONLY the new private producer to compose the already-existing `loadOfficialTruthServerOwnedRetrievalWithCatalogTransport` with its code-owned bounded catalog transport. That entry currently has an exact importer restriction. No changed HTTP/SSRF/TLS/UTF8/framing/marker/getter code. It has the unchanged 64KiB transport ceiling; no real AA/Protocol2 admission or arbitrary fixture profile is thereby enabled. If Root prefers retaining the standard loader, total catalog-lifetime limitations must remain explicit rather than falsely claiming owned cancellation.

**Requested explicit amendment C — legacy current projection DML:** authorize the candidate-only exact changes in §4 while old writer/schema files remain unchanged.

**Requested explicit amendment D — exact hygiene/test lists:** additive exact RPC/source/sql path entries in `scripts/db/verwendung.mjs` and its ordered test `lib/admin/account-counts-delivery/schema-reference.test.ts`; exact package importers in existing content-identity, trusted-fact-extractor and server-owned-retrieval importer guards; narrow new dependency stubs in `trip-official-evaluations-server.test.ts` preserving guest/RLS/null-provider assertions; exact readiness-route check in `scripts/api-schutz.mjs` plus executable handler tests. No wildcard prefix exceptions, no weakened assertion, no dependency/package/workflow/timeout change.

Docs: matching HANDOFF with all boundaries and actual evidence; narrow current ACTIVE_WORK_STATUS pointer; exact decision/amendment references. No silent rewrite of the frozen TASK or existing historical documents.

## 10. Native and mounted acceptance proof

One disposable real PostgreSQL cluster installs the actual relevant migrations, unchanged #1142 guards, existing provenance SQL, and new UNAPPLIED candidate. Auth claims/users/sessions are explicit local fixtures, not hosted signed-JWT proof.

Positive chain: actual DB own-Trip with at least two people and multiple documents → fresh synthetic-only source through real new producer/canonical functions → actual service prepare and authenticated final SQL COMMIT → producer settled/closed and actual separate confirm → distinct fresh reader using real SQL and actual canonical bytes → unchanged Requirements engine gives exactly one matching cell → actual hook and existing Workspace/preparation renderer show that result through the real read handler. No accepted-success, SQL-success, positive extractor fact or reader mocks.

Then actual version succession: change synthetic original/legal fact with newly computed evidence/receipt; repeat fresh protected acceptance, preserve old byte/history equality; fresh reader picks exactly new version. Real withdrawal/conflict/expiry disposes reliance. Unbound legacy rows remain unreadable, legacy writer idempotence/conflict remains.

Negative matrix covers direct caller role escalation/raw access/token substitution/replay; foreign account/wrong session/expired JWT/authority revoked after real lock wait; both-date/route/credential/context/graph changes including child-only change; missing/ambiguous/version/projection/decision/support/original/closure mismatch; self-consistently rehashed incorrect fact; external witness rollback/ABA; rollback, lost final ACK, default PostgREST-style transaction rollback, provisional cleanup races; cancellation and late final response; actual connection/operation settlement.

Mounted proof carries the actual native-produced sanitized response, or invokes actual new handler over loopback against that live native fixture. It is not an independent hand-made positive DTO. Required transitions include edit→unknown→confirmed saved new Trip/declaration→fresh read→current with pilot still invalid; out-of-order old request suppressed; wrong Trip; failed read; expiry; hidden/pagehide; backward clock; no rerender timer reset; all unsupported cells unknown. Existing Playwright/React/TS dependencies only. Required CI absence of runtime is failure, not skip.

Current local environment has only partial source mirrors and TS/tsx helpers, no PG or Next/React runtime. No native or UI PASS is claimed. Fresh source files are downloaded at the exact baseline; old mirror files, if reused, must first match Git blob identities. Full native and mounted checks must execute in CI without package/workflow timeout changes.

## 11. Status, risks and STOP

- P0: no new observed exploit; no security certification.
- P1 to resolve before delivery: exact final principal separation; complete currentness closure and immutable version/legacy projection; fresh protected decision; external witness; cleanup; actual native/mounted execution.
- P2: bounded table locks may limit concurrent throughput; no production performance claim. Current Core measured headroom does not authorize broad timeouts.
- P3: old docs contain historical writer pointers; current issue/PR/checkpoint and final ACTIVE_WORK_STATUS must identify this generation.

All #917 / #1131 / #985 / ownerMac/Bern / privacy / actual source/key/retention/hosted/JWT/activation gates remain. This is not the refused read-only operator audit; Reserve/Finalize are candidate mutations only in disposable local fixtures.

**RETURN / STOP for Root architecture acknowledgement and exact amendment. No material code yet. Do not mark Ready, do not merge, do not start a follow-up slice.**

