# M04 current handoff — R30 / Recovery V21

**2026-11-10 19:00:35 UTC: independently reviewed finite source correction; current-base publication and new-head execution pending.** This file is a pre-publication snapshot. Later exact-head receipts in the linked R30 Draft PR, [origin PR #1182](https://github.com/Jetnity/jetnity/pull/1182), and [canonical #751](https://github.com/Jetnity/jetnity/issues/751) determine the live state. Source review is not runtime or Technical-Lead PASS.

## Latest integration baseline — V21 amendment v3

Before publication Root detected the independent merge of travel-plan PR#1181 at2026-11-10T18:49:29Z. Current main is **e7aae86c18238033c2186722e24c84dc7a5f69b9**, tree **8918d48841c19ddaf16c128973a0f03eed481f43**, orderedparentsdb954248dc3181786b5a00e8f9e714ab7336e8b1 and7ca9b96c93b2f59b1ac7d5ca5304c80d9fd090ff. [Binding V21 v3 integration amendment](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6776400921).

Full tree comparison confirms36 intervening leaves (27modified/9added/0removed), with zerooverlap across all18M04 sources and all11R30paths. All source baseline blobs are identical; source content,author delivery and review pins are unchanged. All838 directory hashes of the new10241-entry/9404-leaf tree independently reconstruct. Root constructs the R30 tree from this current base and preserves every parallel change. Expected result:9407leaves/9396priorleaves unchanged/3newrecords.

Historical failure20 remains42869514552 ondb954; current e7 push CI42879088258 is inprogress at this snapshot and is not reclassified. It is a parallel-product merge run, not execution of the new R30 SQL digest. Current Productiondpl_2QAy8s3qEWtinWYUwBeQTeFjtUwf is READY/exacte7 through bothaliases; olddb954Production is superseded.13openPRs/allDraft/48issues. No new Owner or Guardian clearance.

### Later completed-job observation before R30 publication

Root independently observed Lifecycle130050220698 terminalFAILURE on current e7 main run42879088258 at2026-11-10 18:59:20UTC before reading its completed non-Auth log. The job passed3/4 tests; the actual mounted browser test failed with spawnSync /usr/bin/google-chrome ETIMEDOUT at browser.ts:55:23 during version discovery, with no actual mounted receipt. Full log161524UTF8bytes/SHA256b054c48129003cb7b9182d8cb26c67c0b2cb0c1828dc58c042b51354c82150c5. At that read, Repository and Atomic and therefore the overall run were still inprogress; no final whole-run or current M04 result is invented. This is additional parallel-main evidence, not R30 execution and not a runner-cause diagnosis. All R30 lifecycle/CI gates remain mandatory; no retry, timeout change or new browser implementation is authorized here.

## Actual recovery point and first unfinished step

The failed post-R29 historical main is **db954248dc3181786b5a00e8f9e714ab7336e8b1**, tree **6165d52d6d6f30bb4554a59f5d492b6c165f98eb**. Its ordered parents are4bfa8b466ebc0af761fc5050bb4c51d7e73400c7 and442c83d026cf5c3611adce479c86436b5200e850. #1182 was genuinely accepted on its R29 PR head and merged at2026-11-10T17:53:15Z. The actual merge tree is exactly the accepted PR tree.

**Actual-main CI42869514552 failed. M04 is unfinished.** The current recovery is R30, a bounded correction of that failed post-merge acceptance within the existing M04 slice. Do not repeat the unchanged known-failing run or treat the earlier PR success as main acceptance.

Read [Task V21](M04_RECOVERY_TASK_V21.md), [Root source review V21](M04_RECOVERY_ROOT_REVIEW_V21.md), [complete R30 evidence](M04_RECOVERY_R30_EVIDENCE_V21.json), the [versioned implementation amendment](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6775939100), and the original TASK V1/Phase-A freeze. New linked branch: **fix/official-truth-v3-m04-postmerge-r30-20261110**, based on currente7 under V21v3.

**First unfinished step at this snapshot:** Root publishes the exact reviewed two-file source delivery plus finite continuity, verifies the complete commit/tree/contents and unchanged identities, and runs all new-head gates. Only Root may decide TL-PASS, Ready and expected-head merge. The actual resulting main must then independently pass full CI/native and Production through both aliases. Every changed head invalidates earlier gates.

## Genuine R29 success, followed by actual failure20

R29 PR run [42866958332](https://github.com/Jetnity/jetnity/actions/runs/42866958332), head442c83d026cf5c3611adce479c86436b5200e850, completed SUCCESS in all8 jobs. Its synthetic checkout80719a5a508e207811fa3b9f2a3e8738e79d1583 has the same reviewed tree6165d52d6d6f30bb4554a59f5d492b6c165f98eb. Core8689/8687PASS/0FAIL/2 inherited layout skips/0cancelled. M04 native31/31,199702ms total/185mscleanup,27699/27699settled,4249/4249connections closed,2clusters stopped,0children/errors. FullR9,254/255/256ledger,64/65cycles,inherited761/minOwned4182 and final rollback/late-writer passed. Lifecycle4/4,13mountedstations,61/61observations,22native results and0source fetches. [Root exact-head PASS receipt](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6774905314).

The actual-main push [42869514552](https://github.com/Jetnity/jetnity/actions/runs/42869514552), exactdb954, completed FAILURE at18:10:49UTC. All6 companions succeeded; Repository130016684473 and aggregate130027156569 failed. Typecheck/Lint passed; Core8683/8679PASS/2FAIL/2inheritedskips/0cancelled. All5 hygiene checks and Production Build were skipped.

M04 passed24/31 groups, including both real R9 witnesses and the complete254/255/256 ledger. Group25/N05 failed at the unchanged240s effect limit. First23groups99859ms; ledger120839ms; cycles lastStarted/Completed23/22,69ACKs and23STARTs. The following unacknowledged enqueue outcome is UNKNOWN. Groups26–31, the complete64/65 boundary, inherited finalization and final rollback/late-writer were not reached. Zero inherited counters in the failed receipt indicate non-finalization, not a zero requirement.

Cleanup nevertheless completed:26684/26684settled,0pending;4242/4242connections closed;1cluster stopped;0children/errors;240270ms total/20mscleanup. Cleanup is not native PASS. [Complete actual failure receipt and log pins](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6775451056). Earlier19 failed runs and genuineR21/R29 successes remain separately preserved. The old R29 C1 identity assertion passed on actual main and is not the new failure.

## Exactly selected source correction

Only **exact_keys_v1** and **civil_date_v1** bodies change in jobs-candidate.sql. All29 declarations/attributes and other27 bodies, callers/history/error order, catalog, roles/ACLs, authority, quotas and rollback stay byte-identical.

The exact-key positive branch uses nested CASE to bound expected cardinality at32 and require equal actual-key count before deletion. Safe object and dimension-normalized array operands preserve scalar/NULL/multidimensional handling. A successful byte-bijection returns unforced expected=expected to preserve text-equality/collation initialization; every unsuccessful proof executes the unchanged ordered-array comparison. Maximum1024 candidate-key iterations; the cap is not a bound on copying undeleted nested values on a failed proof.

The date branch positively proves the Gregorian calendar range, then executes the same make_date and to_char roundtrip outside an exception block. The original guarded fallback remains for calendar-invalid values. It preserves timezone, collation and DateStyle context, including Pacific/Apia2011-12-30=false versus UTC=true. No arithmetic-only acceptance or forced UTC is introduced.

Native additions stay inside the existing N02 proof and fixture:8 fixed key rows plus36 literal dates in4 timezone/DateStyle contexts and8 timestamp cases in4 contexts. All original source bytes,36oldR24 rows/assertions,31groups/order,fullquota/waits/history/R9/cleanup proofs are retained. Loop variables prevent immutable constant folding across contexts; settings restoration is asserted.

Root, author and independent reviewer reconstruct identical source pins and exact inverses:
- SQL140539bytes/SHA256a61011a2bfd0d11c451302e8e434c25fec37f47415f34f3f25da785d1aea7174/blob36ce89a5bf9a3b4eae096701c3e33af3d85ad029.
- Native 191098bytes/SHA256f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0/blob0b3f7d9906687ec42171de5af60fed009d07b39f.

These are source checks, not execution. The static254-command fill model includes906266 exact-key calls and194055 civil-date calls across pre/post history. It identifies repeated operations, not server profiling or predicted milliseconds. History remains quadratic; no runner/flakiness cause or Production SLO is claimed.

## Ownership, publication and continuity

The same actual author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, session **/root/m04_durable_jobs_writer_g3**, confirmed availability and retained investigation after the user-reported connection interruption. Independent reviewer **/root/m04_recovery_source_review_g3**; CI auditor **/root/m04_recovery_ci_audit_g3**; live auditor **/root/m04_recovery_live_audit_g3**. Old G1/G2 remain unavailable; no historical or Cursor session is impersonated. Concrete review fixes return to this same G3 author. Author self-review never grants TL acceptance.

Root's finite publication is11paths:2source,3newV21 task/evidence/review records and6current entry files. Existing historical records and protected manifests are unchanged. Both the historical10232-entry/9395-leaf tree and current10241-entry/9404-leaf integration tree independently reconstruct all838 directory hashes exactly. Publication readback must preserve every unaffected leaf, including binary identities. The original checkout remains unavailable. Only immutable connector reads and in-session text/data transformations were used.

The already mandated **8-path documentation completion** remains HELD until genuine corrected actual-main PASS:2new Root completion records and6current entries, its own Draft PR/full exact-head gates/Preview, then actual docs-main CI/native/Production. Finally record resulting-head receipts on the existing PR/#751 without another self-attestation commit. STOP; no automatic product follow-on. D1#1169 remains separately unfinished.

## Live metadata and remaining risks

Root and the independent live auditor refreshed current main and Production after the parallel merge. **dpl_2QAy8s3qEWtinWYUwBeQTeFjtUwf** is READY,aliasError=null,exacte7; both jetnity.com and jetnity-app.vercel.app point to it,correctproject,noredirect.13openPRs/allDraft/48non-PRissues;no new Guardian or Owner clearance. Current e7 CI42879088258 is inprogress at this snapshot; prior failure20 remains ondb954. These baseline observations are not future R30 head gates. Refresh main/merge-base/ahead/behind/full diff,Actions,Preview,review threads,strict rules/NORMAL mode and special gates before integration.

P0: no new verified Production incident in permitted evidence; no platform-wide clearance. P1: failed actual-main acceptance and missing new-head gates block M04 closure. P2: history remains quadratic; countercosts and future budget margin/Production latency are unproved; bounded unknown-work behavior remains intentional. P3: two inherited layout skips and truthful historical session/checkout discontinuity remain.

## Fixed budgets and reserved Owner/access gates

240s effects+60s cleanup/300s total;4outerlanes/4native operations per family;8activeNative/256total with16terminal reserved;8callbacks/128total;30souter/5schild;3clusters/2children/40aggregateworkconnections/2M04observers/1methodobserver/16fixtureconnectionspercluster.

Method **NOT_APPROVED**; SQL **UNAPPLIED**; #1139 **NOT_RELEASE_READY** with E01,E04,E06,E07,E09,E10,E11,E13,E15,E16,E17,E18,E21,E22,E24,E25,E28. #1131ReadySTOP, both#1135holds, #911/#913privacy remain. For#968 the generic overlap has been removed; target-specific client/SSR/Auth binding remains unproved. D1#1169 is separate unfinished engineering, not an Owner-ready approval request.

#917's refused readback remains **UNKNOWN / Stage2 NOT_ATTEMPTED**, withoutretry/rephrasing/delegation/rerouting/transport switch/humanSQL substitute. No hosted DB/Auth/RLS/ACL/migration/credential action or Auth logs; no real source/provider/research call,scheduler,notification,new recurring cost or publicV3activation. No local project/parser/SQL/native/socket/build execution,installation/download/clone/reconstruction/replacement environment/gitfetch/push. Native execution only in existing CI after reviewed publication. No premature Owner-approval question and no automatic next slice.
