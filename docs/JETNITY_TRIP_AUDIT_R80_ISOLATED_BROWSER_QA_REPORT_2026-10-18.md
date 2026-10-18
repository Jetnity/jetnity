# JETNITY R80 — ISOLATED SYNTHETIC TRIP AUDIT BROWSER QA / REPORT

Stand: 18.10.2026 Europe/Zurich
Logical author: `Jetnity Trip Audit Isolated Browser QA — Cursor Generation 1`
Session: `bc-61b5a395-1162-4291-9f5e-aa66f002ae07` (https://cursor.com/agents/bc-61b5a395-1162-4291-9f5e-aa66f002ae07)
Session title after `rename-chat`: `Jetnity Trip Audit Isolated Browser QA — Cursor Generation 1`. This title is the tool result, not a guessed UI label.
This report is not a Technical-Lead PASS, not Ready, and not a merge recommendation.

## 1. Preflight actually read

- Machine mode `.jetnity/operating-mode.json`: `NORMAL`.
- R80 branch `test/trip-audit-r80-isolated-browser-qa` local and `origin` HEAD `9d25f627058a0dcfba8766204a52b0a64cd70947` before this delivery. Tree at that seed: `aacaa5b1fc6663c3cd7d0a9b829ff00383daeca0`.
- Immutable task blob `d1ceca53ec0b19cafdc1b56d41cfb00be81c3b77` unchanged.
- `origin/main` `8c164718751d4fcfc5d064ecc7985231061594d8`. Merge-base with the seed is that same SHA. Ahead/behind versus main at the seed: 1 / 0.
- Draft PR #967 head at preflight was the seed. Draft PR #955 head `fffc9e52e7345a96e276d926ff796a2c9feeb251`, tree `961641af883a23126e4479849a78b0a27f042c1e`, parents `e88464ab223dfcee039b8444e1e8f20dd71a637d` and `8c164718751d4fcfc5d064ecc7985231061594d8`. #955 remains OPEN / DRAFT / UNMERGED. Frozen SHA still matches the active #955 head, so no repin was required.
- Existing browser test blob on that SHA: `8db0e13c1feb42e47d5d53bde32bfab1bd06594b`.
- Locked Playwright package on that SHA: `playwright@1.55.0`.
- R79 review [#955/6250723221](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6250723221): CODE-REVIEW-PASS / RUNTIME-QA-PENDING. Linux CI [#39131327371](https://github.com/Jetnity/jetnity/actions/runs/39131327371) remains the historical 7095 pass / 0 fail / 2 skip record, including this browser test SKIP.
- Guardian P1 [COS-20261018-0754-015](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6246287752) and Technical-Lead triage [#748/6247743478](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6247743478) stay OPEN. This job does not attach to a personal Chrome profile.
- #751 was re-read. Its body `updated_at` is 2026-10-18, and the narrative still describes the 16 October main pin. Live git, #955, #967, R79 and the P1 triage were verified directly and match this task's pins. #751 was not edited.
- A local uncommitted `next-env.d.ts` path rewrite was present in the agent worktree and was restored to HEAD before any commit. It is not part of this delivery.

## 2. What was added

One new workflow, `.github/workflows/jetnity-trip-audit-r80-browser-qa.yml`. It requests `contents: read`, triggers only on `pull_request` into `main` when that workflow file changes, and its job also requires head repository `Jetnity/jetnity` and head ref `test/trip-audit-r80-isolated-browser-qa`. It checks out only `fffc9e52e7345a96e276d926ff796a2c9feeb251` with `persist-credentials: false`, asserts `git rev-parse HEAD`, installs locked dependencies, installs the matching Playwright Chromium inside the GitHub-hosted runner only when that executable is absent, starts `next dev` on `127.0.0.1:4173` with `JETNITY_UI_AUDIT=true` and `NEXT_TELEMETRY_DISABLED=1`, requires HTTP 200 from `http://127.0.0.1:4173/ui-audit/trip-workspace`, then runs the existing test with `TRIP_AUDIT_UI_URL=http://localhost:4173`. Exit code 0 is accepted only together with TAP `tests=1`, `pass=1`, `fail=0`, `skipped=0`, `cancelled=0`, `todo=0`, and with no `# SKIP` / `not ok` / `NOT VERIFIED` line.

No secrets are referenced. `.github/workflows/ci.yml`, package files, application source and the immutable task are not modified.

## 3. Acceptance boundary

`quelle=account` in `lib/trips/trip-audit-v1/ui.test.ts` is `sessionStorage` on the audit fixture. It is not a login. A later green job can be synthetic UI, keyboard, viewport and browser-network evidence only. It does not complete T07, T09 or T10, and it does not prove hosted account A/B WRITE RLS. The test itself aborts browser requests whose origin is not the local audit origin. That does not prove the dev server made no external call. Real guest product path, signed-in account path, live edit with the panel open, real-account focus/accessibility, real negative I/O, and hosted cross-owner write denials remain not verified. Guardian browser-privacy P1 remains open. PR #955 remains draft and unmerged. This QA workflow is not intended for merge to `main`.

## 4. Runner evidence

Observed on workflow commit `d7a8263c99b89e820743245a90e46835e80dbea4`, tree `94ac284cca7dd380c61bb301c65ed32a6c98a77a`. The job is [Actions run 39136528389](https://github.com/Jetnity/jetnity/actions/runs/39136528389), job `117702043331`, conclusion `success`, started `2026-10-18T14:33:29Z`, completed `2026-10-18T14:34:47Z`. This paragraph was written after that log was read. It is author evidence for independent Technical Lead R81, not a Technical-Lead PASS.

The runner was GitHub-hosted `ubuntu-24.04` image `20261012.334.1`, runner `2.337.0`, region `westus`. Job token permissions printed by the runner were `Contents: read` and `Metadata: read`. Checkout used `repository: Jetnity/jetnity`, `ref: fffc9e52e7345a96e276d926ff796a2c9feeb251`, `persist-credentials: false`. The fetch token was masked. After fetch, the checkout step logged `Removing auth` and unset `http.https://github.com/.extraheader`.

Asserted checkout values from the job log:

- `checked_out_sha=fffc9e52e7345a96e276d926ff796a2c9feeb251`
- `checked_out_tree=961641af883a23126e4479849a78b0a27f042c1e`
- `ui_test_blob=8db0e13c1feb42e47d5d53bde32bfab1bd06594b`
- `event_sha=86ca6052975a6bc8c9282bae37445d45df7ef701`
- `event_ref=refs/pull/967/merge`

The event SHA is the pull-request merge ref and was not the checkout. `next_loaded_env_files=absent`. `npm ci` reported `added 532 packages, and audited 533 packages in 17s`. Playwright Chromium was absent, then `Chromium Headless Shell 140.0.7339.16` (Playwright build `v1187`) was downloaded to `/home/runner/.cache/ms-playwright/chromium_headless_shell-1187`. `playwright_chromium_launch=ok`. Loopback server pid `3354`. The audit route logged `audit_http=000`, then `audit_http=200`. The server stop step logged `dev_server_stopped=3354`. No artifact or screenshot upload step ran.

Original TAP from that job:

```
TAP version 13
# Subtest: T09: shared guest/account Workspace keyboard, pagination, 320px and 200% browser layout
ok 1 - T09: shared guest/account Workspace keyboard, pagination, 320px and 200% browser layout
  ---
  duration_ms: 6372.337513
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 7132.494151
```

The same step logged `test_exit=0`, `tap_tests=1`, `tap_pass=1`, `tap_fail=0`, `tap_skipped=0`, `tap_cancelled=0`, `tap_todo=0`, and `synthetic_browser_tap=1_pass_0_skip`. The `ok` line has no `# SKIP`. The TAP does not contain `NOT VERIFIED`.

Same workflow commit also had ordinary CI [run 39136528354](https://github.com/Jetnity/jetnity/actions/runs/39136528354): Auth job `117702114650` and Typecheck, Lint & Build job `117702114344`, both `pass`. That ordinary suite was not re-counted here and is not this browser TAP. The Vercel check on the QA pull request was not used as the browser runner and is not a Production action.

`quelle=account` in the executed test remains the synthetic `sessionStorage` fixture. This job does not complete T07, real signed-in T09, real T10, or hosted A/B write denials. Guardian P1 [#748/6247743478](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6247743478) stays open. PR #955 stays draft and unmerged. This QA workflow is not for merge to `main`.
