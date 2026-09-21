# Acceptance matrix — V1 Account Graph Read Completeness 1

Executed by `lib/trips/account-graph-read.test.ts` and `lib/trips/foundation-e-select.test.ts` against the production orchestration.

| # | Case | Expected | Proof |
| --- | --- | --- | --- |
| 1 | Complete canonical multi-citizenship / multi-document party | Successful graph; both citizenships; both documents; selected citizenship associations unchanged | `account-graph-read.test.ts` complete path |
| 2 | Empty canonical party; authoritative empty children with leftover CH/passport columns | Valid success; party/children stay empty; no legacy refill | same file + existing `reisende.test.ts` mapper semantics |
| 3a | Detected missing child relation + nonempty legacy rows | One fallback; `Lesung.problem` / `zeilen: null`; mapper not called | fallback suite |
| 3b | Missing relation + empty fallback | Genuine absent/not-owned empty success | fallback suite |
| 3c | Missing relation + fallback error | Existing error; not empty success | fallback suite |
| 4 | Canonical success with missing/null/non-array child, including mixed travellers | Fail before mapping; no success by dropping the incomplete traveller | incomplete canonical suite |
| 5 | Other canonical error; null-data/no-error; thrown reader; fallback throw | Existing error semantics; no fabricated credentials; no broad retry | error suite |
| 6 | Named `reiseLaden` consumers | Problem stops before actionable graph or mutation | `accountGraphVerbrauch` + real `safetyReiseAufloesen` / `safetyEvaluationsPruefen` |
| 7 | Existing Foundation-E detector and party/legacy mapper tests | Stay green; guest/legacy expansion unchanged | `foundation-e-select.test.ts`, `reisende.test.ts` |

No new official entry guidance. Source/data-boundary evidence is primary. No UI change, so no visual audit.
