# Admin Account Counts Delivery 1 — SELF-REVIEW

Stand: 22. September 2026  
Author self-review is **not** Technical-Lead PASS.

## Scope fidelity

- Delivery implementation only; not another inventory and not the rejected #549 unavailable-metric dashboard.
- Two accepted measures only. Existing Admin trip tiles unchanged.
- Default-off. Hosted/Production/Preview hard-disabled even with the local flag.
- No new HTTP route, tracking, partner report, placeholder dashboard, or migration-directory file.
- #550/#552 files read-only. Central docs left to #551.
- No merge/rebase/force/import of #551. Main drift reported as none.

## Security

- Wrapper is SECURITY INVOKER, not a second DEFINER, and does not read `auth.users`.
- EXECUTE granted only to authenticated; PUBLIC/anon/service_role revoked.
- Reader uses the existing SSR/session client. No service role.
- Break-glass cannot read counts. Role-backed `konten-verwalten` + AAL2 is required before RPC.
- Error/empty/denial never becomes successful zero. Missing function is unavailable.
- Counts stay canonical decimal strings. Numbers and `?? 0` are rejected.
- No credentials, no remote Supabase client calls, no browser persistence.

## Tests distinguished

| Class | Count | Claim |
| --- | --- | --- |
| Executed SQL wrapper proof | 24 | real disposable PostgreSQL 16.15 |
| Runner safety Node tests | 2 | env reject + local-only source |
| Application/renderer tests | 16 | actual modules, not only regex |
| Full `npm test` | 3873 | includes the 16 new tests |
| Existing auth/capability | 35 | unchanged shared helpers |
| Synthetic UI render | 3 of the 16 | component-tested, not browser E2E |
| Authenticated PostgREST/browser E2E | 0 | **not run** |

## Residual risks

- P1 prevention holds in this slice: hosted activation requires several independent mistakes plus a later apply that this PR does not perform.
- P2: later trusted-postgres breadth and the existing banned-profile helper observation remain for the Production checklist.
- P3: local engine is 16.15, not Production 17.6; no PostgREST/browser E2E.

## STOP

I do not mark Ready. I do not merge. I do not start another agent.
