# Official Truth Source/Evidence Foundation 1 — Report

Date: 1 October 2026
Issue: #672
Pull request: Draft #673
Branch: `feat/official-truth-source-foundation-1`
Baseline: `main@4379eeede564fcf387dee9d8178bcafcf6692586`
Task: `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_TASK_2026-10-01.md`
Task seed: `2ed4a84d0466fe294ba9a9c02b98336d04b1c817` — not the review head

Logical agent: **Jetnity Official Truth source foundation 1**, Generation 1
Session: https://cursor.com/agents/bc-2084780a-4e8d-4334-a56a-6bfba1a65f72
`originalModelName`: `grok-4.7-high-fast` (Grok 4.7 High Fast). Not Auto. Recorded from this run before editing.

Status: **R3 PROVENANCE CORRECTION DELIVERED / DRAFT / NO TL PASS / NO READY / NO MERGE**

## 1. Baseline reconstruction

Re-verified in this session before editing:

| Fact | Result |
| --- | --- |
| Machine mode | `NORMAL` in `.jetnity/operating-mode.json`. This slice does not edit that file. |
| `git fetch origin main` | `origin/main` = `4379eeede564fcf387dee9d8178bcafcf6692586` |
| Merge-base of this branch and `origin/main` | the same SHA |
| Ahead / behind before this delivery | 0 behind, 1 ahead. The ahead commit is the task seed `2ed4a84d0466fe294ba9a9c02b98336d04b1c817`. |
| Latest ADR on that main | ADR-0215. ADR-0216 was free and is used here. |
| Product-Owner strategy | Issue #294 comment `5928669189` (https://github.com/Jetnity/jetnity/issues/294#issuecomment-5928669189), author `Jetnity`, created `2026-10-01T09:30:13Z`. Re-read in this session. |
| `requirementsProviderAus()` | still returns `null`. Covered by `lib/readiness/source-foundation.test.ts`. |

Stated by the binding task and **not re-proven in this session**:

- #671 merged and post-merge CI `36805357009`
- Production `dpl_AdZRa6vD1ci1DFWKGAN2UNEJzjJW`
- Supabase project `qscbgcdmivbbnzrcyegn` and the Development branch having no Official-Evidence tables
- `pg_cron` installed and `pgmq` not installed
- provider waiting states for KAYAK, IATA and Sherpa
- #626 remains open and blocked

This session did not query Supabase, did not open a mailbox, and did not change #626, indexing or launch.

## 2. Architecture delta

Historical runtime truth stays in force: traveller-specific `OfficialEvaluation` is compute-on-read, and there is no Official table.

The Product-Owner decision supersedes that statement only for a future global, non-personal evidence store. This slice adds the contract behind the existing provider boundary:

- source registry and source class split
- source router that plans eligible sources and never emits `not_required`
- versioned evidence envelope, deterministic lookup key, candidate versus accepted boundary

It does not add a second engine, a store, a migration, a catalog of real government domains, or a Timatic/Sherpa adapter. OpenAI is not called. Model output cannot set an official decision. A changed source-content fingerprint is a new version and is not asserted as a changed rule. Conflict does not overwrite accepted evidence.

Technical-Lead review `5377801054` required three contract corrections on exact head `59d43f4ccc2e4434401596f0b7b4b7c8162719d8`. This correction head applies only those:

1. One cell per explicit credential option. The full citizenship set stays on every cell. `relatedCitizenshipCountryCode` is explicit or null. Issuing country does not become citizenship. There is no citizenship × document product.
2. Citizenship, residence and document coverage use `independent`, `exact` or `not_applicable`. An empty exact list is an invalid descriptor. A destination authority can be independent of citizenship, document and residence without enumerating them. Destination and transit stay separate.
3. `sourceContentHash` is computed from normalized `sourceSnapshot`. `extractionNote` and model fields `content`, `contentHash` and `sourceContentHash` cannot set it. The lookup key version is `evidence-key:v2:`.

Technical-Lead review `5378061792` required one further trust-boundary correction on exact head `9480739db5f3743aaf40987a87e2135bcc48ef82`. `evidenceKandidatAusModell` now takes the model object and `EvidenceQuellenmaterial` as separate arguments. The fingerprint is computed only from `material.sourceSnapshot`. A model object that contains `sourceSnapshot`, `content`, `contentHash` or `sourceContentHash` is rejected. R1 credential options and coverage modes are unchanged.

