# Official Truth Same-Request Proof Graph 1 — Report

Date: 3 October 2026
Issue: #772
Draft PR: #774
Branch: `fix/official-truth-same-request-proof-graph-1`
Baseline: `main@2e38aae0f616f06e661c32e4f1bfa336eb0613ec`
First implementation commit: `14c9138085e19446d6bfe5e647dd7de47407022d`
Reviewed head that required changes: `9869062622554b355d6d8e26bd89350608b3090c`
Remediation implementation commit: `a0466832153ba90d801358746c9b1cd4d4cf1b0d`
Logical agent: **Jetnity Official Truth same-request proof graph 1**
Generation: **1**
Session: https://cursor.com/agents/bc-d467fc77-c329-4bac-a218-2db64a02999c
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge. The review head is the branch tip after the main integration. Re-fetch before review. `98690626` is the head the Technical Lead reviewed. It is not the new tip.

## Main integration

`origin/main` moved to `2e38aae0f616f06e661c32e4f1bfa336eb0613ec` when PR #775 merged. That merge is architecture documentation only. This branch now contains that main and remains 0 behind it. The R1/R2 code and the remediation commits `a0466832` and `afa1d9ff` are unchanged. #775 agrees that a caller `sourceSnapshot` is not content authority and that a server-owned retrieval slice is still future work. This publication recovery does not implement that fetch.

## Result

The server-only same-request proof graph is the internal superset. The public F7 witness is a projection of that graph. One successful graph is one authority read, one server clock snapshot, and one source-catalog read.

`loadOfficialTruthSameRequestProof(eingabe)` in `lib/readiness/official-truth-same-request-proof-server.ts` is the live graph entry. It accepts the same registry-free review material as the witness. Authority comes only from `loadOfficialTruthFactEntryAuthority()`. The graph continues only for exactly `{ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }`.

`officialTruthServerHeldSameRequestMaterial` loads the catalog once, injects that registry, and rebuilds accepted Evidence versions, the Rule candidate, the #723 packet supports, and the #726 `review-packet:v2:` fingerprint from that same reconstructed input. The validation clock is the snapshotted server instant. Caller `bund.uhr` is not executed. `officialTruthServerHeldReviewReproof` projects the narrower freshness supports from that material. It still returns no registry, no Evidence version, no candidate, and no page text.

The graph keeps, only in memory, as a deep-frozen copy:

- the registry from that one catalog read
- the full accepted `EvidenceVersion` objects from that reconstruction
- the Rule candidate rebuilt from those versions and the same metadata
- `reviewPacketKey`, `ruleScopeKey`, `factKind`, `evidenceQuality`, and the sorted support ids
- a narrow support projection: `versionId`, `sourceId`, `canonicalUrl`, `retrievedAt`, `sourceContentHash`, `validFrom`, `validUntil`
- `serverReferenceTime`
- freshness exactly `current`
- the role/capability echo `grant: 'role'` and `official-truth-freigeben`

The graph and `OfficialTruthServerHeldSameRequestMaterialErgebnis` do not retain `sourceSnapshot`. The existing human-review packet may still carry that historical review snapshot. This slice does not broaden that packet.

The candidate may still carry its existing untrusted `proposal`. That field is review material. The graph has no `trustedRuleFact` field and does not copy the proposal into one.

`loadOfficialTruthAutonomousPreacceptanceWitness(eingabe)` still returns exactly the nine F7 fields: `status`, `reviewPacketKey`, `ruleScopeKey`, `factKind`, `supportVersionIds`, `serverReferenceTime`, `freshness`, `grant`, `capability`. It calls the live graph and drops everything else. Fail-closed order is unchanged: forbidden caller fields, then authority, then the server clock, then one catalog read, then quality and freshness. Denied authority, break-glass, lookup failure, and an invalid server clock do not read the catalog.

`decideOfficialTruthSameRequestProof` and `decideOfficialTruthAutonomousPreacceptanceWitness` are test seams. They are not live entries.

## Why the witness projects from the graph

The public witness file could have stayed byte-for-byte and a second function could have repeated its policy. That would be a second freshness and authority policy. The graph is therefore the only place that reads authority, the clock, the catalog, and `officialFrische`. The witness copies nine fields out of a successful graph and copies the blocked reason otherwise. The public witness type did not gain registry, Evidence, candidate, page text, proposal, or a trusted fact.

The packet file changed only so the server-held boundary can keep the Evidence versions that the packet builder already creates. `officialTruthRegelReviewPacket` still returns `status`, `kandidat`, and `supports`. `officialTruthRegelReviewBelege` is the server retention seam.

## What the boundary does

