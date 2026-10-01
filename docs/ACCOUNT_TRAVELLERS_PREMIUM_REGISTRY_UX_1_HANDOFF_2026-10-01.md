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

Integrated `origin/main` `98c9099bee1715f741e4aec87c2c386e9e5344ad` (merge #689). Merge-base is that SHA. The branch was 0 behind after the merge. Re-fetch before treating a later SHA as current. Do not rebase again unless the Technical Lead assigns it.

Parent tip before the evidence-report commit: `be0f13e420dee125bcae4de48c093fb2966d37d3`.
The review head is the branch tip after the commit that adds this handoff and the refreshed `nachher` matrix. Read that SHA from the branch. Do not review the task seed `50f3eebb` or `main`.

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

Local `npm test`: 4215 pass / 1 fail. The failure is the pre-existing `initdb` ENOENT in `lib/readiness/official-truth-store-server.test.ts`. Exact-head GitHub CI, Auth and Vercel Preview belong to the pushed tip. This file does not embed a run id.

## Stop

Cursor does not Ready, merge, mutate a database, or open the next slice.
