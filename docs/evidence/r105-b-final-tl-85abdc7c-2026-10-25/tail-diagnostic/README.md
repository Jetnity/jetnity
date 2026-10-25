# R105 B V4 — one-page tail capture diagnostic

**PREPARED, NOT EXECUTED.** Root requested this focused diagnostic after an existing full-page PNG appeared white in its later rows. That observation has not established a browser capture limit or an application rendering fault.

Root reviews these files and then runs:

```text
python /tmp/jetnity-r105-b-v4-tail-diagnostic-prep-acicppyn/run.py
```

The controller creates a new `/tmp/jetnity-r105-b-v4-tail-viewport-proof-*` directory. It does not overwrite previous artifacts, run the 56-measurement montage again, edit repository files, modify original assertions, navigate to hosted content, or change any remote state. There is no built-in retry or permission fallback.

## Inputs

- Exact detached checkout: `/tmp/jetnity-r105-b-v4-review-85abdc7c33a3`.
- Head: `85abdc7c33a34b7a93a3fdb6f78f658940ee1063`; tree: `9ea461a1ca193fd86314e2269f10cf8d2521ac8a`.
- Explicit accepted main: `9092b29c2e187bd73d644a3d85670f3ac6436be1`; local relation must remain 13 ahead / 0 behind.
- Exact final `AccountBuchungen` and imported project sources are used directly.
- `fixture-source.ts` contains two byte-exact source ranges from the author montage blob `dd6a3b8c51c80dd016117b0a529f19b2605195ac`: imports/FILTER, and uuid/zeile/ansicht. Its only wrapper is a separating newline and `export { ansicht }`. Offsets, source lines, byte lengths and hashes are in `manifest.json`; the controller reconstructs and compares all bytes again before running.
- Verified existing PostCSS file: `/tmp/jetnity-r105-b-v4-css-85abdc7c/jetnity-b-postcss-85abdc7c33a3.css`, SHA256 `7e913d744353e72444dcbbf08cb9241f34836143b0961d8703e0c26faaa85e79`.
- Existing isolated Chromium: `/tmp/jetnity-r104-browsers/chromium-1187/chrome-linux/chrome`, pinned to the prior successful root run. No browser or package installation occurs.

The controller checks its own prepared source hashes, fixture extraction, 31 repository source bindings, clean detached HEAD/tree, CSS/provenance hashes and dependency metadata. It checks source bindings after execution as well. It does not claim fresh remote-main, CI or Vercel verification.

## Single render and captures

The TypeScript diagnostic calls the extracted `ansicht('liste')` and renders the real component once with `renderToStaticMarkup`. It uses a single isolated headless page at 320×700, device scale factor 1, root font 32px and reduced motion. It loads the same static document shape as the author montage. The context is offline and blocks service workers; it makes no hosted requests and has no personal profile.

It measures before scrolling, scrolls to the final card, then to the page bottom. Two ordinary **viewport** screenshots are written with `fullPage: false`:

- `last-card-320x700.png`
- `pagination-320x700.png`

Two positions ensure the last card and continuation action are both reviewable without relying on their combined height fitting one viewport. If clamping produces the same position, both truthful measurements are retained.

`diagnostic.json` records viewport and scroll dimensions, every card rectangle, the final card/title/link and pagination href, H1/root computed styles, in-viewport intersection and passive hit-test readbacks. It requires 50 cards, the final `Flug 50` fixture item, the exact fixture continuation href, 320px client/scroll width, and the expected 60px/72px/−2.4px H1 at root32. Passive observer arrays are saved in both `diagnostic.json` and `observer.json`.

The controller requires empty pageerror/console-error/unexpected-request/request-failure arrays and two genuine 320×700 PNGs. It records **CAPTURED_REQUIRES_VISUAL_REVIEW**, not a product PASS or a diagnosis of the original white region. Root must visually inspect the two screenshots to determine whether the tail actually paints in a normal viewport.

This remains static local PostCSS evidence. It does not establish hydration, Next Router behavior, hosted accounts/RLS, native device or zoom behavior, screen-reader behavior, or equivalence to Next production CSS.
