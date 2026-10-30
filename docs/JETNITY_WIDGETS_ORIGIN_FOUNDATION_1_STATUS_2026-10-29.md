# Jetnity Widgets Origin Isolation Foundation 1 — STATUS

**Stand:** 29 October 2026. **Status:** implemented locally, Draft, stopped for independent Technical-Lead exact-head review.
**Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
**Model:** `grok-4.7-high-fast`

## What is true now

- `apps/widgets-host` is a separate Next 16.4.1 source root. It is not linked to the Vercel project `jetnity-widgets` and it is not a live site.
- `/`, `/embed/discovercars`, `/embed/twelvego`, unknown paths, `/_not-found`, and `/_next/static/...` returned HTTP 404 with the inert body on a local `next start`.
- Forged `consent=1`, Cookie, Authorization, Host, Origin, and Referer did not change the status, body, or headers, and were not reflected.
- No `Set-Cookie`, CORS, redirect, or provider URL was observed on those responses.
- `widgets.jetnity.com` remains a prepared, misconfigured DNS name in the Technical Lead's earlier read. This session did not call the Vercel or DNS APIs and does not claim HTTPS, a certificate, or cookie isolation.

## Gates

| Gate | This session |
| --- | --- |
| Source fail-closed and header contract | Verified by unit tests and source scan |
| Local production server HTTP matrix | Verified, 21 cases |
| Nested `npm ci` / build | Verified |
| Root dead/exports/deps/api/schema/operating-mode | Verified on the working tree |
| Authored-file eslint | Verified, exit 0 |
| Root typecheck, full `eslint .`, root build, Auth CI | Not run here; GitHub CI on the PR is the root gate |
| Widget Vercel deploy, DNS, TLS, production cookie attributes | Not done and not claimed |
| Personal browser / device widths | Not done (#748) |
| Consent / provider script activation | Not authorized |

## Stop

Draft remains Draft. Cursor does not mark Ready, merge, deploy, or open a follow-up slice. The next actor is the Technical Lead, on the exact pushed HEAD.
