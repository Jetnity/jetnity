# JETNITY R80 — ISOLATED SYNTHETIC TRIP AUDIT BROWSER QA / IMMUTABLE TASK
Stand: 18.10.2026 Europe/Zurich
Parent: Issue #954 / Draft PR #955. QA-only tracking: Issue #966.
**This is an acceptance-evidence subtask of the existing Trip Audit V1, not a new product feature.**
Origin main at preparation: `8c164718751d4fcfc5d064ecc7985231061594d8` / machine mode `NORMAL`.
**Exact, frozen code-under-test SHA: `fffc9e52e7345a96e276d926ff796a2c9feeb251`.**
Original independent TL R79 code/CI verdict: [#955/6250723221](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6250723221) = CODE-REVIEW-PASS, RUNTIME-QA-PENDING.
R80 branch: `test/trip-audit-r80-isolated-browser-qa`. Dedicated Draft PR on this branch; number from actual GitHub live record.
**Single implementation author:** `Jetnity Trip Audit Isolated Browser QA — Cursor Generation 1`. Actual session name/id only after real dispatch; do not invent one.
**No new product-code writer:** original `Jetnity Trip Audit V1 — Codex Generation 1`, session `01a141ad-1220-7462-bced-c75469dab1d3`, still owns all immediate #955 product-code corrections if necessary. Do not start/replace that Codex session in this task.

## 1. Purpose / limits

The existing `lib/trips/trip-audit-v1/ui.test.ts` is explicitly SKIPPED in ordinary CI because `TRIP_AUDIT_UI_URL` is unset. R79 original Linux CI [#39131327371](https://github.com/Jetnity/jetnity/actions/runs/39131327371) succeeded **7095/7097, 0 fail, 2 skip**, including the browser test SKIP. Synthetic source tests and SSR do not qualify real browser interactions. We need an **independent, disposable browser execution on exact #955 code**, with a provably isolated browser context and strict nonactivation.

Use a **new GitHub-hosted `ubuntu-latest` runner job** in the PUBLIC `Jetnity/jetnity` repository, which GitHub documents as free for standard public-repository runners. This job is unrelated to the owner's computer and personal Chrome and supplies no private browser profile. **Do not use Vercel Sandbox, Cloud Browser, private host, external paid browser service, or real account tokens.** If any prerequisite cannot be achieved under this precise constraint, STOP, record BLOCKED, and ask TL. No manual browser plugin, Chrome-attachment tools, OS user inspection or privileged account workflow.

The job checks out **only the frozen #955 SHA** from public GitHub and starts a temporary local-only Next.js server with `JETNITY_UI_AUDIT=1` and `VERCEL_ENV` absent. The already-existing `/ui-audit/trip-workspace` route is deliberately Production-disabled. Use existing locked Node/Playwright dependencies, transient browser binary installation **inside the disposable VM only if required**; do not change `package.json` or lockfile, do not use unpinned npm package installs or alternative registries. The browser test must connect solely to `http://localhost:<selected-port>`, create a fresh context without profile reuse, and forbid external requests. No use of `jetnity.com`, Dev/Prod hosted databases, personal Chrome, authenticated account sessions, provider API, or Vercel deployments.

**Trust boundary:** the existing `ui.test.ts` loops over `quelle: 'guest' | 'account'` via `sessionStorage` in the audit fixture. **That is NOT real authentication.** A passed R80 job may prove synthetic Guest/shared Workspace browser behavior, responsive/focus/accessibility smoke and no XHR/fetch upon audit interactions. It **cannot prove** a genuinely logged-in Account experience, hosted Development/Production ownership, real trip-save/reload, live in-panel edits via an authenticated flow, physical devices or all T07/T09/T10. Record these as outstanding, not PASS.

## 2. Immutable evidence and preflight before author writes

Read all:
- `JETNITY_START_HERE.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/ACTIVE_WORK_STATUS.md`, `.jetnity/operating-mode.json`;
- newest current #751 and scoped #748 Guardian P1 [#6246287752](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6246287752), independent P1 triage [#6247743478](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6247743478), current #954/#955, exact [R79 review](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6250723221);
- original immutable `docs/JETNITY_TRIP_AUDIT_V1_TASK_2026-10-16.md` blob `c224d3fbddd031d030d825b6895d1423a5586f67`, existing `lib/trips/trip-audit-v1/ui.test.ts` on #955 exact SHA, `app/(public)/ui-audit/trip-workspace/page.tsx`, `lib/ui-audit/freigabe.ts`, `.github/workflows/ci.yml`, package scripts;
- current main, R80 branch exact HEAD/tree/merge-base/ahead-behind, open PRs and the newest current head of #955. If frozen SHA no longer matches active #955 HEAD, **STOP for TL repin**. Never self-update target.

Product-code R79 integrated #955 SHA **must never be changed by this QA task**, and no current real user/browser tab is needed.

## 3. Exact write ownership (only on R80 branch)

Allow NEW files only:
1. `.github/workflows/jetnity-trip-audit-r80-browser-qa.yml`: one dedicated, isolated workflow that runs on **same-repo `pull_request`** for this exact R80 test branch and no other branch, with `permissions: contents: read`. MUST NOT reference repo/org secrets, tokens, PROD env vars, auth workflow, privileged environment, write permission, GitHub API mutations or workflow_dispatch.
2. `docs/JETNITY_TRIP_AUDIT_R80_ISOLATED_BROWSER_QA_REPORT_2026-10-18.md`: sanitized gates/evidence, exact frozen #955 ref and why synthetic-only; never fake final results.
3. `docs/JETNITY_TRIP_AUDIT_R80_ISOLATED_BROWSER_QA_HANDOFF_2026-10-18.md`: exact source/tree/checks/remaining gates and STOP.

**NEVER EDIT:** this task; #955 existing branch, `.github/workflows/ci.yml`, any other `.github` file, source `app/**`, `components/**`, `lib/**`, `scripts/**`, `supabase/**`, `types/**`, `package*.json`, `next.config.*`, global styles, shared status pointers, Vercel config/secrets, Guardian files or Production. No new test scripts under app/lib: run original existing exact-SHA test, do not copy source, fork business logic or change assertions. If essential change outside these three new files becomes necessary **STOP for TL review; do not silently amend scope.**

## 4. Workflow fail-closed acceptance

- Begin with no code on R80 branch other than this task. Use a standalone GitHub Actions **fresh ubuntu-latest VM**, not shared browser UI; pin to the verified exact code-under-test SHA `fffc9e52e7345a96e276d926ff796a2c9feeb251` in `actions/checkout`, `persist-credentials: false`. Immediately assert `git rev-parse HEAD` equals pinned SHA. Protect against pulling moving branch or GH-generated merge ref.
- Constrain workflow trigger and job `if` to `pull_request` with head repo `Jetnity/jetnity`, head ref `test/trip-audit-r80-isolated-browser-qa`. Read-only GITHUB_TOKEN permissions only. No secrets in env, no upload of raw logs/screenshots/recordings, no external accounts/browser attach.
- `npm ci` with the checked-in lockfile. Use already-declared Playwright package. Only install the matching Playwright Chromium browser (and required disposable VM libraries) inside GitHub runner if absent. No `npm install -g`, no dependency/lockfile changes, no paid tool.
- Launch Next dev (NOT Production) on loopback `localhost` with `JETNITY_UI_AUDIT=true`, `NEXT_TELEMETRY_DISABLED=1`; ensure `VERCEL_ENV` is unset/nonproduction and don't read or supply `.env*`, personal credentials, Supabase URLs or any API secrets. Poll only the local audit route; failure to receive actual 200 is a **hard FAIL**, not a skipped test.
- Run exactly the existing browser test with `TRIP_AUDIT_UI_URL=http://localhost:<port>` via `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/trip-audit-v1/ui.test.ts`. Assert **actual execution: 1 browser test PASS and 0 SKIP**, not merely exit code 0 when it silently skips; explicitly check the TAP end summary. Fail on browser launch, hydration, React, focus, pagination, 320px/200%, unexpected fetch/XHR or network requests, without replacing assertions or using screen scraping.
- Because the code-under-test comes exclusively from #955 and test route uses only synthetic fixtures, no real account session, A/B trip or hosted writes are attempted. Browser network deny except local app origin. Do not assume this proves *zero* requests from the server to external systems, and do not claim it does.
- Always terminate only the job's own loopback server and disposable browser; do not interact with user macOS or global Chrome. Resource/time bounds: GitHub standard runner, ~15-minute job, no privileged runner, no new service/subscription.
- If normal GitHub runner/Chromium install unavailable or test fails, record original sanitized failure without modifying #955 or bypassing. **No retry loop, no unapproved runner, no altered test expectations.**

## 5. Expected checks/report and STOP

After implementation on R80 draft branch, verify exact owned file list (this task + the 3 permitted new files), GitHub runner original job steps/logs, isolated VM/no browser binding proof from platform, exact **CHECKED-OUT code SHA** (distinct from R80 workflow branch HEAD), test TAP browser pass/fail/skip, no provider/auth/hosted database/network writes, job cleanups. Authors publish only **R80 branch** and sanitised receipt, then **STOP** for independent TL R81. No Ready/Merge on any PR, no review self-PASS, no follow-up. **R80 QA-only workflow is not intended to be merged to main**; after accepted tests TL may close unmerged and persist accepted evidence in #954/#751/#955.

Final unfulfilled gates regardless of synthetic PASS: real Guest normal-product path, genuinely signed-in Development Account normal-product path, legitimate **live** change while panel stays open, mobile + keyboard + focus/accessibility in real account context, no unexpected I/O in that real context, real hosted A↔B cross-owner WRITE denials remain separately *not verified*. Guardian browser-privacy P1 still OPEN until Owner/Privacy handles it. Code-only PR #955 stays DRAFT until these mandatory acceptance gates actually pass.

**NO READY / NO MERGE / NO PRODUCTION / NO HOSTED SQL / NO PERSONAL CHROME / NO AUTONOMOUS NEXT SLICE.**
