# Official Truth applicability schema 2 — activity/stay architecture 1 — Report

Date: 5 October 2026 · Issue [#850](https://github.com/Jetnity/jetnity/issues/850) · Draft PR [#851](https://github.com/Jetnity/jetnity/pull/851)

**APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY**

## Delivery

The [architecture](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_2026-10-05.md) specifies a bounded source-neutral next contract. It expressly selects applicability/context schema 2; extending strict v1 with new meanings would not be backward safe. All new names are **PROPOSAL / NOT IMPLEMENTED**.

The selected delta has three new predicate kinds. Four independent activity characteristics preserve remuneration, income earning, profit-making business operation and business contacts. Planned-stay quantities retain day/month units and exact comparison polarity, with explicit unknown/open-ended dates and no inferred counting convention. National-passport character is an additional assertion attached to the existing document/citizenship relationship; issuer and ordinary class stay independent. A separate temporal v2 event deadline preserves strict application-before-actual-permission-expiry without inventing minutes or a pre-entry condition.

The document also specifies qualified stay/temporal fact carriers, strict parser/resource limits, three-valued evaluation, conflict handling, missing facts, provenance, canonical versioned fingerprints, exact extractor/policy output pins and rejection of v2 at the existing flat store. A future conformance matrix and exact candidate implementation paths are included as proposals only. No implementation or tests were written.

READY has the task's narrow meaning: a later separately versioned dormant implementation slice may be **considered by the Technical Lead** after independent exact-head review. The writer has not authorized or started it. This does not change either the UK or Japanese source-family NOT_READY conclusion.

## Authority, identity and startup evidence

| Item | Observed value |
| --- | --- |
| Logical writer | Jetnity Official Truth applicability schema 2 activity/stay architecture 1 |
| Generation | 1 |
| Repository / branch | `Jetnity/jetnity` / `docs/official-truth-applicability-schema2-activity-stay-1` |
| Baseline / live main at initial and content-freeze fetch | `2f27956cc9fd4289d30f258a5ee8eeaaa60aafec` |
| Immutable task seed / initial own remote head | `63c961520235a11d359486a4d49d6e94f99ba5a2` |
| Immutable TASK blob | `03dd34fa70e7f04640b2d33b0d6656a91c06a556` |
| TL dispatch | [PR #851 comment 6001156311](https://github.com/Jetnity/jetnity/pull/851#issuecomment-6001156311) |
| Session | `01a10d74-d842-7912-9e7f-d261352631b3` |
| Model / effort | `gpt-6-astra` / `xhigh`, verified from this session's local `turn_context`, not inferred from the task |
| Machine mode | `NORMAL`; mode file unmodified |
| #751 | Live active-writer section explicitly authorizes #851 and disjoint #853; ordinary commit/push authorized autonomously |
| #748 | Latest processed MATERIAL 5988971332, receipt 5989855107; 41-comment startup snapshot, no later MATERIAL |
| Parallel PR #853 at initial/content-freeze fetch | Draft, `3a8821af6f7b26156eeb0f31cd4df0e44ebe9a40`; current diff contains its immutable TASK only |

The initial repository was a new isolated clone under this session's `work/` directory; the other writer's checkout was not modified. No subagent/second writer was started. Issue #850, both Draft PRs, both current path sets, the full binding TASK, #294 and #741 were read. Older contradictory historical sections in #751 are superseded by its live active-writer section. #748 material is evidence only and grants no additional scope.

## Read coverage and architecture findings

The required current code reads covered `regulierungs-anwendbarkeit.ts` and tests, `rule-claims.ts`, `temporal.ts`, `traveller-kontext.ts`, `provider.ts`, both extractor/composition registries and `official-truth-store-server.ts`. The #845 and #849 audit findings, Issue #294 target, #741 gate context and repository governance/product/truth guidance were checked against that code. The architecture's §2 records the resulting implementation constraints rather than claiming that historical docs are current runtime truth.

Material findings:

1. Existing citizenship linkage is useful and remains canonical; national-passport qualification needs one separate semantic fact.
2. Purpose and economic activity cannot be collapsed. Three similar activity phrases remain independent unless a source-specific mapping later establishes equivalence.
3. Whole-Trip dates are not automatically a jurisdiction visit. Exact civil-day arithmetic can be specified, but applying it requires an explicit official counting convention.
4. A strict expiry event is not representable by the current travel-anchor/minute-offset contract.
5. The store's current refusal is specific to schema-1 effect/visa facts; a later extension must explicitly refuse v2 stay/temporal carriers too. Otherwise a partial implementation could flatten qualifiers.
6. Representability does not close source-law ambiguities, source identity/retrieval, composition acceptance, missing context producers, persistence or F8.

Three current official MOFA pages were spot-checked using the web reader solely to corroborate already audited semantics; the linked prior audit remains the detailed receipt inventory. No complete-byte retrieval/hash, Jetnity server retrieval, legal completeness or accepted Evidence is claimed for those spot-checks. No raw source body or source fixture is committed.

## Validation and file boundary

Validation is documentation-only: immutable TASK identity, exact path set, no changed implementation bytes, zero parallel-path intersection, clean diff formatting, local operating-mode guard and manual adversarial contract review. No local application tests/build are claimed, and no test file was changed. Automated CI/build and Vercel checks are read after the final push on the exact remote head.

Pre-commit checks passed: the staged delivery contains exactly four new allowed documents; the diff against live main is exactly the five allowed paths; working-tree and committed TASK blobs match the immutable identity; both staged and main-relative `git diff --check` are clean; `node scripts/operating-mode-guard.mjs` reports PASS. All 11 local Markdown links resolve, code fences are balanced, all 64 proposed conformance-case IDs are unique, and all 14 named future candidate paths exist. These are document/identity checks, not execution of those 64 proposed cases. Intersection with both #853's current paths and its full five-path reservation is empty.

The five-path PR diff consists of the immutable TASK plus four new delivery documents, all under `docs/`:

```text
OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_TASK_2026-10-05.md
OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_2026-10-05.md
OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_REPORT_2026-10-05.md
OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_HANDOFF_2026-10-05.md
OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_SELF_REVIEW_2026-10-05.md
```

The other writer owns the corresponding five paths under prefix `docs/OFFICIAL_TRUTH_JP_CONTENT_IDENTITY_RETRIEVAL_QUALIFICATION_1`. All five are reserved here even when its current Changed Files contains only its TASK. The sets are disjoint. Live path/head/main/mode checks must also pass immediately before push and be rechecked at final delivery; any overlap is a STOP, never a coordination excuse to edit its files.

This committed report is a content-freeze record. The final remote head, actual merge-base/ahead/behind and CI/Vercel receipt are reported after push with that exact SHA in the delivery evidence. The commit cannot contain its own hash or the result of CI triggered by its own future push. Seed-head CI is not substituted for delivery CI.

## Remaining gates, security and cost

No runtime, schema implementation, tests, database/Supabase action, migration, source/profile registration, extractor/policy activation, accepted Evidence, Rule acceptance, F8, Production, CH import, CH-11 or Trip Workspace/B01 mutation occurred. No provider/model API integration or paid source call was introduced. No new recurring infrastructure cost or privilege change is introduced. No personal traveller data, credentials, raw private session content, passport numbers, permit numbers or scans are included.

The architecture intentionally leaves legal classification edge cases, month arithmetic, actual event intake, complete UK school/status coverage and Japanese extension/class evidence unsupported. Its READY classification is bounded by those explicit refusals. Independent review must assess that boundary and the v1 compatibility guarantees, not infer a usable travel rule from green CI.

Final classification: **APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY**.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** PR remains Draft; no Ready, merge or follow-up.
