# Jetnity – CMP / 12Go R8 source release — REPORT

**Stand:** 1 November 2026. Not a Technical Lead PASS and not a live-run record.

## Source

`CMP_RELEASE_AUTHORIZED` is the single functional literal and is now `true`. `freigabe.ts` still denies on kill `aus` and on every host other than `jetnity.com` after the existing lowercase check. `JETNITY.COM` therefore remains licensed. `www.jetnity.com` does not.

The shipped 12Go policy is unchanged: `twelvego-general-chf-20261031-r1`, required category `ANALYTICS_STORAGE` only, disclosure `twelvego-general-disclosure-v1`, network `twelvego-general-network-v1`, artifact `3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e`, path `/embed/twelvego`, protocol `1`, sandbox `allow-scripts allow-same-origin allow-forms allow-popups`, host commit `f056b01d63ac7d61650864734a9b44eb6484989e`. DiscoverCars is null. `purposeSeparationVerified` stays false. `TWELVE_GO_WIDGET_FREIGABE` stays `CONSENT_BLOCKED`.

Positive proofs call `productionBootstrapSource(null)` and then the real facade. The API in those proofs sets the two necessary categories and `ANALYTICS_STORAGE` true, and `AD_STORAGE`, `AD_USER_DATA`, `AD_PERSONALIZATION`, and `PERSONALIZATION_STORAGE` false. A missing baked gate, an explicit `release: false` bootstrap, a kill, a foreign host, a missing API, and a DiscoverCars request still return no capability.

## Harness

The parent page evaluates `productionBootstrapSource(null)` for the positive and absent-API modes, and `buildBootstrapSource({ release: false, killDenied: false })` for the closed mode. The ready-API fixture no longer writes `__jetnityCmp`. `https://app.privacybee.io/cookie-banner.js` is fulfilled with an inert local script and counted per browser context. Every other unexpected request stays on the failure ledger. `grant-beobachter.ts` was not edited.

The shared CMP harness binds its licensed page to `productionBootstrapSource(null)` and keeps its synthetic DiscoverCars fixture. That harness is not a 12Go pass.

## Risks

| Level | Item |
| --- | --- |
| P0 | None found in the offline candidate. |
| P1 | Publishing this candidate loads the real CMP banner for licensed `jetnity.com` visitors and can start 12Go only after analytics consent and a fresh request. These offline tests did not do that. Root owns publication and the live run. |
| P2 | The parent harness uses the installed Chrome channel when Playwright's downloaded browser is absent. The assertions are unchanged. |
| P3 | Native CI and Preview for the implementation head are unread until the push check. |
| Open | Cookie, storage, form, search, and withdrawal acceptance on the live host remain Root's later runtime plan. |

## Not claimed

No real CMP initialization, 12Go form, search, referral, storage observation, or withdrawal acceptance occurred.
