# Activities Destination First 1 — Handoff

2026-11-01, Europe/Zurich. Draft PR #1100. Branch `codex/activities-destination-first-20261101`.

Session: https://cursor.com/agents/bc-b961dce1-751e-403e-ade6-52d2c56a648b  
Logical writer: **Jetnity Activities Destination First 1 — Cursor Generation 1**.  
`originalModelName=grok-4.7-high-fast`. Not Auto.

STOP for independent Technical Lead review. This handoff is not Ready and not a merge.

## What the branch does

Opening Organisieren → Aktivitäten uses the trip’s confirmed stages. An unassigned first or last day does not block discovery and is not labelled as the selected destination. Repeated visits stay separate stage ids. The visible destination loads the official GetYourGuide manual widget and the official dynamic Viator widget. The native `POST /api/activities/search` runs only after “Für diesen Tag suchen”. Adoption still requires a day that belongs to that stage.

The Viator embed is `/embed/viator` with sandbox `allow-scripts allow-popups allow-popups-to-escape-sandbox`, `credentialless`, and `no-referrer`. It does not include `allow-same-origin`.

## Opaque resize bridge

Exact official `widget-main.js` (sha256 `defb4b73526a793acca4bea3863a0d2da3c54fedafadb57c5de24b214429bca7`) handles `vi-wm` only when `event.origin` equals the script origin `https://www.viator.com`. The nested frame inside the opaque embed posts with origin `null`, so the official handler leaves the partner div at `display:none` and the inner iframe at height 0.

The owned script in the embed document accepts `vi-wm` only when all of these hold: numeric height from 1 to 12000, `wd` payload naming `viw-` plus the generated frame id, `event.source` is that frame’s window, the frame URL is `https://www.viator.com` and its path is `/widget/partner/P00328015/W-a3c98184-2fae-4bf6-919e-1c32bc42d788` or the `/de-DE/` form, and the parent element is the matching partner div. It then sets that wrapper’s display and height and posts only `{quelle, art, px}` to the Jetnity parent. A forged message and a message after the frame is removed do not change the height. Offline proof: `lib/activities/viator-widget/bruecke.browser.test.ts`, using the saved official loader and a synthetic `h=480` message. Real provider renders in that proof: 0.

## Bounded live Viator widget result

Four real widget document loads were made. Offer clicks: 0. HTTP 403: 0. No bypass and no fifth load after the presentation fix.

| Attempt | Public destination | Widget document | Outer pixels | Clicks |
| --- | --- | --- | --- | --- |
| 1 | Bangkok | 200, path `/de-DE/widget/partner/P00328015/W-a3c98184-2fae-4bf6-919e-1c32bc42d788` | white; wrapper still hidden | 0 |
| 2 | Lissabon | same host pattern, deduped with attempt 1 | white | 0 |
| 3 | Bangkok, frame text read | 200, `dynamicProps` began `{"searchTerm":"Bangkok"` | white | 0 |
| 4 | Bangkok, after a min-height style | 200 | white | 0 |

Distinct recorded responses across those loads, not a full network dump:

- `www.viator.com` 200 `/orion/partner/widget.js`
- `www.viator.com` 200 `/orion/partner/widget-main.js`
- `www.viator.com` 301 `/widget/partner/P00328015/W-a3c98184-2fae-4bf6-919e-1c32bc42d788`
- `www.viator.com` 200 `/de-DE/widget/partner/P00328015/W-a3c98184-2fae-4bf6-919e-1c32bc42d788`
- `dd.viator.com` 200 `/tags.js`
- `dd.viator.com` 200 `/js/`

Attempt 3’s provider frame text included German CHF lines for a Bangkok airport transfer (from 11,36 CHF) and, on attempt 4, also “Floating Market und Train Market Experience” (from 19,90 CHF). That text is inside the provider frame. It is not proof that the Jetnity-owned wrapper painted those cards. The wrapper stayed hidden until the offline bridge. A loaded script is not an offer list, and a visible affiliate id is not commission attribution.

`www.viator.com/intake/v2/rum/events` was blocked by CORS from origin `null`. That is not an HTTP 403 of the widget document.

Official loader bytes used for the offline proof, not a new render: `widget.js` sha256 `aeda2e30daff0bd54400a437a643673821f59eea2569646264c21a6092723a45`.

## Privacy boundary

GetYourGuide and Viator are not providers in the shared widget-consent list (`discovercars`, `twelvego` only). This slice does not edit that list or the held CMP. Each official frame has its own disclosure, privacy link, and Ausblenden. Ausblenden stays until “Erneut anzeigen”. Opening Activities is not visitor consent. The public privacy page still describes GetYourGuide as an explicit click; that sentence was not edited here.

## Not claimed

Native Viator Production remains off. Both official widgets are wired for a confirmed destination. The live outer screenshots did not show painted Viator cards. The bridge makes the official `vi-wm` height apply without widening the sandbox, and that behaviour was proven offline.

## Next step

Independent exact-head Technical Lead review. Cursor does not Ready, merge, deploy, or start a follow-up.
