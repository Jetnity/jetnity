# Admin Account Counts Local Runtime 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Same-session E1+E2 correction of review `5294965628` on `bc8ec091c0c912e4646a2614c07e4a6a7da66c42`. Owned only `scripts/e2e/admin-account-counts-local-runtime-1/**`, own STATUS/HANDOFF/SELF_REVIEW, and new sanitized receipts. Product/Auth/SQL/config/migration/root package/lock/CI and the accepted #556 lifecycle module were not changed. Task §4 was not drifted. No sibling-code import or writes. C1/C2 and F1–F3 remain.

## Review mapping

| ID | Correction |
| --- | --- |
| E1 | `assertConsumerGatesJson` requires contractVersion, current-run identity, expected product head, exact G6–G19, permitted results and metadata. Secrets including `access_token`/`refresh_token` and embedded JWT/otpauth/fill are refused. Screenshots must be nonempty bounded structurally valid PNGs. The exporter validates the whole set before any durable write and rolls back a partial publish. |
| E2 | `writeEvidence`, consumer copies and `persistFailureReceipt` use exclusive `wx` creation. Collision preserves original bytes and fails the current persistence result. The actual runner catch path attaches `error.failureReceipt` and does not overwrite or recreate private HOME. |
| C1/C2 | Preserved from 5294684706. |
| F1–F3 | Preserved from 5294264491. |

## Misleading claims corrected

`IMPLEMENTATION.codeCompleteClaim = false`. Content validation and exclusive writes are not a real browser, Docker or official-CLI execution. Validation does not manufacture PASS.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **37/37 PASS** on Node v22.14.0. Includes E1 valid FAIL/NOT RUN fixtures, N1 secret fields, N2 `{}`/zero-byte PNG, N3 mismatched run/head, incomplete/duplicate gates, corrupt/empty PNG, runtime-only no-browser control, E2 first-write success / second-write collision, persistFailureReceipt collision, and the actual runner failure path with pre-seeded receipts.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `codeCompleteClaim=false`, exit 2. Receipt `aaclr1-20260923T182253Z`. Official binaries/Docker/real stack/Mac/Playwright: **NOT RUN**.

## Residual risks

- P1: isolation/secret exposure/false full PASS — exporter now refuses secret-shaped consumer content; real browser still unverified
- P2: official CLI extract, PG17 catalog, Next compile, GoTrue and Playwright remain **NOT RUN**
- P3: Darwin tar/`--no-same-owner` extract still unverified
- #559 remains stopped and was not imported

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, code-completeness, or full local acceptance.
