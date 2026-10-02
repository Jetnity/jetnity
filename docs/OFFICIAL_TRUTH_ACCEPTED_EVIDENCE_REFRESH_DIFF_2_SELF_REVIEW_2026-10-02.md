# Official Truth Accepted Evidence Refresh Diff Bridge 2 — Self-Review

Date: 2 October 2026
Issue: #718
Draft PR: #721
Branch: `feat/official-truth-accepted-evidence-refresh-diff-2`

Logical agent: **Jetnity Official Truth accepted Evidence refresh diff bridge 1**, Generation 2
Session: https://cursor.com/agents/bc-c3e95ea4-a1a2-4c0c-b7da-74217ca6c160
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `708a77defa5092e43d5dec991aa09a77e34822db` is the task seed plus:

- `lib/readiness/official-truth-refresh-diff.ts`
- `lib/readiness/official-truth-refresh-diff.test.ts`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_2_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_2_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_2_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `official-truth-retrieved-material.ts`, `official-truth-retrieved-candidate-evidence.ts`, `official-truth-accepted-evidence.ts`, `evidence.ts`, `rule-claims.ts`, `source-registry.ts` and `source-router.ts` were not edited. The task said to stop if the bridge needed a change to those contracts. It did not.

## What I checked in the bridge

- The public function has five `unknown` parameters and no `bestehend` parameter. A fabricated accepted Evidence object, a one-object `{ bestehend }` wrapper, and an envelope that carries that object or a caller hash all block. Their JSON does not contain the hash or the fabricated version id.
- A real #702 request, a synthetic `gov.example` authority, a registered HTTPS URL, a past `Z` instant and a snapshot inside the existing fingerprint limit return `unchanged_source_content` when the refreshed snapshot differs only by CRLF and a later retrieval time. `contentChanged` is false. `laterAnalysisShortCircuit` is true. `ruleChange` is `not_asserted`. The version id, both request keys and the rule-scope key match the re-proven #716 version and the #709 receipts. The result keys are only the nine task fields.
- A changed sentence and a trailing space return `changed_source_content`, short-circuit false, and `ruleChange: 'not_asserted'`. The version id remains the baseline version. An extraction note on the baseline does not change that decision and is not copied out.
- `passport_validity` with `max_age_exceeded` keeps the `stay_limit` rule-scope key, reports a different request key, and still does not assert a rule. The fact-kind names are absent from the JSON.
- Invalid envelopes, a candidate Evidence object, the #713 wrapper, a foreign extraction key, a `not_required` extraction field and a reversed window deep-equal the #716 result.
- A `provider.example` baseline deep-equals #716 and #709 as `source_not_official_authority`. The same licensed envelope as the refreshed input deep-equals #709 and does not become `different_official_source`.
- `example-interior-authority` on `interior.example`, eligible for the same cell, returns `different_official_source`. Destination `TH` and an RS passport return `different_rule_scope` after #709 has already accepted those envelopes. Citizenship order `CH`/`RS` versus `RS`/`CH` stays unchanged. Both citizenships remain on the cell. The issuing country is not used as the only citizenship.
- Refreshed hash override, `utm_source`, a future instant, a null clock, an empty snapshot and the personal-key set return the #709 reason. The secret, the key name and the tracking name are absent.
- The runtime file calls #716, then #709 for the baseline receipt, then #709 for the refreshed receipt, then `evidenceVersionenVergleichen` with only `{ sourceContentHash: neuBeleg.sourceContentHash }`. It does not assign a lifecycle, a version id or a lookup key. It does not contain `not_required`, a rule or candidate constructor, a store or catalog RPC, `requirementsProviderAus`, `Date.now`, `new Date`, `fetch`, or an engine, provider, store or catalog import. The read-only modules do not import this file. `requirementsProviderAus()` is still `null`.

## Boundary choices a reviewer should see

1. #716 does not return the request key. The bridge therefore runs #709 again on the same baseline envelope and clock. That receipt is used only after `evidenceVersionenVergleichen` says its hash matches the accepted Evidence and the canonical rule scope matches. A caller field named `request.key` is not read by this file.
2. The content decision copies `contentChanged`, `laterAnalysisShortCircuit` and `ruleChange` from `evidenceVersionenVergleichen`. This file does not compare the two hashes with its own operator. If that function ever returned another `ruleChange`, or a short-circuit that disagreed with `contentChanged`, the bridge would return `invalid_context`.
3. The baseline bind has the same shape of guard. With the current unmodified #716 and #709 it passes whenever acceptance succeeded. If those two calls ever disagreed, the bridge would return `invalid_context` and would not compare the refreshed text.
4. `different_official_source` and `different_rule_scope` are returned only after the refreshed #709 call succeeded. A licensed, ineligible, tampered or personal refreshed envelope keeps the #709 reason. Source id is checked before rule scope.
5. Equal content is the existing source fingerprint. That fingerprint unifies CR and LF and does not trim. A newer `retrievedAt` or another fact kind does not become a rule change.
6. The success status names are discriminants. They are not entry effects. `blocked` drops every `fields` array from the downstream results.
7. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
8. `requirementsProviderAus()` is still `null`. This slice does not turn research on and does not store either version.

## Findings I am not calling done

1. Nothing in the engine, the requirements route, a browser or the store calls this function. That is the task boundary. A later slice must not compare a caller-built accepted object and must not treat `unchanged_source_content` as a current Rule Claim. Connecting the store, or building a Rule Claim from the refreshed text, is a separate task.
2. `docs/ACTIVE_WORK_STATUS.md` on this branch still points at an older writer. Updating it would edit global continuity, which this task forbids. The next reader should start with this handoff.
3. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on `2996b7cd91e2ef0f7b4b9380a1962d26f168982a` before this docs commit. `origin/main` is `708a77defa5092e43d5dec991aa09a77e34822db`. Merge-base is that SHA. The branch was 0 behind and 4 ahead.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-refresh-diff.test.ts`: 12/12 pass.
- `npm test`: 4360 pass / 0 fail. 754 suites. PostgreSQL 16.15 is present at `/usr/lib/postgresql/16/bin`. The store test files were not changed. No remote database was contacted.
- `npm run typecheck`: pass.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the three existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The pushed tip is the review head. GitHub CI, the Auth job and Vercel Preview belong to that tip. They are not copied from `708a77de` or from `2996b7cd`.
