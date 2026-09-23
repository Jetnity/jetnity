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
- Do not reuse closed #550/#552/#551/#553/#554 sessions or the #555 rollout session

## How to continue if Docker becomes available

1. Do not change product files.
2. `node --test scripts/e2e/admin-account-counts-browser-acceptance-1/test.mjs`
3. `node scripts/e2e/admin-account-counts-browser-acceptance-1/run.mjs`
4. If G0 is still BLOCKED, persist a new receipt. Do not fake PASS.
5. If G0 PASSes, the orchestrator must still refuse `#550` bootstrap overlay, hosted connector values, public binds, and response substitution.
6. Expected counts come from the owned Auth inventory after fixtures, not 10/0.
7. Record banned/disabled privileged actual behavior as a rollout finding if the page still discloses counts.
8. Freeze content once. Later exact-head CI/Auth/Preview goes into conversation.

## Integration

#555 preparation integrates first when independently acceptable. This lane waits for an explicit TL SHA before any main sync. No autonomous merge/rebase/force/reset/cherry-pick.

## Secrets

Per-run passwords, TOTP, JWT, cookies, QR/otpauth stay out of Git. Parent `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` values must not be read or copied.
