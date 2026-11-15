# Trip edit structure preservation — bounded correction

## Authority, baseline and ownership

Sasa authorizes necessary Dev work without another permission question. Production, merges, new costs and login/2FA stay with Sasa. PRs #1196/#1197/#1198 and all their changed paths remain reserved. Operating mode is NORMAL. The already read Jetnity vision, architecture, decisions, design, product-quality and continuity standards apply.

Baseline: main `63544e820e912bd275556588c956a09b99b1cf90`, tree `85735a12a34506b586482bd4610e335d4b14051d`. Branch: `fix/trip-edit-structure-preservation-20261115`. Logical writer: Jetnity trip edit structure preservation — root. This ChatGPT session is the sole writer; journey_audit and another available audit agent review read-only. No Cursor session or external message is implied. This task is versioned before implementation; this package remains Draft and unmerged.

## Product problem and result

Three source-confirmed regressions in the shared edit algorithm affect normal existing travel flows:
1. Shortening a multi-destination trip or removing one day drops destinations that never had assigned days.
2. Extending an unassigned trip, or an explicit multi-destination trip with an open final day, silently assigns new days to its last destination.
3. Even a title change strips the valid destination reference of a protected item already stored without a day.

Preserve deliberately unassigned destinations and days. Retain an originally dayless protected point exactly when its optional stage still exists. Preserve existing intentional removal and detachment semantics, explicit stage extensions, allowed single-destination assignment, historical assignment and all protected booking/price/route facts.

## Scope and plan

Change only `lib/reiseaenderung/anwenden.ts`, `lib/reiseaenderung/geschuetzt.ts`, their existing two test files, `lib/reiseaenderung/direct-trip-editing-1.test.ts`, and this package's TASK/HANDOFF documents. Use existing assignment-mode predicates and existing edit/save/serializer contracts. First add regression coverage and collect the complete targeted failure set; then correct the three related defects together and run the entire edit-domain tests. Independently review the resulting source, then run type, lint, the existing five hygiene checks and normal complete CI/build.

Meaningful cases: fully and partially unassigned trips; duration shortening and single-day removal; a previously assigned stage that actually becomes empty; explicit stage removal; duration extension and day insertion; assigned continuation; single-destination and legacy trips; dayless priced/booked items; date shifts; actually removed parents. Exercise actual manual preview/save paths, Guest storage and reload, Account writer ports and actual RPC serialization without a hosted write. Preserve retry, revision and independent readback checks.

## Boundaries and risks

No UI, create contract, generated types, SQL, database objects, permissions, Auth, service client, API, provider, package, workflow, pin or protected shared documentation changes. No new architecture or product decision. No costs or external calls. Existing ready/merge/Production authority remains with Sasa. Entry display ownership and its full first-display requirements remain in the entry lane. Counts' separate installed BG1 blocker is unaffected.

Primary regression risk is changing established explicit removal or legacy assignment behavior; test counterexamples instead of broad refactoring. Account port/serialization proof does not claim native or signed-in hosted persistence; no real login/2FA is performed. Existing normal CI supplies full repository and native coverage. Do not retry locally blocked native/browser sockets.

## Evidence and handoff

Record exact source head/tree, changed files, independent review, all failures and correction batches, local and CI/build outcomes and remaining limits. Task/Handoff and PR body carry this package's continuity without colliding with global documents.

STOP for independent review and Sasa's integration decision. Do not mark Ready. Do not merge. Reviewers do not start follow-up work; root may select another authorized bounded task.
