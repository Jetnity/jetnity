# Jetnity – V1 Error Reference Usability 1 STATUS

Stand: 18. September 2026  
Status: **IMPLEMENTATION GATED ON `afb0b98b` / THIS EVIDENCE COMMIT INVALIDATES THAT EXACT-HEAD / BEHIND 0 / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #482  
Draft PR: #483  
Branch: `fix/v1-error-reference-usability-1`  
Binding task: `docs/V1_ERROR_REFERENCE_USABILITY_1_TASK_2026-09-18.md`  
Canonical base: `main@21f489d3beed55ca6a80d901d4aded5e669eb1a9`  
Dispatch head: `e94868e48f94fbca852e9480fd3e2355b6757fc6`  
Implementation / gated head: `afb0b98b68dd108a78346917fc5d72b2a54a7b9b`

Cursor-Agent: **Jetnity V1 error reference usability 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-866fcdf8-8f6c-43e4-b65e-181269888c89`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. Goal

Close the user-facing/process half of audit finding 4.3: make public, account and admin error identifiers actionable through the existing `info@jetnity.ch` channel, without claiming operator-side automatic correlation.

## 2. Implemented

- Public and account error boundaries keep `oeffentlicheFehlerId(error.digest, React.useId())` and add a factual `mailto:info@jetnity.ch` plus German copy that the user may include the shown Fehler-ID.
- Admin error boundary no longer depends on `error.digest`. It uses the shared helper with a render-stable `useId` fallback and always shows `Fehler-ID`.
- Admin no longer renders `error.message` in Production. Raw details remain development-only.
- Mailto has no subject/body/user/account/URL prefill.
- Support runbook no longer claims that account routes lack an error boundary, that admin IDs exist only with a digest, or that error surfaces lack the contact path.
- Finding 4.3 is recorded as **user-facing/process half closed**. Correlation/tooling remains **open under 5.5**. 5.5 tooling is not marked PASS.

No Sentry, Vercel Observability, Logtail, helpdesk or other error-tracking/correlation tooling was added. No secret, env, DB, Supabase, Auth, RLS, migration, service-role, cost or Production write.

## 3. Changed files at gated head `afb0b98b`

| File | Change |
| --- | --- |
| `app/(public)/error.tsx` | factual mailto + Fehler-ID copy |
| `app/account/error.tsx` | factual mailto + Fehler-ID copy |
| `app/(admin)/admin/error.tsx` | shared Fehler-ID, no Production `error.message`, factual mailto |
| `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md` | current-truth update for 4.3 halves |
| `lib/next/error-reference-usability-contract.test.ts` | new contract lock |
| `lib/next/account-error-boundary-contract.test.ts` | mailto lock |
| `docs/V1_ERROR_REFERENCE_USABILITY_1_TASK_2026-09-18.md` | binding task (dispatch) |

This persist adds the STATUS / HANDOFF / SELF_REVIEW files and creates a new head.

## 4. Traveller-context check

Not relevant. This slice does not collect, infer or display citizenship, document, residence or route facts.

## 5. Hard exclusions held

No vendor SDK. No helpdesk. No ticket system. No SLA / 24/7 claim. No automatic operator-side Fehler-ID correlation. No global continuity edits. No Ready. No merge. No follow-up slice.

## 6. Local gates on `afb0b98b`

| Gate | Result |
| --- | --- |
| Targeted contract tests | PASS – 11/11 |
| `npm test` | PASS – **3488** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, 138 pre-existing warnings |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |
| `npm run check:dead` | PASS |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run build` | PASS |

## 7. Exact-head GitHub CI + Vercel Preview on `afb0b98b`

These IDs belong to `afb0b98b`. This evidence persist invalidates that SHA as the live current head. Re-fetch the persist head.

| | |
| --- | --- |
| SHA | `afb0b98b68dd108a78346917fc5d72b2a54a7b9b` |
| GitHub CI | [35355276691](https://github.com/Jetnity/jetnity/actions/runs/35355276691) **SUCCESS** (`pull_request`) |
| Typecheck, Lint & Build | SUCCESS (`105633274337`) |
| Auth-Konfiguration gegen config.toml | SUCCESS (`105633274639`) — current complete result; not skipped |
| Vercel Preview Comments | SUCCESS (`105633137447`) |
| Vercel commit status | **success** — `8H5mfBS3su2z3NqSrvVCFcUa6VPJ` READY |
| Inspector | https://vercel.com/jetnity-e1b93c82/jetnity-app/8H5mfBS3su2z3NqSrvVCFcUa6VPJ |
| Preview | https://jetnity-app-git-fix-v1-error-reference-f0d67c-jetnity-e1b93c82.vercel.app |
| Vercel live-feedback | 0 unresolved / 0 total |

## 8. `origin/main` drift (re-fetched 18 September 2026, at `afb0b98b`)

| | |
| --- | --- |
| Live `origin/main` | `21f489d3beed55ca6a80d901d4aded5e669eb1a9` |
| Merge-base | `21f489d3beed55ca6a80d901d4aded5e669eb1a9` |
| Ahead at `afb0b98b` | 3 |
| Behind | **0** |
| PR mergeable_state | **clean** |

## 9. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.** Do not Ready. Do not merge. Do not start a follow-up slice. Re-fetch exact-head CI / Preview on the live persist head.
