# OFFICIAL TRUTH — PERSISTED CANONICAL READ 1 — TL AMENDMENT R5

Date: 2026-11-07
Tracking: #1150 / Draft PR #1151; continuity #751 / #917.
Authority: Root Technical Lead. Immediate same-author review correction; no successor feature or activation.
Author: Jetnity Official Truth Persisted Canonical Read 1 — Codex Generation 1.
Actual session: `/root/persisted_canonical_read_writer`.

Implementation base: `fe03e50e5d4030b64bad59221da0ee43b72aa9b1`, tree `f457ddab7193c6cad198be90abd8e13d0e60cf88`.
Accepted main: `a5be31e0798cf1d03aae70cdf3b68cddd115ff3a`.

## 1. Measured blocker; no invented native failure

Root and the independent reviewer read completed original logs for **CI42385100097 attempt1**, App **128440762495**, Auth **128440762185**.
Root CHANGES REQUIRED: https://github.com/Jetnity/jetnity/pull/1151#issuecomment-6709260435

The first R4 test phase completed successfully at15:32:12.941UTC:
- 8,189 tests / 935 suites; 8,187 pass, 0 fail, 0 cancelled, 2 unchanged layout skips, 0 TODO.
- Duration1,126,551.928ms.
- All five new Unit/isolation cases and all existing native families passed.
- The unchanged full integrated storage test passed in872,119.776ms: Primary671 and Composed740 rows, complete readbacks, real concurrent writers inserted15,261.623ms and idempotent19,751.048ms. Its original SQL/lock/idle/commit bounds remain unchanged.

The second TAP header follows. The complete new native parent then runs approximately538.819s before platform cancellation at15:41:11.760UTC, at the existing30-minute job window. Job metadata:15:10:59–15:41:13UTC, conclusion cancelled; PR head unchanged. No native parent result, second summary or own native phase diagnostics were emitted. Fifteen local provider events do not prove individually identifiable final-success deadline, earliest-bound, version, ACL or rollback cases. No specific900s native timeout,60s reader timeout, SQL error or assertion failure in that parent is established by this log.

Typecheck, Lint and fresh Auth55/243 passed. All five hygiene steps and Build were skipped after cancellation. The full package remains unaccepted.

Measured phase-one work plus the new parent's900-second allowance and setup/hygiene/build cannot be accommodated by serial execution in the same30-minute job. R5 removes that shared-job capacity bottleneck while retaining every test, runtime deadline and actual success requirement.

## 2. Exact selected CI organization

Use the existing standard ubuntu-latest runners, with no paid runner, runner-size, billing, repository-ruleset, secret or account-setting change.

### A. Existing core job

Keep job ID `verify`. Change only its display name to **Repository verification** and the Tests command to `npm run test:core`.

Retain its **30-minute** limit and every original step, order, checkout/fetch-depth, Node22 configuration, npm ci, setup check, operating-mode guard/environment, Typecheck, Lint, all five hygiene checks and Production build. No conditional, skip, retry or failure suppression is added.

### B. Complete new native job

Add job ID `persisted_native`, display name **Persisted canonical read — native**, on ubuntu-latest with a fixed **20-minute** job limit.

Copy the existing core job's first five setup steps exactly: checkout with fetch-depth0; setup-node22.x/npm cache; npm ci; Setup check; Operating mode with its exact event/ref/base/head environment bindings. This preserves the operating-mode guard before executing the native proof. Then run `npm run test:persisted-native`.

This job executes the one existing complete native parent from `scripts/db/official-truth-persisted-canonical-read-1/native.test.ts`. No split, filter, fixture reduction, additional cluster or skip. The native file remains byte-identical to blob **`274b00d8b7d36e0cfd6122f3c6792c6deda40a19`**. Its **900,000ms** aggregate limit and all inner deadlines/negative proofs remain unchanged.

The core and native jobs run independently on separate fresh runners from the same workflow event and checkout identity. Do not serialize them through needs. No secrets, hosted access or deployment step is added.

### C. Strict required aggregate gate

Add job ID `required_verify`, whose display name is exactly **Typecheck, Lint & Build**. This required name must occur exactly once in the resulting workflow. The core job no longer uses it.

The gate:
- uses ubuntu-latest and a fixed **2-minute** limit;
- has direct `needs: [verify, persisted_native]`;
- has job-level `if` equal solely to the GitHub `always()` expression;
- runs one unconditional assertion step;
- binds CORE_RESULT and PERSISTED_NATIVE_RESULT from the two exact needs result fields into environment variables;
- explicitly exits nonzero unless **both quoted values equal exactly success**;
- prints only the two bounded result values and a simple success/failure explanation.

Use an explicit failure branch/exit so later output cannot erase a failed comparison. No continue-on-error, success default, substring comparison, optional step, status polling, external action, fallback, retry, `|| true`, or conditional suppression of the assertion. No checkout or secrets are needed in the aggregate job.

Ordinary dependency skipping must never produce a passing required gate. GitHub documents that dependent jobs may be skipped after dependency failure; always() plus an unconditional exact-result assertion is required here. The normal needs result vocabulary is success/failure/cancelled/skipped. Defensive checks also reject missing or unexpected strings; this is not a claim about arbitrary external neutral check-runs.

