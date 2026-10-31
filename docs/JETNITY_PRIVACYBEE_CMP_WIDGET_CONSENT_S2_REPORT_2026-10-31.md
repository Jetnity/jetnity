# Jetnity – PrivacyBee CMP and widget consent S2 — REPORT

**Stand:** 31 October 2026. Not a Technical Lead PASS.

## What the code does

- The root bootstrap is the loader. It checks release, then the baked kill-switch denial, then the exact hostname, and only then creates `cookie-banner.js`. `productionBootstrapSource` reads `PRIVACYBEE_KILL_SWITCH` and passes a boolean. Executed script tests cover release true with kill `aus`, release false, and unlicensed hosts.
- `decideBundle` is the only gate. A null policy is the production registry and denies. Tests pass a policy object that is not exported from the production module. Category checks use the consent map. `vendorScriptMayExecute` stays false.
- The mounted harness uses that controller, the real choice commands, and an isolated `iframe`. Preferences render only when the bridge phase is ready and call the fixture's official-class handler. Category loss and withdrawal remove the frame. Every navigation is route-intercepted.

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
