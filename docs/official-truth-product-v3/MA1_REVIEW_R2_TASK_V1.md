# MA1 Review R2 task V1 — source-owned CHECK literal

9 November 2026. Root issues **CHANGES REQUIRED R2 / P2** on PR #1175 at exact head `24d55eeda100490ad3fd20b48551b5314b5c4f8a`, tree `4d08dc7201a5c5b62e10a007d288fc7749d9a92b`. Original primary `/root/v3_method_authority_writer` / Method Authority1 — Codex Generation1 owns the immediate correction in the same session. Root alone publishes, gates, accepts, sets Ready or merges. No new implementing agent or Cursor identity.

## Actual failed run and bounded cause

CI42659466404 attempt1, Repository verification129306791905: **8,608 tests, 8,605 passed, 1 failed, 2 inherited skips, 0 cancelled**. Both R1 foundation cases pass. MA1 child1, creator default-ACL refusal, actually passes. The parent then fails `local_pg_P7505` before the other13 children start. Actual cleanup:46 started/46 settled,0 pending,5 connections/5 closed,1 cluster stopped. Later core hygiene/build steps are skipped. The six other CI jobs succeed only for this old exact head and do not establish MA1 acceptance.

Exact decoded core log: `recovery/ma1-ci-r1-peer/core-job-129306791905.log`, SHA256 `5c3521bdd6d94b4712c4a7527bc89383f4cd5384c29dd96f445a59bfc8dd5f38`. Its actual pre-validator diagnostic at line33806 contains three CHECK expressions from the same existing connection and exact transaction. Root and peer independently compared these with the frozen source-owned literals. `heads_v1_shape` and `revisions_v1_shape` are byte-identical. `operations_v1_shape` has one extra closing parenthesis in both source expectations, at zero-based literal offset1643: `until'::text)))) AND ((before_state` instead of the actual `until'::text))) AND ((before_state`.

Actual expression:2800 bytes, SHA256 `64678ff1541d107cf12ced52e99cae1cbd881417087330ebc67930a9fc157a51`. Previous expectation:2801 bytes, SHA256 `66cdd04deb21243789325f646de1a7687b47346aee3de2a25627efde6b9064d3`. Root's independent attribution is `recovery/ma1-r2-root-literal-attribution-v1.json`; peer comparison is `recovery/ma1-ci-r1-peer/observed-check-comparison.json`. The equality guard necessarily rejects this mismatch. The shared P7505 stack does not uniquely identify which RAISE ran first or exclude an additional inventory mismatch; new native execution remains necessary.

## Exact edit ownership

Only these two implementation files may change, with exactly one closing-parenthesis byte removed from the existing `operations_v1_shape` expected literal in each:

| File | Before SHA256 | Exact proposed one-byte correction SHA256 |
| --- | --- | --- |
| `scripts/db/official-truth-v3-method-authority-1/method-candidate.sql` | `dccd1bc22a293947fe8a9f18a04b3fad08968268def4199eff26194a25c02845` | `269c8567da63014c3aa80905aa0773afa4203778985b44ad84fea48d0f24eee6` |
| `scripts/db/official-truth-v3-method-authority-1/method-candidate.rollback.sql` | `aac2d325e55614e717901c3fcd8dfe0b614d4e3217f9ce93b160f213c2b99124` | `e7794fb3862cbc7f916be1fa4e2d0af75e67647c1048e9d805a183ef5e57e709` |

This corrects a source transcription, not the CREATE CHECK expression, function, schema, ACL, role, transaction, strict catalog comparison, native fixture or cleanup. Preserve exact equality and fixed search_path/pretty=false. Do not normalize, loosen, learn/adopt definitions dynamically, change the DDL to match the typo, add bypasses, weaken negatives, or change shared transport/driver/Auth. Both other CHECK expectations and all bytes outside this one literal character in each file stay identical. If another issue is found, report it to Root before expanding scope.

## Verification and delivery

Read actual failure/diagnostic and independently confirm the source comparison before editing. Preserve all V1/R1 tasks, source receipts, logs and failed outcomes. Add only `MA1_REVIEW_R2_*` task-specific evidence, source manifest and handoff. Record actual commands/exits and exact before/after hashes; verify both corrected three-literal sets against the reviewed immutable diagnostic, exact two-byte total diff and unchanged remaining11 MA1 sources. Existing native negative CHECK-mutation/rollback cases remain unchanged and mandatory.

No local native/SQL/PostgreSQL/socket execution. Do not repeat unchanged TypeScript/offline suites merely for these SQL literal bytes; the unchanged prior source-bound offline evidence retains its historical scope. Root independently reviews the two byte corrections, publishes a new leased head, then requires the **entire new-head CI** including all14 MA1 children plus parent, actual SQL/role/lock/process/rollback/cleanup, core/hygiene/build, other native jobs, UI, Preview, checkout and threads. No unchanged failed-head retry and no old green-job transfer.

No author index/ref/commit/push/Ready/merge or automatic next slice. Freeze when the bounded correction and additive evidence are ready; return subsequent concrete findings to this same session.

## Continuing boundaries

No hosted DB/Auth/RLS/ACL/migration/credential action, real source/provider call, public route, scheduler, notification, cost or activation. No retry/rephrase/delegation/reroute/alternate transport/human substitute for the specific refused #917 readback. Method NOT_APPROVED; #1139 NOT_RELEASE_READY with17 pre-Owner gaps. #1131 Ready STOP, #1135 held research, #968 Preview isolation and #911/#913 privacy persist. Current-main integration remains a separate open P2; no integration task or branch is issued here.
