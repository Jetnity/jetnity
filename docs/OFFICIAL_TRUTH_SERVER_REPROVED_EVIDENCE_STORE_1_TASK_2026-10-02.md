# Official Truth Server-Reproved Evidence Store Entry 1 — Binding Task

Date: 2 October 2026
Issue: #762
Source audit: merged #749 / F2
Prerequisites: merged #755/F1, #757/F3, #759/F5, #761/F9
Baseline: `main@8325a5be988ec9e8d1fbd79dd75129373176be2e`
Branch: `fix/official-truth-server-reproved-evidence-store-1`
Logical agent: **Jetnity Official Truth server-reproved Evidence store entry 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Close #749 F2.

The current dormant Evidence store entry:
`akzeptierteEvidenceSpeichern(kandidat: EvidenceVersion, registry: QuellenRegistry, ...)`
still accepts a free EvidenceVersion + registry pair. That permits a hand-built candidate to reach the dormant store path without proving that it came from the official retrieval chain.

The canonical future live/autonomous Evidence store entry must instead begin from:
- the original registry-free retrieval envelope;
- injected/re-proven clock;
- bounded extraction;
- server-held source catalog dependency;
- dormant store transport dependency.

No free EvidenceVersion and no caller registry may be an authority input.

## Binding architecture

Reuse the merged F1 server-held boundary:
`officialTruthServerHeldEvidenceAnnehmen`

The canonical store entry must:
1. take registry-free retrieval input;
2. re-prove accepted Evidence through `officialTruthServerHeldEvidenceAnnehmen`;
3. derive the rule scope from that returned accepted Evidence;
4. create the store payload only from that returned accepted Evidence;
5. invoke the existing dormant store transport only after successful server-held re-proof.

Do not reimplement retrieval, registry, hash or Evidence acceptance logic.

## Canonical API change

Preferred:
Refactor the exported accepted-Evidence store function so its public canonical shape no longer accepts:
- `EvidenceVersion`;
- `QuellenRegistry`;
- sourceContentHash;
- versionId;
- accepted lifecycle/validation fields.

Recommended canonical shape:
`akzeptierteEvidenceSpeichern(umschlag, uhr, extraktion, abhaengigkeiten?)`

or a semantically equivalent server-only function where the only Evidence object reaching payload construction is the exact `accepted_evidence.evidence` returned by `officialTruthServerHeldEvidenceAnnehmen`.

If keeping an old free-Evidence exported writer would permit a future live caller to bypass this new path, that is NOT acceptable. The hand-built path must cease to be a canonical exported store entry. Test helpers may be internal/module-private.

## Dependencies

Store dependencies may combine:
- existing store transport/env;
- existing source-catalog dependencies used by the server-held registry boundary;
- test-only injected transports.

These are server-code dependencies, not request-body authority.

Do not allow the retrieval envelope/extraction to supply:
- registry;
- sourceClass;
- domains;
- blockedDomains;
- sourceContentHash override;
- accepted Evidence;
- versionId;
- lifecycle/validation;
- store payload.

## Evidence payload

Keep the existing accepted-Evidence payload semantics unless needed to remove a bypass.

Payload must come only from the re-proven accepted Evidence:
- version id;
- provenance;
- validFrom / validUntil;
- scope;
- lookup key;
- existing extractionNote behavior.

Do not invent Rule truth.

## Mandatory adversarial tests

At minimum prove:

1. registry-free official retrieval + injected trusted catalog + valid extraction can reach the test store transport;
2. payload Evidence values equal the re-proven accepted Evidence values;
3. caller `registry` field is rejected before store transport;
4. caller sourceClass/domains/blockedDomains authority injection is rejected;
5. caller sourceContentHash/contentHash/content override is rejected;
6. caller-built EvidenceVersion cannot be supplied to the canonical store entry;
7. caller-built accepted Evidence cannot be supplied to the canonical store entry;
8. caller versionId/lifecycle/validation/lookupKey cannot override stored values;
9. fake-government domain not present in server-held catalog cannot reach store;
10. licensed provider cannot become official authority;
11. catalog unavailable/failure => no store call;
12. retrieval/evidence rejection => no store call;
13. store transport missing => `store_not_configured` or existing equivalent after proof;
14. store transport throw/error => fail closed;
15. idempotent/inserted response verification remains;
16. one regulatory cell / credential option semantics remain;
17. no caller-supplied registry reaches payload construction;
18. no app/API route calls this store entry yet;
19. no `regelKandidatAkzeptieren` path is added by this slice;
20. no remote Supabase/catalog access in tests;
21. `requirementsProviderAus() === null`.

## Allowed runtime/test files

Primary:
- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`

Only if narrowly required by type sharing and with no semantic change to F1:
- `lib/readiness/official-truth-server-held-source-registry.ts`
- its focused test

Prefer **no edit** to the F1 module. Import and reuse it.

May update architecture only:
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
  only to bind future Evidence persistence to the server-reproved store entry.

Create:
- `docs/OFFICIAL_TRUTH_SERVER_REPROVED_EVIDENCE_STORE_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_SERVER_REPROVED_EVIDENCE_STORE_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_SERVER_REPROVED_EVIDENCE_STORE_1_SELF_REVIEW_2026-10-02.md`

Do not edit:
- suggestion module/tests (owned by parallel F6 writer);
- F9 authority guard;
- Auth/roles/admin guard;
- app/API routes;
- migrations;
- types/supabase.ts;
- global startup/Guardian Current-State files.

## Relationship to later #741

This slice closes F2 for accepted-Evidence store entry provenance.

It does NOT call the store from #741.
It does NOT apply the store RPC.
It does NOT implement Rule acceptance.

The later central gate must:
- re-prove server-held packet/evidence;
- pass F9 authority;
- use this server-reproved Evidence store path if Evidence persistence is needed;
- never pass a free EvidenceVersion to a store function.

## Hard boundaries

No migration/apply.
No Development/Production database mutation.
No RLS/Auth/role/profile mutation.
No endpoint/Server Action.
No accepted Rule write.
No Rule acceptance.
No provider/model call.
No secret/env mutation.
No cost.
Do not implement #741.
Do not touch #626.

## Validation

- fetch latest main;
- finish 0 behind;
- focused store/provenance tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- all hygiene checks;
- `git diff --check`;
- operating-mode guard;
- no remote Supabase access.

Stay Draft.
Do not Ready.
Do not merge.
Do not start follow-up.
STOP for independent Technical-Lead exact-head review.
