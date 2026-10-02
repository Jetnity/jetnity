# Official Truth Accepted Evidence Refresh Diff Bridge 2 — Report

Date: 2 October 2026
Issue: #718
Draft PR: #721
Branch: `feat/official-truth-accepted-evidence-refresh-diff-2`
Baseline: `main@708a77defa5092e43d5dec991aa09a77e34822db`

Logical agent: **Jetnity Official Truth accepted Evidence refresh diff bridge 1**, Generation 2
Session: https://cursor.com/agents/bc-c3e95ea4-a1a2-4c0c-b7da-74217ca6c160
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

Generation 1 / Draft PR #719 is superseded. Its head is not reused.

## Result

`officialTruthAkzeptierteEvidenceAuffrischungVergleichen` in `lib/readiness/official-truth-refresh-diff.ts` answers one question: has the normalized official source text changed since an accepted Evidence version that this call re-proves from the original retrieval envelope?

The function takes five `unknown` arguments: the baseline envelope, the baseline injected clock, the baseline extraction, the refreshed envelope, and the refreshed injected clock. It has no Evidence parameter. The Generation-1 input name `bestehend` is not an API.

- The baseline is re-proved only by `officialTruthAkzeptierteEvidenceAusAbruf`. Anything other than `accepted_evidence` returns that closed reason.
- The same baseline envelope and clock are then passed through `officialTruthAbgerufenMaterialPruefen`. The request key and rule-scope key come from that receipt. The receipt may name the accepted version only when the source is `official_authority`, the source id matches, `regelScopeAusEvidenceScope` on the accepted scope returns the receipt's rule-scope key, and `evidenceVersionenVergleichen` says the normalized text is unchanged. Otherwise the result is `invalid_context`.
- The refreshed envelope and clock run through `officialTruthAbgerufenMaterialPruefen` on their own. A blocked receipt is returned unchanged.
- A successful refreshed receipt with another source id is `different_official_source`. Another rule-scope key is `different_rule_scope`. The source is checked first.
- The content decision is only `evidenceVersionenVergleichen(acceptedEvidence, { sourceContentHash: refreshedReceipt.sourceContentHash })`. `contentChanged`, `laterAnalysisShortCircuit` and `ruleChange` are that function's values. `ruleChange` must stay `not_asserted`. The short-circuit flag must stay the opposite of `contentChanged`.

Success is `unchanged_source_content` or `changed_source_content`. The fields are `baselineVersionId`, `baselineRequestKey`, `refreshedRequestKey`, `ruleScopeKey`, `sourceId`, `contentChanged`, `laterAnalysisShortCircuit` and `ruleChange`. The result does not carry a URL, a snapshot, a hash, a lookup key, candidate Evidence, or a rule effect.

Equal source content means the existing fingerprint of the normalized source text. Line endings are normalized by that fingerprint. A trailing space is a content change. Neither result reaffirms a rule, extends a prior Rule Claim, or says what entry requires.

## What landed

- The same normalized snapshot, including a CRLF line ending and a later `retrievedAt`, returns `unchanged_source_content`, `contentChanged: false`, `laterAnalysisShortCircuit: true` and `ruleChange: 'not_asserted'`. The version id, request key and rule-scope key are the re-proven values.
- A changed word, and a trailing space, return `changed_source_content` with short-circuit false. `ruleChange` stays `not_asserted`.
- Another fact kind and another research reason keep the same rule-scope key, report both request keys, and still do not assert a rule.
- A caller-built accepted-looking Evidence object, a `{ bestehend }` wrapper, an envelope that carries that object or a caller hash, and a refreshed hash override cannot force `unchanged_source_content`. The real changed snapshot stays `changed_source_content`, and its version id is the re-proven id.
- An invalid baseline envelope, a candidate object, a forbidden extraction field, a reversed validity window and a rule-effect extraction field fail with the same closed object as #716.
- A licensed baseline fails as `source_not_official_authority` through that same path. A licensed refreshed envelope fails through #709 with that reason and does not reach the source comparison.
- Two eligible official sources with different source ids fail as `different_official_source`. Destination `TH`, and a second passport with issuing country `RS` and related citizenship `RS`, fail as `different_rule_scope`. Swapping the citizenship order `RS`/`CH` stays the same cell and can be unchanged.
- A caller hash, a tracking parameter, a future `retrievedAt`, a missing clock, an empty snapshot and a personal key on the refreshed envelope fail with the #709 reason. The value is not echoed.
- Success and blocked JSON do not contain the URL, the snapshot, the content hash, a lookup key, or the personal value. The envelopes and the extraction object are not mutated.

## Traveller context

One call is one regulatory cell and one selected official source. The cell keeps every citizenship already on the research request. In the synthetic fixture that set is `CH` and `RS`. Input order does not split the cell. The issuing country stays the credential option's issuing country, and the related citizenship stays the explicit related code. Another passport is another rule scope and is not compared as if it were the same cell. This function does not rank those options and does not invent a visa, transit, health, carrier or document rule. `blocked` is not `not_required`. `unchanged_source_content` is not a current rule. Route Truth is not rebuilt here. The function stores no passport number, MRZ, scan, biometric, birth date, health record, name, email, account id, trip id or traveller note.

## Boundaries kept

- No edit to #709, #713, #716, `evidence.ts`, `rule-claims.ts`, the source registry, the source router, the store, the catalog, or global continuity.
- No database, network, provider, OpenAI, browser, cron, queue, UI or public API.
- No call to `evidenceKandidatAkzeptieren`, `evidenceKandidatAusModell`, `regelKandidatErstellen` or `regelKandidatAkzeptieren`.
- No `official_truth_store_accepted_v1` and no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates below were run on `2996b7cd91e2ef0f7b4b9380a1962d26f168982a` before this docs commit. `git fetch origin main` in this session resolved `origin/main` to `708a77defa5092e43d5dec991aa09a77e34822db`, which is the task baseline. Merge-base is that SHA. The runtime head was 0 behind and 4 ahead. Re-fetch before treating any later SHA as current.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-refresh-diff.test.ts` | 12/12 pass |
| `npm test` | 4360 pass / 0 fail, 754 suites |
| `npm run typecheck` | pass |
| eslint on the two new files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

PostgreSQL 16.15 was installed in this VM so the existing store proofs could run. The binary is `/usr/lib/postgresql/16/bin/postgres`. No database outside those throwaway clusters was contacted. This slice did not apply SQL. Development and Production were not touched.

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a baseline run id from `708a77de`.
