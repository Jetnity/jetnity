# Official Truth GOV.UK ETA Semantic Contract Closure 1 — Task

Date: 5 October 2026
Issue: #842
Status: **BINDING / DOCS-ONLY SEMANTIC CONTRACT / NO RUNTIME / NO DB / NO EXTRACTOR / NO F8**

## 1. Authority and baseline

This is ordered step 1 from:
`docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_2026-10-05.md`

Baseline:
- main: `3ba69f15907e0652cfe83478dabcf91904ca9a00`
- mode: `NORMAL`
- #838/#839 merged/post-merge verified/closed
- classification remains `GOVUK_ETA_SEMANTIC_CHAIN_NOT_READY`
- Development Official Truth v2 hardening applied/read-only verified
- Development catalog still contains only National List identity; Evidence/Rule payload rows remain 0
- Production Official Truth v2 remains absent
- Workspace #840/#841 may run in parallel and must remain file-disjoint

Re-read live main/mode/#751/#748/open PRs before work. Live evidence wins.

## 2. Writer

Logical writer:
**Jetnity Official Truth GOV.UK ETA semantic contract closure 1**, Generation 1.

Execution:
**Codex Desktop**

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

No Cursor. No runtime writer. Keep Draft.

## 3. Evidence boundary

This task does **not** refresh current UK immigration law from the web.

Use only:
- the already audited repository source snapshots and exact citations from #791;
- #793/#795 applicability architecture/foundation;
- #797/#799 canonical applicability wiring;
- #801/#803 composition architecture/foundation;
- #805 CTA source audit;
- #838/#839 semantic reconciliation;
- current runtime types/parsers/evaluator/store only to assess representability.

Do not silently claim the 5 October legal bytes are current.

If a semantic cell cannot be closed from the existing audited repository evidence, classify it unresolved and fail closed. A later positive source-family selection still requires its explicitly scoped freshness gate.

## 4. Goal

Produce one reviewed semantic contract that determines whether the **smallest necessary applicability contract delta** can be implemented next without inventing legal meaning.

Answer:
1. What exact ETA requirement is being modeled?
2. What exact exemptions/qualifications affect that requirement?
3. Which current predicates already express each atom?
4. Which semantic concepts are genuinely missing?
5. Which missing concepts require a type/predicate/context delta?
6. Which facts may be explicit user assertions versus recorded trip/account facts versus official/route-derived facts?
7. What does false mean for each predicate, and when must absence remain unknown?
8. What is requirement truth versus ETA application/use eligibility?
9. What is the exact scope of the eventual fact?
10. Which unsupported cells must remain impossible/unselectable?

## 5. Mandatory current code/docs

Read at minimum:

### Historical/legal audit evidence
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`
- its task/report/self-review
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_RECONCILIATION_2_2026-10-05.md`

### Applicability
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- its tests
- `lib/readiness/rule-claims.ts`
- #793/#795/#797/#799 architecture/report/handoff docs

### Route/CTA
- `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_2026-10-04.md`
- current region-pin type/registry
- `lib/route/ableitung.ts`

### Traveller/document semantics
- `types/trips.ts`
- `lib/readiness/traveller-kontext.ts`
- `lib/traveller/account-registry.ts`
- current document/citizenship-link helpers

### Composition/persistence only for compatibility constraints
- current composition architecture/registry
- current store guard
- do not solve those later steps here

## 6. Contract output structure

Create one canonical semantic-contract document containing:

### A. Rule identity
- proposed semantic rule name/id;
- requirement type/fact kind;
- destination scope;
- citizenship scope;
- credential/document scope;
- travel-date scope;
- transit applicability if relevant;
- explicit statement that scope is not inferred from residence/issuer.

### B. Source-to-target matrix

