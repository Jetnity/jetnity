# Viator S2 native activities — SELF REVIEW

29 October 2026, Europe/Zurich. Author review only. Not an independent Technical Lead PASS.

The session is still `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`, model `grok-4.7-high-fast`. The S2 task file from `ce9210cf` was not edited. Main `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc` was merged without force. The exact head is the commit that contains this review. The STOP comment records its SHA.

## Holds

- Destination catalog fields are `destinationId`, `name`, `type`, `parentDestinationId`, `lookupId`, and `center`. A `countryCode` property on a destination is ignored. Bangkok, Chiang Mai, the two Parises, Lisbon/Lissabon in Portugal, Ko Chang, Phuket, and Panama City resolve through the COUNTRY ancestor and `landName`. Portugal and Panama as country names do not become cities. A dangling parent and two Lyons stay unresolved.
- Check requests include `currency`. A null currency does not call `/availability/check`. CHF on the labelled CHF flow is sent as CHF. A EUR quote is not relabelled.
- A product with titled options requires one of those codes. A product with none omits `productOptionCode`. `DEFAULT` and `TG1` are not invented. A client `standardProduct: true` flag does not skip a real option list.
- Two returned start times without an explicit `startTime` are rejected. The parser does not keep the first bookable item.
- A season with no `endDate` stays `availabilityClaim: false`. Dates after today plus 384 days are outside the hint.
- Changing the date aborts the previous live check and does not cancel an in-flight detail load. The browser flow uses `AktivitaetenBereich`, selected Morgentour, sent CHF, recovered from a schedule error, cleared the product on a new search and on the Phuket day, and a late 111 did not replace the cleared quote.
- A Monday-only 10:00 is absent on Tuesday. CHF, EUR, and USD are present on built check bodies.
- A Viator search with an unknown id, a different returned id, or a display name outside the confirmed names does not call product search. Lissabon and Wien still search when the injected record lists those names. A throwing reader returns an error response. A disabled provider and a rate-limited request do not read the place.
- `lib/activities/suche.ts` no longer binds `bestaetigt`. `npx eslint . --quiet` passed with `prefer-const` left on. The pre-existing set-state warning in `AktivitaetenBereich` remains a warning and was not silenced.
- At 320px and root font 32px, inside `main.p-4` (measured padding-left 32px), "Verfügbarkeit prüfen" occupied x66–254 and its button occupied x58–262. At 390px the same text occupied x66–324 inside a button at x58–332. Font size was not reduced and overflow was not hidden.
- Twenty-two days use one select. Measured group height was 90px at 390 and 1440 with a 16px root, and 154px at 320px with a 32px root. The search button was at document y 511, 419, and 1199 in those three states. ArrowDown and `selectOption` keep the day and stage identity. The shared scroll row was not edited.

## Gaps

Live Sandbox is BLOCKED. No key was present. Image license is not verified. Checkout transfer is not proven. Hosted Preview acceptance was not repeated for this head. DiscoverCars was not implemented here because #1059 owns those files. CI 40797421578 failed on `ce0a5bcd` and does not cover this head. Exact-head CI for this commit was not green at author review.

The production route still calls `kanonischeOrteLesen`, which can also search by name. The route keeps the row only when `ort.id` matches. That path was not given a live database in these tests.

Stop. No Ready. No merge. No follow-up slice.
