# Homepage Natural Route Intent 1 — evidence notes

Hydrated controller evidence from `scripts/homepage-natural-route-intent-1-hydrated.mjs`.

Actual `StartzielForm` was bundled. `next/navigation` was stubbed. `/api/search/places` was synthetic and includes whole-place fixtures for Peru, Bosnien und Herzegowina, Trinidad und Tobago, Lima/Peru context, plus empty whole-string results for multi-destination phrases. Per-query 503 is injected only for named extra lookups.

**Not** physical-device acceptance and **not** authenticated Production/Preview E2E.

12 PASS on the persist working tree: one-place Peru, whole-place conjunctions, Lima/Peru context, Lima+Cusco queue and handoff, three countries plus Paris/Rom/Paris duplicates, compound country inside comma route, triple-und grouped to two, per-segment 503 no guess-split, whole 503 no-split, ambiguous/no-result kept, cancel remaining queue, keyboard + 390/768/1440.