For every relevant audited Appendix/National-List statement:
- repository evidence anchor;
- source content item;
- source semantic statement;
- target predicate/outcome/scope field;
- current predicate exists? yes/no;
- current context type exists? yes/no;
- current provenance allowed?;
- exact true condition;
- exact false condition;
- unknown condition;
- semantic delta needed?;
- unsupported/must-block condition.

No URL/body refresh.

### C. Decision tree / branch contract

Write the exact **semantic** decision tree, independent of implementation syntax.

Every branch must say:
- condition;
- source support;
- result (`required` / `not_required` / unknown/unsupported as appropriate);
- deciding context atoms;
- what must remain unknown.

Do not flatten multiple exemptions into one opaque boolean.

### D. Minimal delta proposal

For each missing concept, choose exactly one:
- reuse existing predicate unchanged;
- extend an existing bounded enum/atom;
- add one new bounded predicate/context fact;
- declare unsupported for first implementation.

Do not invent parallel predicate engines.

## 7. National-passport qualification — mandatory closure

#839 confirmed:
- passport type exists;
- document class exists;
- issuer and explicit citizenship link exist;
- **nothing currently proves "national passport"**;
- `ordinary` must not be treated as a synonym.

Determine the smallest safe semantic contract.

Evaluate alternatives explicitly:
1. extend `document_class` with a value that means the exact audited national-passport qualification;
2. add a separate bounded document-qualification predicate;
3. leave this cell unsupported.

Choose one recommendation and justify compatibility.

Requirements:
- no passport number;
- no MRZ/scan;
- no biometric data;
- no issuer→citizenship inference;
- credential must remain explicitly linked to one citizenship from the full set;
- absence remains unknown unless explicitly represented.

Do not implement.

## 8. Irish lawful-residence / actual-residence / time semantics

#839 confirmed that simple residence country is insufficient.

From the audited snapshot, separate every concept that the source actually requires, including as applicable:
- lawful residence entitlement;
- actual residence if the audited text requires it;
- permission/entitlement to remain;
- departure/entry condition;
- relevant date/time (travel date vs application time or another audited time).

For each:
- decide whether current `lawful_residence` can represent it without changing meaning;
- if not, define the smallest bounded delta;
- state allowed provenance;
- state explicit false vs unknown.

Do not store permit numbers or free-text legal status.

## 9. CTA origin semantics — correct the historical mistake

Do not repeat the stale mapping "not origin IE".

Define the semantic origin condition **relative to the UK destination** using the audited source statement.

Requirements:
- exact inbound journey origin, not residence;
- region membership must be code-owned/pinned later, not hardcoded here;
- no raw IATA→country inference in this contract;
- origin missing => unknown;
- route-derived origin must come from canonical route truth;
- user assertion may be context-asserted only if current provenance contract permits it;
- the contract must identify the correct region/country inclusion/exclusion shape.

If current `journey_origin` + region predicate can express it exactly, say so; otherwise specify only the minimal delta.

## 10. Nationality-status exemptions

For each audited status such as BOTC/BNO:
- map to current `nationality_status`;
- define exact `held`, explicit `not_held`, and unknown semantics;
- no ISO nationality/citizenship substitution;
- one omitted row never means false.

If no predicate delta is needed, mark resolved.

## 11. School-party exemption

Map every audited condition separately:
- age;
- institution/school status;
- group size;
- traveller included;
- authority confirmation;
- visitor/travel purpose;
- any destination/source-specific constraint from repository evidence.

For each atom:
- existing predicate?;
- exact bound/value?;
- provenance?;
- false/unknown semantics?;
- minimal delta?.

No school names, student IDs or DOB.

If age duty mapping in the historical audit was wrong/ambiguous, correct it explicitly and cite the repository evidence that supports the correction.

## 12. UK permission exemption

Map:
- valid entry clearance;
- permission to enter or stay;
- exact permission classes as audited;
- relevant date.

Use current `destination_permission` only if semantics match exactly.

