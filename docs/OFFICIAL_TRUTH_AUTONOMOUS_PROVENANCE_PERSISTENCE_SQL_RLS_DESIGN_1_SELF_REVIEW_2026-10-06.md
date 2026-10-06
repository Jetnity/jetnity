# Official Truth provenance persistence SQL/RLS design 1 — self-review

Date: 6 October 2026 · Issue #864 · Draft PR #866
Verdict: **AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_READY** (author assessment only).

This is a self-review of the [design](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_2026-10-06.md), not a Technical-Lead PASS or a database test. The [TASK](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_SQL_RLS_DESIGN_1_TASK_2026-10-06.md) remains blob `cd38da2954601cd2de73203920a808e6a09b658f`.

## TASK traceability

| Required design item | Design sections | Review result |
| --- | --- | --- |
| 1. Private layout/exact semantic keys | §§3–4 | Eight proposed tables, exact columns/types, full Pin/pair/digest identity, no UUID/current key |
| 2. Canonical receipt bytes | §3.1 | bytea B, unchanged receipt preimage, no JSONB authority |
| 3. Typed immutable artifacts/complete Pin | §§3.2, 4 | Three byte families, name/type ledger, closed codecs, same-digest byte check |
| 4. Root/artifact links | §§4–6 | 8–11 roots, full-Pin FKs, exact derived edges, no extras/cycles |
| 5. Separate custody binding | §§3.3–5 | Exact #861 K, reciprocal receipt/binding keys, three links, complete equalities |
| 6. Uniqueness/conflict/idempotency/concurrency | §§4, 7 | Immediate semantic uniqueness, no update-upsert; committed whole-closure equality |
| 7. Transaction/atomic visibility | §§6–7 | W0–W8, cooperative global transaction lock, constraints and commit acknowledgment |
| 8. Immutability | §§6, 9 | UPDATE/DELETE row + TRUNCATE statement guards, no ordinary DML/DDL escape |
| 9. Grants/RLS/FORCE/browser denial | §9 | All eight tables, separate owners/executors, no API/service grants or user-ownership fiction |
| 10. Function options/owner/path/EXECUTE | §10 | Exact conceptual signatures; direct private binary call selected; other options assessed |
| 11. Historical reader/failure distinction | §§10–11 | Repeatable read-only snapshot, bounded exact lookup, five verdicts separate from operations |
| 12. Versions/codecs | §§3, 10–11 | Separate schema axes, static historical interpretation, unknown fails closed |
| 13. #859 bounds/enforcement | §§5, 8 | Every original cap, K included, raw pre-dedup and wire/decode enforcement |
| 14. Races/retries/corrupt existing closure | §7; A01–A18, A37–A42, A46 | No winner-skip success, no repair/resurrection on known/ambiguous retry |
| 15. Later migration/apply/rollback plan | §14 | Plan only, no SQL/file/execution; rollback is not implicit destructive authority |
| 16. Development/security-advisor/RLS checklist | §14 | Explicit future tests/catalog/exposure/privilege review; none claimed run |
| 17. Producer/F8 interface without authority | §§1, 12 | Qualified abstract server input only; no #863 implementation ownership or acceptance |

## Adversarial coverage review

All TASK minimum cases map to unique numbered rows in design §13:

| TASK case | Matrix |
| --- | --- |
| Same fingerprint/different bytes | A01, A11 |
| Same id+version/different bytes | A02, A12 |
| Same digest/different bytes | A03 |
| Missing root/dependency | A04–A05 |
| Cyclic graph | A06 |
| Oversized/deep closure | A07–A09, A41 |
| Concurrent identical/conflicting insert | A10–A12 |
| Partial transaction failure | A13, A42 |
| Retry after corruption/disappearance | A14–A16, A37 |
| Projection/JSONB disagreement | A17 |
| Unknown codec/schema | A18, A40, A45 |
| Browser/authenticated read/write | A19 |
| Service/RPC privilege misuse | A20–A24, A44 |
| Current/latest substitution | A25 |
| Receipt without custody binding | A26–A27 |
| Receipt as Rule/F8 authority | A36 |

