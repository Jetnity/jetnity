# Admin Account Counts Browser Flows 1 — Binding Task v1

Date: 23 September 2026. TL-owned immutable task.
Agent: **Jetnity admin account counts browser flows 1**, **Generation 1**, NEW dedicated session.
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**, no Auto/substitution. Record actual session/model and honest UI-name status.
Branch: `test/admin-account-counts-browser-flows-1`.
Exact product/integration baseline: **fa7f651c023eb361fb142cbb931bc702f3a3d213**, NORMAL.

## 1. Outcome and live precheck

Implement real Playwright UI scenario code for the existing account-count acceptance objective, not another prose audit or placeholder flow. The sibling runtime agent in #558 implements owned local stack/schema/fixtures/application/observer/teardown. This lane implements the actual browser steps and assertions. The user requested continuation and multiple agents where safe; this split uses a TL-frozen interface and disjoint files, not overlapping Auth writers.

#557 caller-status protection CLOSED/MERGED/POST-MERGE VERIFIED atfa7 (TL5290676242, #512 closure5794518007). #556 CLOSED only as preflight/helper/blocked evidence; actual login→TOTP/AAL2→Admin remains NOT IMPLEMENTED/NOT RUN. Do not resume their completed sessions. Current CI35858174804 successful; Production dpl_DuQWxYEJeYuybstq88kVBPMPDYnK READY exactfa7. Fresh TL catalog-only read confirms PG17.6, reporting schema/producer/wrapper ABSENT, latest migration20260917120000. No actual account counts enabled. Old Drafts #52/#50/#40/#39/#28 are not writers. Startup docs' #551 observations are dated, not today's active work.

Read JETNITY_START_HERE, operating-mode, TL/Cursor, Multi-Agent Slice Planning, latest #512 continuity and relevant application code. Phase-1 account/operations acceptance of existing functionality; no provider/business order change.

## 2. Frozen shared contract and ownership

Binding interface is **§4 of `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_TASK_2026-09-23.md` at immutable TL seed `0aa33e88a021756a5cee64a130d544122977880a`**, PR #558, branch `test/admin-account-counts-local-runtime-1`. Fetch that exact document before coding. This is explicitly authorized doc-only dependency reading. Do not import the sibling's unmerged implementation or infer a different interface. Contract version **jetnity.account-counts.local-acceptance.v1**.

WRITE ONLY:
- `scripts/e2e/admin-account-counts-browser-flows-1/**`, required entrypoint `flows.mjs`, scoped helper/scenario tests, README and ignore rules.
- Own `docs/ADMIN_ACCOUNT_COUNTS_BROWSER_FLOWS_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-23.md`.
- New sanitized `docs/evidence/admin-account-counts-browser-flows-1/` receipts.

READ ONLY: all product/Auth/shared clients/roles/MFA/AAL/SQL/config/migrations; package/lock/CI; every #556 fallback file; #558 runtime paths; central startup docs; historical evidence; immutable tasks. Reuse actual accepted selectors/TOTP helpers where suitable, rather than building a second Auth/session/test framework. No source-pin or product patch to make a test pass. A needed interface change goes to TL as a specific dependency; no unilateral competing context contract.

Export `async runBrowserFlows(context)` returning `{ contractVersion, gates }` for exactly G6–G19 in the existing GATE_IDS. Gate result enum PASS/FAIL/BLOCKED/NOT RUN, plus sanitized evidence relative path/null and notes/null. Do not return overall fullLocalExecution/PASS: #558 owns G0–G5, G20 and whole-run result precedence. Reject wrong/incomplete context before steps; missing prerequisites cannot become an empty successful suite.

Context details are frozen in the referenced §4: four local actual Auth fixtures owner/moderator/ordinary/creator; numeric-loopback `localApi` with public local key only; serial `useApp` ON/OFF; runtime-owned `newBrowserSession`/`closeBrowserSession`; scoped `fixture` status/role/count-scenario/wrapper controls; actual gateway `rpcObserver.mark/since`; private evidenceDir, timeoutMs, signal. Use exactly those functions. Context is in-memory and must never be serialized wholesale. Fixture passwords/IDs/tokens/TOTP stay private; no admin/database keys enter the browser context.

## 3. Implemented browser scenarios

