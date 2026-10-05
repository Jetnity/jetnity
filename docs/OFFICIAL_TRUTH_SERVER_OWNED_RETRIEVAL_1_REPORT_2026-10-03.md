# Official Truth Server-Owned Official Retrieval Boundary 1 — Report

Date: 3 October 2026
Issue: #776
Draft PR: #777
Branch: `fix/official-truth-server-owned-retrieval-1`
Baseline: `main@b4b2e001914ce82c8c195bc03b074623565a5b7b`
Implementation commit: `622f86fcbd2388a0655967ab41bebc102e45ad4b`
Type signature commit: `398cefacc6c8cafb72970da455b970f172784643`
Technical-Lead review head that required changes: `80d2be4c977fb828aadc0e9121e76979528325cd`
Port and fragment remediation: `eaf831519b2bce10c4bc54a80fa508d03ce2cc0f`
Logical agent: **Jetnity Official Truth server-owned official retrieval boundary 1**
Generation: **1**
Session: https://cursor.com/agents/bc-61eb7c94-41ab-4d04-ad39-8dde4d7cd8b6
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge. Re-fetch before review. `622f86fc`, `398cefac`, and `eaf83151` are earlier commits. They are not the review head once this documentation commit is on the tip. The independent review of `80d2be4c` is CHANGES REQUIRED. R1 and R2 are closed in `eaf83151`. That closure is not a Technical-Lead PASS.

## Result

`loadOfficialTruthServerOwnedRetrieval(eingabe)` in `lib/readiness/official-truth-server-owned-retrieval.ts` is the live entry. It accepts only `sourceId` and `url`. Neither is authority. The function supplies its own server clock, the server-held source catalog, and a `node:https` client whose custom `lookup` is the only DNS resolution for that connection.

`decideOfficialTruthServerOwnedRetrieval(eingabe, deps)` is the test seam. It may receive a catalog transport, a clock, a DNS resolver, an HTTP client, and a bounded timeout. A future route must not call the seam and must not inject those dependencies into the live entry. The live function takes one argument.

A successful result is a deep-frozen copy:

- `status: 'server_owned_official_retrieval'`
- `sourceId` from the catalog row
- `canonicalUrl` of the final fetched URL
- `retrievedAt` from the server clock after the body is validated
- `contentType` as the observed MIME type, or null
- `sourceSnapshot` as the UTF-8 text Jetnity decoded
- `sourceContentHash` from `evidenceQuellenFingerprint(sourceSnapshot)`
- `redirectCount`

The result does not contain the registry, resolved IPs, request headers, cookies, credentials, a Rule candidate, `trustedRuleFact`, or an acceptance claim. It is ephemeral same-request material. It is not a bearer capability.

## What the boundary does

