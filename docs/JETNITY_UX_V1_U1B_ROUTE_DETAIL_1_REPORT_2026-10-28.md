# UX V1 U1-B Route and Detail 1 — REPORT

28 October 2026. Generation 1. Independent Technical Lead R1 has not started.

## What changed

`TripWorkspace` still owns canonical history. Day selection is a root push. Item selection is a child push whose parent is the URL being left, including a route that still shows `tag` and `punkt`. `routeZeigen` does not push, replace, or call `history.back`. Escape and browser Back still use `schliessen`.

The same-URL `replaceState` in `historieSchreiben` updates only the UI notice on the current entry and keeps `elternUrl`. Popstate still never pushes. Next markers `__NA`, `_N`, and `__PRIVATE_NEXTJS_INTERNALS_TREE` are still removed.

`data-workspace-active-domain` is not moved into Plan. Search mount count stayed 1 with 0 unmounts after an explicit synthetic search, four tabs, narrow/wide resize, and Zur Route. One fetch/XHR counter stayed empty; the synthetic probe counted one explicit click.

Notices live in component state and on the current `jetnityWorkspace.hinweis`. They are not trip truth. A removed day is not written as `days[0]`. A moved item stays that item on its stored day.

## Tests

Passed locally: `lib/trips/ux-u1b-route-detail-1/*.test.ts`, N12 `laeufe` and mounted browser, plan premium source contract, detail, workspace-mode-2, cross-device, timeline core and temporal render, U1-A shell, U1-A2 mounted geometry. `tsc --noEmit` passed. `eslint` on the touched files has no errors. `check:exports`, `check:dead`, `check:api-schutz`, `check:deps`, and `check:schema-bezug` passed.

`npm run build` finished with exit code 0 after a successful TypeScript pass and static generation.

## Boundaries

No SQL, Auth, RLS, provider activation, secret, env, indexing, or cost change. Holds #917, #985, #982, #968, #748, #1073, #1059, and #1079 stay. noindex and the USD 100/month cap stay. `lib/trips/workspace-mode.ts` was not edited.