Additional cases cover null/model review preimages, custody rewrapping, canonical lexical attacks, profile/support/citation drift, private-reader escape, log/credential limitations, shared aliases, privileged owners, unknown issuer codecs and lock timeouts. The matrix is a specification, not a passing runtime test suite.

## Manual challenge results and design corrections

- **Hash-format compatibility:** applying #859's generic manifest wrapper to #861 would change the merged digest preimage. The selected design preserves three byte-contract families and indexes #861 edges outside their bytes. No shared contract file is edited.
- **Custody omission:** receipt existence alone previously described by #859 cannot satisfy the combined #861 contract. The selected reciprocal binding FKs, exact three links and historical missing-binding failure make it mandatory without changing B.
- **Bounds laundering:** separate custody could accidentally double the available graph budget. K counts as one object, its bytes and association edges count, and depth is measured from receipt across K. At most 255 other objects fit the original 256 cap.
- **Race/idempotency:** `DO NOTHING` does not establish equality. The design compares all existing bytes/edges after serialization, using a post-lock READ COMMITTED snapshot, and rejects corruption before inserts. It explicitly distinguishes provisional return from commit success.
- **Disappearance:** a database without a historical tombstone cannot prove prior existence after privileged total deletion. The design discloses that limit, makes known/uncertain retries verify-only, and leaves recovery/ever-seen policy unresolved rather than inventing retention behavior.
- **RLS overclaim:** FORCE RLS is not a service-role or superuser sandbox and does not cover TRUNCATE. The design adds explicit ACL, ownership, membership, command-policy, transitive function and trigger requirements; selects non-bypass function owners and denies service role access.
- **Historical authority:** a supported parser can verify bytes but cannot recover original origin or actual same-object execution. The five verdicts preserve that limit and cannot trigger F8/acceptance/activation. Safe v3 preimage retention adds a checksum check, not authority.
- **Unknown contracts:** the storage design does not invent observation/validity/accepted-origin issuance schemas. Concrete unimplemented/unknown codecs block publication. Their later review is explicit, while table, key, byte transport and failure semantics are fixed here.
- **Diagnostic privacy:** static error codes alone are insufficient if driver/database logging retains parameters. The future access/observability prerequisite covers parameter logging and raw exceptions; no diagnostic retention policy is silently created.

No unresolved P0/P1 design defect identified by the author. This claim is deliberately narrower than proof of future security or independent approval. P2 prerequisites and P3 limitations are enumerated in report §5 and design §14.

## Scope, checks and evidence limits

Exactly four new Markdown deliverables; whole PR additionally has the unchanged TASK seed. The approved #855/#859/#861 documents and operating mode remain byte-identical to main. No runtime/test/.sql/config/package/global-continuity edits, no Supabase/SQL/advisor/provider call, no retention period, no Auth/AAL/capability change, no production/activation/Evidence/Rule/F8 action. #863 producer internals and #867 retention output are not inputs. No second writer/subagent or new slice.

Executed: operating-mode guard PASS; standalone guard suite 16/16 PASS with zero skips; mechanical document scope/hash/UTF-8/link/coverage/whitespace checks before commit. These guards ran with bundled Node v24.19.0; no app Node-22 compatibility claim. Full app/runtime/DB tests, typecheck/lint/build and Development advisors are NOT RUN locally. The no-SQL task boundary overrides generic database verification workflows. Final remote head/main/diff/readback evidence accompanies the post-push STOP receipt, not a self-referential hash embedded in this commit.

Author evidence: Codex Desktop session `01a10e82-70d2-7072-ae46-95e075b9ed72`, model `gpt-6-astra`, effort `xhigh`, verified from targeted local session metadata. Full provenance of that operational evidence is report §6; it is not a runtime receipt field.

**Stay Draft. No Ready. No merge. No follow-up. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
