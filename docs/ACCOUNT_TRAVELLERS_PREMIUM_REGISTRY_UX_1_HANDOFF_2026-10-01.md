# Account Reisende Premium Registry UX 1 — Handoff

Date: 1 October 2026
Issue: #696
Draft PR: #697
Branch: `fix/account-travellers-premium-registry-ux-1`
Baseline at dispatch: `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`

Logical agent: **Jetnity Account travellers premium registry UX 1**, Generation 1
Session: https://cursor.com/agents/bc-633ab0dd-da04-4405-bec7-0aa94806aba1
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

Technical Lead R1 accepted `63086a3b3fd658c98cadb83693ab9a49be89dacf`. No behaviour correction was requested. The hold was base freshness after #691.

Integrated `origin/main` `d7c266886ae20c1cc5a7413ab87cb1a85171cc27` (merged #686 Source Catalog and #691 Account-home premium overview; #689 Registry→Preparation was already in the previous base). Merge commit: `a3dc862587a09ee6d07e4d817acbda449c30f5d9`. Strategy `ort`, no conflicts. Merge-base is that main SHA. The branch is 0 behind it.

Registry presentation files were not edited in the merge. #686, #689 and #691 stay intact.

The review head is the branch tip after the commit that records this re-gate. Read that SHA from the branch. Do not review `63086a3b` or `main`. No further commit follows the exact-head CI run on that tip.

Stay Draft. Do not Ready. Do not merge. Do not start a follow-up slice.

Read first:

1. `docs/ACCOUNT_TRAVELLERS_PREMIUM_REGISTRY_UX_1_TASK_2026-10-01.md`
2. `docs/ACCOUNT_TRAVELLERS_PREMIUM_REGISTRY_UX_1_REPORT_2026-10-01.md`
3. `docs/ACCOUNT_TRAVELLERS_PREMIUM_REGISTRY_UX_1_SELF_REVIEW_2026-10-01.md`

`docs/ACTIVE_WORK_STATUS.md` was intentionally left unchanged. The task forbids global continuity files. This handoff is the lane pointer.

## Behaviour to review

- First paint is summaries plus **Reisenden hinzufügen**. No citizenship or document form is open.
- **Verwalten** opens the existing citizenship, document, identity and delete controls for that traveller only.
- Opening another traveller, or the add panel, closes the previous heavy panel.
- **Schließen** returns to the summary. Persisted rows come from the traveller prop; unsaved drafts are dropped with the panel.
- Citizenships stay equal and in stored order. Nothing is marked primary.
- A new document still starts with an empty type, empty issuer and empty citizenship association.
- Expiry copy is still `dokumentKontoAblaufText`. A compact **Ablaufhinweis** count is only the existing expired warning.
- Delete still shows `REGISTRY_COPY.loeschenText` and requires **Eintrag löschen**.
- Loading, empty and error copy are unchanged and mutually distinct.
- Phone is one column. Collapsed summaries are two columns from 768px. An open traveller stacks the list in one column.

## Proof boundary

Chromium against `next start` and the audit fixture route. Not a signed-in account. Not a physical device. No Supabase mutation. No Production mutation.

Local re-gate on the integrated tree: `npm test` 4226 pass / 2 fail. Both failures are `initdb` ENOENT. One is `lib/readiness/official-truth-store-server.test.ts`. The other is `lib/readiness/official-truth-source-catalog-server.test.ts` from merged #686. This VM has no PostgreSQL 16 binary. Lint exit 0. Build success. Hygiene checks exit 0. Visual matrix exit 0 with the same 390×844 figures 1947 / 892 / 0.

Exact-head GitHub CI, Auth and Vercel belong to the pushed review tip. This file does not embed a run id.

## Stop

Cursor does not Ready, merge, mutate a database, or open the next slice.
