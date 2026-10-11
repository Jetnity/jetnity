# Official Truth source-bound 128KiB Evidence/custody V2.1 — CONTRACTS

## Version rules

| Path | Protocol selection | Identity behavior |
| --- | --- | --- |
| Existing V1/unknown Evidence calls | Existing 65,536 UTF-16 source hash remains unchanged for V1 material | Existing `identity_schema=2`, V1 `ev2_*`, lookup keys, and rows remain byte-compatible |
| Private full HTTP response | Selector verifies decoded UTF-8 byte count equals actual complete transport byte count; V1 only within the legacy byte/unit bounds; V2 only within both 131,072 bounds | Protocol 2 is fingerprinted with exact source/item/representation/profile identity and must pass the compiled source gate |
| Retrieved material / Evidence candidate | Recompute the shared UTF-8 byte/unit selection; never trust supplied digest or version | Oversize without code-owned profile authorization fails closed; V1 omits the discriminator |
| Accepted Evidence | Closed V1 field set unchanged; V2 field set adds only `sourceFingerprintProtocol: 2` | Protocol values 1, unknown values, and V2 field omission are rejected; accepted/candidate protocol must match |
| Integrated-pilot history | Closed identity parser accepts exact old field set or exact V2 field set | V2 discriminator participates in reconstructed canonical identity/version; old artifacts are not upgraded |

## Custody authority

The new SQL migration is repository-only and unapplied. It pin-gates synthetic V2 proof and accepts the complete body transiently; it does not persist the raw snapshot. Local synthetic PostgreSQL proof is structural only. No Bern/AA profile, source registration, accepted legal Evidence/Rule, or visitor result is authorized.

## V2 retry and deferred integrity gates

On implementation HEAD `8731807082298554a33da845dd765e78c644f2ed`, an existing-receipt retry still calls `verify_retained_v2(fingerprint)` before the set-based submission comparison. That comparison joins every submitted artifact by `(artifact_id, artifact_version)` and compares digest, type, byte-contract family, contract version, and complete stored bytes; `validate_bundle_v2` has already refused missing/duplicate/extra closure members. The lock remains transaction-scoped and all store reads remain after it under READ COMMITTED.

For inserts, the RPC explicitly sets the receipt/binding/root constraint triggers IMMEDIATE before returning. The V2 `receipt_constraint()` dispatches receipt inserts to `verify_retained_v2`; the native test directly inserts an incomplete synthetic V2 receipt, forces `receipt_complete`, observes SQL refusal, rolls back, and proves all eight persisted table counts unchanged. Native regressions also cover wrong/missing edges and typed targets, absent permanent names/blobs, changed retained bytes, corruption refusal without repair, conflicts, and rollback.

`npm test` passed 6,275/6,275 tests across 819 suites with 0 skips/cancellations/TODO; native PostgreSQL 16.15 structural/R2/R3/V2 tests were included. The focused integrated proof additionally passed two repeated barrier-controlled retry races (14,559 ms, 14,613 ms) and the initial insert/idempotent race (12,431 ms, 16,883 ms). The full synthetic proof is not legal/source acceptance.

Exact-head GitHub Actions remains `action_required` with zero jobs; Auth is not independently verified, and the last Preview predates this implementation head. Migration is repository-only and unapplied. No end-to-end real-source admission or positive legal result is claimed.
