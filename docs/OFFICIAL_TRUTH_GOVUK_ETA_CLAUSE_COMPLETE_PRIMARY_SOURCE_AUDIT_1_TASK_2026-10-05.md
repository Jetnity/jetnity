# Official Truth GOV.UK ETA clause-complete primary-source audit 1 — Task

Date: 5 October 2026
Issue: #844
Status: **BINDING / RESEARCH + EVIDENCE ONLY / OFFICIAL PRIMARY SOURCES / NO RUNTIME / NO DB / NO F8**

## 1. Baseline

Repository: `Jetnity/jetnity`
Baseline: `main@225878a9a7cd7f07a9167b502b8c688fa1613be1`
Machine mode at dispatch: `NORMAL`

Merged prerequisites:
- #791 GOV.UK ETA source-family audit
- #839 GOV.UK ETA semantic reconciliation 2
- #843 GOV.UK ETA semantic contract closure 1

Merged #843 classification:
`GOVUK_ETA_SEMANTIC_CONTRACT_NOT_READY`

Historical Appendix ETA Content API observation retained in repository:
- content item UUID: `2620750b-5453-44f1-98af-414037c833be`
- observed size: 22,965 bytes
- historical SHA-256: `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037`

Technical-Lead recovery precheck found the hash/size/URL metadata in tracked docs, but **not the original 22,965 response bytes** in current repository or the historical #791 branch. Do not pretend the historical bytes were recovered.

The exact #843 fallback is therefore active: narrowly re-audit the unresolved clauses from current official primary sources.

## 2. Writer

Logical writer:
**Jetnity Official Truth GOV.UK ETA clause-complete audit 1**

Generation: **1**

Execution:
**Codex Desktop**

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

This is a **new Codex session**, not a continuation of #843 or any Trip Workspace session.

Keep the PR Draft.
Do not Ready.
Do not merge.
Do not start a follow-up implementation slice.

## 3. Scope

Research and persist a clause-complete, reviewable evidence contract for only the unresolved GOV.UK ETA semantics identified by #843 §12.

The audit must independently read current official primary sources. Do not treat the Technical Lead's precheck notes, old summaries, model knowledge or historical hashes as current legal truth.

### Required primary sources

At minimum independently retrieve and inspect:

1. GOV.UK Immigration Rules — Appendix Electronic Travel Authorisation:
   `https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation`

2. GOV.UK Immigration Rules — Part 1, including the ETA school-party cross-references:
   `https://www.gov.uk/guidance/immigration-rules/immigration-rules-part-1-leave-to-enter-or-stay-in-the-uk`

3. Home Office — Electronic Travel Authorisation: Irish resident exemption caseworker guidance:
   `https://www.gov.uk/government/publications/electronic-travel-authorisation-irish-resident-exemption-caseworker-guidance/electronic-travel-authorisation-irish-resident-exemption-accessible`

4. Any additional GOV.UK/Home Office page required to establish **complete no-ETA/exemption coverage for the exact audited Swiss destination cell**. Discover it only from official GOV.UK navigation/search/cross-references and record why it is needed.

Official GOV.UK/Home Office/UK-government primary sources only.

Forbidden as evidence:
- blogs
- brokers
- commercial visa/travel sites
- forums
- Reddit
- search snippets as final evidence
- model/plugin statements
- old Jetnity summaries as a substitute for the fresh source
- third-party mirrors

## 4. Retrieval/provenance requirements

For every official source actually relied upon record:
- exact canonical request URL
- exact final URL
- HTTP status
- response content type
- retrieval start and finish as full UTC timestamps
- received byte count
- SHA-256 of the complete received response bytes
- relevant official title/publication/update metadata where exposed
- source/content identity if the official page/API exposes one
- exact clause/section identifiers or stable semantic locator
- whether a redirect occurred

Strip tracking parameters.

Do not claim freshness beyond the exact retrieval time.

Do not persist credentials, cookies, personal data, traveller identifiers or secrets.

Do not store the full raw government response in the repository unless a separately reviewed task explicitly authorizes that. The durable evidence must instead be clause-complete through structured rows and precise source locators.

## 5. Clause-complete evidence format

The audit must not repeat the old lossy pattern of “compressed to operative words”.

For every legally relevant clause/subclause needed for the exact questions below, create one or more structured rows containing at least:

- `sourceId`
- `officialSourceUrl`
- `clauseId`
- `sourceLocator`
- `semanticSubject`
- `semanticRelation`
- `semanticObject`
- `conditions[]`
- `exceptions[]`
- `crossReferences[]`
- `effectOnEtaRequirement`
- `referenceTime`
- `evidenceQuality`
- `retrievedAt`
- `responseSha256`
- `notes`

Every conjunct/disjunct/material qualifier must be represented separately enough that a future reviewer can prove whether anything was omitted.

Short quotations may be used only where necessary; prefer precise paraphrase plus exact clause identifiers/locators.

No negative rule may be inferred merely from missing text.

Unknown/unresolved stays unknown.

## 6. Exact questions to close

### A. Irish / CTA semantics

Re-audit Appendix ETA 1.3–1.6 and all necessary cross-references.

Determine separately:
- actual residence requirement;
- entitlement to reside under Irish law;
- Minister-consent restriction;
- origin within the Common Travel Area relative to UK entry;
- age/evidence-duty rule;
- exact meaning of the phrase tying relevant Irish legislation/rules to “the time of the ETA application”;
- whether that phrase time-qualifies the applicable Irish legal framework, the traveller's personal residence/entitlement facts, both, or something else;
- how the official rules/guidance treat a qualifying traveller who is exempt and therefore has **no ETA application event**;
- which facts are requirement-effect conjuncts vs evidence/border-proof duties.

