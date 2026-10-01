# Official Truth Source/Evidence Foundation 1 — Handoff

Date: 1 October 2026
Issue: #672
Draft PR: #673
Branch: `feat/official-truth-source-foundation-1`
Baseline: `main@4379eeede564fcf387dee9d8178bcafcf6692586`

Logical agent: **Jetnity Official Truth source foundation 1**, Generation 1
Session: https://cursor.com/agents/bc-2084780a-4e8d-4334-a56a-6bfba1a65f72
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The source registry, source router and versionable evidence contract are on this Draft branch. Technical-Lead R3 review `5378219037` moved `canonicalUrl` and `retrievedAt` into the same trusted retrieval envelope as `sourceSnapshot`. The model object cannot set those retrieval facts. R1 credential options, coverage modes and the R2 source-hash split stay. The R3 head's own CI is not the run on `23179348da1b842a19851dc656f37ad4ccae3fd6` (CI `36850293350`, Auth job `110330075014`, Typecheck/Lint/Build job `110330075378`, Vercel Preview `dpl_6kC8h3kBQnJLkShpF3AsL73znYjj`).

The R2 correction head was `fc0f0fcf22524f330da427307a56fbe4e47f3a66`. GitHub CI run `36849847761` **SUCCESS**. Typecheck, Lint & Build job `110328634234` **SUCCESS**. Auth job `110328634650` **SUCCESS**. Vercel commit status **success**, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/8CUS12ymfr5ebumJFVnkHBmeypCn`. GitHub Preview deployment `6782078960` **success**, target `https://jetnity-4tjvezsda-jetnity-e1b93c82.vercel.app`. That host returned HTTP 302 to Vercel SSO, so public HTML was not read. The earlier head `9480739db5f3743aaf40987a87e2135bcc48ef82` had CI `36848362225` and Vercel Preview `dpl_FWpJT4DGHg11jmMuvTxi8rup9gby`. Those do not gate `fc0f0fcf`. The commit that records the R2 gates is a later head and is not gated by run `36849847761`.

The R1 correction head was `276ef7265f1d2989e204462955e7eae54d7401e9`. GitHub CI run `36847770063` **SUCCESS**. Typecheck, Lint & Build job `110321922165` **SUCCESS**. Auth job `110321922436` **SUCCESS**. Vercel commit status **success**, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/EU6DJ5VZdkqKJeJg4CR4t24joLFp`. GitHub Preview deployment `6781726297` **success**, target `https://jetnity-ndyoim48t-jetnity-e1b93c82.vercel.app`. That host returned HTTP 302 to Vercel SSO, so public HTML was not read. The reviewed head was `59d43f4ccc2e4434401596f0b7b4b7c8162719d8`. That head's CI `36845583718`, Auth job `110314809182` and Vercel Preview `dpl_7xsiZ8x62WCCTnbz462chMLJYMqQ` do not gate the correction head. The commit that records the correction gates is a later head and is not gated by run `36847770063`.

The correction keeps one cell per explicit credential option, explicit `independent` / `exact` / `not_applicable` coverage, and a Jetnity source-snapshot fingerprint separate from model extraction text. The existing Requirements / Official-Truth engine is unchanged. `requirementsProviderAus()` returns `null`. There is no database mutation, no network call, no real government catalog and no Timatic/Sherpa adapter.

Read first:

1. `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_REPORT_2026-10-01.md`
4. ADR-0216 in `DECISIONS.md`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Product-Owner strategy approval re-read here: https://github.com/Jetnity/jetnity/issues/294#issuecomment-5928669189
- Machine mode: `NORMAL`
- This branch started 1 commit ahead of `origin/main` and 0 behind. That commit is the task seed `2ed4a84d0466fe294ba9a9c02b98336d04b1c817`.
- Delivery head `3d1b7aed5d165a1391f3e34a0a5da0fb2b3369a1`: GitHub CI run `36845062197` **SUCCESS**. Typecheck, Lint & Build job `110313108894` **SUCCESS**. Auth job `110313108531` **SUCCESS**. Vercel commit status **success**, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/HsYpkxb9hDhEWHu7JCGKyJJgRD1K`. GitHub Preview deployment `6781261272` **success**, target `https://jetnity-rh4u11362-jetnity-e1b93c82.vercel.app`. That host returned HTTP 302 to Vercel SSO, so public HTML was not read.
- The commit that records the `3d1b7aed` gates is `59d43f4ccc2e4434401596f0b7b4b7c8162719d8`. Technical-Lead R1 also read CI `36845583718` on that same SHA. Neither set gates the R1 correction head.
- The correction head `276ef7265f1d2989e204462955e7eae54d7401e9` is gated by CI `36847770063` and Preview deployment `6781726297` only. The commit that writes those facts is a newer head. Do not treat `main` or a parent PR as this head's gate.

## Stop

Stay Draft.

Cursor does not Ready, merge, mutate Supabase, call OpenAI or the web, activate a provider, contact Sherpa/IATA/KAYAK, continue #626, change indexing or launch, or start a follow-up slice.

**STOP for independent Technical-Lead final review of the R3 provenance head.**

## Proposal only — not selected

If the Technical Lead accepts this head, the next bounded design could specify a Development-only private evidence store. It is not authorized by this handoff. Production persistence remains a Product-Owner gate.
