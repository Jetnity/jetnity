# UX V1 U1-B Route and Detail 1 — STATUS

28 October 2026. Cursor Generation 1. Stop for independent Technical Lead R1. Not Ready. Not merged. No follow-up slice.

## Session

- Name: Jetnity UX V1 Route and Detail 1 — Cursor Generation 1
- `originalModelName`: `grok-4.7-high-fast`
- https://cursor.com/agents/bc-767a1802-d279-4557-8dbf-4bd81f95f2ba
- bcId: `bc-767a1802-d279-4557-8dbf-4bd81f95f2ba`
- Branch: `feat/ux-v1-u1b-route-detail-1`
- Mode: `NORMAL`
- Seed: `751123c28da452ae7e20264ec3a47a30f1e0e483`
- Main / merge-base: `b7cadb7688f7bac84df0ea33a7b9ec1f3a9b7c48`
- TASK blob: `78d540737fd6b297ef883a369eb109f07b9bd094` unchanged
- Plan: https://github.com/Jetnity/jetnity/pull/1080#issuecomment-6471053671
- Addendum: https://github.com/Jetnity/jetnity/pull/1080#issuecomment-6471224955
- Exact tip SHA is `git rev-parse HEAD` on this branch after the commit that adds this file.

## Done

Production plan uses one mounted `TripWorkspacePlan`. `Zur Route` is the primary control on both the day and the item. It keeps the canonical URL and the history stack, restores the route anchor, and clears when the same row is chosen again. Column split enters at 49.5rem on the first measurement, re-enters only at 50.5rem, and leaves below 49.5rem. Route 20rem, detail 28rem, gap 1.5rem. The provider slot stays under `data-workspace-split`. A dead id keeps its notice across canonical replace, reload, and graph refresh, and a different valid history entry clears it.

## Local evidence

Node typecheck passed. ESLint reports no new errors. Export, reachability, API guard, package, and schema checks passed. Mounted Chrome covered 390 route-first, same-row reopen, no-day parent URL, invalid item back/forward/reload/new trip, removed day, moved item, 1440 columns, 768 and root-32 narrow, one search mount across four tabs, and editor tab change. N12 chronology browser and U1-A2 sticky geometry stayed green.

## Not claimed

Native App/Auth CI on this head, Vercel Preview on this head, real browser zoom 200%, a physical device, VoiceOver, Work Production, Ready, or merge. Preview READY is not hosted UI acceptance.
