# OFFICIAL TRUTH — PERSISTED CANONICAL READ 1 — TL AMENDMENT R4

Date: 2026-11-07
Tracking: #1150 / Draft PR #1151; continuity #751 / #917.
Authority: Root Technical Lead. This is the immediate same-author review correction to the existing package, not a successor feature or an activation.

Author: Jetnity Official Truth Persisted Canonical Read 1 — Codex Generation 1.
Actual session: `/root/persisted_canonical_read_writer`.
Implementation base: `aafc696d0384bdfc6200f07db9b7dd6db1448dc1`, tree `470926fe4ee707b56a03ad022b01e3b49c62bd3d`.
Accepted main remains `a5be31e0798cf1d03aae70cdf3b68cddd115ff3a`.

## 1. Concrete independent evidence

Root independently read the completed original App log of CI **42382052800 attempt 1**, job **128431552724**. It reports 8,190 tests / 935 suites, 8,186 pass, 2 fail, 0 cancelled, 2 unchanged layout skips, 0 TODO; test duration 1,031,923.736ms. Typecheck/Lint and Auth job 128431552463 passed. Hygiene and Build did not run.

Root CHANGES REQUIRED: https://github.com/Jetnity/jetnity/pull/1151#issuecomment-6708531436

The two real findings are:

1. The new native test fails its R3 feasibility assertion at line 360. The last successful complete Primary read took 37,901ms; the maximum original-SQL duration was 7,391ms. Together with the required 5,000ms reserve, the calibrated window exceeds 45,000ms. Actual producer COMMIT/closure, fresh Primary reader and held guard were reached, but the later final-success deadline, earliest-bound, composed, 3-/4-receipt, ACL and rollback cases were not reached. This is not a 900-second aggregate timeout: native duration was 314,112.714ms.
2. The existing integrated storage concurrent-writer proof fails at the unchanged 25-second SQL limit: SQLSTATE 57014 after 25,013.758ms, barrier 9,713.987ms, other writer inserted in 18,599.952ms. Expected inserted + idempotent; observed inserted + failed. Existing integrated test duration was 612,618.068ms.

In the earlier complete run 42378701031, the existing integrated test took 571,690.890ms and the new native test 269,289.740ms, exceeding the entire test-stage duration of 734,668.026ms when added. Their execution therefore overlapped. The current package command uses Node's default test-file concurrency; the official Node22.23.4 documentation describes that default as availableParallelism minus one:
https://r2.nodejs.org/docs/latest-jod/api/cli.html#--test-concurrency

Resource contention is a supported hypothesis, not a proven sole cause. This amendment selects a deterministic scheduling correction and requires new measured results; it does not declare either finding resolved.

## 2. Exact selected correction

Keep the entire existing npm test command as the byte-identical first command in a two-phase sequence.

Move only the newly introduced, unmerged aggregate native test:
- from `lib/readiness/official-truth-persisted-canonical-read-1-native.test.ts`
- to `scripts/db/official-truth-persisted-canonical-read-1/native.test.ts`.

Append to the existing `scripts.test` value in package.json, using shell AND:
` && node --import ./scripts/server-only-test-register.mjs --import tsx --test scripts/db/official-truth-persisted-canonical-read-1/native.test.ts`

Thus the full existing glob-based run finishes successfully before the complete new native proof begins. Neither phase may be optional. A failure in either phase must fail npm test and the existing required CI job. The exact new path must be outside all first-phase globs and explicitly invoked once in the second phase; do not retain a duplicate copy or import that executes it from the first phase.

This does not split the new native parent test or its matrix. It retains its one cluster, one parent test, all real concurrent actors inside existing tests, full actual capsules, complete full-corpus lookup, real COMMITs and closed producers, all native positives and adversarial cases. In particular, the existing concurrent writers still execute concurrently within their original proof.

## 3. Narrow author edit set

Only the following changes are authorized for this correction:

