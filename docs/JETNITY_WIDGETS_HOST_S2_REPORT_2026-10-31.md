# Jetnity Widgets Host S2 — REPORT

## Current — R6 main integration

R6 merges main `a3fda92a1a2653f8dd59383334ba0d148000ba8f` into Draft #1097 and does not change host or audit source. The deployed host is `dpl_AtVsfaox5dbxx6i1DFqVM7RJ5Tm4` / `https://jetnity-widgets.vercel.app`, project `prj_Qq4i6dNt3hlSbQDpr2LrRaSKOQsk`, frozen source `f056b01d63ac7d61650864734a9b44eb6484989e`, subtree `5f79b8161851fc562205cc1d5d8ae5fab80b67d4`.

Recorded source, HTTP, and native acceptances stay limited to those receipts. Integrations inventory 403 is **NOT VERIFIED** and is not an empty inventory. 12Go is selected. DiscoverCars is unselected. `capturePass: false`. `providerTransmission: false`. `BLOCKED_TRANSPORT`. Phase B is closed. Real 12Go parent, CMP, form, search, referral, storage, and withdrawal behavior remains unfinished in #1086. The router is #1097, not #1091. This report does not mark Ready or claim product completion.

## Earlier — 12Go source selection

The 12Go general source row is selected and bound to policy `twelvego-general-chf-20261031-r1`. DiscoverCars stays unselected. This is not a dedicated-host deployment, parent-sandbox acceptance, or CMP acceptance. The DiscoverCars audit remains CHANGES REQUIRED / `BLOCKED_TRANSPORT`. The export was not given `data-starget`, so a named popup target is not claimed. Affiliate parameters in the frozen export are not a commission proof.

The sections below describe earlier heads. Where they say both providers are unselected, that is historical for 12Go.

**Stand:** 31 October 2026.
**Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
**`originalModelName`:** `grok-4.7-high-fast`
**Draft PR:** https://github.com/Jetnity/jetnity/pull/1097
**Task blob:** `e4ae6b5d6291792d1fe798029849d66119fcf3f5`
**Seed:** `640efc7f7d784905e5a479f9c3e66c0aaceb7638`
**Seed tree:** `5af7e17d5c0c5dc0aa6543c72dfbbf1225b6b957`
**Base main at start:** `b7ebc399b92303eacda9afdaa1786f245492051f`
**Mode:** NORMAL

The pushed branch tip is the exact HEAD. This document is inside that tip, so the delivery comment records `git rev-parse HEAD` after the push.

## R1 corrections

Reviewed head `58f71f05b5966470822c88fe00dcb5e5bc2ce711` required four source fixes. Registry OFF was kept.

- The client plan field is `artifactSha256`, the same field `createController` compares. `buildShell` embeds only the requested provider. Production `decide()` passes no override, so the served plan is null. A test may pass `{ plan }` to `buildShell`; that argument is not read from the query, the host, or the environment.
- `createParentFixture` consumes one decision id for one challenge. A duplicate ready is denied. A new challenge without a new decision id removes the iframe. A pending intent times out by removing the iframe.
- `parseMessage({kind:'constructor'})` and the `toString` / `__proto__` cases return `{ ok:false }` and do not throw.
- The browser harness fulfills `https://jetnity.com` and `https://jetnity-widgets.vercel.app` with the real shell headers and bootstrap. A local canary script is fulfilled on the child origin. Requests to any other URL fail the ledger. Loopback `next start` stays closed even if `Host` is the child name.

## Artifacts

Fetched from GitHub commits, not from vendor hosts. Blob ids, sizes, and SHA-256 matched the task before copy:

| Provider | Commit | Blob | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| DiscoverCars | `729e9344f00316d0559ca8b800555a49909e58f3` | `1581be9a4377a7b53416971332b447b982345763` | 835 | `5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa` |
| 12Go general | `4b20d8f51b1b8301f76dd73432016bcd38030ead` | `cb3623b12f9e86df93ceabd27d915e1a0943597c` | 472 | `3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e` |

Those commits were the open #1084 and #1086 heads at the pre-code read. The Bangkok–Koh Chang export was not copied. Affiliate attributes were not rewritten. `data-aff-code=a_aid`, `data-utm-source=jetnity`, `data-utm-medium=widget`, and `data-sub_id=jetnity-mobility-search` are still in the bytes.

