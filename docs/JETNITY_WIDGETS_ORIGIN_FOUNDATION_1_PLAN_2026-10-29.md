# Jetnity Widgets Origin Isolation Foundation 1 — PLAN

**Stand:** 29 October 2026. **Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Tracking:** https://github.com/Jetnity/jetnity/issues/1090
**Draft PR:** https://github.com/Jetnity/jetnity/pull/1091
**Immutable task:** `docs/JETNITY_WIDGETS_ORIGIN_FOUNDATION_1_TASK_V1_2026-10-29.md` (not edited).
**Pre-code PR comment:** https://github.com/Jetnity/jetnity/pull/1091#issuecomment-6509334810

This file is the plan posted before application code. Results are in the report, not a rewrite of this plan.

## Identity verified before code

- Session: https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
- `bcId`: `bc-fd77a5a3-17dd-4479-9594-f6238f61583f`
- `originalModelName`: `grok-4.7-high-fast`
- Stored title after rename: Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1
- Previous stored title: `Widgets origin isolation foundation`
- Machine mode: `NORMAL`
- Branch: `feat/widgets-origin-isolation-foundation-1`
- Seed HEAD: `ee43857e390ead6863726ad7e06262c142f5a45b`
- `origin/main`: `e462cf7c5910ce75fa6350928326c04e33d94eee`
- merge-base: `e462cf7c5910ce75fa6350928326c04e33d94eee`
- Ahead/behind at pre-code: 1 ahead / 0 behind

## Related work left untouched

- #1084 DiscoverCars, draft, `9f493b765be1dd1e1b7acdcc964e57e88815ac48`
- #1086 12Go, draft, `daf082b3120b4112df3cefb927ccb1944eae066e`
- #1089 shared consent, draft, `5edff201f83b46787c829f749765163daf203b69`
- #1087 Product-Owner consent gate, open
- #968 hosted Preview/Production Supabase gate, open
- #748 Guardian inbox and personal-browser suspension, open

## Planned shape

1. New Next 16.4.1 / React 19.2.8 / React DOM 19.2.8 app at `apps/widgets-host/**` with its own pinned lock. No import from the root app, Supabase, Auth, or vendor widget files.
2. Fail closed on `/`, `/embed/discovercars`, `/embed/twelvego`, and every other path and method. `proxy.ts` has no path filter, so framework asset URLs are included. Route handlers repeat the same response.
3. Constant HTML. No script, iframe, form, button, redirect, CORS, or `Set-Cookie`. Security headers: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, restrictive Permissions-Policy, and CSP beginning `default-src 'none'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'; object-src 'none'`.
4. Separate-origin contract: different origin, same registrable site, parent-domain cookie risk, same-origin script sandbox prohibited, provider scripts separately gated.
5. Local `npm ci`, unit tests, production build, and synthetic HTTP. No personal browser. No Vercel or DNS mutation.

## Non-goals

No Ready, merge, deploy, Git link, DNS, secrets, provider call, payment, new cost, or follow-up slice.
