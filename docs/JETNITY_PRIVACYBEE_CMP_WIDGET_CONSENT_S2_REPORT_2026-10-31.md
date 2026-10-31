# Jetnity – PrivacyBee CMP and widget consent S2 — REPORT

**Stand:** 31 October 2026. Not a Technical Lead PASS.

## What the code does

- The root bootstrap registers the two CMP listeners and then calls the optional start hook. The hook's return value is ignored, so it cannot authorize a script. The harness hook calls `startLocalContext` on the current snapshot while the API is still missing. It then checks release, the baked kill-switch denial, and the exact hostname before it can create `cookie-banner.js`. `productionBootstrapSource` reads `PRIVACYBEE_KILL_SWITCH` and passes a boolean. Executed script tests cover release true with kill `aus`, release false, and unlicensed hosts. The optional hook is invoked and sees no banner script.
- `PrivacyBeeCmpBoundary` calls `serverReleaseAllowsCmp`. That decision is the release constant plus the kill switch. It does not receive a hostname and does not read request headers. The layout calls the boundary with no test release. A harness-only `{ purpose: 's2-test-release' }` value can mount `PrivacyBeeCmpClient` while the release constant stays false.
- `useSyncExternalStore` reads `readCmpController` and the cached `serverCmpSnapshot`. One bridge is reference-counted. The last unsubscribe removes the listeners. A missing API becomes phase `error` after 12 seconds. That timeout does not load a vendor.
- `decideBundle` is the only gate. A null policy is the production registry and denies. The harness passes its own policy object. Category checks use the consent map. `vendorScriptMayExecute` stays false. A start without a previously issued token is `stale_generation`, so the generation comparison is not a copy of the current epoch.
- Work tokens are issued only after a validated policy is bound. They carry provider, scope, epoch, and that requirement. `startLocalContext` does not bind a policy and does not accept a token from an unbound selection. The required categories are the bound reviewed policy, not every optional category. Loss of a required category, an unusable read, refusal, withdrawal, close, scope change, reorder, and unmount retire that epoch and clear provider intent. An unrelated optional refusal does not. A later true snapshot does not restore the old selection. `acceptPending` rejects a retired token, a token with no live frame, and a token whose consent generation merely matches an old live generation.
- The mounted harness renders the real boundary and client, the choice commands, and an isolated `iframe` with `sandbox="allow-scripts"`. The frame posts active work and repeats a pulse. It arms one delayed message only when the parent asks, immediately before teardown. It has no vendor URL. Category loss removes the document. Preferences render only when the bridge phase is ready.

## Network evidence

The licensed harness navigated a fulfilled `https://jetnity.com/` document. Playwright intercepted `https://app.privacybee.io/cookie-banner.js` once and returned a local fixture. After the clicks, the canary, the category loss, the malformed API, the remount, and page close, the ledger was still that one banner URL and no other foreign host. www.jetnity.com, widgets.jetnity.com, jetnity.com.evil.test, and 127.0.0.1 produced zero banner requests. The geometry page also saw zero vendor requests. Its missing API reached phase `error` through the mounted client.

## Risks

| Level | Item |
| --- | --- |
| P1 | None found in this inert slice. A later edit that sets `CMP_RELEASE_AUTHORIZED` true without a new exact-head review would start requesting the banner on jetnity.com. |
| P2 | The harness release token is a source constant compared in the boundary. The layout does not pass it. A future caller that passes it would mount the client even while the release constant is false. The banner script would still require the bootstrap's own release boolean. |
| P2 | Root-font 32px was run. Browser-chrome zoom was not. Screen reader and a physical device were not. |
| P3 | Native CI and Preview for this head are still unread. Older green CI does not clear R2. |
| Open | DiscoverCars and 12Go execution, host isolation, and legal publication stay outside this PR. |

## Not claimed

No live CMP, no provider widget, no cookie inventory, no legal clearance, no Production activation.
