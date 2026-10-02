# Official Truth Same-Request Proof Graph 1 — Self Review

Date: 3 October 2026
Issue: #772
Draft PR: #774
Branch: `fix/official-truth-same-request-proof-graph-1`
Implementation reviewed locally: `14c9138085e19446d6bfe5e647dd7de47407022d`
Logical agent: **Jetnity Official Truth same-request proof graph 1**
Generation: **1**
Session: https://cursor.com/agents/bc-d467fc77-c329-4bac-a218-2db64a02999c
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not an independent Technical-Lead PASS. The review head is the branch tip after the documentation commit.

## Scope check

| Binding | Result |
| --- | --- |
| Internal same-request graph only | Held. No F8 acceptance path and no trusted-fact extractor. |
| One authority read, one server clock, one catalog read | Held. Denied authority and an invalid clock do not read the catalog. The success test counts one `read_registry`. |
| Retain registry, accepted Evidence, rebuilt candidate, #723/#726 identity, snapshots, freshness | Held on the graph object only. |
| Public F7 witness stays nine fields | Held by projection. Witness tests 15/15 still pass. |
| Caller clock, registry, Evidence, candidate, witness, and trusted fact are not authority | Held. Replaying a successful graph reads nothing. |
| No acceptance, store, route, migration, Auth, #626, provider, or cost | Held by source assertions and the diff. |

## Findings I am not hiding

1. `officialFrische` still receives `hasProvider: true` and `sourceAvailable: true` inside the graph. That does not call `requirementsProviderAus()` and does not select a provider. It exists so the existing helper applies the time ceiling instead of returning `provider_unavailable`. `requirementsProviderAus()` stays `null`.
2. The public witness implementation was not left byte-for-byte untouched. A second copy of the authority, clock, catalog, and freshness policy would be a second policy. The witness now projects the nine fields from the graph. The public return type is unchanged.
3. `officialTruthServerHeldSameRequestMaterial` is exported from the server-only registry module. The public reproof and the graph both use it, so they cannot drift into two catalog policies. It is not a route response. No `app/` file imports it. A later route that returned this object, or the graph, would expose registry, Evidence, the candidate, and snapshots. That would reopen the boundary.
4. `officialTruthRegelReviewBelege` is exported from the packet module so the server-held boundary can keep the Evidence versions the builder already created. The public `officialTruthRegelReviewPacket` result is still only `status`, `kandidat`, and `supports`. The packet file does not import `evidence.ts`, the store, or `regelKandidatAkzeptieren`.
5. The #726 fingerprint still rebuilds the pure packet from the same in-memory reconstructed input. That is the existing identity check. It is not a second catalog read. The graph then rebuilds the candidate again with `officialTruthRegelKandidatAusEvidence` from the retained Evidence versions and blocks if that cell does not match. Neither call is acceptance.
6. The retained candidate still carries `proposal`. The graph does not treat it as a trusted fact and does not put it on the witness. A later F8 writer must not copy it into `trustedRuleFact`. No such writer exists in this slice. The missing fact source from #771 is still missing.
7. Descriptor objects may still carry `sourceClass` and `domains`. That is the merged retrieval shape. Those keys are rejected when they are caller authority on the envelope, request, material, metadata, extraction, or dependency. The injected catalog remains the registry.
8. The live loaders are not executed against a real session. Tests use the seams. The source tests lock that each live function passes no catalog override and that the graph live function calls `loadOfficialTruthFactEntryAuthority()`.
9. The forbidden-key walker fails closed past depth 16 and does not invoke functions, so a bundle `uhr` is not executed during the scan. A forbidden key buried deeper than that becomes `unexpected_fields`, which is still not a graph.
10. Eligible quality is read after the catalog read. Unauthorized input, forbidden graph fields, and an invalid server clock do not read the catalog. A valid server clock with a future `retrievedAt` does read the catalog once and then blocks.
11. `docs/ACTIVE_WORK_STATUS.md` was not edited. The task allowlist does not include it.

## Validation seen on the implementation commit

Graph 10/10. Witness 15/15. Registry 11/11. Packet 12/12. Fingerprint 11/11. `npm test` 4487/4487 across 764 suites. Typecheck pass. Lint 0 errors and 148 pre-existing warnings. Build pass on Next.js 16.3.8 with 25 static pages. Hygiene checks pass. `git diff --check` pass. No remote database. Local PostgreSQL 16 ran the existing throwaway catalog and store proofs. Nothing was applied. These gates are on `14c91380`, before the documentation commit.

## Stop

Cursor does not Ready or merge and does not start F8 or another slice.
