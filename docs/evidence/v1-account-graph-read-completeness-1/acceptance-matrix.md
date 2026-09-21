# Acceptance matrix — V1 Account Graph Read Completeness 1

| # | Case | Expected | Proof | Evidence class |
| --- | --- | --- | --- | --- |
| 1 | Complete canonical multi-citizenship / multi-document party | Successful graph; both citizenships; both documents; selected citizenship associations unchanged | `account-graph-read.test.ts` complete path | Executed orchestration |
| 2 | Empty canonical party; authoritative empty children with leftover CH/passport columns | Valid success; party/children stay empty; no legacy refill | same file + existing `reisende.test.ts` mapper semantics | Executed orchestration + existing mapper tests |
| 3a | Detected missing child relation + nonempty legacy rows | One fallback; `Lesung.problem` / `zeilen: null`; mapper not called | fallback suite | Executed orchestration |
| 3b | Missing relation + empty fallback | Genuine absent/not-owned empty success | fallback suite | Executed orchestration |
| 3c | Missing relation + fallback error | Existing error; not empty success | fallback suite | Executed orchestration |
| 4 | Canonical success with missing/null/non-array child, including mixed travellers | Fail before mapping; no success by dropping the incomplete traveller | incomplete canonical suite | Executed orchestration |
| 5 | Other canonical error; null-data/no-error; thrown reader; fallback throw | Existing error semantics; no fabricated credentials; no broad retry | error suite | Executed orchestration |
| 6 | Named `reiseLaden` consumers | Problem stops before actionable graph or mutation | Executed: Safety + registry orchestration. All other named callers: source inspection matrix | Mixed — see `consumer-source-review.md` |
| 7 | Existing Foundation-E detector and party/legacy mapper tests | Stay green; guest/legacy expansion unchanged | `foundation-e-select.test.ts`, `reisende.test.ts` | Executed existing tests |

Acceptance #6 is not claimed as an executed test of every page/action. Those callers were source-read. Invented shared-runtime usage is not evidence.

No new official entry guidance. Source/data-boundary evidence is primary. No UI change, so no visual audit.