Technical-Lead review `5378219037` required the retrieved URL and retrieval timestamp to move into that same trusted envelope, on exact head `23179348da1b842a19851dc656f37ad4ccae3fd6`. `EvidenceQuellenmaterial` now carries `canonicalUrl`, `retrievedAt` and `sourceSnapshot`. The model object cannot set those fields or `content`, `contentHash` or `sourceContentHash`. The stored URL and timestamp come only from the trusted envelope after registry, HTTPS and source-id checks. R1 and R2 behavior otherwise stays.

The gates below for `3d1b7aed`, `59d43f4c`, `9480739d`, `fc0f0fcf` and `23179348` do not apply to this R3 head. Technical-Lead R3 read CI `36850293350` SUCCESS, Auth job `110330075014` SUCCESS, Typecheck/Lint/Build job `110330075378` SUCCESS and Vercel Preview `dpl_6kC8h3kBQnJLkShpF3AsL73znYjj` READY on `23179348da1b842a19851dc656f37ad4ccae3fd6` only.

Residence is an explicit key dimension (`not_applicable` or one country code). The existing traveller input already has a single residence country. The key does not store a person. Omitting the dimension would let residence-dependent and residence-independent evidence share a key.

## 3. Changed-file manifest

Allowlist only:

- `lib/readiness/source-registry.ts`
- `lib/readiness/source-router.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/source-foundation.test.ts`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_SELF_REVIEW_2026-10-01.md`

`docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_TASK_2026-10-01.md` is the unchanged binding task from the seed commit.
`docs/ACTIVE_WORK_STATUS.md` is outside the allowlist and was not edited. This report and the handoff are the continuity record for the slice.

## 4. Validations

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| `node scripts/operating-mode-guard.mjs` | pass |
| Targeted `lib/readiness/source-foundation.test.ts` | **8/8 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors. 148 existing warnings, none in the new files. |
| `npm test` | **4133 pass / 0 fail** |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass |
| `npm run check:setup:ci` | pass with the existing warning that no `.env` / `.env.local` is present in this environment |
| `npm run build` | pass. Next.js 16.3.8 compiled and generated 25 static pages. |
| Local `auth:pruefen` | not run. This environment has no Supabase auth secrets. |
| Exact-head GitHub CI on `3d1b7aed5d165a1391f3e34a0a5da0fb2b3369a1` | **SUCCESS**. Run `36845062197`, event `pull_request`. Typecheck, Lint & Build job `110313108894` **SUCCESS**. Auth-Konfiguration gegen config.toml job `110313108531` **SUCCESS**. |
| Vercel Preview on that same SHA | GitHub commit status context `Vercel` **success** at `2026-10-01T09:48:32Z`. Inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/HsYpkxb9hDhEWHu7JCGKyJJgRD1K`. GitHub deployment `6781261272`, environment **Preview**, state **success**, target `https://jetnity-rh4u11362-jetnity-e1b93c82.vercel.app`. A direct GET of that host returned HTTP 302 to Vercel SSO, so this session did not read public HTML or `data-dpl-id`. |

These remote gates belong only to `3d1b7aed5d165a1391f3e34a0a5da0fb2b3369a1`. The commit that records them is a new head. It does not inherit this CI, Auth job or Preview. Parent and `main` gates do not apply.

## 5. Things not touched

- Supabase migrations, SQL, RLS, grants, functions, triggers, cron, queues, extensions
- Development and Production database data
- `requirementsProviderAus()`, `lib/readiness/engine.ts`, `lib/readiness/official.ts`
- API routes and UI
- OpenAI, web, fetch, scraper, browser automation
- real government-domain catalog
- Sherpa/Timatic adapter, contact, terms, credentials, spend
- Production env, indexing, launch, #626, PrivacyBee
- personal passport, MRZ, scan, biometric, date of birth, health record, user/trip/traveller ids

## 6. Remaining gate for Supabase persistence

No evidence table exists because of this slice. A later store still needs its own schema decision: private or server-only read path, grants, RLS, migration strategy, Development advisor output and exact readback. Production DDL remains a Product-Owner gate. This report does not open that gate.

## 7. Exact next step — proposal only

Do not dispatch from this slice.

Independent Technical-Lead final review of the R3 provenance correction on Draft #673 is the next action. After a PASS, a separate design slice could specify a Development-only private evidence store. That proposal is not selected here. Cursor does not Ready, merge, or start it.

## 8. R1 correction validation

