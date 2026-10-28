# UX V1 U1-B Route and Detail 1 — REPORT

28 October 2026. Generation 1. Independent Technical Lead R1 required changes on `e8a0b496a80e0b984f27813802f1f6a66e5a1c11`. This report is the correction. Stop for independent R2.

## R1.1 Effective day

`TripWorkspacePlan` still calls `timelineAbleiten(reise, ohneTag, aktiverTag)`. The body uses one id: the canonical tag when it exists, otherwise the first day only for the wide unlabeled default, otherwise nothing. A second derivation is used when that id differs from `aktiverTag`, so Back to a tag-free URL cannot keep day 11's items under a Tag 1 header. Delete runs only when the item's stored day is that same id. The mounted regression clicks the Tag 1 remove control and records `day-1:flight-out`.

## R1.2 Route scroll

`routeLageMerken` runs from `pointerdown` inside a route that has a client box and is not hidden or inert. `tagWechseln`, `oeffneItem`, and `routeZeigen` do not capture. The restore layout effect writes the saved window position after focusing the route anchor with `preventScroll`, then again on the next frame. The detail-close focus uses `preventScroll` while the route is emphasized. The mounted regression covers scrolled route to day to route, route to day to item to route, the same row, a missing day anchor, and a wide/narrow reflow.

## R1.3 Width

The matrix now opens the route, day 11, and stay 11 at seven widths and both root sizes. The inherited large-text overflow on the selected item was a longest word whose `overflow-wrap: break-word` does not reduce min-content. The owned detail slot sets inherited `word-break: break-word`. Document `scrollWidth` stays within 1px of `clientWidth`. Text is not clipped. Read-only detail and integrated-day files were not edited.

## Tests on this correction

Passed: `lib/trips/ux-u1b-route-detail-1/browser.test.ts` (10), `lib/trips/n12-chronology-1/browser.test.ts` (10), `lib/trips/ux-u1a2-geometry-1.test.ts` (8), `anordnung.test.ts`, `hinweis.test.ts`, `n12-chronology-1/laeufe.test.ts`, and `trip-plan-premium-experience-4.test.ts` (27 together). `tsc --noEmit` passed. ESLint on the touched presentation and harness files reported 0 errors. `check:exports`, `check:dead`, `check:api-schutz`, and `check:deps` passed. `check:schema-bezug` exited 0 and repeated existing local/unapplied RPC notes. This slice does not change the schema.

`npm run build` exited 0.

## Boundaries

No SQL, Auth, RLS, provider activation, secret, env, indexing, or cost change. Holds #917, #985, #982, #968, #748, #1073, #1059, and #1079 stay. noindex and the USD 100/month cap stay. `lib/trips/workspace-mode.ts`, N12 helpers, `TripWorkspaceDetail`, and `TripIntegratedDay` were not edited.