### D. Existing independent Auth job

Keep the entire `auth-konfiguration` job byte-identical, including its name, timeout, environment, fork handling and actual fresh check. The existing independent Auth required check remains separately required.

Workflow name, push/main and pull_request triggers, workflow concurrency and all unrelated content stay unchanged. No repository ruleset or branch protection mutation is authorized.

## 3. Authoritative NPM commands, full npm test preserved

In package.json scripts only:
1. Add `test:core` with the exact original three-glob command from before R4, without any flag or path change.
2. Add `test:persisted-native` with the exact second R4 command:
   `node --import ./scripts/server-only-test-register.mjs --import tsx --test scripts/db/official-truth-persisted-canonical-read-1/native.test.ts`.
3. Set `test` to exactly `npm run test:core && npm run test:persisted-native`.

Thus npm test still runs both full R4 phases in order and fails if either fails. CI uses the same authoritative commands in separate jobs, avoiding duplicated command strings that could drift. No --if-present, new glob, name filter, dependency, version, engine or lockfile change.

Discovery stays585 core files plus exactly one complete native file; expected actual totals remain8,189 core tests plus one native parent, with exactly the two unchanged core layout skips. No test source changes are authorized.

## 4. Narrow edit set and explicit supersession

Author may change only:
- `package.json`, only the three script entries described above;
- `.github/workflows/ci.yml`, only the bounded reorganization described above;
- `docs/OFFICIAL_TRUTH_PERSISTED_CANONICAL_READ_1_HANDOFF_2026-11-07.md`, with exact R4 evidence, R5 structure, manifest and remaining unknowns.

R5 explicitly supersedes the earlier frozen-workflow/package-composition restrictions only for this concrete CI organization. Root authors this R5 document. TASK/R1/R2/R3/R4 remain exact; all runtime, SQL, canonical modules, test sources, helpers, package-lock, app/source/provider registries, policies and other delivery files remain byte-identical.

Frozen bases include:
- package.json `520dfc2954bbad4cf01e103b69c7516b77f3c1d3`;
- workflow `ea76057e87b99203db082a506db1c70539253de6`;
- HANDOFF `89fd80eed0ba3cdd7c2ed51e92077429c7db1e49`;
- native test `274b00d8b7d36e0cfd6122f3c6792c6deda40a19`;
- package-lock `8f50e69821be6cd5a95beb8e97271b6fc72117f3`.

All existing protective limits remain: SQL25s, lock15s, idle/COMMIT20s, reader60s, R3 calibration45s/earliest fixture strictly below50s, native900s, existing core30min. The two new jobs'20min/2min limits are explicitly selected above; no further automatic extension.

## 5. Meaningful static verification and real gates

Before return, independently compare:
- both alias command bytes to the actual R4 command parts, and npm test composition/exit semantics;
- original core steps against the new core, allowing only its name/Test command;
- native setup steps against the original first five steps;
- unchanged Auth block, triggers, workflow concurrency, runner types and fixed timeouts;
- unique required name, direct needs, always() and unconditional strict assertion;
- unchanged complete native blob, test inventory, scopes and every other delivery file.

Extract the actual final aggregate shell script and execute only that local pure status assertion over the normal result pairs plus empty/missing/unexpected values. Only success+success may return zero. Exercise shell syntax and quoted values; never execute CI/native/hosted work as part of this gate-unit probe. Report exact tested pair count and behavior. No new test framework, external dependency or permanent generic gate system.

Author returns exactly the three-file manifest with old/new blobs, SHA256, byte counts and HANDOFF, then **returned / STOP**.

Root reviews the full resulting tree and independently checks the aggregate failure matrix. Fresh actual PR gates must prove:
- complete core8189/8187pass/0fail/2oldskips, every original native group, all five hygiene checks and Build;
- separate native1/1pass, complete original diagnostic matrix with actual after-success SQL deadline and earliest-bound measurements, versions/forgery/ACL/rollback, completion below900s;
- required aggregate job actually executes and succeeds only after both;
- fresh Auth55/243, exact matching checkout/trees across core/native/Auth, Preview and all live review/ruleset gates.

The organization itself proves no native runtime feasibility. Any remaining failure gets concrete evidence and the same author/session; no retry-to-green or automatic bound increase. Changed head invalidates previous gates. After any Root-authorized normal merge, actual-main core/native/aggregate/Auth CI and exact Production/domain evidence are all mandatory before closing1150. No PASS/Ready/Merge from the author.

## 6. Platform/product authority unchanged

Dormant synthetic/local own-database infrastructure only. No new requirement for the first current-request-only CH-to-DE pilot. No hosted installation, production accepted-reader, real source/visa/Owner/trip test or activation.

Development remains **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**, actual ledger **UNKNOWN**, Stage2 **NOT_ATTEMPTED**. Original denied readback has no evidenced platform clearance; no repeat/alternate route/Stage1 replay. Existing Owner consent stays valid in its original scope.

All special Product-Owner gates and source/window pins remain; #1131/#985/#937/#913 held, Cursor paused. No new paid service/runner/settings or automatic successor.

Primary workflow-semantics references checked by Root:
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context
