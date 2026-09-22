# Admin indexing status 1 — evidence notes

Synthetic SSR of `IndexingStatus` with compiled `styles/globals.css`.

- Not an authenticated `/admin/system-health` session.
- Not a live HTTP/crawler/Production probe.
- Not a physical-device or browser-matrix PASS.
- Cases: `deny-preview`, `allow-canonical`, `deny-long-origin`.
- Viewports: 390×844 and 1440×900.

See `manifest.json` for overflow/focus measurements.

Local render 2026-09-22: `ok=true`, no overflow at 390 or 1440, `focusableCount=0`, `healthGreen=false` for deny-preview, allow-canonical and deny-long-origin. Long Preview origin wraps with `break-all`. Not an authenticated Admin session.
