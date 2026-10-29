# Jetnity widget host (inert)

Separate Next source root for a future `widgets.jetnity.com` origin.

This build is fail-closed. `/`, `/embed/discovercars`, `/embed/twelvego` and every other path return 404 and load no provider. It is not connected to Git on the widget Vercel project, not deployed, and not a live HTTPS site.

Run from this directory: `npm ci`, `npm test`, `npm run build`.

The separate-origin and parent-domain cookie contract is in `lib/origin-contract.ts` and `docs/JETNITY_WIDGETS_ORIGIN_FOUNDATION_1_REPORT_2026-10-29.md`.
