# M04 — current Technical-Lead handoff

**2026-11-10 13:11:03 UTC. CHANGES REQUIRED R24 / Recovery Task V15, implementation v2.** This is a source-reviewed pre-publication snapshot. The selected correction has not executed. Later exact-head publication/CI receipts and live evidence govern. Draft #1182 remains unfinished; no TL PASS, Ready or merge.

## Mandatory entry order

JETNITY_START_HERE.md → docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md → this Handoff → docs/ACTIVE_WORK_STATUS.md → [Root Review V15](M04_RECOVERY_ROOT_REVIEW_V15.md) → [Task V15](M04_RECOVERY_TASK_V15.md), [Evidence V15](M04_RECOVERY_R24_EVIDENCE_V15.json), [actual failure excerpt](M04_RECOVERY_R24_NATIVE_FAILURE_V15.txt) → live #1182 / origin #1178 / #751 / #1162 and exact source/status/review/CI/Preview/Production. Preserve Task V1, Phase-A freeze and all V13/V14/historical evidence. Live evidence always wins.

[Draft #1182](https://github.com/Jetnity/jetnity/pull/1182) · [R24 actual failure / investigation v1](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6767105970) · [binding implementation v2](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6767645250) · [R23 publication/readback](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6766792315)

Published blocked branch head **ca6fcb8930e68e394156d67351ee087c4cddb180**, tree **c688145cd14af3c7675d63e4174f8c07f6b772f9**, is two commits ahead of and zero behind actual main/merge-base **4bfa8b466ebc0af761fc5050bb4c51d7e73400c7**, tree **793026a2c26725da06ff281924aaa561d43ee32f**. Origin #1178 is MERGED after genuine R21 acceptance; subsequent actual-main failure remains a separate blocking fact. #1182 is the immediate dormant post-merge correction, not a new product slice.

## Independently verified actual R23 failure

CI **42812226588**, attempt 1 / pull_request, completed **FAILURE** at exact ca6f. Root independently observed terminal run and Repository-verification job metadata at **2026-11-10 12:15:16 UTC**, before reading that completed non-Auth log. Repository verification **129816262544** passed Typecheck and Lint, failed Tests, then skipped hygiene/build; aggregate **129822703137** failed; all six companion jobs succeeded.

**24/31 native groups passed**, including all 36 previously added N02 queries, both real R9 witnesses and the complete 254/255/256 ledger boundary. Group 25 hit the unchanged **240-second effect deadline** during the 64/65 cycle proof. The first 23 groups took 90403 ms, the ledger 106544 ms and the failed cycle test 42668.60444 ms. These are client await/test measurements, **not server profiling or a measured attribution to exact_keys_v1**.

Ledger started/completed index253/253, 256 acknowledged commands. Cycles started/completed index37/36, 113 acknowledged commands and 38 START/reservations; the following database outcome is **UNKNOWN**. Groups 26–31, inherited boundary and final rollback/late writer were not reached. Cleanup completed: **26926/26926 effects settled; 4242/4242 connections closed; zero pending, children or cleanup errors; one cluster stopped; 240470 ms total / 21 ms cleanup**. Core: **8683 tests / 8679 pass / 2 fail / 2 inherited skips / 0 cancelled**.

Full log **4251695 UTF-8 bytes**, SHA256 **2b15d0fe865df0cce10a6b7bba74c45797927cbc54138118e8258dbd90672b09**. Compact complete actual receipt **3816 bytes**, SHA256 **4341b23118a220ce190efd38b21ee0fcb8c070ad9e3f7b5a5b00682566da849c**. [Original-line excerpt](M04_RECOVERY_R24_NATIVE_FAILURE_V15.txt): **5880 bytes / 4de4a4325b4987078774e75fb62a2a6d7f2e4ed6a36f57288c25e0a0f29ead7e**. The full actual receipt is retained in [Root Evidence V15](M04_RECOVERY_R24_EVIDENCE_V15.json).

R23 Preview **dpl_4QSNFtChzkQWYZHU91QzL1Piurcc** was READY/exact ca6f with no alias error. Preview success cannot accept a failing native gate. The earlier R22 run42810301725 was separately observed terminal FAILURE at 12:09:31 UTC; its Typecheck failure meant native never ran. That later observation does not rewrite its original 11:49 snapshot.

## Selected source correction and proof

Only the body of `official_v3_jobs_private.exact_keys_v1` changes in SQL. A real nested CASE first restricts the new operations to object JSONB, a one-dimensional expected array and at most **32** elements. It returns true only after all three checks: every expected non-NULL key exists; deleting the expected keys leaves an empty object; actual object-key count equals full expected-array cardinality.

For object keys K and distinct non-NULL expected keys U, membership gives U ⊆ K and deletion gives K ⊆ U. Equal object-key count and full array cardinality exclude duplicate and NULL positions. Both original C-sorted arrays are therefore byte-identical and the original expression is true. **Every other case evaluates the complete original expression verbatim**, preserving false/NULL, empty/multidimensional arrays, unusual lower bounds, larger sets and collation-sensitive comparison. The 32-element selector changes the computation path, not accepted inputs.

The CASE guard prevents newly introduced scalar/multidimensional deletion errors. Signature, LANGUAGE sql, IMMUTABLE, PARALLEL UNSAFE, SECURITY INVOKER, CALLED ON NULL INPUT, search_path, all 29 declarations and every other SQL byte remain exact. No comparison COLLATE is added. The alternative ARRAY-constructor rewrite is excluded. No command/transition/history traversal or error-order change, row omission, cross-call cache, trust marker, valid-input normalization, new object, ACL/role/predecessor/rollback change or budget change.

Root and reviewer independently read primary PostgreSQL 16 implementations of JSONB membership/deletion/key lookup and SQL-function parameter collation. The parameter keeps a valid type collation when no valid call collation exists. This is a source-equivalence argument; no exotic/nondeterministic-collation runtime coverage is claimed. Existing valid callers use at most 20 keys and fit the selector. The new path still performs membership, deletion and counting; failed proofs also pay the old fallback cost. History work remains quadratic; **no measured performance gain, runtime margin or Production SLO is claimed**.

Native adds **36 fixed cases in 1 read-only SELECT calls** inside existing N02. Fixed literal booleans and the exact old-expression differential cover ordinary/reordered/nested values, unusual key text, wrong/missing/extra keys, duplicate/NULL cardinality traps, SQL NULL versus JSON null, nonobjects, empty arrays, unusual lower bounds, multidimensional fallback and both 32/33 boundaries. Existing 36 direct queries, all 31 group names/order, all prior oracles, connections, complete histories, quotas and safety bounds remain. No new fixture object/collation or history seed, availability skip, any/suppression/domain cast.

SQL: **139034 bytes**, SHA256 **9dccc0108dd8397730c968c1bfb944100e963932f64dcc34442b00b1e71a0f42**, blob **af60edee3776d9eba5b13b6db3cfad733b245567**.
Native: **175160 bytes**, SHA256 **f1221afc362db3f49232ce02bfc45233f498590e4c79f00d5a559b3e907adf1a**, blob **560c1cebc71ce21936b08d3d6296de0a8edea843**.
All-18-source aggregate: **daf5cd8a8644e0a37d5903f2e95d95bec8b9b458ad19204751b0ddccebdbc9a3**. The other 16 source pins, including rollback **9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66**, remain exact.

The final source was independently reconstructed and pinned by Root and the same reviewer. Their conclusion is **source-only suitable for complete new CI**, not compiler/runtime/Technical-Lead acceptance.

## Ownership and preserved continuity

Same actual author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, session **/root/m04_durable_jobs_writer_g2**; reviewer **/root/m04_r9_review_g2**; auditor **/root/m04_live_audit_g2**. No new generation or invented Cursor session. Author STOP after the finite delivery. The original G1/checkout has not been recovered or reconstructed. A newly supplied scratch context is available but unused for project execution; all execution boundaries remain.

Root independently reconstructed the four author documents. All **13 prior failure objects** are preserved exactly, this distinct R23 native failure is appended as the **14th**, and genuine R21 success stays separate. Original Markdown tails and historical V13/V14 records remain unchanged. Current coverage remains unexecuted for the new head. Later terminal metadata for the old R22 run is additional evidence, not a rewrite of the earlier observation.

Author owns two source files and four existing M04_PHASE_B documents. Root owns four new V15 Task/Review/Evidence/Excerpt files plus six current entry paths: M04_HANDOFF_V1 and only unique current markers in START, ACTIVE, ROADMAP, JETNITY_HANDOFF and ARCHITECTURE. All outside-marker bytes remain exact. Expected delta versus ca6f: **16 paths (two sources + 14 documents)**; cumulative PR versus main: **24 paths (two sources + 22 documents)**. Publication must preserve and read back every complete tree entry/mode and all **22 omitted binary IDs**, without retrieving binary content.

## First unfinished step and acceptance gates

Root must publish the finite independently reviewed source/document delivery on **fix/official-truth-v3-m04-postmerge-r22-20261110**, with expected-head **ca6fcb8930e68e394156d67351ee087c4cddb180**, no force, then independently read back all changed blobs, complete tree and ancestry. Existing #1182 remains Draft. Every changed head invalidates earlier exact-head gates.

Complete unchanged CI must pass all eight jobs, Typecheck/Lint/Core/Hygiene/Build, **31/31 native groups in exact order**, both real R9 race/drain witnesses, full 254/255/256 ledger and 64/65 cycle proofs, **761 inherited commit-guard pairs / minimumOwned4182**, final rollback/late writer and complete terminal cleanup. Refresh main/merge-base/ahead/behind/full diff, exact Preview, all reviews/threads, active strict rules, Mode/Guardian and reserved gates. Only Root may issue TL PASS, mark Ready and perform an expected-head merge.

After any merge, independently verify the actual new main full CI/native receipt and Production through **both jetnity.com and jetnity-app.vercel.app**. Genuine earlier PR green cannot replace actual-main acceptance. No unchanged-known-bad rerun. If a gate fails, CHANGES REQUIRED → same G2 author/session → finite reviewed correction → new head → full re-gating.

Only after product PR and actual product main succeed may the already bounded eight-path docs-only completion proceed: two new Root completion records plus these six current entry paths. Preserve the four historical author snapshots and prior evidence. Its own PR and actual docs-main CI/Production gates remain required, with the final receipt on existing PR/#751 rather than an endless self-attestation commit chain. No issue closure or automatic next product slice.

Frozen limits: **240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.**

## Live limits and risks

- **P0:** no newly verified Production incident in permitted evidence; hosted database truth is not inferred.
- **P1:** actual R23 native-budget failure and earlier actual-main failure block M04 completion. This new correction has not executed.
- **P2:** quadratic history work, the unknown following database outcome and unproved runtime/Production margin remain.
- **P3:** two inherited layout skips, unavailable original G1/checkout and bounded recovered session evidence remain explicit.

Last independently verified Production: **dpl_99pQXe4BdoDExkYqxkL5eNdTJZrD**, READY/exact main4bfa, both public aliases resolved separately. This is deployment metadata, not hosted installation; SQL remains **UNAPPLIED**. Latest live inventory is recorded in the evidence, including separate unfinished Draft D1 #1169 and concurrently opened separate #1181. They are outside this correction. Strict active ruleset21875372 has no bypass. Existing Owner gates remain unchanged.

## Reserved Owner gates and prohibited work

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.

Only permitted immutable GitHub/safe Vercel reads and in-session text/data transformations/hashing were used. Root alone may read completed non-Auth Repository-verification logs after independently observing terminal job metadata. No Auth or Vercel build logs were read.
