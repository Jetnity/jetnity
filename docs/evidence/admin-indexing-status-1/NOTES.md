# Admin indexing status 1 — evidence notes

Synthetic SSR of `IndexingStatus` with compiled `styles/globals.css`.

- Not an authenticated `/admin/system-health` session.
- Not a live HTTP/crawler/Production probe.
- Not a physical-device or browser-matrix PASS.
- Cases: `deny-preview`, `allow-canonical`, `deny-long-origin`, `deny-conflict`.
- Viewports: 390×844 and 1440×900.

See `manifest.json` for overflow/focus measurements.

R1 render: deny-preview and deny-conflict must show the same neutral lock sentence and must not say beabsichtigter Deny / kein Ausfall. Conflicting App-Origin must not appear as raw text.

Preview-gate recovery on 2026-09-22: TL accepted R1 code on `ae7c85fa` but that SHA had no Vercel deployment/status. Exact-head retry is unavailable. One owned-docs persist retriggers GitHub→Vercel. See `PREVIEW_GATE_RECOVERY_2026-09-22.md`. The previous `cf1bd145` Preview is not reused.
