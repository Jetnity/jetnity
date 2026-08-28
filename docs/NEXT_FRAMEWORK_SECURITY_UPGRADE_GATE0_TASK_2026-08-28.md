# Jetnity – Next.js Framework Security Upgrade Gate 0 Task

Stand: 28. August 2026
Status: READ-ONLY / ARCHITECTURE-AND-COMPATIBILITY AUDIT ONLY
Baseline: `main @ 56aff7ff89f7113554c45891e024f9c06f6b0d15`

## Why this exists

The verified Production build for PR #147 runs successfully on Node 22.x, but npm/Vercel reports that the current `next@14.2.32` has a known security vulnerability. Current Next.js support policy lists 16.x as Active LTS and 15.x as Maintenance LTS; 14.x is unsupported. The current August 2026 security release recommends `16.3.3` or `15.5.24` for supported lines.

Jetnity security and reproducibility take precedence over continuing product runtime work on an unsupported framework line.

## Goal

Produce a high-confidence Gate-0 recommendation for Jetnity's next supported framework target, comparing at minimum:

- `next@15.5.24` Maintenance LTS;
- `next@16.3.3` Active LTS.

The recommendation must optimize for security, long-term maintainability, regression risk, migration cost, Vercel compatibility and Jetnity's current architecture. Do not choose merely by newest version.

## Required live audit

Inspect the current repository, not assumptions. At minimum audit:

1. `package.json` / lockfile / React / React DOM / eslint / eslint-config-next / TypeScript compatibility.
2. App Router usage and all request-time APIs impacted by Next 15/16 migration (`cookies`, `headers`, `draftMode`, route/page/layout `params`, `searchParams`).
3. `middleware` / Edge Runtime / possible Next 16 `proxy` implications.
4. `next lint` removal/deprecation and required CI/lint migration.
5. `next.config.*`, typed routes, image config, experimental flags, webpack/Turbopack assumptions.
6. Supabase SSR/auth/session/cookie flows and server actions for migration-sensitive behavior.
7. Server Actions / Route Handlers / caching and revalidation semantics that could change across 14→15→16.
8. React 18→19/19.2 compatibility, including hooks/actions/types and third-party package peer compatibility.
9. Test tooling, Playwright, scripts and build checks.
10. Vercel runtime/build compatibility and deployment behavior.
11. Security advisories relevant to current `14.2.32` and whether a temporary 14.2.x patch would still leave Jetnity on an unsupported line.
12. Exact migration work required for each candidate, grouped into mechanical codemod-safe vs. manual/high-risk changes.

## Required output

Create versioned Gate-0 status/handoff/self-review evidence and update only the minimum canonical continuity pointers needed for reconstruction.

The status must contain:

- exact baseline and exact head;
- observed current framework/runtime versions;
- concrete compatibility findings with file references;
- risk matrix for 15.5.24 vs 16.3.3;
- explicit recommendation with rationale;
- proposed staged implementation slices if an upgrade is approved;
- rollback/test strategy;
- whether secrets/config/production migration are involved;
- exact Product-Owner decision required before any framework/runtime dependency upgrade.

## Hard non-scope

This Gate 0 must NOT:

- change `next`, React, React DOM, eslint, eslint-config-next or any runtime dependency;
- run or apply codemods that modify tracked files;
- change application code, middleware, route handlers, server actions, caching behavior or UI;
- change Vercel project settings;
- mutate Supabase, Auth, RLS, schema, data, secrets or production configuration;
- change Branch Protection;
- start AP-7-S2, Provider runtime, TW-8/TW-9 or unrelated product work;
- mark Ready or merge.

Read-only commands and dry-run analysis are allowed. If a codemod is inspected, use dry-run/print-only behavior and record exactly what it would change.

## Quality gate

Agent self-review is not approval. Final Gate-0 integration requires independent ChatGPT / Technical-Lead exact-head review. Any later actual major framework upgrade remains a separate Product-Owner-gated decision.