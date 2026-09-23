# Admin Account Counts Local Runtime 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Same-session O2a/O2b correction of the TL review on `b74eadee32d9044586d95018b1401eedaa57cbe5`. Owned only `scripts/e2e/admin-account-counts-local-runtime-1/**`, own STATUS/HANDOFF/SELF_REVIEW, and new sanitized receipts. Product/Auth/SQL/config/migration/root package/lock/CI and the accepted #556 lifecycle module were not changed. Task §4 was not drifted. No sibling-code import or writes. Accepted O1 foreign-resource rules and N01–N03/E1/E2/C1/C2/F1–F3 remain.

## Review mapping

| ID | Correction |
| --- | --- |
| O2a | `raeumeOwnedAuf` publishes `kind:'stack-cli-child'` from the nested stop report. Unconfirmed `reaped`/`neverStarted` sets unknown + ownershipRetained, blocks directory delete, and fails `bewerteCleanup`/G20. Confirmed already-exited child still allows HOME removal. No pkill. |
| O2b | `defaultStartRuntime` → `starteOwnedStack({ projectId })` → `collectOwnedDockerResources({ projectId })`. Exact `com.supabase.cli.project` without RUN_LABEL is owned, bindings collected, teardown uses the same project id. Other project labels produce no bindings and no destroy. |
| O1 / N01–N03 / E1 / E2 / C1 / C2 / F1–F3 | Preserved. |

## Misleading claims corrected

`IMPLEMENTATION.codeCompleteClaim = false`. A controlled child double is not a real CLI process on a live stack. Passing projectId is not relabelling foreign objects.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **40/40 PASS** on Node v22.14.0. Includes O2a composed stack→cleanup with a non-reaping child and a confirmed-exit child, and O2b actual `defaultStartRuntime` with CLI-project-only labels plus teardown authority / wrong-project fail-closed.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `codeCompleteClaim=false`, exit 2. Receipt `aaclr1-20260923T220919Z`. Official binaries/Docker/real stack/Mac/Playwright: **NOT RUN**.

## Residual risks

- P1: isolation/secret exposure/false full PASS — CLI-child and project identity are now folded in helper tests; real Docker/CLI remain unverified
- P2: official CLI extract, PG17 catalog, Next compile, GoTrue and Playwright remain **NOT RUN**
- P3: Darwin tar/`--no-same-owner` extract still unverified
- #559 remains stopped and was not imported

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, code-completeness, or full local acceptance.
