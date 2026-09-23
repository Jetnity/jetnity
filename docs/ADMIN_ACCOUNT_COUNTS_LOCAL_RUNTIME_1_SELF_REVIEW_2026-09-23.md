# Admin Account Counts Local Runtime 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Same-session remaining R1–R5 correction of review `5292919754` on `0bd9ffc78e8d92a03dc5f1f93b9fd352a5966129`. Owned only `scripts/e2e/admin-account-counts-local-runtime-1/**`, own STATUS/HANDOFF/SELF_REVIEW, and new sanitized receipts. Product/Auth/SQL/config/migration/root package/lock/CI were not changed. Task §4 was not drifted. No sibling-code import or writes.

## Review mapping

| ID | Correction |
| --- | --- |
| R1 | Default launch is locked `next dev`. Isolated app env (URL/key/flag) is applied before install/spawn. `warteAufAppBereitschaft` rejects ≥500, exited children and a returned origin without a 2xx/3xx. A1/A2 tests included. |
| R2 | `inspectDockerResource` returns PRESENT / ABSENT / UNKNOWN. D1 always-failing daemon cannot report removed=true. Incomplete/unknown/stopUnknown govern deletion, not only a later verdict. Failure receipts use the real CLI/docker verification path with low-level doubles, not injected PASS objects. |
| R3 | `run.mjs` calls `prepareOfficialCliIdentity` only. Missing sidecar does not download. Selected file is hashed; missing/mutated/symlink provenance is refused. Version/help never precedes archive binding. `cliResult`/`dockerResult` are ignored. |
| R4 | Foreign Location is contained as 502 without forwarding Location or credentials. Streamed body keeps the deadline until complete. Outstanding transfers abort before close. |
| R5 | Typed ACL + exact table signature + comment-stripped executable body. `requiredCount` rejects missing fields. S1 marker-in-comment, S2 rogue_role, S3 empty grants, S4 missing prereq counts, S5–S7 owner/empty-definition/PUBLIC are tests. Verify callback must return that catalog, not a name. |

## Misleading claims corrected

`IMPLEMENTATION.codeCompleteClaim = false`. STATUS does not say CODE-COMPLETE. Docker absence is an execution blocker **and** was not the only remaining defect on `0bd9ffc7`.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **29/29 PASS** on Node v22.14.0. Includes A1/A2, D1/D2, S1–S7, official-byte sidecar rehash, injected-result ignore, next-dev env-before-spawn, observer 502 containment, and the default verification→failure-receipt path.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — verdict `BLOCKED_ENVIRONMENT`, mode `preflight`, `fullLocalExecution=false`, `codeCompleteClaim=false`, exit 2. Receipt `aaclr1-20260923T152829Z`. G0 BLOCKED (container-runtime, supabase-cli). CLI note: official archive bytes are not present; default no-start does not download. G2–G19 NOT RUN. G20 PASS for the default never-started path.

No Docker retry. No official binary download or execution. No real stack. No Mac. No hosted query. No production build.

## Residual risks

- P1: isolation/secret exposure/false full PASS — additional default-wiring regressions added; real stack still unverified
- P2: actual CLI 2.117.0 extract, PG17 catalog, Next compile and GoTrue provisioning remain **NOT RUN**
- P3: Darwin/container execution still unverified
- A direct observer probe is still not the app-server RPC positive control; that remains an integrated-run proof

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, code-completeness, or full local acceptance.
