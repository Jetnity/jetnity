# Jetnity – GitHub Hygiene Phase 1 Audit

Stand: 31. August 2026  
Status: **SYNC REVALIDATION / READ-ONLY / STOP FOR FRESH TECHNICAL-LEAD EXACT-HEAD RE-GATE**

Issue: #266  
Task: `docs/GITHUB_HYGIENE_PHASE1_AUDIT_TASK_2026-08-31.md`  
Agent: **`Jetnity github hygiene audit 1`**  
Generation: **1**  
Cursor-Session: `bc-8293337d-f32b-41fd-a36d-edb90dc99d95`  
Branch: `audit/github-hygiene-phase1-2026-08-31`  
PR: #301 (Draft)

Previous independent TL PASS head: `ef0c50a9c14d00774db0936831b1cfc445cef60b`  
Previous collection `main`: `7f057e6ee8caddf87a3b5365731eaf43d037a114`  
Current verified `main`: `26b44e8f93ebf378d9d367c5e7cb2f9701efd12e`  
Sync collection (UTC): `2026-08-31T01:08:53Z`

Current restore manifest (use this for any later Phase 2):

`docs/evidence/GITHUB_HYGIENE_PHASE1_SYNC_MANIFEST_2026-08-31.json`

Historical first collection (PASS-time snapshot, superseded for restore SHAs that drifted):

`docs/evidence/GITHUB_HYGIENE_PHASE1_MANIFEST_2026-08-31.json`

## 0. Sync-only delta after TW + E1 landed on `main`

This update is a sync-only re-gate. The audit branch was merged with `origin/main@26b44e8f` (no force-push). Classifications changed only where live open-PR / ancestry facts required it.

| Branch | Previous | Current | Why |
|---|---|---|---|
| `main` | `KEEP_MAIN` @ `7f057e6e…` | `KEEP_MAIN` @ `26b44e8f…` | Default branch advanced through merge commits `a5c8124b` (TW-8/TW-9) and `26b44e8f` (E1). |
| `audit/tw8-tw9-readiness-2026-08-31` | `KEEP_OPEN_PR` #302 @ `d0510030…` | `DELETE-SAFE_MERGED` @ `93fb21efab6c22c3fd2b14a3a23d18f46110fd03` | #302 is no longer open (GitHub `CLOSED`). Tip is ancestor of current `main`. Not protected. Independently revalidated `rev-list` 0. |
| `feat/entry-requirements-detail-contract-e1-2026-08-31` | `KEEP_OPEN_PR` #300 @ `2bec7c2d…` | `DELETE-SAFE_MERGED` @ `56e018d36a176c0061a57978b8a6b5044369409d` | #300 is no longer open (GitHub `CLOSED`). Tip is ancestor of current `main`. Not protected. Independently revalidated `rev-list` 0. |
| `audit/github-hygiene-phase1-2026-08-31` | `KEEP_OPEN_PR` #301 | `KEEP_OPEN_PR` #301 | Still the open audit PR. Remote tip at sync collection was `ef0c50a9…`; delivery push moves it. |

GitHub reports #300 and #302 as `CLOSED` with `mergedAt=null`. Classification does **not** use `mergedAt`. It uses the live open-PR list plus ancestry of the exact tip. Main contains the merge commits named above.

No other disposition changed. The other 13 previous `DELETE-SAFE_MERGED` tips are unchanged and remain ancestors of the new `main`. All 57 `REVIEW_UNMERGED` names/tips/dispositions are unchanged. `docs/entry-requirements-target-architecture-2026-08-31` stays `REVIEW_UNMERGED` (3 commits not in `main`).

## 1. Safety contract

This slice inventorizes and classifies remote branch refs. It does **not** delete, move, close, or protect anything.

A branch is `DELETE-SAFE_MERGED` only when **all** of the following are true at collection time:

1. name is not `main`;
2. GitHub does not report the branch as protected and no inspected ruleset includes it;
3. the branch is not the head of any open pull request;
4. the exact tip SHA is an ancestor of the current verified `main`;
5. `git rev-list --count <main>..<tip>` is `0`;
6. the tip SHA is not equal to the current `main` tip.

Any uncertainty is `REVIEW_UNMERGED`, never delete-safe.

