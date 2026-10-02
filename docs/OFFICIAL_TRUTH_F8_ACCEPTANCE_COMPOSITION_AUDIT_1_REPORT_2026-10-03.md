# Official Truth F8 Canonical Acceptance Composition Audit 1 — Report

Date: 3 October 2026
Issue: #768
Draft PR: #770
Branch: `docs/official-truth-f8-acceptance-composition-audit-1`
Baseline: `main@6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`
Task seed: `b397657c239a1211219feecff74e850b099d0252` is not the review head.
Logical agent: **Jetnity Official Truth F8 canonical acceptance composition audit 1**
Generation: **1**
Session: https://cursor.com/agents/bc-b02dc231-a456-4aaf-9d1c-6d5e3e3b1959
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge. It does not implement F8.

## Classification

**BLOCKED_BY_MISSING_TRUTH_SOURCE**

A later F8 runtime slice must not be dispatched from this audit.

`regelKandidatAkzeptieren` remains the only canonical Rule acceptance function. The public F7 witness and the public re-proof do not carry the four objects that function requires. A same-request proof graph is a necessary later prerequisite, and it is not F8. That graph still has no authorized `trustedRuleFact`. Accepted Evidence carries no rule fact. The research `proposal` is not that fact. Copying it into `trustedRuleFact` is accepted by the current function and is forbidden. No current function emits a deterministic non-model `RegelFakt` from re-proved primary material. The binding architecture does not authorize that policy and does not name a case where it would pass.

This is not a Product-Owner gate on Production activation. Production store apply stays separately gated and is not the acceptance boundary. It is not a reason to call `akzeptierteRegelClaimSpeichern`.

## What was proved

Live `origin/main` at fetch was `6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`, message `Merge #767: add autonomous Official Truth freshness authority witness`. Merge-base was that SHA. This branch was 1 ahead and 0 behind before the audit documents. The ahead commit is the Technical-Lead task seed.

A throwaway script at `/tmp/f8-composition-repro.mjs` ran:

`node --import ./scripts/server-only-test-register.mjs --import tsx /tmp/f8-composition-repro.mjs`

Exit 0. No network. No Supabase client. Synthetic `*.example` sources only. The script is not part of the branch. Stdout:

```json
{
  "callerRegistryAcceptedWithoutWitness": true,
  "acceptedFact": {
    "kind": "requirement_effect",
    "effect": "not_required",
    "visaMode": "visa_exempt"
  },
  "acceptedFactEqualsTrusted": true,
  "acceptedFactEqualsProposal": false,
  "claimContainsProposalVisaMode": false,
  "witnessFieldOnAcceptance": "unexpected_fields",
  "reproofSupportShapeAsEvidence": "evidence_not_accepted",
  "forgedWitnessAsTrustedFact": "invalid_fact_kind",
  "explicitProposalPassedAsTrustedFact": {
    "kind": "requirement_effect",
    "effect": "required",
    "visaMode": "electronic_visa"
  },
  "witnessStatus": "authorized_preacceptance_witness",
  "witnessKeys": [
    "capability",
    "factKind",
    "freshness",
    "grant",
    "reviewPacketKey",
    "ruleScopeKey",
    "serverReferenceTime",
    "status",
    "supportVersionIds"
  ],
  "witnessContainsRegistry": false,
  "witnessContainsProposal": false,
  "witnessContainsTrustedFact": false,
  "catalogReadsAfterWitness": 1,
  "catalogReadsAfterSecondPacket": 2,
  "secondPacketStatus": "blocked",
  "secondPacketReason": "invalid_source_plan"
}
```

The visa values in that probe are fixtures. They are not an official visa, transit, health, carrier, eligibility, or document rule.

The witness input used a caller clock of `2099-01-01`. The witness still returned `authorized_preacceptance_witness` at the injected server instant `2026-10-01T12:00:00.000Z`. That matches the merged F7 contract: `officialTruthServerHeldReviewReproof` does not execute `bund.uhr`.

