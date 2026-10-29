# Viator S2 native activities — HANDOFF

29 October 2026, Europe/Zurich. Same writer: Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1. bcId `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`. Model `grok-4.7-high-fast`.

## What is wired

For Viator, `activitiesSuchen` calls the canonical reader only after the provider is active and the rate limit allows the search. The confirmed record must match the requested id, country, and display name. Its name and coordinates replace the client fields. A null or different id does not fall back to the typed city. Other providers are unchanged. Tests inject the reader. The route still uses `kanonischeOrteLesen` only when the id matches. No GeoNames fixture read. The search binding that ESLint flagged as `prefer-const` on `ce0a5bcd` is now `let ziel`, because a Viator request replaces it.

The check panel shows option titles. Detail loading and the live quote use separate generations, so a date edit during loading does not strand the panel. A new search in `AktivitaetenBereich` clears the Viator selection. Currency is required. Pricing-record weekdays limit the hinted times. A missing season `endDate` uses the documented 384-day horizon.

The day list is a labelled `<select id="activity-day-select">`. It shows the selected day, accepts the keyboard, and does not render one row per day. Local section and check-panel padding is 12px, so a 32px root font does not double that padding. The availability label can break inside the button. The browser harness lives in `scripts/viator-s2-native-integration/` and renders `AktivitaetenBereich` inside `main.mx-auto.max-w-3xl.p-4`. `#tage=22` mounts 22 synthetic days. Workspace and navigation were not edited.

## Scroll row removal

Comment 6494491081 authorized one file. On this branch a search of `*.ts`, `*.tsx`, `*.js`, and `*.mjs` found `ScrollRow` only inside `components/ui/scroll-row.tsx`. `node scripts/erreichbarkeit.mjs --json` listed that path as the only orphan. The file is deleted. No dummy import, no reachability exception, and no change to `scripts/erreichbarkeit.mjs`, `scripts/exporte.mjs`, or `scripts/pakete.mjs`. Main `8fc72a18`, workspace #1082 `f2ff4928`, and DiscoverCars #1059 `6b87036f` were not edited here. Shared design and activity docs that still name ScrollRow were left unchanged.

## Native select on macOS headless Chrome

The Linux browser test presses ArrowDown and, on this machine, moves Tag 1 to Tag 2 and the Bangkok day to Phuket-Tag. Comment 6485453294 records that the same ArrowDown sequence does not change a native select in macOS headless Chrome 156, including a plain HTML select. Typeahead worked in that review. The product control was not replaced and the test was not rewritten. Real-device, VoiceOver, and full-browser-zoom acceptance remain open.

## Still blocked

Real Sandbox calls, image-license verification, checkout date and currency transfer, hosted acceptance, and exact-head CI for the commit that contains this handoff. The destinations request exists; this session did not call Viator. DiscoverCars remains #1059. Do not mark Ready or merge from this handoff.

## Next step

Independent review of the deletion head. CI 40800257522 is the FAIL on `7a255a12` and is not evidence for this commit.