Phase 2 may delete only the exact name→SHA pairs listed as `DELETE-SAFE_MERGED` in the **sync** manifest, and only after re-validating name, SHA, open-PR status, protection, and ancestry immediately before each delete. Drift is STOP.

## 2. Counts (after sync)

Live remote heads in `Jetnity/jetnity`: **79** (GitHub Branches API and `git ls-remote --heads origin` agree exactly).

| Disposition | First collection | After sync |
|---|---:|---:|
| `KEEP_MAIN` | 1 | 1 |
| `KEEP_OPEN_PR` | 8 | 6 |
| `DELETE-SAFE_MERGED` | 13 | 15 |
| `REVIEW_UNMERGED` | 57 | 57 |
| **Total** | **79** | **79** |

Tags inspected and **not** classified for deletion: 3 annotated archive tags (`archive/jetnity-v1-main`, `archive/pre-1-1b-alt-ui`, `archive/pre-1-4b-legacy-datenbank`).

## 3. Classification vocabulary

| Class | Meaning |
|---|---|
| `KEEP_MAIN` | Default branch. Never delete-safe. |
| `KEEP_OPEN_PR` | Head of at least one open pull request. Never delete-safe. |
| `DELETE-SAFE_MERGED` | Merged leftover ref. Restorable from the documented SHA. Not deleted in this slice. |
| `REVIEW_UNMERGED` | Tip is not fully contained in current `main`, or another conservative hold applies. |

## 4. Phase 2 candidate list (not executed)

These 15 refs are the only Phase 2 delete candidates from the sync collection. Each tip was checked as an ancestor of `main@26b44e8f` with `rev-list` count 0. The two new rows were independently revalidated a second time.

| Branch | Restore SHA | Note |
|---|---|---|
| `audit/core-repository-hygiene-2026-08-30` | `a759764eefa568784bfa08029b386b978e1d2138` | unchanged from first collection; #277 |
| `audit/github-branch-hygiene-2026-08-30` | `a4dbc81284550d7b2aa1e0beb5e038deaf6a8d88` | unchanged; #267 |
| `audit/requirements-provider-groundwork-g0-2026-08-30` | `74e214606c9f881ce0cd19aef3ed7865eb304d3b` | unchanged; #290 |
| `audit/tw8-tw9-readiness-2026-08-31` | `93fb21efab6c22c3fd2b14a3a23d18f46110fd03` | **new after TW merge**; #302 no longer open |
| `cleanup/final-mechanical-repository-leftovers-2026-08-30` | `204511f552d58e246cd08fd8b724eb98edd4dc49` | unchanged; #283 |
| `docs/chatgpt-technical-lead-transition-2026-08-30-final` | `471bc93d19c2fa243182f6560e415b952b17364a` | unchanged; #281 |
| `docs/post-cleanup-technical-lead-checkpoint-2026-08-30` | `5a3cf6aad1a5c89c98a96ec2904f2e265f22da2a` | unchanged; #285 |
| `docs/requirements-gate0-closed-2026-08-31` | `4a86ea753bf3f7c5cfd667661f6a01557280b8ba` | unchanged; #291 |
| `docs/requirements-s4-r1-closed-entry-target-2026-08-31` | `2aac34ddea0c88327986fc459826892d8895f3d0` | unchanged; #297 |
| `feat/entry-requirements-detail-contract-e1-2026-08-31` | `56e018d36a176c0061a57978b8a6b5044369409d` | **new after E1 merge**; #300 no longer open |
| `feat/requirements-truth-ops-s4-r1-2026-08-31` | `595b4ad2a827beff7bec597433b3316d21da0747` | unchanged; same SHA as #296 |
| `feat/requirements-truth-ops-s4-r1-ready-2026-08-31` | `595b4ad2a827beff7bec597433b3316d21da0747` | unchanged; #296 |
| `ops/creator-media-c2-recovery-2026-08-30` | `cf2bbd5b71392f17c8f31e2a13e450ae9de72e15` | unchanged; #270 |
| `ops/creator-media-c3-decommission-2026-08-30` | `e8069799774433c905663b00867085bab4dbd461` | unchanged; #272 |
| `recovery/core-repository-hygiene-2026-08-30` | `a759764eefa568784bfa08029b386b978e1d2138` | unchanged; #279 |

