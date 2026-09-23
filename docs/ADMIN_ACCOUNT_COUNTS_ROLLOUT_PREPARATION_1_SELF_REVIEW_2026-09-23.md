# Admin Account Counts Rollout Preparation 1 — SELF_REVIEW

Stand: 23. September 2026  
Status: **AUTHOR SELF-CHECK AFTER TL RESIDUAL R1 + R3 / NOT INDEPENDENT TECHNICAL-LEAD PASS**

Agent: **Jetnity admin account counts rollout preparation 1**, Generation 1  
Session: `bc-4bf6acab-25f3-4d63-9199-ac365b9c011a`  
Model: `cursor-grok-4.6-high-fast` (required and actual; no Auto)

This is not a merge recommendation.

## Scope kept

Writes stayed inside the named rollout-preparation paths. Accepted product SQL, Auth, activation, checkers, package and central docs were not edited. Bootstrap ran only on the disposable fixture database. The banned/disabled finding was preserved, not greened. R2 revoke→removal tests were kept.

## What was actually executed

- 5/5 Node pin/reject tests, exit 0
- 136/136 disposable SQL/lifecycle proofs, exit 0, cluster directory removed
- 23/23 unchanged activation/reader/parser tests, exit 0
- `check:dead` / `check:exports` / `check:operating-mode` PASS

Full suite, production build, typecheck, lint and hosted gates were not run by this persist.

## Residual R1 / R3 self-check

- Expected ACL is a source-derived tuple list, not a copy of the target ACL. `is_grantable=true` fails equality.
- Producer/wrapper EXECUTE WITH GRANT OPTION and schema USAGE WITH GRANT OPTION classify `INCOMPATIBLE`; rollback refuses; objects remain.
- Unexpected `GRANT SELECT ON TABLES` default-ACL row is refused.
- `public.admin_account_counts_v1(text DEFAULT NULL)` is not `FRESH` and blocks both granted and staged apply.
- Staged install: apply + revoke + `REVOKED_EXACT` verify in one transaction. Fault between apply and revoke leaves `FRESH`.
- Granted local-test is still available and labelled database-exposed.

## Honesty

- Banned/disabled privileged callers remained authorized on the granted path. Recorded as NO-GO.
- Browser evidence was not manufactured. #556 remains independent.
- Local engine is 16.15. Functiondef pins are that engine's pretty-print.

## Stop

No Ready. No merge. No follow-up agent. Independent TL re-review of the exact frozen head.
