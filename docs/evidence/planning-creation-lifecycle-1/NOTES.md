# Planning Creation Lifecycle 1 — proof notes

Executed at runtime head `9f78c85d686565fa0ebc81a9720bfe8e8485d4dd`.
`result.json` sha256 `0a7d683cd2a3d19db09ce550038b9f3478ad567366bf039dc0261b8b9454ef32`.
25 mounted cases, `failed: 0`, `pageErrors: []`.

`npm test` does not launch this runner. Workflow CI runs `npm ci` and `npm test` and does not install a Playwright browser. The ordinary test in `lib/trips/planning-creation-lifecycle-1.test.ts` executes the same sync guard the hook uses. This script is the separate mounted proof. It is not a skipped CI test.

The runner mounts the real `TripPlanner` and `Reiseidee` with compiled `styles/globals.css`. Guest `gastreiseAnlegen`, `gastreiseAblegen` and `vorschlagAlsReise` run. These boundaries are stubs:

- `next/navigation` and `next/link`
- `reiseorteBestaetigen`
- `reiseAnlegen`
- `vorschlagErzeugen`, `vorschlagUebernehmen`, `vorschlagOrteAufloesen`
- same-origin synthetic `GET /api/search/places`

No hosted account, personal browser profile, model call or Production write. Screenshots are the filled manual form at 320, 390, 1280 and 320 with a 32px root font, plus the proposal preview at 320 and 1280. Measured horizontal overflow is 0 in `result.json`.
