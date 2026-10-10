# CH→DE Source-Bound 128 KiB Retrieval 1 — Contracts

Binding task: `docs/OFFICIAL_TRUTH_CH_DE_SOURCE_BOUND_128K_1_TASK_2026-10-10.md`,
SB01–SB31. These contracts describe only the code-only retrieval slice.

## Candidate tuple and two separate gates

The candidate policy in
`lib/readiness/official-truth-ch-de-source-budget-128k-1.ts` pins:

- source: `de-bern-embassy-research-only`;
- item: `bern-visa-entry-2611474`, version 1;
- representation: `bern-visa-entry-html-de`, version 1;
- identity-profile name/version: `de-bern-entry-page-unqualified`, version 1;
- one exact canonical request and final URL:
  `https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474`;
- media type: `text/html`;
- inclusive maximum: 131,072 bytes.

The name `unqualified` is intentional. This tuple is a closed engineering
candidate, not an admitted production source or an identity/legal verdict. The
code-owned identity-profile registry currently has only GOV.UK and no Bern
profile, so the 128 KiB server-owned retrieval allowance is dormant. Even if a
matching descriptor is returned by a test-injected catalog, its caller-provided
profile object cannot satisfy the selector's identity comparison with the
compiled profile registry. In addition, elevated selection is reachable only
from the direct live loader's private authorization path; test decision seams and
catalog-transport helpers always retain the 65,536-byte ceiling. The real Bern
source therefore remains blocked before DNS/HTTP.

Test-only injected catalogs and verifiers exercise the exact tuple with
explicitly synthetic bodies. Bodies above 65,536 bytes are refused by the
server-owned test seam even if a synthetic verifier accepts them. They do not
establish a legal visa fact. A matched in-boundary test tuple whose verifier
returns quarantine still fails `content_identity_mismatch`.

## Byte and response contract

- Every non-authorized or non-matching request uses `BODY_MAX = 65_536`,
  unchanged. All current tests and injected-catalog paths use this default.
- If separately approved in code later, the direct live loader selects the
  candidate cap only for the exact compiled profile object plus the exact
  current registry tuple, canonical URL and response media. No such Bern profile
  currently exists.
- The selected per-hop cap is used both for early GET `Content-Length` refusal
  and for the running sum of actual response bytes. HEAD is not used.
- Missing or valid short lengths do not weaken the streamed-byte check. Malformed
  or comma-joined/conflicting lengths fail before body reads; valid over-limit
  lengths refuse early. No partial body is returned after refusal.
- The accumulator allocates only the selected maximum and copies a chunk only
  after checking whether that chunk would cross the boundary.
- The separate `officialTruthBoundedResponseBody` utility has an absolute
  131,072-byte ceiling and returns bytes only. Its synthetic boundary tests prove
  transport buffering behavior; it creates no catalog, identity verdict,
  retrieval envelope, Evidence, Rule or source qualification.
- For 131,072 bytes, conservatively budgeting the byte buffers, UTF-16 text,
  normalized hash input, SHA-256 encoder/padding bytes and immutable result clone
  gives about 917,504 bytes (<1 MiB) of reader-controlled transient memory per
  in-flight call. This excludes the current transport chunk, runtime/object
  overhead, GC retention and verifier allocations; concurrent requests multiply
  the amount. Hashing and profile verification are O(response bytes); concurrent
  near-limit responses can multiply CPU use. The existing 10-second timeout is
  preserved, with no new global concurrency limiter.
- Content encoding is absent or exactly `identity`; compressed, unknown or
  combined encodings fail closed. No decompressor is used.
- `Content-Type` must be one value with the exact registered media type; only a
  single explicit UTF-8 charset parameter is allowed. Unknown/duplicate
  parameters fail closed. Decoding remains fatal UTF-8 and a UTF-8 BOM is rejected.
- A redirect is revalidated against the current representation allowlist. The
  larger cap is recomputed for the next hop; any different path/representation
  receives the default or is refused before another connection.

## Preserved controls and boundaries

The server-owned path retains catalog validation, official-authority source
classification, exact source URL routing, HTTPS/443, DNS and public IPv4/IPv6
checks, pinned socket lookup, TLS certificate validation, 10-second timeout,
bounded redirects/loop detection, no cookies/authorization, and the existing
profile-verifier → source identity result ordering. No new HTTP client, route,
retry, source registration, accepted Evidence/Rule, F8, DB write, Auth/RLS,
provider, UI, or Trip Workspace behavior is added.

`sourceContentHash` is always produced by the canonical
`evidenceQuellenFingerprint` contract. A body whose decoded snapshot exceeds
that contract is refused as `invalid_source_snapshot`; no alternate hash,
trusted retrieval envelope or downstream Evidence is emitted. Any global
Evidence/custody limit change requires a separate reviewed contract and scope.

## Source qualification boundary

No current S3 title, source identity, publisher control, page-wide privacy,
operative legal scope, effective interval, exceptions, amendment date or
cross-reference has been independently qualified in this code-only task. The
previous one-time size measurement is not a current representation guarantee or
legal evidence. Consequently:

`SOURCE_NOT_QUALIFIED / NO_ACCEPTED_OFFICIAL_TRUTH / NO_F8 /
NO_HOSTED_IMPORT / NO_PUBLIC_REQUIREMENTS_ACTIVATION`.

No assertion about visa-free entry, passport subclass, stay duration, transit,
work or other legal requirements is made.
