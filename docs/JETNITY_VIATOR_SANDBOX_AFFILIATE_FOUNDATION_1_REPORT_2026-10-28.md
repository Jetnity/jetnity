# Viator Sandbox Affiliate Foundation 1 — REPORT

28 October 2026. Status: **partially finished**. The offline S1 contract is in the branch. Real Sandbox verification is **BLOCKED**, not passed. Independent Technical Lead review has not happened. Ready was not set. Nothing was merged.

## Umgesetzt

Provider-specific Viator Full Access parsers and a server-only sandbox caller. Search and product detail become `content_preview`. Schedules become `schedule_hint`. `/availability/check` becomes `live_check` only for one product, one option, one calendar date, and an explicit age-band mix. Affiliate redirect keeps the original `productUrl` after an HTTPS host allowlist check. Fixtures cannot mint availability or attribution. Cache ceiling is 3600 seconds. Live check is not cached. Unique review text and `viatorUniqueContent` are dropped. The caller uses `createProviderTransportExecutor` and refuses every host except `https://api.sandbox.viator.com`.

## Dateien

- `lib/providers/viator/activities/**` (contracts, parsers, sandbox client, tests)
- `scripts/viator-sandbox-foundation-1/status.ts`
- `docs/JETNITY_VIATOR_SANDBOX_AFFILIATE_FOUNDATION_1_PLAN_2026-10-28.md`
- `docs/JETNITY_VIATOR_SANDBOX_AFFILIATE_FOUNDATION_1_STATUS_2026-10-28.md`
- `docs/JETNITY_VIATOR_SANDBOX_AFFILIATE_FOUNDATION_1_HANDOFF_2026-10-28.md`
- `docs/JETNITY_VIATOR_SANDBOX_AFFILIATE_FOUNDATION_1_SELF_REVIEW_2026-10-28.md`
- this report

Unchanged on purpose: immutable task, `lib/activities/**`, `lib/server/providers/core/**`, routes, UI, package, CI, SQL, env, `docs/ACTIVE_WORK_STATUS.md`.

Seed before this change: HEAD `618a1940020c73da9f7d8cf55cb8efc30cda258c`, tree `d8c158e41332aa5b289a0f24e3195c29b71736d5`, merge-base `71e07c71d06e7c4ef26ed6e8d40080bb9ea24382`. Exact delivered head is the pushed commit recorded in the STOP comment.

## Datenbank

None. No migration, RLS, or type generation from SQL.

## Tests

Focused unit: 17 pass, 0 fail.

`scripts/viator-sandbox-foundation-1/status.ts`: `{"liveSandbox":"BLOCKED","keyPresent":false,"zugang":"disabled",...}`.

`node scripts/exporte.mjs`: no uncalled export. `node scripts/erreichbarkeit.mjs`: no orphan file. `node scripts/operating-mode-guard.mjs`: PASS.

## Build

`npm run lint`: exit 0, with pre-existing warnings outside this slice. Viator paths were clean at `--max-warnings 0`.

`npm run typecheck`: exit 0 after the union-narrowing fix.

`npm run build`: exit 0.

Native exact-head App/Auth CI and Vercel Preview are not claimed until they finish on the pushed head. They would be code and fixture smoke only.

## Security

No key was read, printed, or committed. The test key is a fixture string and is asserted absent from normalized results. `exp-api-key` is a secret header on the injected client only. Production `VERCEL_ENV` disables the client. Booking, hold, cancel, bulk, and modified-since are refused before HTTP. No new public route. Noindex is a contract for a later response, not a page published here.

## Kosten

No new paid call, provider contract, or running infrastructure cost.

## Dokumentation

The five owned docs above. Official pages cited in the plan were read on 28 October 2026. The owner-reported Affiliate API reply is labeled as such.

## Offene Punkte

- Isolated sandbox key and a finite real Sandbox check.
- S2 UI, factory, route, and response `X-Robots-Tag` after independent S1 acceptance.
- Image/content license confirmation against the current partner agreement.
- Allowlist extension only if a real `productUrl` host differs from the public examples.
- Technical Lead R1.

## Risiken

A green fixture suite can be mistaken for live availability or affiliate attribution. The types forbid that, and the tests lock it, but no production monitor exists until S2. Caching above 3600 seconds, or treating a schedule as a quote, would violate both the public Viator guide and the owner-reported condition.

## Empfehlung

Technical Lead reviews this exact head. Do not provision the sandbox key in general Preview. Do not start S2 from this session.