1. Authority-like caller fields fail before the catalog read and before any DNS or HTTP call. That includes registry, source class, domains, blocked domains, snapshot, hash, clock, content type, redirect or DNS results, receipts, Evidence, candidate, trusted fact, witness, review key, model, suggestion, decision, credentials, cookies, authorization, headers, and `schemaFamily`. Personal keys such as `passportNumber` fail the same way. Any other extra key is `unexpected_fields`.
2. The catalog is read once through `quellenKatalogLesen`. A missing or failed catalog does not open a connection. Redirects reuse that registry.
3. `quellenUrlAufloesen` must resolve the URL to the proposed `sourceId` with `sourceClass === 'official_authority'`. HTTP, credentials, unregistered hosts, and blocked hosts fail before a connection. A catalog hostname authorizes only the default HTTPS port. An empty port and explicit `:443` are that default. Any other explicit port, including `:8443` and `:9443`, is `non_default_port` before DNS and before HTTP. The same check applies to every redirect target. A later non-default port needs a versioned catalog allowlist. It cannot come from the caller URL. The fragment is removed before registry validation, tracking checks, loop identity, and the network request. Query parameters stay. Tracking parameters use the existing `utm_` prefix and the closed click-id set. Functional parameters such as `lang` stay on the URL. They are not stripped.
4. WHATWG-normalized IP literals that are not public fail as `address_not_permitted` before DNS. `https://0x7f000001/` and `https://0177.0.0.1/` are `127.0.0.1`. `localhost` and `.local` stay `invalid_url`.
5. The HTTP client receives a lookup that resolves the hostname, rejects an empty or failed answer, and rejects the whole answer if any address is not public. Rejected addresses are not passed to the connector. The recorded connection address is one of the validated addresses. There is no preflight lookup followed by a second independent resolution inside `fetch`. The live client uses `https.request` with that lookup and does not call `fetch`.
6. IPv4 rejects unspecified, loopback, RFC1918, link-local, CGNAT, multicast, and the reserved or documentation ranges listed in the module. IPv6 rejects unspecified, loopback, unique-local, link-local, site-local, multicast, documentation, and the other non-routable ranges named in the self-review. An IPv4-mapped, 6to4, or well-known NAT64 address is allowed only when the embedded IPv4 is public.
7. Redirects are manual and limited to 301, 302, 303, 307, and 308. At most five redirects are followed. Every `Location`, including a relative location, is resolved against the current URL. Its fragment is removed before the source check and before loop comparison. It is checked again for HTTPS, the default port, credentials, the same `sourceId`, and the DNS gate. Another official source, a non-default port, a private or local target, an unregistered host, HTTP, or credentials fail before the next connection. A fragment-only change is the same request identity and cannot open a second connection. Loops and a sixth redirect fail closed. The success `canonicalUrl` is the fetched URL with no fragment.
8. The request is GET, with no body and no caller headers. The fixed headers are `accept-encoding: identity` and `cache-control: no-cache`. Cookies and `Authorization` are not sent. The live agent does not keep the socket alive.
9. Only a 2xx response can succeed. `Content-Length` above 65,536 bytes is an early rejection and is not trusted as the true size. The stream is cancelled when the bytes cross 65,536. The timeout is one server-owned budget, 10 seconds on the live entry. There is no retry. Empty bodies and invalid UTF-8 fail. The hash is computed only from the decoded snapshot. The clock is read only after that hash exists.
10. Mutating the caller input during or after the call does not change the frozen result.

## Submitted material is a different object

`officialTruthAbgerufenMaterialPruefen` is unchanged. It still validates caller-supplied `canonicalUrl`, `retrievedAt`, and `sourceSnapshot`. That receipt does not fetch. Its hash proves those supplied bytes. It does not prove a government response.

This module does not call that function. Success status `server_owned_official_retrieval` is not `retrieved_material`. Only this new result may later feed a deterministic extractor. Wiring it into Evidence, the proof graph, or F8 is a future slice. This slice does not do that wiring.

## Traveller context

This boundary does not read citizenship, travel documents, issuing country, residence, or route. It does not choose among credential options. The page bytes are traveller-neutral. A later extractor, which this slice does not start, would still have to run once per necessary credential option. Personal keys on this input fail before the catalog read.

## Out of scope, unchanged

Not changed, and not claimed as fixed:

- `regelKandidatAkzeptieren` and F8
- a deterministic trusted-fact extractor
- Evidence or store writes
- routes, UI, Auth, AAL, roles, RLS, or capabilities
- migrations, Development apply, or Production apply
- #626 and CH import
- Sherpa, Timatic, or any licensed-provider call
- secrets, paid calls, or a new provider

A `licensed_evidence_provider` id fails after the catalog read and before DNS or HTTP. `requirementsProviderAus()` is not called. No `app/` file imports this module.

`check:schema-bezug` still lists four pre-existing LOCAL/UNAPPLIED RPCs: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, and `official_truth_store_accepted_v1`. This slice adds none. The live entry, if something later calls it, reads the existing catalog RPC. Nothing in this slice calls that entry from a route.

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task forbids global current-state files. This report and the handoff are the continuity record.

