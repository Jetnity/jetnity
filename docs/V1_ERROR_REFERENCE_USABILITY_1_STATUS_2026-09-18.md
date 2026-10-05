# Jetnity – V1 Error Reference Usability 1 STATUS

Stand: 18. September 2026  
Status: **P2 CORRECTION GATED ON `fcbecf0a` / THIS EVIDENCE COMMIT INVALIDATES THAT EXACT-HEAD / BEHIND 0 / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #482  
Draft PR: #483  
Branch: `fix/v1-error-reference-usability-1`  
Binding task: `docs/V1_ERROR_REFERENCE_USABILITY_1_TASK_2026-09-18.md`  
Canonical base / live main: `main@21f489d3beed55ca6a80d901d4aded5e669eb1a9`  
TL CHANGES REQUIRED: comment `5731552830` on exact head `27e132bf4b268c1aa9091004cd91a9e071fd7491`  
P2 correction / gated head: `fcbecf0a7c77e11aebbfe5f4184d02f07e4baa86`

Cursor-Agent: **Jetnity V1 error reference usability 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-866fcdf8-8f6c-43e4-b65e-181269888c89`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS.

---

## 1. P2 correction

Public `app/(public)/error.tsx` now guards `console.error('[PublicRouteError]', error)` with `process.env.NODE_ENV !== 'production'`, matching the account boundary.

The focused contract test now fails if any of the three error boundaries logs the raw Error object or `error.message` outside a development-only block.

Accepted behavior is unchanged: stable Fehler-ID, bare `mailto:info@jetnity.ch`, no operator-correlation claim, admin Production message hidden, runbook 4.3 half-closed / 5.5-open truth. No vendor, secret, DB, Auth, RLS, migration, service-role or Production write.

## 2. Files changed for this correction

| File | Change |
| --- | --- |
| `app/(public)/error.tsx` | development-only `console.error` |
| `lib/next/error-reference-usability-contract.test.ts` | Production logging lock for all three boundaries |

This persist updates STATUS / HANDOFF / SELF_REVIEW and creates a new head.

## 3. Traveller-context check

Not relevant. Unchanged.

## 4. Hard exclusions held

No vendor SDK. No helpdesk. No Ready. No merge. No follow-up slice. No global continuity edits.

## 5. Local gates on `fcbecf0a`

| Gate | Result |
| --- | --- |
| Targeted contract tests | PASS – 12/12 |
| `npm test` | PASS – **3489** tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, 138 pre-existing warnings |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |
| `npm run check:dead` | PASS |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run build` | PASS |

## 6. Exact-head GitHub CI + Vercel Preview on `fcbecf0a`

These IDs belong to `fcbecf0a`. This evidence persist invalidates that SHA as the live current head. Re-fetch the persist head.

| | |
| --- | --- |
| SHA | `fcbecf0a7c77e11aebbfe5f4184d02f07e4baa86` |
| GitHub CI | [35357292819](https://github.com/Jetnity/jetnity/actions/runs/35357292819) **SUCCESS** (`pull_request`) |
| Typecheck, Lint & Build | SUCCESS (`105639644622`) |
| Auth-Konfiguration gegen config.toml | SUCCESS (`105639644856`) — current complete result; not skipped |
| Vercel Preview Comments | SUCCESS (`105639808124`) |
| Vercel commit status | **success** — `4ezFtqyNT2mYd4bnvgBgP7DH3gtF` READY |
| Inspector | https://vercel.com/jetnity-e1b93c82/jetnity-app/4ezFtqyNT2mYd4bnvgBgP7DH3gtF |
| Preview | https://jetnity-app-git-fix-v1-error-reference-f0d67c-jetnity-e1b93c82.vercel.app |
| Vercel live-feedback | 0 unresolved / 0 total |

## 7. `origin/main` drift (re-fetched 18 September 2026, at `fcbecf0a`)

| | |
| --- | --- |
| Live `origin/main` | `21f489d3beed55ca6a80d901d4aded5e669eb1a9` |
| Merge-base | `21f489d3beed55ca6a80d901d4aded5e669eb1a9` |
| Ahead at `fcbecf0a` | 5 |
| Behind | **0** |

## 8. Historical heads (invalidated)

| Head | Note |
| --- | --- |
| `afb0b98b` | pre-P2 implementation; CI `35355276691` / Preview `8H5mfBS3su2z3NqSrvVCFcUa6VPJ` |
| `27e132bf` | TL CHANGES REQUIRED `5731552830` — public Production `console.error` |

## 9. Next step

**STOP FOR TECHNICAL-LEAD REVIEW.** Do not Ready. Do not merge. Do not start a follow-up slice. Re-fetch exact-head CI / Preview on the live persist head.
