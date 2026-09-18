# Jetnity – V1 Error Reference Usability 1 HANDOFF

Stand: 18. September 2026  
Status: **P2 CORRECTION GATED ON `fcbecf0a` / BEHIND 0 / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE**

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
| Ahead / behind at `fcbecf0a` | 5 / **0** |
| TL CHANGES REQUIRED | comment `5731552830` on `27e132bf` |
| P2 correction head | `fcbecf0a7c77e11aebbfe5f4184d02f07e4baa86` |
| Agent | Jetnity V1 error reference usability 1, Generation 1 |
| Session | `bc-866fcdf8-8f6c-43e4-b65e-181269888c89` |
| Model | Cursor Grok 4.6 High Fast — no Auto/substitution |

## 2. What a reviewer should verify first

1. Merge-base equals current `origin/main` `21f489d3`. Behind is 0.
2. Public `console.error('[PublicRouteError]', error)` is inside `NODE_ENV !== 'production'`.
3. The contract test rejects ungated Production `console.error(..., error)` on public, account and admin.
4. Accepted 4.3 user-facing behavior is unchanged: stable Fehler-ID, bare mailto, no correlation claim, admin Production message hidden.
5. Local gates on `fcbecf0a`: 3489 tests, typecheck, lint, build, hygiene PASS.
6. Exact-head CI `35357292819` SUCCESS including Auth `105639644856`; Vercel Preview `4ezFtqyNT2mYd4bnvgBgP7DH3gtF` READY.
7. Re-fetch CI / Preview on the **current** head after this persist.

## 3. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.**
