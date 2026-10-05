# Jetnity Admin Indexing Status 1 — Binding Task v1

Date: 2026-09-22
Agent: **Jetnity admin indexing status 1**, Generation **1**.
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**, no Auto/substitution. Fresh session, confirm actual run-info/model + footer/session. UI rename only if performed.
Baseline: **main@9dc8926ef859bcde2dc31dc8b96f2e61e1948f74**.
Branch: **feat/admin-indexing-status-1**.
Mode NORMAL. TL alone decides PASS/Ready/Merge. Read AGENTS, START_HERE, TL/Cursor and multi-agent standards, latest Sep22 checkpoint plus #512 comments, relevant Admin evidence and existing SEO contracts before implementation.

## Binding TL selection / why now
PO explicitly asks to check and use safe parallel agents. TL reviewed live main/open PRs, remaining-build map, Admin audit §9/§10 and actual code; two read-only advisory prechecks support this cut.
Admin evidence docs/ADMIN_D_K_GROWTH_CONTROL_AUDIT_EVIDENCE.md §9 explicitly permits read-only existing robots/sitemap without PO gate; §10 places J-lite after D0-2. D0-2 and subsequent public metadata repairs are already integrated. This is a bounded operational visibility improvement to the built Admin foundation, not full Admin J/Analytics/Phase2 or a new V1 launch prerequisite.
Current System Health presents service checks but does not present the existing indexing configuration. Give the operator one honest place to inspect that configuration without changing it.
#543 route entry and #546 continuity are closed; latest baseline main CI35747010279 SUCCESS and Production dpl_Ahi7cmxVkbvEg3RsdHoVAbzmFZAZ READY. Provider-later and three-phase order remain unchanged.

## Outcome
Add a separate, compact read-only section to **existing /admin/system-health**, labelled in German e.g. “Indexierungs-Konfiguration”. It describes this deployment's computed configuration at page load, NOT a live HTTP/crawler/Production probe.
Reuse existing lib/seo contracts to show:
- configured effective technical origin and source (site/app/fallback), distinct from canonical product origin;
- existing allow/deny decision, robots rules and whether a sitemap is advertised;
- existing public sitemap URL list/count (empty in deny mode);
- a concise explicit limit: technical configuration only, not evidence of actual indexing, public launch approval, SEO quality, traffic or production readiness.
Intentional deny/Preview is not an outage. Do not invent scores/health-green or report blocked indexing as an operational failure. If allow is computed, it means only the current configuration permits it, never that PO launch permission was granted.
Keep source truth single: call oeffentlicherOrigin, robotsDokument and sitemapOeffentlicheUrls (optional existing metadata helper if needed); do not duplicate/rewrite parser/allow conditions in a second policy. Pass the same bounded environment snapshot to helpers so one section cannot mix configurations. Never dump process.env or raw setting values. Render normalized origins as text; no arbitrary remote links/fetch. Invalid URLs/credentials/query/hash/HTML must not leak raw values into UI, evidence or logs.
No controls to enable/index/publish/change domains. No API route, outbound fetch, crawler, scheduled refresh, tracking, storage, new DB access or dependency. Existing page requests remain as-is.
Keep this section separate from SystemHealthBoard refresh semantics: its data is computed at page load; do not imply the board's refresh button refreshes it. No fake time-of-live-probe.

## Exclusive write ownership
- app/(admin)/admin/system-health/page.tsx: ONLY minimal import/data projection/render integration after the existing unchanged requireAdminPage({ surface: 'system-health', capability: 'betrieb-lesen' }). Preserve force-dynamic and existing health loading/board. This section must not be evaluated/rendered before authorization.
- NEW components/admin/system-health/IndexingStatus.tsx.
- NEW lib/admin/seo-status.ts + lib/admin/seo-status.test.ts (pure bounded projection with supplied environment) and optional NEW adjacent server-only environment adapter lib/admin/seo-status-server.ts if necessary. No client bundle environment access.
- scripts/admin-indexing-status-1-*.mjs for dedicated render/browser evidence if needed, no package/test-registry edits.
- docs/ADMIN_INDEXING_STATUS_1_{TASK,STATUS,HANDOFF,SELF_REVIEW}_2026-09-22.md and docs/evidence/admin-indexing-status-1/.
Nothing else. Read-only: lib/seo/*, app/robots.ts, app/sitemap.ts, all Auth/roles/guards, navigation.ts, AdminSessionProvider, AdminTopbar, all Admin layouts, SystemHealthBoard and lib/admin/system-health/*/API runtime, public pages, env/config/workflows/package/lock.
If another path/shared contract must change, STOP and report to TL before writing.

## Evidence / acceptance
Inspect existing tests and give a concise implementation plan first.
1. Focused tests for actual projection/UI promises: intentional deny with empty sitemap, explicit allow canonical Production (existing policy), Preview/dev deny, unset/false opt-in, invalid/credential-bearing/query/hash origin, conflicting SITE/APP and noncanonical/ephemeral origins. Existing SEO policy tests should be run unchanged; no source-string-only PASS.
2. Render the actual new component with representative allow/deny data; verify normalized strings, explicit source/limits, empty state and absence of activation controls/raw sensitive inputs. Meaningful component/browser view at mobile390 and desktop1440, long origin wraps without overflow, keyboard/accessibility if interactive details used. Static section may use real SSR output + real browser viewport evidence; no fabricated production/device PASS.
3. Confirm existing server guard stays first, no new unauthenticated path/capability/network request; do not change auth itself. Existing Admin authorization remains boundary.
4. Typecheck/lint/build/applicable hygiene, required exact-head CI/Auth/Vercel Preview. No skips called PASS.
5. Freeze exact head, live main/merge-base/ahead/behind/file list, genuine evidence and P0-P3 risks/limits. New head invalidates old gates. Freeze checks in PR comment avoid endless SHA-stamp commits.

## Multi-Agent Suitability — MULTI_AGENT across disjoint tasks
Parallel runtime writer #545 Jetnity admin navigation search 1 G1, session bc-65468a42-a473-4d29-8fdb-5f48564db44d, owns AdminTopbar + admin/layout + new navigation palette/helper + ehrliche-zustaende search text + own docs/tests. You own only System Health page integration + new indexing component/projection + own docs.
No shared write paths, migration, capability or runtime dependency. Do not edit #545 task/session/branch. Navigation uses existing System Health entry; no new menu item and no need to wait for palette.
TL serializes merges; report base drift, no unrequested merge/rebase/force/cherry-pick. If #545 merges first, TL provides precise sync authorization.

## Gates and STOP
No provider/contact/secrets/live calls/model activation/new costs, DB/migration/RLS, Production settings/Auth, public indexing/launch/domain changes, full Analytics/Ads/SEO publishing, Billing/money, global docs, Grok/automation or phase-order changes.
Complete this bounded implementation, own STATUS/HANDOFF/adversarial SELF_REVIEW/evidence, actual model/session and frozen head/gates.
**STOP FOR INDEPENDENT TL REVIEW. Do not mark Ready. Do not merge. Do not start a follow-up slice.** Same session for immediate review fixes.
