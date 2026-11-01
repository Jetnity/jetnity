# Jetnity Widgets Host S2 — PLAN

**Stand:** 1 November 2026. **Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.

## Current — R6

No new host or audit plan. R6 only merges main `a3fda92a1a2653f8dd59383334ba0d148000ba8f` into Draft #1097. The dedicated host already deployed from `f056b01d63ac7d61650864734a9b44eb6484989e` is `dpl_AtVsfaox5dbxx6i1DFqVM7RJ5Tm4` at `https://jetnity-widgets.vercel.app`, project `prj_Qq4i6dNt3hlSbQDpr2LrRaSKOQsk`, subtree `5f79b8161851fc562205cc1d5d8ae5fab80b67d4`.

12Go remains the selected source row. DiscoverCars remains unselected. `capturePass` is false, `providerTransmission` is false, and WebRTC stays `BLOCKED_TRANSPORT`. Phase B stays closed. Integrations inventory 403 is **NOT VERIFIED**, not empty. Unfinished 12Go parent, CMP, form, search, referral, storage, and withdrawal work stays in #1086. #1091 is not the router.

## Original plan header

**Stand:** 31 October 2026. **Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
**Model:** `grok-4.7-high-fast`
**Task:** `docs/JETNITY_WIDGETS_HOST_S2_TASK_V1_2026-10-31.md` blob `e4ae6b5d6291792d1fe798029849d66119fcf3f5`
**Pre-code:** https://github.com/Jetnity/jetnity/pull/1097#issuecomment-6547425505
**Implement authorization:** Root, same session, Draft #1097.

## Current — 12Go source selection

The 12Go general row is selected. DiscoverCars stays unselected. The sentences below that say both registry entries stay `selected: false`, and that production plans are `{}`, describe the original S2 shape. They are not the current 12Go registry. Deployment, parent integration, and CMP acceptance remain open. The DiscoverCars audit remains blocked.

## Shape that was implemented

- Child origin `https://jetnity-widgets.vercel.app`. Parent origin `https://jetnity.com`. `widgets.jetnity.com` is not the child host.
- GET/HEAD of `/embed/discovercars` and `/embed/twelvego` return a first-party shell only for that child authority. Every other method, path, query, and host stays on the S1 closed 404, including `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
- The shell omits `X-Frame-Options` and sets `frame-ancestors https://jetnity.com`. Its bootstrap is a nonced module. Production plans embedded in that page are `{}`.
- Protocol revision 1 binds parent origin, child origin, `contentWindow`, and a one-use challenge. Production registry entries stay `selected: false`.
- Frozen DiscoverCars (835 bytes) and 12Go general (472 bytes) exports are copied byte-for-byte. The insertion adapter recreates elements and resolves only a protocol-relative `src` to HTTPS at insert time.
- Tests inject a canary into the same controller. The harness aborts non-local requests before navigation and removes a real iframe on teardown.

S1 `scripts/widgets-origin-foundation-1/**` stays historical and is not the S2 gate.
