# GOV.UK ETA clause-complete audit 1 — Report

Date: 5 October 2026

**ETA_SEMANTIC_CONTRACT_STILL_NOT_READY**

Logical writer: **Jetnity Official Truth GOV.UK ETA clause-complete audit 1** · Generation **1**.

[Issue #844](https://github.com/Jetnity/jetnity/issues/844) · [Draft PR #845](https://github.com/Jetnity/jetnity/pull/845) · [Binding task](OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_TASK_2026-10-05.md).

Branch: `audit/official-truth-govuk-eta-clause-complete-audit-1`. Baseline: `main@225878a9a7cd7f07a9167b502b8c688fa1613be1`. Immutable seed: `a97e2e632a460070bcd2a50802c6aec997825101`. Immutable task blob: `173d1ae4d12f20a2f9e2bb601e83c0f710a980da`.

Codex session: `01a10be5-a09c-7373-a5ea-f8251b04328b`. Local session metadata/turn context explicitly records **`gpt-6-astra` / `xhigh`** (including current collaboration settings), Codex Desktop, session start `2026-10-05T11:49:20.671Z`. The inspected local rollout is `sessions/2026/10/05/rollout-2026-10-05T13-49-20-01a10be5-a09c-7373-a5ea-f8251b04328b.jsonl` under the local Codex home. Only this identity/model metadata is reported; raw session content is not committed.

## Result and source work

The [main audit](OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_2026-10-05.md) contains 76 structured evidence records, the complete33-response retrieval ledger, an explicit no-ETA coverage ledger, clause-to-A/B classification and an atom-by-atom map to current schema1. Every structured record has the binding task’s required source, clause/locator, subject/relation/object, condition/exception/cross-reference arrays, requirement effect, reference time, evidence quality, full UTC retrieval finish and full response SHA-256.

All three mandatory sources were freshly fetched and independently read: Appendix ETA, Part1 (including11A-11D) and Irish-resident caseworker guidance. Additional official GOV.UK navigation/search/cross-references led to general ETA guidance, French/German school guides and official PDFs, exemptions-to-controls/EXM, crew, forces, EUSS, abode, CTA, frontier-worker and S2 pages. There are26 source/landing records S1-S26 and7 discovery records D1-D7. Legal conclusions use full primary content, never search snippets or third-party summaries. Discovery records and redirect landing S12 do not independently establish a legal rule.

Retrieval window: `2026-10-05T11:53:29.001519Z` through `2026-10-05T12:07:25.801317Z`. Total received response-body bytes across ledger: **6,089,377**. All final responses HTTP200; S12 has one HTTP301 redirect to its current official publication landing, all others zero. Canonical request/final URLs, content type, exact timestamps, byte count, complete-body SHA-256, official metadata, stable locators and semantic row mappings appear in audit§8. Hashes were recomputed from all33 saved bodies. Current HTML is not equated with the unrecovered historical Content API bytes.

Raw bodies and reading/rendering helpers remain temporary outside Git. The PDF skill was used for reading: all11 pages of each form were text-inspected; declaration/instruction pages2/3 of each were rendered and visually checked. The task authorises durable structured paraphrase, not raw response storage. No traveller form was completed or submitted.

## Conclusions

- **Ireland:** actual residence, entitlement, Minister-consent restriction, elsewhere-CTA origin and age/proof duty are separate. The application-time wording still has no explicit never-applicant reference event. Its grammar suggests a qualifier on legislation/rules but does not authoritatively settle the temporal reach over personal facts. Travel-time document validity does not fix that gap. General guidance’s “to visit” summary is recorded without silently adding it to ETA1.3.
- **France:** age<=18, studying at the same Ministry-registered institution organising a party of>=5 pupils, Visitor entry, correct authenticated form listing and supervising-adult custody are documented. Prefecture checking/stamping is distinct from institution registration. Headteacher declarations, consent/supporting documents,15-day submission and border copies are retained.
- **Germany:** age<=19 and the same study/organiser/Visitor relations; Part1 and form guidance explicitly identify pupils as the count unit. Institution-existence confirmation and completed-form authentication are separate objects/actions by relevant municipal or competent authority. Mixed-party listing/count and form-origin/document edges are not defaulted away.
- **Residual coverage:** the exact `[CH]` ordinary-passport destination cell does not exclude UK/island permissions, protected statuses, exempt functions/family relationships or crew arrangements. Some public guidance expressly requires individual agreement/case confirmation and is not exhaustive. BOTC/BNO person-status wording also differs from passport-use summaries. No general `required` fallback is safe.
- **A/B:** national-passport qualification, application category, suitability, expiry and application-passport matching stay in B. Current Crown Dependency ETA mutual recognition concerns B use/satisfaction, not no-ETA exemption. S2 visa-free/entry-on-arrival language is not by itself an ETA exemption.
- **Architecture:** full clause-complete A support needs a bounded versioned context/schema delta for missing relationships, count units, form/authority objects and time. This is an architecture finding only. A valid positive existing-permission atom can fit schema1; unresolved legal rules and residual coverage remain unsupported.

The smallest independently decisive gap is the official interpretation/reference event for ETA1.4 when no application exists. Closing it alone would not close the other coverage gaps. Audit§6 lists the exact official evidence still needed for each gap. No negative rule comes from silence, missing context or a search result.

## Live reconstruction and validation

Initial live reconstruction completed before research. The final repeat snapshot and actual local check results are below. Historical seed CI/Vercel results are not reported as validation of the new delivery commit.

```json
{
  "status": "PASS for actual listed local/live checks; semantic contract remains NOT_READY",
  "localValidationUTC": "2026-10-05T15:59:04.425465Z",
  "liveReadStartUTC": "2026-10-05T15:59:44Z",
  "liveReadFinishUTC": "2026-10-05T15:59:45Z",
  "main": "225878a9a7cd7f07a9167b502b8c688fa1613be1",
  "mode": "NORMAL",
  "modeBlob": "1912bf56751a940acc56fad84e2bf9e6a174e0fa",
  "issue751": "Body unchanged; one active docs-only writer #844/#845. Sole old transition comment5982537571 is superseded by current body/main.",
  "issue748": {
    "comments": 41,
    "latestMaterial": 5988971332,
    "latestTriage": 5989855107,
    "newCommentsAfterTriage": 0
  },
  "issue844": "Open; body unchanged; zero comments",
  "pr845": {
    "state": "open",
    "draft": true,
    "preCommitRemoteHead": "a97e2e632a460070bcd2a50802c6aec997825101",
    "dispatchComment": 5993593800,
    "newDispatchOrReviewInstructions": false
  },
  "writerCollision": "No overlap found: #751 names one writer; open PR list #845,#52,#50,#40,#39,#28; PR branch unchanged at immutable seed; local branch isolated.",
  "taskBlob": "173d1ae4d12f20a2f9e2bb601e83c0f710a980da",
  "taskByteIdentityAgainstSeed": "PASS",
  "mergeBase": "225878a9a7cd7f07a9167b502b8c688fa1613be1",
  "preCommitHead": "a97e2e632a460070bcd2a50802c6aec997825101",
  "preCommitAhead": 1,
  "preCommitBehind": 0,
  "headReporting": "One delivery commit is planned after this receipt. Actual pushed exact head and ahead/behind are checked/reported after commit; no future hash or CI result asserted here.",
  "changedFilesAgainstMainIndex": [
    "docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_2026-10-05.md",
    "docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_HANDOFF_2026-10-05.md",
    "docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_REPORT_2026-10-05.md",
    "docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-05.md",
    "docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_TASK_2026-10-05.md"
  ],
  "gitDiffCheck": "PASS",
  "gitDiffCachedCheck": "PASS",
  "npmRunCheckOperatingMode": "PASS (exit0)",
  "evidenceIntegrity": "PASS:76 unique evidence records,33 retrieval records; required fields, array types, source/time/hash/URL joins, full-body SHA-256 and byte counts verified.",
  "rawGovernmentBodiesInGit": false,
  "sourceTotalResponseBytes": 6089377,
  "sessionId": "01a10be5-a09c-7373-a5ea-f8251b04328b",
  "model": "gpt-6-astra",
  "effort": "xhigh",
  "runtimeTestsOrBuild": "Not run locally: docs-only task explicitly does not require full runtime tests/build; none for future runtime added.",
  "ciAndVercel": "New delivery exact-head status checked only after push and reported separately. Seed/main results not reused.",
  "independentReview": "NOT PERFORMED by this writer; required next. PR stays Draft.",
  "lastLiveRecheck": "main, mode, #751, #748, #844 and Draft #845 unchanged immediately before commit"
}
```


The containing Git commit is the reviewable delivery revision. Its SHA cannot be embedded into its own immutable contents without changing that SHA. After commit/push the writer separately reports the exact head, remote match, actual ahead/behind, changed-file list and available exact-head CI/Vercel status. These documents make no prospective CI-success claim.

Exact PR changed files (including the unchanged task already introduced by seed):

- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_TASK_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_REPORT_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_HANDOFF_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-05.md`

Only the four delivery documents are added by this writer; task remains byte-identical. No full runtime build/test is required locally for this docs-only slice; ordinary repository CI is inspected after push. No tests for prospective runtime code were written.

## Scope and stop

No runtime/code/schema implementation, UI/traveller fields, DB/Supabase, registration/profile/extractor/policy activation, accepted Evidence, Rule acceptance, F8, production change, provider/model API integration or paid external API calls. No CH-01..CH-10 re-research, CH-11 or global source sweep. CH-01..CH-10 remain `RESEARCH_ONLY` / `NOT_APPROVED_FOR_DATABASE_IMPORT`.

PR remains **Draft**. No Ready, merge or follow-up slice. This report does not claim independent approval.

**ETA_SEMANTIC_CONTRACT_STILL_NOT_READY**

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
