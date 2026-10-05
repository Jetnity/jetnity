# Official Truth applicability schema 2 — activity/stay architecture 1 — Handoff

Date: 5 October 2026 · Issue [#850](https://github.com/Jetnity/jetnity/issues/850) · Draft PR [#851](https://github.com/Jetnity/jetnity/pull/851)

**APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY**

Logical writer: **Jetnity Official Truth applicability schema 2 activity/stay architecture 1**, Generation **1**. Session `01a10d74-d842-7912-9e7f-d261352631b3`; verified session model/effort `gpt-6-astra / xhigh`.

## Binding identity

- Branch: `docs/official-truth-applicability-schema2-activity-stay-1`.
- Baseline: `main@2f27956cc9fd4289d30f258a5ee8eeaaa60aafec`.
- Immutable seed: `63c961520235a11d359486a4d49d6e94f99ba5a2`.
- Immutable TASK blob: `03dd34fa70e7f04640b2d33b0d6656a91c06a556`.
- [Binding TASK](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_TASK_2026-10-05.md); [dispatch 6001156311](https://github.com/Jetnity/jetnity/pull/851#issuecomment-6001156311).
- Parallel writer: [#853](https://github.com/Jetnity/jetnity/pull/853), initially/content-freeze head `3a8821af6f7b26156eeb0f31cd4df0e44ebe9a40`. Its entire five-document namespace is excluded.

## What is delivered

The [architecture](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_2026-10-05.md) is the specification. The [report](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_REPORT_2026-10-05.md) records evidence/scope; the [self-review](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_SELF_REVIEW_2026-10-05.md) records challenges and limitations. All proposals are **NOT IMPLEMENTED**.

The explicit decision is that schema 2 is necessary. The delta separates activity characteristics from purpose, planned visit duration from granted stay, national-passport qualification from citizenship/issuer/link/class, and actual permission expiry from travel/reference times. A separate temporal v2 form preserves a strict before-expiry deadline. Qualified stay/temporal carriers prevent loss at the boundary. Old v1 semantics/fingerprints remain frozen; unknown versions and flat-store persistence fail closed.

The first unfinished task is **independent ChatGPT / Technical-Lead exact-head review of this Draft PR**. READY only permits the TL to consider a separate dormant implementation slice later. It does not dispatch that slice, accept a source family, select a rule or close any activation gate.

## Reviewer checks

1. Fetch live main and PR head; inspect #751, newer #748 MATERIAL, #850, #851 and #853. Verify no head/path movement invalidates the delivery receipt.
2. Check TASK blob against `03dd34fa70e7f04640b2d33b0d6656a91c06a556`; exactly five documents against merge-base, four new delivery files relative to seed; zero overlap with current #853 and its full reservation.
3. Review architecture §§4–8 particularly: independent activity terms, direct assertions versus legal classification, unknown versus open-ended dates, counting conventions, no month conversion, national passport versus ordinary class, strict expiry boundary and missing event handling.
4. Challenge §§8–9: conflict-before-short-circuit, three-valued otherwise behavior, v1 golden preservation, personal-value-free fingerprints/traces, exact pins and rejection of v2 stay/temporal at the flat store.
5. Check §10 conformance cases and §12 unsupported scope; ensure no existing #845/#849 source gap is mislabeled as resolved.
6. Inspect final exact-head CI and Vercel receipt. Green checks and this self-review are not an independent PASS.

The final delivery message/PR evidence identifies the remote SHA and observed CI/Vercel state **after** the push. This committed handoff deliberately does not pretend that future run results are already known. Any subsequent head change makes that receipt historical and requires re-gating.

## Preserved closed gates

No runtime/test/schema implementation; no DB/Supabase/migration; no source/profile registration; no real extractor or composition policy; no accepted Evidence, Rule acceptance or F8; no Production; no CH import/CH-11; no Trip Workspace/B01; no Ready/merge/follow-up. CH-01..CH-10 remain `RESEARCH_ONLY / NOT_APPROVED_FOR_DATABASE_IMPORT`. The provider remains null in current code. No hosted DB/Production read or write was part of validation.

Later context intake, exact event binding, legal mapping and persistence require separate authorization. The future candidate file list in architecture §11 is a proposal for TL scoping, not current writer ownership. No continuation is authorized merely by this document.

Final classification: **APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY**.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
