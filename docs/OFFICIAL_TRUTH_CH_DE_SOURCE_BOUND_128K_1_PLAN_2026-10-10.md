# CH→DE Source-Bound 128 KiB Retrieval 1 — Plan

Task: immutable `OFFICIAL_TRUTH_CH_DE_SOURCE_BOUND_128K_1_TASK_2026-10-10.md`,
blob `6116b7a90afdcbddc6a46052834a775c19295d47`, SB01–SB31.
Branch: `feat/official-truth-ch-de-128k-representation-1`, existing Draft PR #920.

## Goal

Allow an inclusive 131,072-byte GET body limit only for the code-owned exact
Bern representation candidate, while retaining the exact 65,536-byte default
for every other representation, including GOV.UK. This is transport engineering
only; it must not register a real source, approve its identity/privacy/legal
profile, create Evidence or Rule, or enable a public result.

## Baseline and scope

- Starting author head: `49b3c6551c251185a8dbaf4a63d8d1fdf73e4500`; exact
  immutable task blob above; live `main` was `0c19d79021d1869175f4a2c29013d7af95b27149`.
- Operating mode: NORMAL. Existing PR #920 was Draft. The only prior change was
  the binding task file; the paused Codex writer's unpublished workspace was not
  accessed.
- The relevant server retrieval, content-identity profile registry, source
  catalog parser, source router, existing retrieval tests and #918 handoff were
  inspected. The current code identity profile registry contains only GOV.UK.
- No DB schema, migration, Auth/RLS, provider, UI, API route, CI workflow,
  package, secret, hosted environment or unrelated shared contract is in scope.

## Implementation sequence

1. Pin the S3 URL, source/item/representation/profile identifiers, versions and
   `text/html` in an immutable candidate policy. Require a current item and
   representation and exact request/final URL/media matches on each response
   hop. Return to 65,536 bytes for every mismatch.
2. Keep the catalog/profile verification and source-class/URL checks before
   DNS/HTTP. Do not add the candidate profile to the production identity
   registry; without its separately registered profile the live path must fail
   before network access.
3. Use the selected limit for GET `Content-Length` and bounded actual-byte
   accumulation. Do not use HEAD as a trust or body-size decision.
4. Require absent or single `identity` content encoding, strict UTF-8 without a
   leading BOM, and valid UTF-8 charset when declared. Preserve TLS, HTTPS/443,
   DNS/public-address validation, socket pinning, redirect, timeout, media and
   no-credentials controls.
5. Add synthetic exact-boundary, spoofing, encoding, media, redirect, cancellation
   and quarantined-verifier tests. No live government body or legal claim is
   fixture data.
6. Publish six task-scoped documents and a sanitized synthetic evidence manifest.
7. Run focused and full tests, typecheck, lint, build, setup/security/hygiene and
   native PostgreSQL semantic/R3/structural checks where supported. Record every
   unavailable/blocked check accurately; secret-scan before each commit.
8. Recheck mode, live main, task blob, branch, Draft state, blockers and competing
   writers. Commit only on this branch, leave Draft, then stop for independent
   Technical Lead exact-head review.

## Risks and limits

- The measured S3 size in the preceding research was a one-time observation, not
  a permanent size guarantee. Future growth above 131,072 bytes must refuse.
- No S3 source-identity, whole-page privacy or legal-effect proof is available in
  this implementation. It must remain `SOURCE_NOT_QUALIFIED`.
- The 128 KiB body path computes the same normalized SHA-256 for its volatile
  retrieval object, but the existing Evidence fingerprint still rejects bodies
  above its 65,536-character contract. No accepted Evidence/Rule is introduced.
- Each request uses at most a 131,072-byte accumulation buffer plus a bounded
  copy for the returned bytes. Conservatively budgeting the byte buffers, UTF-16
  text, normalized hash input, SHA-256 encoder/padding bytes and immutable result
  clone gives approximately 7×131,072 = 917,504 bytes (<1 MiB) of
  reader-controlled transient memory per in-flight request, excluding the
  currently yielded transport chunk, runtime/object overhead, GC retention and
  verifier allocations. Oversized chunks are checked before copying. Concurrent
  requests multiply this per-request amount; this slice adds no new public route
  or concurrency mechanism. Hashing and identity verification are O(response
  bytes), so concurrent near-limit responses can also multiply CPU work; the
  existing 10-second timeout remains the only per-request execution bound here.
- No new recurring cost is introduced; no paid service or dependency is added.

## Validation targets

- Existing default GOV.UK and retrieval regression tests remain unchanged in
  behavior.
- 65,535 / 65,536 bytes pass the default path; 65,537 refuses.
- Exact candidate 131,071 / 131,072 bytes pass transport; 131,073 refuses by
  declared length or actual streaming. Identity-verifier refusal remains refusal
  at an in-limit size.
- Full `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, all
  documented setup/security/hygiene scripts, `git diff --check`, and final
  exact-head GitHub checks are recorded in REPORT and HANDOFF.
