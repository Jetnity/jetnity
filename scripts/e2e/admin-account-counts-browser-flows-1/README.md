# Admin account counts browser flows 1

Consumer lane for gates **G6–G19** against the frozen local-acceptance contract
`jetnity.account-counts.local-acceptance.v1`.

Sibling runtime **#558** owns stack, fixtures, application, observer, cleanup and
the whole-run verdict. This folder owns only awaited Playwright UI scenario code
and honest controlled-context unit tests.

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
   mutations in `finally`. Failed close/restore stops later resource-using
   gates. HTTP/UI denials require exact status+code or the intended application
   state. Auth capture is bound to the exact local project origin and current
   session. Receipts are sanitized, run-scoped and fail closed.
5. Returns `{ contractVersion, gates }` for **G6–G19 only**. It never returns
   `fullLocalExecution` or a whole-run PASS. `evidenceDir` is required; this
   lane does not default it.

## What this module does not do

- Start Docker, Supabase, Next.js or provision GoTrue fixtures.
- Claim a real-browser / MFA / Admin PASS from unit doubles or quiet page
  requests.
- Resume closed #556 fallback, rewrite #557 product guards, or import unmerged
  #558 implementation.
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

1. Independent TL review of this exact head.
2. #558 runtime first, after its own review.
3. This PR only after a specific TL instruction naming the merged main SHA.
4. Actual integrated browser execution is a later explicit TL gate. It is not
   authorized on the user's incoming Mac by this task.

Historical #556 command `scripts/e2e/admin-account-counts-browser-acceptance-1/run.mjs`
remains a preflight/helper fallback and is not this consumer.
