# CH→DE Source-Bound 128 KiB Retrieval 1 — Self Review

## Fail-closed checks

- The `BODY_MAX` default remains exactly 65,536 bytes. Neither request input nor
  environment/catalog extras can select a larger value.
- The larger allowance requires exact source, item/version, current item,
  representation/version, current representation, profile/version, one
  canonical request/final URL and received `text/html`.
- Candidate metadata is not added to the production identity profile registry.
  A catalog descriptor with no registered verifier fails before network access.
- A successful synthetic transport test is not treated as a source/legal
  qualification. A quarantined verifier still causes `content_identity_mismatch`.
- GET `Content-Length` is only an early refusal optimization. Streamed actual
  bytes remain authoritative even for absent, zero, malformed, contradictory or
  short declarations. Overflow cancels and produces no partial result.
- Encodings and media/charset anomalies refuse before body accumulation.
  Fatal UTF-8 and BOM rejection remain in the complete-response path.
- Redirects must be registered for the exact representation; the per-hop cap is
  recomputed and no candidate cap is inherited onto another URL.
- Public-address/DNS/socket pin/TLS/timeout/no-auth checks and the existing
  source identity verifier ordering are unchanged.
- No raw source body or digest is logged, committed or added to evidence.

## Deliberate boundaries

- No real source/profile registration, accepted Evidence/Rule, F8, hosted write,
  public requirements result, UI, Trip Workspace, provider or product contract
  change.
- No live primary-source request was made. Page-wide identity/privacy/legal
  proof remains missing; source status is `SOURCE_NOT_QUALIFIED`.
- `evidenceQuellenFingerprint` remains unchanged and does not accept snapshots
  above its existing size limit. The larger retrieval result does not itself
  create Evidence.
- Per-request byte buffers and subsequent decoded/hash/result copies are
  bounded by the selected maximum. A conservative accounting estimates about
  917,504 bytes (<1 MiB) of reader-controlled transient memory at 131,072 bytes,
  excluding the current transport chunk, runtime/object overhead, GC retention
  and verifier allocations. Hashing and verification are O(bytes); concurrent
  near-limit requests can multiply CPU and memory. The existing 10-second timeout
  remains; no public route or retry loop was added.

## Review status

This is an author self-review only. Exact-head CI/Preview and independent
Technical Lead review remain separate gates. Any failed check or review finding
must be recorded and corrected on the same Draft branch before handoff.