## Behaviour

`lib/decide.mjs` classifies the request. The shell is served only for GET/HEAD of the two embed paths, with an empty query, when the authority is `jetnity-widgets.vercel.app` or that host on port 443. The Fetch API hides `Host` on a constructed `Request`, so the classifier uses the URL host in that case and the `Host` header when a real request provides one. A mismatched URL hostname is closed.

Closed responses keep the S1 body and headers, including `X-Frame-Options: DENY` and `frame-ancestors 'none'`. The shell omits `X-Frame-Options`, sets `frame-ancestors https://jetnity.com`, and nonces its own style and module. `productionPlanForClient()` returns null while the registry is unselected, and that shell HTML contains `"plan":null` and no vendor URL.

The same `createController` and `startProductionShell` are used by the production bootstrap and by tests. A test may pass one plan into `buildShell`. Production `decide()` does not. The shell status says inactive, requested, denied, or that a script was inserted and that this is not proof of a working provider form.

`networkPolicy: 'unselected'` is metadata only. Setting `selected` to true would not create an executable network policy, a frame allowlist, form or popup sandbox rights, or a deployment acceptance. Those remain the Root-owned completion step. This correction does not add an allowlist.

## Verification on this correction

From `apps/widgets-host`, after the R2 edits:

- `npm test` — 15 tests, 15 pass
- `node scripts/widgets-host-s2/browser-harness.mjs` — PASS

The harness fulfills `https://jetnity.com` and `https://jetnity-widgets.vercel.app` and aborts every other URL before navigation. The real bootstrap inserted one local canary. After insertion the status text was `Ein Skript wurde eingefügt. Das belegt kein funktionierendes Anbieterformular.` Destroying the iframe stopped `after.js`. The inactive shell at 320, 390, 768, and 1440 did not overflow. A further 320px pass set `font-size: 200%` through the served nonce stylesheet, read computed `32px`, and did not overflow. No `bypassCSP` context was used. The unexpected-request ledger was empty.

`node scripts/widgets-host-s2/synthetic-http.mjs` on the previous built server was 14/14 closed. This R2 edit does not change `classify`. Native CI and Preview for the new head are recorded in the delivery comment after push, not here.

## Historical notes, not the current harness

These sentences were true for earlier heads and are not a description of `f6d029c2` or this correction:

- Head `58f71f05b5966470822c88fe00dcb5e5bc2ce711` and its delivery: 9 tests, then 13 tests after R1; HTTP 16 cases and later 14 closed loopback cases; `productionPlansForClient()` / `"plans":{}` was the earlier serializer name.
- The first harness, before R1, used `http://jetnity.test` and `http://widgets.test`, aborted `https://canary.test/once.js`, and used a `bypassCSP` context for a 32px font. That is not the current harness.

## S1 gate

`scripts/widgets-origin-foundation-1/source-scan.mjs` is unchanged. It is not invoked by the S2 test script. Running it against this host would fail because S2 intentionally contains the frozen exports and a shell. `scripts/widgets-host-s2/source-guard.mjs` is the S2 guard.

## Risks

| Id | Item |
| --- | --- |
| P1 | Production selections, DNS, TLS, redirects, and live `Set-Cookie` attributes are unverified. Do not activate the child host on this delivery. |
| P1 | One child origin means provider scripts can share that origin's storage once a policy is selected. No provider secret is stored by this host. |
| P2 | `frame-src 'none'` and the other default-deny directives are the current shell, not an open finding. `networkPolicy: 'unselected'` does not become an allowlist when `selected` flips. |
| P2 | S1 static scan is historical and will not pass on this tree. That is the intended transition. |

## Ownership

Changed only `apps/widgets-host/**`, `scripts/widgets-host-s2/**`, and `docs/JETNITY_WIDGETS_HOST_S2_*` plus `docs/evidence/widgets-host-s2/`. No root package, workflow, provider tree, CMP, Auth, or SQL edit. `ACTIVE_WORK_STATUS.md` was not edited. The continuity delta is this report, the protocol, and the handoff.
