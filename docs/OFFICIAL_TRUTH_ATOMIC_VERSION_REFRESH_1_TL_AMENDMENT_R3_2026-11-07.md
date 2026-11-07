# Atomic Version Refresh 1 — TL amendment R3: genuine Fresh producer artifact identities

Date: 2026-11-07. Issue #1152 / Draft #1153.
TASK V1 `b2a3fdb6c1f79cb187b22a7cc9d1a890b8d067d7`, R1 `ebd7c51b746891e44c8c8bfd8c09e47a84efe596`, R2 `815bfedf2a3a2cc418a1a9b537868417340731c8` remain immutable.
Reviewed implementation head: `3dbf1da2b97154372c945e20264f2a18f1b3b0b5`.
Root CHANGES REQUIRED: https://github.com/Jetnity/jetnity/pull/1153#issuecomment-6711409969

Same author/session: Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1, `/root/atomic_version_refresh_writer`. This is an immediate fix of a demonstrated blocker within #1152, not a successor slice.

## 1. Demonstrated gap and actual failed gate

CI42401079734 attempt1, refresh-native job128488741283, actually executed all five Fresh runs and failed its 66,235ms native parent at line271: expected23514, actualP0001. No successful atomic update was proved.

Independent review and Root source inspection established that the existing producer assigns static artifact IDs and version1 to observation-dependent bytes. A later genuine execution changes those bytes under the same immutable key. The unchanged publisher correctly rejects the conflict. Generic earlier negative failures therefore do not establish the intended downstream checks.

Do not change the expected failure to P0001, weaken immutable conflict rejection, rewrite a positive result after execution, strip its implementation capsule, synthesize observation times or increase a deadline.

## 2. One additional existing source seam

The only additional previously frozen source path authorized by this amendment is:

`scripts/official-truth-integrated-pilot-1/engine.ts`
baseline blob `4e0d948c915cd60295d2a8d876db983c5df5301f`.

Add private deterministic identity derivation at the actual producer's original artifact-construction boundary, exclusively for `clockMode === 'fresh'` and exactly these seven types:

| Factory | Admitted changing types |
| --- | --- |
| manifest | original_observation, validity_origin, accepted_origin, eligible_version_snapshot |
| custody | AcceptedEvidenceCustodyV1, SelectedSupportManifestV1, AutonomousReviewConstructionV1 |

The new ID must be determined before `createIntegratedPilotArtifact` or the actual custody `historicalPinFor` constructs the artifact/Pin, and before dependent artifacts are built. There is no posthoc graph or envelope remapping.

The private derivation uses a fixed domain-tagged canonical preimage containing logical base ID, byte family, exact type/kind and complete actual producer-owned content; custody uses its already strictly parsed complete historical value. Use the existing canonical/hash codec, retain the complete64-hex digest in a valid bounded ID of at most128 characters, and refuse failed canonicalization/hash formation. The existing `historicalPinFor` digest over an explicitly domain-tagged preimage is sufficient; do not expand the generic `provenanceHash` domain whitelist or add a new codec/dependency.

No new caller namespace, input field, random source, counter, clock, exported authority factory or reusable capability. Identical content must retain the same derived identity; genuinely changing observation/dependency content must receive a distinct identity. Artifact version remains1; receipt/evidence/review identities remain the genuine outputs of the unchanged existing constructors.

## 3. Fixed identities and old contracts stay fixed

Every other artifact type retains its current ID/version behavior, including historical/default mode and all historical fault cases. In particular, do not rename or renumber:

- global_cell and its current fixed definition pins;
- identity_profile;
- extractor_definition;
- policy_definition;
- static catalogs, contracts, code capsules, qualification/admission/selection definitions or content/representation definitions.

The three semantic definition families above require artifact ID/version to equal their semantic profile/extractor/policy identity. Those checks remain unchanged. At identical code and semantic content, all static Fresh artifact pins must remain byte-identical across runs.

Keep the controlled-runtime entry, snapshot/capsule capture, source corpus/parser, canonical codecs, SQL publisher/verifier, immutable schemas, #1151 reader/projection and all source/authority admissions unchanged. The existing actor/role/transaction boundaries are unchanged. No migration, silent overwrite or requalification of previously stored conflicting definitions is authorized.

This narrowly enables multiple genuine observations under the same fixed producer/code contract. It does not admit changed legal content, changed semantic definition versions, older-code migration, stale-predecessor resurrection or a real source/provider.

## 4. Required regression evidence and test precision

Use the complete actual Primary/Composed Fresh outputs as returned. Before relying on generic downstream negative cases, prove that the old/new producer graphs are mutually compatible with the immutable key contract: every shared (artifact_id,artifact_version) has identical type/family/contract/bytes/digest, and the actual changing seven-family nodes obtain distinct identities while their unchanged semantic definitions remain the same.

The actual native store must then demonstrate coexistence/publication and the complete successful atomic Old-to-New path, including true Bind/Supersede fault points, currentness/concurrency/ACK cases and independent fresh readback. A preliminary publication probe may use the existing local fixture producer inside a rollback-only native test transaction; it grants no new runtime role. Assertions must establish the intended reached check/phase; an unrelated early publisher error is not evidence for a later review/body/validity/policy rejection.

Preserve the existing native conflict tests: deliberately reusing the same immutable identity with different bytes must still fail. The historical/default producer behavior and all existing Core/#1151 native tests must remain unchanged and pass. No weakening of old test expectations, global skip, failure-tolerant CI, timeout increase or dependency installation.

All new verification belongs in the already authorized new test/fixture files. Update this PR's own documentation and Handoff to include R3, the actual failed first CI, the new source seam and precise outcomes. In particular, distinguish positive producer-departure proof, helper-answer loss after real ACK, reader-connect failure and delayed successful cleanup/reader responses from failure cases that were not injected. Distinguish runtime cleanup proof from cleanup performed explicitly by test-finally.

## 5. Publication and unchanged holds

Return a new immutable complete snapshot/delta manifest against the exact R3 parent supplied by Root. Root alone publishes and reviews. Every changed head invalidates prior exact-head gates and requires complete Core, persisted-native, refresh-native, Auth, strict aggregate and Preview, then ordinary Root merge/post-merge gates.

No PASS, Ready or Merge is granted by this amendment. No automatic next slice.

Development Stage1 remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, new ledger UNKNOWN; Stage2 NOT_ATTEMPTED. There is no platform clearance for the refused readback, no retry/rephrasing/rerouting, no #1131 integration, no real source or pilot activation and no Production change. The complete own persistent/versioned/refreshable entry database and actual jetnity.com A–F path remain the product goal.
