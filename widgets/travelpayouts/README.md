# Official flight widget host

This directory is a separate static website, **not a route on the Jetnity account origin**. The official widget needs storage and therefore cannot operate in an opaque sandbox. Third-party JavaScript must not be granted Jetnity's account origin to work around that restriction.

## Deployment after preview approval

1. Deploy this directory as the root of a separate static project. No framework, dependencies, build command or credentials are required. Use an unrelated HTTPS hostname without Jetnity account cookies. The included `vercel.json` sets a restrictive CSP and permits only `https://jetnity.com` and `https://www.jetnity.com` to embed it. An isolated preview hostname must be explicitly added for a hosted preview.
2. Set `NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN` on the intended Jetnity environment to that bare HTTPS origin, then rebuild. It must not contain a path, query or fragment. Leave unset to retain the existing Booking flight handoff.
3. Verify the real document, supplier requests, completed results, filters, booking popup, separate origins, consent revocation, and mobile expansion on the deployed environment. A successful build or widget bootstrap message does not prove successful results.

Public widget ID: `24468`; partner marker: `804084`. Managed in the owner's Travelpayouts account. German, CHF, green Jetnity controls, no hotel popunder, no referral banner. Never add Search API credentials here. Live supplier prices and booking links remain in the official widget; Jetnity does not extract its internal data.

## Contract

- Only `flightSearch`, `origin_airports`, and `destination_airports` are accepted. Jetnity validates real calendar dates and the next 330 days before encoding the documented yearless search format. One-way, return and open-jaw searches are supported; only Economy/Business and the verified adult/child/infant format are exposed.
- There is deliberately no second provider search form. The native Jetnity form submits a search snapshot to the tickets container. The provider also offers flexible-date suggestions inside its results; those do not update the native form or the trip. Supplier selection is not a confirmed booking.
- The frame sends only known readiness/error messages. The parent validates the exact source window and origin. Readiness means the bootstrap script loaded. Provider UI owns actual searching, results, no-results and provider errors.
- Separate-origin iframe with scripts, same-origin storage, forms and user-initiated booking popups. No parent navigation, camera, microphone, location or payment permission. `credentialless` is additional defense on supporting browsers; independent origins remain necessary everywhere.
- Only airports, dates, passenger counts, cabin and public affiliate configuration leave Jetnity. No trip IDs, budgets, notes, names, saved bookings or authenticated session data are passed. Explicit CMP rejection/revocation blocks or removes the frame; a previously observed CMP disappearing does not reopen it.

## Known provider limits

The provider's current public bundle sets `citizenship: "RU"` internally even when German/CHF searches have `market_code: "CH"`. Jetnity does not supply a traveller citizenship, and does not modify/intercept this payload. Its effect on fares remains unverified; do not represent this as a verified traveller nationality or as resolved. The owner authorized publication after reviewing the preview.

Some provider fallback/error copy is English despite German configuration. Filtering can show explicitly labelled relaxed alternatives when no exact match exists. The flexible-date strip and ticket totals may use different price bases; no Jetnity guarantee of a whole-market best price is made. Provider selection/booking callbacks and automatic transfer into the trip are not implemented or claimed. Physical iPhone/Safari and a hosted HTTPS preview remain separate checks.

## Release hosting

Approved static project: `jetnity-flight-widget` (`prj_SrFRWKBWs8rzO5VrHVxhXKicQAqr`). Public origin: `https://jetnity-flight-widget.vercel.app`. Deploy only this directory; never include application environment files or credentials.
