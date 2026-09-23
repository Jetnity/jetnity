# Admin Account Counts Browser Acceptance 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Immutable task `docs/ADMIN_ACCOUNT_COUNTS_BROWSER_ACCEPTANCE_1_TASK_2026-09-23.md` v1
3. Binding CHANGES REQUIRED review `5289540491` and reproduction `5792860998`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / REPORT / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL re-review of this H1–H4 package = **same** logical agent, Generation 1, session `bc-7a3a3769-52a4-4d68-863e-4e750246fb64`, model `cursor-grok-4.6-high-fast`
- A new logical slice or model substitution = **forbidden** from this handoff
- Do not reuse closed #550/#552/#551/#553/#554 sessions or the completed #555 rollout session

## Integration state

The reserved exact-main synchronization is **done** and was accepted as delivered. Historical product snapshot `f0237baf` remains the original tested source pin. Incoming #555 files are read-only and are **not** the browser-acceptance path.

No further main sync unless TL gives another exact SHA. No rebase/force/reset/cherry-pick.

## H1–H4 retained; B1/B2 residual (this session)

Historical receipts `aacba1-20260923T020045Z` and `aacba1-review-fix-20260923T101352Z` stay dated.

- **H1–H4** remain as previously delivered.
- **B1:** `schliesseOwnedBrowser` has a close timeout. `runPreflight` returns `owned` HOME/browser handles created before fallible work. `run()` passes that state into `raeumeOwnedAuf`. G20 FAIL + `CLEANUP_FAIL` when close is rejected, times out, or HOME is retained. Empty `{}` cleanup is unknown, not PASS. Browser launch is skipped when container/CLI already block.
- **B2:** `findeAusfuehrbare` walks PATH without spawning the `command` builtin. Resolved path + observed version are recorded. `pinned` / `identityVerified` stay false unless a permitted identity matches **and** `start --help` succeeds. Default-discovery tests use temp executables, not an injected `which`.

## How to continue

1. Do not change product files or incoming #555 files.
2. `node --test scripts/e2e/admin-account-counts-browser-acceptance-1/test.mjs`
3. `node scripts/e2e/admin-account-counts-browser-acceptance-1/run.mjs` — implemented preflight/source/cleanup only. It cannot become a local full-stack PASS.
4. Do not treat Docker installation, green CI, or Preview as application acceptance.
5. A later authorized writer must implement stack/provision/browser execution before G2–G19 can run. That is a new implementation, not this command lighting up.
6. Expected counts come from the owned Auth inventory after fixtures, not 10/0.
7. Record banned/disabled privileged actual behavior as a rollout finding if the page still discloses counts.
8. Freeze content once. Later exact-head CI/Auth/Preview goes into conversation.

## Secrets

Per-run passwords, TOTP, JWT, cookies, QR/otpauth stay out of Git. Parent `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` values must not be read or copied.
