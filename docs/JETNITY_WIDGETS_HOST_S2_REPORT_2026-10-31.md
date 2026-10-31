# Jetnity Widgets Host S2 — REPORT

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

Closed responses keep the S1 body and headers, including `X-Frame-Options: DENY` and `frame-ancestors 'none'`. The shell omits `X-Frame-Options`, sets `frame-ancestors https://jetnity.com`, and nonces its own style and module. `productionPlansForClient()` returns `{}`, and the HTML contains `"plans":{}` and no `discovercars.com`, `12go.asia`, or `trainbusferry` URL.

The same `createController` is used by the production bootstrap and by tests. Tests pass a canary selector. Production passes the frozen registry, whose `selected` flags are false, so an otherwise valid grant does not insert.

## Verification run in this session

From `apps/widgets-host`, Node v22.23.4:

- `npm test` — 9 tests, 9 pass
- `npm run typecheck` — exit 0 after `lib/decide.d.mts`
- `npm run build` — Next.js 16.4.1 Turbopack, success
- `node scripts/widgets-host-s2/synthetic-http.mjs` — 16/16 on `127.0.0.1:41733`, scrubbed env
- `node scripts/widgets-host-s2/source-guard.mjs` — PASS
- `node scripts/widgets-host-s2/browser-harness.mjs` — PASS

The harness launched Chromium with host rules for `jetnity.test` and `widgets.test`. Before any navigation it aborted every request whose host was not local or those two names. Results:

- one canary script request to `https://canary.test/once.js`, aborted; a replayed grant did not add a second request
- parent `iframe.remove()` ran on a real iframe after the child signalled a deferred insert; no canary request followed; iframe count was 0
- two pages on the child harness origin shared `localStorage`; that write is harness-only
- the child page could not set `Domain=jetnity.test` or `Domain=jetnity.com` cookies visible to the parent origin
- shell text at 320, 390, 768, and 1440 did not overflow and exposed no link, button, input, or iframe; a second context with CSP bypass applied a 32px root font and also did not overflow

Root, with `apps/widgets-host/.next` still present:

- `npm run lint` — exit 0, 0 errors, 178 warnings (same warning count previously recorded on main; none were introduced in the S2 paths after the unused-variable cleanup)
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:operating-mode`, `check:schema-bezug` — exit 0

`check:schema-bezug` was run again after the host, harness, and these documents were staged. Exit 0. The new files do not call `.from('...')` or `.rpc('...')`.

Not run here: root `npm run build`, `auth:pruefen`, and the GitHub Actions run for the new head. A `jetnity-app` Preview is not a `jetnity-widgets` deployment. No personal browser (#748). The harness origins are `http://jetnity.test` and `http://widgets.test`, not the pinned HTTPS origins. Exact origin equality for `https://jetnity.com` and `https://jetnity-widgets.vercel.app` is covered by the Node controller tests. The browser test proves the same functions across two real sites with a real iframe.

## S1 gate

`scripts/widgets-origin-foundation-1/source-scan.mjs` is unchanged. It is not invoked by the S2 test script. Running it against this host would fail because S2 intentionally contains the frozen exports and a shell. `scripts/widgets-host-s2/source-guard.mjs` is the S2 guard.

## Risks

| Id | Item |
| --- | --- |
| P1 | Production selections, DNS, TLS, redirects, and live `Set-Cookie` attributes are unverified. Do not activate the child host on this delivery. |
| P1 | One child origin means provider scripts can share that origin's storage once a policy is selected. No provider secret is stored by this host. |
| P2 | `frame-src 'none'` remains until Root reviews a frame allowlist. Selecting a script origin later does not by itself allow a nested vendor frame. |
| P2 | S1 static scan is historical and will not pass on this tree. That is the intended transition. |
| P3 | The 200% font pass used Playwright `bypassCSP` so the test could set the root font. Default-font passes used the served markup, whose CSP allows only the nonced style. |

## Ownership

Changed only `apps/widgets-host/**`, `scripts/widgets-host-s2/**`, and `docs/JETNITY_WIDGETS_HOST_S2_*` plus `docs/evidence/widgets-host-s2/`. No root package, workflow, provider tree, CMP, Auth, or SQL edit. `ACTIVE_WORK_STATUS.md` was not edited. The continuity delta is this report, the protocol, and the handoff.
