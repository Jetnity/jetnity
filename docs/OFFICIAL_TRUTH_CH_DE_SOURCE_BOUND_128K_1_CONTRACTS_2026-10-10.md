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
transport budget gate compares this exact tuple, current item/representation
state, URL and received media type. The existing source registry, content router
and current identity-profile verification remain independent gates. The code
owned production profile registry remains unchanged and has no Bern profile;
the real Bern source therefore remains blocked before DNS/HTTP.

Test-only injected catalogs and verifiers exercise the exact tuple with
explicitly synthetic bodies. They are not production registration and do not
establish a legal visa fact. A matched test tuple whose verifier returns
quarantine still fails `content_identity_mismatch`.

## Byte and response contract

- Every non-matching request uses `BODY_MAX = 65_536`, unchanged.
- The selected per-hop cap is used both for early GET `Content-Length` refusal
  and for the running sum of actual response bytes. HEAD is not used.
- Missing, zero, malformed, contradictory or falsely short lengths do not
  weaken the streamed-byte check. No partial body is returned after refusal.
- The accumulator allocates only the selected maximum and copies a chunk only
  after checking whether that chunk would cross the boundary.
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
- `Content-Type` must be one value with the exact registered media type;
  a declared charset must be UTF-8. Decoding remains fatal UTF-8 and a UTF-8 BOM
  is rejected.
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

For bodies above 65,536 bytes, the retrieval result uses the same normalized
SHA-256 algorithm directly for its volatile `sourceContentHash`; this does not
change `evidenceQuellenFingerprint`, which continues to reject input above its
existing limit. Downstream Evidence acceptance is not expanded, and no source
body or hash is persisted or included in the sanitized evidence artifacts.

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