1. Denied, lookup-failed, database-capability, and break-glass results return before any catalog read.
2. Caller role, grant, capability, reviewer, user, email, AAL, clock, `maxAgeMs`, freshness, witness, review key, support ids, Evidence, candidate, and trusted fact are rejected before authority and before the catalog read.
3. Caller `registry`, `sourceClass`, `domains`, and `blockedDomains` stay `caller_authority_forbidden` before the catalog read.
4. A supplied graph object is not authority. Replaying a successful graph does not read authority, the clock, or the catalog.
5. One successful graph performs one `read_registry`. A transport that would change the authority name on a second read is not called again. The retained registry is the first response.
6. Retrieval validation and freshness use the same server instant. Caller `uhr` is not executed. The existing one-hour ceiling stays in `officialFrische`. No caller `maxAgeMs` and no new TTL.
7. The age boundary, an older retrieval, a future `validFrom`, and an elapsed `validUntil` are `freshness_not_current`. A future `retrievedAt` against the server instant is `retrieved_at_in_future`.
8. Accepted Evidence version ids, packet support ids, fingerprint support ids, and the rebuilt candidate's support ids are the same canonical set. Reversed caller order keeps one key and the same sorted ids.
9. `research_gap`, `stale_primary_evidence`, and `unresolved_conflict` are `quality_not_acceptable`. A personal identifier does not become a successful graph.
10. The witness success object still has exactly nine fields and does not contain page text, proposal, registry, Evidence versions, or candidate.
11. The graph module does not import or call `regelKandidatAkzeptieren`, either store writer, suggestion output, or decision intent. No `app/` file imports the graph, the witness, or the material seam. The graph module does not stringify itself. This slice adds no route, no store writer, no acceptance call, and no network fetch.

## Submitted bytes are not a server-owned page

Technical-Lead review of `98690626` blocked merge because the graph treated raw `sourceSnapshot` as material a later deterministic extractor could read.

`officialTruthAbgerufenMaterialPruefen()` still accepts caller material `{ canonicalUrl, retrievedAt, sourceSnapshot }`. It performs no network fetch. `sourceContentHash` is `evidenceQuellenFingerprint` of those submitted bytes. A valid allowlisted official URL plus fabricated text can therefore still be structurally re-proved: the hash, the accepted Evidence identity, and the human-review packet stay internally consistent.

That is registry-checked submitted/retrieval material. It is not proof of a server-owned HTTP response. `sourceContentHash` proves the identity of those submitted bytes. It does not prove the authenticity of the government page.

The same-request graph and the server-held material result now expose only the narrow provenance projection. They do not expose those bytes as extractor input. The public F7 witness remains the same nine fields.

A separate server-owned official retrieval/fetch boundary is mandatory before any deterministic extractor or F8 autonomous truth path may read page content. This slice does not implement that fetch.

## Immutability

The returned graph and the returned material result are `structuredClone` copies, then deep-frozen, including nested registry domains, Evidence scope and citizenship arrays, the candidate scope and proposal, and the narrow supports. A caller can still mutate the proposal object they passed in. That mutation does not change the frozen proof. The human-review packet is a separate historical object and is not this frozen graph.

## Out of scope, unchanged

Not changed, and not claimed as fixed:

- F8 and any call to `regelKandidatAkzeptieren`
- a deterministic trusted-fact extractor
- a server-owned HTTP fetch of the official page
- store writers and store transport
- routes, Auth, AAL, roles, RLS, or capabilities
- migrations, Development apply, or Production apply
- #626
- provider selection, model calls, secrets, or cost

`check:schema-bezug` still lists four pre-existing LOCAL/UNAPPLIED RPCs: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, and `official_truth_store_accepted_v1`. This slice adds none.

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task forbids global current-state files. This report and the handoff are the continuity record.

## Validation

Remediation gates were re-run on the working tree before the remediation commits, with `origin/main` at `a7ad77743327c01821cf2532ca253a3220c857e8`. Merge-base was that same SHA. The reviewed head `98690626` was 3 ahead and 0 behind. The remediation implementation commit is `a0466832153ba90d801358746c9b1cd4d4cf1b0d`. It is not the review head. Re-fetch before treating a later SHA as current.

- Graph file: 12 tests, 12 pass, 0 fail. The two new tests are the fabricated-snapshot proof and the nested mutation proof.
- Witness file: 15 tests, 15 pass, 0 fail.
- Server-held registry file: 11 tests, 11 pass, 0 fail.
- Packet file: 12 tests, 12 pass, 0 fail.
- Fingerprint file: 11 tests, 11 pass, 0 fail.
- `npm test`: 4489 pass, 0 fail, 764 suites. The two throwaway PostgreSQL proofs ran on local PostgreSQL 16. No remote database was contacted.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
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

Cursor does not Ready or merge and does not start F8 or another slice.
