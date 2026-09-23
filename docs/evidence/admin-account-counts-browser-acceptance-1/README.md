# Evidence — admin account counts browser acceptance 1

Sanitized text/JSON only. No passwords, TOTP secrets, JWTs, cookies, QR or otpauth payloads.

| File | Meaning |
| --- | --- |
| `preflight.json` | Bounded capability result |
| `source-manifest.json` | Accepted hashes/blobs actually compared |
| `not-run-matrix.json` | Gate-by-gate results |
| `cleanup.json` | Owned-resource dry-run |
| `run-receipt.json` | Verdict + fixture plan without secrets |
| `authorized-main-sync.json` | Exact-main sync record; **not** a new browser execution |
| `aacba1-review-fix-20260923T101352Z-*.json` | H1–H4 review-fix helper/preflight receipts. Do not overwrite the historical basenames. |

Environment receipt remains `aacba1-20260923T020045Z`, verdict `BLOCKED_ENVIRONMENT`. The later authorized main is `87cdc1e6`. Review-fix receipt `aacba1-review-fix-20260923T101352Z` is a new helper/preflight record: G2–G19 **NOT IMPLEMENTED**, `fullLocalExecution=false`. Neither receipt is browser acceptance.
