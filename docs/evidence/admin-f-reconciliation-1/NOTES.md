# Admin F reconciliation 1 — fresh evidence

Date: 2026-09-28
Issue: #605
Draft PR: #606
Branch: `docs/admin-f-reconciliation-1`
Parent before this delivery: `ef866098faaa6b46aaa13c3ccb4975c360bd1283`
Baseline main: `6d5299f73e8da1b8eec7604686e5d272b70fd256`
Accepted #545 head: `43720a65ca5296e2009158ccd0bce6b30796ca95`

This directory is new proof for reconciliation 1. It does not replace `docs/evidence/admin-navigation-search-1/`.

## Source identity

`git diff --exit-code 43720a65ca5296e2009158ccd0bce6b30796ca95` on the palette, shell, navigation, honesty, unit tests, hydrated runner and historical evidence directory exited 0. Those paths are unchanged since the accepted #545 head. This branch’s commits before delivery touch only the task and the pre-dispatch status.

## Fresh checks

- `unit-tests.txt`: existing Node test runner, 24 pass / 0 fail / 0 skipped. Files: `lib/admin/navigation-search.test.ts`, `lib/admin/navigation.test.ts`, `lib/admin/ehrliche-zustaende.test.ts`. Existing local `node_modules`. Not `npm ci`, not the full suite, not a production build. Stored as `.txt` because repository `.gitignore` ignores `*.log`.
- `hydrated-report.json`: existing actual-component harness, 12 pass. Playwright Chromium 140.0.7339.16, headless. The runner was a disposable uncommitted copy of `scripts/admin-navigation-search-1-hydrated.mjs` with output redirected here and screenshots under `/opt/cursor/artifacts/`. The copy was deleted and is not part of the commit. Historical evidence files were not overwritten.

## What this is not

Not a signed-in Admin session. Not Vercel Preview or Production browser proof. Not a physical device. Not an authorization test. The harness stubs Next router, Next link and sign-out. R3 records the `prefetch={false}` prop on that stub and does not execute production app-dir prefetch.
