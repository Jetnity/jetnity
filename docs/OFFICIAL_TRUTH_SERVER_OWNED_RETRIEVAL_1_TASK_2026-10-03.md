# Official Truth Server-Owned Official Retrieval Boundary 1 — Task

Date: 3 October 2026
Issue: #776
Branch: `fix/official-truth-server-owned-retrieval-1`
Baseline: `main@b4b2e001914ce82c8c195bc03b074623565a5b7b`
Logical agent: **Jetnity Official Truth server-owned official retrieval boundary 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Implement only the missing trusted network-retrieval prerequisite established by merged #774 and #775.

The result must prove:

> these bounded bytes were received by Jetnity server code from this exact allowlisted `official_authority` HTTPS source at this server-owned time.

It must **not** prove:
- that the page applies to a regulatory cell;
- that any sentence means a legal fact;
- that a Rule Candidate proposal is correct;
- acceptance, Official Truth or persistence.

No deterministic extractor or F8 acceptance is part of this slice.

## 2. Binding reads

Read live main first, then at minimum:

1. `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_SAME_REQUEST_PROOF_GRAPH_1_REPORT_2026-10-03.md`
3. `lib/readiness/official-truth-same-request-proof-server.ts`
4. `lib/readiness/official-truth-source-catalog-server.ts`
5. `lib/readiness/source-registry.ts`
6. `lib/readiness/official-truth-discovered-url-candidates.ts`
7. `lib/readiness/official-truth-research-execution-plan.ts`
8. `lib/readiness/official-truth-retrieved-material.ts`
9. `lib/readiness/evidence.ts`
10. `lib/server/providers/core/http.ts`
11. `lib/server/providers/core/parse.ts`
12. `lib/server/providers/core/url.ts`

Live code wins over docs.

## 3. Trust model

The caller may propose only:
- `sourceId`
- `url`

Neither is authoritative.

The live entry must:
1. load the current source catalog server-side;
2. resolve the proposed URL against that registry;
3. require exactly the proposed `sourceId`;
4. require `sourceClass === 'official_authority'`;
5. then perform the HTTP retrieval itself.

Do **not** accept from the caller:
- registry;
- sourceClass;
- domains / blockedDomains;
- sourceSnapshot / response bytes / body;
- sourceContentHash / content hash;
- retrievedAt / clock / now;
- response content type;
- response status;
- redirect result/history;
- DNS result/address;
- retrieval receipt/attestation;
- EvidenceVersion;
- candidate / trustedRuleFact / witness / reviewPacketKey;
- model/suggestion/decision fields;
- credentials, cookies or authorization headers.

Any such authority-like field must fail closed before network access.

This boundary proves source origin only. It does not need to trust caller coverage descriptors or claim that the source covers a travel cell.

## 4. Preferred module shape

Primary new module:

- `lib/readiness/official-truth-server-owned-retrieval.ts`
- `lib/readiness/official-truth-server-owned-retrieval.test.ts`

Server-only.

Suggested live entry:
`loadOfficialTruthServerOwnedRetrieval(eingabe)`

Suggested test seam:
`decideOfficialTruthServerOwnedRetrieval(eingabe, deps)`

Dependencies may inject:
- source catalog transport;
- HTTP transport;
- server clock;
- DNS resolver / lookup seam where needed.

The live entry must supply its own server clock, catalog and safe HTTP implementation. A future route must not be able to inject these.

No `app/` import in this slice.

## 5. Output contract

Success must be an ephemeral, deeply immutable server result such as:

- `status: 'server_owned_official_retrieval'`
- `sourceId`
- `canonicalUrl` — final successfully fetched URL
- `retrievedAt` — server-owned UTC instant after successful retrieval
- `contentType` — normalized MIME type observed from the server response, or null if absent
- `sourceSnapshot` — UTF-8 decoded text actually received by Jetnity
- `sourceContentHash` — recomputed with the canonical existing `evidenceQuellenFingerprint(sourceSnapshot)`
- bounded redirect count or equivalent non-authoritative retrieval metadata if useful

Do not include:
- registry;
- credentials;
- resolved IPs;
- request headers;
- cookies;
- secret material;
- Rule Candidate / proposal;
- `trustedRuleFact`;
- acceptance or storage claims.

