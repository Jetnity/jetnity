# Trip Workspace flight coverage proof guard 1 — Self-review

6 October 2026 · #873 / Draft #877

**NOT_READY. This is the implementing writer's self-review, not independent Technical-Lead PASS.**

## What was challenged

- Read the original same-date matcher and reproduced the audit contract with actual coverage, workspace and Attention functions. No mocked coverage result is used.
- Ran final regression tests against baseline runtime: 25 failures out of 106. Restored the fixed implementation and reran: 106/106 pass. Thus the new cases actually detect missing guards.
- Tested wrong routes with both booking states, both Guest-like and explicit canonical fact shapes, reversed direction and one correct endpoint. No item became associated from booking/title/provider/stage fields alone.
- Tested country-only/null-country/IATA-only data, missing itinerary and conflicting endpoint identities. Country on the route cannot fill a missing country on the required city. The Trip origin has no country field; its city/GeoNames form remains fail-closed.
- Verified positive selected/booked routes through explicit airport origin and known city/country destination, both return directions, a transit leg and a multi-stage connection. Positive tests now carry evidence instead of preserving the old date-only assumption.
- Preserved conservative same-date ambiguity. A valid route plus another same-date item is still unknown in either input order. A single item matching more than one required section is not consumed by the first array entry.
- Checked `ohneTag` parity/no duplication, no-origin, no-stages, no-required-section, missing dates and unassigned extra flights. Input data and booking state are not mutated.
- Read downstream aggregate/Attention behavior. Neither consumer needed a runtime edit; the corrected shared projection preserves the signal.
- Broadened to all trip, route and mobility tests. Diagnosed every failure against the actual fixture and confirmed all 69 tests from the three affected external files pass against baseline runtime. Five assumptions conflict with the requested truth correction.
- Inspected the final diff for the exact allowlist and absence of new provider/DB/I/O paths. The runtime uses the existing pure RouteFacts reader; countries are private matching context and the output shape is unchanged.

## Unresolved finding

**P2 G-01 (acceptance blocker):** Five tests outside the allowlist still require date-only coverage. Paths and assertions are in the [report](TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_REPORT_2026-10-06.md). Do not mark Ready while these fail. The next action is independent exact-head review and a Technical-Lead allowlist decision for this same slice; no unauthorized changes were made.

**P0:** 0 observed. **Open runtime P1:** 0 observed; the audited F-01 is fixed in the bounded implementation. **P2:** 1. **P3:** 0 new. This does not close other findings from #871 or certify whole-product acceptance.

## Deliberate conservative limits

- An ordinary city/GeoNames Trip origin remains unknown because the stored graph cannot compare its country to the route endpoint. No origin country is inferred.
- Exact normalized city equality is used only with matching known country. No translation, alias, region-to-airport, city-to-IATA or geographic containment is invented.
- A whole roundtrip/multi-leg item is not split into several required sections. The one-item/one-section rule remains intact.
- The existing section date semantics remain: stage arrival/start or departure/end. Overnight departures on a different calendar date are not newly reconciled.
- Multiple same-date flights remain ambiguous even when one looks more plausible. No ranking or first-match policy is introduced.

## Validation and boundaries

106 focused tests pass; broader tests have 1056 pass and five fail, zero skips. Typecheck passes. Repository lint exits 0 with 145 existing warnings outside changed files; changed files pass strict zero-warning lint. Static dead/export/dependency/API/schema-reference/mode checks and the local production build pass. Initial build sandbox IPC failure was resolved by the permitted local-process rerun, not by editing configuration.

No browser/device or authenticated Account E2E claim; no full `npm test` claim. No live database, provider, Auth, Official Truth/F8 or Production action. No package/schema/global continuity edit, Ready, merge, new agent or follow-up slice.

Session `01a111cd-17b6-7bb1-bd6e-2f52e52bec20`; persisted model `gpt-6-astra`, reasoning `xhigh`.

**TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_NOT_READY**

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
