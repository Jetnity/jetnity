# Viator S2 native activities — HANDOFF

28 October 2026. Same writer: Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1. bcId `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`. Model `grok-4.7-high-fast`.

## What is wired

`activityProviderAus` loads `GET /destinations` when the sandbox guard is open, caches that catalog for at most 3600 seconds, and resolves a CITY, TOWN, or ISLAND by name, country ancestor, nearby center, and GeoNames alternate names already in `lib/places/fixtures/geonames.tsv`. Country identity uses `landName`. An ambiguous or unknown place does not guess an id. A country record is not returned as the place.

The check panel shows option titles. Detail loading and the live quote use separate generations, so a date edit during loading does not strand the panel. A new search in `AktivitaetenBereich` clears the Viator selection. Currency is required. Pricing-record weekdays limit the hinted times. A missing season `endDate` uses the documented 384-day horizon. The browser harness lives in `scripts/viator-s2-native-integration/` and renders `AktivitaetenBereich`.

## Still blocked

Real Sandbox calls, image-license verification, checkout date and currency transfer, and hosted acceptance. The destinations request exists; this session did not call Viator. DiscoverCars remains #1059. Do not mark Ready or merge from this handoff.
