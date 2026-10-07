# Integrated development pilot 1 — TL-R5 correction report

Author evidence for Issue #899 / Draft PR #906, same Generation1/session. No independent acceptance or post-merge PASS is declared. The [R5.0 amendment](OFFICIAL_TRUTH_INTEGRATED_DEVELOPMENT_PILOT_1_TL_R5_POSTMERGE_CORRECTION_2026-10-07.md) and [TL report](https://github.com/Jetnity/jetnity/pull/900#issuecomment-6044381666) govern this correction. `realOfficialSourcePilot=BLOCKED`.

## Retained failure and attribution limits

Actual-main de966 run37663759724 failed `assert.ok(recovery.ok)` in native R3 at18:14:46Z. Its294,677ms test duration, later18:22:52Z cancellation, and missing scenario/result/SQLSTATE remain recorded honestly. The historical log cannot uniquely identify the failed guard scenario or COMMIT cause. Log SHA256: `259952a0906e2eb0eddd5a786ec5c74856d34d28c072c3ed7dc17dc4c85170b2`.

The unchanged job budget is20minutes. Checkout consumed approximately279s; tests ran852s until cancellation. The later cancellation does not explain away the earlier assertion. Complete native/full-suite PASS totals were absent; hygiene/build did not run. No Production database incident is inferred from this dormant developer-local proof failure.

Instrumentation-only checkpoint58eb5d9 adds bounded guard/successor phase, elapsed/code/ACK/protection, result and independent readback diagnostics before assertions, including partial progress on failure. Only fixed safe fields are emitted, without SQL, parameters, PID, account or home path. Arming refusal retains its distinct diagnostic code. Native transport and outcome semantics are otherwise unchanged.

The unmodified GitHub Linux/x64 full suite at diagnostic58eb5d9 also fails naturally:923,306ms,5765/5766 pass, one R3 positive URL COMMIT error57P01 at r3-proof.ts59. The69 semantic and16 structural groups pass; guard scenarios are not reached. Actual checkout is the synthetic mergee4ea1487d728f2a794e25cc14cda80c4835cf886. This is a separate native full-suite RED consistent with the measured COMMIT budget mechanism, not the original de966 recovery assertion. Safe phase/scenario/operation/readback diagnostics now also cover these preceding URL-positive cases.

## Measured cause and minimal correction

Normal instrumented Mac R3 and Linux/arm64 full-suite runs passed; neither is relabelled RED. Native profiling found1568 typed artifact checks, each invoking the legacy decoder and then decoding the identical canonical envelope again, including during deferred COMMIT.

A controlled native Linux/PostgreSQL16.15 experiment isolates this cost: one CPU, five bounded owned CPU competitors activated only for real COMMIT,4GiB memory, no network, no extra target SQL delay, unchanged20s guard. Baseline publication succeeds, but COMMIT ends after20,070ms with57P01, no ACK and `commit_outcome_unknown`. Independent checks prove all eight tables empty, absent receipt and released writer advisory lock. Another actual writer then inserts and verifies652 rows. This is a measured failure mechanism; it does not reconstruct the missing historical x64 scenario.

The correction extracts the existing pure `artifact_envelope` checks into a shared local SQL helper. It still verifies hash, exact canonical bytes, metadata, closed header, family/version and every declared edge. Both legacy and typed readers consume that checked value. All v2 typed-content, semantic, role-edge and exact declared/derived equality checks remain. The v2 reader avoids a second decode and an unused generic custody-pin walk. No validation cache, skipped constraint event, canonical policy or resource limit is introduced. The disposable read executor receives only the additional pure-helper grant.

The identical final contention experiment with corrected SQL succeeds: actual COMMIT ACK after17,072ms,652-row complete semantic/byte-exact readback, released write lock, then independently verified idempotent writer. The initial exploratory pair also failed baseline at20,051ms and passed corrected at18,323ms; both remain recorded. Worker startup/lifetime and owned-cluster cleanup are bounded.

Native statistics preserve638 artifact-constraint events,638 retained-parent verifications and1568 typed artifact verifications. Decodes fall3963→2395; measured uncontended COMMIT falls3584→2653ms. These are observations, not hard real-time guarantees under arbitrary scheduling or starvation. Fixed deadlines still refuse work that cannot complete within their budgets.

## Verification and reproducibility

`r5-regression-evidence.json` records causal RED/GREEN, safe operations, independent outcomes, profiling and private-log digests. The new mandatory native regression exercises both legacy and typed consumers: six positive calls and32 rejections of rehashed lexical/header/declared-edge or metadata contradictions. Existing69 semantic/security,19 R3 and16 structural groups remain mandatory: actual Primary652/Composition720 roundtrips,1–16 representations, semantic negatives,1008 URL comparisons, four real guard-loss/held-dispatch/ACK barriers, fixed deadline rollback, lock release and complete independent readback.

Use `npm run official-truth:pilot-1` and `npm test`. The separate hardware-specific causal diagnostic is opt-in:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/db/official-truth-integrated-pilot-1/r5-contention-proof.ts --run-native-commit-contention
```

It requires native Linux/Node22/PostgreSQL and a disposable environment constrained to one CPU. It intentionally exits1 against baseline SQL after recording unknown outcome, empty readback and successful successor. Test baseline's two SQL files only in a separate disposable checkout; do not reset an owned tree. Normal full-suite runs remain separate from this controlled experiment and are labelled by platform. No PGlite, dependency, package or workflow changes.

Actual commands/counts/durations are in command-results; the generated developer report retains its invocation result. Source `NOT_RUN` for this invocation does not clear the retained overall `BLOCKED` status. Earlier R2/R3 evidence remains unchanged and historical. Container setup failures (inaccessible host Git alternates and correct rejection of inherited image PG build variables) are separate preparation failures, not product RED.

## Custody and remaining boundaries

Local work was preserved in a private Git bundle and delivery copy before safely fast-forwarding the clean owned checkout to TL seed1eb1ce7. No agent-authored main-sync/reset/force push. Baseline main/merge-base:de966778a06183748e3807bcb6af9a6cbeaeb326. Immutable original TASK:ca60cdd60bdd9682fc0f0a05d9e9f53fe17986ad; R5 amendment:cb0605510f205313dd942b4125e801b3da938600.

Session `01a11333-cbc2-7282-b194-27335e632c61`, actual `gpt-6-astra/xhigh`, read from current metadata2026-10-07T20:09:43.182Z; SINGLE_AGENT. The separate publication receipt binds final head/tree, every changed-file blob, TASK/amendment, main/merge-base/ahead/behind, actual CI checkout and fresh CI/Auth/Preview. A commit cannot embed its own hash; earlier-head gates never transfer.

Frozen contracts, R1 bounds, R2/R3 semantics and accepted namespace remain. No hosted Development/Production change, migration, auth/RLS/F8/provider/registry activation, source campaign, retention/cost/secret/launch decision, #904/#905 edit or reopening #903/#902. Multiple backend/control failures still retain honest uncertainty; finite tests are not a universal equivalence proof.

STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW. Draft remains; only ChatGPT/Technical Lead decides acceptance, main synchronization, Ready and merge.
