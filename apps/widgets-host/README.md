# Jetnity widget host (S2)

Separate Next source root for `https://jetnity-widgets.vercel.app`.

GET and HEAD of `/embed/discovercars` and `/embed/twelvego` serve a first-party shell only when the authority is that child host. The shell can be framed by `https://jetnity.com`. Every other request stays a closed 404. The 12Go general source row is selected. DiscoverCars stays unselected. A 12Go script is inserted only after a valid parent grant. This package is source selection, not a deployment, and it does not load a CMP or set the parent sandbox.

Frozen general exports live under `artifacts/` and must match their published SHA-256.

Run from this directory: `npm ci`, `npm test`, `npm run build`. The browser harness is `node scripts/widgets-host-s2/browser-harness.mjs` from the repository root.
