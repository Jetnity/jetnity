# 12Go Mobility Affiliate Linkout V1 — PLAN

**27 October 2026. Writer:** Jetnity 12Go Mobility Affiliate Linkout 1 — Cursor Generation 1.  
**Session:** `bc-c5928faa-840d-41e3-a855-39c560b49754`  
**URL:** https://cursor.com/agents/bc-c5928faa-840d-41e3-a855-39c560b49754  
**Model:** `cursor-cloud run-info.originalModelName` = `grok-4.7-high-fast`  
**PR:** Draft #1057, branch `feat/provider-12go-affiliate-linkout-1`  
**Seed HEAD at dispatch:** `d59d93a4fe405cb1a442d284712894b1ab18dc0f`  
**Base main:** `d698ee9e3e365b09295effc1db5a4f9db165eec8`, mode `NORMAL`

The same plan was posted on the PR before product edits: https://github.com/Jetnity/jetnity/pull/1057#issuecomment-6449895652

## Decision

Ship a pure affiliate handoff for adjacent confirmed stage occurrences inside the existing Organisieren → Verbindungen section.

Route-specific `/de/travel/...` links stay **off** in production. The partner example `https://12go.asia/de/travel/Bangkok/Koh-Chang/?z=17323861&sub_id=jetnity-route-demo` is not bound to a Jetnity place ID, and `TripStage` has no source-verified place kind. `TWELVE_GO_GEPRUEFTE_ROUTEN` is an empty frozen list. Every adjacent pair uses the generic tracked search:

`https://12go.asia/?z=17323861&sub_id=jetnity-mobility-route`

Copy for that case: `Bitte Strecke und Datum bei 12Go auswählen`. It is not an offer.

A unit test injects one synthetic audited pair to prove a future reviewed mapping would emit that exact path in one direction only. That registry is not imported by the UI.

## Ownership

- New: `lib/providers/twelve-go/affiliate/*`
- New: `components/trips/TwelveGoAffiliateLinks.tsx`
- Narrow mount: `components/trips/MobilitaetBereich.tsx`
- Local geometry script: `scripts/twelve-go-affiliate-linkout-1/nachweis.ts` (outside `npm test`)
- Task docs only. `docs/ACTIVE_WORK_STATUS.md` stays Root-owned.

Not touched: `lib/mobility/*` writes, Auth, RLS, SQL, GYG #1043, #1051 day docs, #1052 lodging/audit, #1053 traveller prep, #1054 guest nav, Trip.com, provider search, commercial provenance.

## Behaviour

- Edges: consecutive stages by `position`, then occurrence id. Repeated visits stay. Same country is not collapsed. Blank names do not bridge their neighbours. No origin leg and no return home.
- Date label: exactly one transfer whose place IDs match the edge and whose `startsOn` is a real calendar date. Stage arrival, trip start/end, and overnight `endsOn` are not the departure. No `date=` on the URL.
- No currency, headcount, age, trip id, or client ref in the query.
- Anchor: `target="_blank"`, `rel="noopener noreferrer sponsored"`, `min-h-11`. No iframe, script, or image.
- `MobilityProvider.suchen` remains unimplemented. The existing “Verbindungen prüfen” control is unchanged and still does not run on render.

## Traveller context

The link does not choose among citizenships, documents, or residence. It does not send party facts. Route Truth in `lib/mobility/kanten.ts` is left unchanged.

## Out of scope

12Go API, widget, scraping, prices, attribution proof, Production provider activation, and a real external click. Work verifies the live landing after review. Attribution stays unknown.
