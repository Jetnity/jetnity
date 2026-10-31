# Viator S2 — native activities integration, development-only
Version 1. 28 October 2026, Europe/Zurich. Parent #1078 / #1023. Extends Draft #1079 after the owner's explicit instruction to continue integration according to Viator and DiscoverCars documentation rather than repeat the failed Vercel CLI login.

## Authority and baseline
S1 TASK V1 remains immutable historical scope. This separately versioned S2 task expands implementation scope only; it does NOT remove release, credential, live-call or Production gates. Latest main independently read: 8fc72a18390af1650d6902fb2a20a64e4f7f8ccc, mode NORMAL. Starting S1 head 4626ffa227b0668b2fc58c12801a50d1324118b9, source accepted in #1079 comment6470320180. New head invalidates old CI/Preview acceptance.
S2 code may be built and fixture-tested BEFORE the real Sandbox receipt. The old implementation sequencing must not turn an unavailable Vercel login into a blanket stop on useful development. Actual Sandbox/provider acceptance remains outstanding.
One writer on the existing branch/PR. Continue original Cursor session bc-803fd88c-9fdc-47f7-acfc-213976e487f6, logical name Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1, verified originalModelName grok-4.7-high-fast. This is a scoped continuation of the same provider integration, not a second writer. If delivery cannot reuse it, STOP before source edits; no replacement spawned silently.

## Pre-code plan
Read AGENTS, current mode, START_HERE, Technical Lead/Cursor standard, vision, architecture, design, quality, continuity, current activity contracts/tests and S1 implementation. Fetch current main; report any ownership conflict. Safely merge current main into this branch without force/rebase, preserve all unrelated work. Post a PLAN with exact session/model/name, HEAD/base and intended files. Maintain the design tokens and compact mobile workspace. #1082 owns TripWorkspace/route/navigation; #1059 owns rental/DiscoverCars. Do not edit their files.

## User-facing outcome
Within existing Organisieren > Aktivitäten, reuse confirmed selected day/stage context. Bangkok shows Bangkok activity results; moving to Ko Chang/Phuket or another country must cancel/discard stale responses and clear details/quotes, not silently use first stage or country as city. Repeated visits to the same city preserve visit/day identity; unresolved place/day prompts clarification instead of guessed provider IDs. Keep manual planning and GetYourGuide unchanged.

Implement the real integration seam, not only an illustrative standalone page:
1. Explicit search action through the existing activity flow and server-only provider adapter.
2. Responsive product cards with validated provider-supplied title, image, location, duration, rating when present, source label and honest CHF price basis (from/per-person/group only when proven). Unknown price stays unknown. Search content is not live availability.
3. On explicit product selection only: detail and schedule retrieval, accessible detail panel and calendar hints. No per-card eager detail/calendar fanout.
4. Explicit date, supported product option and participant age-band composition before current availability/price check. Do not convert total travellers to adults or infer DOB. Any change invalidates the prior quote. Handle unavailable/malformed/expired/429/timeout separately from empty results.
5. External action labelled e.g. Bei Viator ansehen; pass original validated API productUrl unchanged. Booking/payment are at Viator. No invented checkout parameters or booking confirmation; no booking/hold/payment/cancel API.
6. Existing guest/account planning must not promote fixture/client-supplied metadata to server-verified commercial facts, prices or booking URLs. Retain current stripping/provenance/ownership semantics. No DB migration or additional account data collection.

