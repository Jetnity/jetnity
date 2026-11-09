# S1 implementation plan V1 — approved, implementation candidate delivered

Author: **Jetnity Official Truth V3 Intake Store 1 — Codex Generation 1**, `/root/v3_s1_storage_writer`; PR #1168, seed `0bd187324c1d050bda19b44fd7cec0b53e8f0fcf`. 9 November 2026. TASK V1 governs. This plan was submitted and approved by Root before implementation. The sections below retain that design; the completion record and precise limitations are in `S1_SELF_REVIEW_HANDOFF_V1.md`.

Root approved the API and dedicated privilege design, then published contract Freeze R2 at `78ae1691cb9e8e75a3c353d2be0f83a2e2f82b81`. Exact `intake-contract.ts` SHA256: `49c4c4f5c2fd0b163be4f387af47032ed8c030fd75e7bfecd875af775bf6f69b`. R2 changes only literal type inference, not API/semantics. R1 rejects duplicate original JSON members at every depth; R3 adds a fixed closed retention shape to both SQL writes and TS, with the explicitly approved exclusion of `official_actions`. No frozen S0/I1 runtime file changes.

## Shared N1/S1 entry proposed for freeze

`storage/intake-contract.ts` exposes a narrow server-to-server intake contract (no source, method or job authority):

```ts
type V3IntakeBinding = Readonly<{
  schema: 3; kind: 'proposal_intake_binding';
  operationId: string; jobId: string; contextKey: string;
  method: V3MethodRef;
  runnerId: string; deliveryId: string;
  inputRevision: string;
}>;
type V3IntakeReference = Readonly<{
  binding: V3IntakeBinding; proposalDigest: string; bytes: number;
}>;
type V3IntakeResult =
  | {status:'recorded'; reference:V3IntakeReference}
  | {status:'rejected'; reason:'invalid_upload'|'bound_exceeded'|'invalid_proposal'|'invalid_binding'|'binding_mismatch'}
  | {status:'collision'|'not_attempted'|'unconfirmed'|'unavailable'};
interface V3ProposalIntakePort {
  capture(text: unknown, binding: V3IntakeBinding, signal: AbortSignal): Promise<V3IntakeResult>;
  confirm(reference: V3IntakeReference, signal: AbortSignal): Promise<V3IntakeResult>;
}
```

`runnerId` is `runner3_` plus32lowercase hex; `deliveryId` is `delivery3_` plus32hex. `inputRevision` is `git:` plus40hex or `snapshot:` plus64hex, supplied by the Jetnity runner. No revision/identity in researcher JSON is promoted into these fields. Same operation with different binding is a collision even when bytes match. Binding validation uses closed own data; operation/job/context must match the parsed existing I1 proposal. Method validity is checked structurally using `createV3WorkIdentity` on that proposal, not declared approved. N1 only calls capture/confirm; it owns no sidecar authority store. `recorded` means untrusted bytes stored, never research work confirmed or a rule accepted.

## Files and storage composition

- `storage/intake-contract.ts`: frozen shared boundary and closed binding/reference readers.
- `storage/intake-server.ts`: existing I1 parser, exact original retention, safe capture/confirm/open and production-unbound factory.
- `storage/quarantine-codec.ts`: closed full I1 outcome/audit decoder, existing S0 decision/archive/version/transition validators plus cross-field operation/job/context/method/digest relationships.
- `storage/quarantine-postgres.ts`: fixed parameterized PostgreSQL statements calling candidate functions; I1 quarantine factory bound to the exact runner binding. Original bytes are reread and reparsed before Reserve. Opaque local tickets in WeakMap plus SQL generation/token/digest/binding lease checks.
- `storage/*.test.ts`: codec/adapter tests and mandatory native test wrapper (existing Core discovery).
- `scripts/db/official-truth-v3-intake-store-1/intake-candidate.sql`, guarded local rollback candidate, native fixture/adapter/tests. No file under canonical `supabase/migrations` changes.
- `docs/official-truth-product-v3/S1_*`: status, test results, native evidence, manifest and handoff.