Do **not** start deletion from this PR.

## 5. Open PR heads — never delete-safe

| PR | Draft | Head branch | Head SHA |
|---|---|---|---|
| #301 | yes | `audit/github-hygiene-phase1-2026-08-31` | `ef0c50a9c14d00774db0936831b1cfc445cef60b` at sync collection; delivery push moves it |
| #52 | yes | `docs/chatgpt-technical-lead-handoff-2026-08-24` | `f1e13db332ce087297dae60d4f1b3c21f321f9ec` |
| #50 | yes | `cursor/s1-merged-status-f23f` | `f5a25c949f8bbfb889f87653ba1a08a02f75f6ea` |
| #40 | yes | `audit/admin-platform` | `a316015733b86e2adbd050abb2f77258a99da366` |
| #39 | yes | `audit/account-platform` | `65b08f4718ad74f3157c55a3efb960a4c843408a` |
| #28 | yes | `feat/trip-collaboration-foundation` | `e0132cb576e8231296dc5b290e0afcef88ceb9f4` |

#300 and #302 are no longer open. Stale drafts #28 / #39 / #40 / #50 / #52 remain `KEEP_OPEN_PR`. Closing them is not Phase 2.

## 6. Protection (rechecked)

- Branches API `protected=true` only for `main`.
- Ruleset `21875372` / `Jetnity main protection` still **active**, include only `refs/heads/main`.
- `GET /repos/Jetnity/jetnity/rules/branches/audit/github-hygiene-phase1-2026-08-31` still `[]`.

## 7. Exact manifest after sync

