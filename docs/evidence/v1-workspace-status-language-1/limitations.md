# Evidence limitations — V1 Workspace Status Language 1

- Synthetic guest `localStorage` only. No real account, no Production, no paid call.
- All `/api/flights|hotels|activities|mobility|rental-cars|ai|models` routes intercepted as unavailable.
- Chromium/Playwright 140.0.7339.16. Not Safari, not real-device, not whole-site E2E.
- Before captures: compiled product at `f6372928` (runtime-identical to assigned `main@4278cd04` for the owned copy files). Worktree also had generated `AGENTS.md` / `next-env.d.ts` and a copied audit script; those are not product-copy changes.
- After captures (first slice, unchanged states): compiled product at clean `7a143fecdf0647bfa059653f96cc8c1eca5d6656`. Source-equivalent; not recaptured for SL-R1/SL-R2.
- After captures (SL-R1/SL-R2 same-place): compiled product at clean `a71d3b5d6dce01b07ce1738c1322b9e24ba198ab`. Later freeze/docs commits do not change the owned runtime copy sources.
- 200% check is `document.documentElement.style.fontSize = 200%` in Chromium, not iOS/Android system text size.
- Keyboard evidence is Playwright Enter/Escape, not a hardware keyboard.
- Bestand panels still contain older “bestimmbar” sentences. Those files are outside exclusive ownership and are not claimed fixed.
- `covered_by_flight` is still not invented from a same-date flight title. Hinweis copy is display-only for that existing field.
- No live Preview interaction is claimed by these local captures.
