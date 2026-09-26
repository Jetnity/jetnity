# Homepage Natural Route Intent 1 — HANDOFF

Date: 2026-09-27  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Draft PR: https://github.com/Jetnity/jetnity/pull/575  
Branch: `feat/homepage-natural-route-intent-1`  
Agent: Jetnity homepage natural route intent 1, Generation 1  
Session: `bc-fe25bf01-3d21-4b29-8b9f-81743491d7d7`  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Task base: `8faa0447a89d613cb7d00c8173c3bda57a3524fc`  
Prerequisite #543: `d03a048624b42cb0b2a1cb0e146aed238e23041f` (merged)

Evidence persist: `ae66d8ff7a23b844041a4b0d14a3614e61e69e1a`. Re-read `git rev-parse HEAD` after this freeze persist. That SHA is the freeze. Older exact-head gates do not apply.

## This persist covers

1. Pure route-intent parser/decision helper with whole-place proof before any split.
2. Sequential confirmation queue in the existing hero `StartzielForm`, reusing #543 occurrences/handoff.
3. Fail-closed whole-search outage behavior.
4. Focused unit + hydrated 390/768/1440 + keyboard evidence.
5. No edit of `docs/ACTIVE_WORK_STATUS.md`.

## How a later actor continues

Read this HANDOFF, the task, STATUS, SELF_REVIEW, and the exact PR head. Do not resume from an older SHA. Do not Ready. Do not merge. Do not start a follow-up.

If the Technical Lead requests review fixes, use this same session/generation. A new head invalidates earlier gates.

## Local gates before persist

Focused + #543 unit tests pass. Full `npm test` 3924/0. Hydrated 9 + #543 10. `typecheck` pass. Owned ESLint pass. `next build` pass. Hygiene: dead/exports/api-schutz/operating-mode pass.

## Evidence

- `docs/evidence/homepage-natural-route-intent-1/hydrated-report.json` — 9 PASS
- `scripts/homepage-natural-route-intent-1-hydrated.mjs` — Chromium harness, synthetic `/api/search/places`
- Screenshots in the same evidence folder and `/opt/cursor/artifacts/`
- Method: locally bundled actual `StartzielForm`. Not physical-device acceptance. Not authenticated Preview E2E.

## Next actor

Technical Lead exact-head review of the freeze SHA only. Not Ready. Not merged. No follow-up slice.
