# Homepage confirmed route entry 1 — evidence notes

Date: 2026-09-22  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
Model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

## What these images are

Chromium DevTools-emulated viewports against local `http://localhost:3000` after the implementation commits. They are **not** physical-device acceptance and **not** authenticated Production E2E.

| File | Viewport | Observation |
| --- | --- | --- |
| `homepage_390_initial.webp` | 390×844 | Hero preserved; one search; citrus submit |
| `homepage_390_empty_submit.webp` | 390×844 | Empty submit keeps the existing list-selection error |
| `homepage_390_pending_text.webp` | 390×844 | Typed `Paris` without a list choice; pending text is blocked |
| `homepage_768_tablet.webp` | 768×1024 | Form still usable; no Ziel1/2/3 block |
| `homepage_1024_form.webp` | 1024×768 | Form remains in the first hero column |
| `homepage_1440_keyboard.webp` | 1440×900 | Keyboard tab to submit |
| `planen_invalid_zielids.webp` | 1440×900 | `/planen?zielIds=kein-ort` recoverable error, Zur Startseite |
| `planen_conflict_zielids.webp` | 1440×900 | `zielIds` + `zielId` conflict, no planner prefill |

## Local place search

`GET /api/search/places?q=Paris&rolle=ziel` returned HTTP 200 and `[]`. The combobox showed the existing unknown-destination copy. No confirmed multi-place chip flow could be exercised against this local places table. That gap is Preview/physical-device, not a silent auto-select.

A screen recording was started and discarded after the ffmpeg stop timed out. Screenshots remain the browser evidence.

## Tests

`scripts/homepage-route-entry-1-verify.mjs` plus owned/related node:test files: 140 pass / 0 fail on the working tree used for these captures.
