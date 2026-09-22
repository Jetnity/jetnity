# V1 Homepage Tablet Hero Fit 1 — Evidence

Own compiled-CSS Chromium evidence for accepted VUX-8. Not a general visual audit. Not authenticated Preview, hardware, Safari or WCAG proof.

`html { font-size: 32px }` scenes are **text simulation**.

## Provenance

| Item | Before | After |
| --- | --- | --- |
| Product SHA | `195f6bc566854f07044064a3690f7d1df68602da` | `da8db64223af73ab47c29b2915006a34b4945b8f` |
| Homepage source | unchanged seed `page.tsx` | coordinated `xl` grid + card |
| Browser | recorded in `audit-before.json` / `audit-after.json` | same |
| Route / state | `/` anonymous guest, no draft | same |
| Mutations | none observed | none observed; empty-submit validation only |

## Geometry summary

| Scene | Card | Columns | Card width | Tags truncated | overflowX |
| --- | --- | --- | --- | --- | --- |
| before 1024×768 | visible / squeezed | 2 | **195.35** | yes (36px clients) | 0 |
| after 1024×768 | absent | 1 | 0 | n/a | 0 |
| after 1023 / 1279 | absent | 1 | 0 | n/a | 0 |
| after 1280 / 1440 / 1920 | visible | 2 | **400.76** | no | 0 |
| after 360 / 390 / 768 | absent | 1 | 0 | n/a | 0 |
| after 1024 @32px | absent | 1 | 0 | n/a | **148 pre-existing** |
| after 1440 @32px | visible | 2 | 398.87 | some decorative tags | 0 |

The 1024/200% document overflow is **not newly introduced**. Baseline `lg` homepage produced the same `overflowX=148` from the navbar and later Pro/inspiration sections. First-hero and header boxes stayed at `right=1024`. See `overflow-text-200-attribution.json`.

## Images

Viewport-sized captures plus hero clips bounded to the visible viewport. Not card-only crops.

Harness: `capture.mjs`. Unexpected mutations including same-route server actions are aborted. `/api/` and provider/model URLs are fulfilled 503. A zero mutation count is not an observed POST intercept.
