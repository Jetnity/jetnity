# Trip Personal Preparation Workflow Completion 1 — REPORT

Date: 2026-10-25. Writer: **Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1**. Session `bc-6bbca11e-14c9-4f1a-ac07-e729d8a54ca3`. Model `grok-4.7-high-fast`.

This report records what ran on the R2 tree. It is not a Technical-Lead PASS. R1 commands and CI on `80006fdf` stay historical.

## What R2 changed

`terminal`, `scheitern`, discard, and a failed guest result release a lock only when no other `pending` or `awaiting` intent still owns that ref. `offeneLesen` can still reclassify the older intent.

Status, save, named delete, cancel, retry, discard, and refresh call `interaktion` before the late completion can focus its row. The programmatic focus of the row does not count as a new interaction.

The floating list keeps the latest intent for a ref that is absent from the current rows. Older confirmed creates are not repeated. A delete confirmation remains. An editor whose point is gone, and which has no floating receipt, shows the existing absence sentence and no save button.

`arbeitsbereich.tsx` calls `gastReadinessSetzen` when the guest callback is entered. `verzoegern` defers only that callback's promise. Account callbacks still defer the operation. `entries` counts callback entry. `lesenAls` can return `wrong_trip` without touching storage. The frozen guest writer was not edited.

## Failed attempt

The first absence filter also hid a current confirmed or reconciled create when the row was not yet in the list. The mounted list suite then failed 6 confirmation waits and passed 10. The filter now hides only an older intent for the same ref. The re-run passed 16/16.

The first browser-lauf JSON counted the suite line only. The runner now counts indented TAP cases. The retained file is the second run. The first run was not committed.

## Commands on `760afc59374c56a288925d09022688631f5dca74`

Node v22.23.4. Chromium 140.0.7339.16.

- `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/personal-preparation-workflow.test.ts lib/readiness/personal-preparation-workflow-wiring.test.ts lib/readiness/preparation-identity.test.ts scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.test.ts` — exit 0. 28 tests, 28 pass, 0 fail, 0 cancelled.
- Custom-list file, second runner: 16 tests, 16 pass, 0 fail, 0 cancelled. 15 of those mount the list. 1 compares source text and does not open a browser.
- Actual workspace file: 6 tests, 6 pass, 0 fail, 0 cancelled.
- These 21 browser-backed cases plus the 1 source comparison are not 22 actual-Workspace cases.
- `npm run typecheck` — exit 0.
- `npm run lint` — exit 0, 0 errors, 181 warnings.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` — each exit 0.
- `npm run build` — exit 0, Next.js 16.4.1, compiled in 3.7s, command elapsed 8937ms.
- `ablauf.ts --ausgabe` new directory — exit 0. Widths 320, 360, 390, 768, 1280, plus 320px at 32px root, Enter, and `prefers-reduced-motion`. CSS sha256 `9fdcfb3304373fe80e813c75b8a05078064bb38eeba3b6f309db2e28d45ccf7b`. Button background `rgb(21, 58, 51)`. At 320px the document scroll width stays 320. At 32px root the button height is 80.

Evidence: `docs/evidence/trip-personal-preparation-workflow-completion-1/2026-10-25-r2/`. The behavior suites inject unstyled HTML. The CSS matrix is the separate `ablauf.json`. Workflow blob `563fd3068c0bc42a52d9834fdb18f36e28c188a8`. List blob `7c3bac055173b12e235b3f352828ffe04ff164eb`. Hook blob unchanged `a11b25652281e9d04be29aad7e0d9cf53c28e4e1`.

Full local `npm test` was not re-run. Fresh native App, Auth, and Vercel for this head were not observed at authoring.
