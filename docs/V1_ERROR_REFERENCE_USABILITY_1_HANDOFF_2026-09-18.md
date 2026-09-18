# Jetnity – V1 Error Reference Usability 1 HANDOFF

Stand: 18. September 2026  
Status: **GATED ON `afb0b98b` / BEHIND 0 / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE**

Binding task: `docs/V1_ERROR_REFERENCE_USABILITY_1_TASK_2026-09-18.md`  
Detailed status: `docs/V1_ERROR_REFERENCE_USABILITY_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_ERROR_REFERENCE_USABILITY_1_SELF_REVIEW_2026-09-18.md`

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #482 |
| Draft PR | #483 |
| Branch | `fix/v1-error-reference-usability-1` |
| Canonical / live main | `21f489d3beed55ca6a80d901d4aded5e669eb1a9` |
| Merge-base | `21f489d3` |
| Ahead / behind at `afb0b98b` | 3 / **0** |
| Gated implementation head | `afb0b98b68dd108a78346917fc5d72b2a54a7b9b` |
| Agent | Jetnity V1 error reference usability 1, Generation 1 |
| Session | `bc-866fcdf8-8f6c-43e4-b65e-181269888c89` |
| Model | Cursor Grok 4.6 High Fast — no Auto/substitution |

## 2. What a reviewer should verify first

1. Merge-base equals current `origin/main` `21f489d3`. Behind is 0.
2. Public, account and admin error boundaries all call `oeffentlicheFehlerId(..., React.useId())` and show `Fehler-ID`.
3. All three expose `mailto:info@jetnity.ch` with no query prefill.
4. Admin no longer shows optional `Ref: {error.digest}` and does not render `error.message` outside the development-only block.
5. The support runbook states **no operator-side automatic Fehler-ID correlation** today and does not tell operators to say “we can look this ID up”.
6. Finding 4.3 user-facing/process half closed; 5.5 tooling remains open and is not marked PASS.
7. Local gates on `afb0b98b`: 3488 tests, typecheck, lint, build, hygiene PASS.
8. Exact-head CI `35355276691` SUCCESS; Vercel Preview `8H5mfBS3su2z3NqSrvVCFcUa6VPJ` READY.
9. No error-tracking vendor, secret, DB/Auth/RLS/migration or Production write.
10. Re-fetch CI / Preview on the **current** head after this persist.

## 3. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.**
