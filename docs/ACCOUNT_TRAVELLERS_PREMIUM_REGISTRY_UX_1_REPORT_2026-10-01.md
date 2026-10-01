# Account Reisende Premium Registry UX 1 — Report

Date: 1 October 2026
Issue: #696
Draft PR: #697
Branch: `fix/account-travellers-premium-registry-ux-1`
Baseline at dispatch: `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`
Integrated main: `98c9099bee1715f741e4aec87c2c386e9e5344ad` (#689)
Merge-base with that main: the same SHA. This branch is 0 behind it.

Logical agent: **Jetnity Account travellers premium registry UX 1**, Generation 1
Session: https://cursor.com/agents/bc-633ab0dd-da04-4405-bec7-0aa94806aba1
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Outcome

`/account/travellers` opens as a compact registry. The first paint shows the title, the existing registry/snapshot explanation, **Reisenden hinzufügen**, and one summary card per traveller. Citizenship and document add/edit forms stay closed until that traveller’s **Verwalten** is opened. Only one management panel is open at a time. Closing it returns to the summary. While one traveller is open, the list stacks in a single column so the editor can use the width; collapsed summaries use two columns from the `md` breakpoint.

Stored truth on a summary: display label, residence, citizenship labels and count, document-type labels and count, and a compact **Ablaufhinweis** when `dokumentKontoAblaufWarnung` is true. The exact lifecycle sentence stays inside management.

Unchanged contracts: equal citizenships, no primary or preferred citizenship, no default passport, issuer and citizenship stay independent, association stays optional and empty until set, delete still requires the existing confirmation and the existing trip-snapshot sentence, no passport number, document number, MRZ, scan, biometric, health or date-of-birth field, no Registry→Trip materialization, Loading / Empty / Error stay distinct.

## Measured height

Same two-traveller fixture, production `next start`, Chromium. Before is the previous always-open layout at `max-w-3xl`. After is this presentation at `max-w-6xl`.

| Viewport | Before page / registry / open forms | After page / registry / open forms |
| --- | --- | --- |
| 390×844 | 5901 / 4830 / 5 | 1947 / 892 / 0 |
| 1280×800 | 4273 / 3614 / 5 | 1193 / 550 / 0 |
| 360×800 at 200% text | 17462 / 15134 / 5 | 5676 / 3380 / 0 |

At 390×844 the page is 3954px shorter (67%) and the registry block is 3938px shorter (82%). The add action is above the first card (`hinzufuegenY` 414, first card 482). Before, **Person hinzufügen** sat at y 4611.

Evidence: `docs/evidence/account-travellers-premium-registry-ux-1/`.

## Gates on this session

- Focused registry, country and document-lifecycle tests: pass.
- `npm test`: 4215 pass / 1 fail. The failure is `lib/readiness/official-truth-store-server.test.ts`, `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. This VM has no PostgreSQL 16 binary. That file is not in this lane’s diff. This is not a PostgreSQL proof and not a registry regression.
- `npm run lint`: exit 0. 0 errors, 148 existing warnings. None are in this lane’s files.
- `npm run build`: success, including the production TypeScript pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: exit 0. The schema check still prints the existing LOCAL/UNAPPLIED notes for `admin_account_counts_v1` and `official_truth_store_accepted_v1`. This slice did not add them.
- `git diff --check`: clean at the implementation commit.
- Visual matrix `scripts/account-travellers-premium-registry-ux-1-audit.mjs --marke nachher` after the #689 integration: exit 0. Zero console errors. Inputs in the opened document form computed at 16px. Registry buttons computed at least 44px. No registry horizontal overflow, including 320×568, 844×390, 200% text at 360×800, and desktop zoom 125% / 150%.

## Boundaries

No database, Auth, RLS, provider, Production, indexing, package or global-token change. `docs/ACTIVE_WORK_STATUS.md` was not edited: the binding task forbids global continuity files. This report and the handoff are the lane record.

The audit page `app/(public)/ui-audit/account-travellers/page.tsx` answers 404 unless `JETNITY_UI_AUDIT` is on, and `uiAuditSeiteAktiv` stays off in `VERCEL_ENV=production`. Fixtures are not account data.

Cursor does not Ready or merge and does not start a follow-up. The next step is an independent Technical-Lead review of the pushed tip.
