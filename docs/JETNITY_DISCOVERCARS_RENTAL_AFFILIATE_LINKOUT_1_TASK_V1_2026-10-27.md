# Jetnity DiscoverCars Rental Affiliate Linkout V1 — IMMUTABLE TASK V1

**27 October 2026, Europe/Zurich.** Parent/tracking [#1058](https://github.com/Jetnity/jetnity/issues/1058). Official user-supplied Work handoff 27 Oct 20:15–20:21, accepted as **provider-research evidence only**; it did not alter Jetnity, confirm commission or authorize live API.

**Seed baseline for preparation:** actual GitHub `main 0cb3e372188553b0e374199a5dd779cc79426981` (Merge #1051, docs-only), operating mode NORMAL. Native actual-main CI #40570228891 was still IN_PROGRESS when #1058 intake started; Vercel Production/jetnity.com alias bound to the exact main. **Before author dispatch** Root must re-read main, operating mode, #751, #1058, all open PR/branch Heads and *completed* native main CI/Production; do NOT label pending CI PASS or dispatch if main is unaccepted/unsafe. Branch `feat/provider-discovercars-rental-affiliate-linkout-1`. This file must be the only initial changed file.

**Logical agent:** `Jetnity DiscoverCars Rental Affiliate Linkout 1 — Cursor Generation 1`. ONE fresh genuine Cursor Cloud session, actual `cursor-cloud run-info.originalModelName=grok-4.7-high-fast`, no Auto/fallback. Post PLAN with original run-info/name/session ID before implementation; rename if supported. Root alone later owns Ready/Merge.

## Purpose
Build a **bounded, code-only, not yet live** opt-in DiscoverCars affiliate linkout in **Reise → Organisieren → Mobilität → Mietwagen** (the existing `components/trips/MietwagenBereich.tsx`, which already contains truthful rental-car Bestand, unavailable search and manual form). No new tab, no duplicate planner/booking or third-party provider search.

### Exact known affiliate facts — do not extrapolate
- Generic official affiliate landing URL: `https://www.discovercars.com/?a_aid=jetnity`. Public affiliate id `jetnity` only.
- Explicit official BKK airport generator example: `https://www.discovercars.com/de/thailand/bangkok/suvarnabhumi-airport-bkk?a_aid=jetnity&currency=chf`; observed redirect to `/de/thailand/bangkok/bkk` with `a_aid` and CHF preserved. **Bangkok CITY is NOT BKK airport**. Such deep link only if canonical user-selected BKK airport ID/identity exactly matches vetted source and selection is explicit; otherwise generic only. No raw place names as slugs.
- Official partner pages: https://www.discovercars.com/de/affiliate, https://www.discovercars.com/affiliate-conditions, https://www.discovercars.com/affiliate/widget. Work observed real CHF listings in an official generator preview, but that preview redirected with `UNKNOWN_PORTAL` tracking, so **NO verified affiliate attribution, no commission guarantee**. Individual link displayed `a_aid=jetnity`; URL alone does not prove earnings.
- The official conditions allow approved links only after affiliate application acceptance and prohibit PPC/Display/social paid traffic as commissionable channels. Account accessible ≠ documentary/contract/attribution acceptance. No new outreach, terms acceptance, paid marketing, bookings or settlement.
- Widget code/preview token is not in this task and must not be synthesized, embedded or silently used. No live API license/secret is proven; code-only linkout V1.

## Scope
1. One pure provider-scoped `lib/providers/discovercars/affiliate/*` URL/decision layer. Use exact trusted fixed HTTPS host `www.discovercars.com` and narrowly vetted pathname/query allowlist, `a_aid=jetnity` once. Build from reviewed constants, not user-provided URL/slug/iframe. Generic fallback if any place, station identity, geographic type, route, currency or dynamic date mapping is unknown.
2. One narrow existing rental UI integration inside `components/trips/MietwagenBereich.tsx`; optional new `components/trips/DiscoverCarsAffiliateLinks.tsx`. Clearly label external affiliate link: rentals, availability, prices, payment and booking are handled by DiscoverCars, not Jetnity. CTA only on real visitor click `<a target="_blank" rel="noopener noreferrer sponsored">`. No auto request, pixel, cookie, script, third-party image or iframe before click.
3. Multi-stop visits: do not infer rental pickup, dropoff or full trip window. If showing explicit station/leg context, label it as a **user choice** without pretending those details are passed through the generic link. No BKK default for Bangkok. No station deep-link from `stages[0]`, title, country-only or nearest airport. No assumed one-way or cross-country availability.
4. Absolutely NO age/residence/traveller/headcount, personal trip IDs, travel documents, precise travel dates/times, booking/provider refs, location history or customer identity in outbound URL, logs or telemetry. Only BKK verified public fixed `currency=chf` URL; do not infer generic currency support, no arbitrary `currency`, `utm`, `sub_id`, date or query forwarding.
5. Existing manual rental form, first-party rental truth, search hard-OFF `lib/rental-cars/factory.ts`, `RentalCarProvider.suchen` and proof `lib/rental-cars/nachweis.ts` unchanged. No prices, images or option selections from Work's momentary results. No signed booking or Commercial Provenance from link click.

## Exclusive editing
**May edit:** `components/trips/MietwagenBereich.tsx` narrowly, optionally new `components/trips/DiscoverCarsAffiliateLinks.tsx`, new `lib/providers/discovercars/affiliate/*`, new `scripts/discovercars-affiliate-linkout-1/*` local UI/test evidence, task-only `docs/JETNITY_DISCOVERCARS_RENTAL_AFFILIATE_LINKOUT_1_{PLAN,STATUS,HANDOFF,SELF_REVIEW,REPORT}_2026-10-27.md`.
**READ-ONLY:** `components/trips/MobilitaetBereich.tsx` (12Go #1057 owns), `lib/rental-cars/{factory,provider,nachweis}.ts`, all #1052 S1 lodging, #1053 S2 travellers, #1054 S3 guest navigation files, #1057 mobility/12Go; `docs/ACTIVE_WORK_STATUS.md` and Root shared docs. Before writes, agent independently verifies actual main/branch ownership. STOP on collision.
**FORBIDDEN:** migrations/hosted Supabase/Auth/RLS/permissions, new external provider API, price/availability calls/scraping, widget injection, provider activation, secrets, payments, contracts, ads, legal/tax/bank public data, launch/indexing, recurring costs. Preserve #917 hosted-readback STOP, #985/#982 holds, personal CUA #748 SUSPENDED, USD100/month cap, prelaunch/noindex.

## Tests and evidence
- Exact generic link and BKK audited-only controlled link; unknown/city-only/country-only/multi-stop/repeated place/guest-account reload/explicit BKK/changed choice/stale route. Never infer default or fake availability.
- URL security: https, fixed host, immutable query keys (no duplicate aid), absolutely no injected hostname/path/query/open redirect, no PII, no unseen tracking parameter.
- Rendered markup: sponsored rel, new-tab protection, opt-in outbound, truthful contextual copy, preserves Bestand/unavailable search/manual form. No third-party resource request before visitor click.
- Browser matrix 320/390/768/1440 and 200% text, min 44px tap target, keyboard access, no overflow; isolate all test URLs/data.
- Full focused Node+UI tests and repository typecheck/lint/build, exact-HEAD native CI/Auth and Vercel Preview. Self-review never Root PASS.
- **Independent later Work browser QA** on exact-head Preview, real outbound generic and if eligible BKK link, tracking param/redirect, mobile & keyboard; no purchase. Attribution/commission remain UNKNOWN unless independently proven. Provider/terms/site approval must be verified before Production exposure. A code-valid PR remains Draft/blocked until those gates pass.
- Before delivery: PLAN, STATUS, HANDOFF, SELF_REVIEW, REPORT, Exact Head/tree/merge-base/ahead/behind, tests, relevant screenshots/evidence; STOP for independent TL review.

**No Ready, no merge, no auto follow-up slice.** On CHANGES REQUIRED, original Cursor SAME session fixes, NEW HEAD invalidates previous gates. Root alone may complete any later SHA-locked integration after strict checks and provider gate.
