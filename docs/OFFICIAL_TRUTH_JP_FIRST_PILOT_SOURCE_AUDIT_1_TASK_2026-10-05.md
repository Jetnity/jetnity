# Official Truth JP first deterministic pilot source audit 1 — Task

Date: 5 October 2026
Issue: #848
Status: **BINDING / DOCS-ONLY / OFFICIAL PRIMARY SOURCES / PARALLEL DISJOINT / NO DB / NO RUNTIME / NO F8**

## 1. Baseline and parallel ownership

Repository: `Jetnity/jetnity`
Baseline: `main@bb42e261771245b1675d2886cec96b60674dd608`
Machine mode at dispatch: `NORMAL`

Parallel active slice:
- #846 / Draft PR #847 — Trip Workspace B01 account Official Evaluation wiring 1
- that writer owns only its B01 runtime/tests/docs scope

This JP writer is strictly docs-only and must not touch any #847 runtime/test/task/delivery path.

## 2. Writer

Logical writer:
**Jetnity Official Truth JP first pilot source audit 1**

Generation: **1**

Execution:
**Codex Desktop — new session**

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

Standing #751 autonomous execution directive applies:
- work autonomously through research, docs, validation, commit and push;
- do not ask Product Owner for routine commit/push/test approval;
- keep PR Draft;
- never Ready or merge;
- STOP after delivery;
- no automatic follow-up slice.

## 3. Exact research cell

citizenshipCountryCode: `CH`
documentType: `ordinary_passport`
destinationCountryCode: `JP`

No residence inference.
No issuer→citizenship inference.
No default passport/document.
No extrapolation to other nationalities or document classes.

## 4. Official sources only

Use only Japanese state primary sources, prioritising:
- Ministry of Foreign Affairs of Japan (MOFA)
- Immigration Services Agency of Japan
- official Japanese embassy/consulate pages only when they directly carry the relevant legal/operational rule

No blogs, visa brokers, travel portals, forums, Reddit, commercial providers or model summaries as evidence.

Search results may be discovery only; final evidence must come from the actual official page/document.

## 5. Core questions

Determine independently:

1. Whether Switzerland is **positively and explicitly** included in the relevant short-stay visa-exemption/visa-waiver arrangement.
2. Whether the official source explicitly establishes the consequence for that listed class:
   - no visa required before travel / visa exemption / temporary visitor landing treatment;
   - do not infer from absence in a visa-required list.
3. Whether the rule applies to ordinary passports explicitly or whether document-class limits/exclusions are otherwise source-complete.
4. Exact stay duration and anchor:
   - 90 days or other value only if explicit;
   - do not convert/normalise units.
5. Purpose/eligibility boundaries:
   - temporary visitor / short stay;
   - paid work/remunerative activity restrictions;
   - any excluded purposes or categories.
6. Passport validity / blank pages / arrival-form/transit conditions:
   - only if the same official family explicitly supports them;
   - do not invent missing negative rules.
7. Whether the fact is one-source `explicit_primary_statement` or requires composition.
8. Whether current Jetnity fact/schema vocabulary can represent the exact positive fact without dropping material qualifiers.
9. Whether current server retrieval ceilings/media/identity boundaries can support the source family.
10. Exact drift guards a future deterministic extractor would need.

## 6. Retrieval provenance

For each relied-upon source record:
- canonical request URL
- final URL
- HTTP status
- content type
- full UTC retrieval start/finish
- byte count
- SHA-256 of full received response body
- redirect chain/count
- official title/update metadata when exposed
- stable clause/section/heading locator
- why the source is needed

Strip tracking parameters.

Do not commit raw government response bodies unless separately authorized.
Persist precise structured paraphrase and locators.

## 7. Decision

End with exactly one:

### `JP_FIRST_PILOT_SOURCE_FAMILY_READY_FOR_DORMANT_EXTRACTOR_DESIGN`

Only if:
- Switzerland is positively explicit;
- consequence is positively explicit;
- document-class/purpose/duration semantics are source-complete enough for the exact cell;
- no material branch is inferred from silence;
- the source family fits current retrieval/identity limits or has a bounded already-approved path;
- the complete fact is representable without lossy assumptions.

This status authorizes only later TL consideration of a separately versioned dormant extractor-design slice. No implementation.

OR:

### `JP_FIRST_PILOT_SOURCE_FAMILY_NOT_READY`

If any material semantic, source-identity, retrieval, or representability gap remains.

List the smallest exact gap and official evidence needed.

## 8. CH continuity

CH-01..CH-10 remain:
`RESEARCH_ONLY`
`NOT_APPROVED_FOR_DATABASE_IMPORT`

No Candidate Evidence is promoted or imported by this slice.
No CH-11.

## 9. Hard prohibitions

Absolutely no:
- runtime/code implementation
- tests for future extractor/runtime
- DB/Supabase access or mutation
- migration
- source/content/profile registration
- extractor/policy activation
- accepted Evidence
- Rule acceptance
- F8
- B01 files
- Trip Workspace files
- Production
- paid/provider/model API integration
- Ready/Merge
- follow-up slice

## 10. Allowed files

Immutable TASK:
- `docs/OFFICIAL_TRUTH_JP_FIRST_PILOT_SOURCE_AUDIT_1_TASK_2026-10-05.md`

Delivery only:
- `docs/OFFICIAL_TRUTH_JP_FIRST_PILOT_SOURCE_AUDIT_1_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_JP_FIRST_PILOT_SOURCE_AUDIT_1_REPORT_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_JP_FIRST_PILOT_SOURCE_AUDIT_1_HANDOFF_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_JP_FIRST_PILOT_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-05.md`

No other file may change.

## 11. Parallel collision guard

Before work and again before push:
- re-read live main/mode/#751/#748/#848/PR;
- inspect #847 exact current changed files;
- prove zero path overlap;
- if #847 or another writer touches any of this task's allowed docs (unexpected), STOP;
- do not sync/modify #847.

## 12. Validation

Before delivery:
- task blob unchanged
- exact changed files
- merge-base/ahead/behind
- no writer collision
- `git diff --check`
- `npm run check:operating-mode` or repository-equivalent
- docs-only slice does not require full runtime suite unless CI after push runs it
- report exact session id/model/effort
- inspect exact-head CI + Vercel after push

## 13. Delivery / STOP

Create all four delivery docs.

Keep Draft.
Commit and push autonomously.
Report exact remote head, files, relation, source ledger, final classification, CI/Vercel.

Then:

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready.
Do not merge.
Do not start extractor design or any follow-up.
