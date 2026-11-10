# R26 / Recovery Task V17 — canonical object reuse, CI pending

Captured: 2026-11-10T14:46:48Z. Same Generation2 author/session `/root/m04_durable_jobs_writer_g2`. Existing Draft #1182, baseline `45be21e57988d91dca3ee0758712f3ef5f39d744`, tree `95046b7d80b9d7e44d01c9a8a15b187577303c76`; origin #1178 remains historically merged.

**Current R26 Typecheck/native/runtime/TL-PASS/Ready/merge are false / not executed.** [Root's finite selection](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6770330334) permits two body changes in `canonical_v1` and 18 direct N02 oracles. Only a previously successful object at the same child depth may be reused, after exact full JSONB text equality under C. Parent-key/depth guards precede the lookup; a miss runs the original validator. All other functions, arrays/scalars, declarations, 31 groups and resource/time limits remain exact.

## Frozen source pins

- SQL: 139163 bytes / SHA256 `81bb875daa205d087b1f9faba7f3a41fd445bec14cbbe6b7a0aea628818ef820` / blob `ba65ca6be73f529bcf1a5e9dcd10985e3f8c0763`.
- Native: 177160 bytes / SHA256 `d413d4de82548af38cbd7f54f226c2a72c582b4fd3e913b557793d8a3e12548c` / blob `ac42eb501c68fa3f47e57175504d055e11d764b8`.
- All-18 aggregate: `aae92c558a32210c6f86d3140e00798fd6a36c5f942a9b4a8d9322ddc8a407ba`. Other 16 source pins unchanged.

## Actual preceding R25 failure

[CI 42830921607](https://github.com/Jetnity/jetnity/actions/runs/42830921607) on 45be is terminal failure: **five jobs passed; Repository, lifecycle and aggregate failed**. Typecheck/Lint passed; hygiene/build were skipped. The [complete Root receipt](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6769908832) records **23/31 native groups passed**, including N02's 36-case/72-mode matrix and both R9 witnesses.

Ledger group 24 hit the unchanged 240s deadline at zero-based started237/completed236 after **237 acknowledged commands**, no START/cycles; following database outcome **UNKNOWN**. First 23 groups: 100393ms; failed ledger: 138860.852048ms. Cleanup: 27068/27068 effects settled, 4242/4242 connections closed, one cluster stopped, zero pending/children/errors; 240365ms total / 29ms cleanup. Core: 8682 total / 8678 pass / 2 fail / 2 inherited skips / 0 cancelled.

The [separate lifecycle finding](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6769782473) is a 5s Chrome `--version` preflight timeout before fixture/browser creation and mounted assertions. Underlying cause is UNKNOWN. Browser source stays exact; its complete lifecycle proof remains mandatory on the changed head.

Root-prepared relative excerpt: `docs/official-truth-product-v3/M04_RECOVERY_R26_NATIVE_FAILURE_V17.txt`, 10385 bytes / SHA256 `6ab2683e2c19a5f586ae8b6cdf0a56debbe6be14808efe6918778d752d6df0f9`; not claimed present at historical 45be. Full native receipt: 3767 bytes / `71fd08178097253737823af68d19fa887b973ccd126c50d45950ad50b39d5299`.

All 15 prior failure objects, genuine R21 success, corrected separate R22 terminal metadata and both Markdown tails remain exact. Actual R25 is failure 16.

## Gate and STOP

The source model removes duplicate object traversals within one invocation; comparison/allocation overhead remains. History is still quadratic. No measured speedup, sufficient budget margin, causal runner/helper claim or Production SLO is asserted.

Root owns full new-head CI/native/lifecycle/Preview/review acceptance and mandatory actual-main CI/native/Production. All Owner/SQL UNAPPLIED/Method/#1139/#917/privacy/hosted gates remain. **AUTHOR STOP** after finite delivery; no author execution, publication, Ready, merge or follow-up slice.

## Previous author status — preserved verbatim

# R25 / Recovery Task V16 — ARRAY alternative, CI pending

Captured: 2026-11-10T13:55:02Z. Same author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. Existing Draft #1182; baseline `1aecc862c4b2710bb12c900195259ee25eb6f70d`, tree `bc79a7bc2bf09fcea57ab1f4e7ca4c773ce5b9f3`. Origin #1178 is historically merged; this remains its linked post-merge review fix.

**Current R25 Typecheck/native/runtime/TL-PASS/Ready/merge are false / not executed.** [Root's exact selection](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6769130908) replaces only the `exact_keys_v1` SELECT body with two ARRAY constructors. The R24 positive/fallback structure is removed. Original guards, safe object extraction, C-sorted element sequences and uncollated output `k` preserve the original NULL/duplicate/dimension/lower-bound/collation behavior.

Native changes only one comment and two labels that previously described the removed fallback. All 36 fixed cases / 72 default+C observations, original-expression differentials, queries and assertions remain. These are two selected modes; they need not be different effective collations in CI. All 29 declarations/attributes, other SQL bytes, 31 groups/order and 16 other source pins remain exact.

## Frozen source pins

- SQL: 138695 bytes / SHA256 `4861f083bffcc5fb662128bff01e687662d62f5e8e5bf6af3512efbaad8616aa` / blob `67f073a0d19b31309f8276bba62770a4f36f8fb9`.
- Native: 175150 bytes / SHA256 `ae583470991dd991e1775af845cd8dfe71c878770339adca00545e5e248b922a` / blob `89f8026cf0b96971f529d6ab59fe14a2fbfe6150`.
- All-18 aggregate: `7617013b8a5f8fd83e59d8ec577cd2e9aacfb51849850944fae1e3e6744b0d6d`.

## Actual preceding failure

The [complete Root receipt](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6768973326) records terminal [CI 42822302417](https://github.com/Jetnity/jetnity/actions/runs/42822302417) on 1aecc: Typecheck/Lint and six companions passed; Repository verification 129850630615 and aggregate failed; hygiene/build were skipped. **23/31 native groups passed**, including N02's 36-case/72-mode matrix and both R9 witnesses.

Ledger group 24 hit the unchanged 240s deadline at zero-based started228/completed227 after **228 acknowledged commands**, no START or cycles. Following database outcome **UNKNOWN**. First 23 groups: 102637ms; failed ledger: 136768.07127ms. Complete cleanup: 26776/26776 effects settled, 4242/4242 connections closed, one cluster stopped, zero pending/children/errors; 240422ms total / 38ms cleanup. Core: 8682 total / 8678 pass / 2 fail / 2 inherited skips / 0 cancelled.

Full log: 4252208 bytes / SHA256 `d551f43143f1b712bf072256f4949f81a09594b805c5d6c479ae0c2086d5e3e5`. Compact receipt: 3767 bytes / `7676783e6c3abd4cbf8499c4568c53f0176dd9473f3e7a91646ff93f9aaea67d`. Root-prepared relative V16 excerpt: `docs/official-truth-product-v3/M04_RECOVERY_R25_NATIVE_FAILURE_V16.txt`, 5391 bytes / `7ff00463ce28764756dcf0ce8ff3d1e2817e6928c5735219fdcf9dcdd1ce433c`; not claimed present at historical 1aecc.

This is the fifteenth distinct failure. All 14 prior failure objects, genuine R21 success, corrected separate R22 terminal metadata and both prior Markdown tails remain exact.

## Gate and STOP

The alternative reduces source subqueries from three to two and removes the aggregate/COALESCE and R24 extra operations; its valid path again sorts/builds both arrays. This is structural source reasoning, not a measured plan or speedup. Overall failed-run timings do not identify R24's helper as cause or establish regression. History remains quadratic; no budget-margin, full-cap Rule latency or Production SLO claim.

Root owns publication and complete new-head CI/native/Preview/review acceptance, followed by mandatory actual-main CI/native/Production. All 31 groups, full quotas, R9, inherited boundary, final N15, cleanup and 240+60/300s/resource limits remain. All Owner/SQL UNAPPLIED/Method/#1139/#917/privacy/hosted gates remain. **AUTHOR STOP** after finite delivery; no local/project/SQL/parser execution, author publication, Ready, merge or next slice.

## Previous author status — preserved verbatim

# R24 / Recovery Task V15 — source delivery, new CI pending

Captured: 2026-11-10T12:55:53Z. Same actual author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. Existing **Draft #1182**, baseline `ca6fcb8930e68e394156d67351ee087c4cddb180`, tree `c688145cd14af3c7675d63e4174f8c07f6b772f9`. Origin #1178 remains historically merged; this is its linked post-merge review fix, not another product slice.

**Current R24 Typecheck/native/runtime/TL-PASS/Ready/merge: false / not executed.** Root's [finite implementation authorization](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6767645250) selects only the capped positive path in `exact_keys_v1` and an additive N02 matrix. No author project/SQL/parser/test execution, publication or hosted access occurred.

## Exact source delivery

- SQL: 139034 bytes / SHA256 `9dccc0108dd8397730c968c1bfb944100e963932f64dcc34442b00b1e71a0f42` / blob `af60edee3776d9eba5b13b6db3cfad733b245567`.
- Native: 175160 bytes / SHA256 `f1221afc362db3f49232ce02bfc45233f498590e4c79f00d5a559b3e907adf1a` / blob `560c1cebc71ce21936b08d3d6296de0a8edea843`.
- All-18 aggregate: `daf5cd8a8644e0a37d5903f2e95d95bec8b9b458ad19204751b0ddccebdbc9a3`.

Only the existing helper body changes. An actual nested CASE selects object JSONB with a one-dimensional expected array of at most 32 elements. Membership, deletion-empty and equal cardinality must all prove true; every other case uses the full original expression verbatim. The selector is not a new acceptance limit. All 29 declarations/attributes, other SQL bytes and 16 other source pins remain unchanged.

One 6625-byte N02 insertion adds **36 fixed cases in one read-only SELECT**, with literal booleans and the original expression as independent comparison, each in default and explicit C mode. All previous queries, the existing 36-query R22 block, R23 annotation and all 31 group names/order remain exact. Current runtime coverage is pending.

## Actual preceding failure

Root's [R24 investigation receipt](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6767105970) records terminal [CI 42812226588](https://github.com/Jetnity/jetnity/actions/runs/42812226588): Repository verification 129816262544 and aggregate failed; six companions passed. Typecheck/Lint passed; Tests failed; hygiene/build were skipped. **24/31 native groups passed**, including N02, both R9 witnesses and full ledger. Cycle group 25 reached the unchanged 240s budget at indices 37/36 after **113 acknowledged commands and 38 STARTs**; the following database outcome is **UNKNOWN**.

All 26926 effects settled and all 4242 connections closed; one cluster stopped, zero pending/children/cleanup errors. Total 240470ms / cleanup 21ms. Core: 8683 total / 8679 pass / 2 fail / 2 inherited layout skips / 0 cancelled. Full terminal log SHA256 `2b15d0fe865df0cce10a6b7bba74c45797927cbc54138118e8258dbd90672b09`; complete compact receipt SHA256 `4341b23118a220ce190efd38b21ee0fcb8c070ad9e3f7b5a5b00682566da849c`.

This is the **fourteenth distinct failure**. All 13 earlier failure objects and the complete genuine R21 PR success remain exact. Separately appended later metadata records R22 run 42810301725 as terminal FAILURE with six companions successful; its original 11:49:52 in-progress snapshot remains untouched, and its Tests/M04 never executed.

Root-prepared relative excerpt: `docs/official-truth-product-v3/M04_RECOVERY_R24_NATIVE_FAILURE_V15.txt`, 5880 bytes / SHA256 `4de4a4325b4987078774e75fb62a2a6d7f2e4ed6a36f57288c25e0a0f29ead7e`. This new V15 file is not claimed present at historical ca6f.

## Remaining gate and ownership

Root independently reconstructs/reviews, publishes with the expected-head lease, and requires full new-head CI/native/Preview/reviews plus mandatory actual-main CI/native/Production before closure. The 240s effects + 60s cleanup / 300s total, both full quotas, R9, inherited 761-pair/minOwned4182 proof, final N15 and all resource bounds remain unchanged. No measured speedup, budget margin or Production SLO is claimed; history validation remains quadratic.

SQL UNAPPLIED, Method NOT_APPROVED, #1139/17 gaps, forbidden #917 lane and every other Owner/privacy/hosted gate remain. **AUTHOR STOP** after this finite delivery; no Ready, merge or automatic next slice.

## Previous author status — preserved verbatim

# M04 Phase B — R23 / Recovery Task V14 current author status

**AUTHOR STOP; the new type-only correction is prepared and unexecuted.** Current PR [#1182](https://github.com/Jetnity/jetnity/pull/1182) remains Draft; origin #1178 remains historically merged. Same Generation2 author/session.

## Exact failure and correction

Published head `54c475a25e626fd811a2c523a3247a7523d1891c` / tree `aaaea9f8c46909c8614c33d66a48a7900edcdc0e` failed Repository verification 129809743296 in [CI 42810301725](https://github.com/Jetnity/jetnity/actions/runs/42810301725). Root confirmed that job terminal before reading its non-Auth log. Typecheck reported TS7022 at native.ts(861,17). Lint, Tests/M04, hygiene and build did not execute. **There is no native or cleanup receipt for this failed attempt.** Overall CI was still in progress at Root's 11:49:52 UTC observation; this record does not invent companion or whole-run completion.

[Root dispatch V14](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6766572359) authorizes only `: Record<string, unknown>` on the new lease-oracle local `value`. The annotation adds exactly 25 ASCII bytes. Removing it restores the published native.ts exactly; initializer, runtime expressions, all 36 queries, 31 groups/order, SQL and 17 other source pins remain unchanged.

Final native: 168535 bytes; SHA256 `dbc3ad51567753dd5ebc71fe6106504f5a6d112f73aed8e62f136454a8c626a2`; Git blob `2be195a3346213b12a9498a07ae398dc9922dae1`.

All-18-source aggregate: `1d30c2168051a359797cd6700ee3e1d6dab7b023a026119a1377cd8ee880d2bc`. SQL remains `9a92e0b8d9b948df49e5c1557aa116af37607e6e282dd3af897be5b84bcf567f`.

All twelve earlier failure objects, separate genuine R21 PR success/Root PASS/merge and previous Markdown tails remain exact. The confirmed terminal Typecheck-job failure is appended as record thirteen. The last actual native progress remains the earlier main-4bfa receipt; it is not assigned to this non-executed M04 attempt.

Root's [safe V14 excerpt](M04_RECOVERY_R23_TYPECHECK_FAILURE_V14.txt): 1989 bytes, SHA256 `6cd22336ecb4d4ddbefc46dd8cb897c35b475fb88210f9c78324ade5821b4751`. This is a Root-prepared relative publication path, not a file claimed at historical head 54c4.

Current R23 Typecheck/native/runtime/TL-PASS/Ready/merge acceptance is false. Root must reconstruct/review this delivery, publish a new head on Draft #1182 and obtain complete unchanged exact-head CI/Preview followed by the required actual-main CI/Production gates. No local/project/parser/SQL/native/build execution, installation, forbidden logs/hosted/#917 action or publication by the author. All special Owner/privacy gates remain; no automatic next product slice.

## Previous author record — preserved verbatim

# M04 Phase B — R22 / Recovery Task V13 current author status

**AUTHOR STOP for independent Root review; R22 is prepared and unexecuted.** Same real Generation2 author/session. Current fix PR number is pending Root creation on `fix/official-truth-v3-m04-postmerge-r22-20261110`; **origin #1178 is already merged**. This is its finite post-merge review fix, not a new product slice.

## Historical acceptance and current blocker

- R21 head `ed41061cf144e5710bf49bacc729b60ac28543c7` genuinely passed all 31 native groups and all eight jobs in [CI 42798428417](https://github.com/Jetnity/jetnity/actions/runs/42798428417). [Root FINAL PASS](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6765250488) and the merge remain valid historical events.
- Actual main `4bfa8b466ebc0af761fc5050bb4c51d7e73400c7`, the same tree `793026a2c26725da06ff281924aaa561d43ee32f`, then failed mandatory [post-merge CI 42801478210](https://github.com/Jetnity/jetnity/actions/runs/42801478210). It passed 24 groups and the full ledger boundary, but group25/N05 timed out at the unchanged 240-second effect budget. Cycles acknowledged 103 commands and 34 STARTs; the next command's final database outcome is UNKNOWN. Groups26-31 were not reached.
- Root's actual-main receipt reports 27209/27209 settled, zero pending; 4242/4242 connections closed; one cluster stopped; zero children/cleanup errors; 240472ms total/34ms cleanup. Core: 8683 total, 8679 pass, two failures, two inherited layout skips, zero cancelled. All six companion jobs passed. Closure remains held.

The JSON records preserve all eleven prior failure objects exactly and append this twelfth failure. Genuine R21 success, its complete receipt and Root decision/merge are separately retained. Historical success cannot accept changed R22 bytes.

## Frozen R22 delivery

| Source | UTF-8 bytes | SHA256 |
|---|---:|---|
| jobs-candidate.sql | 138753 | `9a92e0b8d9b948df49e5c1557aa116af37607e6e282dd3af897be5b84bcf567f` |
| native.ts | 168510 | `e296958fec8e6d7afa113ccb4d24f4d7a2434cb1e3bc232ac120eb2a9efb2ec1` |

All-18-source digest: `8aa1579386054a9a991cc9dd63c0b61b96f60e716a731f956b66c4b5b210e77b`. Other 16 pins remain unchanged. SQL delta is confined to Discovery local canonical reuse and two acquiredAt expressions, with one local declaration. Native adds one 7192-byte N02 block containing exactly 36 direct queries. All 29 declarations, 31 groups/order, R9, full quotas, final N15, history/authority/error ordering and budgets remain.

Discovery reuses the first validated Pair/Method bytes, preserves actual-kind scalar validation and uses a C-collated unique root insertion only for actual string countries; all other shapes retain the original second expression. Lease reuse requires exact C-equal original time text at the two existing guard positions; unequal/NULL input retains the original parser. Both expiry calls remain.

The independent reviewer caught two unpublished candidate issues: a forbidden extra claim root-kind and missing C collation on the new anchor lookup. Both were corrected under [dispatch v4](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6766052044); discarded pins were never published or executed. Final source pins were independently reconstructed. This is source review only.

Root-owned [actual-main failure evidence](M04_RECOVERY_R22_EVIDENCE_V13.json) and [safe excerpt](M04_RECOVERY_R22_NATIVE_FAILURE_V13.txt) accompany Task/Review V13. Excerpt: 8774 bytes, SHA256 `6d4b9d408c306e4eb638d7f436801575a5d8b41504f53665349c8c7432e6669a`; relative publication paths, not files claimed present at historical main4bfa.

## Remaining gates

All current R22 execution/native/runtime/TL-PASS/Ready/merge fields are false. Root must independently verify the complete source/document delivery, publish the linked Draft, and obtain unchanged full exact-head CI/Preview plus later actual-main CI/Production. No author local/project/parser/SQL/native/build execution, installation or Git publication occurred. No guaranteed speedup or margin, full-cap Rule latency or Production SLO is claimed; history verification remains quadratic.

Method NOT_APPROVED; #1139 NOT_RELEASE_READY/17 gaps, #917 refusal/pending/UNKNOWN/Stage2 NOT_ATTEMPTED, #1131 Ready STOP, both #1135 holds, #968 and #911/#913 remain. No hosted/Auth/credential/migration action, provider/research/activation, #917 retry or automatic follow-up slice. D1 remains separate.

## Previous author record — preserved verbatim

# M04 Phase-B author delivery status V1 — R21 current

**R21 FROZEN SOURCE / AUTHOR DOCUMENTS COMPLETE; NEW EXACT-HEAD EXECUTION PENDING.**

Same author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. [Finding](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6761461251), [authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6761489935). Baseline `d51d420a0ba83c56c7cf72166b5d328491fe54a5`, tree `dd75f8b57600f3dd588efbf4049b8642d77ca714`.

## This correction

Three canonical string outputs serialize the existing JSONB scalar instead of reconstructing it from decoded text. All type/ASCII checks, key encoding and every other SQL byte remain. One 1555-byte N02 insertion adds nine direct queries with fixed escape/empty/string-null and mixed nested-string oracles. All prior tests, 29 declarations, 31 groups/R9, histories, authority checks and 240s effects +60s cleanup/300s total remain.

| Source | Bytes | SHA256 | Git blob |
| --- | ---: | --- | --- |
| jobs-candidate.sql | 138224 | `063180813b9a4fac6df1493202c3e45c1b6d711de92cf9edcb2c7910b44e2080` | `eef54d2e51a16987f9b77049fdf6efc8a3229df5` |
| native.ts | 161318 | `c4001fd857386f2b789852f346086cb0167ffd627959802d65baf6d11bd86104` | `abbbd77b0896876877e8aa1dd0dd786d6d39c03f` |

18-source aggregate: `11183e770f0c39dc51878e38b0a92a76a7b05a974f681bea13b87857daae60c6`. Sixteen other source pins remain unchanged. The transient store was lost during interruption; exact d51 GitHub reads and in-session hashes restored the already frozen sources and baseline author documents. The four R21 documents were unfinished before interruption and are completed in this delivery. No local project/parser/SQL/native/build execution or Git/hosted mutation occurred.

## Latest historical failure

[CI 42771272293](https://github.com/Jetnity/jetnity/actions/runs/42771272293): completed/failure; Repository 129679380018 and aggregate 129685618326 failed, six companions succeeded. Typecheck/lint passed; tests failed; hygiene/build skipped. Root independently reread the complete non-Auth log and supplied the exact receipt.

First 23 groups passed, including all R20 N02 cases and both R9 witnesses; group-time sum 102604 ms. Group 24 N05/A03 hit the global effect deadline after 136801.231224 ms; seven later groups were unreached. Ledger indices started/completed: 215/214, with 215 acknowledged commits. **The next call's final database outcome is UNKNOWN.** No START or cycle group was reached.

Core: 8682 tests, 8678 passed, 2 failed, 2 inherited skips, 0 cancelled. All 26644 operations settled and 4242 connections closed; one cluster stopped, zero pending/children/cleanup errors. Total 240376 ms, cleanup 26 ms. Full log 4251668 bytes/63148 lines/SHA256 `457e33fe7739810de9ae0b21f6b5206d976953120decddd61e44545054cc2470`. The newly recreated V12 excerpt is 6417 bytes/SHA256 `e2ace2b4101afc9b63f0bbcb636f003c33aaa9766f4950f27299155d2b9b0da9`.

## Acceptance boundary

The 106 avoided value reconstructions per representative dedup row are a source count only. No causal speed/runner conclusion, reliable budget margin or Production-SLO claim follows. Full-cap Rule latency remains unproved.

All eleven historical failures remain separate; prior ten objects and Markdown tails are exact. All 18 pins, 22 current-unexecuted rows and 31 obligations remain. Current R21 execution/PASS/Ready/merge are false. Historical 64/64 author results were not rerun. **AUTHOR STOP.** Root owns V12 publication and complete unchanged new-head CI. All Owner gates, including Method NOT_APPROVED, #1139/17 gaps and #917 refusal, remain. No activation or next slice.

---

## Historical R20 and earlier author records

The exact previous records follow unchanged; their current headings belong to those historical cuts.

# M04 Phase-B author delivery status V1 — R20 current

**R20 LOCAL VALUE REUSE PREPARED; ROOT REVIEW AND NEW EXACT-HEAD CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. [Failure diagnosis](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760723089) and [finite authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760854161). Baseline `72868a287280a6c1d96222268a1413110ec95039`, tree `06ac3e6d4eedbb3e42795bff942b19364a45a848`.

## Authorized correction

Only canonical_v1's three numeric branches/declaration and job_v1's updated timestamp assignment change. Each accepted number uses one exact numeric conversion instead of four; both existing trunc calls and the original IF/output structure remain. Updated time reuses the already validated created time only when their original extracted texts compare equal under explicit C collation. Different or null text retains the original parser. Created validation and every lease/backoff/lifecycle predicate remain byte-identical.

One N02 insertion adds exactly 24 direct queries: ten timestamp cases for each kind and four raw numeric cases. Prospective records use the existing coordinator helper without journal writes. The cases cover valid equality/fallback, invalid equality/fallback with keys retained, wrong types, reversed chronology, noncanonical same-instant text, mixed numeric leaves and precise fractional/unsafe refusal. Existing R19 cases remain unchanged.

All other SQL/native bytes remain exact. All 29 function signatures, 31 proof groups/order, R9, actual quota histories, catalog/authority flow, ownership, resources and 240s effects +60s cleanup/300s total remain.

## Frozen pins

| Source | Bytes | SHA256 | Git blob |
| --- | ---: | --- | --- |
| jobs-candidate.sql | 138254 | `18c5d6c7f724e9c90c2f6e2aa96b429afb397d405db355057071d195b1c5417e` | `779f45640fa80d1f64282191d94ed365e7fdb31a` |
| native.ts | 159763 | `7c1770792308989ee09dd460d97cc7df0c1193f45326612c842147abd3020810` | `810ed62e7c19e7f3d88d2ce9e88e767dcacaa39d` |

Eighteen-source aggregate: `cd76347b518c7c8cecd5661e73886712a8597164c8f98b3c8acebc84be9ae87e`. Sixteen other source pins and rollback remain unchanged. This is a held-text preparation; no project/parser/SQL/native/build execution, environment reconstruction, network/log read or Git/hosted mutation occurred.

## Actual historical execution

[CI 42767273189](https://github.com/Jetnity/jetnity/actions/runs/42767273189) is terminal **completed/failure** at the baseline head. Root independently read the complete terminal non-Auth log and supplied its safe receipt. Repository 129666585217 and aggregate 129670976070 failed; all six companions succeeded. Typecheck/lint passed; tests failed; hygiene/build skipped.

First **30 of 31** groups passed, including R19 N02, both R9 witnesses and both full quota groups. The first 23 group times sum to 75116 ms; ledger N05/A03 took 78506 ms, start-quota N05 took 83847 ms, and all 30 completed groups total 238267 ms. Final N15 hit the global 240-second effect budget after 174.23375 ms within that group. Its exact failing statement is unknown.

Ledger: last fill index 253, 256 acknowledged commits and one START; 258 command preparations/463 ms and 260 fulfilled fixed calls/78236 ms. Cycles: last index 63, 193 commits and 64 STARTs; 194 preparations/355 ms and 260 fixed calls started/259 fulfilled/83650 ms, including the expected rejected pointer call. These are rounded client-await durations, not SQL-function profiling.

Core: 8689 tests / 8685 passed / 2 failed / 2 skipped / 0 cancelled; 557126.408018 ms. Cleanup: 27554/27554 operations settled, zero pending, 4245/4245 connections closed, two stopped clusters, zero children/errors; 240184 ms total /16 ms cleanup. Inherited commit-guard pairs 761 and minimum-owned count 4182 were reached.

Full non-Auth log: 4253591 UTF-8 bytes /63178 lines, SHA256 `ef023cffe525fbaed3491199a8292dcb6cf92a30d62aad74f7ae4f5adebca2f8`. All ten failed histories remain. Historical partial success is not current-head acceptance.

## Work model and remaining gate

The 254-fill pre/post history scans produce 64516 row validations. Their queued records have identical created/updated text, so the new assignment removes 64516 timestamp parser calls and the same number of nested civil-date calls in those transitions alone. A representative Discovery dedup row has 39 numeric canonical leaf visits, removing 117 written conversions. These are source-derived operation counts, with no measured or promised wall-time improvement or CI completion guarantee.

Every history row and scalar remains checked. Historical full-cap fixtures use Discovery; full-cap Rule latency and Production capacity/SLO remain unproved.

Current R20 source is **unexecuted**. Historical 64/64 author checks were not rerun. The 18 pins, 22 current-unexecuted coverage rows, 31 groups and exact previous Markdown records remain. **AUTHOR STOP FOR ROOT REVIEW.** Root owns V11, publication and complete unchanged exact-head CI, including final N15. No TL PASS, Ready, merge, activation or next slice. Method NOT_APPROVED, #1139/17 gaps, #917 refusal and all existing Owner gates remain.

---

## Historical R19 and earlier author records

The exact previous records follow unchanged. Their current headings and execution claims belong to those historical cuts, not R20 acceptance.

# M04 Phase-B author delivery status V1 — R19 current

**R19 TWO-HELPER SCALAR INLINING PREPARED; ROOT REVIEW AND NEW EXACT-HEAD CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. [Diagnosis](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760204443) and [finite implementation authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760293239); baseline `f29ff3914f6731789f03970e1263a82b93844e3c`, tree `98a8b38b1f7d95fb2cd788dd347490d36f33a772`.

## Authorized implementation

Only canonical_v1 and nodes_v1 bodies change. Their existing object/array loops process scalar leaves directly and recurse into container children. Every scalar is still validated/formatted/counted. Child-depth checks precede scalar processing, preserving empty containers at maximum depth while refusing children beyond it.

Canonical root guards and scalar branches, C key order, key/string ASCII checks, array order, escaping, safe integral-number rules with trunc(numeric)::text, boolean/JSON-null output and P7601 message remain unchanged. Nodes root argument guards, SQL NULL refusal, JSON null weight one, extra object-key weight, array weights and count/depth limits remain unchanged.

All other SQL bytes remain exact, including full history scans, command/transition checks, catalog inspection, transaction staging, final S1/MA1 authority, R18 reuses, roles/ACL and rollback. All 29 function signatures/attributes remain.

One finite N02 block adds fixed direct-helper oracles for roots and both nested scalar paths. It covers ordering/escaping, control/non-ASCII keys and values, raw numeric text, SQL NULL, depth/argument limits and exact small count/cap boundaries. Existing text() maps JavaScript null to empty text; only the new nullable queries use NULLIF before casts so actual SQL NULL reaches helper guards. The shared transport is unchanged.

Every other native byte remains exact: R18 regressions and age 68 isolation correction, all 31 groups, both R9 cases, quota fixtures/diagnostics, histories, timers, ownership and cleanup.

## Frozen pins

| Source | Bytes | SHA256 | Git blob |
| --- | ---: | --- | --- |
| jobs-candidate.sql | 138052 | `5a05e41a7834307b8f28279493620d65150d8fc1a9b5b7f679d905de638787f8` | `b33072933f6a674478888e78284625983a084756` |
| native.ts | 157346 | `d50276c81d23f78c74baf12f110e72d6675aaa14e5061fbe13e4b2d199ffc582` | `6b5cc1a17f44fcb00acf2151f28d50887c3f2745` |

Eighteen-source aggregate: `69a61d7e59970c2bc71212ebc3225fdd039e6edbb2f904a5943b3cf6c3b550c6`. Sixteen other source pins remain unchanged. Scope checks were text-only; no project/parser/SQL/native/build execution occurred. Eighteen pins, twenty-two current-unexecuted coverage rows, thirty-one groups and exact previous Markdown records remain.

## Actual historical failure

[CI 42763390608](https://github.com/Jetnity/jetnity/actions/runs/42763390608) is independently verified **completed/failure**. Repository 129654116009 and aggregate 129658414629 failed; all six companions succeeded. Typecheck/lint passed; tests failed; hygiene/build skipped.

First 23 groups passed, including R18 N02/N03 and both actual R9 witnesses. Their recorded group times sum to **85796 ms**. Group 24 N05/A03 reached the unchanged 240-second effect budget after **153758.244793 ms**. Seven later groups were not reached.

The quota receipt reports zero-based last started/completed indices **240/239**, 241 successful command constructions (427 ms), 242 fixed calls started/241 resolved (153556 ms including the absent probe), and **240 acknowledged command commits** from 241 started command calls. No START was reached; the later cycle group did not start. **The final database outcome of the unfinished next call is UNKNOWN.** Durations are rounded client-await aggregates including transport, not server-function timings.

Core: 8682 tests / 8678 passed / 2 failed / 2 skipped / 0 cancelled; 649469.896049 ms. Cleanup: 27042/27042 settled, zero pending, 4242/4242 connections closed, one stopped cluster, zero children/errors; 240339 ms total / 22 ms cleanup.

Full non-Auth log: 4250826 UTF-8 bytes / 63142 lines, SHA256 `63cdb80bd138389acb0fe6efbe52b5b54e0db6c502245dc252f687d726d59b91`. All **nine** failed CI histories remain; historical partial progress is exact-head evidence, not current acceptance.

## Work model, limits and STOP

The source model gives N squared pre/post history-row visits for N acknowledged new fills: 57600 for the first 240. The representative queued Discovery dedup row changes recursive canonical-helper entries from 208 to 38 and node-helper entries from 24 to 3 while still processing every scalar. These are source-derived call counts, not measured costs or a predicted wall-time improvement.

**No measured or promised speedup or full CI success.** Every history row remains checked; full-cap Rule latency and Production capacity/SLO remain unproved. All actual 254/255/256 and 64/65 boundaries and 240s effects +60s cleanup/300s total remain mandatory.

Corrected R19 source is unexecuted. Historical 64/64 author checks were not rerun and do not validate it. **AUTHOR STOP FOR ROOT REVIEW.** Root owns Task V10, publication and full exact-head acceptance. No Ready, merge, hosted action or next slice. Method NOT_APPROVED, #1139/17 gaps, #917 specific refusal and all other Owner gates remain.

---

## Historical R18 and earlier author records

The exact previous records follow unchanged. Their current headings and source/execution claims belong to those historical cuts, not R19 acceptance.

# M04 Phase-B author delivery status V1 — R18 current

**R18 SAME-SESSION PURE SQL REUSE AND QUOTA PROGRESS PREPARED; ROOT REVIEW AND NEW EXACT-HEAD CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. [Root dispatch and finite authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6759595208); baseline `1d8eeddd8e2da9341f659f2b024e653c5ba5d310`, tree `224d89c68fbc665c39298b9c16bede277f87596f`.

## Authorized changes and preserved checks

In command_v1, explicit SQL NULL rejection keeps the original P7601 command error. The canonical text of unchanged input v is computed once and reused for the existing 65536-byte bound and command text/key. All shape, identity and domain checks remain. canonical_v1 still enforces depth, ASCII keys/strings and numeric rules; wire_v1 retains its separate node-count guard.

In transition_v1, only the internally selected deduplicated enqueue branch reuses n:=expected after full validation of the prior job. Every other or NULL branch validates its derived next job. Supplied-next equality and all audit, deadline, fence, command and identity checks remain. No shared cache, caller trust flag, extra object or signature is introduced.

N02 adds both-kind canonical text/key/value parity, exact original SQL-NULL and canonical-size guard oracles, and JSON-null refusal. N03 uses unused Rule age 68 and coherent Discovery CH → SE, each with a real absent probe followed by real initial/dedup commands. Identical malformed current/expected/next must fail prior validation; a structurally valid distinct forged next must fail with persisted state unchanged. The accepted history contains exactly two actual commands.

Pre-publication P2 review caught that provisional Rule age 61 overlaps unchanged R9's computed helper range 61-63/65-67 (R9 main cases 60/64). The new N03 case now uses age 68; explicit and computed contexts were checked, and R9 remains byte-identical. This was a source-review isolation correction, not an observed CI failure.

Two constant-size progress records cover ledger fill and start cycles. They record finite group/boundary labels, zero-based last started/completed indices, started/resolved construction and fixed-call counts, committed commands, reserved STARTs and bounded aggregate elapsed times. Successful resolution differs from a committed/reserved result; an expected rejected probe counts as started only. Timings include client construction/transport/await and are not server statement profiling. Capping diagnostic values at 300000 ms changes no execution deadline.

Every actual 254/255/256 and 64/65 command/START/credit/token/fence/refusal/state/pointer assertion remains. All 31 groups and both R9 cases, full immutable history validation, catalog checks, final MA1 authority, ownership/cleanup and the 240-second effect / 60-second cleanup / 300-second outer ceilings remain.

## Frozen source

| Source | Bytes | SHA256 | Git blob |
| --- | ---: | --- | --- |
| jobs-candidate.sql | 136035 | `520e9b3435676ce38eb8312b22a2935f8449afbf4c9d31d36a7bf7d92382d984` | `8202f4a667f0953e01364cfffcc4507747bc24f4` |
| native.ts | 151886 | `9eb7de5270d0beffbfa2da1f38ef0478aca4858b98268f010eb65054f69643a5` | `55c4e57472efefd87d09065495e137e08fb88a24` |

Eighteen-source aggregate: `166f8b79e2a4b564b17a835e44cd0f5294ea80ce7ca005d8c3bfda32775d6859`. The other sixteen sources, rollback, protected sources, SQL signatures/catalog inventory, roles/grants, packages/workflows and budgets are unchanged. Three literal SQL replacements affect two functions; six native replacements add the authorized regressions/bookkeeping. Eighteen pins, twenty-two coverage rows and thirty-one group obligations remain.

## Actual historical CI

[CI 42758402735](https://github.com/Jetnity/jetnity/actions/runs/42758402735) is independently verified **completed/failure**. Repository job 129638063982 and aggregate 129644016381 failed; all six companions succeeded. Typecheck/lint passed; tests failed; hygiene/build were skipped.

The first **23 ordered groups and both actual R9 witnesses passed again**. R9 retains real SQL-wait evidence and target/control/holder identities, explicitly distinguishes backend absence from the still-held executor, and observes unavailable admission before drain, invalid admission afterward, no terminal effects and actual executor drain. Natural I1 timeout observed fail-confirm; worker caller abort is a separate case and is not an elapsed 30-second timer proof.

Group 24 N05/A03 reached the unchanged global 240-second effect deadline after **154781.596676 ms**. The failed iteration and individual SQL costs are unknown. Seven later groups were not reached. First-23 group times sum to 84770 ms. The R17 Discovery fixture correction alone did not make the full proof fit.

Core: 8682 tests / 8678 passed / 2 failed / 2 skipped / 0 cancelled; 642911.28969 ms. Cleanup: 26975/26975 settled, zero pending, 4242/4242 connections closed, one stopped cluster, zero child processes/errors; 240354 ms total / 35 ms cleanup. Full non-Auth log: 4249970 UTF-8 bytes / 63142 lines, SHA256 `c1fb0d06b046fd1658caedb0a1d3f132c714bbf5d319cb7a9586e1f7a02f2247`.

All **eight** failed CI histories remain. Historical partial progress is bound to its exact head; overall nativePass remains false.

## Limits and author STOP

**No measured or promised speedup or complete CI success.** Only duplicate pure computation in the same call is removed; every historical row remains checked. Full-cap Rule latency and Production capacity/SLO approval remain unproved. Repeated whole-history work remains a dormant performance limitation. The new counters provide bounded evidence if another failure occurs.

Original checkout absent; no reconstruction, installation or local project/parser/test/SQL/native/build execution occurred. Historical 64/64 author checks do not validate these changes. Corrected R18 source is unexecuted.

**AUTHOR STOP FOR ROOT REVIEW.** Root owns Task V9, publication and complete exact-head acceptance. No Ready, merge, hosted action or next slice. Method NOT_APPROVED, #1139 NOT_RELEASE_READY/17 gaps, #917 refusal and all existing Owner gates remain.

---

## Historical R17 and earlier author records

The exact previous records follow unchanged. Their source pins, execution statements and current headings describe their historical cuts, not R18 acceptance.

# M04 Phase-B author delivery status V1 — R17 current

**R17 SAME-SESSION DISCOVERY QUOTA FIXTURES PREPARED; ROOT REVIEW AND NEW EXACT-HEAD CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. [Diagnosis dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6759048050) and [exact implementation authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6759160977); baseline `69f4dcc78e8670099fb5997f825edf1027956b33`, tree `4dab49a12f05d1c57ab287130f4127ca28135ab2`.

## Authorized correction

Only the two native quota blocks change. The actual ledger proof uses coherent Discovery CH → IS; the actual start-cap proof uses CH → NO. Existing originals.context builds both contexts. Explicit identity assertions distinguish these subjects and prior CH → AQ. Each performs a real fixed queue_read probe returning absent before its first write.

Every actual 254-command fill, original claim 255 plus credit, START, blocked interstitial/no-effect snapshot, exact-token/fence terminal Fail 256, cleared credit/one disposition/exhausted state and beyond-cap refusal remains. All 64 enqueue/claim/START/fail cycles, 65th enqueue/refused claim, 193 commands/64 starts/64 dispositions and pointer-corruption refusal/restoration remain.

All full SQL history/catalog/lock/authority checks remain. There is no manual journal population, SQL/protected-source change, profiling instrumentation, timeout increase or skipped group. The other seventeen sources and all 31 native groups are unchanged.

- native.ts: **142485 bytes**, SHA256 `2e757ad2a3242e3881eba5b498c595a2447846157e3de698d17dd356d499375a`.
- Git blob: `20247c75ed2dd9c834304429c138054383913b1f`.
- Eighteen-source aggregate: `57169eb6ccf365164c1a334eee57bb887640c11e2342dd03d109c5444d999fc0`.
- Eighteen pins, twenty-two matrix rows and thirty-one native group obligations remain.

## Actual historical CI

[CI 42754606380](https://github.com/Jetnity/jetnity/actions/runs/42754606380) is independently verified **completed/failure**. Repository job 129625959864 and aggregate 129630534969 failed; all six companion jobs succeeded. Typecheck/lint passed; tests failed; hygiene/build were skipped.

The first **23 ordered groups passed**, including corrected N07/R4, all sixteen N08 originals and **both actual R9 witnesses**. R9 observed real S1 reserve waits, target/control/holder identities, backend absence while the executor remained held, unavailable admission before drain and invalid admission afterward, no terminal effects and actual retained-executor drain. Natural I1 timeout observed fail-confirm; the caller-abort case returned unconfirmed. This does not claim an elapsed 30-second worker timer.

Group 24 N05/A03 timed out after **149149.71633 ms** at the unchanged global **240-second effect budget**. The failed iteration and individual SQL timings are unknown. Seven later groups were not reached. First-23 group times sum to 90307 ms.

Core: 8682 tests / 8678 passed / 2 failed / 2 skipped / 0 cancelled; 655018.2848 ms. Cleanup: 26653/26653 settled, zero pending, 4242/4242 connections closed, one stopped cluster, zero child processes/errors; 240314 ms total / 20 ms cleanup. All seven failed CI histories remain; overall nativePass is false.

## Performance limitation and author STOP

The full planned 254-command fill requires 64516 historical transition validations; the following 192 commands and 64 START calls add 36864 and 12352 respectively. These are source-derived work counts, not profiling or the observed failed iteration.

**This changes shared-cap fixture data complexity. It is not a runtime optimization, full-cap Rule latency proof or Production capacity/SLO approval.** Quadratic historical Rule validation remains a dormant performance limitation. Existing Rule/S1/I1 and Discovery/S1 coverage remains. No speedup or complete CI success is promised.

Original checkout absent; no reconstruction, installation or local project/parser/test/SQL/native/build execution occurred. Historical 64/64 author checks do not validate this change. Corrected R17 source remains unexecuted.

**AUTHOR STOP FOR ROOT REVIEW.** Root owns Task V8, publication and complete exact-head acceptance. No Ready, merge, hosted action or next slice. Method NOT_APPROVED, #1139 NOT_RELEASE_READY/17 gaps, #917 refusal and all existing Owner gates remain.

---

## Historical R16 and earlier author records

The exact previous record follows. Its current wording and pins are historical; this R17 block and current JSON fields govern the new delivery.

# M04 Phase-B author delivery status V1 — R16 current

**R16 SAME-SESSION RAW-S1 FIXTURE CORRECTION PREPARED; ROOT REVIEW AND NEW EXACT-HEAD CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. [Diagnosis dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758625887) and [exact implementation authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758675083); baseline `07367f7ce4f811dabb43ba340650fab3f77585e5`, tree `4c552ee182feb1da2234fa342012bf4b534ec6f3`.

## Authorized correction

N07/R4 previously passed the decoded application record (reference/text/upload/completion) to a SQL consumer requiring the raw record (reference/text/outcome/audit). The unchanged SQL exact-key guard correctly refuses that shape.

The test now reads the actual raw persisted reply through the existing s1_read_v1 bridge using retained binding/digest/bytes. It requires decoded completion and exact equality between the actual raw envelope and decoded reference/text/outcome/audit. It does not fabricate a successful raw reply.

Both revision cases retain the old application DTO as an explicit P7604 negative, positively consume the actual raw reply with a bounded case/revision label, and clone that raw reply for the four existing missing/audit/link/archive negatives. Actual capture/reserve/finish/open, original text and final unchanged store.open equality remain.

Only native.ts changes. All seventeen other sources, SQL/rollback, protected helpers, permissions, packages, workflows and budgets are unchanged.

- native.ts: **141437 bytes**, SHA256 `1e25514e6baecf7e0c38d0cdbdbbaaa14f38a11b9693149b76a97bc0b56932a5`.
- Git blob: `732ec5389e26cc1f09c32626117588d23384e0d3`.
- Eighteen-source aggregate: `fd829dbf93171d8bc2d352cd02aa92126e8ee8ab64ac2fc0392d4863f63fb19e`.
- Eighteen pins, twenty-two matrix rows and thirty-one native group obligations remain.

## Actual historical CI

[CI 42751380067](https://github.com/Jetnity/jetnity/actions/runs/42751380067) is independently verified **completed/failure**. Repository job 129615553280 and aggregate 129620812719 failed; all six companion jobs succeeded. Typecheck/lint passed; tests failed; hygiene/build were skipped.

First N01/N02/N03/N07 passed in **42/2227/2728/12322 ms**. N07 includes all three R15 contexts and original number spellings. The next N07/R4 group failed P7604; the receipt does not identify a statement, case or predicate. The entry-shape mismatch is confirmed by exact source, not by a more specific log message. The remaining 26 groups and R9 witnesses were not reached.

Core: 8663 tests / 8659 passed / 2 failed / 2 skipped / 0 cancelled. Cleanup: 4576/4576 settled, zero pending, 870/870 connections closed, one stopped cluster, zero errors; 18928 ms total / 169 ms cleanup. All six failed CI histories remain preserved; nativePass is false.

## Author STOP

Original checkout absent; no reconstruction, installation or local project parser/test/SQL/native/build execution occurred. Historical 64/64 checks do not validate this source change. Corrected R16 source remains unexecuted until new unchanged complete CI.

**STOP FOR ROOT REVIEW.** Root owns Task V7, publication and complete exact-head acceptance. No Ready, merge, hosted action or next slice. Method NOT_APPROVED, #1139 NOT_RELEASE_READY/17 gaps, #917 refusal and all existing Owner gates remain.

---

## Historical R15 and earlier author records

The exact prior record follows. Its current wording and pins are historical; this R16 block and current JSON fields govern the new delivery.

# M04 Phase-B author delivery status V1 — R15 current

**R15 SAME-SESSION N07 FIXTURE CORRECTION PREPARED; ROOT REVIEW AND NEW EXACT-HEAD CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. [Task V6 dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6758201727); baseline `30c6299a76fda7b50493a46596a57af3777a7372`, tree `7746a6e6fe802262a94018005c4722c483142c82`.

## Finite correction

Only N07 setup in native.ts changes. The existing originals.context(country, originalDestination) builder creates coherent CH/DE/FR citizenship and passport links; each retains the same age 18 condition. The former inconsistent DE/FR variants are explicitly rejected by the unchanged protected reader. Actual contextKey and jobKey sets must each contain three distinct values.

The three raw spellings **18.0 / 18e0 / 1.8e1**, actual producer/S1/I1/MA1 path, exact stored original-byte equality, prepared outcome, completed disposition and succeeded job assertions remain unchanged. All seventeen other source files, including SQL and rollback, are byte-identical.

- native.ts: **140353 bytes**, SHA256 `a1e16286e9114b9a07271ddf4b9879f0714ad15295212dfe7016c157c2685dea`.
- Eighteen-source aggregate: `a21b19390e4e1b3d49022cb7a86848568c4439eff3c39e4963131331e93d1da0`.
- All eighteen source pins, twenty-two matrix rows and thirty-one native group obligations remain in the author JSON files.

## Actual completed groups and failure

[CI 42748744481](https://github.com/Jetnity/jetnity/actions/runs/42748744481) is independently verified **completed/failure**. Repository job 129607034059 and aggregate 129611926295 failed; all six companion jobs succeeded. Typecheck/lint succeeded; tests failed; hygiene/build were skipped.

The first **N01, N02 and N03 groups passed in 23, 1134 and 1532 ms**. N02 contains the completed R13 and R14 assertions. The first N07 group failed `assert.ok(parsed.ok)` at native.ts:662:61. The log does not serialize the failing loop index. The other 27 groups and R9 witnesses were not reached.

Core: 8662 tests / 8658 passed / 2 failed / 2 skipped / 0 cancelled. Cleanup: 2297/2297 settled, zero pending, 426/426 connections closed, one stopped cluster, zero errors; 5954 ms total / 155 ms cleanup. nativePass remains false. All five failed CI histories are preserved.

## Author STOP and limits

The shell is reachable but the original checkout is absent. No reconstruction, installation or local project test/parser/SQL/native/build execution was performed. Historical 64/64 checks do not validate this change. Corrected R15 source is unexecuted until new unchanged complete CI.

**AUTHOR STOP FOR ROOT REVIEW.** Root owns Task V6, publication, independent acceptance and full exact-head re-gating. No Ready, merge, hosted action or follow-up slice. Method NOT_APPROVED, #1139 NOT_RELEASE_READY/17 gaps, #917 refusal and all existing Owner gates remain.

---

## Historical R14 and earlier author records

The exact prior record follows. Its current wording and pins are historical; the R15 block and current JSON fields govern this delivery.

# M04 Phase-B author delivery status V1 — R14 current

**R14 SAME-SESSION FIXTURE CORRECTION PREPARED; ROOT REVIEW AND NEW EXACT-HEAD CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session `/root/m04_durable_jobs_writer_g2`. [Task V5 dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757910444); baseline `313c1db0d96d62f94f22c5db94c74bb75779f542`, tree `fdc1b62d266aba6f28a04c85ba358966f915dd36`.

## Finite correction

Only the N02 alternate-identity fixture in native.ts changes. The previously supplied full enqueue-shaped object is now explicitly required to return null. The alternate is constructed from exactly context, method, factKind and researchReason, using contextFor(60). It must exist and have a different jobKey and subjectText before the unchanged actual wrong-subject P7601 assertion.

The strict reader, forged-command/epoch rejections and unchanged-state checks remain intact. All seventeen other source files are byte-identical, including candidate SQL `a22e6a015c8fc5a268500659ace31a938d2ce3614625e9df1982308b73199a59` and rollback `9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66`.

- native.ts: **139506 bytes**, SHA256 `5cf0852b7ad101d6fa0a1d792c88657df9bb1d35a32d2bf7e2b4bd3765219921`.
- Eighteen-source aggregate: `23f9a54835534afe9a8ca9be5a1aa51c37c5e7ae1e90b15f9b5e014b0cc51e5f`.
- Both JSON files retain all eighteen pins, twenty-two coverage rows and thirty-one native group obligations.

## Actual evidence

[CI 42746442139](https://github.com/Jetnity/jetnity/actions/runs/42746442139) is independently verified **completed/failure**. Repository verification 129599589985 failed; all six companion jobs succeeded; aggregate 129604596107 failed. Repository typecheck/lint succeeded, tests failed, hygiene/build were skipped.

N01 passed in 28 ms. N02 failed at `assert.ok(alternate)`, native.ts:617:14. Core: 8660 tests / 8656 passed / 2 failed / 2 skipped / 0 cancelled; cleanup: 587/587 settled, 0 pending, 90/90 closed, 1 cluster stopped, 0 errors; 2569 ms total. R9 witnesses remain empty.

Completion of the earlier R13 restricted-runtime and same-OID rename/restoration checks is **inferred from sequential arrival at line 617**, with no individual assertion receipts. N02, all 31 groups and R9 have not passed. All four failed CI histories remain preserved.

Environment **UNAVAILABLE**. No new local test/typecheck/lint/parser/native/build execution. Previous 64/64 checks are historical; this corrected source is unexecuted.

## Author STOP

**STOP FOR ROOT REVIEW.** Root owns Task V5, independent acceptance, publication and complete exact-head re-gating. No Ready, merge, hosted operation or follow-up slice. Method NOT_APPROVED; #1139 NOT_RELEASE_READY/17 gaps; #917 refusal and all other existing Owner gates remain.

---

## Historical R13 and earlier author records

The exact prior record follows. Its current wording and pins are historical; this R14 block and the updated JSON fields govern this delivery.

# M04 Phase-B author delivery status V1 — R13 current

**R13 SAME-SESSION CORRECTION PREPARED. INDEPENDENT ROOT REVIEW AND NEW EXACT-HEAD NATIVE CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual session `/root/m04_durable_jobs_writer_g2`. [R13 dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757521662) resumes this session against published head `82b116fbb4c6f001f72e60459e83965edcaf8302`. Root owns Task V4, independent acceptance and publication.

## Correction and bounded regression

The runtime `execute_v1` runs as its existing `postgres` definer. Its invoker catalog guard previously resolved protected S1 predecessor names through `to_regprocedure`. PostgreSQL checks schema USAGE during that lookup; this role intentionally lacks USAGE on both S1 schemas.

The single SQL predicate now reads the OID already pinned in the fingerprint: `p.oid=(binding_row.fingerprint->>'oid')::oid`. The complete fingerprint comparison, including owner, ACL, configuration and definition hash, remains intact. The definition includes qualified function identity. No grant, role/owner change or protected predecessor edit is needed.

The existing N02 fixture now asserts that both postgres and the jobs caller lack USAGE on both S1 schemas and that the real restricted runtime probe succeeds. It temporarily renames the pinned `binding_valid_v1(jsonb)`, confirms the same OID, requires P7603 from the same runtime probe, restores the exact name in finally, compares the full catalog, and requires probe success again. This predecessor is not a direct parsed bridge target, so the test targets predecessor identity drift. These assertions are prepared source, not an executed result.

| Current source | Bytes | SHA256 |
| --- | ---: | --- |
| jobs-candidate.sql | 135947 | `a22e6a015c8fc5a268500659ace31a938d2ce3614625e9df1982308b73199a59` |
| native.ts | 138948 | `5b586cb8291caeb954f6afffb80d82a1666c9050e209e1df3bf0f81dc169f87c` |

Eighteen-source aggregate: **`5d33e2eef75e612b650bae2f2eb5ea0062918d1b7005ea2e2eb9bfba76b131f1`**. The other sixteen source pins are unchanged from 82b116f. All source pins and the complete U01-U07/N01-N15 map are in the two author JSON files.

## Actual CI evidence and its limits

[CI 42742925010](https://github.com/Jetnity/jetnity/actions/runs/42742925010), job129588134830, executed 82b116f: candidate installation succeeded, the first N01 group passed in41ms, and the first N02 group failed with PostgreSQL42501. The other29 groups, including both R9 native witnesses, were not reached. Core totals:8660 tests,8656 passed,2 failed(parent and N02),2 skipped,0 cancelled.

The receipt reports551/551 owned operations settled,90/90 cumulative connections closed, one stopped cluster, zero cleanup failures and3020ms total. It does not supply an exact SQL position. Attribution to N02's first fixed runtime probe is source-derived. The d9 and7ac failures remain separately preserved, so all three failed CI runs remain available.

The execution environment is **UNAVAILABLE**. No new local SQL/parser/unit/typecheck/lint/native/build execution occurred. Historical64/64 named tests and earlier static checks were not rerun; native.ts now changes, and those checks do not validate this correction.

## Author STOP and next gate

**AUTHOR STOP FOR ROOT REVIEW.** Root must review these two source changes and four author files, publish the reviewed head, and inspect new unchanged CI plus exact-head deployment/thread gates. No unchanged-code CI rerun, Ready, merge or follow-up slice was performed.

Method **NOT_APPROVED**; #1139 **NOT_RELEASE_READY /17 gaps**. #917's specific readback refusal remains binding. #1131, both #1135 holds, #968 and #911/#913 remain. No hosted DB/Auth/RLS/ACL/migration/credential/Auth-log operation, real provider/source, scheduler, cost or activation occurred.

---

## Historical R12 and earlier author records

Everything below is the exact prior author record. Its old current-status wording, source pins and checks describe earlier cuts; the R13 state above and the current JSON fields take precedence.

# M04 Phase-B author delivery status V1

**R12 SAME-SESSION CORRECTION PREPARED — INDEPENDENT ROOT REVIEW AND NEW NATIVE CI REQUIRED.**

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual session `/root/m04_durable_jobs_writer_g2`. [R12 CHANGES REQUIRED](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6757102845) resumes the same Generation2 session against published head `7ac9c4bc3f284775e5236d5d862e90fabbf2822b`, tree `155189bf6a71f9f56909bea2a976b56b97def43c`. Root owns the Task V3 supplement, review and publication.

## Current correction and source identity

Only two CASE expressions in `jobs-candidate.sql` gain enclosing parentheses: the predecessor-default comparison and the final queue-CAS quota condition. These are two line edits adding **four ASCII bytes**. Values, comparisons, branches, quotas and all other source bytes are unchanged. The valid ACL expression at line 72 is unchanged.

PostgreSQL 16's [PL/pgSQL grammar](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/pl/plpgsql/src/pl_gram.y), fetched blob `cd172ef2f8d6c792b0ee26f5162ced0c90694277`, reads an IF condition until the first THEN outside parentheses/brackets. An unparenthesized SQL CASE therefore terminates that condition at its inner THEN, leaving an incomplete expression. The first occurrence is in the predecessor-pins DO block; the same defect also exists in the queue-CAS function. Parentheses preserve the full CASE expression for SQL parsing.

The bounded source inspection found those two occurrences among 262 IF/ELSIF sites and no remaining occurrence after correction. This is **source inspection, not PostgreSQL parsing or execution**.

- Corrected SQL: **135,966 bytes**, SHA256 `ed8cf918bb595b6933d4517575d0b8bb6a583277302f5dcc83a6ccee150c123c`.
- Eighteen-source aggregate: **`c8062e47c23e11b1d7bfb1da66331ab779a11952c45651f492962d4ea6c9479a`**.
- The other seventeen source pins are retained unchanged from 7ac9c4. Rollback and all TypeScript sources are unchanged.
- The complete U01–U07/N01–N15 map remains in the author evidence JSON, with historical unit results and current native-pending status explicitly separated.

## Actual failed CI and verification limit

[CI 42739327115](https://github.com/Jetnity/jetnity/actions/runs/42739327115), Repository verification job 129576216777, executed 7ac9c4 and failed at **jobs_candidate / PostgreSQL 42601**. Its pinned candidate hash is the prior `3f17aebe…`. The receipt contains **no native groups and no R9 witnesses**, nativePass:false, 22/22 operations settled, 2/2 connections closed, one stopped cluster and no cleanup errors. Core totals are **8,658 tests: 8,655 passed, one failed, two skipped**. The complete safe receipt is preserved in the updated evidence.

The execution environment is now **unavailable**. No new local tests, typecheck, lint, SQL/parser/native execution, installation, build or replacement environment was attempted. The earlier **64/64 unit PASS**, TypeScript 0 diagnostics and lint 0 warnings/errors apply to unchanged TypeScript bytes and were **not rerun**; they do not validate the SQL correction. Corrected native execution remains a new-head CI gate.

## STOP and unchanged gates

**AUTHOR STOP FOR ROOT REVIEW.** Root must review and publish the two-line correction, then independently inspect new exact-head unchanged CI/native receipts and live deployment/thread gates. No unchanged-code CI retry, Ready, merge, database installation or automatic follow-up slice was performed.

Method **NOT_APPROVED**; #1139 **NOT_RELEASE_READY / 17 gaps**. #917's specific readback refusal remains binding; no retry or substitute. #1131, both #1135 holds, #968 and #911/#913 remain. No hosted DB/Auth/RLS/ACL/migration/credential/Auth-log operation, real source/provider call, scheduler, notification, cost or activation.

## Previous Generation2 delivery — historical snapshot before R12

The following record describes the earlier source cut published in 7ac9c4. Its old source digest, “current” wording and executed checks are historical; the R12 status and pins above take precedence.

**GENERATION2 CORRECTIONS DELIVERED FOR INDEPENDENT ROOT REVIEW — CURRENT NATIVE CI PENDING.** This is an author delivery, not a Technical-Lead PASS, Ready, merge, database installation or activation.

Author: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual new session `/root/m04_durable_jobs_writer_g2`. [Recovery dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6756274057) on exact HEAD `d9d62c690658444e06d04becf93f21ffb9112165`; binding supplement [M04_RECOVERY_TASK_V2.md](M04_RECOVERY_TASK_V2.md). Generation1 `/root/m04_durable_jobs_writer` is unavailable after context loss. No same-session continuity with Generation1 or Cursor session is claimed. Immediate corrections return to this actual Generation2 session.

## What this continuation changes

| Finding | Finite correction and evidence limit |
|---|---|
| R9 | Three added composition unit witnesses and one native proof group with two cases: natural unchanged5s I1 timeout and explicit worker/integration caller abort. The same nested S1 `reserve_v1` executor remains held; no fail/complete CAS or early lane release. Direct raw-composition unit observes integration return separately from actual drain. Native PID/birth/SQL wait, backend absence during held cleanup and exact S1 state assertions await CI. |
| R10 | Four double `set_config` SELECTs now have distinct output aliases, preserving query counts and the protected duplicate-column decoder. Finite fixture/proof phase and bounded sanitized error-code diagnostics expose setup/assertion/cleanup failure without raw SQL, errors or parameters. |
| R11 | New candidate `assert_catalog_v1` loop record is `binding_row`; installer ownership loop is `function_row`. This removes PL/pgSQL record/catalog alias collisions without changing protected SQL or `variable_conflict`. Actual installation still requires CI. |

No runtime defect in the existing nested ownership design was established by R9. This delivery supplies the missing combined proof. The initial extra raw-composition TypeScript check reported its nominal request brand; the explicitly labelled test-only protocol bridge was typed accordingly and the final focused check is clean.

## Exact source cut

All eighteen sources are pinned in [M04_PHASE_B_SOURCE_MANIFEST_V1.json](M04_PHASE_B_SOURCE_MANIFEST_V1.json). Aggregate SHA256 **`cc2e47f1afcec38ea749b1d3f88372a18ed01e14b2005501585e96dee4df1c3f`** uses sorted `SHA256 SPACE decimalBytes SPACE repositoryPath LF`. Evidence files are excluded from their own source digest. Four source paths changed from d9; fourteen are byte-identical.

| Changed source | Bytes | SHA256 |
|---|---:|---|
| `lib/readiness/official-truth-product-v3/jobs/composition.test.ts` | 27466 | `4b8cc4d40cda71d07a4a99c38a103634d194d24bf288fd6a73cfe0f87014820c` |
| `scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql` | 135962 | `3f17aebedfb69891a1ad5ccea7a7f1326d2431ba6a73c9d790254c581fe65fdb` |
| `scripts/db/official-truth-v3-durable-jobs-1/native-adapter.ts` | 13389 | `5c34ce52023d7840e09d004d9c577a2bd4dc78efb3171e7e7b8aff07b0cf7b57` |
| `scripts/db/official-truth-v3-durable-jobs-1/native.ts` | 136951 | `670f4a62b0f7b8964de8f2df4fd3ef99044067c9c92484e1d7c1fd53374deaac` |

The unchanged rollback is SHA256 `9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66`. Frozen plan remains120753 bytes, SHA256 `1952dc9c930021d32620f769595bb6f1641743574265f918cad6d36cfefdb88e`. All49 protected input paths were independently compared with d9 and are byte-identical in this Generation2 cut; the two authority paths changed earlier by Generation1 are unchanged here. Historical Phase-A/V7 documents and sixteen omitted binary/skip-worktree paths remain untouched by this author.

Root reports concurrent main `890dfe9323b4b6d3644c372d81cb8893b6548d11` after PR#1180. It does not overlap these eighteen sources. Root owns current-main integration and the shared ROADMAP addition. This source cut is relative to d9 and does not assert that integration/publication has already happened.

## Checks actually completed on this cut

| Check | Result | Practical limit |
|---|---|---|
| Five named nonnative contract/scope/postgres/composition/MA1 files | **64/64 PASS**,0 failed/cancelled/skipped;8102.282633ms | Protocol doubles and actual existing coordinator control flow; no native persistence evidence |
| Focused TypeScript with repository options and sixteen allowed roots | **PASS,0 diagnostics**; TypeScript5.9.3 | Static noEmit program, not full repository build/typecheck |
| ESLint over sixteen allowed TS sources | **PASS,0 errors/warnings**, empty output | Static only |
| Source and protected input comparison |18 pinned sources;49/49 protected inputs equal d9 | Before Root integration/pointer updates; no live deployment assertion |

Node was24.22.1; CI uses22. Exact commands, results and log hashes are stored in the manifest. No package installation or missing binary retrieval occurred. The full U01–U07/N01–N15 map is in [M04_PHASE_B_NATIVE_EVIDENCE_V1.json](M04_PHASE_B_NATIVE_EVIDENCE_V1.json) and the companion self-review. A map records concrete assertions and limits; it is not native acceptance.

## Actual historical CI and required next gate

[Run42732722870](https://github.com/Jetnity/jetnity/actions/runs/42732722870) did execute d9 and failed. Core8661/8658pass/1fail/2inherited skips; M04 failed setup before every N01–N15 group. Its truthful receipt reports18/18 operations settled,2/2 connections closed, one cluster stopped and nativePass:false. The old AggregateError masked the inner error. Distinct-alias R10 is a source-derived correction of a concrete decoder incompatibility; corrected CI must confirm progression. R11 installer fixes likewise remain source-verified only.

**This new source cut has not run native CI.** Its `nativeExecuted:false` is separate from the recorded failed historical run. The unchanged mandatory `jobs/native.test.ts` entry has no availability skip. Existing budget remains240s effect work plus60s whole cleanup, at most three sequential clusters, two children, sixteen fixture sessions per cluster, aggregate4+4+4 native lanes/40 work connections, two M04 observers and one MA1 observer. T01–T03 remain unchanged.

Root must independently review the exact sources/map, reconcile current main, publish a new exact head and inspect actual unchanged CI/native receipts plus exact-head Preview/Production and remaining gates. Changed heads invalidate previous gates.

## STOP and unchanged Owner boundaries

**AUTHOR STOP FOR ROOT REVIEW.** No Ready, merge or automatic follow-up slice. R9/R10/R11 are source-addressed for independent review; native acceptance remains open. No local PostgreSQL/native SQL/socket, full core/build, Git mutation/fetch/push, hosted DB/Auth/RLS/ACL/migration/credential operation, Auth-log access or real provider/source call occurred.

Method **NOT_APPROVED**; #1139 **NOT_RELEASE_READY /17 gaps**. #917 specific readback refusal remains binding: no retry, reformulation, delegation, alternate transport or human substitute. #1131 Ready STOP, both #1135 holds, #968 and #911/#913 remain. No production activation, scheduler, public route, notification or cost is authorized by this delivery.
