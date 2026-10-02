# Official Truth Refresh Source Identity Binding 1 — Report

Date: 2 October 2026
Issue: #756
Draft PR: #757
Branch: `fix/official-truth-refresh-source-identity-1`
Baseline: `main@ca40e5b2e133c938070a8d13aafcdcb66fa608fd`

Logical agent: **Jetnity Official Truth refresh source identity binding 1**, Generation 1
Session: https://cursor.com/agents/bc-4e3ac1cb-29d5-4121-b785-3492f94adfe2
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`officialTruthAkzeptierteEvidenceAuffrischungVergleichen` still answers only whether the normalized official source text changed. It now refuses to answer that question when the refreshed retrieval is a different canonical page or a different semantic registry identity.

The function still takes five `unknown` arguments: the baseline envelope, the baseline injected clock, the baseline extraction, the refreshed envelope, and the refreshed injected clock. It has no Evidence parameter and no hash parameter.

- The baseline is re-proved only by `officialTruthAkzeptierteEvidenceAusAbruf`. Anything other than `accepted_evidence` returns that closed reason.
- The same baseline envelope and clock then pass through `officialTruthAbgerufenMaterialPruefen`. The receipt may name the accepted version only when the source is `official_authority`, the source id matches, the accepted `canonicalUrl` equals the receipt `canonicalUrl`, the rule-scope key matches, and `evidenceVersionenVergleichen` says the normalized text is unchanged. Otherwise the result is `invalid_context`.
- The refreshed envelope runs through `officialTruthAbgerufenMaterialPruefen` on its own. A blocked receipt is returned unchanged.
- A successful refreshed receipt with another source id is `different_official_source`. Another rule-scope key is `different_rule_scope`. The source is checked first.
- The receipt `canonicalUrl` is the URL already returned by `quellenUrlAufloesen` / `quelleUrlLesen`. This slice does not call that normalizer again. A different normalized page is `different_official_page`.
- Registry identity is a module-local reading of the two envelopes. It includes every registered source id, source class, publisher name, authority name, the domain list in the order stored by `quellenRegistryErstellen`, and `blockedDomains` in the order stored by that builder. Equal values in different objects compare equal. Object reference equality is not used. An extra field, a missing field, or an unreadable shape is `different_source_registry`. This function does not call `quellenRegistryErstellen` and does not edit `source-registry.ts`.
- Content comparison runs only after the page and the registry identity match. The decision remains `evidenceVersionenVergleichen(acceptedEvidence, { sourceContentHash: refreshedReceipt.sourceContentHash })`. `ruleChange` must stay `not_asserted`. The short-circuit flag must stay the opposite of `contentChanged`.

Success is still `unchanged_source_content` or `changed_source_content`. The result fields are unchanged. The result does not carry a URL, a snapshot, a hash, a registry, or a rule effect. `unchanged_source_content` is not a current rule and is not proof that another page of the same authority stayed the same.

## What landed

- The same snapshot at `https://other.gov.example/other-page`, `https://gov.example/rules`, `https://www.gov.example/rules/`, or `https://www.gov.example/other` returns `different_official_page`. The same block is returned when the snapshot text also changed. The refreshed receipt is still `retrieved_material`, with the same source id and rule-scope key.
- `https://WWW.GOV.EXAMPLE/rules`, `https://www.gov.example:443/rules`, and a whitespace-padded copy of the baseline URL normalize to `https://www.gov.example/rules` and stay `unchanged_source_content`. `https://www.gov.example/rules/.` normalizes to the same canonical URL as `https://www.gov.example/rules/` and stays unchanged. `ruleChange` stays `not_asserted`.
- A publisher change, an authority change, another source's class change, an added domain, an added blocked domain, and an added source id each return `different_source_registry` for both the same snapshot and a changed snapshot. The refreshed receipt remains `retrieved_material` with the same source id, rule-scope key, and canonical URL.
- Changing the selected source to `licensed_evidence_provider` stays `source_not_official_authority`. Replacing the page domain stays `unregistered_domain`. Blocking `gov.example` stays `blocked_domain`. A changed authority whose descriptor still carries the old source stays `invalid_source_plan`. None of those become `unchanged_source_content` or `changed_source_content`.
- Two registries built by separate `quellenRegistryErstellen` calls, with source input order, domain input order, and blocked-domain input order reversed, are not the same object and still produce `unchanged_source_content` or `changed_source_content` from the snapshot. A deep copy with a different key order does the same. A stored source-list reversal, a stored domain-list reversal, and a stored blocked-domain reversal return `different_source_registry`. An extra `trust` field on an otherwise valid registry returns `different_source_registry` even though the receipt itself is `retrieved_material`.
- A different page together with a different publisher returns `different_official_page`. The page check is before the registry check. Content equality does not override either mismatch.
- A different source id remains `different_official_source`. A different destination and a second passport remain `different_rule_scope`. Citizenship order `CH`/`RS` versus `RS`/`CH` stays one cell.
- A caller-built Evidence object, a caller hash, and a refreshed hash override still cannot force `unchanged_source_content`.

