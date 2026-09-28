# V1 Release Readiness Preflight 1 — bounded live readback

Stand: 28. September 2026  
Read window: 2026-09-28T18:25Z–2026-09-28T18:32Z  
Method: read-only GitHub API, public HTTPS, DNS, repository source on `origin/main@532e1cf2a0793bc717991ed7e3d23bf896635c42`  
No Supabase query, no provider call, no secret, no personal payload.

## Repository

- `git fetch origin main` completed.
- `origin/main` = `532e1cf2a0793bc717991ed7e3d23bf896635c42`.
- Commits after the dispatch SHA: **0**.
- Subject: `Merge #601: close Terms CH-DE 1.0 Production integration`.
- Machine mode in `.jetnity/operating-mode.json`: `NORMAL`.

## GitHub

Open pull requests:

| PR | Draft | Branch | Updated |
| --- | --- | --- | --- |
| #603 | yes | `audit/v1-release-readiness-preflight-1` | 2026-09-28T18:25:15Z |
| #52 | yes | `docs/chatgpt-technical-lead-handoff-2026-08-24` | 2026-08-25T14:53:16Z |
| #50 | yes | `cursor/s1-merged-status-f23f` | 2026-08-24T10:24:06Z |
| #40 | yes | `audit/admin-platform` | 2026-08-24T00:15:17Z |
| #39 | yes | `audit/account-platform` | 2026-08-24T00:10:52Z |
| #28 | yes | `feat/trip-collaboration-foundation` | 2026-08-21T06:05:57Z |

Open issues observed: #602, #585, #440, #395, #294, #236, #20.

Closed completed, re-read this window:

| Issue | Closed at | Title |
| --- | --- | --- |
| #587 | 2026-09-28T15:50:16Z | PO Gate – Jetnity Nutzungsbedingungen / AGB legal content |
| #592 | 2026-09-28T14:31:31Z | PO Gate – Production account erasure activation |
| #582 | 2026-09-27T17:46:08Z | PO Gate – Production SMTP |
| #581 | 2026-09-27T11:45:06Z | PO Gate – Production Auth Site URL + redirects |
| #110 | 2026-09-22T14:30:02Z | Homepage natural multi-destination route intent |

Latest main CI: run `36447407927`, conclusion `success`, head `532e1cf2a0793bc717991ed7e3d23bf896635c42`, created 2026-09-28T15:56:43Z. Checks: Auth configuration success; Typecheck, Lint & Build success.

Commit status for that SHA: Vercel `success`, “Deployment has completed”, updated 2026-09-28T15:57:14Z, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/H9XcfMWMRyvbr315BXCmN5U29buT`.

Production deployment id `6714440104`, SHA prefix `532e1cf2a079`, environment `Production`, status `success`, created 2026-09-28T15:57:15Z. The deployment hostname redirected to Vercel SSO, so its HTML was not read. Public alias evidence is the `jetnity.com` read below.

Ruleset `21875372` (`Jetnity main protection`): `enforcement=active`, `bypass_actors` length 0. Read-only. Not mutated.

Dependabot alerts API: HTTP 403, alerts disabled. Code scanning alerts API: HTTP 403. Neither result is a vulnerability finding.

## External waiting states (issue comments, not re-sent)

| Gate | Issue | Comment time | State recorded on GitHub |
| --- | --- | --- | --- |
| KAYAK `A-KAYAK-INQUIRY-1` | #395 | 2026-09-28T12:22:55Z | SENT / WAITING FOR RESPONSE |
| Sherpa `A-OFFICIAL-ENTRY-INQUIRY-1A-SHERPA` | #294 | 2026-09-28T17:59:04Z | SENT / WAITING FOR RESPONSE |
| IATA Timatic `A-OFFICIAL-ENTRY-INQUIRY-1B-IATA-FORM` | #294 | 2026-09-28T18:21:25Z | SENT / WAITING FOR RESPONSE |
| PrivacyBee #585 | #585 | 2026-09-28T17:03:16Z | Product Owner deferred the support inquiry and accepted current generated text for Switzerland-first prelaunch |

No provider message body, form payload, credential, or traveller document is copied here.

## Public `jetnity.com`

Read at 2026-09-28T18:27:10Z unless a later line says otherwise.

| URL | HTTP | Notes |
| --- | --- | --- |
| `http://jetnity.com/` | 308 | `Location: https://jetnity.com/` |
| `https://jetnity.com/` | 200 | title present; `robots`/`googlebot` = `noindex, nofollow`; canonical `https://jetnity.com`; footer hrefs include `/privacy`, `/terms`, `/impressum` |
| `https://jetnity.com/terms` | 200 | title `Nutzungsbedingungen / AGB – Jetnity`; visible text contains `CH-DE 1.0`, `28. September 2026`, `Inkrafttreten`; `noindex` |
| `https://jetnity.com/privacy` | 200 | title `Datenschutzerklärung – Jetnity`; canonical `https://jetnity.com/privacy`; `noindex, nofollow`; one `h1`; PrivacyBee script marker present |
| `https://jetnity.com/impressum` | 200 | title `Impressum – Jetnity`; canonical `https://jetnity.com/impressum`; `noindex, nofollow`; one `h1`; PrivacyBee script marker present |
| `https://jetnity.com/register` | 200 | `noindex`; hrefs to `/terms` and `/privacy` |
| `https://jetnity.com/robots.txt` | 200 | body exactly `User-Agent: *` then `Disallow: /` |
| `https://jetnity.com/sitemap.xml` | 200 | empty `urlset` |
| `https://jetnity.com/sw.js` | 404 | |
| `https://jetnity.com/manifest.webmanifest` | 200 | `display=standalone`, `start_url=/`, three icon paths |
| `https://jetnity.com/icons/jetnity-192.png` | 200 | `image/png` |
| `https://jetnity.com/icons/jetnity-512.png` | 200 | `image/png` |
| `https://jetnity.com/icons/jetnity-512-maskable.png` | 200 | `image/png` |
| `https://jetnity.com/auth/callback` | 200 | |
| `https://jetnity.com/konto-geloescht` | 200 | |

Homepage response header names included `strict-transport-security: max-age=63072000` and `access-control-allow-origin: *`. No `content-security-policy` response header was present on `GET /`.

DNS: `jetnity.com` resolved to `216.150.1.1`. `www.jetnity.com` did not resolve. DNSSEC was not re-queried.

`server: Vercel` on the public responses.

## Supabase

Management API `GET /v1/projects/{ref}` with the injected access token returned **HTTP 401**. The injected `SUPABASE_PROJECT_REF` matches `NEXT_PUBLIC_SUPABASE_URL` and does **not** match the documented Production ref `qscbgcdmivbbnzrcyegn`. No Production function list, migration list, Auth config, advisor list, or backup list was read. No user table was queried.

## Source facts used as current-main code, not as live Production config

- `lib/flights/zustand.ts`: Production flight search returns `aktiv: false`, `grund: 'production'`.
- `lib/hotels/zustand.ts` and `lib/activities/zustand.ts`: same Production hard-off through `lib/provider-ops/zustand.ts`.
- `lib/legal/ap6a-gate0-vertrag.ts`: `keineConsentPersistenz: true`.
- Application TypeScript has no `security_events` insert. Inserts found only in local harnesses `scripts/db/security-events-producer-contract-lokal*.sql/mjs` and `scripts/db/sicherheit.mjs`. Account deletion deletes by `user_id`.
- `lib/admin/ehrliche-zustaende.ts` still states that application ingestion is incomplete and that zero rows do not prove that no security event occurred.
