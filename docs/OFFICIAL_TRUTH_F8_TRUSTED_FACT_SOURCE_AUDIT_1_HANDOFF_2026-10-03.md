# Official Truth F8 Deterministic Trusted-Fact Source Audit 1 — Handoff

Date: 3 October 2026
Issue: #769
Draft PR: #771
Branch: `docs/official-truth-f8-trusted-fact-source-audit-1`
Baseline: `main@6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`
Task: `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth F8 deterministic trusted-fact source audit 1**, Generation 1
Required model: Grok 4.7 High Fast (`grok-4.7-high-fast`), not Auto
Session: https://cursor.com/agents/bc-9de46031-8655-4c4a-93c4-2cdef9a4f27c
`originalModelName`: `grok-4.7-high-fast`

This handoff is continuity for the next reader. It is not a Technical-Lead PASS, not Ready, and not a merge.

## State

Read-only audit against `main@6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa` (`Merge #767`). At fetch the branch was the task seed plus zero commits behind `origin/main`. Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.

No runtime, test, migration, or global current-state file was edited. The task file was not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited because the task allows only this trio. F8 was not implemented. Issue #768's composition and API were not decided. #626 was not touched. `requirementsProviderAus()` remains `null`.

## Finding

No current fact kind can supply `trustedRuleFact` from a deterministic, server-reproved, non-model source. `regelKandidatAkzeptieren` already ignores `proposal` and reads only `trustedRuleFact`. Nothing in merged code can build that object from accepted Evidence, the validity window, the extraction note, the snapshot hash, the witness, or a suggestion.

The acceptance function will still store a `trustedRuleFact` that happens to be the proposal object. That is a caller copy, not an extractor. A mismatch check against `proposal` is not a source.

| Fact kind | Outcome |
| --- | --- |
| `requirement_effect` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` |
| `visa_options` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` |
| `stay_limit` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` |
| `passport_validity` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` |
| `blank_passport_pages` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` |
| `transit_conditions` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` |
| `official_actions` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` |
| `temporal_rule` | `REQUIRES_SEPARATE_DETERMINISTIC_EXTRACTOR` |

`blank_passport_pages` is the smallest schema. It is not derivable today. `officialAktionAusQuelle` and `visaModeLesen` are not fact sources. The evidence window is not a temporal rule.

The smallest next prerequisite class, not started here, is one fail-closed deterministic extractor for a named fact kind. It must cover every field `regelFaktLesen` requires and must not trust the proposal, a model, a plugin, or a suggestion. The Technical Lead synthesizes this audit with Issue #768 before dispatching any F8 runtime writer.

Detail, line citations, and the reproduction JSON live in `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_REPORT_2026-10-03.md`.

## Next step

Independent Technical-Lead exact-head review of this branch tip. Cursor does not Ready or merge and does not start a follow-up slice.
