# GOV.UK ETA clause-complete audit 1 — Self-review

Date: 5 October 2026

**This is the same writer’s self-review, not independent ChatGPT/Technical-Lead review and not an approval to Ready, merge, accept rules or implement.**

**ETA_SEMANTIC_CONTRACT_STILL_NOT_READY**

Logical writer: **Jetnity Official Truth GOV.UK ETA clause-complete audit 1** · Generation **1**.

[Issue #844](https://github.com/Jetnity/jetnity/issues/844) · [Draft PR #845](https://github.com/Jetnity/jetnity/pull/845) · [Binding task](OFFICIAL_TRUTH_GOVUK_ETA_CLAUSE_COMPLETE_PRIMARY_SOURCE_AUDIT_1_TASK_2026-10-05.md).

Branch: `audit/official-truth-govuk-eta-clause-complete-audit-1`. Baseline: `main@225878a9a7cd7f07a9167b502b8c688fa1613be1`. Immutable seed: `a97e2e632a460070bcd2a50802c6aec997825101`. Immutable task blob: `173d1ae4d12f20a2f9e2bb601e83c0f710a980da`.

Codex session: `01a10be5-a09c-7373-a5ea-f8251b04328b`. Local session metadata/turn context explicitly records **`gpt-6-astra` / `xhigh`** (including current collaboration settings), Codex Desktop, session start `2026-10-05T11:49:20.671Z`. The inspected local rollout is `sessions/2026/10/05/rollout-2026-10-05T13-49-20-01a10be5-a09c-7373-a5ea-f8251b04328b.jsonl` under the local Codex home. Only this identity/model metadata is reported; raw session content is not committed.

## Adversarial checks

| Challenge | Result and evidence |
|---|---|
| Were historical hashes or TL notes substituted for current source content? | No. All mandatory URLs freshly retrieved; full-body hashes/lengths recomputed. Historical missing22,965 bytes explicitly not recovered. |
| Can every substantive record identify its source, clause, time and complete-response hash? | 76 unique structured records with all15 required fields plus local evidence ID;33 full retrieval records; source and corroborating mappings retained. |
| Were residence and entitlement collapsed? | No. I02/I03 are distinct; residenceCountryCode does not prove lawful residence. |
| Was an application date silently replaced with travel date? | No. I05/I06 remain unresolved. I11 travel-date validity attaches to proof document only. |
| Was the no-application case omitted? | No. It is the decisive unresolved R1 cell. Guidance without-ETA arrival does not establish that every person has never applied; it also does not create an application duty. |
| Could Minister consent already granted falsely cure the restriction? | Prevented: I04 describes the restriction itself; no cure inferred. |
| Was age16 a condition of exemption? | No. It is a conditional evidence duty; under16 still subject to lawful-residence criteria and possible questioning. |
| Were pupils guessed from a generic group size? | No. French rule explicit; German ETA1.10 omits unit, while11A(i), guidance and form explicitly supply pupils. Escort sectionD is excluded from listed pupil total. |
| Is the school the same institution the traveller studies at and which organises the party? | Explicit joins in F01/G01 and narrative. Generic membership alone rejected. |
| Were Part1 form clauses treated as optional evidence? | No.11C/11D expressly apply to ETA1.9/1.10 and are retained as incorporated conditions. |
| Were German confirmations collapsed? | No. Institution existence and completed-form authentication have separate actor/action/object discussion. |
| Did the actual PDF add a missed qualifier? | Corrected during self-review: German form also lists valid German travel document for foreigners for other-nationality pupils; German form’s FROM Germany wording and British-citizen listing exception preserved. No resolution guessed for their edge effects. |
| Could old guidance omit a current school route? | General no-ETA list omits German school rule; omission does not remove fresh ETA1.10/11D. |
| Could form parental-consent recommendation contradict required submission? | Stages separated: German carried-copy recommendation versus required validation submission; adult-pupil declaration not silently exempted. |
| Does an ordinary Swiss passport exclude every diplomatic/crew route? | No. S8/S15 tie exemption to function/status, not passport. Coverage C09-C31 stays unknown where facts absent. |
| Were British/Irish, BOTC/BNO and passport-nationality axes confused? | Complete[CH] excludes British/Irish citizenship; separate BOTC/BNO statuses do not automatically disappear. C07 discrepancy retained. |
| Was a non-exhaustive IO list treated as exhaustive? | No. C20-C22 retain agreement-specific scope, referral and senior-role footnotes. No worldwide treaty sweep. |
| Did failing one exemption prove required? | No. All records route-local; every unresolved alternative blocks a general residual. |
| Did a validity/eligibility limit become a requirement premise? | No. B01-B04, ETA1.8 and CD recognition separated. No A result from unsuitable application, passport mismatch, S2 B exclusion or visa-free text. |
| Were assertions about current implementation verified from code? | Read schema1 types, strict parser/evaluator, policy schema pin and store rejection. Missing relations/time/form objects are explicit, not invented current fields. |
| Did schema2 get implemented or casually declared necessary for every atom? | No. Full A conjunction needs versioned delta; existing positive permission atom may fit schema1. No new enum names, fields, runtime tests or code. |
| Could JSON integrity checks be confused with future runtime tests? | No. They only check these audit records/ledger/path allowlist; no executable ETA rule or test added. |
| Are there unsupported PASS claims? | Local/live validation below reports actual observations only. CI/Vercel exact-head status is inspected after push and reported separately, never inferred from seed or main. |

## Validation receipt

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


## Limitations deliberately retained

Official pages vary in age; retrieval now does not make every old internal reference current law. S17’s additional statutory restriction is not reconciled by silence in S8. Public EXM/CTA pages contain internal-only redactions, and IO/reciprocal arrangements are not exhaustive. S26 predates ETA and does not by itself resolve ETA effect. No global assertion that no other official clarification exists is made. No actual traveller status, document, legal entitlement or trip is adjudicated.

The structured legal audit is reviewable, but the semantic contract is not closed. Raw responses are not committed; a later reviewer can independently revisit canonical URLs/locators and assess text changes without treating new response hashes as equivalent snapshots. This writer cannot perform its own independent Technical-Lead exact-head review.

No runtime/schema2/UI/DB/Supabase/registration/profile/extractor/policy/Evidence/Rule/F8/production/provider/paid-call changes; no CH research expansion. Exact task remains immutable; four delivery docs only. PR stays Draft.

**ETA_SEMANTIC_CONTRACT_STILL_NOT_READY**

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
