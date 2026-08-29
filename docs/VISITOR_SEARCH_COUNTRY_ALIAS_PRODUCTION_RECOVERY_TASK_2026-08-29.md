# Jetnity – Visitor Search Country Alias Production Recovery Task

Stand: 29. August 2026
Issue: #109
Status: AUTHORIZED / IMMEDIATE POST-MERGE P1 RECOVERY / SAME LOGICAL CURSOR SESSION / DRAFT PR ONLY

**Product-Owner-Klarstellung 29. August 2026:** Peru, China und Schweiz sind nur Beispiele. Die Abnahme ist generisch für jedes vorhandene Länder-Alias. Keine Allowlist. Die Suchzeile muss Typ und Ortskontext sofort lesbar machen; ein exaktes Alias darf den offiziellen Langnamen als Anzeige ersetzen, Place-ID unverändert.

**Technical-Lead-Fund `5057687985` 29. August 2026:** Ein exaktes Alias-Token kann mehreren Ländern gehören. Live Production zeigt `Congo` auf CD und CG; weitere geteilte Tokens existieren. Zwei ununterscheidbare `Congo · Land`-Zeilen sind ein P1. Generisch disambiguieren aus kanonischem Namen und Ländercode. Eindeutiges Alias bleibt natürlich. Neutraler Zwei-Länder-Test ist Pflicht. Keine Länder-Sonderfälle.

**Technical-Lead-Fund `5057757711` 29. August 2026:** Kurze Exact-Aliase können vor dem Ranking verloren gehen, weil der Länder-Nachzug Substring-`ilike` mit Limit 12 nutzte. Production enthält mehrfach vergebene Kurz-Tokens; Teilstring-Kandidaten liegen weit über 12. Retrieval muss Exact-Aliase vollständig lesen. Neutraler 2-Zeichen-Test mit >12 Substring-Lärm ist Pflicht. Keine Token-Allowlist.

**Technical-Lead-Fund `5057811180` 29. August 2026:** Der Universum-Scan bei jeder `ziel`-Query ist ein P1 auf dem Hot Path. Exact-Vollständigkeit behalten, aber normale Stadt-Queries dürfen nicht den ganzen Länderbestand übertragen. Selektiver Exact-Token-Read mit Sicherheitskappe ist zulässig. Regression: Stadt-Query konsumiert kein Universum; 2-Zeichen-Lärm-Test bleibt grün.

## Baseline

- Repository: `Jetnity/jetnity`
- Exact start `main`: `2241e349f8b3b400963cf1de11e5a8617bdc8e44`
- Prior reviewed implementation head: `4cfa520d9e2dc52e28baf5a312dd382f084ab543`
- Prior transport merge: PR #172
- Recovery branch: `fix/visitor-search-country-alias-production-recovery-2026-08-29`
- Logical Cursor-Agent remains: `Visitor search correctness 1`
- Exact prior Cursor session: `bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a`
- Tatsächlich gestartete Recovery-Session auf PR #173: `bc-020d3296-0cd7-4e36-8373-47578af701ce`

This is not a new logical feature slice. It is the mandatory same-slice correction after new Production evidence invalidated the previous TL PASS, plus the immediate TL re-review finding `5057687985`.

## Blocking live Production evidence

After PR #172 merged and Vercel Production became READY on exact `main @ 2241e349...`, Technical Lead tested the actual public endpoint:

- `GET https://jetnity-app.vercel.app/api/search/places?q=Peru&rolle=ziel` -> HTTP 200, order:
  1. Peru, IL, United States (city)
  2. Peru, IN, United States (city)
  3. Republic of Peru (country)
- `GET ...?q=China&rolle=ziel` -> HTTP 200, order:
  1. China, Japan (city)
  2. China, Mexico (city)
  3. People’s Republic of China (country)
- `GET ...?q=Schweiz&rolle=ziel` -> HTTP 200, correct order:
  1. Switzerland (country)
  2. Schweizer-Reneke (city)

