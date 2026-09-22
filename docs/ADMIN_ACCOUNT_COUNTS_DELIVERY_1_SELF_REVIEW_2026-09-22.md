# Admin Account Counts Delivery 1 — SELF-REVIEW

Stand: 22. September 2026  
Author self-review is **not** Technical-Lead PASS.

## Scope fidelity

- Same session as the reviewed implementation. R1–R4 only. No new product surface.
- Existing Admin trip tiles unchanged.
- Default-off. Hosted/Production/Preview hard-disabled even with the local flag.
- #550/#552 and central docs read-only. Checker ownership unchanged.

## R1–R4 response

- Runtime loader no longer accepts a substitute environment. Pure evaluator cannot call shared dependencies.
- Parser rejects the four executed TL counterexamples and keeps the requested positive controls.
- Scanner-invisibility lock-in test removed. Addendum-authorized checker change records one LOCAL/UNAPPLIED path-and-RPC pair. Generated types unchanged.
- Structured error/denial mapping: missing function by code only; lookup failures failed; denials/break-glass forbidden; containment preserved.

## Tests distinguished

| Class | Count | Claim |
| --- | --- | --- |
| Wrapper checks | 24 mixed | 15 SQL, 6 catalog, 2 source, 1 Node cleanup |
| Runner safety Node tests | 2 | env reject + local-only source |
| Application/renderer tests | 30 | actual modules, including exported loader and checker |
| Full `npm test` | 3887 | includes the 30 delivery tests |
| Existing auth/capability | 35 | unchanged shared helpers |
| Synthetic UI render | 3 of the 26 | component-tested, not browser E2E |
| Authenticated PostgREST/browser E2E | 0 | **not run** |

## Residual risks

- P2: LOCAL/UNAPPLIED schema-reference classification is not Production installation and must be reconciled before any apply.
- P2: trusted-postgres breadth and the banned-profile helper observation remain for the Production checklist.
- P3: local engine is 16.15, not Production 17.6; no PostgREST/browser E2E.

## STOP

I do not mark Ready. I do not merge the PR. I do not start another agent.
