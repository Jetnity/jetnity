# Admin Account Counts Delivery 1 — SELF-REVIEW

Stand: 22. September 2026  
Author self-review is **not** Technical-Lead PASS.

## Scope fidelity

- Same session as the reviewed implementation. Residual R1 only. R2/R3/R4 implementation preserved.
- Existing Admin trip tiles unchanged.
- Default-off. Hosted/Production/Preview hard-disabled even with the local flag.
- Shared edit is only the authorized read-only getter on `lib/supabase/server.ts`.
- #550/#552 and central docs read-only. Checker ownership unchanged.

## Residual R1 response

- Activation no longer captures `NEXT_PUBLIC_SUPABASE_URL` a second time.
- Runtime enablement reads `getServerSupabaseUrl()`, which returns the same `SUPABASE_URL` already used by the three session factories.
- Isolated regressions import the shared server first with a synthetic remote URL, then change only the process URL to loopback, then call the no-argument loader. Result is disabled with zero guard/cookie/client/RPC calls.
- Inverse/stale, default-off, hosted and missing-target cases stay disabled.
- Genuine local shared target: one role-backed authorized path, one wrapper RPC, validated counts.
- Default `AdminAccountCounts` is exercised for disabled/success/failed rendering. That is not `AdminAccountCountsAnsicht` given a prepared result and not browser E2E.

## Tests distinguished

| Class | Count | Claim |
| --- | --- | --- |
| Wrapper checks | 24 mixed | 15 SQL + 6 catalog including executed no-argument rejection + 2 source + 1 Node cleanup. New execution on this persist; SQL sources unchanged. |
| Runner safety Node tests | 2 | env reject + local-only source |
| Application/module tests | 36 | not one bucket: 6 activation helpers, 6 isolated actual-loader/default-component, 7 parser, 10 reader (including injected `runtimeEnabled` helpers), 3 Ansicht renders, 4 checker |
| Isolated actual loader / default component | 6 of the 36 | real shared factory + intercepted SSR; would fail the reviewed split-capture implementation |
| Synthetic Ansicht renders | 3 of the 36 | prepared-result UI only; not the default component; not browser E2E |
| Checker regressions | 4 of the 36 | LOCAL/UNAPPLIED path/RPC inventory, not SQL semantic validation |
| Full `npm test` | 3893 | includes the 36 delivery tests |
| Existing auth/capability | 35 | unchanged shared helpers |
| Authenticated PostgREST/browser E2E | 0 | **not run** |

The earlier `3 of the 26` wording was stale after the R1–R4 package (then 30 tests) and is replaced by the table above.

## Residual risks

- P2: LOCAL/UNAPPLIED schema-reference classification is not Production installation and must be reconciled before any apply.
- P2: trusted-postgres breadth and the banned-profile helper observation remain for the Production checklist.
- P3: local engine is 16.15, not Production 17.6; no PostgREST/browser E2E.

## STOP

I do not mark Ready. I do not merge the PR. I do not start another agent.
