# Official Truth Common Travel Area Region-Pin Source Audit 1 — Task

Date: 4 October 2026
Issue: #804
Baseline: `main@ec798ab3b7738b3adc76d85ac8b5223e07e970d9`
Branch: `docs/official-truth-cta-region-pin-source-audit-1`
Logical writer: **Jetnity Official Truth CTA region-pin source audit 1**
Generation: **1**
Execution environment: **Codex Desktop**
Preferred model: **GPT-6 Astra — Sehr hoch**
Status: **DOCS-ONLY SOURCE AUDIT / NO RUNTIME REGISTRATION**

## Purpose

Prove or reject exactly one current official-source basis for the existing code-owned
`common_travel_area` region pin.

This slice must not register the pin. It exists only to determine whether the later
runtime registration can be deterministic, source-authenticated and fail-closed.

The existing runtime type is:

```ts
type RegulierungsRegionPin = {
  regionCode: 'common_travel_area'
  version: number
  memberCountryCodes: readonly string[]
  sourceId: string
  sourceContentHash: string
}
```

Live evidence overrides this task if repository state changes after the baseline.

## Binding startup / collision gate

Before material work:

1. fetch live `origin/main`;
2. confirm it is still `ec798ab3b7738b3adc76d85ac8b5223e07e970d9`, or STOP and report the newer SHA;
3. read `.jetnity/operating-mode.json` and require `NORMAL`;
4. read Issue #751;
5. read only #748 MATERIAL comments newer than marker `5971622750`;
6. inspect open PRs/writers;
7. confirm #804 / this branch is the only new Official Truth writer;
8. if another writer overlaps this scope, STOP without editing.

Read at minimum:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_REPORT_2026-10-03.md`
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/official-truth-server-owned-retrieval.ts`
- canonical country-code parser / validator and relevant tests.

Re-prove live facts. Do not rely on stale prose where code disagrees.

## Current live facts to re-prove

At task creation:

- `REGULIERUNGS_REGION_PINS` is `Object.freeze([])`;
- the only runtime region enum is `common_travel_area`;
- the GOV.UK ETA architecture requires that region for the Ireland/CTA exemption;
- a missing region pin yields fail-closed `region_membership_unpinned`;
- Production composition-policy registry is empty;
- Production trusted-fact extractor registry is empty;
- F8 remains OPEN;
- schema-1 remains non-persistable.

## Official-source research rule

Use **official state primary sources only**.

Strong starting candidates that must be re-fetched directly, not trusted from this task:

1. Home Office / GOV.UK immigration staff guidance:
   `https://www.gov.uk/government/publications/common-travel-area/common-travel-area-accessible`
2. GOV.UK public travel guidance:
   `https://www.gov.uk/guidance/travelling-between-the-uk-and-ireland-isle-of-man-guernsey-or-jersey`
3. GOV.UK Common Travel Area guidance:
   `https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance`

You may inspect an official GOV.UK Content API representation **only if the exact endpoint actually exists**.
Do not invent an API URL from a pattern and then treat a failure as evidence.

Other allowed sources:
- legislation.gov.uk;
- gov.ie / official Irish government;
- official Jersey, Guernsey or Isle of Man government sites only when needed to determine whether one-source provenance is insufficient.

Forbidden as truth:
- Wikipedia;
- blogs;
- commercial travel sites;
- forums;
- search-result snippets;
- model memory.

Search engines may locate an official page but are never evidence.

## Exact audit questions

### A. One-source sufficiency

Determine whether **one** current official response explicitly proves the complete membership needed by Jetnity.

The response must be strong enough to map every member to one exact canonical code without general-knowledge inference.

Do not pre-assume the result.

In particular test whether the source explicitly names:
- United Kingdom;
- Ireland / Republic of Ireland;
- Isle of Man;
- Jersey / Bailiwick of Jersey;
- Guernsey / Bailiwick of Guernsey.

If a page says only:
- `Crown Dependencies`;
- `Channel Islands`;
- `the islands`;

that shorthand is insufficient unless the **same audited response** explicitly defines that term strongly enough to resolve every member.

### B. Canonical code compatibility

Re-prove through Jetnity's canonical parser that every proposed member code is valid.

Likely code candidates may include `GB`, `IE`, `IM`, `JE`, `GG`, but these are **questions, not granted truth**.

Do not:
- invent a collective Channel Islands code;
- merge Jersey and Guernsey;
- substitute UK constituent-country codes for the United Kingdom unless the source/runtime contract requires it;
- infer ISO semantics from names without checking Jetnity's parser.

### C. Retrieval eligibility

For every serious official candidate, record a bounded direct research fetch.

At minimum record:
- requested URL;
- final/effective URL;
- redirect count;
- HTTP status;
- raw `Content-Type`;
- normalized media type;
- `Content-Length` if present;
- actual response bytes;
- fatal UTF-8 result;
- SHA-256 of exact response bytes;
- retrieval UTC time/window;
- tracking-clean canonical URL.

