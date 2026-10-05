# Official Truth GOV.UK ETA Semantic Reconciliation 2 — Handoff

Date: 5 October 2026
Issue: #838 · Draft PR: #839
Branch: `audit/official-truth-govuk-eta-semantic-reconciliation-2`
Baseline / merge base: `58d2781d4b48cfdc8f9131f374f90d9b96a10787`
Logical writer: **Jetnity Official Truth GOV.UK ETA semantic reconciliation 2**, Generation 1
Execution: Codex Desktop, `gpt-6-astra` / `xhigh`
Session: `01a10975-f354-71d0-8384-942a51f6f736`

**Status: docs complete; Draft; stopped for independent exact-head review.**

The review head is the pushed branch tip recorded in the PR delivery body, containing this handoff. Do not review task seed `60b58d0d54ca9c23ac8d799b0589e16d61904a20` as the final head. The seed plus one delivery commit is two ahead / zero behind the baseline; fetch again before accepting any later state.

## Read first

1. [Immutable task](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_TASK_2026-10-05.md).
2. [Audit and decision matrix](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_2026-10-05.md), especially §§3, 6, 7 and 8.
3. [Report](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_REPORT_2026-10-05.md) and [self-review](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_SELF_REVIEW_2026-10-05.md).
4. Current code symbols in audit E2–E9, #751 and #748 hosted-apply receipt 5985858310.

## Decision to preserve

`GOVUK_ETA_SEMANTIC_CHAIN_NOT_READY`. No real source family is selected. Predicate and composition foundations have landed; their absence is no longer a valid explanation. A complete and trusted ETA chain is nevertheless not available.

The minimum next recommendation is **ETA semantic contract closure**, not an implementation dispatch: resolve the national-passport qualification, actual Irish residence/application-time meaning, the stale `not origin IE` mapping, and the boundary between requirement effect and application/use eligibility. Preserve the age-16 evidence duty and unknown semantics. The audit's ordered later slices separately cover identity, CTA, source-family selection, extractor/policy, sole acceptance, sealed consumer, persistence and context. Their PO gates are explicit; no follow-up is started here.

## Findings the independent reviewer should challenge

- Existing `destination_permission` matches exact country/class. A missing class row is unknown. An expired document is not evidence of class-wide absence. Explicit negatives remain `context_asserted`, including when they decide `otherwise`.
- `lawful_residence` evaluates entitlement/departure but not actual residence or application time. The historical architecture excludes origin IE although the audited sentence describes travelling to the UK from elsewhere in CTA.
- BOTC/BNO are typed nationality statuses, not country-code membership. School-party predicates exist but have only user-asserted legal facts. National passport is not `ordinary`.
- CTA source research is complete but the runtime pin is empty; R2 now needs a content-identity binding on the pin. Known origin plus empty pin is a machine-side interpretability gap.
- National List and Appendix are distinct content items under `govuk`. Same authority is allowed after R2. Only National List is currently profiled/registered; its verifier intentionally rejects the Appendix.
- Both live policy/extractor registries are empty. Multi-item `equal_values` assignments cannot masquerade as complementary semantics.
- The private execution seal is not an accepted claim. Composed branches still fail `condition_provenance_ambiguous`; a later acceptance extension and sealed consumer are separate tasks.
- Accepted schema-1 facts still fail `applicability_not_persistable` before transport. SQL's flat payload/replay cannot preserve branches, and same-request currently does not deliver the full verified provenance to a persistence consumer.
- Base account/trip facts and proved route origins are reusable ingredients, not an existing complete regulatory context adapter. Workspace cannot truthfully emit a complete ETA decision today.

## Scope and evidence

Writer edits: exactly the audit, report, handoff and self-review. TASK Git blob: `c828bfd4a1736b2684d64e16fb79d0d3318bd596`, unchanged. No `lib/`, `app/`, tests, SQL, central status docs or #837-owned paths changed.

Local checks: 413 focused tests plus one selected store guard test passed; all six operating-mode/dead/export/dependency/API/schema hygiene checks passed; diff/link/scope checks passed. Full tests, typecheck, lint and build were not run for this docs-only change. See the report for exact commands/results and the delivery body for final-head CI status.

No government freshness fetch, hosted database access, Production mutation, source registration, Evidence/Rule operation, model/provider call from the application or new running cost. Development hardening completion/zero rule rows and Production v2 absence are attributed to the existing live Technical-Lead receipt, not to a new database observation by this writer.

## Stop boundary

Independent ChatGPT / Technical-Lead exact-head review is required by the binding task. No Ready, merge, policy/profile/region activation, runtime fix, F8, provider change, Production apply or new writer is authorized by this handoff. No other chat was messaged. Preserve Draft and wait for the reviewer's decision.
