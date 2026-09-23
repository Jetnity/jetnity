# Admin Account Counts Local Runtime 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Same-session E1a–E1c correction of review `5295504615` on `d4515c26fc611dd6303c6995b6cbce1de95c5404`. Owned only `scripts/e2e/admin-account-counts-local-runtime-1/**`, own STATUS/HANDOFF/SELF_REVIEW, and new sanitized receipts. Product/Auth/SQL/config/migration/root package/lock/CI and the accepted #556 lifecycle module were not changed. Task §4 was not drifted. No sibling-code import or writes. E2, C1/C2 and F1–F3 remain.

## Review mapping

| ID | Correction |
| --- | --- |
| E1a | Known producer fields from 5801129391 are validated: agent/generation/implementationMetadata/thisInvocation/implementation/realExecution/runtimeIntegration plus contract/run/head/G6–G19. Unknown/secret/drift still fail. FAIL and NOT RUN stay as supplied. |
| E1b | PNG walk requires CRC-valid chunks, nonzero dimensions, IDAT, and inflated bytes matching IHDR. Positive fixture is the TL 2x2 RGB hex. Zero-dimension/no-IDAT and the old 68-byte marker file fail before publication. |
| E1c | `redactSecrets` replaces the entire unsafe string when fill/otpauth/JWT/token material is present. writeEvidence and persistFailureReceipt keep no remainder of the synthetic password or TOTP secret. |
| E2 | Exclusive wx writes preserved. |
| C1/C2 | Preserved from 5294684706. |
| F1–F3 | Preserved from 5294264491. |

## Misleading claims corrected

`IMPLEMENTATION.codeCompleteClaim = false`. A decodable inert PNG is not a screenshot or browser run. Accepting the producer receipt shape is not an import of #559.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **37/37 PASS** on Node v22.14.0. Includes the TL producer-shaped receipt with FAIL/NOT RUN, composed exporter/cleanup on that shape plus the verified PNG, rejection of the 45-byte fake and malformed marker PNG, whole-string fill/otpauth writer and failure-receipt controls, and preserved E2 collisions.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `codeCompleteClaim=false`, exit 2. Receipt `aaclr1-20260923T191029Z`. Official binaries/Docker/real stack/Mac/Playwright: **NOT RUN**.

## Residual risks

- P1: isolation/secret exposure/false full PASS — producer metadata is now accepted; real browser still unverified
- P2: official CLI extract, PG17 catalog, Next compile, GoTrue and Playwright remain **NOT RUN**
- P3: Darwin tar/`--no-same-owner` extract still unverified
- #559 remains stopped and was not imported

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, code-completeness, or full local acceptance.
