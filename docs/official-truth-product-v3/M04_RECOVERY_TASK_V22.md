# M04 Recovery Task V22 — R31 syntax correction

**2026-11-10 19:26:20 UTC. CHANGES REQUIRED on the published R30 head; the minimum source correction is independently reviewed. New-head publication and all runtime gates remain pending.**

This is the immediate same-author correction within Draft [PR #1183](https://github.com/Jetnity/jetnity/pull/1183). The [binding V22 v1 task](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6777004330) defines the same source and ten-path publication scope. This file includes the subsequently completed failure receipts. It does not start another product slice.

## 1. Exact baseline and failure

Current main and merge-base: **e7aae86c18238033c2186722e24c84dc7a5f69b9**, tree **8918d48841c19ddaf16c128973a0f03eed481f43**. Existing branch: **fix/official-truth-v3-m04-postmerge-r30-20261110**. Expected current head: **dfd0fcf0ca70a955ae568e19f0d4b633cb0d7066**, tree **0f02592c5e91111a7ba61b06d047defbcf1cf9c7**; ahead1/behind0.

Exact-head CI **42881395864, attempt1**, completed FAILURE at19:21:53UTC. Repository130058297808 and aggregate130069109927 failed; all six companions succeeded. Root observed Repository terminal at19:19:28UTC before reading its log, and all jobs terminal at19:24:08UTC. Auth was metadata only.

M04 fails while installing jobs_candidate, with PostgreSQL **42601**. Its receipt confirms the published candidate digest a61011a2bfd0d11c451302e8e434c25fec37f47415f34f3f25da785d1aea7174. **0/31 groups**: the new N02 oracles, R9, quotas, inherited guards and final rollback did not execute. Cleanup completed22/22 owned operations and2/2 connections, stopped1cluster, with0pending/errors;1106ms total/180ms cleanup. These timings are setup-failure evidence, not a performance result.

Core8672 tests:8669pass/1fail/2inherited skips/0cancelled;971suites. Typecheck and Lint passed; five hygiene checks and Build were skipped. The full log is4244931UTF8bytes/SHA2563844d5cdfff6fbb90b12fc8e6e8300d61214f9700eb22a09108f4146438ac7af. The complete compact native receipt is1762bytes/SHA256cb42e09d76812dc6457c5710409945335c0719aae1ad3cc214ec283fc2f55fd4.

## 2. Precise cause and only permitted source change

The earlier author, Root and independent source reviews missed a PL/pgSQL delimiter behavior. A source review is not a compiler or runtime pass. The sanitized runtime log exposes phase and code, without an inner SQL position or message; the precise diagnosis comes independently from the published source and pinned PostgreSQL grammar.

[PostgreSQL16 pl_gram.y](https://github.com/postgres/postgres/blob/c372fbbd8e911f2412b80a8c39d7079366565d67/src/pl/plpgsql/src/pl_gram.y), blob **6a09bfdd67508d237309c1e703c52c12e070a4b4**: expr_until_then reads until K_THEN. read_sql_construct stops there at parenthesis depth zero and tracks parentheses/brackets, not CASE nesting. The bare CASE in civil_date_v1 therefore ends the IF condition at its first inner THEN.

Change **exactly two ASCII bytes** in scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql. Unique old217-byte span:

```sql
    AND day_value BETWEEN 1 AND CASE WHEN month_value=2 THEN
      CASE WHEN year_value%4=0 AND (year_value%100<>0 OR year_value%400=0) THEN 29 ELSE 28 END
      WHEN month_value IN (4,6,9,11) THEN 30 ELSE 31 END THEN
```

Replacement219-byte span:

```sql
    AND day_value BETWEEN 1 AND (CASE WHEN month_value=2 THEN
      CASE WHEN year_value%4=0 AND (year_value%100<>0 OR year_value%400=0) THEN 29 ELSE 28 END
      WHEN month_value IN (4,6,9,11) THEN 30 ELSE 31 END) THEN
```

Final SQL: **140541UTF8bytes**, SHA256 **fa111694fb535b867bbb16e3d7b334d48d4e4092bf1f312dd2838a7eed2c37aa**, Gitblob **90d9f0466869cf19654aac63245916c5bda16066**. The exact inverse restores the complete published R30 file. All29 declaration/attribute pairs, other28 function bodies and every other byte remain identical to dfd. SQL meaning, original fallbacks, authority and rollback remain unchanged. New18-source aggregate: **c7361e9411c218ed98f94715a8eb3c852f71c2f8a67720dbb3048807b17d1664**, in the unchanged historical digest format.

Native remains **191098bytes / SHA256 f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0 / Gitblob 0b3f7d9906687ec42171de5af60fed009d07b39f**. All previous native bytes and31 groups remain. The existing addition still requires8 key cases,36×4 calendar cases and8×4 timestamp cases. All three reviewers inspected its full added DO: CASE assignments end at semicolons; IF/ELSIF predicates contain no CASE; FOR SELECT expressions contain no intervening LOOP delimiter. No second instance of this hazard was found. No native, fixture, oracle, skip, logger or tolerance change is authorized.

## 3. Actual author and publication ownership

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, actual session **/root/m04_durable_jobs_writer_g3**. Independent reviewer: **/root/m04_recovery_source_review_g3**. The same author returned the precise replacement and full-file pins. Root and reviewer independently reconstructed matching bytes and inverse.

Author STOP after source delivery. Immediate further fixes return to this same session. No fabricated Cursor or resumed historical session identity. Only Root publishes, grants TL-PASS, sets Ready or merges; author self-review never supplies TL-PASS.

## 4. Finite publication scope

Update the same branch with parent dfd and a nonforce expected-head guard. Exactly **10 changed paths relative to dfd**:

- The one SQL file above.
- Three new Root records in docs/official-truth-product-v3/: M04_RECOVERY_TASK_V22.md, M04_RECOVERY_R31_EVIDENCE_V22.json, M04_RECOVERY_ROOT_REVIEW_V22.md.
- Six current files: M04_HANDOFF_V1.md, JETNITY_START_HERE.md, docs/ACTIVE_WORK_STATUS.md, ROADMAP.md, JETNITY_HANDOFF.md, ARCHITECTURE.md.

Only existing current marker blocks change in the five central files. All V21/V20/V19/V18 evidence, historical manifests, native.ts, other implementation, workflow/package/guards and the36 parallel#1181 leaves remain unchanged. Expected cumulative PR scope:14paths. Expected full tree:10247entries/9410leaves,9400prior leaves unchanged,3new,0removed. Root must reconstruct and verify the complete tree, every full changed content and all preserved identities.

## 5. Mandatory fresh gates and finite finish

Every new head invalidates earlier exact-head gates. Require all8CIjobs, all31 native groups in order, both real R9 wait/abort/drain/backend-absence witnesses, full254/255/256 ledger and64/65 cycles, inherited761/minOwned4182, rollback/late-writer and complete cleanup. Also require actual-mounted Lifecycle, Core, five hygiene checks, Build, exact Preview, fresh main/merge-base/diff, reviews/Toolbar, active strict rules, NORMAL, Guardian and reserved Owner gates.

Only after complete independent PASS may Root set Ready and merge with the expected head. Then verify actual merged main through its own full CI/native and Production with both aliases. The separately mandated **8-path documentation completion** remains HELD until that actual-main PASS; it then requires its own Draft PR and complete PR/main/Production gates. Final receipts go on existing PR/#751 without a self-attestation commit loop. Then STOP; **no automatic following slice**.

## 6. Full retained history

All20 earlier failures and genuine R21/R29 PR successes/merges remain in unchanged pinned history. Additional entries21–23 are failed execution attempts; entries21 and23 share run42879088258 and must not be presented as different run IDs.

- e7 main attempt1, entry21:23/31 M04, ledger-fill240s failure; Lifecycle3/4 failed Chrome version discovery. [Full receipt](https://github.com/Jetnity/jetnity/pull/1183#issuecomment-6776723484).
- R30 PR attempt1, entry22:0/31, jobs_candidate42601; all six companions SUCCESS.
- External e7 attempt2, entry23:24/31, cycle-start240s failure; full ledger passed; last cycle started44/completed43,134ACKs,45START calls/44reservations. The outstanding START outcome remains UNKNOWN. Newly executed Lifecycle passed4/4. Its UI/Store/Persisted/Atomic/Auth SUCCESS statuses carry forward attempt1 evidence; only Repository, Lifecycle and aggregate newly executed. Root and its auditor triggered no rerun.

The JSON evidence includes complete native receipts, final jobs, full-log pins and source/attempt identity. Successful cleanup or later Lifecycle success does not erase either attempt's failed M04 acceptance.

## 7. Frozen budgets, risk and access boundaries

240s effects+60s cleanup/300s total;4outer lanes/4native per family;8activeNative/256total/16terminal reserved;8callbacks/128total;30s outer/5s child;3clusters/2children/40aggregate work connections/2M04observers/1method observer/16fixture connections per cluster. Full history traversal and every proof boundary remain.

No local project/parser/SQL/native/socket/build execution, installation/download/clone/reconstruction/replacement environment or git fetch/push. No hosted DB/Auth/RLS/ACL/migration/credential action, Auth logs, real source/provider/research calls, scheduler/notification/publicV3/paid activation or recurring cost. Immutable primary software-source/docs reads and pure text/data analysis remain allowed. Project execution occurs only in existing CI after reviewed publication.

SQL UNAPPLIED; Method NOT_APPROVED; #1139 NOT_RELEASE_READY with17pre-Owner gaps; #1131 Ready STOP, both#1135 holds, target-specific#968 isolation, #911/#913 privacy. D1#1169 remains separately unfinished. #917 readback UNKNOWN / Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch or human SQL substitute. No premature Owner-approval request.

No new P0 is established in this bounded review. P1 acceptance and target/authority gates remain unresolved. Existing P2 privacy holds remain. P3 performance/operational proof remains limited: the two-byte fix has no runtime result yet and native timing is not a Production SLO.
