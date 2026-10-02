# Official Truth Discovered URL Candidate Validator 1 — Self-Review

Date: 2 October 2026
Issue: #710
Draft PR: #712
Branch: `feat/official-truth-discovered-url-candidate-validator-1`

Logical agent: **Jetnity Official Truth discovered URL candidate validator 1**, Generation 1
Session: https://cursor.com/agents/bc-692c8c38-0c4e-492a-9036-20995a39e70e
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `3f4b1bfd5fe545c36fdc689cb0c6204b4287c403` is the task seed plus:

- `lib/readiness/official-truth-discovered-url-candidates.ts`
- `lib/readiness/official-truth-discovered-url-candidates.test.ts`
- `docs/OFFICIAL_TRUTH_DISCOVERED_URL_CANDIDATE_VALIDATOR_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_DISCOVERED_URL_CANDIDATE_VALIDATOR_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_DISCOVERED_URL_CANDIDATE_VALIDATOR_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `official-truth-research-request.ts`, `official-truth-research-source-routing.ts`, `official-truth-research-execution-plan.ts`, `source-router.ts`, `source-registry.ts`, `official-truth-retrieved-material.ts` and `official-truth-candidate-batch.ts` were not edited. The task said to stop if validation needed a change to those contracts. It did not. Eligibility and the hostname list come from the public #708 function. The URL trust boundary is the public `quellenUrlAufloesen`.

## What I checked

- A real #702 request, a synthetic `gov.example` authority, and `https://www.gov.example/rules` return that source id and the canonical URL from `quellenUrlAufloesen`. `https://portal.gov.example/guide` also passes, because the host sits under the allowlisted `gov.example`. `stay_limit` / `missing` and `visa_options` / `max_age_exceeded` return the same canonical URL.
- Two official sources submitted in reverse order come back sorted by source id, then by canonical URL. Both URLs for one source remain. There is no score and no publisher or authority name.
- A licensed id beside a ready official plan is `licensed_provider`. The provider id and hostname are absent from the blocked result. A licensed-only registry is `no_eligible_official_source` for the same reason #708 is not `ready`.
- An official source whose descriptor covers another destination is `source_not_in_plan`.
- A URL on another source that is on the plan is `another_source_url`. The pair is not rewritten.
- Unregistered, blocked, localhost, `.local`, `http`, and userinfo URLs keep the existing resolver reasons. The credential secret is absent from the result.
- Each required tracking name fails, in either case, and the result contains neither the value, the parameter name, nor a URL that kept `lang` after dropping the tracker.
- `lang` and `ref` remain on the returned canonical URL.
- Two identical URLs, and `HTTPS://WWW.GOV.EXAMPLE/rules` beside the already-canonical form, are `duplicate_canonical_url`. Two different paths both pass, in URL order.
- Sixteen distinct paths pass. Seventeen is `too_many_candidates`.
- A changed request key is `invalid_request`. A destination swapped under the old rule-scope key is `scope_mismatch`. A blocked hostname overlapping the registry row, and a descriptor publisher that no longer matches, are `invalid_source_plan`. A smuggled `plan` object is `invalid_envelope` and is not executed. The same inputs without that field follow #708 and return `no_eligible_official_source` when the descriptor covers another destination. A Serbian passport cell against the Swiss descriptor does not receive the Swiss URL.
- Personal keys on the envelope, on a pair, and a free-text `note` are `sensitive_personal_field`. The value and the key are absent from the result. A non-array candidate list is `invalid_candidates`. A pair with a missing or mistyped field is `invalid_candidate`. An empty list on a ready plan is an empty validated list.
- The input JSON is unchanged after a pass and after a tracking rejection.
- The runtime file calls `officialTruthRechercheAusfuehrungsplan(satz.request, satz.registry, satz.descriptors)` and `quellenUrlAufloesen`. It has one parameter. It does not contain `not_required`, a direct `quellenRouten(` call, `officialTruthRechercheQuellenRouten`, `officialTruthRechercheEntscheiden`, a candidate or claim constructor, a store or catalog RPC, `requirementsProviderAus`, or an engine, provider, evidence, store, catalog, receipt, or candidate-batch import. Its source has no provider name and no network call. `requirementsProviderAus()` is still `null`.

## Boundary choices a reviewer should see

1. The only plan call is `officialTruthRechercheAusfuehrungsplan(satz.request, satz.registry, satz.descriptors)`. There is no parameter for a pre-built plan. An extra `plan` key fails the exact envelope before that call.
2. `blocked_invalid` reasons from #708 are returned as those reasons. `no_eligible_official_source` stays that outcome. Candidate classification starts only after `ready`. A licensed-only registry therefore does not get a separate URL rejection.
3. On a ready plan, a licensed id is `licensed_provider` even though it is also absent from the plan. Any other absent id is `source_not_in_plan`.
4. Host coverage uses the #708 list for that source id: exact host, or a subdomain of one listed hostname. The resolved registry domain must also be a member of that list. `domain_not_allowlisted` is the failure when those two checks diverge. While #708 and `quellenUrlAufloesen` read one registry, a host that resolved to the planned source is covered by that list. The check remains in the function.
5. Tracking is tested on the submitted URL and on the canonical URL. The function never returns a URL with those parameters removed.
6. Duplicate detection uses the canonical URL after the tracking check. A second tracking URL fails as tracking. A second clean spelling of the same canonical URL fails as a duplicate. Different sources are not collapsed together.
7. More than 16 candidates fails after the personal-key scan and before per-item shape checks. A personal key inside a long list still fails as `sensitive_personal_field`.
8. An empty candidate list on a ready plan is `validated_url_candidates` with an empty list. It is not `no_eligible_official_source` and not an entry effect. The task's bound is `> 16`.
9. Success items are frozen and contain only `sourceId` and `canonicalUrl`. Sort order is source id, then canonical URL. That is not a preference or a default source.
10. Blocked results are frozen `{ status: 'blocked', reason }`. They do not echo URL credentials, tracking values, personal values, or source ids.
11. An arbitrary path on an allowlisted host can pass. This slice has no page list and does not fetch the path. A later discovery or fetch step, if a versioned task creates one, must not treat this result as Candidate Evidence or Official Truth.
12. Generic `ref` stays allowed, as the task requires, including when its value looks like a campaign token.
13. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
14. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Recommendation

Keep the next step as independent Technical-Lead review of the exact tip. Do not start discovery, fetch, or a candidate-evidence bridge from this result. The useful follow-on, only under a later versioned task, is a caller that proposes pairs and then stops at this validator. Path policy, if it is ever needed, is a separate decision because this task validates the host allowlist rather than a page list.

## Gate note

The first full test run failed two existing throwaway PostgreSQL proofs because `initdb` was absent. PostgreSQL 16 was installed in the agent environment only. The recorded `npm test` is the later clean run: 4322 pass / 0 fail. Details are in the report. Those two proofs are outside this slice's ownership and were not edited.
