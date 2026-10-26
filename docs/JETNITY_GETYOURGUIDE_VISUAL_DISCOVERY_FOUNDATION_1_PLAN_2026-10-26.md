# GetYourGuide Visual Discovery Foundation 1 — PLAN

Author: Jetnity GetYourGuide Visual Discovery Foundation 1 — Cursor Generation 1.
Tracking #1038. Parent #1023 V5. Draft PR #1039.
Immutable TASK V1 blob `dbe1c2def1a4f1b2d8158e467971601a80d03b43`. This PLAN does not edit that task.

## Observed runtime

Recorded from cursor-cloud `run-info` before implementation, not from the dispatch prompt:

- Model: `grok-4.7-high-fast`
- Metadata source: cursor-cloud MCP `run-info`
- Session: `bc-301aaa79-6426-49bb-b534-3232a8a5ee9b`
- Link: https://cursor.com/agents/bc-301aaa79-6426-49bb-b534-3232a8a5ee9b
- Logical name: Jetnity GetYourGuide Visual Discovery Foundation 1 — Cursor Generation 1
- Visible chat title, best effort: “GYG Visual Discovery Foundation 1 — Generation 1”

Operating mode read as `NORMAL`. Product work on this authorized branch is allowed. Special Product-Owner gates remain. PR #487 stays parked and is not this slice.

## Source findings that shaped the code

- `AktivitaetenBereich` starts native search only on an explicit click and keeps epoch/generation ownership in `lib/activities/suchlebenszyklus.ts`. An invalid controlled day id falls back to the first day. An empty day list returns before any day UI. GetYourGuide must see the original requested id and must also appear when there are no days.
- `TripStage` has `placeId` and `countryCode`, not a geographic type. Canonical type lives on `Ort`. `istOrtId` accepts only `geonames:<digits>` and `airport:<IATA>`. `ortBestaetigen` is a server action against Supabase and is not called here.
- Bangkok city `geonames:1609350` and Thailand `geonames:1605651` exist in the local GeoNames fixture. Panama, Phuket and a Bangkok region do not. Those cases use clearly synthetic local ids in tests and the harness only.
- Search facts already exclude affiliate and booking URLs. Widget contents are not decoded into `ActivityOption`.
- There is no general consent platform. `PrivacyBeeEinbettung` stays a legal-page loader and is not reused.

## Shape

1. Closed application gate in `freigabe.ts`. One frozen closed value. No open branch, no env, URL, storage or client flag.
2. GYG-specific public descriptor in `widget.ts`: `{ anbieter: 'getyourguide', umfang, oeffentlicheKennung }`. The application mapping is an empty frozen array and the application renderer is `null`.
3. Context planner in `kontext.ts`. It copies only trip id, stage id / country code / place id, and day id / stage id. It rejects an invalid day, a missing stage, an unconfirmed place, a country/type mismatch, an airport, and a country used as a day target. Country inspiration is a separate scope. One confirmed country can be named without becoming a city. Several countries stay a choice. A city does not silently become its country.
4. Lifecycle in `lebenszyklus.ts`. Load is allowed only for a ready plan and an explicit action. Stale completion, double action, retry and context change are generation-owned. Rejection text is sanitized.
5. `GetYourGuideAktivitaeten` renders inside the existing activities area, including the no-days return. The default export always uses the closed application seam. `GetYourGuidePruefFlaeche` accepts an injected resolver and renderer only when `herkunft` is `pruefung`.
6. `scripts/getyourguide-visual-discovery-1/` mounts that UI locally with synthetic content. It is not a public route. External requests are aborted.

## Effects

- Modules: activities area and a new `lib/activities/getyourguide/` boundary.
- Database: none. No migration, RLS or type generation.
- API: none. No new route and no change to `POST /api/activities/search`.
- Trip graph: read-only projection. No writer, booking, adoption or native-search change.
- Security: the closed path cannot receive a renderer. The public descriptor is three fields. No secret, service role or provider call.
- Cost: none. No new dependency, hosted service or paid call.
- Tests: focused identity, country, lifecycle and boundary tests, plus one local mounted harness. Native `suchlebenszyklus` tests stay the regression for PR #1025.

## Not this plan

No guessed widget attributes, SPA API, Analyzer, automatic widget, external script or image, consent platform, catalogue scrape, Viator work, or live pictured-offer claim.
