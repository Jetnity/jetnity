# Official Truth Same-Request Retrieval-to-Extractor Binding 1 — Handoff

Date: 3 October 2026
Issue: #782
Draft PR: #783
Branch: `feat/official-truth-same-request-extraction-binding-1`
Baseline: `main@5a7634d01fd4941a390b8844699c24813d114f6f`
Logical agent: **Jetnity Official Truth same-request retrieval-to-extractor binding 1**
Generation: **1**
Session: https://cursor.com/agents/bc-cd1db2ef-5a0e-4ce6-af5b-f4ff6800c295
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Read `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_REPORT_2026-10-03.md` and then this handoff. The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md` was not edited because the task forbids global current-state files. This handoff is the continuity record.

## Current state

The review head is the branch tip after the documentation commit. Re-fetch before review. The implementation commit is `07f964aad275258e5e50580376e07d03232b13f2`. That SHA does not contain this handoff.

At delivery, `origin/main` is `5a7634d01fd4941a390b8844699c24813d114f6f`. This branch is 0 behind it. Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.

## Contract the next reader must keep

`loadOfficialTruthSameRequestTrustedFactExtraction(eingabe)` is one server invocation.

The caller supplies only the registry-free research envelope already consumed by `loadOfficialTruthSameRequestProof`. The composition calls that live proof path. It does not accept a caller proof, registry, Evidence version, retrieval receipt, page bytes, content hash, clock, fact, extractor id, or policy.

After `status === 'same_request_proof'`, role grant `official-truth-freigeben`, and freshness `current`:

- `composed_from_multiple_primary_sources` returns `composition_policy_unavailable` before any HTTP call. There is no server-held composition policy to consult. Do not invent one here and do not accept a caller policy.
- `explicit_primary_statement` is the only quality that continues. The extractor input policy is `null`.
- A proof registry with a non-empty `blockedDomains` list returns `blocked_domain_not_replayable` before HTTP. Do not drop those domains to fit the current catalog RPC.
- Otherwise each proof support is re-fetched through `loadOfficialTruthServerOwnedRetrievalWithCatalogTransport`. The transport replays only the frozen proof registry and only answers `read_registry`. Repeated replay is not a second external catalog read. The proof path remains the one external catalog read.
- Source id, final canonical URL, and `sourceContentHash` must match the accepted proof support, and exactly one accepted Evidence version must match that version id, source id, URL, hash, and scope. A mismatch stops before extraction. It does not refresh Evidence, clear staleness, or build a new candidate.
- Only then does the live entry call `officialTruthTrustedFactExtrahieren`. The production registry is empty. A well-formed single explicit-primary support currently ends as `extractor_not_registered`.

The retrieval helper keeps the existing server clock, DNS resolver, and HTTPS client. The public retrieval entry stays free of a catalog argument. Only this composition module may import the helper outside the retrieval tests.

Success, when a test supplies a synthetic extractor, is `same_request_trusted_fact_material`. It is internal, deeply frozen, and has no raw page snapshot. It is not Official Truth.

`decideOfficialTruthSameRequestTrustedFactExtraction` is the test seam. A route that calls the seam, returns the material, or calls `regelKandidatAkzeptieren` from this module reopens the boundary.

## Files

- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`
- `lib/readiness/official-truth-server-owned-retrieval.ts` — catalog-transport live helper only
- `lib/readiness/official-truth-server-owned-retrieval.test.ts` — helper source and caller-registry assertion

## What is not authorized

No Ready. No merge. No follow-up slice. Do not register a real extractor. Do not start F8. Do not call `regelKandidatAkzeptieren`. Do not call either store writer. Do not add an endpoint. Do not apply the catalog or the store. Do not touch #626. Do not select a provider. Do not add a composition policy in a drive-by edit.

## Validation already recorded

Binding tests 16/16. Retrieval tests 26/26. `npm test` 4571 pass / 0 fail / 767 suites after local PostgreSQL 16.15 was installed for the two existing throwaway proofs. `policy-rc.d` denied the service start. Those proofs used temporary clusters. No remote database. Nothing applied. Typecheck pass. Lint 0 errors and 148 pre-existing warnings. Production build pass on Next.js 16.3.8 with 25 static pages. Hygiene checks pass. Exact-head CI and Vercel belong to the pushed tip, not to this text.

## Next step

Independent main-chat Technical-Lead review of the exact branch tip. Cursor does not Ready or merge.
