# Official Truth Current-Version Lookup 1 — CI Repair F5 TASK V1

**Binding immediate review correction. 23 October 2026.** Parent #975; Draft repair PR #979; merged original #976. This is an explicit Technical-Lead amendment for a separately identified existing native test failure within the current repair, not an automatic feature follow-up.

## Authority, exact baseline and same author

- Main: `76a30c5694bc7bd0dfb20544eb05a6c884c51576`.
- Current reviewed repair head: `1e7459b79d92131a2d9aa89131e33ba4a2493131`, tree `5111c273ff75527578d8feb0dae8edb246d35b94`.
- Existing branch: `fix/official-truth-current-version-lookup-1-postmerge-f4`; keep Draft #979.
- Same logical author: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**.
- Same real Cursor session: **bc-16e2789c-fc9b-4bbc-925b-ba43273b6cc3**; actual Owner-approved **grok-4.7-high-fast**.
- Root F5 finding: https://github.com/Jetnity/jetnity/pull/979#issuecomment-6372245319 .
- Live operating mode was read as NORMAL before this dispatch. Only Technical Lead may set PASS, Ready or merge.

Read this new task, the original F4 task, current actual head/main, failure log and the original M1–M4 contract/stability task before work. ACK actual seed, session/model, clean worktree and main. No new session/generation or silent model fallback. Preserve unrelated changes and STOP for main drift or a conflicting writer. The old October11 stability task and its original author remain historical evidence; this new explicit assignment owns only the current bounded correction.

## Observed failure, not an invented diagnosis

Actual PR run **40002295282**, app job **120581914391**, exact1e7459b: the current-version F4 native proof PASSED all19checks on PostgreSQL16.15, diagnostic228091ms under300000ms. The unchanged custody test instead exceeded its240000ms parent limit at240003.457393ms; child12 expiry/disposal was cancelled. Overall7121tests/7117pass/0assertion-fail/2cancelled/2skipped; hygiene/build skipped. No overall PASS.

The custody source blob is **fea99201117ffb41564c381eea39f0adb7f62ace**, last changed11October, identical on main and repair head. Original logs show custody234134.081103ms in #976 final PR run39994517447 and231628.919286ms in main run39997551343. Current stages1–11 completed with expected negative SQLSTATEs, reaching stage12 at approximately224239ms; earlier successful stage12 required18–21seconds. Previous successful runs had only6–8seconds headroom. A unique deadlock/runner-contention cause is not proven.

## Exclusive editable scope

1. `lib/readiness/official-truth-original-custody.test.ts`.
2. The existing four current-task delivery notes:
   - `docs/OFFICIAL_TRUTH_CURRENT_VERSION_LOOKUP_1_PLAN_2026-10-23.md`
   - `docs/OFFICIAL_TRUTH_CURRENT_VERSION_LOOKUP_1_STATUS_2026-10-23.md`
   - `docs/OFFICIAL_TRUTH_CURRENT_VERSION_LOOKUP_1_HANDOFF_2026-10-23.md`
   - `docs/OFFICIAL_TRUTH_CURRENT_VERSION_LOOKUP_1_SELF_REVIEW_2026-10-23.md`
3. This new F5 task is immutable after dispatch; only TL may publish a further version.

All other files are frozen. Specifically:
- F4 current-version test **a4b058c21f894ab64f044063f45b1d31845ace82** and all19 scenarios.
- F4 task **a93581f630fba4673e22a8ff6c306aa0ea6e1d43**, original TASK V1/V2/V3 and all October11 tasks/contracts.
- Custody storage helper **e9798d606309fa121cf4fb21a28cf15e191fd27d** and SQL **36b525580509069039ca6787c25a0a5b94155986**.
- Current-version lookup **d9a22eba073752a94bdc58616c70100d557b3f61**, fixtures **e88c7490269b2ee0079cf335fb2942f99561fc39**, SQL **609d10b9727e5fa4f91896d64086798e989ae50b**.
- All other helpers/fixtures, runtime/UI, source/provider, workflow, package/lock, test runner, hosted and secret files.

## Permitted correction and mandatory equivalence proof

Independently verify this narrow candidate before implementing it. Report a concrete contradiction rather than applying the suggestion uncritically.

The existing stage4 performs an ordinary successful `persistCandidate(..., 'verify_existing')` and checks idempotence plus all sixteen relation counts. Stage6 later injects loss of acknowledgement AFTER a real idempotent COMMIT, asserts only `commit_outcome_unknown`, restores the connection hook in finally, verifies unchanged counts, checkpoints independently, and performs another real, uninjected `verify_existing` success.

