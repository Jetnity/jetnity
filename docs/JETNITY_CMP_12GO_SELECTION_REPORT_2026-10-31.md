# Jetnity – CMP 12Go selection — REPORT

**Stand:** 31 October 2026. Not a Technical Lead PASS.

## What the code does

- `PRODUCTION_POLICY_TABLE.discovercars` is null. `PRODUCTION_POLICY_TABLE.twelvego` is frozen, including its `requiredOptional` array. `readShippedProductionPolicy('twelvego')` validates that row. `readShippedProductionPolicy('discovercars')` returns null.
- The selected tuple is policy `twelvego-general-chf-20261031-r1`, required category `ANALYTICS_STORAGE` only, processing `twelvego-load-affiliate-analytics-v1`, disclosure `twelvego-general-disclosure-v1`, network `twelvego-general-network-v1`, artifact `3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e`, parent `https://jetnity.com`, child `https://jetnity-widgets.vercel.app`, path `/embed/twelvego`, protocol `1`, commit `f056b01d63ac7d61650864734a9b44eb6484989e`, sandbox `allow-scripts allow-same-origin allow-forms allow-popups`.
- `CMP_RELEASE_AUTHORIZED` is still false. `productionBootstrapSource()` bakes `releaseAllowed: false`. `requestProductionExecution`, `checkProductionExecution`, and `consumeProductionGrant` still fail closed on that gate. The four signatures are unchanged.
- `TWELVEGO_PRODUCTION_DISCLOSURE` repeats the disclosure revision, the label `12Go`, the privacy URL `https://12go.asia/en/privacy-policy`, the four recipient hosts, and the German facts from the task. The prose does not contain the policy id or the commit. `purposeSeparationVerified` is unchanged and false.
- `PrivacyBeeCmpPreferences` has one optional `appearance` prop. It has no click handler and no ready, host, release, or harness prop. The footer passes `appearance="footer"`. A null result leaves no empty list item.

## Network evidence

The licensed harness navigated a fulfilled `https://jetnity.com/` document. Playwright intercepted `https://app.privacybee.io/cookie-banner.js` once and returned a local fixture. After the preferences checks, the canary, category loss, regrant, close, remount, unlicensed hosts, and cleanup, the ledger was still that one banner URL and no other foreign host. The geometry page on `127.0.0.1` used `productionBootstrapSource()` and produced zero banner requests.

## Risks

| Level | Item |
| --- | --- |
| P1 | None found in this source selection. Turning `CMP_RELEASE_AUTHORIZED` true without a new exact-head review would let the real 12Go row pass the policy gate on `jetnity.com`. |
| P2 | The 12Go author still has to import the disclosure and call the facade. This branch does not mount a provider. |
| P2 | The harness renders `PrivacyBeeCmpPreferences` with the footer appearance. It does not boot the full `Footer` tree, because that tree reads the Next router and a browser Supabase client. Production `Footer.tsx` does mount the same component, and the false release keeps that control out of the public DOM. |
| P3 | Native CI and Preview for this head are unread until the push check. |
| Open | DiscoverCars selection, live CMP, host requests, and consent/form/storage acceptance stay outside this PR. |

## Not claimed

No live CMP, no provider widget, no cookie inventory, no legal clearance, no Production activation.
