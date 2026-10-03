# Official Truth Same-Request Proof Graph 1 — Task

Date: 3 October 2026
Issue: #772
Branch: `fix/official-truth-same-request-proof-graph-1`
Baseline: `main@a7ad77743327c01821cf2532ca253a3220c857e8`
Logical agent: **Jetnity Official Truth same-request proof graph 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Implement only the server-only prerequisite established by merged F8 audits #770 and #771.

The new graph must make one trusted server invocation hold the exact material needed by a later F8 composition:

- exact fact-entry authority result;
- one server-owned reference instant;
- one source-catalog snapshot;
- one reconstructed registry-free review input with that registry and clock injected internally;
- full accepted `EvidenceVersion` objects from that reconstruction;
- one rebuilt `RegelKandidat` from those accepted Evidence versions;
- one #723 review packet and one #726 v2 fingerprint derived from the same reconstruction;
- full re-proved review supports including source snapshots/provenance;
- exact freshness = current for every support.

This is **not** Rule acceptance and does not provide `trustedRuleFact`.

## 2. Binding reads

Read live main first, then at minimum:

1. `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_REPORT_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_REPORT_2026-10-03.md`
3. `docs/OFFICIAL_TRUTH_AUTONOMOUS_FRESHNESS_AUTHORITY_WITNESS_1_REPORT_2026-10-02.md`
4. `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
5. `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts`
6. `lib/readiness/official-truth-server-held-source-registry.ts`
7. `lib/readiness/official-truth-rule-review-packet.ts`
8. `lib/readiness/official-truth-rule-review-fingerprint.ts`
9. `lib/readiness/official-truth-accepted-evidence.ts`
10. `lib/readiness/official-truth-rule-candidate.ts`
11. `lib/readiness/official-truth-fact-entry-authority-server.ts`
12. `lib/readiness/evidence.ts`
13. `lib/readiness/rule-claims.ts`

Live evidence wins.

## 3. Core invariant

One successful graph = **one authority read + one server time snapshot + one source-catalog read**.

No successful path may:
- accept a caller witness;
- accept a caller registry;
- accept caller Evidence versions;
- accept a caller candidate;
- accept a caller review key/support ids/freshness;
- execute caller `uhr`;
- perform a second catalog read;
- rebuild acceptance material from a later public witness response.

All proof objects must come from the same in-memory reconstructed graph.

## 4. Internal graph material

A successful **server-only internal** graph may retain:

- `registry`: exact server-held `QuellenRegistry` from the one catalog read;
- `evidenceVersions`: full accepted Evidence versions produced from that same reconstructed input;
- `kandidat`: the Rule Candidate rebuilt from those Evidence versions and the same metadata;
- `reviewPacketKey`, `ruleScopeKey`, `factKind`, `evidenceQuality`, sorted support ids;
- re-proved support objects including source snapshots plus provenance/validity;
- `serverReferenceTime`;
- freshness exactly `current`;
- exact authorized role/capability echo.

It must retain **no personal data** and must not add any new traveller/passport identifiers.

The graph may contain the candidate's existing untrusted `proposal` only because the canonical candidate contains it. That field remains review material. Nothing in this task may treat it as a trusted fact or expose it through the public F7 witness.

## 5. Public F7 witness relationship

The public live witness from PR #767 must remain semantically unchanged:
`loadOfficialTruthAutonomousPreacceptanceWitness(eingabe)`

Preferred architecture:
- make the new graph the internal superset;
- project the existing nine-field F7 witness from that graph;
- preserve exact fail-closed semantics, authority-first order, single catalog read, server-owned clock, freshness behavior and public return shape.

If a safer implementation leaves the public witness implementation untouched, the new graph must still prove identical F7 preconditions without introducing a second inconsistent policy. Explain the choice in the report.

No public witness type may gain registry, EvidenceVersion, candidate, source snapshot, proposal or trusted fact.

## 6. Server-held reconstruction

Use the current server-held source-registry boundary. Refactor narrowly if required so a single catalog read can yield, from the same reconstructed input:

1. each accepted EvidenceVersion;
2. Rule Candidate from those exact versions;
3. #723 packet;
4. #726 v2 fingerprint;
5. support snapshots/provenance;
6. all identity equality checks already required by F7.

No second source-registry model.
No caller registry.
No source-class/domain authority from request data.
No network except the existing catalog transport.

## 7. Freshness and time

- authority check before catalog read;
- read server time once;
- caller `bund.uhr` never executed on this autonomous graph;
- retrieval validation and freshness use that same server instant;
- every support must be exactly `current` under existing `officialFrische`;
- use the existing bounded ceiling; no caller maxAge and no new TTL;
- future retrievedAt, future validFrom, elapsed validUntil, age boundary and stale age all block.

## 8. Internal-only boundary

The graph is not a bearer capability and not an API response.

Must prove:
- no `app/` route imports the graph module;
- no public return type exposes the internal graph;
- no JSON serialization path is introduced;
- no persistent store writes the graph;
- no database table/RPC/migration is added;
- a caller-supplied graph-like object cannot skip live proof.

A future F8 server module may consume this graph **in the same server invocation only**. That future module is not part of this slice.

## 9. Forbidden

Do not import/call:
- `regelKandidatAkzeptieren`
- `akzeptierteRegelClaimSpeichern`
- `akzeptierteEvidenceSpeichern`

Do not:
- add route/UI;
- add/modify migration, RPC, schema, RLS, role, AAL or capability;
- apply/re-apply Supabase;
- touch #626;
- implement deterministic fact extraction;
- use model/plugin/suggestion output;
- select provider or use secrets/paid calls;
- activate Production;
- implement F8;
- start a follow-up slice;
- Ready or merge.

## 10. Allowed files

Primary ownership:

- new `lib/readiness/official-truth-same-request-proof-server.ts`
- new `lib/readiness/official-truth-same-request-proof-server.test.ts`
- `lib/readiness/official-truth-server-held-source-registry.ts`
- `lib/readiness/official-truth-server-held-source-registry.test.ts`
- `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts` only for semantic-preserving projection/refactor
- `lib/readiness/official-truth-autonomous-preacceptance-witness-server.test.ts` matching regression tests
- `lib/readiness/official-truth-rule-review-packet.ts` and test only if strictly necessary to retain full accepted Evidence internally without widening its public review packet

Delivery docs:
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_PROOF_GRAPH_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_PROOF_GRAPH_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_PROOF_GRAPH_1_SELF_REVIEW_2026-10-03.md`

