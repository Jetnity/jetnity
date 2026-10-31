# Jetnity Widgets Host S2 — PROTOCOL

**Revision:** 1. **Type:** `jetnity-widget-host`.
**Parent origin:** `https://jetnity.com`
**Child origin:** `https://jetnity-widgets.vercel.app`
**Paths:** `/embed/discovercars`, `/embed/twelvego`

This binds a browser window, an origin, and a one-use challenge. It is not a consent certificate and it does not complete Trip Workspace, CMP, or provider mounting. Those remain #1096, #1084, and #1086.

## Messages

Allowed keys only. Extra fields, strings containing `<` or `//`, revisions other than 1, and JSON larger than 2048 characters are rejected.

| kind | Fields |
| --- | --- |
| `ready` | `type`, `revision`, `kind`, `provider`, `challenge` (64 lowercase hex), `frameGeneration` |
| `grant` | ready fields plus `parentGeneration`, `policyId` (`[a-z0-9-]{1,64}`), `artifactSha256` (64 lowercase hex) |
| `revoke` | `type`, `revision`, `kind`, `provider`, `frameGeneration` |

`postMessage` target origins are the exact parent or child origin. `*` is not used.

## Child

1. If `location.origin` is not the child origin, the path provider does not match, or `window.parent === window`, the child stays inactive and does not insert.
2. Otherwise it creates a fresh in-memory challenge and posts `ready` only to the parent origin.
3. It accepts `grant` only from `window.parent` with `event.origin === https://jetnity.com`, the unspent challenge, the same provider, and the same frame generation.
4. It then asks the production selector. Both registry entries are `selected: false`, so the grant is denied. A test may inject another selector. The challenge is consumed only after that selector and the artifact hash match, and before insertion.
5. `revoke`, disposal, or a generation change cancels a pending insert. A second grant cannot reuse the challenge. A new `ready` after insert is refused.

## Parent duties for the other writers

The local fixture in `lib/host-runtime.mjs` (`createParentFixture`) is the reference, not the Trip Workspace mount.

- Accept `ready` only from `https://jetnity-widgets.vercel.app` and only when `event.source === iframe.contentWindow`.
- Do not treat `ready` as permission. Re-check the current CMP decision, provider intent, and host policy immediately before `grant`.
- A decision id is used once. A later id must be greater than every id already used. A challenge that was already granted is rejected even if the decision id is new. A repeated `ready` with the same challenge is denied. A new challenge without a new greater id retires the whole iframe.
- Bind that grant to the echoed challenge, the decision id, the provider, revision 1, and the exact policy and artifact ids.
- On unmount, category loss, navigation, timeout, or a new frame, remove the iframe element. Do not wait for a child acknowledgement. A child `revoke` or ack is supplementary.
- A reloaded frame needs a new `ready` and a new decision. Do not reuse a challenge.
- `sandbox="allow-scripts allow-same-origin"` is permitted only when the iframe `src` is the pinned child origin. It is forbidden for `srcdoc` and for any private Jetnity route. Do not add forms, popups, or navigation unless a later reviewed requirement names them.

## Insertion

The adapter walks a parsed plan and uses `createElement`, `setAttribute`, `createTextNode`, and `appendChild`. It does not use `innerHTML`. Affiliate attributes stay in source order. A `src` that starts with `//` is requested as `https:` plus that value. The raw 12Go file still begins with `//cdn0.trainbusferry.com/`. No script URL is accepted from a message.

When one registry entry is later selected in source, `productionPlanForClient(provider)` embeds that route's plan only, and the shell CSP adds that script's exact `https` origin to `script-src`. `networkPolicy: 'unselected'` is not an executable allowlist. `frame-src` stays `'none'` until a reviewed frame allowlist exists. A host CSP does not describe what a nested vendor frame requests internally.

## Current — 12Go general selection

The paragraph above describes the earlier unselected shell. The 12Go row is now selected. For that exact binding only, the header builder emits the fixed script, style, image, font, connect, and form sources from `twelvego-network-policy.mjs`, plus `style-src-attr 'unsafe-inline'`. `frame-src` stays `'none'`. DiscoverCars stays unselected, and its audit frame rule is unchanged. A wrong or missing binding field yields no plan and no open provider rules. The child record does not set the parent sandbox.

## Storage limits

Host code does not read or write cookies, `localStorage`, `sessionStorage`, IndexedDB, the Cache API, or auth state. Both provider routes share one child origin. With `allow-same-origin`, vendor code on that origin can use its storage and same-origin sibling frames can see each other. Paths do not create a provider boundary. The harness recorded that shared-origin storage with a canary. It is not a Jetnity write.

Destroying the iframe stops new work in that document. It does not recall a completed request, delete vendor storage, or close a tab the provider opened.

`jetnity-widgets.vercel.app` and `jetnity.com` are different registrable sites, so this design avoids a `Domain=.jetnity.com` cookie on the child. This session did not read live TLS, redirects, or production `Set-Cookie` attributes. Root must do that before activation.
