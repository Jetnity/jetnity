# Trip Workspace Manual Flight Route Completion 1 — Correction Self Review

Date: 5 October 2026 · Issue #836 · Draft PR #837
Correction reviewed: `55abce49e72f2758709c357f5d1af8ec4aa3f356`
Same Generation-1 writer: Codex Desktop, `gpt-6-astra` / `xhigh`. **Not an independent TL review.**

## Finding and correction

The previous self-review incorrectly treated cross-airport local calendar/clock comparisons as a valid input/DB contract. TL comment `5989842622` correctly rejected that behavior at `b1102d29ba447b6a17cc4a74cb0ed5f1d81e1c46`. This correction removes both unsafe comparisons and keeps complete local itinerary values independent of legacy summary representability. Previous exact-head PASS statements no longer apply.

| Boundary | Correction review and evidence |
| --- | --- |
| Scope | Only two runtime files, one existing test file and three delivery docs changed; task byte-identical. |
| Local flight times | Schema accepts earlier local arrival dates and same-date earlier clocks across different airports; no timezone/UTC/duration inference. |
| Connection order | Continuity enforced; date/clock order only at the exact shared airport. Earlier date rejects, equal-date earlier clock rejects only with both clocks; missing clocks remain unknown. |
| Pure summary projection | startsOn/startsAt from first departure. Earlier final date nulls both ends. Later date retains arrival clock only with departure clock. Equal date retains arrival clock only with both clocks and nondecreasing strings. |
| Route retention | No itinerary rewrite; route builder, actual Account metadata, both Guest collections, RouteFacts and FlugRoute preserve exact local fields. Editor reopens those fields. |
| DB representability | Actual Account UPDATE and Guest summaries checked against all three existing legacy SQL CHECK predicates. Tests do not assert SQL was executed. |
| Account/Guest sharing | Both unchanged write paths call the same builder and its one pure projection. Eleven table cases exercise both paths and both Guest collections. |
| Account protection | Existing validation-before-auth, server airport authority, manual guards, five-column UPDATE, metadata CAS, returned-row check and sanitized errors retained. |
| Guest preservation | Exact-one target; null country/city facts; no surface evidence; siblings and other fields unchanged; existing revision/timestamp behavior. |
| Other surfaces | No component, route engine, RLS, schema/migration, provider, assignment, Official Truth or other-slice change in this correction. |

## Fresh validation

- 51 tests in the manual-flight file, including 15 additional P2 cases; 952 focused tests / 169 suites PASS.
- Full npm test: **5,261 PASS / 4 FAIL / 0 skipped**. Four unchanged disposable PostgreSQL proofs fail because a hard-coded Linux initdb path does not exist on macOS. No skip/weakening/out-of-scope repair.
- Typecheck, lint (0 errors / 149 existing warnings), operating mode, API protection, schema-use, dead-code, export and dependency checks PASS; production build PASS.
- Fresh isolated local Chrome Guest proof: exact Date-Line and earlier-clock save/reload/reopen, missing departure clock, same-airport connection rejection without write, absent connection clock acceptance, exact segment details, no 390px overflow or browser exception. Screenshot visually inspected. An initial browser-script locator used the wrong detail label; the corrected locator against the existing UI passed without product code changes.
- Final-head CI and Vercel Preview are checked after the docs commit and recorded in the PR delivery receipt; no old-head result is reused.

## Limits and delivery

Account tests execute actual application action/airport-reader code with mocked auth and DB transport. Constraint assertions mirror the migration predicates; this is not a hosted Account save, trigger execution or independent RLS proof. TL supplied a separate read-only Development/Production RLS result. No hosted DB, provider, secret, migration or Production mutation was performed by this writer.

The summary intentionally loses unrepresentable end values while the canonical itinerary retains them. This is the explicitly requested legacy compatibility policy, not a computation of flight duration or UTC order. Existing route chronology/trust and Guest cross-tab persistence models are unchanged. Browser proof is local Chrome, not physical-device acceptance. New recurring cost: none.

REPORT/HANDOFF disclose all local failures, exact scope, model evidence and final-head receipt procedure. The binding task remains unchanged. No remaining P2 defect was found by this author review; independent acceptance is still required.

**Remain Draft. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD RE-REVIEW. No Ready, merge or follow-up.**
