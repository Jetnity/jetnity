# Official Truth Non-Authoritative Review Suggestion Contract 1 — Self-Review

Date: 2 October 2026
Issue: #728
Draft PR: #730
Branch: `feat/official-truth-review-suggestion-contract-1`

Logical agent: **Jetnity Official Truth non-authoritative review suggestion contract 1**, Generation 1
Session: https://cursor.com/agents/bc-bb1255f3-36c2-41b1-907b-b23ef08cbf04
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

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

- One `gov.example` envelope with `supports_candidate` returns the #726 `reviewPacketKey` and the same rule-scope key. The cited ids equal the sorted support version ids. The output keys are only `status`, `reviewPacketKey`, `ruleScopeKey`, `assessment`, `citedSupportVersionIds`, `reasonCodes` and `reviewNote`. The snapshot, the canonical URL, the content hash and `electronic_visa` are absent. The input JSON is unchanged. `requirementsProviderAus()` is still `null`.
- Omitted `reviewNote` and explicit `null` both return `reviewNote: null`. A padded note is trimmed. A 500-character note is kept. A 501-character note, a whitespace-only note, and a note containing `sk-live-should-not-echo` fail `invalid_review_note` without the note text.
- `contradicts_candidate`, `insufficient_evidence` and `needs_human_review` bind to the same key when the packet is unchanged. An empty citation list and an empty reason-code list do the same. A `research_gap` packet with a null proposal receives a different key and still returns only a review suggestion.
- Two accepted authorities reversed return the same key. Citations and reason codes supplied in reverse order come back sorted.
- An id outside the packet fails `citation_not_in_packet`. A repeated id fails `duplicate_citation`. An empty string and a non-string citation fail `invalid_support`. A repeated reason code fails `duplicate_reason_code`. The id, the real key and the snapshot are absent.
- `accepted`, `trusted_rule_fact`, a padded assessment, an unknown reason code and a missing reason-code field fail closed. The unknown code is absent.
- Personal keys on the suggestion, in the note text, in metadata and on the support shell fail closed. The secret and the key name are absent. A nested `passportNumber` fails `personal_identifier_forbidden`.
- Passing the packet object, the fingerprint, the real `reviewPacketKey`, the real rule-scope key, the real support ids, the support shells, or a trusted-fact field returns a blocked result. The real key, the content hash, the snapshot and the trusted marker are absent. `null` fails closed.
- The Swiss passport and the Serbian passport, both keeping citizenship `CH` and `RS`, return different keys. Citing the other cell's support id fails `citation_not_in_packet` without the id or the country codes. Passing both supports fails `scope_mismatch` without the country codes.
- A frozen citation array supplied in reverse order is not mutated. The output citations are sorted.
- The runtime file's only imports are the #723 packet and the #726 fingerprint. It calls both. It does not call rule acceptance, `sha256Hex`, `evidenceQuellenFingerprint`, `Date.now`, `new Date`, `fetch`, or a provider. The existing runtime files named in the test do not import this module.

## Boundary choices a reviewer should see

1. A blocked #723 object is reduced to `{ status: 'blocked', reason }` with the packet reason. This slice does not attach a key to a failure and does not echo the rejected value.
2. After both re-runs, `ruleScopeKey` and the sorted support version ids must agree across the packet candidate, the packet supports and the fingerprint. A mismatch returns `packet_fingerprint_mismatch` and no suggestion. On the current unmodified #723/#726 pair that guard passes. This slice does not edit those modules to force a disagreement.
3. Duplicate citations and duplicate reason codes fail closed. They are not silently collapsed. Unsorted input is sorted only after the values are unique and allowed.
4. Citation membership uses the re-proven fingerprint ids, which have already been checked against the packet. A caller support-id list under any other name is an unexpected field.
5. `reviewNote` is measured before trim at 500 characters, then trimmed. A sensitive key token in the note fails. The stable reason `invalid_review_note` contains the letters `note`; the failure object is exactly that reason, so the note text is not copied out.
6. The validator does not compare the assessment with the page text. `supports_candidate` together with `support_text_conflicts_candidate` is still a schema-valid suggestion. Deciding whether the page actually supports the candidate is a later reviewer. This function must not be treated as that decision.
7. Personal keys are scanned on the whole input, including inside `packetInput`, before the re-run. A tree deeper than 16 levels fails `unexpected_fields` so an unscanned tail cannot hide a key.
8. One suggestion is one cell. A second credential option is a different key. Route Truth is not rebuilt here.
9. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
10. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Tests and gates

Focused file: 9/9 pass on `f3132973e6aa5c14d49e726c7b787a9ed0a9779a`. Full `npm test` on that SHA: 4390 pass / 0 fail, 757 suites. Typecheck, lint, build, diff check, operating-mode guard and the hygiene checks passed on `c5480cd0e66aae0123a18d45b606e1aa9887b0fc`. That commit and `f3132973` have the same production files. Lint reports 0 errors and 148 pre-existing warnings, none in the new files. Schema reference still lists the three already known unapplied RPCs. This slice added none.

PostgreSQL 16 was not on the machine at the start. After installing PostgreSQL 16.15 locally, the suite passed, including the existing throwaway cluster proofs. The package cluster was not started. Those proof clusters are local and temporary. No remote database was contacted. This slice did not apply SQL.

## Stop line

The docs commit after `f3132973` is not a behavior change. GitHub CI, the Auth job and Vercel Preview belong to the pushed tip after that commit. Do not reuse run ids from `c5480cd0` or `f3132973`. This remains a Draft. No Ready, no merge, and no follow-up acceptance or model-review slice from this writer.

**STOP for final Technical-Lead review of the exact pushed tip.**
