# Viator S2 native activities — HANDOFF

28 October 2026. Same writer: Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1. bcId `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`. Model `grok-4.7-high-fast`.

## What is wired

For Viator, `activitiesSuchen` calls the canonical reader only after the provider is active and the rate limit allows the search. The confirmed record must match the requested id, country, and display name. Its name and coordinates replace the client fields. A null or different id does not fall back to the typed city. Other providers are unchanged. Tests inject the reader. The route still uses `kanonischeOrteLesen` only when the id matches. No GeoNames fixture read.

The check panel shows option titles. Detail loading and the live quote use separate generations, so a date edit during loading does not strand the panel. A new search in `AktivitaetenBereich` clears the Viator selection. Currency is required. Pricing-record weekdays limit the hinted times. A missing season `endDate` uses the documented 384-day horizon. The browser harness lives in `scripts/viator-s2-native-integration/` and renders `AktivitaetenBereich`.

## Still blocked

Real Sandbox calls, image-license verification, checkout date and currency transfer, and hosted acceptance. The destinations request exists; this session did not call Viator. DiscoverCars remains #1059. Do not mark Ready or merge from this handoff.
