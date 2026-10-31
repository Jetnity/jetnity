# Jetnity widget host (S2)

Separate Next source root for `https://jetnity-widgets.vercel.app`.

GET and HEAD of `/embed/discovercars` and `/embed/twelvego` serve a first-party shell only when the authority is that child host. The shell can be framed by `https://jetnity.com`. Every other request stays a closed 404. The production registry does not select either provider, so the shell does not insert a vendor script.

Frozen general exports live under `artifacts/` and must match their published SHA-256. This package is not a deployment and does not load a CMP.

Run from this directory: `npm ci`, `npm test`, `npm run build`. The browser harness is `node scripts/widgets-host-s2/browser-harness.mjs` from the repository root.
