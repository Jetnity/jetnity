# Official Truth content identity private schema/RPC v2 1 — Self-review

Issue #810; Draft PR #811; Generation 1. Model `gpt-6-astra`, reasoning `xhigh`.
This is the implementing writer's self-review, not independent Technical Lead approval.

## Requirement-to-evidence review

| Requirement | Implementation and disposable proof |
|---|---|
| Locked empty cutover | Transaction + ACCESS EXCLUSIVE locks before DDL; dynamic enumeration of all dependent fact tables; empty success and source/domain/Evidence/Rule-fact nonempty rollback with no partial v2 objects. |
| Authority identity | Original source/domain tables, PK and registration body retained; domain overlap and provider exclusion tested. |
| Item identity | Composite authority/item PK, external uniqueness, bounded immutable metadata, current-version partial unique indexes and exact FKs; malformed/provider/orphan/duplicate cases. |
| Exact URL ownership | Global permanent stream reservation + version bindings; canonical structural checks, domain/deny checks, final-only URL, sorted ordinal requests, historical same-stream reuse and forbidden cross-stream takeover. |
| Private security | All six new tables ENABLE/FORCE RLS; no policies/direct API DML; empty search_path for all public definer functions; private helper EXECUTE revoked; role/grant/execute tests. |
| Evidence v2 | Required schema 2 and ev2/v3 checks, exact representation/profile/media/final FK; preserved scope/hash/time constraints, direct-FK rejection and R1-derived synthetic identity proof. |
| Lineage | Existing predecessor, same authority/item/representation/lookup and actual cell, strict chronological order; no self/forward/cross-stream/cross-cell link; immutable Evidence prevents update cycles. |
| Support | Exact persisted ev2 tuple, accepted-valid official authority and same scope, unique claim/ContentItemRef, explicit=1 and composed=2..8; rendering/version duplication rejected, same-authority distinct items accepted. |
| Catalog RPC | Strict read/source/initial item operations only; one-statement explicit sorted snapshot, test-only R1 reconstruction, idempotence, collisions/late rollback, unsupported transitions. |
| Store RPC | Closed typed transport, current identity eligibility before duplicate success, eight unchanged flat fact families, unchanged deferred completeness, no schema-1 applicability; transaction rollback and multi-call transactions. |
| Retirement | Both v1 public RPCs always raise feature_not_supported (0A000) after cutover; no runtime fallback. |
| Concurrency | Real two-session lock waits prove exact duplicate serialization and external/URL/domain/store conflicts; unique database keys additionally protect ownership. |
| Scope | One CLI-generated migration + one focused test + required docs/immutable task only; no existing implementation/package/type/script edits. |

## Adversarial review decisions

- A binding-only unique URL key would allow a historical URL to move to another stream. The separate permanent reservation table closes that gap while permitting repeated bindings within the owning stream.
- Comparing only `rule_scope_key` would accept a mismatching actual regulatory cell supplied with a reused key. Support eligibility and predecessor checks compare the typed cell columns too. SQL still does not derive the key or prove caller-supplied digests.
- A count of authority source IDs would incorrectly reject two distinct items from the same authority. Count uses the pair `(source_id, content_item_id)`; support uniqueness prevents inflation by versions/renderings.
- Checking only before insert could let a duplicate call report success after a deny/current-eligibility change. Eligibility runs before duplicate handling.
- A foreign key alone could permit a forward predecessor completed later in the transaction. The BEFORE INSERT lookup requires an already existing row. Immutable accepted Evidence plus increasing retrieval time precludes cycles.
- Deferred constraints left immediate after one RPC could break a second registration/Rule write in the same transaction. Each writer explicitly defers its completion constraints before writing and forces validation before returning; multi-call rollback is tested.
- A repeatable-read snapshot established before a catalog lock wait could hide a concurrent parent/child domain registration. S1 write RPCs reject non-READ-COMMITTED transactions explicitly. Table locks are acquired in one consistent order; concurrency tests observe the actual blocked second session.
- Strict JSON field types precede `jsonb_populate_record` and integer conversion. Numeric strings, floats, booleans, missing explicit nulls, unknown fields and oversized collection bounds cannot silently coerce into accepted storage.
- The URL helper preserves canonical ASCII path/query punctuation and query ordering; it rejects normalization tricks and malformed escapes. It grants only exact finite URL ownership, never path/prefix/regex publication permission.

## Limits and residual review focus

This is dormant SQL and synthetic proof, not operational activation. No real HTTP response, profile, source, legal interpretation, provenance or production freshness has been verified. Server code remains responsible for canonical digest/scope derivation and semantic acceptance; SQL proves structural identity and transactional invariants only.

R1 graph bounds remain graph-validation responsibility; S1 registration bounds one initial item to 16 representations and each representation to 16 request URLs. No whole-catalog runtime loader or production profile is added. Existing metadata and fact bounds remain enforced.

The descriptor current flags are immutable in this slice. A later separately reviewed transition is necessary to advance/retire current versions and release/rebind any URL; no such operation exists here. Global blocked-domain data is server-owned but has no S1 public mutation operation.

The existing private-table owner must retain the ability to execute definer operations under FORCE RLS, exactly as for v1. S1 does not redesign ownership, Auth/AAL or service capabilities. Profile pins in the database cannot authorize execution of code.

Local PostgreSQL execution is blocked by the exact macOS error `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`; no skip or fabricated green is used. Exact-head Linux CI is a required gate, not optional corroboration. The gate is closed on implementation head `245ab698383012d733c89562d2a65404eea20468` by [Linux CI 37169184611](https://github.com/Jetnity/jetnity/actions/runs/37169184611): 4,728 passed, 0 failed/skipped, including all 51 S1 disposable subtests. Type/lint/build/hygiene and Auth jobs pass. The documentation-only final commit preserves the tested SQL/test blobs; exact final-head CI is separately read back before STOP. Classification: **CONTENT_IDENTITY_SCHEMA_RPC_V2_READY_FOR_DEVELOPMENT_APPLY**; independent review and any future apply decision remain with the Technical Lead.

Task seed and both package manifests are byte-identical to dispatch; the generated migration name is unchanged. NO live apply, real rows, runtime v2 callers, generated types, db-script edits, R2 or F8. Remain Draft and stop for independent Technical Lead review.