Read the actual baseline routes/forms/components, including /admin/login, /admin/mfa, /account/security, lib/auth shared gates and the #557 reader/status/SQL definition. Assert the real application behavior, not a made-up alternative route. Existing shared UI/Auth behavior is read-only.

Implement G6–G19 as actual awaited operations with bounded waits and fail-closed assertions:

- **G6 login UI:** fill the real email/password form for a run-owned privileged actor; do not use API login as a substitute for the UI login objective. Let the application obtain real GoTrue-issued cookies/session.
- **G7 AAL1 denial:** role alone must not expose account counts before successful second-factor verification. Verify actual step-up/enrollment route and no count disclosure. Do not forge an aal2 JWT or inject authenticated cookies/storageState.
- **G8 TOTP enrollment:** use the actual account-security UI and real local enroll/challenge/verify calls. Read the local enrollment response only to keep its synthetic TOTP secret in memory; no response substitution, factor-table seeding or MFA bypass. Use existing tested TOTP helper when applicable. Never capture enrollment QR/otpauth/secret/code/password screens in evidence.
- **G9 AAL2 + counts ON:** complete UI verification; navigate to the real Admin page; compare rendered present and recent counts against the runtime's independent `fixture.expectedCounts()` result. Verify definition/window/measured-time presentation and no fake zero on failure. Successful rendered counts must coincide with an actual observed server RPC through the runtime observer, not merely page request events.
- **G10 existing factor/new session:** close the first context through the runtime, open a fresh isolated browser context, sign in through the UI and use the already enrolled factor via real challenge/verify. No new forced enrollment, no restored storageState/cookie injection. Retain only the synthetic factor secret in memory for code generation.
- **G11 default OFF:** runtime `useApp({countsEnabled:false})` creates the actual OFF application instance. Counts section must not render and actual server-side count RPC count must stay zero within a complete observer interval. Require a prior real positive observed-call control, and allow requests to settle before evaluating. A quiet page request log is NOT evidence of server silence. Restore ON for later scenarios.
- **G12 zero and delta:** use the runtime's declared zero-window scenario, then one-recent scenario. Compare actual UI to independent counts and expected +1 present/+1 recent change, preserving the fixed 720h metric. Do not assume historical 10/0 or 14/10 fixtures. No fake system clock or RPC response injection.
- **G13 ordinary user:** actual login as ordinary/creator may not reveal protected aggregate values. Establish insufficient role without changing product guards. A rendered forbidden message or appropriate redirect is not a zero-statistics success.
- **G14 unauthenticated:** fresh unauthenticated context cannot obtain/render protected counts. Do not enable anonymous sign-in to manufacture this case.
- **G15 downgrade:** with a previously valid privileged session, use only scoped fixture.setRole to downgrade the same actor. On a subsequent request, counts must be denied without relying on token-role rewriting. Restore the original fixture role in finally.
- **G16 restricted status:** previously permitted privileged session, same actor and token, persisted active→banned/disabled/pending→active via scoped fixture.setStatus. Subsequent app/appropriate direct-wrapper requests must deny blocked status; restored active can proceed. No claim this proves Auth-level banned_until/session revocation or all general Admin status management. Metric population remains independent of read eligibility.
- **G17 unavailable wrapper:** remove only the owned local wrapper through fixture.setWrapperPresent(false); show honest unavailable state, not 0 accounts. Restore accepted wrapper in finally. Missing function is not authorization PASS.
- **G18 desktop/mobile:** use actual 1280×800 and 390×844 viewports, count-section visibility and no horizontal overflow/readability checks. Final clipped count-section screenshots only; no whole-page auth/QR/password/token capture. Not a physical-device/VoiceOver certification.
- **G19 same-session HTTP boundary:** verify direct local wrapper behavior with the actual GoTrue-issued session of the tested actor and the local public key, not a signed fixture aal2 token or service-role caller. Capture required session material only in memory through real local Auth responses during the browser flow. Verify permitted response shape plus denied caller HTTP/code semantics. Isolate these direct requests from G11's server-silence interval; do not count a direct test RPC as proof that the app server path was observed. Do not contact a hosted endpoint or follow remote redirects with credentials.

