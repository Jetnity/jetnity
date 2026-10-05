# Official Truth Non-Authoritative Review Suggestion Contract 1 — Self-Review

Date: 2 October 2026
Issue: #728
Draft PR: #730
Branch: `feat/official-truth-review-suggestion-contract-1`

Logical agent: **Jetnity Official Truth non-authoritative review suggestion contract 1**, Generation 1
Session: https://cursor.com/agents/bc-bb1255f3-36c2-41b1-907b-b23ef08cbf04
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## R1-F1

Technical-Lead review `5390889237` accepted the packet binding and required one privacy change. Free-form `reviewNote` is gone from the input and from the success object. There is no replacement text field. `reviewNote: null` fails `unexpected_fields`. A personal-looking string in a free-text field, in a reason code, in a citation, or in the assessment cannot appear in the result. The runtime source does not contain `reviewNote` or `invalid_review_note`.

## Scope check

The diff against `5e291ed7c4814f034224eda46c3bd62cc9815ea3` is the task seed plus:

- `lib/readiness/official-truth-review-suggestion.ts`
- `lib/readiness/official-truth-review-suggestion.test.ts`
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONTRACT_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONTRACT_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONTRACT_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. The #723 packet, the #726 fingerprint, `digest.ts`, `evidence.ts`, `rule-claims.ts`, the retrieval module, the candidate-evidence module, the acceptance module, the rule-candidate module and `source-registry.ts` were not edited. The new module imports only `officialTruthRegelReviewPacket` and `officialTruthRegelReviewPacketFingerprint`.

## What I checked in the suggestion contract

- One `gov.example` envelope with `supports_candidate` returns the #726 `reviewPacketKey` and the same rule-scope key. The cited ids equal the sorted support version ids. The output keys are only `status`, `reviewPacketKey`, `ruleScopeKey`, `assessment`, `citedSupportVersionIds` and `reasonCodes`. The snapshot, the canonical URL, the content hash, `electronic_visa` and `reviewNote` are absent. The input JSON is unchanged. `requirementsProviderAus()` is still `null`.
- `reviewNote` with a personal-looking string, `reviewNote: null`, and the same string under `summary`, `explanation`, `message`, or `annotation` fail closed. `comment`, `note`, and `freeText` fail as personal keys. The name, the passport-like token, and the date are absent. Putting that string in `reasonCodes`, `citedSupportVersionIds`, or `assessment` also fails closed and does not echo it.
- `contradicts_candidate`, `insufficient_evidence` and `needs_human_review` bind to the same key when the packet is unchanged. An empty citation list and an empty reason-code list do the same. A `research_gap` packet with a null proposal receives a different key and still returns only a review suggestion.
- Two accepted authorities reversed return the same key. Citations and reason codes supplied in reverse order come back sorted.
- An id outside the packet fails `citation_not_in_packet`. A repeated id fails `duplicate_citation`. An empty string and a non-string citation fail `invalid_support`. A repeated reason code fails `duplicate_reason_code`. The id, the real key and the snapshot are absent.
- `accepted`, `trusted_rule_fact`, a padded assessment, an unknown reason code and a missing reason-code field fail closed. The unknown code is absent.
- Personal keys on the suggestion, in metadata and on the support shell fail closed. The secret and the key name are absent. A nested `passportNumber` fails `personal_identifier_forbidden`.
- Passing the packet object, the fingerprint, the real `reviewPacketKey`, the real rule-scope key, the real support ids, the support shells, or a trusted-fact field returns a blocked result. The real key, the content hash, the snapshot and the trusted marker are absent. `null` fails closed.
- The Swiss passport and the Serbian passport, both keeping citizenship `CH` and `RS`, return different keys. Citing the other cell's support id fails `citation_not_in_packet` without the id or the country codes. Passing both supports fails `scope_mismatch` without the country codes.
- A frozen citation array supplied in reverse order is not mutated. The output citations are sorted.
- The runtime file's only imports are the #723 packet and the #726 fingerprint. It calls both. It does not call rule acceptance, `sha256Hex`, `evidenceQuellenFingerprint`, `Date.now`, `new Date`, `fetch`, or a provider. The existing runtime files named in the test do not import this module.

## Boundary choices a reviewer should see

1. A blocked #723 object is reduced to `{ status: 'blocked', reason }` with the packet reason. This slice does not attach a key to a failure and does not echo the rejected value.
2. After both re-runs, `ruleScopeKey` and the sorted support version ids must agree across the packet candidate, the packet supports and the fingerprint. A mismatch returns `packet_fingerprint_mismatch` and no suggestion. On the current unmodified #723/#726 pair that guard passes. This slice does not edit those modules to force a disagreement.
3. Duplicate citations and duplicate reason codes fail closed. They are not silently collapsed. Unsorted input is sorted only after the values are unique and allowed.
4. Citation membership uses the re-proven fingerprint ids, which have already been checked against the packet. A caller support-id list under any other name is an unexpected field.
5. V1 has no free-text field. R1-F1 removes `reviewNote` instead of trying to detect personal data inside a note. An extra text field fails `unexpected_fields` or, when the field name itself is a personal key, `personal_identifier_forbidden`. The value is not copied out.
6. The validator does not compare the assessment with the page text. `supports_candidate` together with `support_text_conflicts_candidate` is still a schema-valid suggestion. Deciding whether the page actually supports the candidate is a later reviewer. This function must not be treated as that decision.
7. Personal keys are scanned on the whole input, including inside `packetInput`, before the re-run. A tree deeper than 16 levels fails `unexpected_fields` so an unscanned tail cannot hide a key.
8. One suggestion is one cell. A second credential option is a different key. Route Truth is not rebuilt here.
9. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
10. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Tests and gates

Focused file: 10/10 pass on `1a1eca4945f467c7a2a1c1f106d4b5ccc8ba083d`. Full `npm test` on that tree: 4391 pass / 0 fail, 757 suites. Typecheck, lint, build, diff check, operating-mode guard and the hygiene checks passed on that same tree. Lint reports 0 errors and 148 pre-existing warnings, none in the suggestion files. Schema reference still lists the three already known unapplied RPCs. This slice added none. The earlier counts on `f3132973` included `reviewNote` and are not the R1 head.

PostgreSQL 16 was not on the machine at the start. After installing PostgreSQL 16.15 locally, the suite passed, including the existing throwaway cluster proofs. The package cluster was not started. Those proof clusters are local and temporary. No remote database was contacted. This slice did not apply SQL.

## Stop line

The R1 behavior is `1a1eca49`. Exact-head CI `36997512207` on `48339be1cf8d775d4187cf46321820e6af687409` is **SUCCESS**. Auth job `110807512028` **SUCCESS**. Typecheck, Lint & Build job `110807511683` **SUCCESS**. Vercel Preview deployment `6806732650` is **success**. Do not reuse run ids from `954aa554`. This remains a Draft. No Ready, no merge, and no model-review slice from this writer.

**STOP for Technical-Lead R2 of the exact pushed tip.**
