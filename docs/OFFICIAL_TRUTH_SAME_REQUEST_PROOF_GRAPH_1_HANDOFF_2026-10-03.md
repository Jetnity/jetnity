# Official Truth Same-Request Proof Graph 1 — Handoff

Date: 3 October 2026
Issue: #772
Draft PR: #774
Branch: `fix/official-truth-same-request-proof-graph-1`
Baseline: `main@2e38aae0f616f06e661c32e4f1bfa336eb0613ec`
Logical agent: **Jetnity Official Truth same-request proof graph 1**
Generation: **1**
Session: https://cursor.com/agents/bc-d467fc77-c329-4bac-a218-2db64a02999c
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Read `docs/OFFICIAL_TRUTH_SAME_REQUEST_PROOF_GRAPH_1_REPORT_2026-10-03.md` and then this handoff. The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md` was not edited because the task forbids global current-state files. This handoff is the continuity record.

## Current state

The review head is the branch tip after the main integration. Re-fetch before review. The first implementation commit is `14c9138085e19446d6bfe5e647dd7de47407022d`. The Technical Lead reviewed `9869062622554b355d6d8e26bd89350608b3090c` and required changes. The remediation implementation commit is `a0466832153ba90d801358746c9b1cd4d4cf1b0d`. None of those SHAs is the new review head.

At the remediation fetch, `origin/main` was still `a7ad77743327c01821cf2532ca253a3220c857e8`. Main then advanced to `2e38aae0f616f06e661c32e4f1bfa336eb0613ec` through merged PR #775. This branch merges that main and is 0 behind it. The R1/R2 bytes are unchanged. Do not treat a later SHA as current without fetching.

Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.

## Contract the next reader must keep

`loadOfficialTruthSameRequestProof(eingabe)` is the live internal graph. `loadOfficialTruthAutonomousPreacceptanceWitness(eingabe)` is still the only live public witness, and it projects nine fields from that graph.

The caller supplies registry-free review material. The graph calls `loadOfficialTruthFactEntryAuthority()` and continues only for the exact authorized role grant. It then takes one server clock reading and calls `officialTruthServerHeldSameRequestMaterial` with that instant and no caller catalog override.

That material function loads the catalog once. It injects the registry, keeps the accepted Evidence versions, rebuilds the candidate from those versions, and checks the #723 packet against the #726 `review-packet:v2:` fingerprint. Caller `uhr` is not executed. Support identity is a canonical set, so caller order is not part of the key. Every support must be `current` under existing `officialFrische` at that same instant.

The graph may retain the registry, the full accepted Evidence versions, the rebuilt candidate, the review key, the scope, the fact kind, the evidence quality, the sorted support ids, the narrow provenance supports, the server instant, freshness `current`, and the role echo. Those retained objects are a deep-frozen copy. The narrow support is `versionId`, `sourceId`, `canonicalUrl`, `retrievedAt`, `sourceContentHash`, `validFrom`, and `validUntil`. It does not include `sourceSnapshot`. The candidate's `proposal` stays untrusted review material. Do not copy it into `trustedRuleFact`. The graph is not a bearer capability, not a JSON response, and not Official Truth. A later request must call the live entry again.

Current snapshot bytes are registry-checked submitted/retrieval material. They are not proof of a server-owned HTTP response. `sourceContentHash` proves the identity of those submitted bytes. It does not prove the authenticity of the government page. A separate server-owned official retrieval/fetch boundary is mandatory before any deterministic extractor or F8 autonomous truth path may read page content. Do not implement that fetch inside this slice. The human-review packet may keep its historical review snapshot. Do not copy that snapshot onto the graph, the material result, the reproof, or the witness.

`officialTruthServerHeldReviewReproof` is the stripped projection of the same material. Do not put registry, Evidence versions, the candidate, or page text back onto that public reproof or onto the witness.

`decideOfficialTruthSameRequestProof` is the test seam. A route that calls the seam, returns the graph, or calls `regelKandidatAkzeptieren` from this graph reopens the boundary. A future F8 module may read the graph only inside the same server invocation. That module is not authorized by this slice.

## Files

- `lib/readiness/official-truth-same-request-proof-server.ts`
- `lib/readiness/official-truth-same-request-proof-server.test.ts`
- `lib/readiness/official-truth-server-held-source-registry.ts`
- `lib/readiness/official-truth-server-held-source-registry.test.ts`
- `lib/readiness/official-truth-rule-review-packet.ts` — retention seam only; the public packet result is unchanged
- `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts` — nine-field projection
- `lib/readiness/official-truth-autonomous-preacceptance-witness-server.test.ts`

## What is not authorized

No Ready. No merge. No follow-up slice. Do not start F8. Do not call `regelKandidatAkzeptieren`. Do not call either store writer. Do not add an endpoint. Do not fetch the official page in this slice. Do not apply the catalog or the store. Do not touch #626. Do not select a provider. `requirementsProviderAus()` stays `null`. There is still no authorized `trustedRuleFact` source. Do not treat the graph as extractor-ready legal text.

## Validation already recorded

Remediation gates, before the remediation commits, with `origin/main` still `a7ad77743327c01821cf2532ca253a3220c857e8`: graph tests 12/12; witness tests 15/15; registry tests 11/11; packet tests 12/12; fingerprint tests 11/11; `npm test` 4489 pass / 0 fail / 764 suites; typecheck pass; lint 0 errors and 148 pre-existing warnings; production build pass on Next.js 16.3.8 with 25 static pages; hygiene checks pass; operating-mode guard PASS. Local PostgreSQL 16 ran the existing throwaway proofs. No remote database was contacted. Exact-head CI and Vercel belong to the pushed tip, not to this text.

## Next step

Independent main-chat Technical-Lead review of the exact branch tip. Cursor does not Ready or merge.
