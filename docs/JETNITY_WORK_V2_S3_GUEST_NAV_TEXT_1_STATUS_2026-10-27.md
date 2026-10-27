# V2-S3 Guest Navigation and Large Text 1 — STATUS

Date 27 October 2026. Draft PR #1054. Branch `fix/v2-s3-guest-navigation-text-1`.
Writer: Jetnity V2 Guest Navigation and Large Text 1 — Cursor Generation 1.
Session: https://cursor.com/agents/bc-16a84de0-d3be-44eb-9f80-f7b3cf9de306
`originalModelName`: `grok-4.7-high-fast`.

## State

Implementation is on `d021358953d8a6a12c03d04ac6b2208330a25035`.
This status file is a later docs commit. The review head is the branch tip that contains this file, not `d0213589` alone.
Re-fetched `origin/main` before this status: `d31a16afdac5e97d4b02f4cb5824f5adc290577c`. The branch was 2 ahead / 0 behind before this docs commit. Mode `NORMAL`.

Draft. Not Ready. Not merged. No follow-up slice. Author evidence is not a Technical-Lead PASS. Exact-head CI and Preview for the review tip were not claimed from this session.

## What landed

- Same-tab discard of guest trip A clears header and footer "Reise fortsetzen". Creating B points both links at B without reload.
- Account and unresolved sessions do not adopt guest storage.
- The other tab fail-closes on malformed active bytes and does not delete those bytes.
- The signal carries no trip id.
- Mode labels stack below 640px. At root 16px and 32px, and at CSS 320/390/768/1440, the four label rectangles do not overlap, text stays inside each button, `text-sm` stays 14px or 28px, and the document does not grow horizontally. Enter on Organisieren is a keyboard activation. Pointer activation of Vorbereitung is not reported as keyboard. The sticky harness header does not cover the labels.

## Local gates

| Gate | Result |
| --- | --- |
| `tsc -p tsconfig.json --noEmit` | exit 0 |
| eslint on owned files | 0 errors. Four pre-existing unused-var warnings in `gastspeicher.ts` (lines 992 and 1047–1049), not introduced here |
| `guest-nav-text-1.test.ts` | 5 pass / 0 fail |
| signal cases in `gastspeicher.test.ts` | 4 pass / 0 fail |
| `create-entry.test.ts` | 45 pass / 0 fail |
| `trip-workspace-premium-experience-3.test.ts` | 4 pass / 0 fail |
| `npm test` | 7376 tests, 7360 pass, 11 fail, 5 skip |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` | pass. Schema reference still lists the same LOCAL/UNAPPLIED RPCs. This slice added none |
| `npm run build` | pass. Next.js 16.4.1 compiled, TypeScript finished, 26 static pages. Setup check warned only that no `.env` file is present |

The 11 `npm test` failures are official-truth disposable PostgreSQL proofs. This machine has no `/usr/lib/postgresql/16/bin/initdb`. Messages are `ENOENT`, `NOT_VERIFIED: local PostgreSQL binaries are required`, or `local_proof_connection_override_forbidden`. None are in the guest-nav or mode-nav files. They are not a host readback and were not retried against a hosted database.

## R1 correction — CI browser launch

Technical Lead R1 `5671377921` on `3225892807714b671e3841fbd89dc33724ecc1d7` is CHANGES REQUIRED. App job `122323798480` in run `40542104620` failed because `chromium.launch` looked for Playwright's `chromium_headless_shell` and the `ubuntu-latest` runner has not downloaded it. The four mounted subtests were cancelled by that hook. They were not logical product failures.

The harness now launches Playwright Chromium when that binary exists, and otherwise launches system Google Chrome with `channel: 'chrome'`. It does not skip. A missing system browser still fails the hook. No workflow, package, or CI file changed.

Runner evidence, not an assumption about this job's exact image: job `122323798480` used the `ubuntu-latest` label on 27 October 2026, during the 19 October–19 November 2026 migration from Ubuntu 24.04 to 26.04. The published Ubuntu 24.04 image `20261023.334.3` lists Google Chrome `155.0.8059.39`. The Ubuntu 26.04 image lists Google Chrome `155.0.8059.39` and the 26 October update lists `156.0.8078.47`. Both images include Google Chrome.

Local proof after the correction: with Playwright Chromium present, the log is `guest-nav-browser kanal=playwright-chromium version=140.0.7339.16` and 5/5 pass, 0 skipped. With `PLAYWRIGHT_BROWSERS_PATH` pointed at an empty directory, the log is `guest-nav-browser kanal=chrome version=148.0.7778.96` and the same four mounted subtests pass, 0 skipped. GitHub CI and Preview for the correction tip are not claimed until those live checks are read.

## Boundaries

No database, RLS, Auth, provider, payment, indexing, or cost change. USD 100/month cap unchanged. `ACTIVE_WORK_STATUS.md` was left untouched because it is outside this lane's path manifest and S0 is the docs lane.
