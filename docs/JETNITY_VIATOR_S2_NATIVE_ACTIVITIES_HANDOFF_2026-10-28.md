# Viator S2 native activities — HANDOFF

28 October 2026. Same writer: Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1. bcId `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`. Model `grok-4.7-high-fast`.

## What is wired

`activitiesSuchen` asks the injected canonical reader for the selected place id, checks that id with `ortAusBestand`, and only then passes name, aliases, type, and country to Viator. Browser aliases are removed. The search route uses `kanonischeOrteLesen` and keeps the result only when the id matches. Tests inject the reader and do not call the database. `activityProviderAus` still loads `GET /destinations` and does not read the GeoNames fixture.

The check panel shows option titles. Detail loading and the live quote use separate generations, so a date edit during loading does not strand the panel. A new search in `AktivitaetenBereich` clears the Viator selection. Currency is required. Pricing-record weekdays limit the hinted times. A missing season `endDate` uses the documented 384-day horizon. The browser harness lives in `scripts/viator-s2-native-integration/` and renders `AktivitaetenBereich`.

## Still blocked

Real Sandbox calls, image-license verification, checkout date and currency transfer, and hosted acceptance. The destinations request exists; this session did not call Viator. DiscoverCars remains #1059. Do not mark Ready or merge from this handoff.
