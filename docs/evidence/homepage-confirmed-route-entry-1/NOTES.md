# Homepage confirmed route entry 1 — evidence notes

Date: 2026-09-22  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
Model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

## What these images are

Hydrated controller evidence from `scripts/homepage-route-entry-1-hydrated.mjs`. Actual `StartzielForm`, `TripPlanner` and a minimal `OrtSuche` consumer were bundled; Next router/link and server actions were stubbed; `/api/search/places` was synthetic. **Not** physical-device acceptance and **not** authenticated Production/Preview E2E.

The earlier `homepage_*.webp` / `planen_*.webp` set remains initial/pending/error-only against empty local GeoNames.

| File | Observation |
| --- | --- |
| `r4_origin_confirmed_edit_keeps_text.png` | After confirmed Paris in origin, edit to Parix remains visible (R4) |
| `r4_origin_reselect_after_edit.png` | Later canonical Zürich re-selection still applies |
| `r4_minimal_ortsuche_without_initialtext.png` | Shared OrtSuche without `initialText` keeps post-selection edit |
| `r4_parent_seed_and_reset.png` | Explicit parent seed/empty reset still works |
| `hydrated-report.json` | 9 PASS machine report |

Previous STATUS on `0a66982c` incorrectly claimed origin without `initialText` did not wipe typing after confirmation. That claim is withdrawn; R4 was that wipe.

Harness screenshots do not load the Next font pipeline.

## Tests

`scripts/homepage-route-entry-1-verify.mjs`: 148 node:test pass / 0 fail, then hydrated 9 PASS on the working tree used for these captures.
