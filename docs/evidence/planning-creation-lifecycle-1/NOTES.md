# Planning Creation Lifecycle 1 — proof notes

Executed after merging accepted main `76c4b06ede1f46000efc5a671866d25440c3d644` at proof head `ffa789b2ce9b7dd75951c2571cfb9071ecf4069d`.
`result.json` sha256 `cece4ea1c3113de499df881c2f62e1de5417f6fe171c64cf006456d1b374fa48`.
25 mounted cases, `failed: 0`, `pageErrors: []`.

Command: `PLANNING_CREATION_CHROMIUM=<Chromium executable> node scripts/planning-creation-lifecycle-1/run.mjs`.
This run supplied Playwright Chromium 140.0.7339.16 (build v1187). `PLANNING_CREATION_ARTIFACT_DIR` was not set. `outputs.artifactCopy` is `not-requested`. Evidence defaulted to `docs/evidence/planning-creation-lifecycle-1`. Scratch was `node:os.tmpdir`.

Without `PLANNING_CREATION_CHROMIUM` the same command exits 1 and does not read or rewrite `result.json`. That is a failed proof, not a skip. `npm test` does not launch this runner.

The runner mounts the real `TripPlanner` and `Reiseidee` with compiled `styles/globals.css`. Guest `gastreiseAnlegen`, `gastreiseAblegen` and `vorschlagAlsReise` run. These boundaries are stubs:

- `next/navigation` and `next/link`
- `reiseorteBestaetigen`
- `reiseAnlegen`
- `vorschlagErzeugen`, `vorschlagUebernehmen`, `vorschlagOrteAufloesen`
- same-origin synthetic `GET /api/search/places`

No hosted account, personal browser profile, model call or Production write. Screenshots are the filled manual form at 320, 390, 1280 and 320 with a 32px root font, plus the proposal preview at 320 and 1280. Measured horizontal overflow is 0 in `result.json`.
