# Viator S2 native activities — HANDOFF

29 October 2026, Europe/Zurich. Same writer: Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1. bcId `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`. Model `grok-4.7-high-fast`.

## What is wired

For Viator, `activitiesSuchen` calls the canonical reader only after the provider is active and the rate limit allows the search. The confirmed record must match the requested id, country, and display name. Its name and coordinates replace the client fields. A null or different id does not fall back to the typed city. Other providers are unchanged. Tests inject the reader. The route still uses `kanonischeOrteLesen` only when the id matches. No GeoNames fixture read. The search binding that ESLint flagged as `prefer-const` on `ce0a5bcd` is now `let ziel`, because a Viator request replaces it.

The check panel shows option titles. Detail loading and the live quote use separate generations, so a date edit during loading does not strand the panel. A new search in `AktivitaetenBereich` clears the Viator selection. Currency is required. Pricing-record weekdays limit the hinted times. A missing season `endDate` uses the documented 384-day horizon.

The day list is a labelled `<select id="activity-day-select">`. It shows the selected day, accepts the keyboard, and does not render one row per day. Local section and check-panel padding is 12px, so a 32px root font does not double that padding. The availability label can break inside the button. The browser harness lives in `scripts/viator-s2-native-integration/` and renders `AktivitaetenBereich` inside `main.mx-auto.max-w-3xl.p-4`. `#tage=22` mounts 22 synthetic days. The shared scroll row, workspace, and navigation were not edited.

## Still blocked

Real Sandbox calls, image-license verification, checkout date and currency transfer, hosted acceptance, and exact-head CI for the commit that contains this handoff. The destinations request exists; this session did not call Viator. DiscoverCars remains #1059. Do not mark Ready or merge from this handoff.

## Next step

Independent review of the new head. CI 40797421578 belongs to `ce0a5bcd` and is not evidence for this commit.
