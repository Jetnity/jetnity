# Admin account counts browser flows 1

Consumer lane for gates **G6–G19** against the frozen local-acceptance contract
`jetnity.account-counts.local-acceptance.v1`.

Sibling runtime **#558** is now on exact main `86534228`. It owns stack,
fixtures, application, observer, cleanup and the whole-run verdict. This folder
owns only awaited Playwright UI scenario code and honest controlled-context
unit tests. It consumes the now-main producer evidence names and receipt
allowlist; it does not rewrite accepted runtime files.

## What this module actually does

`export async function runBrowserFlows(context)` in `flows.mjs`:

1. Rejects a wrong contract version, missing methods, remote `localApi`, or any
   fake/session-injection API before steps start.
2. Drives the real application routes `/admin/login`, `/admin/mfa`,
   `/account/security` and `/admin` with awaited Playwright locators.
3. Reads a local enrollment response only to keep the synthetic TOTP secret in
   memory. It never seeds factors, forges AAL2, injects cookies/`storageState`,
   or substitutes Auth/RPC bodies.
4. Compares rendered counts to `fixture.expectedCounts()`, requires a complete
   runtime observer interval for ON/OFF RPC claims, and restores fixture
   mutations in `finally`. A timeout/abort marks the run terminal; later
   resource-using gates stay NOT RUN while late create/close/restore remain
   tracked for bounded cleanup.    HTTP/UI denials require exact status+code,
   the current awaited goto/reload Response, and ready application copy —
   not a matching URL, a test-only Page field, or missing count selectors.
   Anonymous/no-EXECUTE and invalid-JWT stay distinct source-contract kinds.
   Auth capture is bound to the exact local project, current session epoch and
   expected actor; pending json after detach cannot mutate later state.
   Receipts are sanitized, run-scoped and fail closed.
5. Returns `{ contractVersion, gates }` for **G6–G19 only**. It never returns
   `fullLocalExecution` or a whole-run PASS. `evidenceDir` is required; this
   lane does not default it. Run-scoped receipts omit `realExecution`,
   `runtimeIntegration` and `thisInvocation.realBrowserOrMfaExecution` because
   this consumer cannot distinguish a controlled double from a future real run.
   Runtime owns that verdict.

## What this module does not do

- Start Docker, Supabase, Next.js or provision GoTrue fixtures.
- Claim a real-browser / MFA / Admin PASS from unit doubles or quiet page
  requests.
- Resume closed #556 fallback, rewrite #557 product guards, or rewrite accepted
  #558 runtime files.
- Contact hosted Supabase, follow remote redirects with credentials, or write
  QR/secret/token/HAR/trace/`storageState` evidence.

## Reproduce the implemented checks

From the repository root, on this branch:

```bash
# Controlled-context unit / contract tests. Not real UI/Auth/MFA execution.
node --test scripts/e2e/admin-account-counts-browser-flows-1/test.mjs
```

Do not add a root `package.json` script. Do not treat helper PASS as
`fullLocalExecution`.

## Integration

1. Authorized exact-main sync of `86534228` is done on this branch.
2. Independent TL review of this exact post-sync head.
3. Actual integrated browser execution is a later explicit TL gate. It is not
   authorized on the user's incoming Mac by this task. No whole-run PASS from
   this lane.

Historical #556 command `scripts/e2e/admin-account-counts-browser-acceptance-1/run.mjs`
remains a preflight/helper fallback and is not this consumer.
