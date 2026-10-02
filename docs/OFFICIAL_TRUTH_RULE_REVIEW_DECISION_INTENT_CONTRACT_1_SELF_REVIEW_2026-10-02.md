# Official Truth Rule Review Decision Intent Contract 1 — Self-Review

Date: 2 October 2026
Issue: #733
Draft PR: #734
Branch: `feat/official-truth-rule-review-decision-intent-contract-1`

Logical agent: **Jetnity Official Truth Rule review decision intent contract 1**, Generation 1
Session: https://cursor.com/agents/bc-02e0c991-cb8c-4fbe-96b4-3f603671ce7a
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is **not** a Technical-Lead PASS.

## Scope check

The diff against `45a4592de638b0cb73f177e255a82dd55bb512ad` is the Technical-Lead task seed plus:

- `lib/readiness/official-truth-rule-review-decision-intent.ts`
- `lib/readiness/official-truth-rule-review-decision-intent.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_DECISION_INTENT_CONTRACT_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_DECISION_INTENT_CONTRACT_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_DECISION_INTENT_CONTRACT_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, and `JETNITY_HANDOFF.md` were not edited. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. #723, #726, #730, `rule-claims.ts`, the provider, and the store were not edited. The new module calls only `officialTruthRegelReviewPacket` and `officialTruthRegelReviewPacketFingerprint`. `RegelFaktArt` is a type-only import.

## What I checked

- One `gov.example` envelope accepts all three exact decisions. The output keys are only `status`, `reviewPacketKey`, `ruleScopeKey`, `factKind`, and `decision`. `factKind` is the re-proven candidate kind. A `stay_limit` packet returns `stay_limit` and a different key. The snapshot, URL, content hash, support version ids, proposal text, and `electronic_visa` are absent. The input JSON is unchanged. `requirementsProviderAus()` is still `null`.
- Two distinct official sources with composed quality accept `proceed_to_trusted_fact_entry`. The result still has only the five fields.
- `research_gap`, `stale_primary_evidence`, and `unresolved_conflict` accept `needs_more_evidence` and `reject_candidate`. Proceed returns `quality_not_acceptable` and does not echo the quality name or the key.
- A missing key, a wrong key, a padded key, an uppercased key, a non-string key, and a key computed before the page text changed all return `review_packet_key_mismatch`. The supplied key is absent from the blocked JSON.
- An empty support list, a research gap with a proposal, a built packet used as input, a fingerprint used as input, `null`, and an array stay blocked. The real key is not echoed.
- `accepted`, `approved`, `continue`, case and whitespace variants, booleans, and free text return `invalid_decision` without echo.
- Extra candidate, proposal, support, fingerprint, suggestion, reviewer, role, AAL, capability, trusted-fact, accepted, and lifecycle fields fail closed. The marker and the field name are absent. A suggestion object does not become the decision.
- Personal, note, and free-text fields fail closed. The secret and the field name are absent.
- The Swiss passport and the Serbian passport, both keeping citizenship `CH` and `RS`, return different keys and different rule-scope keys. The other key cannot be reused. Both supports together fail `scope_mismatch` without the country codes.
- Same-source composition fails `same_source_composition` for every decision because #723 blocks the packet.
- The runtime imports are the packet, the fingerprint, and type-only `RegelFaktArt`. The source does not call acceptance, the store, the suggestion function, a provider, `Date.now`, `new Date`, `fetch`, or a hash helper. The named existing modules do not import this file.

## Boundary choices a reviewer should see

1. The success name is `rule_review_decision_intent` on purpose. A copied result is not a server-held decision. This slice does not create that store.
2. `proceed_to_trusted_fact_entry` is refused for non-acceptable quality with the existing `quality_not_acceptable` reason. The task says this slice does not override the downstream acceptance checks. It does not call them and it does not weaken them. The refusal is the architecture step for this pure contract. A later endpoint must still call `regelKandidatAkzeptieren`.
3. `packet_fingerprint_mismatch` is present. It is not reachable while #726 keeps calling #723 and returning that packet's key and support ids. The source test locks the comparison. Forcing a disagreement would mean editing #723 or #726, which this allowlist forbids.
4. Live #723 blocks same-source composition before a packet exists, so this contract cannot pause that input. The architecture text says such a packet can remain review material. This slice does not change #723 to make that sentence true. The local source-count guard still refuses proceed if a successful packet of that shape appears. `insufficient_support` inside that guard is similarly unreachable through the current packet builder.
5. The function does not re-read `sourceClass`. A successful #723 packet has already required `official_authority`. This is not a second acceptance engine.
6. The personal-key set is copied because the packet set is module-private. A new forbidden key inside `packetInput` is still caught by #723. A new forbidden key added only beside the three input fields would need this copy updated.
7. Blocked results are a new frozen `{ status: 'blocked', reason }`. They do not return the packet object and they do not attach the caller key.
8. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
9. `requirementsProviderAus()` is still `null`. This slice does not turn research on.
10. Global current-state files still name an older writer. That is the allowlist, not a claim that this Draft is merged.

## Tests and gates

Focused file: 12/12 pass. Full `npm test` on `a7667ad8660f1f9fd3da5f3a8c8aeb13e880408c`: 4403 pass / 0 fail, 758 suites. Typecheck, lint, build, diff check, operating-mode guard, and the hygiene checks passed. Lint reports 0 errors and 148 pre-existing warnings, none in the new files. Schema reference still lists the three already known unapplied RPCs. This slice added none.

PostgreSQL 16 was not on the machine at the start. After installing PostgreSQL 16.15 locally, the suite passed, including the existing throwaway cluster proofs. The package cluster was not started. Those proof clusters are local and temporary. No remote database was contacted. This slice did not apply SQL.

## Stop line

The docs commit after `a7667ad8` is not a behavior change. GitHub CI, the Auth job, and Vercel Preview belong to the pushed tip after that commit. Do not reuse a run id from `a7667ad8`. This remains a Draft. No Ready, no merge, and no follow-up endpoint or acceptance slice from this writer.

This self-review is **not** Technical-Lead PASS.

**STOP for independent Technical-Lead exact-head review of the exact pushed tip.**
