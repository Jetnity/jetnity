# V1 Destination Essentials Density 1 — Evidence

Date: 21 September 2026  
Kind: **synthetic component render with compiled product CSS**  
Authenticated Preview / Production click-through: **BLOCKED_ACCESS**  
Official-travel-advice validation: **NOT_CLAIMED**

Fixture-injected `TripWorkspaceDestinationEssentials` only. Not a real `/reisen/[tripId]` session. No provider, model, storage write or auth bypass.

CSS provenance: `styles/globals.css` compiled via `tailwindcss/nesting` + `tailwindcss` + `autoprefixer` (104346 bytes). Not a hand-copied token subset.

Product tree at capture: `6f8cd923be97eb93c5b7d2cf5f92f8c6a7f20c44`, working tree clean. Browser: Playwright Chromium. Captured at `2026-09-21T18:57:17.302Z`.

## Cases

| Case | Viewport | What it shows |
| --- | --- | --- |
| empty-three-before | 390x844, 1024x768 | Reconstructed previous per-stage empty rendering: Einreise/Sicherheit/Reisezeit × 3 stages |
| empty-three-after | 390x844, 1024x768 | Current compact path: one absence disclosure + ordered destination/date list |
| mixed-after | 390x844 | Material visa / safety / seasonal text remains; details opened by keyboard; official source focused |
| empty-long-names-after | 390x844 | Long destination names wrap; no horizontal overflow |
| empty-large-text-after | 390x844 | 200% root font-size reflow; destinations and dates remain readable |

Harness: `render-harness.ts`. Launcher: `scripts/v1-destination-essentials-density-1-audit.mjs`. Manifest: `manifest.json`. HTML snapshots: `html/`.

## Measured height

| Viewport | Before | After | Delta |
| --- | --- | --- | --- |
| 390x844 | 790.5px | 292px | **-498.5px** |
| 1024x768 | 790.5px | 268px | **-522.5px** |

Horizontal overflow: `overflowing: false` on document, section and shell for every captured case. Mixed `summary` height 44px (`meetsMinH11: true`). Keyboard: focus on `SUMMARY`, Enter opens `details`, official source `https://example.test/official` receives focus.

## Limits

- Before frames reconstruct the previous JSX path from this head; they are not a screenshot of seed `866fbce0` before the source change.
- Compiled-product-CSS component evidence, not a branded authenticated Preview pixel match of a trip workspace.
- No hardware, Safari, whole-site or E2E claim.
- Not official-travel-advice validation.
