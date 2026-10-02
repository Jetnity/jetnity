# Official Truth Deterministic Trusted-Fact Extractor Architecture 1 — Handoff

Date: 3 October 2026
Issue: #773
Draft PR: #775
Branch: `docs/official-truth-deterministic-trusted-fact-extractor-architecture-1`
Baseline: `main@a7ad77743327c01821cf2532ca253a3220c857e8`
Task: `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth deterministic trusted-fact extractor architecture 1**, Generation 1
Required model: Grok 4.7 High Fast (`grok-4.7-high-fast`), not Auto
Session: https://cursor.com/agents/bc-e12b4f3e-b7f1-4b49-bc0d-54e57b90ff7a
`originalModelName`: `grok-4.7-high-fast`

This handoff is continuity for the next reader. It is not a Technical-Lead PASS, not Ready, and not a merge.

## State

Docs-only architecture against `main@a7ad77743327c01821cf2532ca253a3220c857e8` (`Merge #771`). At fetch the branch was the task seed plus zero commits behind `origin/main`. The local `main` ref before that fetch was the stale snapshot `c04964e7`. Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.

No runtime, test, migration, or global current-state file was edited. The task file was not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited because the task allows only the four architecture documents. The handoff is the continuity record. F8 was not implemented. No extractor was implemented. No CH batch was imported. #626 was not touched. `requirementsProviderAus()` remains `null`.

## Finding

Merged audit #771 still holds: none of the eight Rule fact kinds can supply `trustedRuleFact` from repository evidence. This architecture defines the deterministic contract that a later extractor must meet.

| Fact kind | Contract outcome |
| --- | --- |
| `requirement_effect` | Versioned extractor. Effect and visa mode must be explicit. No default `not_required` and no `visaModeLesen` fill. |
| `visa_options` | Versioned extractor. Each option needs a concrete mode, eligibility, and mandate. An omitted mode is not `not_allowed`. |
| `stay_limit` | Versioned extractor. Discretion and durations must be explicit. The evidence window is not a stay. Unknown qualifiers block. |
| `passport_validity` | Versioned extractor. Semantics must be a pinned label. No default `valid_on_entry`. |
| `blank_passport_pages` | Versioned extractor. One explicit integer. The 1–10 bound is not the count. Not selected as the first extractor. |
| `transit_conditions` | Versioned extractor. A transit country code is not a path. A missing boolean is not `false`. |
| `official_actions` | Versioned extractor. Purpose and href must both be explicit. `officialAktionAusQuelle` is forbidden. |
| `temporal_rule` | Versioned extractor. Anchor, relation, and offset must be explicit. The evidence window is not a relative rule. |

Next runtime classification: **`EXTRACTOR_FRAMEWORK_FIRST`**. No source family in the repository is structurally deterministic. The first later runtime step is a pure registry with fixtures. One source-specific extractor comes only after a separate re-fetch proves a pinned structure. F8 stays blocked until that extractor, the same-request proof graph, and a provenance record exist. This session starts none of those slices.

Autonomous claim provenance: support version ids are already stored and are not enough. Extractor id/version, policy id/version, and `reviewPacketKey` need a later audit record. That record is a separate schema slice. This architecture does not require a Production migration. Production apply remains a Product-Owner gate.

CH-01..CH-10 remain Candidate Evidence for 64 Swiss ordinary-passport destinations (Issue #294 comments `5935531376` and `5935581800`). Normalize and retain URLs, gaps, conflicts, and stale flags. Re-fetch before any extractor runs. Research-chat conclusions stay untrusted. CH-11 is not planned.

Detail and line citations: `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_REPORT_2026-10-03.md`.

## Next step

Independent Technical-Lead exact-head review of this branch tip. Cursor does not Ready or merge and does not start a follow-up slice.