Do not substitute travel date for application/reference time without explicit source support.

Do not infer lawful residence from recorded residence country alone.

### B. French school-party semantics

Re-audit Appendix ETA 1.9 plus every operative Part 1 cross-reference.

Close:
- age threshold;
- exact traveller-school relationship;
- qualifying school/institution condition;
- exact party-count unit and threshold;
- who must organise the party;
- Visitor condition;
- required France-UK school-trip form/listing/authentication/supervising-adult condition, if currently required by the official rules;
- whether any additional authority confirmation exists.

Do not guess “pupil”, escort counting, or relationship semantics if not explicit.

### C. German school-party semantics

Re-audit Appendix ETA 1.10 plus every operative Part 1 cross-reference.

Close:
- age threshold;
- exact traveller-school relationship;
- qualifying school/institution condition;
- exact party-count unit and threshold;
- who must organise the party;
- Visitor condition;
- exact German confirmation authority;
- what is confirmed;
- required Germany-UK form/listing/authentication/supervising-adult condition;
- whether confirmation belongs to institution status, traveller listing/form authentication, or both.

Do not collapse distinct confirmations into one boolean.

### D. General residual / complete exemption coverage

For the exact proposed Swiss ordinary-passport destination cell, build an explicit coverage ledger of every currently relevant official no-ETA/exemption route that could affect a residual `required` result.

For each route classify:
- in scope and modeled;
- in scope but semantic/context gap remains;
- excluded by an explicit audited scope fact;
- application/use-only and not a requirement exemption;
- unrelated to the exact cell;
- still unresolved.

At minimum reconcile the Appendix clauses with any current official GOV.UK “who does not need an ETA” guidance needed to detect additional practical exemption/status paths.

A residual/general `required` branch is **NOT SAFE** unless the audit proves exemption coverage complete for the exact cell and all potentially applicable routes can be soundly false or excluded.

Do not turn “not observed” into false.

## 7. Requirement vs application/use

Maintain the #843 boundary:
- A = whether ETA is required.
- B = whether an ETA application/document/use is eligible/valid.

National-passport qualification, application-passport matching, suitability, permitted application categories/durations and similar B conditions must not silently become A exemptions or A premises unless a fresh official clause explicitly makes them part of requirement determination.

Produce a table:
`clause -> A requirement / A exemption / evidence duty / B application-use / unrelated`.

## 8. Current Jetnity representability

After the legal-source audit only, map the closed semantics onto current Jetnity predicate/context vocabulary.

For every required semantic atom classify:
- already exactly representable;
- representable only with a clarified meaning but no code change;
- needs a bounded future schema/context delta;
- must stay unsupported.

Do not implement the delta in this slice.

Do not invent new enum names merely because a concept exists. Any proposed future schema name must be explicitly marked **PROPOSAL / NOT IMPLEMENTED**.

Re-check the #843 concern around schema 2; determine whether a schema-2 delta is truly necessary after the fresh source evidence, and why. This is an architecture conclusion only.

## 9. Decision outputs

End with one of:

### `ETA_SEMANTIC_CONTRACT_CLOSED_FOR_DORMANT_STEP_2_DESIGN`

Only if:
- all §6 unresolved cells are source-closed;
- complete residual exemption coverage is proven for the exact cell;
- every required semantic atom has an honest representability disposition;
- no unresolved conflict/gap is being defaulted away.

This status authorizes **only** later Technical-Lead consideration of a separately versioned dormant design/code slice. It does not authorize implementation by this writer.

OR:

### `ETA_SEMANTIC_CONTRACT_STILL_NOT_READY`

If any material semantic or coverage cell remains unresolved.

List the exact smallest remaining gap and the exact official evidence needed.

## 10. Non-scope / hard prohibitions

Absolutely no:
- runtime/code implementation;
- tests for future runtime;
- schema-2 implementation;
- new UI or traveller fields;
- DB migration/write;
- Supabase access/mutation;
- source/content registration;
- Appendix/CTA registration;
- profile activation;
- extractor registration;
- composition-policy activation;
- accepted Evidence creation;
- Rule acceptance;
- F8;
- Production mutation;
- provider/model API integration;
- paid calls;
- CH-01..CH-10 re-research;
- CH-11;
- worldwide source sweep;
- Ready/Merge;
- follow-up slice.

CH-01..CH-10 remain:
`RESEARCH_ONLY`
`NOT_APPROVED_FOR_DATABASE_IMPORT`

## 11. Allowed files

Immutable task:
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_TASK_2026-10-05.md`

Delivery only:
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_REPORT_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_HANDOFF_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-05.md`

No other file may be changed.

If another file is needed: STOP for Technical-Lead scope review.

## 12. Validation

Before delivery:
- re-read live `main`, mode, #751, #748, this Issue and PR;
- prove task blob unchanged;
- prove exact changed-file list;
- prove merge-base / ahead / behind;
- verify no overlapping active writer;
- `git diff --check`;
- `npm run check:operating-mode`;
- no need to run full runtime test/build solely for docs unless repository CI requires it after push;
- report exact Codex session id and model/effort evidence;
- report exact official-source retrieval ledger.

Do not fabricate PASS.

## 13. Delivery / STOP

Create all four delivery documents listed in §11.

REPORT must explain source retrieval and conclusions.
HANDOFF must state exact unresolved/closed cells and next review action.
SELF_REVIEW must explicitly state it is not independent Technical-Lead review.
Main AUDIT document must contain the complete structured evidence/coverage matrices.

Keep PR Draft.

Push only the allowed docs.

Then STOP for independent ChatGPT / Technical-Lead exact-head review.

**Do not Ready. Do not merge. Do not start step 2 or any follow-up implementation.**
