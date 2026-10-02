# Official Truth Rule Review Packet 1 — Self-Review

Date: 2 October 2026
Issue: #722
Draft PR: #723
Branch: `feat/official-truth-rule-review-packet-1`

Logical agent: **Jetnity Official Truth rule review packet 1**, Generation 1
Session: https://cursor.com/agents/bc-30066140-adb9-4bc2-8d94-b16353b0f5cd
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `708a77defa5092e43d5dec991aa09a77e34822db` is the task seed plus:

- `lib/readiness/official-truth-rule-review-packet.ts`
- `lib/readiness/official-truth-rule-review-packet.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `evidence.ts`, `rule-claims.ts`, the retrieval module, the candidate-evidence module, the acceptance module, the rule-candidate module and `source-registry.ts` were not edited. The task said to stop if this packet needed a change to those contracts. It did not. Acceptance stays `officialTruthAkzeptierteEvidenceAusAbruf`. The independent retrieval proof stays `officialTruthAbgerufenMaterialPruefen`. The candidate stays `officialTruthRegelKandidatAusEvidence`.

## What I checked in the packet

- One `gov.example` envelope, an injected clock and a bounded extraction note return a packet. The candidate deep-equals `officialTruthRegelKandidatAusEvidence` called with the Evidence that #716 just accepted. Lifecycle is `candidate`. Validation state is `pending`. The single support entry's version id, source id, canonical URL, retrieval time and content hash match both #716 and the separate #709 call. `sourceSnapshot` is the re-proven page text. The candidate key equals the #709 rule-scope key. Citizenship remains `CH` and `RS` even when the fixture lists `RS` first. The issuing country stays `CH` and the related citizenship stays `CH`. The input JSON is unchanged and the clock function is the same function.
- Two accepted authorities, `gov.example` and `interior.example`, with a composed proposal return one pending packet. Calling it again with the supports reversed deep-equals the first packet. Support version ids are sorted and equal the candidate's support ids. Both official source ids remain on the entries. Each entry's hash matches a fresh fingerprint of its snapshot.
- Supplying Evidence, a candidate, a claim, a receipt, support version ids or a trusted-fact object on the packet, on a support, or on the metadata fails closed. A trusted marker and `not_required` are absent. The version id of the real Evidence is absent from those failures.
- Passing the candidate Evidence object, a receipt, a licensed `provider.example` URL, a caller content hash, an empty snapshot or a future retrieval time returns the same blocked reason as #716. #709 is blocked on the same input. None of those results is a packet, and the caller hash is not echoed.
- A second passport, issuing country `RS` and related citizenship `RS`, keeps the same citizenship set and fails `scope_mismatch`. Each passport alone can form a packet. Together they do not. The failure JSON does not contain the country codes.
- The same support twice fails `support_mismatch`. The array order is unchanged. An empty list fails `invalid_support`. `REGEL_SUPPORT_MAX + 1` supports fail `support_bound_exceeded` before a packet is built.
- `research_gap` with a null proposal returns a pending packet. The quality is unchanged. The proposal is null. The result JSON does not contain an accepted lifecycle, `not_required` or the explicit visa proposal. The same quality with a non-null proposal fails `research_gap_proposal_forbidden`.
- Passport, document, MRZ, scan, birth date, health, name, email, account, user, trip and traveller-note keys in the metadata, the envelope, the extraction and the support shell return a blocked result without the value and without the key name.
- Two registries that differ by a blocked domain fail `invalid_source_plan`. Two snapshots from one official source with composed quality fail `same_source_composition` and that result has no candidate.
- The runtime file calls the three required bridges. It does not contain rule acceptance, a hand-built candidate lifecycle, `not_required`, a store or catalog RPC, `requirementsProviderAus`, `Date.now`, `new Date`, `fetch`, or an engine, provider, store, catalog or `evidence.ts` import. The existing runtime files named in the test do not import this module. `requirementsProviderAus()` is still `null`.

## Boundary choices a reviewer should see

1. Success returns the #717 candidate object. A later guard checks candidate/pending, the sorted support ids and the shared rule-scope key. On the current unmodified bridges that guard passes. If it ever failed, the packet would return a closed reason and would not invent a replacement candidate.
2. The independent #709 call is not the call inside #716. Provenance must match the accepted Evidence. A mismatch returns the existing `invalid_context` reason and no packet. The current bridges agree on the synthetic fixtures, so that guard is defense in depth.
3. Personal keys inside the envelope, the extraction and the metadata are left to the bridges, so their existing reasons propagate. An extra personal key on the packet shell or the support shell returns `personal_identifier_forbidden` and is not forwarded. The personal-key set is copied. Exporting the private sets from the other modules would have edited those files, which this task forbids.
4. One packet uses one registry image, the registry object inside the envelopes. If the JSON of those registries differs, the result is `invalid_source_plan` even when each envelope would succeed alone. That keeps a later reader from mixing two source plans. Key order follows `quellenRegistryErstellen`. This slice does not canonicalize a caller-supplied registry, because the caller does not supply one.
5. The candidate is built only by #717. Caller lifecycle, support ids and a trusted fact are not forwarded, even when they match what the constructor would have written.
6. `research_gap` may form a packet and stays non-acceptable quality. This slice does not accept it and does not upgrade it.
7. Same-source composition is rejected by #717 after the supports have been re-proven. The failure carries no candidate. When the sources are distinct, every version id stays on the candidate and on the sorted support entries.
8. `sourceSnapshot` is copied from the re-proven #709 material. It is public page text for review. It is not a decision and it is not a caller field.
9. The citizenship set is kept whole. A different credential option is a different cell. Route Truth is not rebuilt here.
10. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
11. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Tests and gates

Focused file: 11/11 pass. Full `npm test` on `d8ae295e6fdfea01e649ca95c95e2694a13e7d24`: 4359 pass / 0 fail, 754 suites. Typecheck, lint, build, diff check, operating-mode guard and the hygiene checks passed. Lint reports 0 errors and 148 pre-existing warnings, none in the new files. Schema reference still lists the three already known unapplied RPCs. This slice added none.

PostgreSQL 16 was not on the machine at the start. After installing PostgreSQL 16.15 locally, the suite passed, including the two existing throwaway cluster proofs. Those clusters are local and temporary. No remote database was contacted. This slice did not apply SQL.

## Stop line

The docs commit after `d8ae295e` is not a behavior change. GitHub CI, the Auth job and Vercel Preview belong to the pushed tip after that commit. Do not reuse a run id from `708a77de`. This remains a Draft. No Ready, no merge, and no follow-up acceptance or model-review slice from this writer.

**STOP for independent Technical-Lead review of the exact pushed tip.**
