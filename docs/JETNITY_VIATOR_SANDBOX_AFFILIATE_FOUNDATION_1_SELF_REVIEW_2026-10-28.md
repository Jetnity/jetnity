# Viator Sandbox Affiliate Foundation 1 — SELF REVIEW

28 October 2026. Author review by the implementing Cursor session. This is not an independent Technical Lead PASS and it is not Ready.

## Session

Name `Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1`. `run-info.originalModelName` `grok-4.7-high-fast`. bcId `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`. Plan comment posted before code: https://github.com/Jetnity/jetnity/pull/1079#issuecomment-6468148989

Seed before this implementation: HEAD `618a1940020c73da9f7d8cf55cb8efc30cda258c`, tree `d8c158e41332aa5b289a0f24e3195c29b71736d5`, merge-base `71e07c71d06e7c4ef26ed6e8d40080bb9ea24382`. The exact head that contains this review is the pushed commit. A commit cannot embed its own SHA. The STOP comment records `git rev-parse HEAD`, `HEAD^{tree}`, and the merge-base after push.

## Scope check

Owned paths only: `lib/providers/viator/activities/**`, `scripts/viator-sandbox-foundation-1/status.ts`, and the five owned docs. Immutable task untouched. No edit to `lib/activities/**`, `lib/server/providers/core/**`, `app/**`, `components/**`, package, CI, SQL, or env. Concurrent Trip Workspace and Header work was not touched. `next-env.d.ts` was restored and is not part of the change.

## What holds

- Unsafe, spoofed, credentialed, and non-HTTPS product URLs fail. A valid URL is returned unchanged.
- Fixture plus a valid `productUrl` does not create `affiliate_redirect` or `live_api`.
- Review text and `viatorUniqueContent` are omitted. Noindex contract is `X-Robots-Tag: noindex, nofollow` and is not yet attached to a route.
- Schedule `availabilityClaim` is false. `partnerNetPrice` is not the customer amount.
- A traveller total is not treated as adults. A child band is rejected when the product only has adults. `TRAVELER` mixed with `ADULT` is rejected.
- CHF checkout transfer is unsupported. A CHF amount is not invented from a USD supplier price. A response that states CHF keeps that display amount with `checkoutCurrencyConfirmed: false`.
- TTL 3601 is rejected. Age 3600001 ms on a 3600 s TTL is expired. Live check is not reusable.
- A changed date/pax context key is `stale_context`.
- An unknown Jetnity place id does not become a city. The name `Zurich` is not a lookup key.
- Absent key, missing flag, and `VERCEL_ENV=production` do not call HTTP. An injected production origin env does not change the sandbox URL. Booking and modified-since operations are refused before HTTP.
- The sandbox key used in the unit test does not appear in the normalized result.

## Known gaps

- Live Sandbox is BLOCKED. No key, no real request, no claim of API success.
- Image use is not licensed for Jetnity display (`imageLicenseConfirmed: false`, `contentLicenseReviewed: false`). The partner agreement itself was not retrieved beyond the public technical pages.
- Product URL allowlist is the hosts named in the public docs read on 28 October 2026: `www.viator.com`, `viator.com`, `shop.live.rc.viator.com`. A later production affiliate host outside that list will fail closed until evidence extends it.
- Image allowlist is `hare-media-cdn.tripadvisor.com` from the same public examples.
- Destination catalog is not ingested. Viator's weekly `/destinations` cadence is longer than the 3600 s ceiling, so S1 resolves only an explicit place binding.
- Transport uses the shared executor with one attempt and a 12 s timeout. HTTP 429 fails closed. That is intentional: 120 s is a booking recommendation, and this slice does not book.
- The Greg reply remains owner-reported. No duplicate inquiry was sent.
- This review does not replace Technical Lead R1, exact-head CI, or Preview smoke.

## Decision

Stop. Do not mark Ready. Do not merge. Do not start S2.
