# Admin Account Counts Local Runtime 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Same-session N01–N03 correction of review `5295892822` on `2904f4885bbd58bf00d0cb49cee85a0de72434a0`. Owned only `scripts/e2e/admin-account-counts-local-runtime-1/**`, own STATUS/HANDOFF/SELF_REVIEW, and new sanitized receipts. Product/Auth/SQL/config/migration/root package/lock/CI and the accepted #556 lifecycle module were not changed. Task §4 was not drifted. No sibling-code import or writes. Accepted E1a producer format, E1c whole-string redaction, E2, C1/C2 and F1–F3 remain.

## Review mapping

| ID | Correction |
| --- | --- |
| N01 | `assertValidPng` now requires color type 2/6 and bit depth 8/16 together. The CRC-valid type2/depth1 diagnostic image fails the screenshot profile and does not export. |
| N02 | Only IHDR/IDAT/IEND are allowed. tEXt Comment with a synthetic Bearer/JWT, plus eXIf/pHYs, fail before durable write. Valid RGB/RGBA export copies the original image bytes without ancillary metadata. |
| N03 | After the exact G6–G19 set is present, `thisInvocation.observedResults[i]` must equal `gates[BROWSER_GATES[i]].result`. All-NOT-RUN plus all-PASS summary rejects. FAIL/BLOCKED/NOT RUN with matching summaries stay accepted. |
| E1a/E1c/E2 | Preserved from 5295504615 / 5294965628. |
| C1/C2 | Preserved from 5294684706. |
| F1–F3 | Preserved from 5294264491. |

## Misleading claims corrected

`IMPLEMENTATION.codeCompleteClaim = false`. A decodable inert RGB/RGBA PNG is not a screenshot or browser run. Accepting the producer receipt shape is not an import of #559.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **37/37 PASS** on Node v22.14.0. Includes composed exporter/cleanup for the illegal type2/depth1 PNG, tEXt JWT metadata (HOME retained, durable empty, marker absent), mismatched observedResults, genuine RGB/RGBA export-byte controls, and preserved E2 collisions plus whole-string fill/otpauth redaction.

`node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Verdict `BLOCKED_ENVIRONMENT`, `fullLocalExecution=false`, `codeCompleteClaim=false`, exit 2. Receipt `aaclr1-20260923T194504Z`. Official binaries/Docker/real stack/Mac/Playwright: **NOT RUN**.

## Residual risks

- P1: isolation/secret exposure/false full PASS — producer metadata is accepted; PNG metadata is refused; real browser still unverified
- P2: official CLI extract, PG17 catalog, Next compile, GoTrue and Playwright remain **NOT RUN**
- P3: Darwin tar/`--no-same-owner` extract still unverified
- #559 remains stopped and was not imported

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, code-completeness, or full local acceptance.
