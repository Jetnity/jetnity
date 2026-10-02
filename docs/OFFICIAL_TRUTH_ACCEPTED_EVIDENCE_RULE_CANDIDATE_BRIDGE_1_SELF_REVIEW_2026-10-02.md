# Official Truth Accepted Evidence → Rule Candidate Bridge 1 — Self-Review

Date: 2 October 2026
Issue: #715
Draft PR: #717
Branch: `feat/official-truth-accepted-evidence-rule-candidate-bridge-1`

Logical agent: **Jetnity Official Truth accepted Evidence rule candidate bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-2dc2eeae-983e-4e63-a2cc-0125b9b32fe4
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `16f3a8d631bb823c9daafc724df67c000dcb5985` is the task seed plus:

- `lib/readiness/official-truth-rule-candidate.ts`
- `lib/readiness/official-truth-rule-candidate.test.ts`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `evidence.ts`, `rule-claims.ts` and `source-registry.ts` were not edited. The task said to stop if the bridge needed a change to those contracts. It did not. Acceptance of Evidence stays `akzeptierteEvidenceLesen`. The cell stays `regelScopeAusEvidenceScope`. The candidate stays `regelKandidatErstellen`.

## What I checked in the bridge

- One accepted `gov.example` authority version plus an explicit `requirement_effect` proposal returns the same object `regelKandidatErstellen` returns for that cell and that version id. Lifecycle is `candidate`. Validation state is `pending`. The key equals `regelScopeAusEvidenceScope`. The scope has no `sourceId`. Citizenship remains `CH` and `RS` even when the fixture lists `RS` first. The issuing country stays `CH` and the related citizenship stays `CH`. The input JSON is unchanged and the Evidence object stays unfrozen.
- Two accepted authorities, `gov.example` and `interior.example`, with a composed proposal return a pending candidate whose support ids are the sorted version ids. Both official source ids remain recoverable from those ids. One version with composed quality is `insufficient_support` from the constructor. Two versions of the same official source make the constructor succeed and make this bridge return `same_source_composition` with no `kandidat`.
- A version that `evidenceKandidatAusModell` built and that was not accepted fails `evidence_not_accepted`. `akzeptierteEvidenceLesen` on it is null.
- An accepted `provider.example` licensed version still passes `akzeptierteEvidenceLesen` and fails here as `primary_source_required`.
- A second passport, issuing country `RS` and related citizenship `RS`, keeps the same citizenship set and fails `scope_mismatch`. The failure JSON does not contain the country code.
- The same accepted version twice fails `support_mismatch`. The array order is unchanged. An empty array fails `invalid_support`.
- Supplying `scope`, `key`, `supportVersionIds`, `lifecycle`, `validationState` or `trustedRuleFact` beside the three allowed fields fails `unexpected_fields`, including when `lifecycle` is `candidate`, `validationState` is `pending`, and the key matches the derived cell. The trusted marker is absent from the result.
- Passport, document, MRZ, scan, birth date, health, name, email, account, user, trip, traveller note and a nested passport number return `personal_identifier_forbidden` without the value and without the key name.
- `research_gap` with a non-null proposal fails `research_gap_proposal_forbidden`. The proposal text is absent from that result.
- `stale_primary_evidence`, `unresolved_conflict` and `research_gap` return pending candidates. Their quality is unchanged. The gap proposal is null. The result JSON does not contain an accepted lifecycle.
- The runtime file calls `akzeptierteEvidenceLesen`, `regelScopeAusEvidenceScope` and `regelKandidatErstellen`. It does not contain `regelKandidatAkzeptieren`, a hand-built lifecycle assignment, `not_required`, a store or catalog RPC, `requirementsProviderAus`, `Date.now`, `new Date`, `fetch`, or an engine, provider, store or catalog import. `evidence.ts`, `rule-claims.ts` and `source-registry.ts` do not import this module. `requirementsProviderAus()` is still `null`.

## Boundary choices a reviewer should see

1. Success returns the constructor result. A later guard checks candidate/pending, the derived key, the sorted support ids and the unchanged fact kind and quality. On the current unmodified constructor that guard passes. If it ever failed, the bridge would return a closed reason and would not invent a replacement candidate.
2. The personal-key set is copied from `rule-claims.ts`. The note set is copied from the retrieval bridge. Both are module-private. Exporting them would have edited those files, which this task forbids. Note keys use the existing `personal_identifier_forbidden` reason, so this slice adds no error union.
3. A research gap still needs one accepted official version, because the rule key is derived from Evidence and the caller cannot supply scope. The gap proposal stays null. The support id records which cell was examined. It is not an upgrade to explicit or composed quality, and this slice does not accept it.
4. Same-source composition is rejected here, after the constructor has already allowed the support count. The acceptance function would later return `same_source_composition`. Returning that candidate would present a composed claim whose sources are not distinct. The failure carries no candidate. When the sources are distinct, every version id stays on the candidate for a later acceptance review.
5. Caller lifecycle and key are rejected even when they are the values the constructor would have written. The constructor accepts a matching `lifecycle` and `key`. This bridge does not forward them.
6. The citizenship set is kept whole. A different credential option is a different cell. Route Truth is not rebuilt here.
7. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
8. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Tests and gates

Focused file: 10/10 pass. Full `npm test` on `8d09efd1d054cbd549f2e7339896a4a2ec37b5e4`: 4340 pass / 0 fail, 752 suites. Typecheck, lint, build, diff check, operating-mode guard and the hygiene checks passed. Lint reports 0 errors and 148 pre-existing warnings, none in the new files. Schema reference still lists the three already known unapplied RPCs. This slice added none.

The first full test run failed only the two existing throwaway PostgreSQL proofs, because `initdb` for PostgreSQL 16 was not on the machine. After installing PostgreSQL 16.15 locally, the same suite passed. Those clusters are local and temporary. No remote database was contacted.

## Final base re-gate

Technical-Lead R1 accepted `807fe1e6668618e9094046f58d341dc089cb5853`. No code change was requested, and none was made to this bridge or to #716.

`origin/main` at the re-gate was `6b7f92be217bdc5b7463c7699fc2ac585a7a27cf`. Merge `28487fdbe5de49041d6260a624173c353f5aa726` contains that commit. `git diff origin/main` on the six #716 paths is empty. After the merge the branch was 0 behind and 4 ahead.

On `28487fdb`: focused tests 10/10, `npm test` 4348 pass / 0 fail across 753 suites, typecheck pass, lint 0 errors and 148 pre-existing warnings, build pass, diff check pass, operating-mode guard PASS, and the hygiene checks pass. Schema reference still lists the three already known unapplied RPCs.

## Stop line

The re-gate docs commit is not a behavior change. GitHub CI, the Auth job and Vercel Preview belong to the pushed tip after that commit. Do not reuse the R1 run ids from `807fe1e6`. This remains a Draft. No Ready, no merge, and no follow-up acceptance or persistence slice from this writer.

**STOP for final Technical-Lead review of the exact pushed tip.**
