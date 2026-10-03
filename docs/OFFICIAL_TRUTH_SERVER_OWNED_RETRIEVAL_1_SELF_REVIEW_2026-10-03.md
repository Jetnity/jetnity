# Official Truth Server-Owned Official Retrieval Boundary 1 — Self Review

Date: 3 October 2026
Issue: #776
Draft PR: #777
Branch: `fix/official-truth-server-owned-retrieval-1`
Implementation: `622f86fcbd2388a0655967ab41bebc102e45ad4b`
Type signature commit: `398cefacc6c8cafb72970da455b970f172784643`
Technical-Lead review head that required changes: `80d2be4c977fb828aadc0e9121e76979528325cd`
Port and fragment remediation: `eaf831519b2bce10c4bc54a80fa508d03ce2cc0f`
Review head: the branch tip after the remediation documentation commit. Re-fetch before review. Do not review `80d2be4c` or `eaf83151` as the tip.
Logical agent: **Jetnity Official Truth server-owned official retrieval boundary 1**
Generation: **1**
Session: https://cursor.com/agents/bc-61eb7c94-41ab-4d04-ad39-8dde4d7cd8b6
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not an independent Technical-Lead PASS.

## Scope check

| Binding | Result |
| --- | --- |
| Server retrieves the official response | Held. Live entry uses `https.request` and a custom lookup. Tests inject DNS and HTTP. |
| Caller proposes only `sourceId` and `url` | Held. Other authority fields fail before the catalog and before the network. |
| Catalog is server-held and read once | Held. Redirects do not read it again. |
| `official_authority` only | Held. A licensed provider id fails before DNS and HTTP. |
| DNS check is the connection lookup | Held. Mixed answers fail without handing the forbidden address to the connector. |
| Manual redirects, same `sourceId`, bounded | Held. Maximum five followed. Loops fail. A fragment-only redirect is the same identity. |
| Default HTTPS port only | Held after `eaf83151`. Non-default ports fail before DNS on the first URL and before the next connection on a redirect. |
| Fragment excluded from provenance | Held after `eaf83151`. The fetched URL and `canonicalUrl` have no fragment. |
| No private, loopback, link-local, local, or unregistered target | Held for URL literals and for resolved addresses. |
| Body at or below 65,536 bytes, UTF-8, server clock, canonical hash | Held. |
| Deep-frozen ephemeral result | Held. Input mutation does not change it. |
| No extractor, F8, store, route, migration, provider, or #626 | Held by the diff and the source assertions. |

## Findings I am not hiding

1. The current catalog RPC returns sources only. `quellenKatalogLesen` therefore builds a registry whose `blockedDomains` list is empty. `quellenUrlAufloesen` still returns `blocked_domain` when that list is non-empty, and this module returns that reason before HTTP. A behavioral retrieval test cannot populate the list without a catalog migration, which this slice must not add. Unregistered hosts are tested through the live catalog shape. The existing source-registry tests already cover a non-empty blocked list for `quellenUrlAufloesen`.
2. The address classifier also rejects documentation, benchmarking, 6bone, Teredo, site-local, and local NAT64 ranges, plus 6to4 and well-known NAT64 when the embedded IPv4 is not public. A public embedded IPv4 stays allowed. That is narrower than banning every mapped address, and it matches the task's mapped-address rule.
3. The live client sets `accept-encoding: identity` and `cache-control: no-cache`. It does not decompress. A gzip body that ignores `identity` fails UTF-8 and returns no success object. There is no local response cache and no retry.
4. The timeout is one 10-second budget for the whole retrieval, not 10 seconds per redirect. The test seam may inject a shorter positive integer up to that budget. The live entry does not accept a caller timeout.
5. `loadOfficialTruthServerOwnedRetrieval` is not called against a real network or a real catalog. The only live call in tests is a forbidden-field input, which returns before the catalog. If a later route called the live entry, it would use the service-role catalog RPC and then a public HTTPS GET. No route imports the module. Calling it is not authorized by this slice.
6. The success object contains the page text. Returning it from a route would publish official page bytes and the hash. The module is server-only and unimported by `app/`. A later slice must keep the bytes on the server stack.
7. `officialTruthAbgerufenMaterialPruefen` still accepts a caller snapshot. This slice does not weaken that historical receipt and does not upgrade it into server-owned proof. An extractor that read the old receipt would still be wrong.
8. The two full-suite failures are environmental. The remediation `npm test` reported 4512 pass and 2 fail across 4514 tests. The first delivery was 4510 pass and 2 fail. Both failures are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in the existing catalog and store throwaway proofs. They start no SQL and they are not caused by this diff. This environment has no PostgreSQL 16 binaries. I did not claim those two proofs passed.
9. `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, and `ROADMAP.md` were not edited. The task allowlist does not include them.
10. This boundary does not interpret the page and does not know which citizenship or credential option the page applies to. That is intentional. Inventing a coverage claim here would be a second authority. The later extractor slice, which is not started, has to keep one invocation per credential option.

## Technical-Lead findings closed in this author record

The review of `80d2be4c` required two changes. This self-review does not convert that review into a PASS.

R1. The catalog authorizes hostnames, not ports. `fremderHttpsPort` rejects every explicit HTTPS port other than the default. `:443` remains allowed because the URL parser treats it as the default and the canonical URL drops it. Initial and redirect tests cover `:8443` and `:9443`, plus the old range edges `:1` and `:65535`. The live client also refuses a non-default port before `https.request` and always dials 443.

R2. `fragmentEntfernen` runs before registry resolution, tracking checks, and the returned canonical URL. Redirect `Location` values lose their fragment before loop comparison. Tests show one fetch for two different initial fragments, one connection for a fragment-only redirect, and no fragment text in the frozen result. `lang` remains. `utm_source` still fails. No other URL cleanup was added.

## Validation seen before the remediation documentation commit

Remediation gates on `eaf83151`: focused retrieval tests 25/25. `npm test` 4512 pass / 2 fail across 765 suites and 4514 tests, with the two `initdb` failures above. Typecheck pass. Lint 0 errors and 148 pre-existing warnings. Build pass on Next.js 16.3.8 with 25 static pages. Hygiene checks pass. `git diff --check` pass. No remote database. Nothing was applied.

The earlier 23/23 and 4510/4512 record belongs to the first delivery and does not include these two fixes.

## Stop

Cursor does not Ready or merge and does not start an extractor, F8, or another slice.