Do not edit global current-state files or this task file.

Any additional file needs an explicit necessity note before editing.

## 11. Mandatory adversarial tests

At minimum prove:

1. authority denied/break-glass/lookup failure -> no catalog read;
2. caller authority/registry/role/AAL/user/reviewer/clock/maxAge/witness/review key/support ids/Evidence/candidate/trusted fact -> blocked;
3. caller historical `uhr` is not executed;
4. exactly one catalog read on successful graph;
5. same server instant for retrieval validation and freshness;
6. full accepted Evidence versions match packet/fingerprint support ids and rule scope;
7. candidate rebuilt from those exact accepted Evidence versions matches packet/fingerprint cell;
8. reversed support order remains same canonical identity;
9. catalog drift cannot occur inside one successful graph because no second read happens;
10. stale/future/expired support blocks;
11. non-acceptable evidence qualities block;
12. graph contains no PII;
13. F7 public witness still has exactly its existing nine fields and no internal graph material;
14. no acceptance/store import or call exists;
15. no `app/` import exists.

## 12. Validation / STOP

Before STOP:
- focused tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- current CI hygiene checks;
- `git diff --check`;
- fetch live main and finish 0 behind;
- push branch;
- keep Draft;
- report exact head, files, gates, session id and `originalModelName`;
- STOP for independent TL review.

No Ready. No merge. No F8 follow-up.