The result is ephemeral same-request material, not a bearer capability.

## 6. URL and source validation

Before the first outbound request:
- read the server-held source catalog exactly once;
- `quellenUrlAufloesen` must resolve the URL;
- resolved source id must equal requested source id;
- source class must be `official_authority`;
- HTTPS only;
- no URL credentials;
- blocked/unregistered hosts fail.

Tracking-only parameters should not be silently trusted as a distinct legal source. Reuse the repository’s current tracking semantics where practical; do not invent URL cleanup that changes functional parameters.

## 7. SSRF / DNS safety — mandatory

Do not rely on a preflight DNS check followed by a second independent resolver inside `fetch`.

The actual TCP/TLS connection must use an address that passed Jetnity's safety check in that same request attempt.

A safe implementation may use Node's built-in `https.request` with a custom `lookup` callback, or another equivalent built-in mechanism that binds DNS validation to the actual connection. Do not add a dependency unless absolutely necessary and explicitly justified.

For every hostname on every request/redirect:

- resolve through the injected/live resolver;
- reject if resolution fails or is empty;
- fail closed if **any returned address** is not permitted;
- do not return rejected addresses to the connector;
- the selected connection address must be one of the validated addresses.

At minimum reject:
IPv4:
- unspecified / this-network;
- loopback;
- RFC1918 private ranges;
- link-local;
- carrier-grade NAT;
- multicast;
- reserved/broadcast/non-routable ranges.

IPv6:
- unspecified;
- loopback;
- unique-local;
- link-local;
- multicast;
- IPv4-mapped addresses whose mapped IPv4 is forbidden;
- other clearly non-public/non-routable local ranges.

Use `node:net` / `node:dns` or an equally auditable built-in solution. Add direct unit tests for the address classifier and custom lookup behavior.

Do not expose resolved IP addresses in the success result or user-visible error.

## 8. Redirect safety

Automatic redirect following is forbidden.

Use manual redirects only.

Allow only the standard redirect statuses needed for GET, bounded to a small explicit maximum (for example 3–5).

For every hop:
1. parse `Location` against the current URL;
2. validate HTTPS / credentials;
3. resolve through the same server-held registry;
4. require the **same `sourceId`** as the original source;
5. reject blocked/unregistered hosts;
6. apply the full DNS/IP safety gate again;
7. only then issue the next request.

Redirect loops and redirect-count overflow fail closed.

A redirect to another registered government source is still rejected in this slice because it would change source identity.

## 9. HTTP method / headers / credentials

GET only.

No request body.

Do not send:
- cookies;
- Authorization;
- caller headers;
- Supabase keys;
- provider keys;
- browser/session credentials.

Use minimal fixed public headers only if required. Prefer `Accept-Encoding: identity` so the bytes Jetnity hashes are the bytes it explicitly reads without hidden decompression behavior.

No cache.

## 10. Response safety

Accepted success status: 2xx only.

Bound response bytes **at or below the current Evidence content ceiling**. The existing `evidenceQuellenFingerprint` maximum is 65,536 string characters; for this first boundary use a response byte ceiling no greater than 65,536 bytes.

- `Content-Length` may be an early rejection only, never trusted as the true size.
- Stop/cancel/destroy when the streamed bytes exceed the bound.
- Timeout must be bounded and server-owned.
- No retries in this first trust slice unless there is a very strong reason; deterministic fail-closed behavior is preferred.
- Decode only UTF-8 text with a fatal decoder in this first slice. Invalid UTF-8 fails closed.
- Empty content fails closed.
- Compute `sourceContentHash` only from the server-received decoded snapshot with the existing canonical function.
- If the existing fingerprint helper rejects the content, retrieval fails closed.

Capture `content-type` from the response header:
- normalize only the MIME type (lowercase, strip parameters);
- do not invent one when absent;
- do not trust content type as legal meaning.

Do not choose `schemaFamily` here.

## 11. Server time

`retrievedAt` comes only from the server-owned clock after the successful response body is fully received and validated.

Caller time is forbidden.

The test seam may inject a deterministic clock. The live entry may use the current server UTC time.

## 12. Deep immutability

Return a safe copy/deep-frozen success result.

A caller mutation of input after retrieval must not alter:
- source id;
- canonical URL;
- retrievedAt;
- content type;
- snapshot;
- hash.

