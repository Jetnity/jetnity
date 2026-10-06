# Trip Workspace flight coverage proof guard 1 — Report

6 October 2026 · Issue #873 · Draft PR #877 · Codex Desktop

**TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_NOT_READY**

The bounded runtime fix and its authorized regression tests are implemented. The required focused suite passes. The broader trip suite exposes five obsolete date-only coverage expectations in three files outside the immutable TASK allowlist. Those tests remain unchanged and failing; this delivery is not ready for acceptance or merge.

## Live reconstruction

- Fresh `origin/main`: `b16a250b95715418c125a92a2d407ba2ec3f89fa`.
- `.jetnity/operating-mode.json` on that remote main: `NORMAL`.
- #751 confirms the Codex execution lane and four disjoint slices #873/#874/#875/#876.
- #873 / Draft #877 authorizes this guard on `fix/trip-workspace-flight-coverage-proof-guard-1`.
- Remote task seed: `00cfcedd764599e5987bcb647f780a3b52e5b9a2`; initial ahead/behind 1/0.
- Immutable TASK blob: `92bbf311a3319947c891c10a53b88087d22a367a`.
- #869 closure and #871 exact-head reviews identify P1 F-01. The merged audit's `coverage-impact.json` records two unrelated booked NRT→LAX items producing `belegt` and no flight Attention.
- The baseline matcher used only `startsOn === abschnitt.date`. `arbeitsbereich.ts` and `attention.ts` propagated that false association without a separate route check.

Read-only contract inspection included `types/trips.ts`, `lib/places/domain.ts`, `lib/route/{ableitung,domain,schema,referenz,chronologie,pfad,vergleich}.ts`, mobility equality/coverage, workspace/Attention consumers, project governance and the relevant vision/logic/architecture/decision/quality/continuity guidance. No new resolver or truth source was introduced.

## Implementation and proof boundary

Only `lib/trips/flug-abdeckung.ts` changes runtime behavior.

1. Derive each flight's facts through the existing `routeFactsFuerPunkt` trusted-reader boundary. Require `flight_itinerary`, proven chronology and a single leg. A connected multi-segment leg remains supported. A roundtrip or multi-leg item remains unassigned instead of being split into several required sections.
2. Keep the existing item/section date requirement. A present canonical departure date that contradicts `startsOn` blocks assignment. Local times and cross-airport chronology are not reinterpreted.
3. Prove **both directed endpoints**. An existing `airport:XXX` section identity must equal the canonical endpoint airport code. An airport identity mismatch cannot fall back to a matching display city. Otherwise require the section's known country to match the route fact's country and its name to equal the canonical city under the existing trim + `toLocaleLowerCase('de-CH')` contract.
4. A `Trip` origin stores a name and Place-ID, but no country. A city-only/GeoNames origin therefore cannot be disambiguated from existing route facts and stays unknown. An explicitly stored airport origin supports positive outbound/return coverage. No country is inferred from a GeoNames ID or a city label.
5. Compute possible section associations before consuming items. Exactly one same-date candidate and exactly one proven section are required. Multiple candidates, repeated possible sections and contradictory/absent facts remain fail-closed. Array order and booking status never disambiguate.
6. Retain existing section creation, remaining-item handling and one-item consumption. Public `FlugAbschnitt` shape is unchanged; country fields are private matching context. Neither trip data nor booking status is mutated.

The existing workspace and Attention consumers now see `unbestimmt` / `coverage.fluege` for false coverage, with no production changes in those consumers.

Conservative limitations are intentional: city-only origins, unknown destination countries, unsupported aliases, multiple same-date items and multi-leg items can remain unassigned even when a human would recognize a plausible route. This slice adds no assignment workflow, lookup or geographic inference.

## Required regression evidence

| Contract | Fresh evidence |
| --- | --- |
| NRT→LAX cannot cover Zürich→Florenz on the same date | Parameterized selected/booked × Guest IATA-only/account-like explicit facts cases in `flug-abdeckung.test.ts`. |
| Booking status cannot establish association | Wrong items remain unassigned; input graph and booking status remain byte-equivalent through derivation. |
| Two unrelated outbound/return items cannot produce `belegt` | Workspace regressions for both booking states and both fact shapes; status remains `unbestimmt`. |
| Flight Attention remains | Actual `attentionAbleiten` produces `coverage.fluege` with `unknown` and the flights action for both wrong booked items. |
| Missing facts are never guessed | Legacy title/note/provider/transfer fields, missing city, missing country and IATA-only fixtures all fail closed. |
| Multiple candidates remain ambiguous | Two proven same-date flights; proven + unrelated candidate in both orders; one item matching repeated required sections; duplicate candidate keeps Attention. |
| Positive route still works | Explicit airport origin + canonical city/country destination; selected outbound, booked outbound, selected return, complete selected/booked roundtrip, and one-leg transit. |
| Guest/account-like parity | The same graph with implicit or explicit `ohneTag` produces identical workspace/Attention results; no duplication. Account-like route fields only work when identities match. |
| Multi-stage/return/no-origin/no-required-section | Covered by focused tests, including a booked city-to-city connection, unassigned extra item, no stages and absent section dates. |
| Additional fail-closed edges | Reversed/one-wrong endpoint, known-country mismatch, conflicting airport ID, ambiguous topology, multi-leg item and contradictory departure date. |

## Commands actually executed

Node `v22.23.3`, npm `10.9.9`. Commands ran from the isolated `work/jetnity` checkout. TAP and command logs remain local scratch under the enclosing `work/` directory; no extra evidence path was added to the repository.

