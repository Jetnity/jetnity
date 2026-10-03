# Admin Operations Polish 2

User-authorized follow-up to the nine screenshots and the accepted design review (3 October 2026).

## Goal and ownership

Polish Users, Payments, Security, System Health, Provider & Costs and the indexing panel. Preserve Jetnity tokens and the existing behavior. Own only their page presentation, components, dedicated presentation tests, audit and slice documentation.

Stacked branch `ui/admin-operations-pages-polish`, based on PR #778 head `cdee80e1c5183ec77a1237cadc3fb76b74496483`. PR #778 supplies the responsive shell and evidence disclosure. This PR targets that branch while #778 remains a draft. Neither PR is authorized to merge.

## Plan

1. Payments: distinguish unavailable commercial revenue from local recorded amounts; replace an empty chart with a clear empty state, use daily bars for recorded values, simplify tabs and local-note copy.
2. Security: retain visible incomplete-coverage and unenforced-blocklist warnings, label entries accurately, separate event search from entry controls, preserve all reads/writes and filters.
3. System Health / Provider & Costs: compact cards and domain rows, separate freshness from status, retain all source details and critical limitations; model usage first, technical foundations secondary. Indexing remains configuration only.
4. Users: consistent page width, combined identity cell, responsive table/cards, accessible existing controls and truthful missing-activity label.
5. Review actual components with synthetic fixtures at desktop/tablet/mobile widths, exercise disclosure/filter/error states; run typecheck, lint, admin tests, full suite, hygiene gates and production build. Document limitations and exact final head.

## Boundaries and risks

No API, server loader, DB, schema, RLS, authentication, permission, provider integration, ingestion, commercial path, cost controls or Official Truth changes. No new libraries or recurring costs. No effect on the travel graph. PR #774/#775 file sets and all `lib/readiness`, provider runtime and migrations are excluded.

Do not infer system health from a fresh read, spending from empty usage, real revenue from local payment rows, or actual IP blocking from a stored entry. Keep errors distinct from empty results, per-check freshness visible, and current action authorization unchanged. Synthetic UI evidence is not authenticated Preview, production data or physical-device acceptance.

No global vision/architecture/design decision changes: reuse existing patterns. This scoped task and its report record the follow-up roadmap without concurrent edits to canonical shared documents. Independent exact-head review remains required after draft handoff.
