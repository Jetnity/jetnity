# Jetnity Widgets Host S2 — SELF-REVIEW

**Stand:** 1 November 2026. Author review only. Not an independent Technical-Lead PASS. Not Ready.

## Current — R6

The author merged main `a3fda92a1a2653f8dd59383334ba0d148000ba8f` into Draft #1097. No host or audit source changed. Subtree `5f79b8161851fc562205cc1d5d8ae5fab80b67d4` still matches deployed `dpl_AtVsfaox5dbxx6i1DFqVM7RJ5Tm4` / `https://jetnity-widgets.vercel.app`, project `prj_Qq4i6dNt3hlSbQDpr2LrRaSKOQsk`, source `f056b01d63ac7d61650864734a9b44eb6484989e`.

12Go selected. DiscoverCars unselected. `capturePass: false`. `providerTransmission: false`. `BLOCKED_TRANSPORT`. Phase B closed. Integrations inventory 403 is **NOT VERIFIED**, not empty. #1086 remains unfinished for real 12Go parent, CMP, form, search, referral, storage, and withdrawal. Router is #1097. The older “ready for review / not deployed” decision below is historical.

## Earlier — 12Go source selection

Author review only. The 12Go row is selected with `purposeSeparationVerified: false`. DiscoverCars stays unselected. Host tests on this change were 17/17. The historical `audit-preflight.mjs` assertion that both rows are unselected now fails and is not a pass gate. The DiscoverCars audit is not accepted. Dedicated-host, parent, and CMP runtime acceptance are still missing.

## Earlier head

- A decision id can be granted only when it is greater than every id already used. A challenge that was already granted is rejected when the id changes. Going back from 8 to 7 does not grant.
- `startProductionShell` sets `#jetnity-widget-status` to requested, denied, or inserted. The inserted sentence says the script is not proof of a working provider form.
- The browser harness uses `https://jetnity.com` and `https://jetnity-widgets.vercel.app`, fulfills one local canary, and fails on any other request. The 200% font check edits the served nonce stylesheet and reads computed `32px`. It does not use `bypassCSP`.
- `productionPlanForClient()` is null for both providers. `networkPolicy: 'unselected'` is metadata, not an allowlist.

## Historical, head 58f71f05 and the pre-R1 harness

The earlier self-review said the shell test required `"plans":{}`, that Playwright aborted `https://canary.test`, and that the harness did not execute `https://jetnity-widgets.vercel.app`. Those sentences described that head and the first harness. They are not the current proof.

## Does not hold

- Vercel project settings, DNS, and production cookies were not read in this turn.
- `frame-src` remains `'none'`. No vendor frame, form, or popup capability was added.
- #1096 was not imported.
- Native CI for the new head is not claimed in this file. The delivery comment records the check state after push.
- Author self-review is not merge approval.

## Decision

Ready for Technical-Lead review of the pushed head as dormant host source. Not ready to link Git, deploy, change DNS, or turn a registry entry on.
