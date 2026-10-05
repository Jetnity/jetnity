# Official Truth JP — MOFA/ISA content identity and retrieval qualification 1 — Task

Date: 5 October 2026
Issue: #852
Status: **BINDING / DOCS-ONLY SOURCE IDENTITY + RETRIEVAL AUDIT / NO RUNTIME / NO DB / NO F8**

## 1. Baseline

Repository: `Jetnity/jetnity`
Baseline: `main@2f27956cc9fd4289d30f258a5ee8eeaaa60aafec`
Mode: `NORMAL`

Prerequisite:
- merged #849 classification `JP_FIRST_PILOT_SOURCE_FAMILY_NOT_READY`

#849 established positive Swiss exemption evidence but found no approved JP identity/retrieval path.

## 2. Writer

Logical writer:
**Jetnity Official Truth JP content identity retrieval qualification 1**

Generation: **1**

Execution:
**Codex Desktop — new session**

Required model:
`gpt-6-astra` / `xhigh`.

Standing #751 autonomous execution rule applies through commit+push.
Keep Draft. Never Ready/merge. STOP after delivery.

## 3. Goal

Audit the smallest official Japanese source set needed to decide whether Jetnity can create a **bounded content identity profile + server-owned retrieval plan** for later dormant source-family work.

This task does not decide or emit a Rule fact.

Start with the #849 sources most relevant to the narrow positive Swiss visa-exemption path, prioritising:
- MOFA Exemption of Visa (Short-Term Stay), English R01;
- MOFA FAQ consequence/eligibility page R04;
- MOFA VISA / Short-Term Stay purpose boundary R03 or Japanese equivalent R10 only if necessary;
- ISA Temporary Visitor S08 only if needed for a source identity/retrieval conclusion.

Do not include the archived 385,852-byte PDF as an admissible runtime representation. It may remain historical research context only.

## 4. Required questions

For each selected item determine:

### A. Stable source/item/representation identity
- exact authority/publisher identity;
- whether the page exposes any stable machine identity beyond URL/title;
- locale/representation distinction;
- English/Japanese relationship;
- canonical URL behavior;
- stable metadata suitable for a bounded verifier;
- mutable fields that must not define identity;
- whether two language pages are same item, distinct representations, or cannot be safely collapsed.

Do not invent a GOV.UK-like content UUID if Japan does not publish one.

### B. Server-owned retrieval compatibility
Test/characterise a Jetnity-compatible retrieval path conceptually against current constraints:
- HTTPS
- no credentials
- exact host/path allowlist
- redirects
- public DNS/IP constraints
- content type
- 65,536-byte body ceiling
- 10s timeout
- full-body completion
- deterministic response admissibility

The #849 browser-vs-direct 403 discrepancy must be resolved or explicitly retained.
Do not claim browser success proves server retrieval.

### C. Bounded verifier feasibility
Specify whether a source-specific identity verifier can safely distinguish:
- expected official page;
- error/interstitial/block page;
- sibling page;
- translated/alternate representation;
- moved path;
- duplicate/ambiguous page identity;
- unexpected publisher/authority metadata changes.

If the official site exposes no stable identity primitive, determine whether an exact-path + bounded structural profile is sufficient under current architecture or still too weak.

### D. Drift semantics
Define what future changes require:
- fail closed;
- profile version bump;
- representation version bump;
- item version refresh;
- human review.

Do not convert legal content drift into identity drift unless architecture requires it; keep identity and legal-semantic verification distinct.

## 5. Fresh official-source retrieval

Freshly inspect only official Japanese state sources.

Record for each relied-upon current source:
- request URL
- final URL
- status
- content type
- full UTC start/finish
- byte count
- response SHA-256
- redirect chain
- relevant headers
- browser/direct-client difference if any
- stable metadata observations

No commercial sources.

## 6. Required code/doc reads

Read current live:
- `lib/readiness/official-truth-content-identity.ts`
- identity profile registry/verifier implementation and tests
- `lib/readiness/official-truth-server-owned-retrieval.ts`
- source catalog / server-held registry / router
- #849 audit
- GOV.UK identity-profile architecture only as comparison, not as a template to copy blindly
- source-identity granularity reconciliation

## 7. Decision

End with exactly one:

### `JP_CONTENT_IDENTITY_RETRIEVAL_PROFILE_READY_FOR_DORMANT_IMPLEMENTATION`

Only if a bounded, source-specific profile and retrieval contract can be specified safely for the selected current Japanese representations.

OR:

### `JP_CONTENT_IDENTITY_RETRIEVAL_PROFILE_NOT_READY`

List exact smallest unresolved gap.

READY authorizes only later TL consideration of a separate dormant implementation slice.

## 8. Required audit output

Specify:
- source/item/representation model;
- proposed ids/names, clearly **PROPOSAL / NOT IMPLEMENTED**;
- exact allowed hosts/paths/media/locales;
- verifier inputs and outputs;
- stable vs mutable metadata matrix;
- rejection cases;
- body/redirect/time bounds;
- server retrieval proof requirements;
- exact future test matrix;
- exact files a later implementation would touch;
- whether catalog registration would be a later separate gate.

## 9. Hard prohibitions

No:
- runtime/code/test modification
- profile implementation
- source/content/profile registration
- DB/Supabase/migration
- extractor/policy
- Evidence/Rule acceptance
- F8
- Production
- CH import/CH-11
- Trip Workspace/B01
- Ready/Merge
- follow-up slice

## 10. Allowed files

Immutable TASK:
- `docs/OFFICIAL_TRUTH_JP_CONTENT_IDENTITY_RETRIEVAL_QUALIFICATION_1_TASK_2026-10-05.md`

Delivery only:
- `docs/OFFICIAL_TRUTH_JP_CONTENT_IDENTITY_RETRIEVAL_QUALIFICATION_1_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_JP_CONTENT_IDENTITY_RETRIEVAL_QUALIFICATION_1_REPORT_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_JP_CONTENT_IDENTITY_RETRIEVAL_QUALIFICATION_1_HANDOFF_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_JP_CONTENT_IDENTITY_RETRIEVAL_QUALIFICATION_1_SELF_REVIEW_2026-10-05.md`

No other files.

## 11. Parallel guard

A separate applicability-schema architecture writer may run in parallel.
Before work and before push:
- re-read main/mode/#751/#748/this issue/PR;
- inspect other active writer paths;
- prove zero overlap;
- STOP on overlap.

## 12. Validation / STOP

Before push:
- TASK blob unchanged;
- exact five-file diff;
- merge-base/ahead/behind;
- collision proof;
- `git diff --check`;
- operating-mode gate;
- exact model/session evidence.

Commit + push autonomously.
Read exact-head CI/Vercel.

Then STOP for independent Technical-Lead review.

Do not Ready.
Do not merge.
Do not start implementation.
