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

## Sandbox environment

S2-PREACTIVATION-R1, comment 6495438986. `viatorSandboxZugang` opens the real client only for exact `preview` or `development`, and only after the calls flag and key checks. Missing, empty, unknown, Production, and malformed values return before transport. Tests inject HTTP and count zero calls. The cleanup PASS [40860128741](https://github.com/Jetnity/jetnity/actions/runs/40860128741) remains valid for `b7299e69` and does not cover this guard change. No secret was installed.

## Destination diagnostic

S2-SANDBOX-FAILURE-DIAGNOSTICS-R1. A failed `destinations` call writes one allowlisted server record and still throws the existing guest message. The write is inside a catch that swallows a telemetry failure and does not log it again. Classes are `http_denied`, `transport_body`, `catalog_schema`, `timeout`, `network`, `rate_limited`, `aborted`, or `other`. No body, header, key, URL, or trip id is included. `sandbox.ts` already returned the typed failure, so it was not changed. Shared transport code was not changed. CI 40891646901 is the historical SUCCESS on `c470c140`. The hosted failure at 13:52:42.953Z is still unclassified. No new provider call was made.

## Product codes and option truth

S2 R3, review 5722552523. One Viator predicate accepts `2855KENNEDY_TKTS` and `2050_PA` on content, request, schedule, check, and affiliate paths. Unsafe path, query, fragment, encoding, and length stay out. Untitled or malformed `productOptions` stay unresolved. They do not become a standard product, and the live check does not run. The original product URL is unchanged. The R3 task amendment is unchanged. `origin/main` `b7ebc399b92303eacda9afdaa1786f245492051f` was merged without rebase. Route and White/Mint files were left as main wrote them. The hosted destinations failure stays unclassified. No provider call.

## Still blocked

Real Sandbox calls, image-license verification, checkout date and currency transfer, hosted acceptance, and exact-head CI for the commit that contains this handoff. The destinations request exists; this session did not call Viator. DiscoverCars remains #1059. Do not mark Ready or merge from this handoff.

## Next step

Independent review of the R3 head. CI 40903974616 is the historical SUCCESS on `814920d0`. The hosted destinations failure stays unclassified until a later permitted one-shot retest.
