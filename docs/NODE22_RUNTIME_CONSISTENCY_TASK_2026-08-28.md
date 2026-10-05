# Jetnity – Node 22 Runtime Consistency Task

Stand: 28. August 2026
Status: **IMPLEMENTED / SELF-EXPIRING / DUAL-STATE. Solange Draft-PR #147 offen: STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / NO READY OR MERGE BY AUTHOR. Sobald #147 gemergt: integrierter Node-22-Vertrag; kein Follow-up-Continuity-PR.**
Branch: `ops/node22-runtime-consistency-2026-08-28`
Baseline: `main @ 4ec83f36426c636443d43692d6875e92e9e3b54a`

## Problem / live evidence

- Vercel project `jetnity-app` is configured for Node.js `22.x`.
- GitHub CI already uses `actions/setup-node@v4` with `node-version: 22.x` in both jobs.
- `package.json` currently declares `engines.node: ">=20.9"`, which is broad enough for Vercel to select Node 24 and therefore produces a `Node.js Version Override` warning.
- `package-lock.json` mirrors the same broad root engine range.
- `@types/node` is currently `24.0.7`, while the intended runtime is Node 22.

## Goal

Create one reproducible Node.js runtime contract for Jetnity: **Node 22.x** across repository metadata, dependency typing, GitHub CI and Vercel.

## Required work

1. Inspect the current runtime/tooling contract before editing.
2. Pin `package.json` `engines.node` to `22.x`.
3. Keep `package-lock.json` root package metadata in sync using the package manager; do not hand-edit arbitrary lockfile dependency records.
4. Evaluate `@types/node` against the Node 22 runtime. Unless a concrete compatibility blocker is proven, align it to the maintained Node 22 type line and regenerate the lockfile minimally.
5. Verify `.github/workflows/ci.yml` remains `22.x`; change it only if live drift is found.
6. Do not change Vercel settings: they already express `22.x`.
7. Add no application/product behavior and no unrelated dependency upgrades.

## Required validation

Run at minimum:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Also verify the resulting diff contains only runtime/tooling consistency changes plus this task/status evidence.

## Strict non-scope

- no Next.js/React/Supabase upgrade;
- no application feature work;
- no Supabase migration/config/schema/RLS/Auth change;
- no Vercel project-setting mutation;
- no Branch Protection change;
- no AP-7-S2;
- no provider/TW/runtime feature slice;
- no Ready and no merge by the author/agent.

## Continuity / stop condition

Persist the final exact head, commands/results and residual risks in a concise self-review/status artifact or PR comment, then STOP for independent ChatGPT / Technical-Lead exact-head review. Any new push invalidates previous review evidence.

Author-side artifacts:

- `docs/NODE22_RUNTIME_CONSISTENCY_STATUS_2026-08-28.md`
- `docs/NODE22_RUNTIME_CONSISTENCY_HANDOFF_2026-08-28.md`
- `docs/NODE22_RUNTIME_CONSISTENCY_SELF_REVIEW_2026-08-28.md`
- ADR-0188 in `DECISIONS.md`