The last call can prove both ordinary idempotence and explicit reconciliation of unknown commit outcome. It uses a fresh owned producer and the unchanged full publisher/binder/COMMIT/fresh-reader original/provenance proof. The preceding lost-ACK operation must remain unable to return success. Its real idempotent COMMIT must leave the stored originals, review and history unchanged. Counts establish no added relation rows/history; actual byte equality and completeness remain established by the full unchanged verifier, not counts alone.

Make only this coalescing correction:
1. Remove the duplicate stage4 normal successful verify-existing attempt; move its complete before/after relation-count equality obligation to the existing final uninjected stage6 success. Preserve the independent lifecycle checkpoint before subsequent logical operations.
2. Keep stage4's original input-ownership mutation test, inserted result, fresh-reader verified status, **explicit positive read after persistCandidate has returned and its producer is closed**, ciphertext-at-rest check and wrong-key SQLSTATE39000 negative. Do not replace that explicit read with a cached earlier receipt.
3. Keep stage6's real COMMIT-then-08006 acknowledgement-loss injection, exact unknown-only result, finally restoration of the hook and counts equality immediately after unknown. Explicitly assert the normal connection hook is restored before the final successful retry. That assertion proves test-hook restoration, not database durability.
4. The existing final real uninjected retry must assert success, idempotent outcome, unchanged full sixteen-relation counts, exact primary recordFingerprint, synthetic custody status, expected single support, historical originals re-proved, unchanged independently held cursor and NOT_AUTHORIZED/positiveVisaCells0. Preserve actual readback through existing functions and a fresh reader. No stub, cached positive, skipped phase or readback substitution.
5. Keep all **12 existing named scenarios** and their genuine cases, all original crypto/UTF8/SQL-TS boundaries/ACL/rollback/ordered composed supports/quota/immutable-history/corruption/stale-age/stale-witness/restore/withdrawal/supersession/lock-race/expiry/disposal/no-resurrection assertions and legacy-empty checks.
6. Keep one native custody parent with **240000ms**, current-version parent **300000ms**, and all runtime SQL/lock/heartbeat/transport limits. No timeout inflation, skips, swallowed failures, splitting to evade the parent, workflow/runner serialization or concurrency changes, rerun-only acceptance, additional fixtures or shared-helper edits.
7. Existing safe custody fixture/phase diagnostics and final12-check authority diagnostic remain. Do not log keys, connection strings, source bytes, full SQL/parameters, ciphertext or personal paths.

The removal saves one full publish/bind/commit/current-read/archive-read path. Quantify the actual call reduction and observed duration; do not promise a fixed GitHub duration or call runner contention proven. If the correction cannot preserve these obligations or measured improvement is inadequate, STOP with a specific smallest-amendment request.

## Verification and truthful delivery

This task defines current verification; the completed October11 local three-run exercise remains historical. Run the focused actual native PostgreSQL16 custody test once on corrected code, showing all12 scenarios, complete final authority diagnostic, duration and safe phase evidence. The F4 test is frozen and its actual228091ms CI evidence already exists; no optional local rerun is required merely to repeat it. Ordinary final-head CI must rerun both real native proofs and the entire mandatory suite. After TL review/merge the actual main PUSH suite must independently pass as well. No blind repeat of a failed final head is acceptance.

Document the exact moved assertions and proof conditions, source before/after call inventory, actual focused command/PG version/result, all unresolved limits and pending CI honestly. Correct stale four-skip local wording if touching that delivery section: distinguish historical local counts from actual7121/2skip hosted evidence. Do not claim an unfinished final-head run passed.

Commit only this custody-test correction and truthful four owned delivery notes on the same branch. Keep #979 Draft. Provide exact head/tree, main/merge-base/ahead/behind, task blob and frozen file checks; actual same session/model, CI and Preview. Do not make a commit solely to quote its own resulting SHA. Then STOP for root independent review. TL re-gates every changed head.

## Preserved special gates

Synthetic local proof only. No hosted Supabase SQL or apply, blocked #917 retry/rewording/alternate connector/credential/operator/manual-Owner-SQL workaround, actual government/source/provider acquisition, real legal Rule, source admission, pilot/provider/Production activation, secret or retention-hosting change, customer data, outreach or new cost. #917/#944/#937/#748 and all special gates remain.

**DO NOT MARK READY. DO NOT MERGE. DO NOT START A FOLLOW-UP SLICE.**
