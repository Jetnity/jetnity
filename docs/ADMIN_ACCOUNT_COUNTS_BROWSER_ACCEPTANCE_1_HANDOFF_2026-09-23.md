# Admin Account Counts Browser Acceptance 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Immutable task `docs/ADMIN_ACCOUNT_COUNTS_BROWSER_ACCEPTANCE_1_TASK_2026-09-23.md` v1
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. This STATUS / REPORT / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL review-fix on this PR = **same** logical agent, Generation 1, session `bc-7a3a3769-52a4-4d68-863e-4e750246fb64`, model `cursor-grok-4.6-high-fast`
- A new logical slice or model substitution = **forbidden** from this handoff
- Do not reuse closed #550/#552/#551/#553/#554 sessions or the completed #555 rollout session

## Integration state

The reserved exact-main synchronization is **done**: one normal merge of `87cdc1e6858ff0fb57481dd9c3d56fd618f1e03b` after fetched `origin/main` matched. Historical product snapshot `f0237baf` remains the original tested source pin; those hashes still apply. Incoming #555 files are read-only and are **not** the browser-acceptance path.

No further main sync unless TL gives another exact SHA. No rebase/force/reset/cherry-pick.

## How to continue if Docker becomes available

1. Do not change product files or incoming #555 files.
2. `node --test scripts/e2e/admin-account-counts-browser-acceptance-1/test.mjs`
3. `node scripts/e2e/admin-account-counts-browser-acceptance-1/run.mjs`
4. If G0 is still BLOCKED, persist a new receipt. Do not fake PASS and do not treat the `87cdc1e6` sync as application acceptance.
5. If G0 PASSes, the orchestrator must still refuse `#550` bootstrap overlay, hosted connector values, public binds, and response substitution.
6. Expected counts come from the owned Auth inventory after fixtures, not 10/0.
7. Record banned/disabled privileged actual behavior as a rollout finding if the page still discloses counts.
8. Freeze content once. Later exact-head CI/Auth/Preview goes into conversation.

## Secrets

Per-run passwords, TOTP, JWT, cookies, QR/otpauth stay out of Git. Parent `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` values must not be read or copied.