1. `package.json`: change only the existing scripts.test string by the exact append above. No other field, command, dependency, engine or override change.
2. Delete the old native-test path and add the new path. Preserve the entire R3 test logic and values. Adjust only relative imports and the three file-relative SQL/migration URLs needed by relocation, plus a short accurate scheduling comment if necessary. The prior native Git blob is `1ca95a935ae99433b8f3ec50e222771a301182ba`.
3. Update `docs/OFFICIAL_TRUTH_PERSISTED_CANONICAL_READ_1_HANDOFF_2026-11-07.md` with the exact R3 failure evidence, R4 scheduling correction, relocated path, exact manifest, known remaining runtime uncertainty and STOP state.

Root alone authors this R4 document. TASK/R1/R2/R3 stay byte-identical. Every other delivery file, every pre-existing main test and helper, all SQL, runtime, storage, extraction/projection/canonical code, application files, package-lock and CI workflow remain byte-identical to the implementation base.

This explicitly supersedes R3's frozen-package/test-location restriction only for the exact scheduling change above. It does not supersede its proof, assertion, calibration, deadline or budget requirements. No further edit is implied if a later concrete gate fails.

## 4. All protective and proof bounds remain fixed

- Full CI App job: 30 minutes.
- New native aggregate parent test: 900,000ms.
- SQL statement: 25 seconds.
- SQL lock: 15 seconds.
- Idle transaction and COMMIT: 20 seconds each.
- Actual runtime reader: 60 seconds, monotonic checks retained.
- R3 calibration: actual successful full-read duration + maximum original-SQL duration + 5,000ms; assert at most 45,000ms, no clamp/retry.
- Earliest-bound fixture: the explicit additional initial delay allowance, strictly below 50,000ms.
- Intentional response/staging waits, measured whole idle interval and decisive earliest-bound margins: all R3 assertions unchanged.
- Original retention/freshness/lifecycle and canonical source bounds: unchanged.

No retry-to-green, new skip, reduced fixture, altered clock, extended authority, cached positive, timer weakening, new cluster, worker pool, paid runner, service, dependency, test gate bypass or workflow change. The order change must solve the measured feasibility problem on the unchanged CI resources or report a new concrete failure.

## 5. Verification and completion criteria

Before returning, statically verify relocation resolves every import and SQL URL to the same existing source; compare the moved test against the prior blob allowing only those path/comment changes. Verify package.json differs only in scripts.test and package-lock is untouched. No local native pass may be claimed without actual PostgreSQL and the complete environment.

Author returns a manifest for package.json, old-path deletion, new-path addition and HANDOFF, including baseline/current Git blobs and SHA-256 for written files. Then returned / STOP; no new work.

Root independently compares the whole resulting tree and conducts full exact-head re-gating. Expected test inventory, absent unrelated changes:
- Phase one: 8,189 tests / 935 suites; 8,187 pass, 0 fail/cancelled, 2 unchanged layout skips, 0 TODO.
- Phase two: the one complete native parent test; 1 pass, 0 fail/cancelled/skip/TODO.
- Combined: 8,190 tests, 8,188 pass, 0 fail/cancelled, exactly the two existing layout skips.

Counts are reconciliation targets, not fabricated evidence. Original logs must show both successful phases and all native completion diagnostics, including three actually successful final-SQL response delays, the distinguishing earliest-bound interval, complete composed/version/forgery/ACL/rollback cases, all five hygiene checks, Build and fresh Auth. The unchanged integrated concurrent-writer proof must genuinely pass. Preview, main/head/tree/merge-base, threads and ruleset are checked fresh. Normal merge only after Root PASS; actual-main CI and Production/domain verification remain mandatory after merge.

## 6. Preserved product and platform authority

This remains dormant synthetic/local infrastructure for the persistent versioned own entry database. It is not a new prerequisite for the current-request-only CH-to-DE pilot, not hosted installation, not a real visa finding and not production accepted-reader authority.

No hosted SQL/readback/retry or alternate route. Development remains **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**, actual ledger **UNKNOWN**, Stage2 **NOT_ATTEMPTED**. No evidenced platform clearance exists for the original denied readback. Existing Owner consent remains valid within its scope, without being requested again.

All App/Provider/Source/pilot hard-offs, AA source/window pins and special Product-Owner gates remain. #1131, #985, #937 and #913 remain held. Cursor remains paused. No new spend/settings/service changes, no automatic successor.
