# Guest Trip Read Recovery 1 — TASK ADDENDUM V3

Date: 24 October 2026. Technical-Lead-owned immutable addendum to TASK V1 and ADDENDUM V2; both earlier task versions remain unchanged.

## Authority, author and exact failure

Same owner-authorized finite R104 lane B, tracking issue #991, Draft PR #994, branch fix/guest-trip-read-recovery-1. Author remains **Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1**, original Cursor session **bc-2806475d-7ee4-40d0-980e-1d26bcb5b270**, actual model grok-4.7-high-fast. No new author or generation.

Accepted main and merge-base: 913cf9353fd33491d2bd3130b3c430cc88990200. Integration remains B → A → C.

Root independently reviewed exact head **f2d8f7e4d94c0a9659652c025b7852862e0b4953**, the original complete App CI log and both existing test adapters. [Run 40087269667, App job 120852780101](https://github.com/Jetnity/jetnity/actions/runs/40087269667/job/120852780101) failed: 7173 tests, 7169 pass, 2 fail, 2 existing skips, 0 cancelled. This is a real test-adapter failure, not an infrastructure timeout. Later API/schema/dead-code/export/package/build steps were skipped and are not accepted.

Affected existing tests:

- lib/trips/flug-manuell.test.ts: narrow Workspace wiring refreshes account on success and uses persisted guest graph.
- lib/trips/unterkunft-manuell.test.ts: Arbeitsbereiche verdrahten den engen Callback mit Server-Refresh bzw. gespeichertem Gastgraph.

Both fail with Cannot read properties of null (reading 'useRef') in useGastLeseFokus. Their direct evaluated-component harness substitutes React only in the parent module; the newly imported focus hook uses real React without a renderer. Root also identified two subsequent adapter mismatches: the old three-state fixture does not represent the five-state settled matching-trip state, and the returned root is now the focus wrapper containing the actual TripWorkspace.

## Narrow additional test write permission

Permit changes **only to the guest-workspace adapter setup and access within those two named existing tests**, including the local element type and an explicit import-level focus-hook test seam. The existing general laden() evaluator, all unrelated tests and all account adapter/assertion code remain unchanged.

The guest fixture must represent a valid settled matching-trip state, including the same requested trip ID, with no artificial context reset. Select and verify the actual TripWorkspace element beneath the focus wrapper before retrieving its callback. Do not substitute or reimplement GastArbeitsbereich, its mutation callbacks, or the asserted persisted-graph behavior.

A narrowly documented no-op focus-hook seam is allowed for these callback-wiring tests, because actual focus behavior is independently exercised by the lane's mounted browser proofs. Do not claim these two unit adapters prove React rendering or browser focus. Do not globally stub React/storage, change production modules, intercept unrelated imports or hide unexpected exceptions.

## Assertions and acceptance that must remain

- Preserve every existing assertion of exact callback inputs and trip/item IDs.
- Preserve the account success refresh, no refresh on failure, and pre-mutation invalidation assertions.
- Preserve guest success returning null and passing the actual persisted graph to state.
- Preserve failure message propagation and exactly one total successful state write across success then failure.
- Preserve the assertions that TripWorkspace forwards the relevant narrow callback to FlugBestand / UnterkunftBestand.
- Add an explicit actual Workspace-child identity check so extracting a callback from an unrelated wrapper cannot pass.
- No removal, skipping, tolerance change, expected-error conversion, relaxed write count, replacement with a source-only assertion, or weakening of the existing behavioral tests.
- V1/V2 runtime, storage contracts, queue facade restrictions and all R1 behavioral acceptance remain unchanged. No runtime changes are authorized by this V3 correction.
- Run the two complete affected test files together with the lane's existing focused regression set, not only the previously passing 192 tests. Report actual counts and commands.
- Re-run the unchanged dedicated mounted browser proof, typecheck and relevant lint. Preserve local-only network enforcement and report real outcomes.
- Refresh PLAN/REPORT/STATUS/SELF_REVIEW/HANDOFF with this V3, the exact new head and the adapter-only diff. Author self-review remains distinct from TL PASS.
- Fresh exact-head full App/Auth CI, Preview association, independent review and review-thread checks are required. No unchanged-head rerun may be presented as fixing this failure.

## Stops and delivery

Fetch and incorporate this TL documentation commit without force-pushing or discarding work. Continue only in the original author session. If a real runtime defect rather than the documented adapter mismatch is found, report it before expanding this correction.

This is the same ordinary product task, not a fourth lane or a Product-Owner activation. All standing holds remain intact. No hosted/Supabase/Auth/RLS/migration/provider/model/credential/budget/Production operation.

Keep the PR Draft. Ready, merge and tracking-issue closure remain exclusively with the Technical Lead after complete review and post-merge acceptance. Do not start a follow-up task. Deliver the exact review-fix head and stop.