The second catalog read changed `authority_name` for the same source id. The witness object from the first read stayed successful. The separate `officialTruthServerHeldReviewPacket` call returned `blocked` / `invalid_source_plan`. One authorized witness and one later packet are not one proof.

## 1. Witness use

A later F8 function must not accept an `authorized_preacceptance_witness` supplied by a caller.

The success type is a plain frozen object. `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts`, lines 102–113, lists exactly nine fields: `status`, `reviewPacketKey`, `ruleScopeKey`, `factKind`, `supportVersionIds`, `serverReferenceTime`, `freshness`, `grant`, `capability`. There is no signature, no server-held witness id, and no registry. The module header, lines 10–12, says the success is ephemeral proof, not acceptance, not a bearer capability, and not Official Truth. A later request must call the live entry again. The architecture binding says a route that calls `regelKandidatAkzeptieren` from this witness reopens F7 (`docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`, autonomous witness section).

`loadOfficialTruthAutonomousPreacceptanceWitness` is the only live witness entry, lines 283–289. It passes the caller input to `decideOfficialTruthAutonomousPreacceptanceWitness` with `loadOfficialTruthFactEntryAuthority` and `serverUhr`. It does not accept a witness object as authority. Caller fields named `trustedRuleFact`, `reviewPacketKey`, `supportVersionIds`, `grant`, `clock`, `freshness`, `suggestion`, and `decision` are rejected before authority and before the catalog read, lines 49–84 and 165–171.

`regelKandidatAkzeptieren` does not read a witness. Its only keys are `kandidat`, `trustedRuleFact`, `evidenceVersions`, and `registry`, lines 829–834. The probe added a forged nine-field witness beside those keys and got `unexpected_fields`. The same four caller-controlled objects, with no witness at all, returned an accepted claim. A forged witness used as `trustedRuleFact` failed `invalid_fact_kind`. That failure is shape rejection. It is not a witness check.

F8 also must not treat a successful return of the live F7 entry as the acceptance argument. That return cannot supply the four required objects. The composition has to execute the F7 authority, one catalog read, re-proof, and freshness checks inside the same server invocation, and keep the non-public proof objects on that stack. Calling the public witness, discarding its body, and rebuilding the packet is a second catalog read. That is the split in section 4.

## 2. Exact acceptance material

`regelKandidatAkzeptieren` (`lib/readiness/rule-claims.ts`, lines 829–888) rebuilds the candidate, ignores `kandidat.proposal`, and builds `claim.fact` only from `trustedRuleFact`. The probe confirmed the claim fact equalled the separate trusted object and did not contain the proposal visa mode. The same function accepted when that proposal object was passed as `trustedRuleFact`. The function cannot see where the object came from.

| Argument | Only acceptable source on a future autonomous path | Forbidden caller substitutes |
| --- | --- | --- |
| `kandidat` | Rebuilt in that same server invocation from the re-proved scope, fact kind, evidence quality, and support version ids. `regelKandidatAkzeptieren` then runs `regelKandidatErstellen` again, line 837. | Request candidate; a stored packet; a witness; a suggestion; a fingerprint; a candidate whose support ids, scope, quality, or fact kind were not taken from that same proof. |
| `trustedRuleFact` | None exists. See the classification. It must not be invented by this audit. | `kandidat.proposal`; model or plugin output; suggestion output; decision intent; witness; review key; support-id list; page snapshot; `extractionNote`; a body field that copies the proposal; equality with the proposal treated as server confirmation. |
| `evidenceVersions` | The accepted `EvidenceVersion` objects produced by the same catalog read and the same retrieval reconstruction that built the packet. They must still pass `akzeptierteEvidenceLesen`. | Re-proof supports; witness `supportVersionIds`; client evidence; store rows read back as authority; hashes, version ids, lifecycle, or `lookupKey` supplied by the caller. |
| `registry` | The `QuellenRegistry` returned by that same `quellenKatalogLesen` / `registryLaden` call and injected into the reconstruction. | Any caller `registry`, `sourceClass`, `domains`, or `blockedDomains`; a second catalog read; a registry rebuilt from descriptors in the request. |

