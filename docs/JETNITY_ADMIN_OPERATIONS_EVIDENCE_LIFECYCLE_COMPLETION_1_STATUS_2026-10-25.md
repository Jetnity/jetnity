# R106 O — Admin Operations Evidence Lifecycle Completion 1 — STATUS

Date: 2026-10-25. Author: Jetnity Admin Operations Evidence Lifecycle Completion 1 — Cursor Generation 1. Session `bc-5996ba4c-88a4-4a2d-b1ce-d7f1a0e4d79d`. Runtime model `grok-4.7-high-fast`.

## State

R2 closes the remaining O-R5 proof gaps on `feat/r106-admin-operations-evidence-lifecycle-1`, Draft PR #1007. This is not a product PASS, not Ready, and not a merge. TASK blob `e75d3010d861e4047a18f282e5fa03bd74f181dc` and accepted PLAN blob `79bc02e8b00d406e24fa21048860bc122c993e8d` are unchanged. O-1 remains only the existing presentation-test adaptation.

- `origin/main` and merge-base, re-read before this handoff: `500fbe40c8c8a70a0fe0d291782289f809d5d5b3`
- R1 review head: `c12444d735c5d8e8c1c800c5b712ecf48105bdec`
- O-R5 proof commit: `3fb6893b2c0b4927f6e98d71e031b739a46c29c1` (10 ahead / 0 behind)
- Review head: the commit that updates these four lane docs and the new evidence. It does not change the runner or the five digested runtime files. It is 11 ahead / 0 behind if main is still `500fbe40`.
- Runtime product files were not changed for O-R5. The required cases passed on the existing hook.
- Machine mode: `NORMAL`

## O-R5 proof gaps

- Invalid HTTP 200 now goes through the explicit refresh on both boards: null, array, empty object, duplicate id, missing item, wrong id, invalid status, nonempty writeActions, bad metadata, bad time, negative age, and a TTL above the ceiling. Each settled response stays historical, keeps the accepted report and its checkedAt, does not show the invalid body, and is followed by an enabled recovery GET. One forward tick shows the historical report still aging, with no timer GET.
- Each invalid props body has its own mounted page. The recorded phases are exactly `prueft` then `fehler` before any later refresh. The button then starts one usable GET.
- Current 401 is covered on both boards as JSON (`Sitzung abgelaufen.`) and as a malformed body (`Nicht angemeldet.`). Cards stay hidden through a later 503 or invalid 200. A permitted GET clears the latch. The older 401 remains only the stale request in the success-beats-denial case.
- `github-lauf` uses TTL 60 seconds. At 60_000 ms it is fresh with age 60000; after that it is stale. The 300-second boundary is only the GitHub parent. Provider operations has no 300-second card. Its 60-second child is `domain-flights`, also asserted at age 60000.

## Accepted limits

Later uncorrelated props cannot replace an accepted report, reset its age, or clear a denial. The next accepted report is an explicit permitted validated GET.

The frozen 30-second collector cache can already age a child before the board sees the report.

## Proof boundary

Authoritative mounted run: `docs/evidence/admin-operations-evidence-lifecycle-completion-1/run-1792924786492/result.json`, 94/94, exit 0, Chrome `148.0.7778.96`, head `3fb6893b2c0b4927f6e98d71e031b739a46c29c1`. Local component evidence only.

Preserved: root `result.json` and `run-1792897515407` at 44/46; `run-1792898087571` at 46/46; `run-1792923659785` at 68/68 on `1c1bd44f`; the two 66/68 harness races; the dirty-tree 68/68. `run-1792924636541` has no runner result because that process was stopped after `documentElement` was still null. The five runtime digests match the R1 proof.

App run 40157662438 remains CANCELLED and does not cover this head. Fresh full App/Auth and exact-head Preview are not claimed.

## Next actor

Root Technical Lead, independent exact-head re-gate. Cursor does not Ready, merge, close #1004, write `main`, or start a follow-up.
