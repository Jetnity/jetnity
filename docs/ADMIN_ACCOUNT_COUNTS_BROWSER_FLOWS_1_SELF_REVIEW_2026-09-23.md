# Admin Account Counts Browser Flows 1 — SELF_REVIEW

Stand: 2026-09-23  
Status: **AUTHOR SELF-CHECK OF REMAINING B1–B3 / NOT INDEPENDENT TECHNICAL-LEAD PASS**

Agent: **Jetnity admin account counts browser flows 1**, Generation 1  
Session: `bc-9495c303-3b54-4a76-a467-665b3f1a8eb9`  
Model: `cursor-grok-4.6-high-fast` (required and actual; no Auto)

This is not a merge recommendation.

## Scope kept

Writes stayed inside `scripts/e2e/admin-account-counts-browser-flows-1/**`, own STATUS/HANDOFF/SELF_REVIEW and new sanitized `docs/evidence/admin-account-counts-browser-flows-1/aacbf1-review-fix-remaining-b1-b3-20260923T152543Z.*`. Product app/Auth/SQL/config, root package/lock/CI, #556 fallback files, #558 runtime paths and central startup docs were read-only. Historical `aacbf1-20260923T123800Z` and `aacbf1-review-fix-b1-b4-20260923T133051Z` were not overwritten.

## What was actually executed

- `node --test scripts/e2e/admin-account-counts-browser-flows-1/test.mjs` — **28/28 PASS**, Node v22.14.0, TAP SHA256 `5b19e0e24e197c6b09314aeddf2f94b887099723766fa566b4ae7bc20e6cdac7`
- Locked `tsx` harness `parser-equivalence.ts` compared the JS port to `@/lib/admin/account-counts-delivery/parser` on the accepted fixture table
- Remaining TL counterexamples now live in the exported assertions' tests: blank login, arbitrary `/admin` error, wrong-origin, path-prefix, failed navigation, ready login/OFF positives, anonymous `401/42501` vs invalid-JWT `401/PGRST301`, foreign actor, deferred json after detach, unrelated Auth POST, malformed payload, current valid response, timeout-then-refuse-next-action, deferred create/mutation/close with observed late completion
- No Docker, no local stack, no real Playwright login/TOTP/Admin
- No production build, full `npm test`, or hygiene suite claimed (no product files changed)
- No Ready / merge / follow-up

## Remaining B1–B3 self-check

- Blank body at `/admin/login` is `blank`, not login. Arbitrary error text at `/admin` is `unknown`/`failed`, not disabled. OFF requires the authorized Admin shell copy and absent statistics.
- `accessToken: null` is anonymous/no-EXECUTE; `SYNTHETIC_INVALID_JWT` is invalid-JWT. `401/42501` is not treated as `PGRST301`.
- Capture accepts only current-session token/enroll/verify for the expected actor. Detach invalidates immediately so a later json cannot overwrite a new session token.
- Timeout throws `OwnershipUncertaintyError`, marks terminal, aborts the local signal, and leaves the original work running. The next `action` is refused. `cleanup` can still close/restore. Late handles remain tracked.

## Honesty

- Double PASS is code-behavior evidence only.
- Missing reviewed #558 remains an honest execution gate.
- Preview READY is not account-count activation.
- Author self-review is not independent TL PASS.
- The JS port is still a port; equivalence is proven by executing the unchanged accepted parser through locked `tsx`, not by claiming the port *is* that parser.

## Out-of-scope dependency (explicit)

`evidenceDir` remaining undefined on the runtime context is still **#558 / R-lane**. This consumer continues to require it and does not default it.

## Stop

No Ready. No merge. No follow-up agent. Independent TL re-review of the exact frozen head.