`registryLesen`, lines 322–326, accepts any plain object with `sources` and `blockedDomains` arrays. It does not compare those arrays to the catalog. The probe accepted a registry built by `quellenRegistryErstellen` in the script, with no catalog RPC. That is the F1 hole inside the pure acceptance function. F7 closed it only for the witness and server-held entries. F8 must not pass a caller registry into the pure function.

`akzeptierteEvidenceLesen` (`lib/readiness/evidence.ts`, lines 726–736) requires `lifecycle: 'accepted'`, `validationState: 'valid'`, a registry URL match, hash, retrieval time, and lookup key. An `OfficialTruthServerHeldReviewReproofSupport` has only `versionId`, `retrievedAt`, `sourceContentHash`, `validFrom`, and `validUntil`, lines 86–92 of the server-held registry module. The probe passed that shape as `evidenceVersions` and got `evidence_not_accepted`.

## 3. Registry and Evidence provenance

Current public F7 and re-proof APIs do not expose enough internal data for canonical acceptance.

`officialTruthServerHeldReviewReproof`, lines 345–386, loads the catalog once, injects that registry, recomputes the packet and the `review-packet:v2:` fingerprint, and returns no registry. The header at lines 336–343 states that the registry does not leave the function. The returned supports are the narrow freshness projection from `reproofStuetze`, lines 305–314.

`officialTruthRegelReviewPacket`, lines 238–269, sees accepted evidence and the registry value inside `buendelLesen`, lines 174–204, then returns only `kandidat` and support summaries. The candidate remains `candidate` / `pending`. The summaries omit the `EvidenceVersion` fields acceptance requires.

`officialTruthServerHeldRegelKandidat` returns a candidate result and no registry. `loadOfficialTruthAutonomousPreacceptanceWitness` returns the nine witness fields and does not import `regelKandidatAkzeptieren`.

### Smallest narrow internal prerequisite

This prerequisite is required before any later call to `regelKandidatAkzeptieren` from server-held material. It is not F8 acceptance. It does not create `trustedRuleFact`. It does not unblock the classification above.

Keep one catalog read and one reconstructed input. Retain, on that server stack only:

- the registry object from that read;
- the accepted `EvidenceVersion` objects already built for that reconstruction;
- the candidate already rebuilt from those versions;
- the `review-packet:v2:` key, rule-scope key, fact kind, evidence quality, and sorted support ids;
- the snapshotted server instant and the freshness result;
- the authority result already required by F7.

Do not add those objects to `OfficialTruthAutonomousPreacceptanceWitnessErgebnis` or `OfficialTruthServerHeldReviewReproofErgebnis`. Do not return them from a route. Do not return free evidence or registry contents to a caller. Do not add a second acceptance function.

Proposed ownership, so a later writer does not collide with this audit or with the store:

- new `lib/readiness/official-truth-same-request-proof-server.ts`
- new `lib/readiness/official-truth-same-request-proof-server.test.ts`
- only the retention needed inside `lib/readiness/official-truth-server-held-source-registry.ts`, and inside `lib/readiness/official-truth-rule-review-packet.ts` if the packet builder must expose the evidence it already holds to that one server caller

The public witness file and both store writers stay untouched by that prerequisite. `app/` must not import the new module. The new module must not import `regelKandidatAkzeptieren` or either store writer.

A later F8 module, not authorized now, would be a different file: `lib/readiness/official-truth-rule-acceptance-composition-server.ts`. It must not be `akzeptierteRegelClaimSpeichern`.

## 4. TOCTOU / double-read drift

`registryLaden` is a fresh `quellenKatalogLesen` call. It runs independently in `officialTruthServerHeldMaterialPruefen`, `officialTruthServerHeldEvidenceAnnehmen`, `officialTruthServerHeldReviewPacket`, `officialTruthServerHeldReviewReproof`, and `officialTruthServerHeldRegelKandidat` (`official-truth-server-held-source-registry.ts`, lines 156–171 and the five call sites). `quellenKatalogLesen` issues `read_registry` on each call (`lib/readiness/official-truth-source-catalog-server.ts`, lines 161–172). Nothing in the witness return pins the registry bytes.

