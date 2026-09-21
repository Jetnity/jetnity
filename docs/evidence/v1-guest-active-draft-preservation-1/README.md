# V1 Guest Active Draft Preservation 1 — evidence

Synthetic compiled-CSS `/planen` captures for Draft PR #532 / issue #530.

- `capture.mjs` — Chromium/Playwright against local Next; mutations aborted before completion; viewport + full-page screenshots; measured document/section/heading bounds; 360/200% overflow assertions
- `audit.json` — raw-byte equality, visible state, geometry, screenshot pixel sizes, attempts vs completed
- `handler-proof.mjs` / `handler-proof.json` — actual mounted Reiseidee + TripPlanner submits after storage change, including active-absent + Legacy getItem throw
- `screens/*.png` — viewport shots; `*-full.png` are full-page. Do not treat an element crop as mobile PASS.

Not authenticated Preview, not hardware, not Safari, not WCAG. No real account/model/provider write.

Blocked before interaction: unexpected `POST`/`PUT`/`PATCH`/`DELETE` including same-route `/planen`; provider/API fulfilled 503.
