# Viator Sandbox Affiliate Foundation 1 — PLAN

28 October 2026. Draft PR #1079. Issue #1078. Parent #1023.

This file records the plan that was posted on the PR before source edits: https://github.com/Jetnity/jetnity/pull/1079#issuecomment-6468148989

## Session

| Field | Value |
| --- | --- |
| name | Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1 |
| originalModelName | `grok-4.7-high-fast` |
| bcId | `bc-803fd88c-9fdc-47f7-acfc-213976e487f6` |
| session | https://cursor.com/agents/bc-803fd88c-9fdc-47f7-acfc-213976e487f6 |
| mode | NORMAL |
| seed HEAD | `618a1940020c73da9f7d8cf55cb8efc30cda258c` |
| seed tree | `d8c158e41332aa5b289a0f24e3195c29b71736d5` |
| merge-base | `71e07c71d06e7c4ef26ed6e8d40080bb9ea24382` |

## Scope

New provider-specific parsers, fixtures, tests, and a server-only sandbox caller under `lib/providers/viator/activities/**`, plus `scripts/viator-sandbox-foundation-1/**` and these owned docs. No factory, route, UI, shared core, package, CI, database, or env write.

Evidence stays split: `fixture`, `content_preview`, `schedule_hint`, `live_check`, `affiliate_redirect`. Search and schedules do not claim current availability. Live check requires product, option, calendar date, and an explicit age-band mix. Product URLs are preserved byte for byte after an HTTPS allowlist check. Cache never exceeds 3600 seconds. Live check TTL is 0. The sandbox origin is hardcoded. Real calls stay disabled without `VIATOR_SANDBOX_CALLS=true`, a server-only `VIATOR_SANDBOX_API_KEY`, a non-production environment, and an injected HTTP client.

## Official sources read 28 October 2026

- https://docs.viator.com/partner-api/technical/
- https://partnerresources.viator.com/travel-commerce/technical-guide/
- https://partnerresources.viator.com/travel-commerce/managing-product-availability-data/ (3 October 2025)

The Greg / Affiliate API team summary for P00328015 is owner-reported via the dispatch and #1078. The original mail and screenshot were not independently visible.

## Stop

No Ready, no merge, no S2, no Production Viator request.
