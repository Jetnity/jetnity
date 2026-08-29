# Jetnity – Visitor Search Country Alias Ranking Task

Stand: 29. August 2026
Issue: #109
Status: AUTHORIZED / RUNTIME-CORRECTNESS SLICE / DRAFT PR ONLY

## Baseline

- Repository: `Jetnity/jetnity`
- Exact start `main`: `6083ee63a5da62870ab7ac4f5f91f69230718e44`
- Branch: `fix/visitor-search-country-alias-ranking-2026-08-29`
- Logical Cursor-Agent: `Visitor search correctness 1`

Live evidence wins over documentation. Before changing code, re-check current branch/base and all relevant search contracts.

## Objective

Fix the existing Visitor Search correctness defect where an exact country alias/keyword can be outranked or suppressed by same-name/prefix cities. The solution must be generic and preserve the canonical Place-ID truth.

Observed production examples from Issue #109 include:
- `Peru` should rank the country first for destination search, not same-name US cities.
- `China` should rank the country first for destination search, not same-name places.
- `Schweiz` should resolve/rank `Switzerland` first via the existing alias/keyword truth, not `Schweizer-Reneke`.

## Required behavior

1. For role `ziel`, an exact country alias/keyword match must outrank loose city/prefix noise.
2. Do not hardcode Peru/China/Schweiz exceptions. Implement a generic ranking/retrieval rule based on canonical country + alias/keyword semantics.
3. Preserve real same-name cities lower in the result list with existing disambiguation.
4. Preserve role differences between `ziel` and `abreise`; do not make country-first behavior leak into airport/departure semantics.
5. Preserve canonical Place IDs and fail-closed free-text behavior.
6. Preserve existing strong exact-name/IATA behavior where valid.
7. Do not create a second search truth or external geocoder path.
8. Keep result lists compact/relevant; do not lower thresholds broadly enough to flood weak matches.
9. Reuse existing normalization and relevance contracts where possible instead of creating locale-specific one-offs.

## Required tests

At minimum add/adjust regression coverage for:
- `Peru` destination: country first; same-name cities may remain below.
- `China` destination: country first.
- `Schweiz` destination: Switzerland first via alias/keyword.
- existing Bali/Thailand/Japan/Zürich behavior remains correct.
- departure-role regressions: airport/city semantics remain intact.
- exact IATA behavior remains intact.
- weak unrelated keyword/prefix noise is still filtered.
- no hardcoded country-name exception table unless an existing canonical alias table is already the product truth and the implementation merely consumes it generically.

Run full repository gates required by current governance: targeted tests, full tests, typecheck, lint, schema/API/dead/export/dependency hygiene, Production build, exact-head GitHub Actions, exact-head Vercel Preview, and review-thread checks.

## Mobile / product acceptance

The defect was originally observed on mobile Safari. Provide real-device/mobile evidence if the available environment supports it. If not available, explicitly state that it was not run; do not fabricate evidence. The implementation must not redesign the search UI.

## Security / privacy / architecture boundaries

- no DB migration
- no RLS/Ownership/Identity/Auth/MFA/AAL change
- no Supabase Production mutation
- no Service Role
- no external provider/geocoder
- no paid API or new recurring dependency
- no AP-6 Legal runtime
- no AP-7 Registry
- no Homepage Hero natural multi-destination implementation (#110)
- no Provider/Payments/Subscription/Public Indexing/Domain Cutover/Branch Protection

If the fix unexpectedly requires a shared DB/search contract mutation or a paid provider, STOP and report the gate rather than widening scope.

## Mandatory final agent report

The final agent handoff/self-review must include explicit sections:

1. **Ergebnis** – exact behavior changed and files/contracts touched.
2. **Risiken / Residuals** – remaining correctness, UX, performance or data-quality risks with severity.
3. **Kostenwirkung** – explicit value, including `keine` if no new cost; call out any new dependency/provider before activation.
4. **Offene Entscheidungen / Gates** – Product Owner / shared-contract / production gates, or `keine`.
5. **Empfohlene nächste Schritte** – bounded follow-up recommendation only; do not start it.
6. **Exact evidence** – final head SHA, local tests, exact-head CI, Vercel Preview, review-thread state.

## Governance / STOP

- Agent works only on this branch/PR.
- Draft PR only.
- Cursor never sets Ready and never merges.
- Agent self-review is not Technical-Lead PASS.
- Every new push invalidates previous exact-head gates.
- Immediate review fixes for this slice use the same logical Cursor session.
- After final implementation, self-review and evidence, STOP for independent ChatGPT Technical-Lead exact-head review.
- Do not start Issue #110 or any unrelated follow-up.
