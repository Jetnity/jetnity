# Jetnity – PrivacyBee CMP and widget consent S2 — REPORT

**Stand:** 31 October 2026. Not a Technical Lead PASS.

## What the code does

- Root layout emits a first-party bootstrap built with `CMP_RELEASE_AUTHORIZED === false`. It records deny and registers the two documented document listeners before it would create a banner script. With the constant false, it returns before any banner element.
- `planBannerInsert` allows a banner URL only for release true, kill switch not `aus`, and hostname exactly `jetnity.com`. `cmpProductionBannerAllowed` always returns false.
- The read adapter accepts only the seven documented categories as real booleans, requires the two necessary categories to be true, and treats a ready `categories` array as an inventory. `hasExplicitConsent() !== true` is not a grant. Event details are not trusted; the bridge re-reads the API.
- `decideProductionProvider` is denied for both providers, including `{ enabled: true }`. `vendorScriptMayExecute` stays false. `decideSyntheticBundle` returns execute true only for the frozen `SYNTHETIC_BUNDLE_POLICY` object, a current `selected` intent, a matching generation, and every optional category true. `productionExecute` stays false.
- `PrivacyBeeCmpFrameSlot` is a div. Withdrawal increments the generation. A stale start does not recreate the frame. Repeat start does not duplicate it.
- Preferences use `privacybee-display-preferences` only when the choice is told the CMP is ready. The production boundary renders no control.

## Network evidence

The licensed harness navigated a fulfilled `https://jetnity.com/` document. Playwright intercepted `https://app.privacybee.io/cookie-banner.js` once and returned a local fixture. www.jetnity.com, widgets.jetnity.com, jetnity.com.evil.test, and 127.0.0.1 produced zero banner requests. No other foreign host was accepted. The geometry page also saw zero vendor requests.

## Risks

| Level | Item |
| --- | --- |
| P1 | None found in this inert slice. A later edit that sets `CMP_RELEASE_AUTHORIZED` true without a new exact-head review would start requesting the banner on jetnity.com. |
| P2 | Root-font 32px was run. Browser-chrome zoom was not. Screen reader and a physical device were not. |
| P2 | The synthetic allow path is real code. It is not mounted on a route and production start does not call it. A future import of `SYNTHETIC_BUNDLE_POLICY` into a production component would be a defect. |
| P3 | Native CI and Preview for this head are still unread. |
| Open | DiscoverCars and 12Go execution, host isolation, and legal publication stay outside this PR. |

## Not claimed

No live CMP, no provider widget, no cookie inventory, no legal clearance, no Production activation.