The probe counted one `read_registry` inside the witness seam and a second `read_registry` inside a following `officialTruthServerHeldReviewPacket` on the same review input. The second response changed the authority name. The first result stayed `authorized_preacceptance_witness`. The second result was `blocked` / `invalid_source_plan`. A quieter catalog change that still resolved the URL could instead produce a different valid packet, a different fingerprint, or a different evidence version while the earlier witness still looked current.

Required invariant: one server invocation holds one catalog snapshot, one reconstructed input, one server clock instant, and the evidence versions and candidate built from that input. Freshness, the `review-packet:v2:` equality check, and `regelKandidatAkzeptieren` all read that same in-memory graph before the invocation returns. A witness object from an earlier request is not that graph. A second public entry is not that graph.

## 5. Candidate and proposal boundary

`regelKandidatErstellen` parses `proposal` onto the candidate, lines 801–816. `regelKandidatAkzeptieren` never reads `proposal`. The acceptance body starts at line 829 and does not contain that word. The existing test `der Kandidatenvorschlag wird nicht zur akzeptierten Regel` in `lib/readiness/rule-claims.test.ts` locks the same split. The probe repeated it, and then showed the hole: passing the proposal object as `trustedRuleFact` returned a claim whose fact was that proposal.

Model, research, suggestion, and plugin output may remain on the candidate as untrusted review material. They must not be assigned to `trustedRuleFact` when the field is missing, displayed, pre-filled, or equal to the proposal. The architecture states the same rule for the human path and says a deterministic policy may not use proposal text as the fact. This audit does not design that policy.

The candidate argument must be rebuilt from the same re-proved evidence, scope, quality, and support ids. It must not be taken from the request. Acceptance will reparse whatever object it is given, so a request candidate that happens to match server evidence would pass the pure function. The composition has to refuse that input before the call.

## 6. Canonical constructor

No second Rule acceptance constructor is allowed.

The only future function that may call `regelKandidatAkzeptieren` is a server-only composition that is not a route handler, not the witness, not the re-proof, not the review packet, not the decision intent, and not `akzeptierteRegelClaimSpeichern`.

Immediately before the call, that function must already have proved all of the following from the same in-memory graph:

1. `loadOfficialTruthFactEntryAuthority()` returned exactly `{ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }`. Break-glass, a missing capability, and a database denial stop before the call.
2. The registry is the single catalog snapshot. No caller registry was injected.
3. The packet and `review-packet:v2:` fingerprint were computed from that snapshot and agree on scope and support ids. The key is an equality check, not a capability.
4. Every support is `official_authority`, the quality is `explicit_primary_statement` or `composed_from_multiple_primary_sources`, and composed quality has two distinct `sourceId` values.
5. Every support is `current` under `officialFrische` at the snapshotted server instant. No caller `maxAgeMs`. The one-hour ceiling stays the existing helper.
6. The candidate passed in was rebuilt from that graph, not from the request.
7. `trustedRuleFact` came from an authorized source that is not `kandidat.proposal` and not model output. That source is the missing truth source. Until it exists, this function must not be written.
8. The evidence versions are the accepted versions from that graph.

The pure function's own checks still apply. The composition must not duplicate them as a second acceptance engine.

## 7. Persistence separation

`akzeptierteRegelClaimSpeichern` (`lib/readiness/official-truth-store-server.ts`, lines 336–358) calls `regelKandidatAkzeptieren(eingabe)` on the caller object and then the dormant RPC. It does not load the catalog, the witness, authority, or freshness. It is not the acceptance boundary.

`akzeptierteEvidenceSpeichern` re-proves evidence through `officialTruthServerHeldEvidenceAnnehmen` and does not call `regelKandidatAkzeptieren`. The two writers are separate.

`OFFICIAL_TRUTH_STORE_ACCEPTED_V1` remains in `LOCAL_UNAPPLIED_RPCS` in `scripts/db/verwendung.mjs`, together with `official_truth_source_catalog_v1` and `darf_official_truth_freigeben`. This audit did not query Production and does not certify hosted state. No file under `app/` calls `regelKandidatAkzeptieren`, the witness, or either store writer. `requirementsProviderAus()` in `lib/readiness/provider.ts`, lines 99–101, returns `null`.