## Technical-Lead remediation of `80d2be4c`

R1. `portZulaessig()` accepted every port from 1 through 65535. The catalog stores hostnames and has no port allowlist. The replacement accepts only the default HTTPS port. `https://www.gov.example:443/rules` canonicalizes to the portless URL and is fetched. `:8443`, `:9443`, `:1`, and `:65535` return `non_default_port` with no DNS and no connection. A redirect to `travel.gov.example` on `:8443` or `:9443` fails after the first official response and before the second lookup. The live `https.request` uses port 443 and returns before the socket when the URL carries another port.

R2. Fragments were surviving in `canonicalUrl` while `https.request` sent only pathname and query. The fragment is now removed before `quellenUrlAufloesen`, tracking checks, the seen-URL set, and the HTTP call. `https://www.gov.example/rules#one` and the same path with `?lang=en#two` fetch those URLs without the fragment. A `Location` of `#fragment` or the same URL plus a fragment is `redirect_loop` after one connection. A redirect to `/rules/next#fragment` fetches `/rules/next` once. The frozen result does not contain the fragment text. Tracking query parameters still fail. This is not a general URL cleaner.

## Validation

The first gate record below belongs to the tree of `622f86fc` and `398cefac`. The remediation gates were run on `eaf83151` before this documentation commit. `origin/main` was still `b4b2e001914ce82c8c195bc03b074623565a5b7b`. The branch was 0 behind that main.

Remediation gates:

- Focused file: 25 tests, 25 pass, 0 fail. DNS and HTTP are injected. No live internet.
- `npm test`: 4514 tests, 4512 pass, 2 fail, 765 suites. The two failures are the same pre-existing throwaway PostgreSQL proofs. Both die with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` before SQL. This environment has no PostgreSQL 16 `initdb`. Those proofs were not re-run against a database. No remote database was contacted.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 148 pre-existing warnings. None are in the retrieval files.
- `npm run build`: pass. Next.js 16.3.8. Compiled successfully. 25 static pages.
- `git diff --check`: pass.
- `check:operating-mode`: PASS.
- `check:dead`: 0 unreached files.
- `check:exports`: 0 uncalled exports.
- `check:deps`: pass.
- `check:api-schutz`: pass. 12 admin routes still use `requireAdminApi()`.
- `check:schema-bezug`: pass, with the same four pre-existing LOCAL/UNAPPLIED RPCs.

First delivery gates, historical:

- Focused file: 23 tests, 23 pass, 0 fail. DNS and HTTP are injected. No live internet.
- `npm test`: 4512 tests, 4510 pass, 2 fail, 765 suites. The two failures are the pre-existing throwaway PostgreSQL proofs in `official-truth-source-catalog-server.test.ts` and `official-truth-store-server.test.ts`. Both die with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` before SQL. This environment has no PostgreSQL 16 `initdb`. Those proofs were not re-run against a database. The new retrieval file is inside the 4510 passes. No remote database was contacted.
- `npm run typecheck`: pass after `398cefac`.
- `npm run lint`: 0 errors, 148 pre-existing warnings. None are in the new files.
- `npm run build`: pass. Next.js 16.3.8. Compiled successfully. 25 static pages.
- `git diff --check`: pass.
- `check:operating-mode`: PASS.
- `check:dead`: 0 unreached files.
- `check:exports`: 0 uncalled exports.
- `check:deps`: pass.
- `check:api-schutz`: pass. 12 admin routes still use `requireAdminApi()`.
- `check:schema-bezug`: pass, with the four pre-existing LOCAL/UNAPPLIED RPCs above.

Exact-head GitHub CI and Vercel belong to the pushed tip, not to this text.

## Stop

Cursor does not Ready or merge and does not start an extractor, F8, or another slice.
