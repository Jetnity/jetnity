# Homepage Natural Route Intent 1 — HANDOFF

Date: 2026-09-27  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Draft PR: https://github.com/Jetnity/jetnity/pull/575  
Branch: `feat/homepage-natural-route-intent-1`  
Agent: Jetnity homepage natural route intent 1, Generation 1  
Session: `bc-fe25bf01-3d21-4b29-8b9f-81743491d7d7`  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Task base: `8faa0447a89d613cb7d00c8173c3bda57a3524fc`  
Prerequisite #543: `d03a048624b42cb0b2a1cb0e146aed238e23041f` (merged)  
Current main synced: `35ea065536649c20740a6d6bbd24294c2366aee3` (#574 docs-only Account Counts closure)

Re-read `git rev-parse HEAD` after this persist. That SHA is the freeze. Older exact-head gates do not apply.

## This persist covers

1. TL R1: canonical-aware segmentation at every conjunction block, not only the whole input.
2. Required regressions: compound country inside comma route; triple-und safe grouping or fail-closed; per-segment 503 does not guess-split; existing Lima/Cusco, Thailand, Lima Peru, duplicates, cancel/edit/keyboard remain green.
3. Same-branch merge of current main. `#574` Account Counts closure/status was not overwritten. `docs/ACTIVE_WORK_STATUS.md` was not edited.
4. Fresh local gates on the persist working tree.

## How a later actor continues

Read this HANDOFF, the task, STATUS, SELF_REVIEW, and the exact PR head. Do not resume from `cc819d22` or any older SHA. Do not Ready. Do not merge. Do not start a follow-up.

If the Technical Lead requests further review fixes, use this same session/generation. A new head invalidates earlier gates.

## Local gates before persist

Focused + #543 unit tests pass. Full `npm test` 3931/0. Hydrated 12 + #543 10. `typecheck` pass. Owned ESLint pass. `next build` pass. Hygiene: dead/exports/api-schutz/operating-mode pass.

## Evidence

- `docs/evidence/homepage-natural-route-intent-1/hydrated-report.json` — 12 PASS
- `scripts/homepage-natural-route-intent-1-hydrated.mjs` — Chromium harness, synthetic `/api/search/places`
- New R1 screenshots: `bosnia_croatia_compound_390.png`, `trinidad_peru_compound_390.png`, `bosnia_und_croatia_grouped_390.png`, `segment_503_no_guess_split_390.png`, `triple_und_segment_503_390.png`
- Method: locally bundled actual `StartzielForm`. Not physical-device acceptance. Not authenticated Preview E2E.

## Next actor

Technical Lead exact-head review of the freeze SHA only. Not Ready. Not merged. No follow-up slice.
