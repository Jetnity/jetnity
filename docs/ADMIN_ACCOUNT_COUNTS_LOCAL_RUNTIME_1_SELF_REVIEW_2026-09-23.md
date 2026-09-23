# Admin Account Counts Local Runtime 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Same-session R1–R5 correction of review `5291528414`. Owned only `scripts/e2e/admin-account-counts-local-runtime-1/**`, own STATUS/HANDOFF/SELF_REVIEW, and new sanitized receipts. Product/Auth/SQL/config/migration/root package/lock/CI were not changed. Task §4 was not drifted. No sibling-code import or writes.

## Review mapping

| ID | Correction |
| --- | --- |
| R1 | `prepareAppForLaunch` + default readiness; G5 requires a live child; `owned.evidenceDir` assigned before context assembly; `validateAcceptanceContext` |
| R2 | `ownership.mjs` registry populated before fallible work; `useApp`/restart update the live child; cleanup uses private HOME as the only root; volumes confirmed; failure receipts; G20 refuses incomplete/unknown/leftover-volume registries |
| R3 | `git archive` of `fa7`; refuse all `.env*` and symlinks; migration bytes vs baseline; `verifyResolvedCli` requires official archive provenance of the selected executable |
| R4 | `resolveUpstreamTarget`; `redirect: 'manual'`; remote redirects do not follow or forward credentials; Playwright `route.abort` local-only policy attached on the real session |
| R5 | `assertInstalledCatalog` on definition/owner/ACL/config + managed-schema prereq; verify callback must execute supplied SQL; prefix-only migration skip refused |

## Misleading claims corrected

`IMPLEMENTATION.codeCompleteClaim = false`. STATUS no longer says CODE-COMPLETE. Docker absence is documented as an execution blocker **and** as not the only prior defect.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **27/27 PASS** on Node v22.14.0. Includes the R1–R5 review counterexamples (cold checkout, evidenceDir, partial stack, failed stop, two restarts, leftover volume, traversal, browser launch/close, dotenv/symlink, PATH-only CLI, observer escape/redirect/in-flight, catalog name-only/owner/ACL, failure receipt, incomplete G20).

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — verdict `BLOCKED_ENVIRONMENT`, mode `preflight`, `fullLocalExecution=false`, `codeCompleteClaim=false`, exit 2. Receipt `aaclr1-20260923T133632Z`. G0 BLOCKED (container-runtime, supabase-cli). G2–G19 NOT RUN. G20 PASS for the default never-started path.

No Docker retry. No real stack. No Mac. No hosted query. No production build.

## Residual risks

- P1: isolation/secret exposure/false full PASS — additional regressions added; real stack still unverified
- P2: actual CLI 2.117.0 extract, PG17 catalog, Next build and GoTrue provisioning remain **NOT RUN**
- P3: Darwin/container execution still unverified
- A direct observer probe is still not the app-server RPC positive control; that remains an integrated-run proof
- `run({ dockerResult, cliResult })` exists only so contract tests can reach the failure-receipt path. The CLI default does not pass those fields and cannot invent a usable daemon

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, code-completeness, or full local acceptance.
