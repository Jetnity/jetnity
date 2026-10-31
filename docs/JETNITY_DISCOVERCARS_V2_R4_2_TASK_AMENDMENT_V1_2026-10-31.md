# DiscoverCars V2 — R4.2 resize-test correction — IMMUTABLE TASK AMENDMENT V1
Date: 31 October 2026, Europe/Zurich. PR #1084; immediate required-CI correction, no new product slice.

## Authority and frozen baseline
The owner authorizes completing the existing three integrations and TL merge after full independent acceptance. Only the Technical Lead may Ready/merge.
Candidate c91a4b030143c61c1dcfaf63fa354e2dc7cdae3d; tree 75f807a7a9529bfcd48922a734e473335bee09fc; accepted main/merge-base b7ebc399b92303eacda9afdaa1786f245492051f; 11 ahead/0 behind before this documentation-only seed.
Same original genuine Cursor session bc-1885a130-36a8-4dcf-86bc-48aa6121c24e, display name Jetnity DiscoverCars Official Search Widget V2 Opt-In 1 — Cursor Generation 1, originalModelName grok-4.7-high-fast. Verify real run-info and post PRE-CODE PLAN before source edits. No replacement agent or generation.

## Independent evidence and unresolved cause
R4.1 source integration/style/focus corrections passed independent review. Required native run 41198853363 failed App job124530503617: 7710 tests,7707pass,1fail,2conditional skips. Auth124530503778 passed. Later CI gates/build were skipped, so no complete CI PASS.
Only failure is lib/trips/ux-u1b-route-detail-1/browser.test.ts:309 in “die Suche bleibt ein Mount über Tabs, Resize und Zur Route”: computed nav position was neither sticky nor fixed; actual value absent. Earlier counts/network assertions passed.
Read-only diagnostic task #1084/6543269272; report #1084/6543336861. Three candidate-only local attempts observed an immediate stale mobile fixed bar at viewport1440, then settled desktop sticky. Both positions pass the old assertion. Neither failing static/relative value nor a full-main execution was reproduced. Therefore DO NOT claim the CI root cause is proven or a stable product defect is fixed.
Root and independent reviewer confirm the relevant test/nav/workspace/layout sources are byte-identical to accepted main. The test nonetheless has a demonstrated synchronization weakness: it reads immediately after resize and accepts the stale mobile state.

## Explicit one-file ownership exception
For this immediate correction ONLY, TL assigns exclusive write ownership of lib/trips/ux-u1b-route-detail-1/browser.test.ts, limited to the one named existing test. Other agents must not write that file during this task.
Also writable: minimal truthful append/current-summary updates to existing DiscoverCars own STATUS/HANDOFF/SELF_REVIEW/REPORT. Original Task V1, R4 amendment and this R4.2 amendment stay byte-for-byte immutable.
All product components, route/layout/model files, CSS, U1B harness, other tests, package/lock/workflows, shared status, other providers, env/DNS/DB/Auth/RLS/protection remain read-only. No product fix justified by present evidence.

## Finite implementation
1. Read actual source and existing test; fetch current main and report any drift. No unnecessary merge if unchanged.
2. Immediately after final 390-to-1440 resize, BEFORE final counts/network assertions, wait for actual committed desktop state: innerWidth1440, workspace kompakt0, U1B anordnung neben, nav data-shell-nav sticky. Use a bounded state-based wait and the existing test timeout contract. No fixed sleeps, automatic test reruns or enlarged global timeout.
3. Then require actual computed position sticky for this known desktop sticky variant. Preserve mount1/unmount0/request1/empty-network assertions unchanged and evaluate them after settling. Do not accept stale fixed mobile navigation as desktop success.
4. On failure, include observed viewport, compact/layout/nav attributes and computed position in assertion/timeout diagnostic. Do not suppress errors or replace expected values with observed values.
5. If settled desktop state or sticky requirement fails consistently, STOP with evidence before product/CSS changes.

## Verification and truthful delivery
Run the single corrected case once as the primary positive witness. Demonstrate in disposable/untracked synthetic local fixture that a settled wrong static/relative nav still fails; no provider/DB/external network. Keep original assertions and no test skips/retries. The prior diagnostic budget was at most4 attempts total and3 used; no more exploratory loops. State explicitly if the remaining original diagnostic main attempt was not used; code equality is not a full-main runtime reproduction.
Meaningful narrow test/typecheck/lint checks only as needed; push one final correction head. Native full App/Auth CI and Vercel Preview on that new head are mandatory independent gates. Old c91 evidence remains historical, including its red CI.
Return exact head/tree/main/merge-base/ahead-behind, minimal diff, original test logs/counterexample, real session/model/name, accurate CI/Preview state and unresolved runtime/CMP gates.
Keep Draft. No Ready/merge/follow-up. No real widget load, provider calls, consent changes, secrets, env, deployment activation, DB, payments, account changes or new costs.
