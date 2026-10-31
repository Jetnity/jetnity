# Widgets Host S2 — Phase A preflight

**Stand:** 31 October 2026. **Stop for independent review.**
**Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
**Model:** `grok-4.7-high-fast`
**Branch:** `feat/widgets-host-s2`
**Draft PR:** https://github.com/Jetnity/jetnity/pull/1097
**Amendment blob:** `f1dfddd424f88d071a3a76125a39d71e7e2b3b93` unchanged.
**Original S2 task blob:** `e4ae6b5d6291792d1fe798029849d66119fcf3f5` unchanged.
**Phase A seed:** `4b2080568fc5ae10f7902222aec7fe62381e640e`

Phase B was not run. No provider or CMP host was contacted. WebRTC remains `BLOCKED_TRANSPORT`. `providerTransmission` stays false.

## Current — R5 lifecycle correction

DiscoverCars stays unselected. The already accepted 12Go source selection stays selected. The deployed `apps/widgets-host` subtree was not edited. The old sentence that both registry rows are unselected is historical.

The runner now owns one monotonic deadline. Reaching it closes permission, aborts outstanding header and body reads, and runs cleanup once, without waiting for another request. A body that finishes after closure is recorded as aborted, not as a successful response. Pre-start, non-GET, blocked, and late attempts are all in the ledger. Attempt 101 stays in the count. Before-start and before-teardown storage samples are kept separately, with cookie flags and deltas, and without cookie names or values. A role that was not sampled is `not-observed`, not a manufactured zero. Evidence is read after cleanup.

The browser preflight was not run. The loopback redirect fixture still shows one source hit and zero target hits. `node --test scripts/widgets-host-s2/audit-lifecycle.test.mjs` is the lifecycle proof.

## R5.1

The default runner uses `performance.now()` and `setTimeout` for the 15-second deadline. A manual clock is used only when a test passes one. An unreadable final storage sample does not become a zero count or a deletion delta. A missing final sample stays missing. Injected parent, host, vendor, and event readers run at before-start and before-teardown. Cleanup that returns a promise stays pending until `finalize()`. A header response that arrives after abort has its body cancelled. Synchronous fetch and body throws are recorded as errors. Every ledger row has `offsetMs` relative to the audit start.

## R5.2

`finalize()` waits on the underlying header, body, and `body.cancel` promises, the baseline and final reader promises, and cleanup. A `Promise.race` abort result does not mark that work settled. A bounded timeout keeps `finalized: false` and `incomplete: true`, including when cleanup itself times out. The published snapshot is a clone. A reader that resolves later cannot append samples or change that object.

`start()` arms the 15-second deadline immediately. Baseline collection does not move or extend it. A loopback GET waits until the baseline is ready or explicitly unavailable, and an unavailable baseline is not a capture pass. Final observations are requested before cleanup, while the readers still exist. Permission still closes and aborts immediately.

`createPassiveReaders` is the prepared parent/host/vendor capture. It calls `cookies()` and `frame.evaluate(passiveStorageProbe)` on the supplied surfaces, keeps only measured cookie flags and allowlisted event names, and records a missing vendor frame as `vendor-frame-absent`. The default preflight command does not call it and does not launch a browser. `audit-lifecycle.test.mjs` proves it with fake frame and context APIs. `capturePass` stays false.

A readable `cookies: []` is a measured zero. A readable `cookies: [{}]` leaves `secure`, `httpOnly`, and `sameSite` unknown. Missing `storageEntries` is a storage gap. Known zeros stay zero. The browser transport rows below are the historical 31 October preflight; this correction did not run them again.

## Source seam

`decide(request)` still calls `buildShell(provider)` with the production registry only. That registry returns null, the public shell embeds `"plan":null`, and its `frame-src` stays `'none'`.

The internal `buildShell(provider, { plan })` seam can carry a plan produced by `clientPlan`. The audit identifier `discovercars-initial-load-audit-v1` is accepted by the serializer only when provider, artifact digest `5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa`, parent `https://jetnity.com`, child `https://jetnity-widgets.vercel.app`, and protocol revision `1` all match the source-owned binding. Those fields are copied into the client plan and the bootstrap config.

For that plan only, the real header builder emits one extra CSP token: `frame-src https://widget.discovercars.com/de/locations/`. The token is the constant in `apps/widgets-host/lib/audit-network-policy.mjs`. A plan field cannot replace it. `connect-src`, `img-src`, `font-src`, and `form-action` stay `'none'`. `script-src` gains only the frozen loader origin `https://www.discovercars.com`, which the existing selected-plan walker already derives from the script element. A wrong policy id, hash, provider, or missing policy keeps `frame-src 'none'`.

CSP path sources that end in `/` are prefix matches in the browser. That header is not the audit allow decision. The interceptor compares the nested document to `scripts/widgets-host-s2/nested-static-url-derivation.json`: exact origin, path `/de/locations/`, GET, resource type `document`, and the same 31 decoded pairs in that order. Equivalent `+` / `%20` encoding matches. Extra, missing, duplicate, or reordered pairs do not.

