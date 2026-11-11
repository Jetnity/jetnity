# M04 R32 — Technical Lead source review V23

**2026-11-10 20:51:29 UTC.** Exact input head **46b4fa8fbc4fe8405d12e0dcc079c4600cdb7eb8**, Draft #1183. Current main/merge-base **e7aae86c18238033c2186722e24c84dc7a5f69b9**. This is a pre-publication source review. **No new-head runtime PASS, TL-PASS, Ready or merge.**

## Problem and selected correction

R31 successfully loaded the corrected SQL and passed N02 plus the other first 23 M04 groups, but [CI 42885977970](https://github.com/Jetnity/jetnity/actions/runs/42885977970) hit the unchanged 240-second budget in full Discovery ledger fill. The full native receipt, terminal eight jobs, complete non-Auth log pins and companion results are preserved in M04_RECOVERY_R32_EVIDENCE_V23.json and [Root's terminal receipt](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6778720831). That failed execution is observation 24.

[Binding V23 v2](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6778784989) authorizes one SQL-function-body change. Every history row already validates its command completely before the journal checks. The former transition call validated the same unchanged command again. R32 uses the first row-local result and copies all remaining transition statement lines into a nested block at the same point.

Same actual author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, session **/root/m04_durable_jobs_writer_g3**. Independent reviewer: **/root/m04_recovery_source_review_g3**. Root read the full relevant functions, call ordering, ownership/catalog boundaries, existing native proof and primary PostgreSQL sources independently. The author's self-review is not TL-PASS.

## Exact content proof

| Content | UTF-8 bytes | SHA256 |
|---|---:|---|
| Published R31 SQL | 140541 | fa111694fb535b867bbb16e3d7b334d48d4e4092bf1f312dd2838a7eed2c37aa |
| R32 SQL | 146813 | b4774a30188443162caec517543b7a6c8d6c90009882e5180c54b8c06384326a |
| Unique removed span | 80 | e9da87688fb7a51728cb08214275c117a17dd504d9f247c9fada6d21b5464166 |
| Replacement block | 6352 | e20f73f6370c221699a1589d92aaf35fcea993b85848ec2b78a275a3dd4a931e |
| Original 56 statement lines | 5642 | 099d492e01d2bc5d62e804f6c339a31ad3bf01c8a1f5efafb63fe2989da6ab7b |
| Unchanged native | 191098 | f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0 |

SQL Git blob: **9dea993d3a84611869a6553eff209813b6dd2506**. Final 18-source aggregate: **afc52b76596a7f5d6416a5412a5706deec3208ba32a69bf9ac0cd5ad02408507**. Author, Root and independent reviewer obtained these same identities separately.

Root's pure text checks prove exact whole-file inverse recovery, identity of all 56 copied lines after removing four indentation spaces, unchanged 29 declaration/attribute pairs, unchanged standalone transition and other 27 functions, unchanged first command/journal block, and preservation of both envelope canonicalizations. All other 17 source files and historical manifests remain unchanged.

## Semantics and authority

The original command validation runs on every row and returns its original input in c.value. The intervening unchanged journal code does not mutate it or the validation environment. No cached validation crosses rows or calls.

The nested block resets all locals on every entry in declaration order. Explicit default collation on kind, action, observed and result_key preserves the original JSONB-only function's local text context. Both helpers use identical fixed search_path and SECURITY INVOKER. JSONB, integer and timestamp locals are noncollatable.

All transition expressions retain their exact order and grouping, including prior-job validation, revision overflow arithmetic, deduplicated-next equality, time guards and audit digest. The original journal condition and both canonical envelope traversals are retained. Every later history loop, credit/count/slot check and both pre-/post-effect history calls remain at their original positions. No transaction, wait, S1 read or final MA1 authority step moves.

Private helpers remain postgres-owned and PUBLIC-revoked; the caller receives only the existing API grant. The unchanged catalog check verifies all function definitions/ACLs before history. Removing an internal transition EXECUTE check does not enlarge the supported caller's authority. The outer FOUND value is not read after the replaced PERFORM; subsequent loops set their own value.

SQLSTATE and explicit refusal messages are preserved. **The diagnostic PG_EXCEPTION_CONTEXT stack is not identical:** the inner transition frame is removed.

## Syntax and execution-context review

Root inspected immutable [PostgreSQL source at c372fbbd8e911f2412b80a8c39d7079366565d67](https://github.com/postgres/postgres/tree/c372fbbd8e911f2412b80a8c39d7079366565d67):

- pl_comp.c: input/default collation propagation.
- pl_exec.c: ordered block reinitialization and expression-snapshot handling.
- pl_gram.y: nested block statement grammar, declaration names and COLLATE syntax.
- pl_unreserved_kwlist.h: commit is an allowed unreserved declaration identifier.

All exact source blobs are pinned in the V23 JSON. This is source analysis, not a compiler run. The existing CI must compile and execute the published candidate.

The copied stable time expressions now live in a VOLATILE caller and can require additional expression snapshots. Their calculations do not read tables, clocks or authority state, but the net timing effect is unmeasured.

## Work model, maintenance and verification limits

The unchanged 254-command Discovery fill visits 64516 history rows: 507 first-enqueue visits and 64009 deduplicated-row visits. R32 removes 64516 repeated command/subject calls and transition entries, 387096 canonical entries, 258064 exact-key checks and 129032 digests from that source-derived model. Both envelope traversals and prior-job validation remain. History is still quadratic. No time saving, Production SLO or guaranteed budget pass is asserted.

The copied body introduces a maintenance obligation: future standalone transition changes must keep the history copy consistent. The exact copied-line proof is part of this review.

The existing native suite covers both kinds, mixed histories, replay/dedup, quotas, retained pointers and standalone malformed-transition negatives. **It has no new dedicated negative oracle installing a malformed persisted envelope on the copied path.** That path's unchanged refusal body is established here by literal statement identity. Root declined a new tamper mechanism because the immutable-history trigger rejects plain UPDATE with P7602. No V23 v3, native change, replication-role change, trigger bypass or fixture change was authorized.

## Publication and acceptance

Exactly ten delta paths: the SQL file, three new V23 records, Handoff and five existing entry-point blocks. All bytes outside those five blocks remain unchanged; the complete prior V22 handoff is retained once. Root independently reconstructed the existing full Git tree and all 838 directory hashes; 9410 existing leaves and all 36 parallel #1181 leaves match the live baseline. The proposed tree has 9413 leaves / 10250 entries, 9403 unchanged prior leaves, three new leaves and no removals. The cumulative PR scope becomes 17 paths.

Publication requires complete file/tree readback and an expected-head nonforce branch update. Afterwards all eight jobs and all 31 native groups must pass on the new head, including the unchanged N02 oracles, both real R9 waits, full ledger/cycle boundaries, inherited761/minOwned4182, rollback/late-writer and clean teardown. Actual mounted Lifecycle, full Core, five hygiene gates, Build and exact Preview are mandatory. Fresh main/head/merge-base/diff/threads/Toolbar/NORMAL/rules/Owner checks precede TL acceptance.

After a genuine PR PASS, Root may Ready and merge with the expected head. Actual new main then needs independent complete CI/native and both Production aliases. Only after that does the separately mandated eight-path documentation completion start, with its own full PR/main/Production gates. Final receipts on existing PR/#751; no self-attestation commit loop. No automatic following slice.

SQL remains UNAPPLIED and all Method/#1139/#1131/#1135/#968/#911/#913/#917 gates remain. No local project execution, environment reconstruction, Auth-log read, hosted/credential/provider action or unchanged rerun occurred.