| Branch | Tip SHA | Protected | Open PRs | Ancestor of `main@26b44e8f` | Commits not in main | Disposition |
|---|---|---:|---|---:|---:|---|
| `audit/account-platform` | `65b08f4718ad74f3157c55a3efb960a4c843408a` | false | #39 | false | 11 | `KEEP_OPEN_PR` |
| `audit/admin-platform` | `a316015733b86e2adbd050abb2f77258a99da366` | false | #40 | false | 15 | `KEEP_OPEN_PR` |
| `audit/admin-platform-sync-temp` | `e6b3e62c7f412dc0f024a8077fc8409154ae586a` | false | — | false | 4 | `REVIEW_UNMERGED` |
| `audit/admin-platform-sync-temp2` | `e6b3e62c7f412dc0f024a8077fc8409154ae586a` | false | — | false | 4 | `REVIEW_UNMERGED` |
| `audit/ap7-account-traveller-registry-gate0-2026-08-28` | `85ce5399368621e916de6c1a506abbae5316a0b3` | false | — | false | 5 | `REVIEW_UNMERGED` |
| `audit/core-repository-hygiene-2026-08-30` | `a759764eefa568784bfa08029b386b978e1d2138` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `audit/github-branch-hygiene-2026-08-30` | `a4dbc81284550d7b2aa1e0beb5e038deaf6a8d88` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `audit/github-hygiene-phase1-2026-08-31` | `ef0c50a9c14d00774db0936831b1cfc445cef60b` | false | #301 | false | 3 | `KEEP_OPEN_PR` |
| `audit/project-sanitation-inventory-2026-08-26` | `a5fbaa6df79fc0515d06a1cfafb88fcd6316b0e8` | false | — | false | 2 | `REVIEW_UNMERGED` |
| `audit/provider-readiness` | `ca8522400110a95ee0e51889417106992961f1c4` | false | — | false | 11 | `REVIEW_UNMERGED` |
| `audit/requirements-provider-groundwork-g0-2026-08-30` | `74e214606c9f881ce0cd19aef3ed7865eb304d3b` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `audit/security-privacy-current-state-2026-08-29` | `5489196117e219d511f0a98bab3f31193775c8eb` | false | — | false | 2 | `REVIEW_UNMERGED` |
| `audit/traveller-account-multicitizenship-gap-2026-08-29` | `3bda0496e1eab7675beab3ed3f0e1634fd552dda` | false | — | false | 3 | `REVIEW_UNMERGED` |
| `audit/tw8-tw9-readiness-2026-08-31` | `93fb21efab6c22c3fd2b14a3a23d18f46110fd03` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `chore/account-admin-team-prep` | `67074279d290c651746049f9901c999156873729` | false | — | false | 23 | `REVIEW_UNMERGED` |
| `cleanup/final-mechanical-repository-leftovers-2026-08-30` | `204511f552d58e246cd08fd8b724eb98edd4dc49` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `cleanup/legacy-storage-batch-b-2026-08-30` | `f65af8bd3057320f6f28508fb56fa77004f3b836` | false | — | false | 6 | `REVIEW_UNMERGED` |
| `cursor/align-handoff-after-pr38-010d` | `e30fb07fb25354b7a547acf15a83b420fc67ff02` | false | — | false | 4 | `REVIEW_UNMERGED` |
| `cursor/ap5-s4-post-merge-continuity-2026-08-29-5132` | `9b34cf29b17e5ababb635f9373e961ffb6c5a844` | false | — | false | 2 | `REVIEW_UNMERGED` |
| `cursor/foundation-c-merged-status-f35b` | `cbd59645da9f77ecaa241c7d327fa769328ee54a` | false | — | false | 1 | `REVIEW_UNMERGED` |
| `cursor/legacy-datenbank-entfernen-f38c` | `4015340679380ebf05e5f342f1adb6e11a0148bf` | false | — | false | 5 | `REVIEW_UNMERGED` |
| `cursor/phase-1-3-auth-rollen-cbcd` | `777d12e5b894a7517745ccade4490bf0393707f2` | false | — | false | 7 | `REVIEW_UNMERGED` |
| `cursor/phase-1-4-datenbank-baseline-0c7c` | `79679c3562f854b21fe27cccaae3487fd741c42a` | false | — | false | 12 | `REVIEW_UNMERGED` |
| `cursor/phase-1-4c-auth-konfiguration-8050` | `59d6a9d2402d1ecceecd3e314334e2a19c614613` | false | — | false | 9 | `REVIEW_UNMERGED` |
| `cursor/phase-1-5-reiseschema-c9d2` | `9fcd2cc39933ad9abf9220d249a38938b0103288` | false | — | false | 17 | `REVIEW_UNMERGED` |
| `cursor/phase-2-1-natuerliche-sprache-zu-reise-e985` | `5014d164574051513af8dd5582c77adf3733c9c0` | false | — | false | 13 | `REVIEW_UNMERGED` |
| `cursor/phase-22-reise-aendern-e90a` | `d2fad49ec9bc5ce685c3cf20ae16fbd64844995f` | false | — | false | 17 | `REVIEW_UNMERGED` |
| `cursor/phase-3-flights-foundation-c8a6` | `ca5d50b5873788c1b5ca78c0db5dd68e4f2b4da5` | false | — | false | 33 | `REVIEW_UNMERGED` |
| `cursor/record-foundation-e-merge-be45` | `05ebbb9d4bbb3c1063d0a0b856e7985f1c5ebbdf` | false | — | false | 1 | `REVIEW_UNMERGED` |
| `cursor/s1-merged-status-f23f` | `f5a25c949f8bbfb889f87653ba1a08a02f75f6ea` | false | #50 | false | 3 | `KEEP_OPEN_PR` |
| `cursor/seasonal-merged-status-010d` | `fddd0f444ad2435b3c456f72783de800f7d1db4a` | false | — | false | 2 | `REVIEW_UNMERGED` |
| `cursor/supabase-mcp-dev-1f02` | `7102d0dae89162e98d3dde2a6091916f0a47d2e9` | false | — | false | 2 | `REVIEW_UNMERGED` |
| `cursor/tw7a-hub-card-identity-b13d` | `1ce6e02b2993eff1b747ab42da4c9ea8927e0885` | false | — | false | 2 | `REVIEW_UNMERGED` |
| `do-not-use` | `9cc9b0526683f161f500326a7b72c74abac9c296` | false | — | false | 10 | `REVIEW_UNMERGED` |
| `docs-continuity-standard` | `1bed5e8020994c70c4786aea0aa8a9b761663b12` | false | — | false | 1 | `REVIEW_UNMERGED` |
| `docs-phase-3-3-status-sync` | `f19493576a2ddbfe6e0efdb0ebd8c62bf847f6b9` | false | — | false | 2 | `REVIEW_UNMERGED` |
| `docs/chatgpt-technical-lead-handoff-2026-08-24` | `f1e13db332ce087297dae60d4f1b3c21f321f9ec` | false | #52 | false | 67 | `KEEP_OPEN_PR` |
| `docs/chatgpt-technical-lead-handoff-2026-08-24-shadow` | `216b44d95d137c6c9f1a258b6e9f2dff4782c9f6` | false | — | false | 7 | `REVIEW_UNMERGED` |
| `docs/chatgpt-technical-lead-transition-2026-08-30-final` | `471bc93d19c2fa243182f6560e415b952b17364a` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `docs/domain-program-completion-policy` | `216b44d95d137c6c9f1a258b6e9f2dff4782c9f6` | false | — | false | 7 | `REVIEW_UNMERGED` |
| `docs/domain-program-completion-policy-2` | `216b44d95d137c6c9f1a258b6e9f2dff4782c9f6` | false | — | false | 7 | `REVIEW_UNMERGED` |
| `docs/entry-requirements-target-architecture-2026-08-31` | `dafa3e01002156c2ff5c0c0526c5ce6d85f55b4e` | false | — | false | 3 | `REVIEW_UNMERGED` |
| `docs/jetnity-handoff-after-phase-2-1` | `d248719bb418012bf13fc1286fe6d8514f8fb0b5` | false | — | false | 1 | `REVIEW_UNMERGED` |
| `docs/phase-3-1-final-handoff` | `e823a11cb6cb29d9b287ca97273b9025a75fce48` | false | — | false | 1 | `REVIEW_UNMERGED` |
| `docs/post-cleanup-final-handoff-2026-08-30` | `74aa58e93ffcd431e8fab83f3b35ac85a8c42a3f` | false | — | false | 4 | `REVIEW_UNMERGED` |
| `docs/post-cleanup-technical-lead-checkpoint-2026-08-30` | `5a3cf6aad1a5c89c98a96ec2904f2e265f22da2a` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `docs/post-pr97-canonical-continuity-2026-08-27` | `47c1db0675c644db2c0e3833aa9630d1fcdf5c06` | false | — | false | 1 | `REVIEW_UNMERGED` |
| `docs/post-pr98-continuity-2026-08-27` | `fb6aae99909f37a40518803ccea26b74677f6e7a` | false | — | false | 2 | `REVIEW_UNMERGED` |
| `docs/pr137-post-merge-continuity-2026-08-28` | `822a5a4726e10520c4c8ad0ec6d7753e6f999f7b` | false | — | false | 1 | `REVIEW_UNMERGED` |
| `docs/product-quality-standard` | `523410108814022dc051bab949009ee21e198761` | false | — | false | 1 | `REVIEW_UNMERGED` |
| `docs/requirements-gate0-closed-2026-08-31` | `4a86ea753bf3f7c5cfd667661f6a01557280b8ba` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `docs/requirements-s4-r1-closed-entry-target-2026-08-31` | `2aac34ddea0c88327986fc459826892d8895f3d0` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `feat/account-ap1` | `3be37b852f0aa6ebf8f1191aaf75c548f6bf878c` | false | — | false | 14 | `REVIEW_UNMERGED` |
| `feat/account-ap2` | `a6db9589b32a93ccefb301aed3d40a8dbdbc7c2b` | false | — | false | 18 | `REVIEW_UNMERGED` |
| `feat/account-nav-rail-consistency-2026-08-30` | `08a626c466631cc2e0d1d434d58d28241c625faa` | false | — | false | 1 | `REVIEW_UNMERGED` |
| `feat/admin-control-center-ia` | `81de9b3db11e7f58ff59132e22bf9f35fef68b57` | false | — | false | 11 | `REVIEW_UNMERGED` |
| `feat/admin-system-health` | `2ca916e91dbf53f9c5cad9a980cc141938fbebe6` | false | — | false | 5 | `REVIEW_UNMERGED` |
| `feat/entry-requirements-detail-contract-e1-2026-08-31` | `56e018d36a176c0061a57978b8a6b5044369409d` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `feat/mobility-transfers-foundation` | `9d3fcef38ffebac91d5f9f3806659236a10c694b` | false | — | false | 13 | `REVIEW_UNMERGED` |
| `feat/provider-flight-evidence-s2` | `6865c8a1cde9b44dd0ce8c690fca12139e763b7c` | false | — | false | 24 | `REVIEW_UNMERGED` |
| `feat/provider-ops-s1` | `ba10cb206d1f1d40f6e2dc14b917f18c65601c44` | false | — | false | 5 | `REVIEW_UNMERGED` |
| `feat/rental-car-foundation` | `073dc505f65c5ed026a88981a578cd02f98c8b04` | false | — | false | 19 | `REVIEW_UNMERGED` |
| `feat/requirements-truth-ops-s4-r1-2026-08-31` | `595b4ad2a827beff7bec597433b3316d21da0747` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `feat/requirements-truth-ops-s4-r1-ready-2026-08-31` | `595b4ad2a827beff7bec597433b3316d21da0747` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `feat/route-transit-intelligence` | `11bfc958aba54486148fa756f5f8d4616ff86c8a` | false | — | false | 81 | `REVIEW_UNMERGED` |
| `feat/travel-readiness-foundation` | `a5099b98c9456ce07c9b12443d5540843ef8f669` | false | — | false | 32 | `REVIEW_UNMERGED` |
| `feat/travel-safety-disruption-intelligence` | `11976ed734b62ec906abd65581f309b1a38362f1` | false | — | false | 29 | `REVIEW_UNMERGED` |
| `feat/travel-timing-seasonal-intelligence` | `1a61d21fe853c77faa1109ae0828e39f3629098a` | false | — | false | 89 | `REVIEW_UNMERGED` |
| `feat/traveller-context-intelligence` | `725aee462c93e5dba7da7a1a7fd8c51bf16a39bb` | false | — | false | 50 | `REVIEW_UNMERGED` |
| `feat/trip-collaboration-foundation` | `e0132cb576e8231296dc5b290e0afcef88ceb9f4` | false | #28 | false | 1 | `KEEP_OPEN_PR` |
| `feat/trip-coverage-booking-status` | `1f6f4ba0acfe5287d292742f6992f2a3dd38e077` | false | — | false | 21 | `REVIEW_UNMERGED` |
| `main` | `26b44e8f93ebf378d9d367c5e7cb2f9701efd12e` | true | — | true | 0 | `KEEP_MAIN` |
| `ops/creator-media-c2-recovery-2026-08-30` | `cf2bbd5b71392f17c8f31e2a13e450ae9de72e15` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `ops/creator-media-c3-decommission-2026-08-30` | `e8069799774433c905663b00867085bab4dbd461` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `phase-3-2-hotel-foundation` | `fb26270d84c3dc661ffe71969556edad236628b0` | false | — | false | 13 | `REVIEW_UNMERGED` |
| `phase-3-3-activities-foundation` | `d0fcae38738b7f3763a90215e033bfb3128587e6` | false | — | false | 10 | `REVIEW_UNMERGED` |
| `recovery/core-repository-hygiene-2026-08-30` | `a759764eefa568784bfa08029b386b978e1d2138` | false | — | true | 0 | `DELETE-SAFE_MERGED` |
| `tmp-noop` | `9cc9b0526683f161f500326a7b72c74abac9c296` | false | — | false | 10 | `REVIEW_UNMERGED` |
| `ux-trip-workspace-mobile-iteration-1` | `d2ec70d79982ea28f685d8715cd2d145af53e53a` | false | — | false | 13 | `REVIEW_UNMERGED` |

## 8. Recommendation for Phase 2

Unchanged policy. After a fresh Technical-Lead PASS on the synchronized Exact Head and a later separate Phase 2 task:

1. Allow-list only the 15 exact name→SHA pairs in the **sync** manifest.
2. Re-check name, SHA, open-PR, protection, and ancestry against the then-current `main` immediately before each delete.
3. Drift ⇒ STOP that ref.
4. Do not delete tags, close PRs, or change protection.

## 9. STOP

Sync-only work is the deliverable. No branch or tag was deleted. No stale PR was closed. No protection was changed. `docs/ACTIVE_WORK_STATUS.md` and `JETNITY_START_HERE.md` were not edited.

The previous PASS on `ef0c50a9…` is historical. This synchronized head needs a **fresh** independent Technical-Lead Exact-Head re-gate.

Ready, merge, and Phase 2 remain forbidden for this agent.
