# Admin Account Counts Rollout Preparation 1 — SELF_REVIEW

Stand: 23. September 2026  
Status: **AUTHOR SELF-CHECK AFTER TL R1/R2 REHEARSAL / NOT INDEPENDENT TECHNICAL-LEAD PASS**

Agent: **Jetnity admin account counts rollout preparation 1**, Generation 1  
Session: `bc-4bf6acab-25f3-4d63-9199-ac365b9c011a`  
Model: `cursor-grok-4.6-high-fast` (required and actual; no Auto)

This is not a merge recommendation.

## Scope kept

Writes stayed inside the named rollout-preparation paths. Accepted product SQL, Auth, activation, checkers, package and central docs were not edited. Bootstrap ran only on the disposable fixture database. The banned/disabled finding was preserved, not greened.

## What was actually executed

- 5/5 Node pin/reject tests, exit 0
- 93/93 disposable SQL/lifecycle proofs, exit 0, cluster directory removed
- 23/23 unchanged activation/reader/parser tests, exit 0
- `check:dead` / `check:exports` / `check:operating-mode` PASS

Full suite, production build, typecheck, lint and hosted gates were not run by this persist.

## R1 / R2 self-check

- Classify/verify/rollback embed the same identity subquery. Rollback is not a weaker owner+EXECUTE duplicate.
- Body mutation that keeps the old search strings (`720 hours`, `42501`, `darf_konten_verwalten`, wrapper `btrim`) changes the functiondef digest and is `INCOMPATIBLE`.
- Owner, schema owner, extra EXECUTE grantee, ADP grant, in-schema extra and public dependent are refused; objects remain.
- Package REVOKE is `REVOKED_EXACT` and then removable. Revoke plus anon grant or body drift is not removable.

## Honesty

- Banned/disabled privileged callers remained authorized. Recorded as NO-GO. Not changed in this PR.
- Browser evidence was not manufactured.
- Production 17.6 metadata is TL-dated, not re-read here.
- Local engine is 16.15. Functiondef pins are that engine's pretty-print.
- After the package REVOKE, identity-strict rollback now **succeeds** for `REVOKED_EXACT`. That is the required R2 path, not a failed rollback.

## Stop

No Ready. No merge. No follow-up agent. Independent TL re-review of the exact frozen head.
