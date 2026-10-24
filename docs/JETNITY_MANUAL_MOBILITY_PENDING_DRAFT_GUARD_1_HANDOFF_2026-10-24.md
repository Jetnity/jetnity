# Jetnity — Manual Mobility Pending Draft Guard 1 — HANDOFF

Date: 24 October 2026
Author: **Jetnity Manual Mobility Pending Draft Guard 1 — Cursor Generation 1**
Session: `bc-529c718d-03e4-43f9-a8fa-7e555d3f4cbf`
https://cursor.com/agents/bc-529c718d-03e4-43f9-a8fa-7e555d3f4cbf
Model: `grok-4.7-high-fast` (`originalModelName`). Requested Grok 4.7 High Fast. No Auto fallback.
UI title renamed in this session to the logical name above.

## Pins

- Live `origin/main`: `e372f4d830c35a74a235d345c2baaf08ab615e6c`
- Live main tree: `09f4ee368b137b6e4a918e950b94176fe32b583c`
- Merge-base: `e372f4d830c35a74a235d345c2baaf08ab615e6c`
- Behind main: 0. No main sync.
- Runtime/component head used for the harness and local gates: `5250356bdfcf0de3a4e39b348fd3b7ab8518110b`
- Runtime tree at that head: `d581895c9cf242c8ce6250854a936f2b0edd1103`
- Ahead of main before this docs/evidence commit: 3. This commit adds documentation and sanitized screenshots only.
- Exact final HEAD, including this docs commit, is recorded only in the PR comment so this file does not chase its own SHA.
- TASK V1 blob: `3e5d971be2234c0bd8adf487bd5ac673021bc07e` unchanged.
- Proved component blob: `105c8a2a9a4d0b5b285395cfbf2951e411a6dc23`
- Proved component SHA-256: `652cd513e490813a09bcc5a3111a3d487b804a0ff4df6dcdb54d689853fd4db3`
- Baseline component blob: `8560a106e4eb61a852b2f4ce27868ab30cf18cf0`
- Mode: NORMAL, re-read this session.
- Issue #986, Draft PR #988, branch `fix/manual-mobility-pending-draft-guard-1`.

## Files

- `components/trips/MobilitaetBereich.tsx` — exported `ManuelleVerbindung` only
- `scripts/manual-mobility-pending-draft-guard-1/mount.tsx`
- `scripts/manual-mobility-pending-draft-guard-1/harness.mjs`
- `docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_PLAN_2026-10-24.md`
- `docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_STATUS_2026-10-24.md`
- `docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_SELF_REVIEW_2026-10-24.md`
- `docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_HANDOFF_2026-10-24.md`
- `docs/JETNITY_MANUAL_MOBILITY_PENDING_DRAFT_GUARD_1_REPORT_2026-10-24.md`
- `docs/evidence/manual-mobility-pending-draft-guard-1/`
- TASK V1 unchanged

## Commands

- `node scripts/manual-mobility-pending-draft-guard-1/harness.mjs` — exit 0, evidence status PASS, Chrome 148.0.7778.96, viewports 320×720 / 390×844 / 1280×900
- `npm test` — exit 1, 7044 / 7028 pass / 11 fail / 5 skipped
- `npm run typecheck` — exit 0
- `npm run lint` — exit 0, 146 warnings, 0 errors
- `npm run check:setup` — exit 0, warning: no `.env` / `.env.local`
- `npm run check:operating-mode` — PASS
- `npm run check:api-schutz` — PASS
- `npm run check:schema-bezug` — exit 0
- `npm run check:dead` — 0 orphans
- `npm run check:exports` — 0
- `npm run check:deps` — 0 unused
- `npm run build` — exit 0

CI and Preview for the final head are not claimed here. Ordinary CI from the branch push is allowed. The previous seed Preview is not evidence for this head.

## P0–P3

- P0: none.
- P1: none. Client pending lock does not change persistence or authorization.
- P2: eleven local native PostgreSQL proofs failed because binaries are absent or the local connection override is forbidden. Pre-existing and outside this lane. Not investigated as a product fix.
- P3: bundled Playwright Chromium was absent, so the harness used installed Chrome. Two pre-existing conditional browser tests stayed skipped (`TRIP_AUDIT_UI_URL`, `SHARED_LAYOUT_AUDIT_BASE`). Lint warning count remains 146.

## First unfinished step

Independent Technical-Lead exact-head review of the final PR head. Do not Ready. Do not merge. Do not start a follow-up slice. Lane B stays read-only. Planned integration is A then B under a later Technical-Lead instruction.

Stops left untouched: #985/#982 scoped HOLD, #917, #968, #748 personal-browser suspension, #913, Bern #934/#937, #626, #957.
