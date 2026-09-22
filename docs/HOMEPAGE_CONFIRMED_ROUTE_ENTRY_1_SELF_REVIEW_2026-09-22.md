# Homepage Confirmed Route Entry 1 — SELF-REVIEW

Date: 2026-09-22  
Status: **AGENT SELF-REVIEW ONLY / NOT TECHNICAL-LEAD PASS**  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
Required and actual model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

## 1. Did we stay inside the owned surface?

Yes. Runtime writes are the allowlisted StartzielForm / RouteZiel* / planen page / TripPlanner / route-einstieg / compatible auswahl href / create-entry handoff keys / index-grenze `zielIds` / owned tests / owned docs. `OrtSuche` was remounted via `key` instead of a behavior change. #544 remaining-build paths were not edited. No schema, Auth, secrets, Production, provider, lockfile, or global-doc writes.

## 2. Did we fake natural language?

No. There is no comma/`und` split and no model/parser path. UI copy does not promise sentence understanding. #110 stays open.

## 3. Is the handoff lossless and fail-closed?

Transport is validated as a whole before lookup. Conflict, empty, oversized, and malformed lists do not become a shorter valid route. Duplicate Paris occurrences keep distinct keys. Confirmation uses `lese()` so an outage is `ausfall`, not an empty success. Canonical `Ort.name` is what TripPlanner receives.

## 4. Did Guest/Account contracts survive?

`gastCreateJetztPruefen` still gates TripPlanner before place confirm and persist. Account still returns erlaubt without reading guest storage. `istGenerischerCreateHref` now treats key presence, so empty `zielIds` is not rewritten to a generic Create CTA.

## 5. Is the hero still the current hero?

Yes. `app/(public)/page.tsx` was not edited. StartzielForm kept the white card, citrus submit, and one search. Many targets expand inside that card.

## 6. Are the tests real?

Route parser/selection and `renderToStaticMarkup` of the actual chip/error/form-view components are exercised. They are not Production E2E and not a hydrated Next route with live Auth. Guest-preservation tests were re-run, not rewritten into a weaker contract.

## 7. Browser honesty

390/768/1024/1440 Chromium evidence exists. Empty submit, pending unconfirmed text, and both handoff errors were seen live. Local place search returned no suggestions, so the live add/reorder chip path was not clicked against GeoNames. That is a documented gap, not a PASS. Emulation is not a physical device.

## 8. Verdict

Ready for independent Technical-Lead exact-head review of the freeze SHA. **Not Ready. Not merged. No follow-up slice.**
