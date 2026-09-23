# Admin Account Counts Browser Flows 1 — SELF_REVIEW

Stand: 2026-09-23  
Status: **AUTHOR SELF-CHECK OF B1–B4 / NOT INDEPENDENT TECHNICAL-LEAD PASS**

Agent: **Jetnity admin account counts browser flows 1**, Generation 1  
Session: `bc-9495c303-3b54-4a76-a467-665b3f1a8eb9`  
Model: `cursor-grok-4.6-high-fast` (required and actual; no Auto)

This is not a merge recommendation.

## Scope kept

Writes stayed inside `scripts/e2e/admin-account-counts-browser-flows-1/**`, own STATUS/HANDOFF/SELF_REVIEW and new sanitized `docs/evidence/admin-account-counts-browser-flows-1/aacbf1-review-fix-b1-b4-20260923T133051Z.*`. Product app/Auth/SQL/config, root package/lock/CI, #556 fallback files, #558 runtime paths and central startup docs were read-only. Historical `aacbf1-20260923T123800Z` was not overwritten.

## What was actually executed

- `node --test scripts/e2e/admin-account-counts-browser-flows-1/test.mjs` — **22/22 PASS**, Node v22.14.0, TAP SHA256 `fe8957c3039eaf544ccfb88fd7ffb0a90f13078c1b72a97b63904edcaf099889`
- Explicit TL counterexamples now live in the exported assertions' tests: 404/PGRST202, 500/42501, 403/null, multirow/invalid time/recent>present, blank/ISE/unavailable-as-forbidden, foreign/port/protocol-relative Auth URLs, G12 2→3, hanging close, failed restore + downstream NOT RUN, fill() secret notes, path escape, exclusive write, receipt-fail-closed
- No Docker, no local stack, no real Playwright login/TOTP/Admin
- No production build, full `npm test`, or hygiene suite claimed (no product files changed)
- No Ready / merge / follow-up

## B1–B4 self-check

- Denied-caller checks require exact status AND machine code; missing wrapper and 5xx cannot PASS authorization.
- Success uses the accepted one-row / integer / 720h / recent≤present parser plus independent expected counts.
- UI denial requires the intended application state and both undisclosed aggregates.
- Auth capture compares exact scheme/host/port, awaits enroll/verify/login, detaches, and clears stale tokens per session.
- G12 is recent=0 then recent=1 and +1 present. G16 restores active and re-reads permitted counts.
- Budgets abort during waits. Failed close/restore marks ownership uncertain and later resource-using gates stay NOT RUN.
- Returned gates and receipts are sanitized; write/redaction failure invalidates PASS; artifacts are run-scoped and wx-exclusive.

## Honesty

- Double PASS is code-behavior evidence only.
- Missing reviewed #558 remains an honest execution gate.
- Preview READY is not account-count activation.
- Author self-review is not independent TL PASS.

## Stop

No Ready. No merge. No follow-up agent. Independent TL re-review of the exact frozen head.