Local checks for the correction, recorded before its push:

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| `node scripts/operating-mode-guard.mjs` | pass |
| Targeted `lib/readiness/source-foundation.test.ts` | **8/8 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors. 148 existing warnings, none in the changed readiness files. |
| `npm test` | **4133 pass / 0 fail** |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass. Schema check still notes the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`. |
| `npm run check:setup:ci` | pass, with the existing missing-`.env` warning |
| `npm run build` | pass. Next.js 16.3.8 compiled and generated 25 static pages. |
| Local `auth:pruefen` | not run. This environment has no Supabase auth secrets. |
| Exact-head GitHub CI on `276ef7265f1d2989e204462955e7eae54d7401e9` | **SUCCESS**. Run `36847770063`, event `pull_request`, https://github.com/Jetnity/jetnity/actions/runs/36847770063. Typecheck, Lint & Build job `110321922165` **SUCCESS**. Auth-Konfiguration gegen config.toml job `110321922436` **SUCCESS**. |
| Vercel Preview on that same SHA | GitHub commit status context `Vercel` **success** at `2026-10-01T10:13:59Z`. Inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/EU6DJ5VZdkqKJeJg4CR4t24joLFp`. GitHub deployment `6781726297`, environment **Preview**, state **success**, target `https://jetnity-ndyoim48t-jetnity-e1b93c82.vercel.app`. A direct GET of that host returned HTTP 302 to Vercel SSO, so this session did not read public HTML or `data-dpl-id`. |

These remote gates belong only to `276ef7265f1d2989e204462955e7eae54d7401e9`. The commit that records them is a newer head. It does not inherit this CI, Auth job or Preview. Parent and `main` gates do not apply.

Technical-Lead R1 independently read these gates on `59d43f4ccc2e4434401596f0b7b4b7c8162719d8` only: CI `36845583718` SUCCESS, Auth job `110314809182` SUCCESS, Typecheck/Lint/Build job `110314809725` SUCCESS, Vercel Preview `dpl_7xsiZ8x62WCCTnbz462chMLJYMqQ` READY. They became invalid when the R1 correction was pushed.

## 9. R2 trust-boundary validation

Local checks for the R2 correction, recorded before its push:

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| `node scripts/operating-mode-guard.mjs` | pass |
| Targeted `lib/readiness/source-foundation.test.ts` | **8/8 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors. 148 existing warnings, none in the changed readiness files. |
| `npm test` | **4133 pass / 0 fail** |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass. Schema check still notes the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`. |
| `npm run check:setup:ci` | pass, with the existing missing-`.env` warning |
| `npm run build` | pass. Next.js 16.3.8 compiled and generated 25 static pages. |
| Local `auth:pruefen` | not run. This environment has no Supabase auth secrets. |
| Exact-head GitHub CI on `fc0f0fcf22524f330da427307a56fbe4e47f3a66` | **SUCCESS**. Run `36849847761`, event `pull_request`, https://github.com/Jetnity/jetnity/actions/runs/36849847761. Typecheck, Lint & Build job `110328634234` **SUCCESS**. Auth-Konfiguration gegen config.toml job `110328634650` **SUCCESS**. |
| Vercel Preview on that same SHA | GitHub commit status context `Vercel` **success** at `2026-10-01T10:33:38Z`. Inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/8CUS12ymfr5ebumJFVnkHBmeypCn`. GitHub deployment `6782078960`, environment **Preview**, state **success**, target `https://jetnity-4tjvezsda-jetnity-e1b93c82.vercel.app`. A direct GET of that host returned HTTP 302 to Vercel SSO, so this session did not read public HTML or `data-dpl-id`. |

These remote gates belong only to `fc0f0fcf22524f330da427307a56fbe4e47f3a66`. The commit that records them is a new head. It does not inherit this CI, Auth job or Preview. Do not reuse CI `36848362225` or Preview `dpl_FWpJT4DGHg11jmMuvTxi8rup9gby` from `9480739db5f3743aaf40987a87e2135bcc48ef82`. Parent and `main` gates do not apply.

## 10. R3 provenance validation

Local checks for the R3 correction, recorded before its push:

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| `node scripts/operating-mode-guard.mjs` | pass |
| Targeted `lib/readiness/source-foundation.test.ts` | **8/8 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors. 148 existing warnings, none in the changed readiness files. |
| `npm test` | **4133 pass / 0 fail** |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass. Schema check still notes the pre-existing LOCAL/UNAPPLIED RPC `admin_account_counts_v1`. |
| `npm run check:setup:ci` | pass, with the existing missing-`.env` warning |
| `npm run build` | pass. Next.js 16.3.8 compiled and generated 25 static pages. |
| Local `auth:pruefen` | not run. This environment has no Supabase auth secrets. |
| Exact-head GitHub CI / Auth / Vercel on the R3 head | not observed yet. Do not reuse CI `36850293350`, Auth job `110330075014`, Typecheck/Lint/Build job `110330075378`, or Preview `dpl_6kC8h3kBQnJLkShpF3AsL73znYjj`. |
