# Guest Trip Read Recovery 1 — synthetic proof notes

Date: 24 October 2026
Author: Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1
Session: `bc-2806475d-7ee4-40d0-980e-1d26bcb5b270`

`results.json` is the machine result of `node scripts/guest-trip-read-recovery-1/run.mjs`. Screenshots are Playwright captures of `#root` only. The harness control used to move keyboard focus sits outside that root and is not part of the product UI.

## Boundary

Isolated local Playwright (Chrome channel recorded in `results.json`). The page mounts the real `GastReisen` and `GastArbeitsbereich` modules. Storage and create-entry are the real modules. `Storage.prototype` is wrapped so reads can throw and writes can be counted; Chrome `localStorage` itself is not replaced.

Harness shims, and only those, stand in for `next/link`, `next/navigation`, `next/dynamic`, `next/image`, `next/cache`, `next/headers`, `next/server`, `server-only`, `node:*`, and `@opentelemetry/api`. They exist so the client components can mount outside Next. They are not a stub of guest storage. Import-time server work is not executed on the read-failure paths. The matching-trip scenario still renders the real `TripWorkspace` client surface.

No hosted account, personal browser, provider, model call, or Production data.

## What the ten scenarios show

1. Empty storage paints a loading frame, then the existing first-trip state.
2. Invalid active bytes show "Dieser Entwurf ist nicht lesbar." and "Erneut prüfen", with no first-trip create link, at 320px, and zero writes.
3. A throwing read stays unreadable with the bytes unchanged. After reads work again, recheck shows the stored trip.
4. Recheck turns invalid bytes into a valid trip, then into confirmed absence, without deleting the previous bytes first. Writes stay zero on those controlled replacements.
5. A valid queue stays listed with zero writes. A valid legacy draft migrates through the existing loader and is shown. An invalid active key does not enter that loader, so a queue beside it is not listed in the same observation. The node tests cover that boundary.
6. Keyboard: Tab reaches "Erneut prüfen" and Enter activates it.
7. A different valid trip is a status with "Reise fortsetzen", not a storage alert and not a create link. The matching id then shows the workspace.
8. Changing `tripId` on the same mounted workspace clears the previous title before the next trip paints. A loading frame exists without the previous title.
9. Invalid workspace bytes and a later confirmed absence do not write.
10. At 200% root font size, 320px and 1280px do not overflow horizontally. The recheck control stays at least 44px tall and on screen.

Source hashes inside `results.json` are the files at the proof run. Readonly `gastspeicher.ts` blob `1964cfc9b78f7361e23ff6fb9ccd64dbd3491399` and `create-entry.ts` blob `eac2e408a74bf9b8174b6e3d5b74c5da80c02651` match the task baseline.