## Traveller context

One call remains one regulatory cell and one selected official source. The cell keeps every citizenship already on the research request. In the synthetic fixture that set is `CH` and `RS`. Input order does not split the cell. Another passport is another rule scope. This slice does not collect a new credential, does not rank options, and does not invent a visa, transit, health, carrier, or document rule. `blocked` is not `not_required`. Route Truth is not rebuilt here.

## Boundaries kept

- No edit to the #755 server-held registry module, the source catalog gateway, `source-registry.ts`, `source-router.ts`, #709, #713, #716, `evidence.ts`, or `rule-claims.ts`.
- No database, network, provider, OpenAI, browser, cron, queue, UI, or public API.
- No route, Server Action, migration, store write, or Auth/RLS/capability change.
- No call to `evidenceKandidatAkzeptieren`, `evidenceKandidatAusModell`, `regelKandidatErstellen`, or `regelKandidatAkzeptieren`.
- `requirementsProviderAus()` stays `null`.
- F2 and F4 through F9 are untouched. #741 is not implemented. #626 is untouched.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited by this slice. The merge took main's #754 status text unchanged. This report and the handoff are the continuity for the slice.

## Validation

The first local gates were run on `aaa297bfa83caeb1ef07057b0d73ccdf358ff219` before the first docs commit. At that time `origin/main` was `ca40e5b2e133c938070a8d13aafcdcb66fa608fd`, the task baseline. That runtime head was 0 behind and 2 ahead of that SHA. Those sentences were true then. They are not the review head after #754 merged.

## Final integration re-gate

`git fetch origin main` resolved `origin/main` to `7df2c9dc7c6679db74bb1476bc07366737f2c2b3` (`Merge #754: harden Guardian intelligence current-state lifecycle`). This branch merged that SHA. The integration commit is `0cb661586700e332313e7de6be4167276c9a985e`. It was 0 behind and 4 ahead of that `main`. Re-fetch before treating a later SHA as current.

`lib/readiness/official-truth-refresh-diff.ts` and `lib/readiness/official-truth-refresh-diff.test.ts` are unchanged from `aaa297bf`. The Guardian current-state files and the other #754 paths match `origin/main` with an empty diff. This slice did not edit them.

The gates below were rerun on `0cb66158` before the integration docs commit.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-refresh-diff.test.ts` | 16/16 pass |
| `npm test` | 4429 pass / 0 fail, 760 suites |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the two changed files |
| `npm run build` | pass, Next.js 16.3.8, 25 static pages |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_source_catalog_v1` and `official_truth_store_accepted_v1`. This slice did not add an RPC. |

PostgreSQL 16.15 was installed in this VM so the existing throwaway catalog and store proofs could run. The binary is `/usr/lib/postgresql/16/bin/postgres`. No database outside those throwaway clusters was contacted. This slice did not apply SQL. Development and Production were not touched.

## Not claimed

No Ready. No merge. No Development apply. No Production mutation. No provider activation. No live refresh endpoint. No follow-up slice. `unchanged_source_content` does not mint Rule truth.
