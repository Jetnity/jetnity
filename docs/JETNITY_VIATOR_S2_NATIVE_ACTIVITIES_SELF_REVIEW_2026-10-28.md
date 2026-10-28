# Viator S2 native activities — SELF REVIEW

28 October 2026. Author review only. Not an independent Technical Lead PASS.

The session is still `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`, model `grok-4.7-high-fast`. The S2 task file from `ce9210cf` was not edited. Main `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc` was merged without force. The exact head is the commit that contains this review. The STOP comment records its SHA.

## Holds

- Destination catalog fields are `destinationId`, `name`, `type`, `parentDestinationId`, `lookupId`, and `center`. A `countryCode` property on a destination is ignored. Bangkok, Chiang Mai, the two Parises, Lisbon/Lissabon in Portugal, Ko Chang, Phuket, and Panama City resolve through the COUNTRY ancestor and `landName`. Portugal and Panama as country names do not become cities. A dangling parent and two Lyons stay unresolved.
- Check requests include `currency`. A null currency does not call `/availability/check`. CHF on the labelled CHF flow is sent as CHF. A EUR quote is not relabelled.
- A product with titled options requires one of those codes. A product with none omits `productOptionCode`. `DEFAULT` and `TG1` are not invented. A client `standardProduct: true` flag does not skip a real option list.
- Two returned start times without an explicit `startTime` are rejected. The parser does not keep the first bookable item.
- A season with no `endDate` stays `availabilityClaim: false`. Dates after today plus 384 days are outside the hint.
- Changing the date aborts the previous live check and does not cancel an in-flight detail load. The browser flow uses `AktivitaetenBereich`, selected Morgentour, sent CHF, recovered from a schedule error, cleared the product on a new search and on the Phuket day, and a late 111 did not replace the cleared quote.
- A Monday-only 10:00 is absent on Tuesday. CHF, EUR, and USD are present on built check bodies.
- Option titles are required. An untitled option is dropped.

## Gaps

Live Sandbox is BLOCKED. No key was present. Image license is not verified. Checkout transfer is not proven. Hosted Preview acceptance was not repeated for this head. DiscoverCars was not implemented here because #1059 owns those files. Previous CI runs do not cover this head.

Stop. No Ready. No merge. No follow-up slice.