Every scenario cleans its own mutation/session in finally through runtime-owned controls; do not swallow failed restore/close and report PASS. Runtime still performs final cleanup. Bound per-page steps and scenario totals; honour context.signal. Stop dependent scenarios after prerequisite failures rather than pretending each ran. Emit exact reason and NOT RUN downstream.

No live browser response mocking/route fulfillment in the real flow, no forged AAL2/cookies, no empty catch converting failure into zero/PASS, no fake screenshot. Local network denial is allowed as safety, not replacement of required Auth/API responses. Audit selectors and context API use in tests.

## 4. Work possible now and proof boundaries

Initial branch intentionally does not contain #558 implementation. Implement against the frozen context contract now. Use focused Node tests with clearly labeled controlled Playwright/context doubles to exercise sequencing, abort, negative assertions, missing context/gate, cleanup/restore and privacy cases. Such tests prove code behavior, NOT real UI/Auth/MFA execution. The user need not have the Mac yet for this code work.

Use existing locked Playwright and Node22; no dependency upgrades/installing Docker, background cloud-runner creation, global system changes, or hosted fallback. Do not retry missing-runtime setup. No actual stack can be inferred from a Docker/CLI version string. Do not use the closed #556 command as if it ran the full application.

Deliver complete awaited Playwright steps, not a list of planned functions throwing NOT_IMPLEMENTED. Record `implementation delivered` separately from `real execution NOT RUN / runtime integration pending`. Runtime-dependency absence is an honest execution gate, not a reason to omit the scenario code. Any genuinely unresolved implementation prerequisite must be explicitly listed rather than disguised as solely an environment issue.

Required safe unit tests include: real-mode API cannot enable fake/session injection; wrong context version or missing methods; mandatory gate completeness; new context second-factor path; no count calls while OFF at complete observer interval; incomplete observer refuses no-call assertion; banned/status change cannot become PASS from generic server error; reject remote URL/redirect; restore on assertion failure; close errors propagate; downstream NOT RUN; no secret-bearing receipt/trace/HAR/storageState output. Do not claim mocks prove server RPC absence. Reuse existing base source pins read-only to detect product drift, including caller-status.ts.

## 5. Parallel/integration rules and release boundary

Decision **MULTI_AGENT / two development lanes, not an independent Guardian review**. #558 `Jetnity admin account counts local runtime 1`, Gen1, owns execution infrastructure/context/observer/fixtures/cleanup. This lane owns UI/G6–G19. TL owns interface. Separate folders eliminate same-file writers; stable TL doc interface permits parallel code work before runtime availability.

Integration order **#558 runtime first, then this browser-flow PR** after a specific TL instruction naming the merged main SHA. No automatic rebase/force/reset/cherry-pick/main merge by either agent. Before final integration, TL checks actual interface conformance and provides any narrow necessary assembler changes; no permission to edit runtime writer files now. Initial unit tests do not imply acceptance of sibling code.

Actual integrated full-stack execution may only be commissioned after both implementations and the chosen local environment are reviewed. It is NOT authorized on the user's incoming Mac by this task. No missing real execution gate is waived. No new agent/follow-up from Cursor.

Fresh exact-head CI/Auth/Preview and full scope/merge-base/ahead-behind on a single frozen head. Own status/handoff/self-review and sanitized receipt with commands, test types, counts, source baseline and actual model/session/footer. Distinguish Preview READY from feature activation and author self-review from independent TL PASS.

Current official references to verify: https://supabase.com/docs/guides/auth/auth-mfa/totp, https://supabase.com/docs/guides/local-development/cli/getting-started, https://supabase.com/changelog, https://playwright.dev/docs/auth. Existing package versions remain locked. No shared Auth/MFA redesign based on newer docs.

P0 no incident established; P1 no secret/session leakage or false browser PASS; P2 correct caller/metric/observer/window/assertion/restore behavior; P3 real-browser/Darwin/PG17/environment evidence still pending. Every Production DDL including staged objects, grants/exposure/enabling, hosted query, real account/secret/provider/Terms/payment/SMTP/tracking/domain/launch, new infrastructure or budget commitment remains forbidden/reserved. Existing Cursor usage only, balance unknown.

**Do not mark Ready. Do not merge. Do not start another agent or follow-up slice. STOP for independent TL exact-head review.**