The one-time grant and parent teardown behaviour is unchanged. A matching audit grant inserts once. A replay is denied. `createParentFixture(...).destroy()` still removes the iframe.

## R4 correction

The accepted shell binding is unchanged. Public `decide()` still reads the unselected registry. The corrections are in the audit runner and its fixtures.

Unknown query names are no longer copied into the ledger. Internal pair comparison still uses the decoded names and values. The exported row keeps only names that already appear on the fixed allowlist, plus `unknownQueryKeys` as a count. A URL with `visitor_abc123` and `token` exports `queryKeys: ["currency"]` and `unknownQueryKeys: 2`. The unknown names, the values, and the host are absent from the evidence object.

`createAuditRunner` is the bounded GET path. It stays closed until `start(now)` is called, and that call is the start of the 15-second deadline. `boundedGet` checks the deadline and the attempt count before any `fetch`. Attempt 100 and every later attempt are blocked, and the summary keeps the real count (`observed: 101`, `trimmed: false`). There is no accepted Root run authorization in this build, so a provider URL returns `provider-closed` and the fetch implementation is not called (`providerFetches: 0`).

The redirect fixture is a real loopback response. The source server sends HTTP 302 to a second loopback server. The adapter uses `redirect: 'manual'`, records `BLOCKED_REDIRECT`, does not issue another request, and does not return the 3xx to the browser. The source was hit once. The target was hit zero times. `handedToBrowser` and `follow` stay false/null.

An open loopback GET is aborted when the runner is tripped for unexpected navigation. A later `boundedGet` does not transmit. The browser parent buffers `ready` and grants only from the explicit `start()` call, which happens immediately after `runner.start(Date.now())`. Before that call the loader is not requested. After it, the loader is observed once as `provider-closed` and aborted. `route.continue` is not used.

Natural event names go through the same runner allowlist (`gtm.js`, `metaData`, `consent_changed`; anything else is `other` plus a count). Parent and host storage are aggregate counts and cookie flags. The vendor frame was absent, recorded as a gap.

## Local preflight

`node scripts/widgets-host-s2/audit-preflight.mjs` prints `audit-preflight PASS`. The machine-readable result is `docs/evidence/widgets-host-s2/phase-a-preflight-summary.json`.

The redirect, budget, and deadline rows are from the current local adapter command. The transport and shell rows are historical browser checks from 31 October 2026 and were not run again for R5.2.

| Check | Result |
| --- | --- |
| Redirect | Local source returned a real 302. Adapter result `BLOCKED_REDIRECT`, status 302, `sourceHits: 1`, `targetHits: 0`, no retry, `handedToBrowser: false`. |
| Retry | No second request was scheduled. `retryScheduled` is 0. |
| Budget | Attempts 1–99 stay closed. Attempt 100 is `BUDGET_REACHED` and is not fetched. Attempt 101 is late. `observed` stays 101. |
| Deadline | `start(now)` fixes the clock. `now >= startedAt + 15000` returns `DEADLINE` before fetch. A load event does not move the clock. |
| Redaction | Unknown query names are counted, not exported. Values, hosts, cookie names, storage values, and event payloads stay out of the evidence. |
| Source drift | Mismatched bytes return `SOURCE_DRIFT`, `executed: false`, and the published reference digest only. |
| Transport HTTP, beacon, EventSource | Playwright `context.route('**/*')` is installed before navigation. `continueCount` is 0. The loopback leak server received 0 requests. |
| Transport WebSocket | `routeWebSocket` closes the socket and does not call `connectToServer`. The loopback TCP listener accepted 0 connections. |
| Transport WebRTC | The existing Playwright harness has no pre-send block for `RTCPeerConnection`. Disposition remains `method: null`, `proven: false`, `BLOCKED_TRANSPORT`. No infrastructure was added. This still blocks Phase B. |
| Shell | Served CSP is the real `buildShell` header. The bootstrap reaches the inserted-script status only after the explicit intent. That status is not a working provider form. |

The post-start browser ledger contains one `provider-closed` attempt. The budget, deadline, redirect, and teardown results are the adapter assertions in the same command.

## Commands on this delivery

R4 did not change the host product files. The earlier nested `npm test` (16/16), `tsc --noEmit`, and Next.js 16.4.1 build still describe that unchanged code. On this correction:

- `node scripts/widgets-host-s2/audit-preflight.mjs`: PASS
- `node scripts/widgets-host-s2/source-guard.mjs`: PASS
- targeted eslint on `audit-policy.mjs` and `audit-preflight.mjs`: 0 errors

Native CI and the `jetnity-app` Preview are recorded in the delivery comment after push. Neither deploys `jetnity-widgets`. A new head invalidates older gates.

## Limits and remaining blockers

WebRTC is still `BLOCKED_TRANSPORT`. This preflight does not authorize a live audit. Provider transmission is false, and Phase B was not run. No registry activation, deployment, DNS, environment, database, or dependency change. The Viator resize test was not edited. The immutable task and amendment blobs were not edited. Phase B stays closed until a later Root comment names the exact audited head.