Critical:
- no rows = unknown;
- one expired/not-valid item does not prove absence of every valid permission;
- an explicit user assertion of class-wide "none valid" is context-asserted, not official proof;
- if the current model cannot safely express class-wide negative knowledge, specify the smallest delta or declare unsupported.

## 13. Requirement vs application/use eligibility

This contract must explicitly separate:

A. **Is ETA legally required for this traveller/journey?**

from any distinct audited concept such as:

B. **Is this document/category eligible to make/use an ETA application?**

Do not encode application eligibility as `not_required`.
Do not encode a failed application-eligibility condition as automatic ETA requirement.

If the audited repository source does not support a complete application-eligibility model, keep it outside the first rule and say so.

## 14. First implementation boundary

Define the exact **first safe semantic subset**.

It may be:
- complete ETA requirement with every audited exemption represented;
or
- a narrower subset that returns `unknown/unsupported` for unresolved exemption classes.

It must never:
- default an unresolved exemption to false;
- convert unknown to required;
- treat missing context as not exempt;
- infer passport qualification from ordinary passport;
- infer CTA origin from residence;
- infer permission absence from no stored permit.

State the exact cases in which the eventual evaluator is allowed to emit:
- required;
- not_required;
- unknown/unsupported.

## 15. Version/compatibility decision for step 2

Based on the minimal delta:
- decide whether current applicability schema version can be extended compatibly;
- or whether a schema/version bump is required.

If a version bump is required:
- state which current composition/content contracts would need a compatibility pin update in the later code slice;
- do not edit them here.

No silent reinterpretation of existing schema-1 data.

## 16. Product-owner boundaries

Separate clearly:

### No PO gate needed merely to prepare
- this docs contract;
- later dormant parser/evaluator code that collects no new personal fields and performs no hosted write.

### PO review required before enabling
- any **new legal assertion collection/meaning** in user-facing traveller context;
- any new personal retention/provenance beyond existing approved fields;
- hosted DB migration/apply;
- Appendix/CTA Development registrations;
- policy/extractor activation if the task reserves it;
- Production/F8.

Do not request those approvals in this slice.

## 17. Decision

Final classification exactly one:

- `GOVUK_ETA_SEMANTIC_CONTRACT_READY_FOR_MINIMAL_DELTA`
- `GOVUK_ETA_SEMANTIC_CONTRACT_NOT_READY`

### If READY
Provide:
- exact minimal predicate/context delta;
- exact compatibility/version treatment;
- exact synthetic tests required in step 2;
- exact unsupported cases that remain unknown;
- exact code files likely affected, but no implementation.

### If NOT READY
Provide:
- unresolved semantic cells;
- why repository evidence is insufficient;
- whether a fresh official-source audit is needed before step 2;
- no code slice may be dispatched from this contract.

## 18. Allowed files

Docs only:
- immutable TASK;
- one semantic-contract architecture document;
- REPORT;
- HANDOFF;
- SELF_REVIEW.

No runtime/test/migration changes.

If external web research appears necessary to close a semantic cell, STOP and report the exact source/freshness need. Do not silently browse/research in this writer.

## 19. Non-scope

Absolutely no:
- parser/evaluator implementation;
- context producer;
- traveller UI;
- Appendix/CTA profile or registration;
- composition policy/extractor;
- acceptance;
- store/persistence;
- DB migration/apply;
- Evidence/Rule;
- Workspace;
- F8;
- Production;
- provider/model call;
- follow-up slice.

## 20. Validation and delivery

Run:
- `git diff --check`
- `npm run check:operating-mode`
- docs/hygiene checks required by repo

Before delivery:
- re-read main/mode/#751/#748/PR;
- verify Workspace #840/#841 remains file-disjoint;
- immutable task;
- exact changed files;
- merge-base/ahead/behind;
- review threads;
- exact model/xhigh evidence;
- no hosted DB/Production access.

Create REPORT/HANDOFF/SELF_REVIEW.
Keep Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready/merge/start step 2.
