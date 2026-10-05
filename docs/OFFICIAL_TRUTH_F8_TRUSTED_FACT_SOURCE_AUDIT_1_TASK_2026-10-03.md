# Official Truth F8 Deterministic Trusted-Fact Source Audit 1 — Task

Date: 3 October 2026
Issue: #769
Baseline: `main@6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`
Branch: `docs/official-truth-f8-trusted-fact-source-audit-1`
Logical agent: **Jetnity Official Truth F8 deterministic trusted-fact source audit 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## Purpose

Perform a read-only adversarial truth-source audit for the remaining merged #749 F8 blocker after F7 merged as PR #767.

Do **not** implement F8 and do not invent legal truth.

The question is narrow:

> For each current Rule fact kind, does current merged Jetnity possess a deterministic, server-reproved, non-model source from which a later autonomous path could construct `trustedRuleFact` without copying or trusting the Rule Candidate `proposal`?

## Binding baseline

Read live main first, then at minimum:

- `docs/JETNITY_ENTRY_REQUIREMENTS_OFFICIAL_TRUTH_AUTONOMY_DIRECTIVE_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_ACCEPTANCE_PRECONDITIONS_ADVERSARIAL_AUDIT_1_REPORT_2026-10-02.md` — F8
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_FRESHNESS_AUTHORITY_WITNESS_1_REPORT_2026-10-02.md`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/official-truth-retrieved-material.ts`
- `lib/readiness/official-truth-retrieved-candidate-evidence.ts`
- `lib/readiness/official-truth-accepted-evidence.ts`
- `lib/readiness/official-truth-rule-candidate.ts`
- `lib/readiness/official-truth-rule-review-packet.ts`
- current tests that prove proposal/trusted-fact separation

Live evidence wins.

## Audit every fact kind

Audit all current `RegelFaktArt` values:

1. `requirement_effect`
2. `visa_options`
3. `stay_limit`
4. `passport_validity`
5. `blank_passport_pages`
6. `transit_conditions`
7. `official_actions`
8. `temporal_rule`

For each fact kind, record:

- exact fields required by `regelFaktLesen` / the fact parser;
- which of those fields exist in accepted Evidence/provenance/scope/validity today;
- which exist only in the untrusted Rule Candidate `proposal`;
- whether source snapshot text contains possible material but lacks a deterministic parser/semantic proof;
- whether any existing non-model deterministic transformation already produces the complete fact;
- whether autonomous `trustedRuleFact` is **currently derivable without proposal/model trust**.

Use one of these outcomes per fact kind:

- **CURRENTLY_DETERMINISTIC**
- **NOT_CURRENTLY_DERIVABLE**
- **REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR**
- **REQUIRES_PRODUCT_POLICY_DECISION**
- **NOT_APPLICABLE_TO_INITIAL_AUTONOMY_POLICY**

Do not infer a fact merely because the source snapshot likely contains prose about it.

## Critical invariants

Prove or refute:

- `regelKandidatAkzeptieren` ignores `proposal` when building the accepted fact.
- `trustedRuleFact` is a separate value and is the only fact source at acceptance.
- accepted Evidence primarily proves provenance/scope/retrieval/validity, not necessarily the complete structured Rule fact.
- extraction metadata `validFrom`, `validUntil`, `extractionNote` is not automatically a Rule fact.
- a source snapshot is official evidence text, not itself a deterministic structured fact.
- model/plugin/suggestion agreement cannot substitute for a deterministic fact extractor.

## Initial autonomy recommendation

Based strictly on current code, answer:

1. Is **any** fact kind safe for autonomous acceptance today without a new deterministic fact extractor/policy?
2. If yes, identify the exact existing deterministic source/function and prove full-field coverage.
3. If no, state that clearly and propose the **smallest next prerequisite class**, but do not implement it.
4. If only a subset could be safely targeted first, define that subset and why the others remain blocked.
5. Do not choose legal semantics, default values, visa outcomes, durations, eligibility, transit conditions, passport rules or actions that are not already deterministically represented.

## Relationship to F8

This audit does not decide the composition/API mechanics owned by Issue #768. It only evaluates fact-source truth.

The TL will synthesize #768 and #769 before dispatching any F8 runtime writer.

## Allowed files

Create only:

- `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-03.md`

Do not edit this task file.
Do not edit any runtime/test/migration/global-current-state file.

## Hard boundaries

No runtime change.
No tests changed.
No migration or Supabase mutation.
No Auth/AAL/role/RLS change.
No route/UI/store.
No provider/model/plugin/live API call.
No secrets/cost.
No #626 work.
No F8 implementation.
No follow-up slice.
Stay Draft.
Do not Ready or merge.

## Validation / STOP

- fetch live main;
- finish 0 behind;
- inspect sufficient exact code/test evidence;
- `git diff --check`;
- operating-mode guard;
- changed files must be only the three audit outputs plus this TL-owned seed already present;
- push exact review head;
- report session id and `originalModelName`;
- STOP for independent Technical-Lead review.