## 13. Relationship to existing submitted-material path

Do **not** delete or silently rewrite the historical human-review/research path in this slice.

Current `officialTruthAbgerufenMaterialPruefen` may continue to validate submitted/research material for its existing bounded use.

The new result must be clearly distinct from that older result.

Document:
- submitted material ≠ server-owned retrieval;
- only the new server-owned result may later feed deterministic extraction;
- integration into Evidence/proof graph is a future slice.

## 14. Provider separation

Do not use Sherpa, Timatic/IATA or any licensed-provider source in this boundary.

A `licensed_evidence_provider` source id must fail before any network request.

The generic provider transport may be studied/reused only for low-level ideas. Do not make provider transport metadata or provider status into Official Truth authority.

## 15. Mandatory adversarial tests

At minimum:

1. caller registry/sourceClass/domains/blockedDomains rejected before catalog/network;
2. caller snapshot/hash/retrievedAt/contentType/redirect/DNS/receipt fields rejected before network;
3. catalog missing/failure -> no network;
4. licensed provider -> no network;
5. source id / URL source mismatch -> no network;
6. HTTP URL / credentials / unregistered / blocked host -> no network;
7. literal localhost/.local and IP-like unsafe targets fail;
8. DNS: public IPv4 succeeds; private IPv4 fails;
9. DNS: loopback/link-local/CGNAT/multicast/reserved IPv4 fail;
10. DNS: public IPv6 succeeds; ::1/::/ULA/link-local/multicast fail;
11. IPv4-mapped private IPv6 fails;
12. mixed DNS result containing one public and one forbidden address fails closed;
13. DNS resolver failure/empty answer -> no HTTP connection;
14. connection uses only a validated resolved address;
15. 2xx bounded UTF-8 response succeeds;
16. success captures server-owned final URL/time/content type/snapshot/hash;
17. input mutation cannot alter success;
18. oversized Content-Length rejects;
19. streamed body crossing bound aborts/rejects;
20. invalid UTF-8 / empty body rejects;
21. 4xx/5xx reject;
22. timeout rejects;
23. redirect within same source/domain succeeds when bounded;
24. relative redirect handled safely;
25. redirect to other official source fails;
26. redirect to private/local/unregistered/HTTP/credential target fails before connection;
27. redirect loop / max-hop overflow fails;
28. no cookies/auth/caller headers forwarded;
29. no `app/` imports;
30. no Rule acceptance/store/Evidence write/extractor/F8 import or call.

Use fake/injected HTTP + DNS in tests. Do not depend on live internet.

## 16. Allowed files

Primary ownership:
- new `lib/readiness/official-truth-server-owned-retrieval.ts`
- new `lib/readiness/official-truth-server-owned-retrieval.test.ts`

Narrow edits only if required:
- `lib/readiness/source-registry.ts` + test if one generic source-resolution helper genuinely belongs there;
- a new small server-only low-level helper under `lib/server/` only if necessary for a safe custom HTTPS/DNS connection and clearly owned by this slice.

Delivery docs:
- `docs/OFFICIAL_TRUTH_SERVER_OWNED_RETRIEVAL_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SERVER_OWNED_RETRIEVAL_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SERVER_OWNED_RETRIEVAL_1_SELF_REVIEW_2026-10-03.md`

Do not edit global current-state files or this task file.

Any other edit requires a necessity note before modification.

## 17. Forbidden

No:
- `regelKandidatAkzeptieren`;
- accepted Rule Claim;
- Evidence/store write;
- migration or Supabase mutation;
- route/UI;
- Auth/AAL/role/RLS/capability change;
- deterministic extractor;
- model/plugin/suggestion call;
- provider/licensed-provider call;
- secrets or paid service;
- #626;
- CH import;
- Production activation;
- F8;
- follow-up slice.

## 18. Validation / STOP

Before STOP:
- focused tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- operating-mode and normal hygiene checks;
- `git diff --check`;
- source assertions proving no app route/store/acceptance/extractor wiring;
- fetch live main and finish 0 behind;
- push exact review head;
- remain Draft;
- report session id, `originalModelName`, exact head/files/gates and security boundaries;
- STOP for independent TL review.

No Ready. No merge. No follow-up.