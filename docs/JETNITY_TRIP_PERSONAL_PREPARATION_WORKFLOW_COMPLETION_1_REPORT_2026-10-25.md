# Trip Personal Preparation Workflow Completion 1 — REPORT

Date: 2026-10-25. Writer: **Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1**. Session `bc-6bbca11e-14c9-4f1a-ac07-e729d8a54ca3`. Model `grok-4.7-high-fast`.

This report records what ran on merge head `44e1a1c41d2e4939524d2b11996c7baa6a1b0056`. It is not a Technical-Lead PASS. The docs commit after these runs does not change the measured sources.

## What R3 changed

`beobachteteRefs` stores the personal client refs of the latest qualifying account delivery, guest read, or manual read. `sichtMeldung` keeps a confirmed or reconciled non-delete message, and replaces "Gespeichert und im aktuellen Stand sichtbar." or the reconciled-match sentence with the existing absence sentence when that read omitted the ref. The receipt stays. Unknown, conflict, and delete messages stay. A displayed row that is merely behind a canonical read which still contains the ref keeps the visibility sentence.

The closed "Titel bearbeiten" button and the submit button call `interaktion` on focus. A trusted row focus does too, unless it is the completion effect's own `focus()`. That effect sets a flag around the call because the programmatic event was observed trusted and otherwise wrote an older ledger back over the new result.

## Integration

Normal merge of `77ed41adbd3d32bbc995300b61eef1e16c2710d6` into `577e7da70374159bfe2e0ae33b9d4c7cfad2368d`. Result `44e1a1c41d2e4939524d2b11996c7baa6a1b0056`. Tree `70422933da2ae96b1d22d030b2dc400b3e398295`. Main tree `29d75dd70c711b67c5c43826c8a0db05fa9037f6`. No conflicts. `git diff 77ed41ad` is the owned T slice. `41844878` remains the O merge, not A.

## Earlier attempts, not reconstructed

The mounted list once failed 6 confirmation waits and passed 10. The unmodified terminal capture is `2026-10-25-r3/historical-r2-custom-list-10pass-6fail-terminal-936109.txt` (16 tests, exit 1, 2026-10-25T11:22:27.105Z to 11:25:33.096Z).

The first browser-lauf JSON that counted only the suite line was not found in session temp or committed R2 evidence. Both surviving `/tmp/personal-r2-browser*` JSON files already count the indented cases and name head `760afc59`. That miscount remains an author statement from the previous REPORT. It was not rewritten into a fake log.

R2 proof on `760afc59` and the runner change on `4e66d894` stay historical. Those behavior logs were a pre-commit working tree, not a clean exact-head run of both. The R3 `unstyled/browser-lauf.json` records `kopf` `44e1a1c41d2e4939524d2b11996c7baa6a1b0056` and hashes 10 behavior and test source paths. It does not hash `browser-lauf.mjs`. `PROVENANCE.md` separately records runner blob `b4c1b52cbf9c89fcd0783bdb83ac174455514903` as an author statement. That run did not record a machine-checked clean-tree before-and-after hash of the runner.

## Commands on `44e1a1c41d2e4939524d2b11996c7baa6a1b0056`

Node v22.23.4. Chromium 140.0.7339.16.

- `node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter tap lib/readiness/personal-preparation-workflow.test.ts lib/readiness/personal-preparation-workflow-wiring.test.ts lib/readiness/preparation-identity.test.ts scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.test.ts` — exit 0. 29 tests, 29 pass, 0 fail, 0 cancelled. This includes the workspace file and is not the CSS matrix.
- Unstyled `browser-lauf.mjs --ausgabe .../2026-10-25-r3/unstyled` — exit 0. Custom list 19 tests, 19 pass, 18 mounted, 1 source comparison. Actual workspace 6 tests, 6 pass. The JSON `quellen` object has those 10 behavior and test paths and no runner entry. Runner blob `b4c1b52cbf9c89fcd0783bdb83ac174455514903` is the separate author note in `PROVENANCE.md`, not a field of that JSON and not a before-and-after clean-tree witness.
- `npm run typecheck` — exit 0.
- `npm run lint` — exit 0, 0 errors, 181 warnings.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` — each exit 0. Schema check still prints the existing LOCAL/UNAPPLIED RPC notes.
- `npm run build` — exit 0, Next.js 16.4.1, compiled in 7.7s. Wall time of the command was 26410ms.
- `ablauf.ts --ausgabe .../2026-10-25-r3/css` — exit 0. Widths 320, 360, 390, 768, 1280, plus 320px at 32px root, Enter, and `prefers-reduced-motion`. CSS sha256 `9fdcfb3304373fe80e813c75b8a05078064bb38eeba3b6f309db2e28d45ccf7b`. Button background `rgb(21, 58, 51)`. At 320px the document scroll width stays 320. At 32px root the button height is 80.

Workflow blob `c295637b18d4b356ce14739e211871179cbf38f7`. List blob `4c0a5be5e3b615f6ea5edbe7d8aa89250f872cfb`. Hook blob `ed1a8e02eeb29266f4ea9aecb5bb679512860aa6`.

Full local `npm test` was not re-run. Fresh native App, Auth, and Vercel for this head were not observed at authoring.
