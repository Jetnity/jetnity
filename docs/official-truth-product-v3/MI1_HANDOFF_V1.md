<!-- MI1_R1_CURRENT_BEGIN -->
## Current recovery checkpoint — MI1 Review-Fix R1

**9 November 2026, 21:37 Europe/Zurich. CHANGES REQUIRED on published head `33e5f4eed79fdbc0a4bb5d8052142325febd8ee2`. Local R1 delivery is frozen for independent Root review; no corrected commit or new CI result is asserted.** Read [R1 TASK V1](MI1_REVIEW_FIX_R1_TASK_V1.md), [Root's exact-head finding and complete dispatch](https://github.com/Jetnity/jetnity/pull/1177#issuecomment-6750777757), [R1 author handoff](MI1_R1_AUTHOR_HANDOFF_V1.md) and [source manifest](MI1_R1_SOURCE_MANIFEST_V1.json), then actual live [PR #1177](https://github.com/Jetnity/jetnity/pull/1177), [#751](https://github.com/Jetnity/jetnity/issues/751) and [#1162](https://github.com/Jetnity/jetnity/issues/1162). The full original MI1 handoff below this current section is preserved verbatim as historical evidence; its pre-publication and Generation1 statements describe that earlier snapshot.

Current main input remains `d7e27f59b3e3cbc96bb63f5d37a33fa029c0e74a`; MI1 branch is `feat/official-truth-v3-main-integration-1-20261109`. Failed source33e has tree `0351e84ef3242dc972d557cb54d33b2a4b5058d5`. Actual attempt3 checkout `fc7a6e969cccf308cf35baa508d747faa1b851bd` has the same tree and ordered parents d7 then33e. CI42671681106 attempt3 Core job129413233452 reports **8,631 tests /8,628 passed /1 failed /0 cancelled /2 inherited skips**. Typecheck and Lint passed. All five hygiene checks and Production build were skipped after the failure. Successful component/native/UI parts are only partial evidence; there is no MI1 PASS. The two earlier GitHub infrastructure failures remain separate historical outcomes, not explanations for this deterministic test failure.

The existing protected-source test fails at the first stale C1 pin for `package-lock.json`. Root and an independent reviewer enumerated all40 protected rows and found exactly two current-main inputs: `package-lock.json` and `package.json`; the other38 rows match. Their current bytes are the unchanged literal d7 inputs, including the pre-existing Omio script entry and Leaflet dependencies. R1 changes only the final guard test and adds a SHA-pinned [two-file amendment](MI1_PROTECTED_SOURCE_AMENDMENT_V1.json), while preserving the historical C1 manifest `76a35e4f0b533462c3e3dfde0116f900b71bf253c41665a96bc3889df6b83650`. All40 protected rows remain strictly checked. No package, lockfile, runtime, SQL, workflow, accepted source, asset or product behavior is changed by R1.

Logical author: **Jetnity Official Truth V3 Main Integration1 — Codex Generation2**, actual new session `/root/mi1_guard_compatibility_writer`. Generation1 `/root/v3_method_authority_writer` is frozen/STOP and unavailable in the current live agent tree. Root explicitly issued this recovery before implementation; no old-session or Cursor-session resumption is claimed. Immediate R1 review fixes return to this same Generation2 session. The author is **STOP** after frozen delivery. Only Root publishes Git objects, grants PASS, marks Ready or merges. No new M04 or other product task is dispatched.

Local evidence: the ordinary targeted command first stopped before test execution because this worktree has no local `tsx`. Reusing the existing local dependency cache through its public loader and `NODE_PATH`, with no install, symlink or package/index change, reproduced **4/5 pass and the same package-lock assertion**. After the guard correction, the same five existing tests report **5/5 pass,0 fail/cancel/skip**. Local Node is24.22.1, whereas target CI uses22.x; these narrow results do not replace full new-head CI. Sixteen binary contents remain absent/skip-worktree with their existing Git IDs preserved. No local full build, native/SQL/PostgreSQL/socket execution or Hosted inspection occurred.

**First unfinished action:** Root independently reviews the complete finite R1 diff, amended pins and history preservation, retains the final actual attempt3 evidence, then publishes the corrected head. Complete fresh CI (Core, five hygiene checks, Production build, every required native family, isolated UI), exact Preview, live main/merge-base/ahead/behind, review threads, mode/rules/Guardian and Owner gates are mandatory. No unchanged failed-head retry, test weakening or timeout change. A later merge still requires actual-main CI and Production binding. No new head, run, PASS, Ready or merge is invented here.

Method **NOT_APPROVED**; #1139 **NOT_RELEASE_READY**,17 pre-Owner gaps. #917 remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, ledger UNKNOWN, Stage2 NOT_ATTEMPTED. Never retry, rephrase, delegate, reroute, switch transport or human-substitute the specifically refused readback; no renewed request for old Owner evidence. #1131 Ready STOP, #1135 Research Hold and independent platform Ready STOP, #968 exact Preview isolation and #911/#913 Privacy remain. No Hosted DB/Auth/RLS/ACL/migration/credential query or mutation, real source/provider/research call, scheduler, notification, new cost, method grant, public V3 or Production feature activation. Existing Auth CI is metadata only. The inherited dependency audit and narrow-screen presentation limits are not public-launch acceptance.
<!-- MI1_R1_CURRENT_END -->

---

# MI1 Handoff V1 — current-main integration of the accepted V3 stack

**9 November 2026. Frozen author delivery; independent combined-head gates PENDING.** Root explicitly selected MI1 to address the existing current-main integration P2 in [#1162, task comment 6747321570](https://github.com/Jetnity/jetnity/issues/1162#issuecomment-6747321570). This is a bounded integration assignment, not an automatic product follow-on or an activation. [MI1 TASK V1](MI1_TASK_V1.md), SHA256 `1e6f6956c6dfe38ea8693cd04c6e8b0f2faf67adc8421d3e7e3d47cebdbd199a`, is binding.

## Recovery order and current publication truth

Read [JETNITY_START_HERE](../../JETNITY_START_HERE.md), the [Technical-Lead/Cursor operating standard](../JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md), this handoff, [ACTIVE_WORK_STATUS](../ACTIVE_WORK_STATUS.md), the task and Root's input/union receipts. Then read the latest [#1162](https://github.com/Jetnity/jetnity/issues/1162) and [#751](https://github.com/Jetnity/jetnity/issues/751) evidence to locate the actual MI1 PR, head, CI, review and any later merge or post-merge receipt. Live evidence wins.

At this author snapshot, the MI1 integration commit, branch/PR and CI have **not been published or assigned to this delivery**. No future number, SHA, CI success or Preview is guessed. Local HEAD is the accepted MA1 tip in a detached isolated worktree; it is not a combined integration head. The current worktree is `/workspace/scratch/01cbe1264212/jetnity-v3-main-integration`. The original MA1 worktree is outside this author's MI1 ownership and remains untouched by this author.

| Bound input | Exact identity / actual evidence |
| --- | --- |
| Main input | `d7e27f59b3e3cbc96bb63f5d37a33fa029c0e74a` |
| Main tree | `c417811ff67248c4910bb2c5154bb51885d787eb` |
| Main CI / Production snapshot | Root task records CI42663958375 attempt 1 SUCCESS and both Production aliases READY on `dpl_7wC6LXPtpu8QGpakMGva4FpKEbR2`, bound to that main SHA. These are input snapshots, not MI1 release evidence. |
| Accepted MA1 / V3 tip | `845a118f697fe38722ad91a6fbf9aab40028f3cf` |
| Accepted MA1 tree | `4656e5de29c76ffd79c2160002d63d9fb7418362` |
| Common ancestor | `ce3366e26de73961d4682236af92347bfc3a4ca8` |
| Actual exclusive ancestry | Main 7 commits / accepted V3 tip 37 commits |
| Pure input union, before MI1 continuity/dossier additions | `eb6f3878ffd44f125818fa764dba10a535404bd0` |
| Eventual integration parent order | First `d7e27f59b3e3cbc96bb63f5d37a33fa029c0e74a`, second `845a118f697fe38722ad91a6fbf9aab40028f3cf`; actual published parents still require Root verification. |
| Integrated-head acceptance | **PENDING**; no combined CI/native/UI/Preview/Ready/merge verdict exists in this handoff. |

Root and an independent peer verified the pure union in [MI1_ROOT_PURE_UNION_V1.json](MI1_ROOT_PURE_UNION_V1.json) and [MI1_PEER_PURE_UNION_REVIEW_V1.json](MI1_PEER_PURE_UNION_REVIEW_V1.json). This union contains 9,214 file entries. The peer used an independent canonical-tree calculation. That proof concerns immutable input composition before the new documentation additions; it does not prove a later commit, complete local checkout, build or runtime success. Root must compute and compare the final tree containing the authorized continuity and dossier files with the Git Data result.

## Included code ancestry and separate D1 package

The complete main delta has **59 paths** and the accepted V3 delta **358 paths**, with no exact path intersection. The GitHub comparison capped at 300 paths was not used as the complete V3 inventory. All ten pins below are actual ancestors of the accepted V3 tip in Root/peer evidence. No component is silently rebased, replayed, squashed or merged a second time.

| Code component | Existing PR evidence | Exact included head |
| --- | --- | --- |
| S0 — shared contract | [#1163](https://github.com/Jetnity/jetnity/pull/1163) | `6b7beebd33a686d494a26cbda8a6311a51dc3450` |
| I1 — import | [#1164](https://github.com/Jetnity/jetnity/pull/1164) | `63b97e8ab6139c38746aaaa4caa4054c83219b1d` |
| U1 — visitor/cache | [#1165](https://github.com/Jetnity/jetnity/pull/1165) | `d110545a551baf6b6f18687042238a30514addda` |
| M1 — monitoring/version lifecycle | [#1166](https://github.com/Jetnity/jetnity/pull/1166) | `40ca2f0348862bb763e8d42728418bda4c63405f` |
| E1 — composition | [#1167](https://github.com/Jetnity/jetnity/pull/1167) | `97629e9130a907b8b9b8072d06bda1956758aa6e` |
| S1 — durable intake | [#1168](https://github.com/Jetnity/jetnity/pull/1168) | `bb5ce4d69f9e479867581ecf0262e549bfc20e6c` |
| N1 — file ingress | [#1170](https://github.com/Jetnity/jetnity/pull/1170) | `10d3e4f44460513e6425714af2c8c0b3ab4678a6` |
| IN1 — intake composition | [#1171](https://github.com/Jetnity/jetnity/pull/1171) | `0b704d0fa5d90031ca3ee80aabf2d8578d4cd2d5` |
| C1 — global conditions | [#1173](https://github.com/Jetnity/jetnity/pull/1173) | `5558367eb0bff97162c369bbb8963123839f4b0e` |
| MA1 — method authority | [#1175](https://github.com/Jetnity/jetnity/pull/1175) | `845a118f697fe38722ad91a6fbf9aab40028f3cf` |

**D1 [#1169](https://github.com/Jetnity/jetnity/pull/1169), head `300946991376b8969b383a087d47b49a7636f722`, remains a separately reviewed documentation package and is not in this code ancestry.** Its review is not method approval. #1131, #1135 and other held Drafts are not integration inputs. Existing historical handoffs, failed runs and review receipts retain their original bytes and time-bound meaning.

## Main changes and the partial local preparation

The actual main history records external [#1174](https://github.com/Jetnity/jetnity/pull/1174), merge `ed97a01ccc6640df45167aaf60a1abe28a65e9fd`, for Organisieren travel search, photos/stages and hotel maps; external [#1176](https://github.com/Jetnity/jetnity/pull/1176), merge `d7e27f59b3e3cbc96bb63f5d37a33fa029c0e74a`, adds the Omio route comparison/map and private route catalog integration. These are independently existing main inputs. Neither this author nor the MA1 acceptance receipt claims Technical-Lead acceptance of those external product changes.

Root recovered exact representations of seven commits, 29 trees and **43 UTF-8 blobs**. [MI1_ROOT_INPUT_IMPORT_V1.json](MI1_ROOT_INPUT_IMPORT_V1.json) and the union receipt bind that preparation and input-acquisition manifest SHA256 `0962410b5cbcca86c33f7b4e38ae3938293134a00fef8922a54da4b58a32fb50`. Root mechanically overlaid the 43 text paths on the isolated MA1 worktree. Main's package/lockfile changes, including Leaflet dependencies, are preserved. They require actual fresh dependency installation and complete new CI against the combined tree.

**Sixteen binary contents remain locally unavailable:** the encrypted `data/omio/ch.katalog` and 15 WebP assets. The connector's non-UTF8 responses are preserved as a limitation; no alternate retrieval, fabricated bytes or placeholders were used. The exact existing main blob IDs and modes remain bound in the union receipts. Root's separate private-index union construction does not make the author's worktree a complete combined checkout. No author index update, dependency installation or execution substitutes for the mandatory complete CI checkout.

## Actual authors and ownership

The currently assigned logical author is **Jetnity Official Truth V3 Main Integration1 — Codex Generation1**. Root explicitly reused the actual session `/root/v3_method_authority_writer` after completing MA1. No Cursor identity or live Cursor session is claimed. Immediate MI1 corrections return to this same session under a finite Root instruction. The runtime child received no MI1 assignment.

The author owns exactly six continuity files: the two current top blocks in `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md`, this handoff, [the verbatim preceding-block archive](MI1_PREVIOUS_START_STATUS_BLOCKS_V1.md), [MI1_AUTHOR_HANDOFF_V1.md](MI1_AUTHOR_HANDOFF_V1.md) and [MI1_SOURCE_MANIFEST_V1.json](MI1_SOURCE_MANIFEST_V1.json). All other main/V3 source, tests, SQL, dependencies, assets and workflows are read-only. Root's 13 dossier files, including the added independent union receipt, are read-only.

At frozen delivery, this author is **STOP for independent Root review**. All other V3 component authors remain **STOP unless Root explicitly reassigns them**; historical Session/Generation declarations do not establish current availability or restart authority. Root is the active Technical Lead and alone creates/publishes Git objects, accepts evidence, sets Ready and decides merge. No author commit, push, ref change, Ready, merge or product follow-on is authorized.

## What MA1 actually established

[Root final acceptance](https://github.com/Jetnity/jetnity/pull/1175#issuecomment-6747230732) and [MA1_ROOT_FINAL_ACCEPTANCE_V1.json](MA1_ROOT_FINAL_ACCEPTANCE_V1.json), SHA256 `97749fb674afd1502143e6a8aec1848684d00b556c45aaf21c6649a169914acb`, accept only the bounded dormant MA1 code/native/isolated-UI scope on `845a118f697fe38722ad91a6fbf9aab40028f3cf`.

That exact-source run, **42663861884 attempt 1**, completed all eight jobs successfully. Core reported 8,621 tests, **8,619 passed, 0 failed, 2 inherited skips**. All **14 actual MA1 children and their parent** passed, with 1,562 initiated/settled operations, zero pending, 229/229 connections closed and eight clusters stopped. Other mandatory native families, the real CI checkout/tree binding and exact Preview `dpl_DMMpoJypAnMupkVVomoGoYFGHz9X` were independently reviewed by Root.

The accepted isolated-UI receipt records 50 unit tests, 12 layouts, 11 interactions, ten screenshot files, zero errors and zero external requests. The receipt does not claim a fresh visual inspection for that run. Its synthetic p95 of 7.615364 ms is not a public SLO measurement. These source-bound component facts do not substitute for a new MI1 UI artifact or combined-source execution.

The failed MA1 runs **42654936800** and **42659466404**, their original source snapshots and same-session R1/R2 corrections remain historical evidence. The final actual success does not erase them. The older MA1_ROOT_HANDOFF_V5 pending-native text belongs to its earlier snapshot; the newer Root final receipt establishes the accepted MA1 component state, while MI1 remains unaccepted.

## First unfinished gate and Root sequence

The first unfinished **integration acceptance gate** is the full **new-head CI/native/UI/Preview and independent review**. Immediately before execution, Root reviews the frozen six-file delivery, refreshes current main and all live special gates, computes the final union-plus-documents tree, publishes a new exact integration head and verifies the actual ordered parents and returned Git Data tree. If main has moved, Root must issue a finite amendment; no silent pin change is permitted.

Required new-head evidence includes:

1. Complete checkout and fresh dependency installation; Typecheck, Lint, Core, all five hygiene checks and production build in unchanged CI. Actual new counts must be read; the MA1-only count is not imposed on the larger combined tree. No added skips or weakened tests/timeouts.
2. All 14 actual MA1 children and parent; C1/IN1/S1 native execution; existing persisted/store/lifecycle/atomic proofs with real resource cleanup. Earlier green runs do not transfer acceptance.
3. A newly bound isolated-UI artifact with layout/interaction results, source/run/checkout and screenshot hashes, error/external-request logs and synthetic/public-SLO limits.
4. Exact-head Vercel Preview, checks/statuses, GitHub and Vercel review threads, fresh main/Guardian/operating-mode/rules/Owner inventory and verified author STOP. Every changed head reopens all exact-head gates.

Only after successful independent review may Root evaluate ordinary dormant-code Ready/merge under the live special gates. Any eventual merge still needs actual-main CI and Production deployment/alias binding. Any concrete deterministic failure requires preserved full evidence, CHANGES REQUIRED to this same responsible author under a finite amendment, a new head and renewed gates. No retry of an unchanged failed head to seek success; no automatic follow-on product task.

## Standing boundaries and risks

**Method NOT_APPROVED. #1139 NOT_RELEASE_READY, with 17 pre-Owner evidence gaps.** SQL remains UNAPPLIED and hosted proof is not claimed. The unchanged Auth CI proves configuration metadata only, never #1139 target truth. Database/Production activation and the concrete method remain Owner-gated. Code acceptance and synthetic method approval do not grant a real method.

#917 remains **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**, ledger **UNKNOWN**, Stage2 **NOT_ATTEMPTED** in the documented sequence. The specifically refused readback is never retried, rephrased, delegated, rerouted, moved to another transport or replaced with a human SQL run. There is no renewed request for old Owner evidence. #1131 Ready STOP, #1135 research hold, #968 exact Preview isolation, #911/#913 privacy and all other Owner gates persist.

No local test/native/SQL/PostgreSQL/socket execution, binary retrieval or dependency installation is part of MI1 author work. No hosted DB/Auth/RLS/ACL/migration/credential action, real source/provider/researcher call, public route, scheduler, notification, new cost, flag or activation is authorized. The protected publication seam remains a synthetic marker; actual Accepted publication composition, source qualification and public operation/performance are separate open product gaps.

| Risk level | Continuing state |
| --- | --- |
| P0 | No new P0 finding is asserted within this bounded task. There is no blanket security or launch PASS. |
| P1 | Existing effective-target, access, recovery, isolation and Owner activation gates remain; no regular path around the specifically refused #917 scope is claimed. |
| P2 | Current-main integration remains OPEN until the complete final gates pass. Existing #911/#913 privacy concerns remain outside this bounded integration closure. |
| P3 | Operational delivery and actual public performance remain unproven; synthetic timings are not public SLO evidence. |

The author stops at frozen delivery. Root's independent review and live evidence determine the next action.
