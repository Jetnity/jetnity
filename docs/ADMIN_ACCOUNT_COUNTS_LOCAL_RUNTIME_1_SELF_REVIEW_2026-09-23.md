# Admin Account Counts Local Runtime 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Same-session consolidated F1–F4 correction of review `5294264491` on `12f42ab2ab2a8a9b67086dece9f0b76fd84f767c`. Owned only `scripts/e2e/admin-account-counts-local-runtime-1/**`, own STATUS/HANDOFF/SELF_REVIEW, and new sanitized receipts. Product/Auth/SQL/config/migration/root package/lock/CI and the accepted #556 lifecycle module were not changed. Task §4 was not drifted. No sibling-code import or writes.

## Review mapping

| ID | Correction |
| --- | --- |
| F1 | `hashTarMember` extracts via isolated `tar -xOf` stdout-to-file, timeout, isolated env and `maxBytes`. T2 2MiB member hashes. Oversize/timeout/corrupt fail. Sidecar is still not a trust root. |
| F2 | `SAFE_SNAPSHOT_DOTENV_EXCLUDES` is applied as git-archive pathspecs, then leftover disclosed templates are unlinked before `refuseSymlinksAndDotenv`. Actual baseline inventory no longer fails on tracked `.env.example`. Secrets/symlinks still fail. Archive is file-backed. `macosExtractUnverified=true`. |
| F3 | One `browsers` map from `createOwnershipRegistry` through `run`/`context`/`newBrowserSession` to `raeumeOwnedAuf`. Context is assigned before `attachLocalTrafficPolicy`. Pending launch is not `closed:true`. Request listeners record `trafficViolation` and do not throw. Unknown fails G20. |
| F4 | Cleanup order is stop → `exportSanitizedRunArtifacts` → delete. Whitelist is consumer-receipt/screenshot/clip only. Secret JSON fails closed and retains private HOME. `persistFailureReceipt` writes only the durable dir. |

## Misleading claims corrected

`IMPLEMENTATION.codeCompleteClaim = false`. STATUS does not say CODE-COMPLETE. Implementing supported paths is not executing official binaries, Docker or Playwright.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **35/35 PASS** on Node v22.14.0. Includes F1 64KiB/2MiB/oversize/timeout/corrupt, F2 synthetic + actual baseline snapshot, F3 policy-failure/pending/foreign-request/timeout/normal-close, F4 happy-path export + secret fail-closed + no HOME recreation, and preserved prior CLI/catalog/Docker/app/observer cases.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `codeCompleteClaim=false`, exit 2. Receipt `aaclr1-20260923T172002Z`. Official binaries/Docker/real stack/Mac/Playwright: **NOT RUN**.

## Residual risks

- P1: isolation/secret exposure/false full PASS — F3/F4 regressions added; real browser still unverified
- P2: official CLI extract, PG17 catalog, Next compile, GoTrue and Playwright remain **NOT RUN**
- P3: Darwin tar/`--no-same-owner` extract still unverified
- #559 navigation wait is independent and was not imported

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, code-completeness, or full local acceptance.
