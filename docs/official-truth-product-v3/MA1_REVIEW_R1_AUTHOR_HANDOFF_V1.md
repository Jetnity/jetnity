# MA1 Review R1 — frozen two-file correction

9 November 2026. **Author delivery for Root independent review and new-head CI. No Technical Lead PASS, Ready or merge.** Root issued `MA1_REVIEW_R1_TASK_V1.md` after actual CI42654936800 attempt1 failed on published head `b7d247145c27f31fed1e42f2764e9ec91b558a87`, tree `29e1d4cd79bbd54535e2f9d1523c2a1d3d35b8b3`.

The original primary `/root/v3_method_authority_writer` and original runtime child `/root/v3_method_authority_writer/ma1_runtime_writer` implement these corrections. Their logical identities remain Method Authority1 and Method Authority Runtime1, Codex Generation1. No new implementer or Cursor identity is introduced. All V1 artifacts and the failed CI outcome remain unchanged.

## Actual failure and precise scope

The actual Repository verification job129290779391 reported8606 tests,8602 passed,2 failed,2 existing skips and0 cancelled. One failure was the exact foundation consumer fence. The other was `local_pg_duplicate_column` during the native fixture observer setup. **None of the14 MA1 native subtests started.** Actual failure cleanup recorded5 started/5 settled,0 pending,2 connections/2 closed and1 stopped cluster. Other green jobs and prior source review are not MA1 native acceptance.

Exactly two source/test files differ from the failed head:

| File | Bounded correction | Final SHA256 |
| --- | --- | --- |
| `lib/readiness/official-truth-autonomous-producer-custody-foundation.test.ts` |31 additions,0 deletions: two exact consumer entries and a focused MA1 negative/positive guard case. | `e042e34a44df4d82006cbbec36e08a12c5c69affb3883a721b3c5e2396796927` |
| `scripts/db/official-truth-v3-method-authority-1/native.ts` |One line replaces the two unaliased observer `set_config` result names with `statement_cap` and `lock_cap`. | `f36024b32e57d18b76b9cc28227dffe3e9da38f8dec9485d8a3f6666f824fa2a` |

The runtime child now registers only `method/authority-postgres.ts` and `method/contract.ts`, only for `official-truth-autonomous-provenance-artifact`, with exactly `ownRecord`. Raw suffix/copy/dot/traversal/test/support/wrong-directory paths and wrong modules or wildcard/default/empty/duplicate/extra names remain rejected. The existing predicate, earlier entries/assertions, actual repository scan and complete seen-set equality remain intact. No runtime helper was copied and no import detour or broad directory exception was added.

The native fix preserves both1000ms values, their ordering, the same observer connection and one query, all roles, privileges, cleanup and existing driver rejection behavior. The corrected query exactly matches the already used native-adapter result aliases. A bounded source read of the other new MA1 wire projections found no additional instance of duplicate column names. No candidate SQL, Auth fixture, helper, shared transport or unrelated query changed.

## Actual R1 verification

| Check | Result | Evidence |
| --- | --- | --- |
| Explicit ten-file offline selection: previous nine plus failed foundation guard |329 passed,0 failed,0 skipped,0 cancelled; foundation scan now succeeds. | Runtime child log001 and attempts ledger. |
| Runtime child lint of its changed foundation file | Exit0. | Runtime child log002. |
| Primary whole TypeScript | Exit0 on the final two-file correction. | `MA1_REVIEW_R1_LOG_001_WHOLE_TYPESCRIPT.txt`. |
| Primary ESLint of both changed files | Exit0 on the same final hashes. | `MA1_REVIEW_R1_LOG_002_CHANGED_FILES_LINT.txt`. |
| Exact source stability | Both final hashes unchanged across primary checks. | Primary R1 attempts ledger and source manifest. |

The complete explicit ten-file command is copied from the actual child receipt into `MA1_REVIEW_R1_SOURCE_MANIFEST_V1.json`; it contains no glob/native wrapper. All four previously frozen runtime/applicability sources remain byte-identical. Whole hygiene/native/UI/build/Preview are for the normal full new-head CI and Root gates; they were not substituted with a broad local run.

The primary's actual original-source byte comparison also proves that native.ts differs by exactly the one requested alias replacement. The complete V1 implementation/evidence freeze remains historical; R1 is a new additive receipt rather than an edit claiming the previous failed head passed.

## Failed-log provenance

Two preserved representations of the same actual job log have different hashes. The peer's decoded tool string is4,149,611 bytes and SHA256 `7d96e13690ecc60a60bf306b93e1a6e7469718701f435be9c8920339594d346b`. The first saved representation is4,149,612 bytes and SHA256 `579775f4ca90918c6044bc6aac110ebd1840b5d9bbf165e1c00e0058ae08545d`, the hash cited by Root's task. It is exactly the peer representation plus one terminal LF byte.

Both authors independently verified those hashes and that exact byte relationship. The earlier mismatch observation is preserved and the resolution appended. No task, original log or V1 receipt was rewritten. Exact failure/cleanup/summary excerpts remain in the new R1 evidence; Root's serialization note and the two retained raw files explain the serialization difference.

## Freeze and next step

Git HEAD remains the failed published `b7d247145c27f31fed1e42f2764e9ec91b558a87`; no author index/ref/commit/push or remote action occurred. `MA1_REVIEW_R1_SOURCE_MANIFEST_V1.json` records the two before/after source hashes, full current MA1 source inventory, task, child handoff, exact commands/log hashes and unchanged V1 evidence. Sources are frozen for Root and the same independent peer.

Root independently reviews both deltas and reruns the same explicit ten-file suite. Root then owns publication of a new exact head and all renewed CI/native/Preview/checkout/thread/current-main gates. The failed head is not retried unchanged. The fourteen native subtests, including literal CHECK compatibility and actual transaction/role/lock/process/cleanup cases, remain unverified until reached and passed in the new mandatory CI. Further concrete native findings return to the same primary; guard findings return to the same child.

No local native/SQL/PostgreSQL/socket retry, alternate connection, hosted DB/Auth/RLS/ACL/migration/credential action, real source/provider call, public route, scheduler, notification, cost or activation occurred. Method remains NOT_APPROVED; Dev package #1139 remains NOT_RELEASE_READY with17 pre-Owner gaps. #917's specific refusal is not retried/rephrased/delegated/rerouted/human-substituted. Existing Owner gates and the later current-main integration P2 persist. No next slice is started.

**STOP for Root review/publication/new-head CI.**
