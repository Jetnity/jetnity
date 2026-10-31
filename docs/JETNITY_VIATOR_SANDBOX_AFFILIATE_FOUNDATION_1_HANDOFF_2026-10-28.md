# Viator Sandbox Affiliate Foundation 1 — HANDOFF

28 October 2026. Writer: Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1. bcId `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`. Model `grok-4.7-high-fast`.

## What the next reviewer has

A fail-closed Viator Full Access parser and a sandbox-only caller. It is not wired to `activityProviderAus`, the activities route, or any page. `docs/ACTIVE_WORK_STATUS.md` was left unchanged because this task marks it read-only. This handoff is the continuity record for the slice.

## How to read the result

| Evidence | Module | Claim |
| --- | --- | --- |
| `fixture` | `parseViatorFixture` | Never availability, never affiliate |
| `content_preview` | `parseViatorSearch`, `parseViatorProductDetail` | Title, text, from-price, image URL. `availabilityClaim: false` |
| `schedule_hint` | `parseViatorSchedule` | Supplier-currency calendar hint. Not a live quote |
| `live_check` | `parseViatorAvailabilityCheck` | Only after product, option, date, and explicit pax mix. TTL 0 |
| `affiliate_redirect` | `readViatorAffiliateRedirect` | Original `productUrl` only, and only from `provider_response` |

Sandbox host is `https://api.sandbox.viator.com`. Production host `https://api.viator.com` is a rejection constant. Env `VIATOR_API_ORIGIN` is ignored.

Required server env, when an isolated sandbox is later provisioned:

- `VIATOR_SANDBOX_CALLS=true`
- `VIATOR_SANDBOX_API_KEY` (header `exp-api-key`, never logged)
- `VERCEL_ENV` must not be `production`
- The caller must inject an HTTP client. This slice does not open a socket by itself.

Do not copy the key into Preview, chat, or a fixture. #968 still blocks casual Preview/Production Supabase mixing. S2 is a separate writer after Technical Lead acceptance.

## Vendor evidence

Original email screenshot visually verified by Technical Lead; vendor account login and API credentials NOT verified. https://github.com/Jetnity/jetnity/issues/1023#issuecomment-6468170303. The email requires unique content to stay unindexed. Broader noindex for user-visible provider content is Jetnity's internal gate. There is still no proof that checkout accepts a date, CHF, or a participant mix, and no certified Sandbox quota.

## Do not resume from here

No follow-up slice, no factory edit, no UI, no booking endpoint, no Production request, no Ready, no merge.
