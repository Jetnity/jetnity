# Activities Destination First 1 — TASK V3 / Codex handover

2026-11-01, Europe/Zurich. Supplements V1/V2; neither historical task is rewritten.

The owner explicitly chose “Hier in Codex weiterarbeiten, ohne zusätzliche Cursor-Kosten”. Cursor session bc-b961dce1-751e-403e-ade6-52d2c56a648b is stopped. Codex is the sole writer on the existing branch and Draft PR #1100, starting at 8ddb7a6d8164b92d35f4e769e06c6db45d1f8974. The handover is recorded in PR comment 6557791273. New tests by this writer are self-tests, not independent acceptance.

## Correction plan

- Fix destination-only native input at its source: no unrelated trip-wide items, no fabricated conflict clearance; preserve dated input and adoption.
- Put official offers before secondary native search; accurate date-free labels and concise visitor-facing copy.
- Fix the Viator opaque-frame zero-height bootstrap with the unchanged official loader, exact child/source/partner checks and bounded heights. Keep sandbox/CSP isolation; update the inline hash and realistic offline regression.
- Fix the existing native details overflow at 320px with enlarged text, retaining the actual bounds assertions. Narrowly extend allowed paths to `components/trips/ViatorPruefung.tsx` and its existing browser test where necessary.
- Consume the existing CMP read contract only; do not infer an activities category mapping or permission from navigation. An absent reviewed activities policy / actual permission stays closed for automatic provider loading. Shared `lib/privacy/**` and `components/privacy/**` remain read-only. Record the precise remaining release prerequisite rather than claiming privacy acceptance.
- Update the activities disclosures in `app/(public)/privacy/page.tsx` to match implementation, without claiming legal approval.
- Check GYG resizing offline. The actual provider 403 STOP remains; do not retry or disguise requests.

No database, schema, secrets, deployment environment, dependency, native Viator activation or shared CMP/12Go/DiscoverCars changes. No paid Cursor usage. Travel graph and stored journeys remain unchanged by discovery.

Verification: meaningful helper/security/browser regressions first, then typecheck, lint, full suite, hygiene and production build. Synthetic and real-provider evidence remain separate. Actual Viator render count is six; GYG has one TL render/one click/one 403 and is stopped. A successful redirect is not attribution evidence. No Ready/Merge/Production claim before remaining release and independent review gates are met.
