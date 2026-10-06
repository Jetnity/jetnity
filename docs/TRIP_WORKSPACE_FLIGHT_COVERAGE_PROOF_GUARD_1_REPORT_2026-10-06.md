# Trip Workspace flight coverage proof guard 1 — Report

6 October 2026 · Issue #873 · Draft PR #877 · Codex Desktop

**TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_READY**

The bounded runtime fix is unchanged from the Technical-Lead-reviewed head `03fd4495d89841c836d92ced7e1ea44622b3e6cd`. The five obsolete date-only expectations have been corrected through provable positive route fixtures in the three newly authorized test files. All required local checks pass. This is a writer delivery classification for independent exact-head review; PR #877 remains Draft.

## Live reconstruction

- Correction-time `origin/main`: `fbf8664c4c12afc1eb04336a1f0cadbc64b34327`; merge-base remains `b16a250b95715418c125a92a2d407ba2ec3f89fa`. Main has integrated the disjoint #878 direct-flight readback slice. No merge/rebase or readback edit was made here.
- The correction starts from reviewed head `03fd4495d89841c836d92ced7e1ea44622b3e6cd` (ahead 2 / behind 3 before the correction commit). Final published head and counts are verified in the STOP receipt.
- [Technical Lead CHANGES REQUIRED](https://github.com/Jetnity/jetnity/pull/877#issuecomment-6020368847), read before editing, authorizes exactly the three additional existing test paths below for this same writer/session. The immutable TASK itself is unchanged.
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

## Five corrected positive test cases

The correction changes only fixtures in the three TL-authorized tests, plus these existing completion documents. It uses `itineraryDirekt()` from `lib/route/fixtures.ts`, with explicit ZRH/CH/Zürich and BKK/TH/Bangkok endpoint facts. Each fixture aligns its canonical departure/arrival date with its intended test date. A stored `airport:ZRH` origin and Bangkok/TH stage prove the required endpoints; the return itinerary reverses those canonical endpoint objects. The generic route-less and ambiguous fixtures remain unchanged.

| Existing test | Truthful correction; retained assertion |
| --- | --- |
| `detail.test.ts` — `teilweise bleibt von belegt getrennt` | The partial fixture carries a booked, proven Zürich→Bangkok outbound. The return stays open; `teilweise`, mandatory gap and not-`belegt` assertions remain. |
| `uebersicht.test.ts` — `gebuchter Hinflug mit offenem Rückflug bleibt teilweise statt belegt` | The booked outbound carries the canonical itinerary. `teilweise` and incomplete progress assertions remain. Exact summary now includes the existing canonical `Zürich → Bangkok` prefix followed by `Hinflug gebucht · Rückflug offen`. |
| `workspace-status-language-1.test.ts` — `gebucht, ausgewählt, teilweise und nicht nötig bleiben eigene Texte` | Proven outbound and reversed return fixtures preserve distinct `booked`, `selected`, `open`, partial/full summaries and no-required-section assertions. |
| Same file — `Coverage-Titel folgt der bestehenden Lage, nicht einer zweiten Ableitung` | The proven booked outbound keeps the exact `Flüge nur teilweise geplant` Attention title. Open/unknown cases are unchanged. |
| Same file — `bereichStatus-Lagen und Zählungen ändern sich nicht durch neue Texte` | The proven outbound keeps the exact four-domain status/count assertion, including flight `teilweise` with count 1. |

No positive assertion was replaced with unknown, skipped or weakened. Titles and provider values remain display/commercial fixture fields only. Runtime blob `1b8f7d005c8dbe74eec69c37cea2901c2147d049` is byte-identical to reviewed head `03fd4495d89841c836d92ced7e1ea44622b3e6cd`; all three original guard regression files are also unchanged in this correction.

## Commands actually executed

Node `v22.23.3`, npm `10.9.9`. Commands ran from the same isolated `work/jetnity` checkout. Fresh correction logs are local scratch `work/correction-*.log`, outside the repository.

| Fresh correction command | Result |
| --- | --- |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/flug-abdeckung.test.ts lib/trips/arbeitsbereich.test.ts lib/trips/attention.test.ts lib/trips/detail.test.ts lib/trips/uebersicht.test.ts lib/trips/workspace-status-language-1.test.ts` | **175/175 PASS**, 40 suites, 0 fail, 0 cancelled, 0 skip, 0 todo. Includes all 106 original focused regressions and 69 tests from the three additionally authorized files. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test 'lib/trips/*.test.ts' 'lib/route/*.test.ts' 'lib/mobility/*.test.ts'` | **1061/1061 PASS**, 183 suites, 0 fail, 0 cancelled, 0 skip, 0 todo. |
| `npm run typecheck` | PASS (`next typegen` and `tsc --noEmit`). |
| `npm run lint` | PASS, 0 errors; 145 existing warnings outside changed code/test files. No suppression added. |
| `node node_modules/eslint/bin/eslint.js lib/trips/flug-abdeckung.ts lib/trips/flug-abdeckung.test.ts lib/trips/arbeitsbereich.test.ts lib/trips/attention.test.ts lib/trips/detail.test.ts lib/trips/uebersicht.test.ts lib/trips/workspace-status-language-1.test.ts --max-warnings 0` | PASS, 0 warnings. |
| `npm run build` | PASS, local production build with required local process/IPC permission; no deployment command. |
| `npm run check:dead` | PASS, 0 orphan modules. |
| `npm run check:exports` | PASS, 1059 files checked, 0 unused exports. |
| `npm run check:deps` | PASS. |
| `npm run check:api-schutz` | PASS, 12 admin routes checked statically. |
| `npm run check:schema-bezug` | PASS, local static generated-type comparison only; no database access. |
| `npm run check:operating-mode` | PASS. |
| `git diff --check` | PASS. |

Earlier checkpoint evidence remains historical, not substituted for these fresh runs: normal `npm ci --offline --no-audit --no-fund --cache /Users/sasa/.npm` passed with 530 packages; the original 106 focused tests produced 25 failures against baseline runtime and then 106 passes after restoring the fix. The earlier broad run had 1056 passes and five failures. Those five failures are now resolved by the specifically authorized positive fixtures above, with no runtime relaxation.

No fresh full `npm test`, hosted Preview acceptance, authenticated Account E2E, browser/device acceptance, DB/RLS, provider or Production validation is claimed. All required local acceptance commands above pass; remote CI is not substituted for them.

## Findings and scope

**P0 0; open runtime P1 0 (F-01 fixed); P2 0 open (G-01 resolved); P3 0 new.** Independent Technical-Lead exact-head review remains required. Existing repository lint warnings are disclosed above, not introduced or suppressed by this correction.

Full PR changed-file set (11 paths, relative to merge-base):

- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_TASK_2026-10-06.md` — immutable pre-existing task seed.
- `lib/trips/flug-abdeckung.ts`
- `lib/trips/flug-abdeckung.test.ts`
- `lib/trips/arbeitsbereich.test.ts`
- `lib/trips/attention.test.ts`
- `lib/trips/detail.test.ts`
- `lib/trips/uebersicht.test.ts`
- `lib/trips/workspace-status-language-1.test.ts`
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_REPORT_2026-10-06.md`
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_SELF_REVIEW_2026-10-06.md`

This correction commit touches exactly the last three authorized test files and the three existing completion documents. No UI/editor/direct-flight readback, schema/DB/Supabase, Official Truth/F8, Auth, provider, Production or global continuity edit. No new dependency, API or ongoing cost. Parallel slice paths remain untouched.

## Identity and STOP

Session: `01a111cd-17b6-7bb1-bd6e-2f52e52bec20`. Persisted Codex Desktop session metadata reconfirmed model `gpt-6-astra`, reasoning effort `xhigh`. Same logical writer; no replacement agent or subagent.

Publication uses the already authenticated GitHub connector because terminal HTTPS push has no username credential. It advances only the authorized branch with an expected-head lease and no force. The final STOP receipt verifies local/remote tree and commit equality after fetch. No new login or credentials are requested.

The exact delivery head is the containing correction commit, not the task seed or previously reviewed head. The final STOP receipt reports its full SHA, fresh remote main, merge-base/ahead/behind, unchanged TASK blob and Draft PR state after publication; no self-referential commit SHA is invented in this document.

**Stay Draft. No Ready. No merge. No follow-up. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
