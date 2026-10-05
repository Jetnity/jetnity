# Admin Mission Control Polish 1 — report, self-review and handoff

Date: 2026-10-03. Status: implementation complete; Draft-only handoff, not integration approval.
Baseline: `a7ad77743327c01821cf2532ca253a3220c857e8`.
Branch: `ui/admin-mission-control-polish`.
Task: [scope and acceptance](ADMIN_MISSION_CONTROL_POLISH_1_TASK_2026-10-03.md).
The exact delivery head is recorded in the PR description and handoff response; this file belongs to that same change set.

## Result

`/admin` previously separated a text-heavy introduction, trip aggregates, a smoothed daily chart, verbose process notices and a distant RLS catalogue. It now places the existing System Health evidence and trip/RLS KPIs in one executive zone. Daily counts render as distinct, labelled bars with accessible daily values; the chart no longer needs Recharts client hydration. Model usage remains visibly incomplete as a cost source. Existing operational destinations use compact actionable rows.

Native “Datenqualität & Nachweis” disclosures retain explanations, coverage identifiers, proofs and limits. Original observation timestamps and freshness stay visible. “Keine Maßnahmen erforderlich” is restricted to the existing single fresh healthy/no-signal insight with role access, and explicitly scoped to evidenced System Health sources. It is never a universal health, financial or security claim. Unknown, stale, denied, failed and RLS gaps remain distinct from zero and success. RLS enabled/counts are not labelled as proof of policy effectiveness.

Availability labels are neutral: Aktiv, Read-only, Lokale Ansicht, In Planung and Nicht konfiguriert. Planned sidebar destinations are grouped rather than each carrying a FOLGT badge. Copilot Pro has a quiet In Planung label. Technical table names remain in disclosures only.

The shell keeps the existing palette, typography and radii. Below 1024px it uses the existing drawer; the narrow mobile strip uses the existing theme action. The existing desktop sidebar toggle is now connected to its handler, and its collapsed state displays accessible icons rather than clipped labels. No new domain function or backend capability was introduced.

## Boundaries and collision review

- Same RPC names, parameters, error handling and access rules. No new endpoint, query, loader, migration, schema, RLS, auth, provider, model or Official Truth code.
- No real provider/model calls, new dependencies or recurring costs.
- Shared roadmap, design tokens, architecture and global continuity documents remain untouched to avoid concurrent writers. Slice decisions, evidence and handoff live in these dedicated documents.
- Compared against both complete changed-file lists for #774 and #775 before implementation and again before handoff: zero overlap. No `lib/readiness/**`, `supabase/**`, Official Truth documents or Trust Boundary files changed.

## Verification

| Check | Result |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` | PASS, 530 packages; no manifest/lock changes |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors / 148 warnings in repository |
| Admin tests | PASS, 254/254 |
| `npm test` | 4478/4480 PASS; two environment failures below |
| `check:dead`, `check:exports`, `check:deps` | PASS |
| `check:api-schutz`, `check:schema-bezug` | PASS |
| `next build --webpack` | PASS, optimized production build and route generation |
| Default Turbopack build | BLOCKED by local port/process restriction: `Operation not permitted` while evaluating CSS; repeated outside the requested sandbox override with the same result |
| `git diff --check` | PASS |
| Browser rendering / keyboard / responsive audit | PASS, 18 scenarios |

Full-suite environment failures are the throwaway PostgreSQL tests in `lib/readiness/official-truth-source-catalog-server.test.ts` and `lib/readiness/official-truth-store-server.test.ts`: both require `/usr/lib/postgresql/16/bin/initdb`, absent on this macOS host (`ENOENT`). They were not disabled, modified or reported as passing. No Production/Development DB tests or migrations were performed.

## UI evidence

Reproduce: `ADMIN_POLISH_EVIDENCE=/tmp/admin-polish-evidence node scripts/admin-mission-control-polish-audit.mjs`.
The script compiles real product CSS, renders the actual `/admin` page components with isolated synthetic source results and mounts the actual interactive Admin shell. Next navigation/sign-out boundaries are test doubles. It never starts an authenticated product session or connects to a database/provider. The test-data banner is audit-only.

- Twelve formats: 280×800, 320×800, 360×800, 375×812, 390×844, 430×932, 768×1024, 1024×900, 1280×900, 1440×1000, 844×390 and 667×375.
- Six additional states: observed zeros, stale, unknown, denied, source failure and an RLS gap.
- No document overflow; exact daily item count; no raw table names in collapsed UI; Enter toggles native disclosures; drawer opens/closes by Escape; desktop sidebar collapses/expands; dark theme toggles; no page errors in viewport scenarios.
- Screenshots manually reviewed: desktop, tablet, mobile and dark theme. Found and fixed the 280px theme-button overflow and disconnected sidebar action; removed redundant disclosure rows after visual review.
- [Desktop](evidence/admin-mission-control-polish-1/admin-1440.png), [mobile](evidence/admin-mission-control-polish-1/admin-390.png), [tablet](evidence/admin-mission-control-polish-1/admin-768.png), [dark](evidence/admin-mission-control-polish-1/admin-dark.png), [machine-readable audit](evidence/admin-mission-control-polish-1/audit.json).

## Self-review and remaining acceptance

Data acquisition, role/AAL/RLS gates and source semantics are unchanged. Missing evidence still renders as unknown/unavailable rather than zero; zero-cost and global-health claims are absent. All existing proof and non-proof explanations remain reachable without JavaScript through native disclosures. Regression tests check the scoped no-action state, including stale and break-glass exclusions, daily values and navigation targets.

Limitations: synthetic Chrome rendering is not authenticated Preview/Production E2E, physical-device acceptance or a live health/security audit. The shell change also affects other admin routes; route destinations and role filtering remain unchanged, but their authenticated content was not exercised. CI/Preview status must be read at the exact PR head separately. The standard Turbopack build and the two PostgreSQL tests need their normal supported environment before integration.

Handoff: keep Draft; do not mark Ready, merge or start a follow-up slice. Next action is independent Technical Lead review of the exact PR head, remote CI and authenticated Preview on desktop/tablet/mobile.
