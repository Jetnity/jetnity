# Consumer source-review matrix — V1 Account Graph Read Completeness 1

Reviewed head after AG-R1: this branch. Inspection date: 21 September 2026.  
This table is **source inspection**, not an executed test of each caller. Runtime files were not edited.

Two callers are also **executed** with an incomplete `accountGraphLesen` result:

- `safetyReiseAufloesen` / `safetyEvaluationsPruefen` in `lib/trips/account-graph-read.test.ts`
- `registryTripUebernahmeOrchestrieren` in the same file, using the same `problem → { problem, reise: null }` mapping as `registryTravellerInReiseUebernehmen`

Existing Safety tests in `lib/safety/s4-r2-server-trip-truth.test.ts` already execute problem-before-use for generic 500/503 Lesungen. They do not use this slice’s incomplete-graph fixture.

| Caller | Function | Error-before-use / side-effect boundary | Evidence class |
| --- | --- | --- | --- |
| `app/(public)/reisen/[tripId]/page.tsx` | `ReiseSeite` | `if (problem)` returns generic load-error UI. `zeilen[0]` / `KontoArbeitsbereich` only after. Empty `zeilen` → `notFound()`. No mutation. | Source inspection |
| `lib/readiness/aktionen.ts` | `reiseDesKontos` → `readinessSetzen`, `readinessEntfernen`, `readinessUebernehmen` | `if (geladen.problem)` returns `{ ok: false }` before `rahmen.reise` is used. Insert/update/delete and `revalidatePath` only after `rahmen.ok`. | Source inspection |
| `lib/readiness/reisende-aktionen.ts` | `reiseDesKontos` → `travellerSetzen`, `travellerEntfernen`, `partyUebernehmen` | Same `problem` stop before party build / `party_schreiben` / `party_loeschen` / `revalidatePath`. | Source inspection |
| `lib/readiness/reisende-aktionen.ts` | `registryTravellerInReiseUebernehmen` | Wrapper maps `geladen.problem` to `{ problem, reise: null }` and never passes a party. `registryTripUebernahmeOrchestrieren` then fail-closes: no registry read, no `party_schreiben`. | Source inspection + executed orchestration |
| `lib/reiseaenderung/aktionen.ts` | `aenderungErzeugen` | `if (geladen.problem)` returns `klasse: 'gesperrt'` before `mitModell` / model call. | Source inspection |
| `lib/reiseaenderung/aktionen.ts` | `aenderungUebernehmen` | `if (geladen.problem)` returns `{ ok: false }` before revision compare, `operationenAnwenden`, or persist. | Source inspection |
| `lib/reisebegleiter/aktionen.ts` | `begleiterFragen` | `if (geladen.problem)` returns `klasse: 'gesperrt'` before route/companion model use. | Source inspection |
| `lib/hotels/aktionen.ts` | `hotelInReiseUebernehmen` | `if (geladen.problem)` returns `{ ok: false }` before hotel proof / `trip_items` insert. | Source inspection |
| `lib/flights/aktionen.ts` | `flugInReiseUebernehmen` | Same stop before flight proof / persist. | Source inspection |
| `lib/activities/aktionen.ts` | `activityInReiseUebernehmen` | Same stop before activity proof / persist. | Source inspection |
| `lib/mobility/aktionen.ts` | `mobilityManuellInReiseAnlegen` | Same stop before belonging check / `trip_items` insert. | Source inspection |
| `lib/rental-cars/aktionen.ts` | `rentalCarManuellInReiseAnlegen` | Same stop before belonging check / `trip_items` insert. | Source inspection |
| `lib/safety/auswerten.ts` | `safetyReiseAufloesen` / `safetyEvaluationsPruefen` | `if (gelesen.problem)` returns `lesen-fehlgeschlagen` before `safetyAuswerten` or a `reise` field. | Executed |
| `app/api/safety/evaluate/route.ts` | `POST` | Passes `reiseLaden` into `safetyEvaluationsPruefen`. Route returns the evaluation error and does not invent party truth. | Source inspection (route wiring); Safety path executed |

Not `reiseLaden` consumers (out of this matrix): guest `gastreiseLadenNach`, `aenderungErzeugenGast`.

Finding: no caller bypasses `Lesung.problem` before using the graph or mutating. No out-of-scope expansion requested.
