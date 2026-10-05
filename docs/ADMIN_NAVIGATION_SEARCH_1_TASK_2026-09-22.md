# Jetnity Admin Navigation Search 1 — Binding Task v1

Date: 2026-09-22
Cursor-Agent: **Jetnity admin navigation search 1**, Generation **1**.
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**, no Auto/substitution.
Fresh session for this new bounded scope; report actual run-info/session URL and model. Rename UI only if available; never claim unperformed rename.
Baseline: **main@d03a048624b42cb0b2a1cb0e146aed238e23041f**.
Branch: **feat/admin-navigation-search-1**.
Mode must be NORMAL. TL alone Ready/merges. Read START_HERE, TL/Cursor standard, latest #512 continuity comments, remaining-build-map, this task, and relevant multi-agent/quality/security standards. Startup prose about #512/#506/#509/#510 still active is stale; live evidence wins.

## Why this slice now
PO explicitly requests autonomous next slices and safe parallelism after #543 closure. #543 is integrated after independent PASS5279493577; #544 remaining-build map is integrated. Three-phase strategy and provider-later stand.
The map §3.1c/§4 and ADMIN_D_K_GROWTH_CONTROL_AUDIT_EVIDENCE identify F as a real later ungated scoped option. TL now selects ONLY local navigation search to complete the existing Admin shell: the current disabled search control cannot help the PO find existing operational areas. This is a narrow convenience improvement to the built Admin foundation, not a new V1 prerequisite, Full Admin D–K, Phase-2 rollout, records search or operational Copilot.
No additional ungated Account runtime slice was proven; AP8/9/11/12 gates remain. Do not fill spare capacity with new features.

## Outcome and user contract
Replace the dead desktop search control with an accessible palette for **existing ready Admin areas**, available on mobile too, with Cmd/Ctrl+K, keyboard selection, Escape and reliable focus restoration.
Results derive solely from existing **filterAdminNav(ADMIN_NAV_ITEMS, useAdminSession())**, then ready items only. This deliberate bounded cut excludes kind=later placeholders from search (sidebar unchanged). Label clearly as area/navigation search, never imply records or command execution.
Use labels and bounded static search aliases only if useful (e.g. Kosten -> Provider & Kosten); no remote search/index/cache/history. Empty query offers authorized ready areas; trim/case normalize; literal punctuation/no-result and long input behave predictably. Selected destination must be an item from this static allowlist, never query-derived href, command, script or external URL.

## Exclusive ownership
Allowed edits:
- components/layout/AdminTopbar.tsx — search trigger only; preserve account/logout/theme behavior.
- app/(admin)/admin/layout.tsx — minimal shared palette/mobile trigger and drawer coordination. No auth contract changes.
- NEW components/admin/AdminNavigationSearch.tsx (and one narrowly scoped adjacent component if necessary, report it).
- NEW lib/admin/navigation-search.ts and its meaningful tests.
- lib/admin/ehrliche-zustaende.ts and its existing tests ONLY search-related text/contract necessary for this slice.
- scripts/admin-navigation-search-1-*.mjs, dedicated actual-component harness/tests.
- docs/ADMIN_NAVIGATION_SEARCH_1_{TASK,STATUS,HANDOFF,SELF_REVIEW}_2026-09-22.md and docs/evidence/admin-navigation-search-1/.
Read-only contracts: lib/admin/navigation.ts; components/admin/AdminSessionProvider.tsx; roles/capabilities, Admin server layouts/guards, Auth/MFA/AAL; no edits to those. If a new shared contract/ownership change is needed, stop at that boundary and report.

## Interaction acceptance
One palette instance and one global shortcut listener, not duplicated desktop/mobile trees. Topbar is hidden below md; mobile needs a visible working trigger in existing strip. Close drawer before opening palette, avoid competing focus traps/scroll locks; don't steal focus from another modal. Restore focus to the actual visible invoking element or a documented sensible fallback; route navigation closes palette. Keyboard open, arrows/Enter or accessible equivalent, Tab cycle, Escape, mouse/touch work. Selected item identity remains correct when filter changes; no stale hidden selection.
Existing sidebar permission contract is reused as UX filtering; actual server authorization unchanged. Test operator, creator/no relevant capability and break-glass: no users entry for break-glass and no escalation. No search queries/logs/localStorage/analytics persistence, no PII, no new requests for search itself. Normal existing navigation requests remain normal.
Use existing tokens/primitives; no shell redesign. 390/768/1024/1440 and 200% text/zoom, scrollable results, long labels, touch targets. Report physical-device evidence separately from Chromium emulation.

## Required evidence
Before writing, inspect current shell/navigation/tests and document concise plan. Meaningful pure tests for filtering/allowlist/query handling plus **hydrated actual component + shell interaction** tests with only boundary fixtures: mobile and desktop, shortcut, concrete activeElement after close, result selection, no-match, route change, drawer coordination, role cases, no extra search network calls. Source-string/static markup alone is insufficient. Existing navigation/honesty tests, typecheck/lint/build and applicable hygiene; exact-head CI/Auth and Vercel Preview. No new deps or package/lock/workflow/test-registry edits. Explicit skipped/unavailable checks, no fake PASS.

## Non-scope / gates
No DB/migration/RLS, auth/session/MFA/AAL/role/grant changes, API/records search, provider contact/signup/secrets/live calls, model/assistant activation, Billing/refund/payment actions, paid calls/new cost, analytics tracking, public indexing/launch, product/build-order change, Grok/automation setup. Do not edit global docs, remaining-build-map, homepage/planner/place/guest contracts or sibling branch.

## Multi-Agent Suitability
Decision: **MULTI_AGENT across disjoint workstreams; SINGLE_WRITER within this runtime slice**.
Parallel docs writer Jetnity V1 continuity refresh 2 owns named global startup/current-state docs and its own evidence. You own Admin runtime + your named deliverables only. No overlapping files, migration or shared contract; no dependency on unmerged sibling code.
Each branch from exact verified baseline, independent Draft PR. TL serializes integrations (normally this runtime first, continuity then refreshed); re-read origin/main at freeze and report drift. No unrequested merges/rebase/force/cherry-pick. No changing sibling task/status or starting an independent writer for this palette.

## Delivery and STOP
Implement the bounded result; persist STATUS/HANDOFF/adversarial SELF_REVIEW and evidence with actual model/session, baseline/head/merge-base/ahead/behind, file list, test commands/results, exact CI/Preview, P0-P3 risks, limitations and concrete next first unfinished step.
Freeze/push final SHA and re-read main; prior-head gates invalid. **STOP FOR INDEPENDENT TL REVIEW. Do not mark Ready. Do not merge. Do not start a follow-up slice.** Same session for immediate TL review fixes.