A successful acceptance return is the only object a later store write may persist. That write is a different slice and a Production apply remains a Product-Owner gate. This audit does not connect it.

## 8. Adversarial test matrix

These tests are mandatory in the future prerequisite and in any later acceptance composition. This audit does not add them.

| Test | Required result |
| --- | --- |
| Caller witness replay / injection | A forged or replayed `authorized_preacceptance_witness` is not an acceptance input. Extra witness fields on `regelKandidatAkzeptieren` stay `unexpected_fields`. A prior witness object does not skip a new live proof. |
| Caller registry | `registry`, `sourceClass`, `domains`, and `blockedDomains` on the composition input fail before the catalog read. The registry inside acceptance is the object from that single `read_registry`. |
| Caller EvidenceVersion / accepted Evidence | A free evidence object, a re-proof support summary, and a witness id list fail closed. The probe already shows the summary shape is `evidence_not_accepted`. |
| Caller candidate | A request candidate is ignored. The candidate passed to acceptance is rebuilt from the same proof. A mismatched scope, fact kind, quality, or support id does not reach a claim. |
| Caller support ids | Caller `supportVersionIds` do not select evidence. Ids must be the version ids of the evidence objects from the same read. |
| Caller `trustedRuleFact` | A body fact, including one equal to the proposal, does not become the claim fact unless the authorized fact source supplied it. That source is not implemented. The composition must fail closed while it is absent. |
| Proposal-copy attack | Missing, untouched, displayed, or equal proposal text is not copied into `trustedRuleFact`. The probe shows a direct pass-through would be accepted, so the composition has to refuse it before the call. |
| Catalog drift / double-read | Two `read_registry` calls are a failed test. A changed catalog between a witness return and a later packet rebuild must not be able to authorize acceptance. One invocation, one snapshot. |
| Scope / credential-cell mismatch | A second citizenship relation or a second travel document in the same input is `scope_mismatch` and produces no claim. One composition is one regulatory cell. |
| Stale / future support | An elapsed window, a future `validFrom`, a retrieval older than the existing ceiling, and a future `retrievedAt` against the server instant produce no claim. The caller clock is not executed. |
| Break-glass / missing capability | Any authority result other than the exact role grant for `official-truth-freigeben` returns before the catalog read and does not call acceptance. |
| Suggestion / model output as authority | Suggestion output, decision intent, and model output do not select the fact and are not imported as the fact source. |
| Exact same-request success path | When a future authorized fact source exists: one authority read, one catalog read, one clock snapshot, current freshness, rebuilt candidate, non-proposal fact, then one call to `regelKandidatAkzeptieren`. No store call on that path. |

## Traveller context

One acceptance composition is one regulatory cell. The probe scope carried citizenships `CH` and `RS` with one Swiss passport option only as a cell fixture. A Serbian passport option is another key. This audit does not collect a credential and does not invent a visa, transit, health, carrier, eligibility, or document rule. The missing fact source must not be filled by reading a rule out of a page snapshot.

## #626

#626 stays out of this audit. This session did not read or write that producer and does not route around it.

## Validation

| Check | Result |
| --- | --- |
| `git fetch origin main` | `6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa` |
| Ahead / behind versus that SHA before these documents | 1 ahead / 0 behind. The ahead commit is the task seed. |
| Reproduction | Exit 0. JSON above. Script not committed. |
| `git diff --check` on the three audit documents | Pass. No whitespace errors. |
| `node scripts/operating-mode-guard.mjs` | `operating-mode guard: PASS` |
| `npm test`, typecheck, lint, production build | Not run. No runtime bytes changed. Those gates are not claimed. |
| Production database | Not queried. |

## Stop

Stay Draft. Stop for independent Technical-Lead review. Do not Ready, merge, or open a follow-up from this session. Issue #769 is not an input to this classification and was not edited.