| Command | Result |
| --- | --- |
| `npm ci --offline --ignore-scripts --no-audit --no-fund --cache /Users/sasa/.npm` | Initial install PASS, 530 packages; scripts deliberately disabled for this initial invocation. |
| `npm ci --offline --no-audit --no-fund --cache /Users/sasa/.npm` | Final normal install PASS, 530 packages; lifecycle scripts enabled. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/flug-abdeckung.test.ts lib/trips/arbeitsbereich.test.ts lib/trips/attention.test.ts` | **106/106 PASS**, 16 suites, 0 fail/skip. |
| Same focused command with only `flug-abdeckung.ts` temporarily restored to `origin/main` | Negative control: **81 PASS / 25 FAIL**, 106 tests. Fixed source restored in `finally`, then the final focused command rerun successfully. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test 'lib/trips/*.test.ts' 'lib/route/*.test.ts' 'lib/mobility/*.test.ts'` | **1056 PASS / 5 FAIL**, 1061 tests, 183 suites, 0 skips. Failures listed below. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/detail.test.ts lib/trips/uebersicht.test.ts lib/trips/workspace-status-language-1.test.ts` with baseline runtime | **69/69 PASS**. Confirms the five changed outcomes arise from the corrected guard rather than pre-existing unrelated failures. |
| `npm run typecheck` | PASS (`next typegen` and `tsc --noEmit`). |
| `npm run lint` | PASS, 0 errors; 145 warnings outside the four changed code/test files. No warning suppression added. |
| `node node_modules/eslint/bin/eslint.js lib/trips/flug-abdeckung.ts lib/trips/flug-abdeckung.test.ts lib/trips/arbeitsbereich.test.ts lib/trips/attention.test.ts --max-warnings 0` | PASS, 0 warnings. |
| `npm run check:dead` | PASS, no unjustified orphan module. |
| `npm run check:exports` | PASS, no unjustified unused export. |
| `npm run check:deps` | PASS. |
| `npm run check:api-schutz` | PASS, 12 admin routes checked statically. No Auth mutation or live Auth probe. |
| `npm run check:schema-bezug` | PASS; local static generated-type comparison only, no database access. |
| `npm run check:operating-mode` | PASS. |
| `npm run build` | PASS, local production build. Initial sandbox invocation failed at tsx IPC `EPERM` before compilation; rerun with local process permission succeeded. |
| `git diff --check` | PASS. |

No fresh full `npm test`, hosted Preview acceptance, authenticated Account E2E, browser/device acceptance, DB/RLS, provider or Production validation is claimed. The full suite includes unrelated database fixtures; it was not invoked for this bounded no-DB slice. The broader suite is explicitly **not green**.

## Open delivery blocker

**P2 G-01 — five old date-only test fixtures outside the allowed paths.**

| File | Failing existing test / assertion |
| --- | --- |
| `lib/trips/detail.test.ts:264` | `teilweise bleibt von belegt getrennt`: fixture has no route facts; expected `teilweise`, actual `unbestimmt`. |
| `lib/trips/uebersicht.test.ts:291` | `gebuchter Hinflug mit offenem Rückflug bleibt teilweise statt belegt`: title/date/booking alone expected a booked section. Actual summary stays unknown. |
| `lib/trips/workspace-status-language-1.test.ts:221` | `gebucht, ausgewählt, teilweise und nicht nötig bleiben eigene Texte`: booked fixture has no itinerary; actual `unknown`. |
| `lib/trips/workspace-status-language-1.test.ts:346` | `Coverage-Titel folgt der bestehenden Lage, nicht einer zweiten Ableitung`: expected partial title from that same unproven flight. |
| `lib/trips/workspace-status-language-1.test.ts:552` | `bereichStatus-Lagen und Zählungen ändern sich nicht durch neue Texte`: expected partial coverage from a route-less fixture. |

These fixtures must either carry genuinely provable routes for their existing positive presentation tests or explicitly expect unknown for legacy items. That requires Technical-Lead approval to extend this slice's allowlist. No edit, test skip, expectation weakening, runtime special case or follow-up slice was made to circumvent the boundary.

Findings: **P0 0; open runtime P1 0 (F-01 fixed by this change); P2 1 (G-01, acceptance-blocking); P3 0 new.** The independent Technical Lead must assess the final exact head.

## Scope, identity and STOP

Writer changes: the single runtime file, the three allowed tests, and the three allowed REPORT/HANDOFF/SELF_REVIEW documents. The immutable TASK is the only additional PR file from the pre-existing seed (eight changed files against main in total).

No UI/editor/direct-flight readback, schema/DB/Supabase, Official Truth/F8, Auth, provider, Production or global continuity edit. No new dependency, API or ongoing cost. Parallel slice paths remain untouched.

Session: `01a111cd-17b6-7bb1-bd6e-2f52e52bec20`. Persisted Codex Desktop session metadata reports model `gpt-6-astra`, reasoning effort `xhigh`, CLI `0.160.0`, session timestamp `2026-10-06T15:20:16.055Z`. No replacement writer or subagent.

Publication transport: ordinary Git push could not read an HTTPS username from this terminal. The already authenticated GitHub connector is the publication path; it creates the identical Git tree and advances only the authorized branch with an expected-head lease. Remote commit metadata may differ from the local commit. The final STOP receipt verifies exact tree equality after remote fetch. No new login or credentials are requested.

The exact delivery head is the containing delivery commit, not the task seed. The final STOP receipt reports its full SHA, fresh remote main, merge-base/ahead/behind, remote equality and PR state after publication; no self-referential commit SHA is invented inside this document.

**Stay Draft. No Ready. No merge. No follow-up. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
