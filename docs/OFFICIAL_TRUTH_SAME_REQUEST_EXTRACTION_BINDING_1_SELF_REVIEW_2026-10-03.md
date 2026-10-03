# Official Truth Same-Request Retrieval-to-Extractor Binding 1 — Self-Review

Date: 3 October 2026
Issue: #782
Draft PR: #783
Branch: `feat/official-truth-same-request-extraction-binding-1`
Implementation commit: `07f964aad275258e5e50580376e07d03232b13f2`
Logical agent: **Jetnity Official Truth same-request retrieval-to-extractor binding 1**
Generation: **1**
Session: https://cursor.com/agents/bc-cd1db2ef-5a0e-4ce6-af5b-f4ff6800c295
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Author self-review only. This is not an independent Technical-Lead PASS. The review head is the branch tip that contains this file. Re-fetch it. `07f964aa` is the implementation commit and is not the review head.

## What I checked against the task

| Requirement | Result |
| --- | --- |
| One live server invocation | `loadOfficialTruthSameRequestTrustedFactExtraction` takes one argument and wires the real proof, the catalog-transport retrieval helper, and `officialTruthTrustedFactExtrahieren`. |
| Existing proof graph is canonical | The live entry calls `loadOfficialTruthSameRequestProof`. No second graph is built. |
| One external catalog read | The proof path owns it. Retrieval receives only the in-memory replay. Tests with two supports keep the external transport at one `read_registry`, including a transport that would drift on a second read. |
| Retrieval identity before extraction | Source id, final URL, and content hash are compared with the proof support. Evidence must match once on version, source, URL, hash, and scope. |
| `explicit_primary_statement` only, null policy | Composed quality returns `composition_policy_unavailable` before HTTP. The extractor input policy is the literal `null`. |
| Empty production registry | The registry constant is not edited. The live entry does not call `officialTruthTrustedFactExtrahierenMitDefinitionen`. A single-support live shape ends as `extractor_not_registered`. |
| No parser, acceptance, store, route, migration, provider, #626, CH import, or F8 | Source assertions and the diff. No `app/` import. |
| Fake DNS, HTTP, and catalog | Tests inject them. No live internet. |

## Findings I am not hiding

1. The test seam can inject a proof loader, a retrieval function, and an extractor. That is how the success path and the mismatch paths are proven without a real extractor and without live HTTP. The live entry cannot. A route that imports `decideOfficialTruthSameRequestTrustedFactExtraction` would bypass that. No route does. A later review should keep the seam off `app/`.

2. Evidence-version mismatch is checked after that support's fresh retrieval, because the task orders retrieval and then the Evidence bind. A test-injected proof with a rewritten version id therefore performs one HTTP read and then returns `support_binding_mismatch` without calling the extractor. The live path cannot build that lie: it uses the real proof, which already requires accepted Evidence. The post-fetch check is a second confirmation, not a second catalog read. I did not move the check before HTTP, because that would hide the ordered bind the task asked to prove.

3. An explicit-primary proof with two supports is legal in the existing candidate builder. This composition retrieves both, replays one registry, and then calls the extractor with `policy: null`. The framework rejects that shape as `ambiguous_structure` before `extractor_not_registered`. That is fail-closed. It is not a second policy and not acceptance. Composed quality never reaches this point.

4. A retrieval object whose status is `retrieved_material` is rejected as `representation_not_eligible` before extraction. The structural status `server_owned_official_retrieval` is still not a cryptographic attestation that the bytes came from the live helper. The live entry is the path that actually calls that helper. The test seam can return a copied success shape. I am not adding a MAC. The production registry is empty, so a copied shape still cannot become a registered fact through the live extractor.

5. `blockedDomains` cannot be replayed through today's catalog contract. The composition fails closed. If a later catalog RPC starts returning blocked domains, this replay must learn that payload or it will keep rejecting every such proof before HTTP. Dropping the list would be the wrong fix.

6. There is still no server-held composition policy. I did not add one. Composed official truth cannot be extracted by this entry. That is the next product gap, and it is a separate slice. It needs a code-owned policy source, not a caller field.

7. No route calls the entry, so merge does not spend an outbound fetch. The retrieval helper still has the #777 body, timeout, and redirect caps, and it has no quota of its own. A future route needs its own auth, ownership, and rate limit before anyone wires this function up. That is not this slice.

8. Local PostgreSQL 16.15 was installed so the two pre-existing throwaway catalog and store proofs could run `initdb`. `policy-rc.d` denied the service start. Those proofs used temporary clusters. No remote database was contacted and nothing was applied. The four LOCAL/UNAPPLIED RPCs are unchanged. `docs/ACTIVE_WORK_STATUS.md` is stale relative to this writer. The task forbids that edit.

## Validation

Binding tests 16/16. Retrieval tests 26/26. `npm test` 4571 pass / 0 fail / 767 suites. Typecheck pass. Lint 0 errors and 148 pre-existing warnings. Production build pass on Next.js 16.3.8 with 25 static pages. Operating-mode and hygiene gates pass. `origin/main` `5a7634d01fd4941a390b8844699c24813d114f6f`, 0 behind.

## Stop

No Ready. No merge. No source-specific extractor follow-up. The next step is independent Technical-Lead review of the exact branch tip.