Compare exact bytes with live `BODY_MAX` from the trusted retrieval code.

If a candidate exceeds the current production-like ceiling, it is not a runtime-ready source merely because research could download it.

### D. Machine-readable representation

Check whether an official smaller machine-readable representation exists.

If GOV.UK Content API is used:
- prove the endpoint;
- record content identity / base path / schema where present;
- determine whether the operative CTA membership is actually in the machine response;
- distinguish a JSON envelope containing HTML from a real structured membership record;
- do not call HTML-in-JSON a structured schema.

### E. Source identity / provenance

The current region-pin type carries one `sourceId` and one `sourceContentHash`.

Determine whether that is sufficient.

If the exact member set requires two or more official content items, classification must be
`NO_CTA_REGION_PIN_SOURCE_PROVEN_YET` for the **current one-source type**, and the report must name the smallest provenance-contract change required.

Do not silently merge multiple sources into one source id.

### F. Drift / version pin

If one source is sufficient, define exact fail-closed structural conditions for a future runtime registration.

The future implementation must be able to reject:
- member removal;
- member addition;
- renamed/ambiguous shorthand;
- moved membership into a second content item;
- duplicate member;
- source identity/base-path change;
- content structure change that makes parsing ambiguous.

Do not require whole-page byte equality when a stable official machine fragment can be safely pinned more narrowly, but the stored source hash still remains the exact audited response hash.

## Required classification

The primary audit document must end with exactly one:

`CTA_REGION_PIN_SOURCE_PROVEN`

or

`NO_CTA_REGION_PIN_SOURCE_PROVEN_YET`

### If PROVEN

Record:

- exact selected official URL;
- exact publisher/authority;
- why the response is official primary evidence;
- exact operative membership wording, paraphrased rather than copied at length;
- response metadata and SHA-256;
- exact proposed sorted member-code set;
- proof that every code is accepted by Jetnity's canonical parser;
- proof that every code maps to explicit wording in the selected response;
- one-source contract sufficiency;
- exact structure pin / drift rules;
- a candidate future `sourceId` **naming pattern only**, not a registration;
- smallest next bounded runtime implementation slice.

Do **not** create a real source id entry, region pin or migration in this slice.

### If NOT PROVEN

Record:

- every blocker;
- whether the blocker is evidence ambiguity, retrieval size, mapping ambiguity, multi-source provenance or code-contract mismatch;
- the smallest missing capability;
- no runtime registration proposal.

## Required outputs

Create only:

- `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-04.md`

This task seed is the fifth changed file and must remain byte-identical after dispatch.

Do not edit global current-state / continuity files. Technical Lead owns #751.

## Required self-review attacks

The self-review must actively test at least:

1. “UK + Ireland + Crown Dependencies” was mapped from memory rather than explicit source text.
2. “Channel Islands” was silently treated as Jersey + Guernsey without same-response definition.
3. UK was accidentally decomposed into GB constituent nations.
4. one official source plus a second explanatory page was silently presented as one-source provenance.
5. Content API JSON was mislabeled as structured data when the legal text is HTML in a string.
6. a browser/search snippet was used instead of fetched official bytes.
7. response exceeded `BODY_MAX`.
8. redirect/final URL was not pinned.
9. response hash was computed after text normalization instead of exact bytes.
10. tracking parameters remained in a stored candidate URL.
11. current country-code parser does not accept one proposed member.
12. the audit drifted into ETA outcome/extractor/policy/F8 work.

## Hard boundaries

Docs-only.

Do not edit:
- `lib/**`;
- `app/**`;
- `components/**`;
- `types/**`;
- `hooks/**`;
- `supabase/**`;
- package/runtime config;
- source catalog data;
- any existing CH Candidate Evidence.

Do not:
- add `REGULIERUNGS_REGION_PINS`;
- register a source;
- register an extractor;
- register a composition policy;
- create a trusted fact;
- call `regelKandidatAkzeptieren`;
- persist anything;
- implement F8;
- change `BODY_MAX`;
- apply a migration;
- mutate Supabase;
- change Auth/RLS;
- activate providers;
- use paid APIs;
- change Production data/config;
- start CH-11;
- start another slice.

## Validation before STOP

- re-fetch live `origin/main`;
- re-read mode, #751, #748 after marker;
- confirm no writer collision;
- `git diff --check`;
- confirm changed files are exactly task seed + four required outputs;
- confirm task seed blob is unchanged from the dispatch commit;
- confirm no runtime/test/config/database file changed;
- verify every quoted/paraphrased factual conclusion against fetched official bytes;
- verify hashes from exact bytes;
- record exact final head.

## Delivery

Remain Draft.
Do not mark Ready.
Do not merge.
Do not start a follow-up slice.

Report:
- exact final head;
- baseline;
- exact changed files;
- exact classification;
- official URLs actually fetched;
- validation result;
- Codex execution model shown in the UI if available.

Then STOP for independent Technical-Lead exact-head review.