## Official evidence and contract
Re-read current official technical schema; record URLs and access date.
- https://docs.viator.com/partner-api/technical/
- https://partnerresources.viator.com/travel-commerce/affiliate/
- https://partnerresources.viator.com/travel-commerce/managing-product-availability-data/
- Original account-specific reply evidence: https://github.com/Jetnity/jetnity/issues/1023#issuecomment-6468170303
Full Access Affiliate P00328015 requires NO additional certification/design approval per the verified reply; do not send duplicate inquiry. Public generic onboarding wording is superseded for this account by that reply.
On-demand POST /products/search; GET /products/{product-code}; GET /availability/schedules/{product-code}; POST /availability/check. Implement GET /destinations mapping and reference-data seams where needed (locations/bulk, products/tags; exchange-rates only if actually required). No invented destination IDs, free-text slug mapping, whole catalogue ingestion or background crawling.
GET /destinations hierarchy/type/country must be validated; known ambiguity fails closed. Reference data may use a bounded server cache without schema changes; conservatively apply the account reply's <=3600-second ceiling until a narrower reference-data exception is established.
Search/display request language de and currency CHF only as supported by official schema; do not claim translated or CHF results when provider returned otherwise.
Product information cache <=3600s; live check no cache. Cache keys include relevant language/currency/context. Unique provider content must not become indexable; preserve site noindex and apply response noindex/no-store where needed. Do not expose API keys, raw responses, bearer URLs, trip names/IDs or identity data in links/logs.
120s is NOT minimum search/detail/availability timeout. Reuse bounded existing transport, respect 429/Retry-After and finite retry budget. No new generic transport/proxy stack.
Do not claim image/content-license rights verified just by changing a boolean. Retain evidence gates; fixture images must be local harmless assets, never fetched provider data masquerading as live.

## Permitted files
Provider implementation and tests: lib/providers/viator/activities/**.
Narrow integration edits: lib/activities/{provider,domain,factory,zustand,client-sicht,anfrage,schema,suche,client-anfrage,suchlebenszyklus}.ts and focused tests only where demonstrably required.
UI: components/trips/AktivitaetenBereich.tsx, AktivitaetKarte.tsx and new Viator-specific components alongside them.
API: app/api/activities/search/route.ts and new bounded app/api/activities/viator/{detail,schedule,check}/route.ts with route-owned validation/rate protection. No arbitrary URL proxy; choose server-side known host/paths.
Own scripts under scripts/viator-s2-native-integration/** and own S2 PLAN/STATUS/HANDOFF/SELF_REVIEW/REPORT/ADR-notes. Shared architecture/roadmap changes go in task-owned proposed notes for TL integration.
Read-only: TripWorkspace, route/global navigation, all rental/12Go/DiscoverCars/GYG files, shared server transport, provider-ops kill switches, commercial-provenance core, guest/account ownership persistence, package/workflows, DB/Auth/RLS, env/config and shared ACTIVE_WORK_STATUS.
If required interface change outside this allowlist is unavoidable, provide the minimal concrete patch proposal and continue independent permitted work.

## Activation and tests
Default disabled. Production remains hard OFF. Real network transport is sandbox-host-only and requires protected server key plus the existing explicit sandbox/nonproduction guards. No credential read/write, environment creation, Vercel rebuild, database access or real provider call in this agent task. The owner's earlier #968 approval covers only the two frozen #1082/#1059 previews; it is NOT a Viator credential grant.
Use dependency-injected synthetic responses to test actual modules, requests, rendered production components and routes locally. Fixtures must remain test-only and impossible to activate by URL/query/localStorage or public environment flag on deployed routes. Missing real credentials must yield unavailable, never simulated offers in normal runtime. Document normal-path hosted QA as BLOCKED if still unreachable; do not keep asking owner to repeat failed CLI login.

Required meaningful checks:
- multi-stage/country/repeated/unknown destination and stale asynchronous response races;
- search->detail->schedule->check boundary, date/option/age invalidation, CHF/price-basis correctness;
- unsafe URLs/images/XSS, duplicate ids, partial/empty/error/429/timeout, cache expiry, missing key and Production rejection;
- fixture data cannot become booking link/quote/provenance; guest/account regressions;
- 320/390/768/1440, keyboard, text enlargement (state exact method; root-size != browser zoom), no overflow/focus loss; no provider request before explicit search and no eager card fanout;
- typecheck/lint/focused tests/build and native exact-head App/Auth CI.
Use a portable artifact directory, no hardcoded /opt/cursor requirement.
No new paid infrastructure; existing USD100/month cap. No purchase/payment. No production promotion or protection bypass.
Deliver exact HEAD/tree/base/ahead-behind, changed file list, screenshots with synthetic data and actual limitations. STOP for independent TL review. Do not mark Ready. Do not merge. Do not start a follow-up slice.