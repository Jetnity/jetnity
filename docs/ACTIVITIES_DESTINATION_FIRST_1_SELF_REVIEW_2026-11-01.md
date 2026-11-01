# Activities Destination First 1 — Self review

2026-11-01. Author session `bc-b961dce1-751e-403e-ade6-52d2c56a648b`. This is not an independent Technical Lead pass.

## Checked

- Unassigned travel days do not select themselves as the destination, and repeated stage ids stay distinct (`lib/activities/zielauswahl.test.ts`).
- Opening Activities does not call `POST /api/activities/search`. An explicit search with no chosen day sends `day: null` and `items: []`.
- Both official frames use the same canonical destination name. The Viator URL carries only `name`. Partner `P00328015` and widget `W-a3c98184-2fae-4bf6-919e-1c32bc42d788` are constants in the embed document.
- Sandbox string does not contain `allow-same-origin`.
- Offline, with the exact official `widget-main.js`, a `vi-wm` of height 480 and origin null leaves the official wrapper at `display:none` and the frame box at 0. The owned bridge sets 480px. A forged `h=9000` and a message after removal leave 480px in place.
- Native Viator detail, schedule, and availability tests still pass when the explicit search button is used.

## Not accepted by this review

- The four live loads are not a claim that offer cards were visible in the Jetnity wrapper. The provider frame text contained German CHF lines. The wrapper was hidden. The bridge was not sent back to Viator for a fifth load.
- Iframe `load` is not an offer count.
- Shared CMP was not given a Viator or GetYourGuide purpose. Ausblenden is local to the activities surface.
- No Ready and no merge.
