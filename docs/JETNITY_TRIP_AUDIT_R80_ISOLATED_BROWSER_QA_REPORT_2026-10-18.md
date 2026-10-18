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

**NOT YET OBSERVED.** No GitHub-hosted job has been recorded for this workflow at the time this section was written. Do not read this report as a browser PASS, a zero-skip result, or a Technical-Lead acceptance.
