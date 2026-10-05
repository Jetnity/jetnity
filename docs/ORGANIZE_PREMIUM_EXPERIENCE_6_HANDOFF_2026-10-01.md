# Organize Premium Experience 6 — Handoff

Stand: 30 September 2026
For: ChatGPT / Technical Lead. An older head does not approve a later head.

## Open this

1. Draft PR #667 / issue #666
2. Task: `docs/ORGANIZE_PREMIUM_EXPERIENCE_6_TASK_2026-10-01.md`
3. Report: `docs/ORGANIZE_PREMIUM_EXPERIENCE_6_REPORT_2026-10-01.md`
4. Self-review: `docs/ORGANIZE_PREMIUM_EXPERIENCE_6_SELF_REVIEW_2026-10-01.md`
5. Evidence: `docs/evidence/organize-premium-experience-6/audit.json` and `screens/`

## Identity

- Agent: **Jetnity Organize premium experience 6**, Generation 1
- Session: https://cursor.com/agents/bc-c0cf7301-3a42-4fb8-a8db-6522a435926f
- `originalModelName`: `grok-4.7-high-fast`
- Baseline: `main@2530020dbc6797b17d64c064ca5474cf90804272`
- R1 review: `5372823906` on `49ae3a16d1c8f9aaec96bdbdd243b5d7778b4319`
- R1 runtime: `f5f228f2be26c0413d7977116b1abbf50e6c4124`. Unchanged by either main integration.
- Integrated main: `85d730993148b058a2dd3acd19947c025bdcf7f7` (Merge #663, which already contains Merge #669 `1930e61`). Local merge `1150fa6c`. Branch is 0 behind that main.
- `/planen` files match that main: `app/(public)/planen/page.tsx`, `PlanenEinstiegNavigation.tsx`, `Reiseidee.tsx`, `TripPlanner.tsx`.
- Reiseplan matches that main: `TripWorkspacePlan.tsx` and `lib/trips/trip-plan-premium-experience-4.ts`. This slice did not edit them.
- Device-matrix audit: PASS `2026-09-30T23:07:52.367Z`, JSON sha `f5f228f2be26c0413d7977116b1abbf50e6c4124`, 40 steps, `rueckkehrFrei` true for compact flight detail and 200% text. The main merge does not change that Organisieren runtime.
- Local gates after the #663 merge: `npm test` 4121 pass, typecheck pass, lint exit 0 with existing warnings, production build Next.js 16.3.8 / 25 pages, hygiene checks pass.
- `docs/ACTIVE_WORK_STATUS.md` was not edited in this integration.
- CI, Auth and Vercel on the pushed integration tip still have to be re-read. The green gate on `aa8433b4` stays with that commit.

Re-fetch the tip before review. This head contains live main `85d73099` and the R1 compact Back measurement.

## Do not treat as accepted

- Ready, merge, Production, provider activation, payment, indexing, launch
- A physical-device pass
- A signed-in account pass
- Any parent edit to `TripWorkspace.tsx` or the parallel plan/preparation files

## Next step

Independent Technical-Lead code, visual, mobile and interaction review of the exact current head. Cursor does not Ready, merge, or start a follow-up slice.
