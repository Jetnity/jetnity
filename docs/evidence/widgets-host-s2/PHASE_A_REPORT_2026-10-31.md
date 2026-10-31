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

Phase B was not run. No provider or CMP host was contacted. `route.continue` was not called. Both production registry entries stay `selected: false`.

## Source seam

`decide(request)` still calls `buildShell(provider)` with the production registry only. That registry returns null, the public shell embeds `"plan":null`, and its `frame-src` stays `'none'`.

The internal `buildShell(provider, { plan })` seam can carry a plan produced by `clientPlan`. The audit identifier `discovercars-initial-load-audit-v1` is accepted by the serializer only when provider, artifact digest `5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa`, parent `https://jetnity.com`, child `https://jetnity-widgets.vercel.app`, and protocol revision `1` all match the source-owned binding. Those fields are copied into the client plan and the bootstrap config.

For that plan only, the real header builder emits one extra CSP token: `frame-src https://widget.discovercars.com/de/locations/`. The token is the constant in `apps/widgets-host/lib/audit-network-policy.mjs`. A plan field cannot replace it. `connect-src`, `img-src`, `font-src`, and `form-action` stay `'none'`. `script-src` gains only the frozen loader origin `https://www.discovercars.com`, which the existing selected-plan walker already derives from the script element. A wrong policy id, hash, provider, or missing policy keeps `frame-src 'none'`.

CSP path sources that end in `/` are prefix matches in the browser. That header is not the audit allow decision. The interceptor compares the nested document to `scripts/widgets-host-s2/nested-static-url-derivation.json`: exact origin, path `/de/locations/`, GET, resource type `document`, and the same 31 decoded pairs in that order. Equivalent `+` / `%20` encoding matches. Extra, missing, duplicate, or reordered pairs do not.

The one-time grant and parent teardown behaviour is unchanged. A matching audit grant inserts once. A replay is denied. `createParentFixture(...).destroy()` still removes the iframe.

## Local preflight

`node scripts/widgets-host-s2/audit-preflight.mjs` prints `audit-preflight PASS`. The machine-readable result is `docs/evidence/widgets-host-s2/phase-a-preflight-summary.json`.

| Check | Result |
| --- | --- |
| Redirect | A 302 fixture returns `BLOCKED_REDIRECT`, `follow: null`, `retry: false`. The browser did not request the redirect target. `redirectedFrom()` stayed empty. |
| Retry | The gate schedules no second attempt. `retryScheduled` is 0. The frozen loader was observed once. |
| Budget | Attempts 1–99 are judged. Attempt 100 closes with `BUDGET_REACHED` and is blocked. Attempt 101 is a late blocked attempt. The summary keeps `observed: 101` and `trimmed: false`. |
| Deadline | `startedAt + 14999` can still match. `startedAt + 15000` is `DEADLINE`. A `loadEvent` flag does not move `startedAt`. Later attempts stay late. |
| Redaction | Query values, unknown hosts, cookie names, storage values, and event payloads are absent from the exported objects. Query key names and the fixed event names `gtm.js`, `metaData`, and `consent_changed` remain. Anything else is `other` plus a count. |
| Source drift | Mismatched bytes return `SOURCE_DRIFT`, `executed: false`, and the published reference digest only. The candidate digest and body are not exported. Phase A does not deliver the three published captures. |
| Transport HTTP, beacon, EventSource | Playwright `context.route('**/*')` is installed before navigation. Matches are aborted or fulfilled locally. `continueCount` is 0. The loopback leak server received 0 requests. |
| Transport WebSocket | Playwright `routeWebSocket` closes the socket and does not call `connectToServer`. The loopback TCP listener accepted 0 connections. |
| Transport WebRTC | No pre-send interceptor exists in this harness. Disposition `BLOCKED_TRANSPORT`. This does not release Phase B. |
| Shell | The child response used the headers and HTML from `buildShell` for the audit plan. Served CSP contains the one frame target and closed connect/img/font/form directives. The real bootstrap reached the inserted-script status. That status is not a working provider form. |
| Storage | Parent and host counts were 0. The vendor frame was absent because the loader was aborted, so vendor storage is a gap, not a zero-cookie proof. Service workers stayed blocked. |

The browser gate observed 9 attempts: 3 local fulfills, 1 withheld loader, 2 method blocks, 1 `BLOCKED_REDIRECT`, 1 unmatched host, and 1 non-HTTPS EventSource refused as `route`. It did not hit the deadline or the attempt cap.

## Commands on this delivery

- `npm test` in `apps/widgets-host`: 16 pass / 0 fail
- `npm run typecheck`: pass
- `npm run build`: Next.js 16.4.1 success
- `node scripts/widgets-host-s2/source-guard.mjs`: PASS
- `node scripts/widgets-host-s2/audit-preflight.mjs`: PASS
- targeted eslint on the touched Phase A files: 0 errors

Native CI and the `jetnity-app` Preview are recorded in the delivery comment after push. Neither deploys `jetnity-widgets`. A new head invalidates older gates.

## Limits

No registry activation, deployment, DNS, environment, database, or dependency change. The Viator resize test was not edited. `docs/ACTIVE_WORK_STATUS.md` was left unchanged because this amendment's path list does not include it. Phase B stays closed until a later Root comment names the exact audited head.