Therefore Issue #109 acceptance is NOT met. Previous TL PASS is invalidated by new live evidence. Issue #109 must remain open.

## Production DB evidence

Read-only Production query on `public.places` confirmed that the country rows contain true exact comma-separated keyword tokens:

- `geonames:3932488` Republic of Peru -> exact token `Peru` (UTF-8 hex `50657275`)
- `geonames:1814991` People’s Republic of China -> exact token `China` (`4368696e61`)
- `geonames:2658434` Switzerland -> exact token `Schweiz` (`5363687765697a`)
- Shared token `Congo` exists on both Democratic Republic of the Congo (CD) and Republic of the Congo (CG). Other multi-country alias tokens exist.

Thus do NOT paper over ranking as missing alias data. Do NOT treat `Congo` as a one-off exception.

## Objective

Make the actual deployed `/api/search/places` behavior satisfy Issue #109 generically for exact country aliases, including immediately readable type/context and distinguishable rows when one exact alias belongs to more than one country. Add tests that exercise the same route/data shape closely enough that this Production failure cannot pass unnoticed again.

## Required diagnosis and acceptance

1. Reproduce/explain why the current pure-ranking tests pass while Production Peru/China remain wrong.
2. Verify the exact runtime path from PostgREST row -> `ortAusZeile` -> ranking -> JSON response; do not assume unit fixtures match Production shape.
3. Fix generically. No `Peru`/`China`/`Schweiz`/`Congo` exception table or hardcoded country list.
4. Preserve `ziel` vs `abreise`, canonical Place IDs, fail-closed free text, exact IATA semantics and compact relevance.
5. Add regression coverage using Production-representative country rows/keywords for at least Peru, China, Schweiz and a generic alias.
6. Add route-level regression coverage for the retrieval + ranking interaction if feasible; pure `orteOrdnen()` tests alone are insufficient after this live miss.
7. **Mehrdeutige Aliase:** Wenn die sichtbare Menge mehr als ein exaktes Länder-Alias-Match enthält, müssen sichtbare Zeile und `aria-label` mit kanonischem Namen und/oder Ländercode disambiguieren. Ein eindeutiges Alias bleibt natürlich. Neutraler Test mit zwei verschiedenen Ländern, die dasselbe Alias teilen, plus Production-förmiges Evidence. Beide bleiben auswählbar.
8. **Kurze Exact-Aliase / Retrieval:** Der Länder-Nachzug darf Exact-Tokens nicht hinter einem kleinen Substring-Limit verlieren und darf normale Stadt-Queries nicht mit dem ganzen Universum belasten. Strategie: selektiver Exact-Name/Exact-Token-Filter, Limit als Kappe. Neutraler Retrieval-Test: 2-Zeichen-Exact-Alias hinter >12 Substring-Lärm; Stadt-Query überträgt 0 Universum-Zeilen.
9. Verify actual Preview endpoint behavior before STOP. If Preview SSO prevents direct endpoint proof, document that and provide the strongest executable route-level evidence; do not fabricate.
10. After merge, Production acceptance must explicitly smoke Peru + China + Schweiz, additional non-example aliases, at least one shared alias, and at least one short shared alias.

## Boundaries

- no DB mutation/migration
- no RLS/Ownership/Identity/Auth/MFA/AAL change
- no Supabase Production write
- no provider/geocoder/paid dependency
- no Homepage #110/AP-6/AP-7/PrivacyBee runtime
- no hardcoded country-specific exceptions
- no branch protection work

Read-only Production evidence is allowed when needed for diagnosis. If a schema/data migration is unexpectedly required, STOP and report rather than widening scope.

## Mandatory final report

Explicitly include:
- Ergebnis and root cause
- why prior tests missed it
- risks/residuals + severity
- Kostenwirkung
- open gates/decisions
- exact final head + tests/CI/Vercel/threads
- Preview route acceptance or explicit inability
- STOP for independent TL exact-head re-review

PR remains Draft. Cursor never Ready/merge. No Issue #110.