The only external runtime seam is an explicit SQL executor accepting fixed statement plus bound string/number values and AbortSignal. Its acknowledgement means its actual database transaction completed; unknown remains unconfirmed. No environment/connection/credential resolution or in-memory production fallback. Native adapter uses existing owned cluster and pg-wire, only under scripts/tests. No new dependency.

## SQL privilege decision proposed to Root

Use dedicated `official_v3_intake_private` storage schema and `official_v3_intake_api` callable schema, one NOLOGIN/NOBYPASSRLS/NOINHERIT owner role and one NOLOGIN/NOBYPASSRLS/NOINHERIT caller role. No membership in existing Truth/Owner/Authenticated roles. Caller gets schema USAGE and EXECUTE on exactly capture/reserve/finish/confirm/read functions; **no table DML/SELECT or private schema access**. Functions are narrowly `SECURITY DEFINER` owned by the dedicated role with `search_path=pg_catalog`, every relation fully qualified, no dynamic SQL. This is necessary to preserve immutable original/audit rows while denying caller direct DML; INVOKER would require broad raw table writes. Dedicated owner gets only its own tables; tables ENABLE and FORCE RLS with owner-only policies. PUBLIC EXECUTE is revoked before caller grants in one install transaction. No function bridges into Accepted Store, Auth, Registry or public schema. Installation fails on pre-existing roles/schema rather than hijacking them. Root approval is required before implementing this planned internal privilege boundary.

## Transactions and loss semantics

- Capture inserts immutable original BYTEA/digest and full binding; same-op lookup serializes under row lock and compares bytes plus binding. Proposal JSON is not used to reproduce original text. No replacement writes.
- Reserve requires existing exact original/digest/binding. Lock the row before obtaining DB clock; completed returns full stored outcome, live reservation is busy, expired reservation advances monotonic generation and receives a fresh server-side random ticket. Native SQL `gen_random_uuid()` provides token; random values are not authority without stored row/generation.
- Finish locks same row, verifies bound token/generation/unexpired DB clock and immutable identity, then writes full outcome/audit/escalation key atomically. Immutable completed rows cannot be overwritten by later finish. Actual completion time is DB-owned; audit time is separately retained.
- Confirm only reads that same immutable operation and returns complete persisted state. Lost capture/finish replies do not manufacture success or create new operation IDs. No background work/race is detached: executor owns cancellation, transaction acknowledgement and final cleanup.

## Verification and residual boundaries

Tests exercise actual SQL with two independent clients, byte-preserving replay, changed bytes/binding collision, busy/expiry/reclaim/old-worker refusal, full outcomes and archive/predecessor replay, malformed persisted return refusal, actual rollback on injected fault, lost post-COMMIT reply with same-operation confirm, reconnect/new adapter, direct-DML/function role denial, local rollback/reinstall and complete resource cleanup. Core always executes the small native wrapper; missing PG is a failure, not skip. Native fixture uses only freshly created UNIX-socket cluster and fixed owned login, no external connection parameters.

Existing governance/AGENTS, V3 program/contract/import code, integration ports, canonical S0 readers and native cluster/transport pattern were inspected. No shared S0/I1 semantics change. Any exact importer-allowlist additions will be sent to Root. No Hosted DB/Production/Provider/Method activation; #917 refusal and #1139/#1131/#1135/#968 gates remain. `prepared` still requires current canonical evidence before a separate commit; this slice has no Accepted-Head/cache/outbox delivery authority. Rollback candidate is only run-owned local candidate removal, not Dev recovery.

The pre-implementation STOP was satisfied by Root approval. The author now stops at implementation handoff for independent TL review and actual mandatory native CI. Do not mark Ready, merge, or start a follow-up slice.
