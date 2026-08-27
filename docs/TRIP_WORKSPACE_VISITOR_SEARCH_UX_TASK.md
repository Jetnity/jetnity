# Trip Workspace — Visitor Search UX Task

**Owner:** `Cursor-Agent: Trip workspace audit architecture`

**Status:** Technical-Lead task definition. Separate follow-up after merged PR #87.

## Goal

Make place and airport entry understandable for ordinary travellers without requiring technical location knowledge. Jetnity should accept natural place names, show a small set of highly relevant choices, clearly disambiguate real same-name locations, and keep canonical IDs / IATA codes internal once a choice is confirmed.

Product maxim: **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

## Scope boundaries

This is a bounded visitor-UX/search slice.

In scope:

- shared place autocomplete used by trip planning
- role-aware result ranking/presentation for `Reiseziel` and `Abreise ab`
- airport autocomplete in Workspace flight search
- mobile/desktop dropdown ergonomics, accessibility and truth-safe validation
- focused tests and documentation for this contract

Out of scope:

- Production migrations or schema changes
- AAL2 / auth architecture
- Direction A / stay-duration allocation
- TW-7/8/9
- provider-live activation or paid provider calls
- pricing/availability truth changes
- payment work
- public launch/domain cutover
- a new external/geocoding/airport provider unless the Technical Lead separately approves it

Use the existing local search surfaces first: `/api/search/places` and `/api/search/airports`.

## 1. Place search — relevance before quantity

### Binding behaviour

1. `Reiseziel` and `Abreise ab` accept natural text; a visitor never needs to know an internal ID.
2. Do **not** fill the dropdown merely to reach a result count. Prefer fewer, high-confidence choices over a large noisy list.
3. On mobile, target an initial visible set of roughly **4–6 meaningful results**. More may exist behind bounded scrolling only when they remain genuinely relevant.
4. Exact name and strong prefix matches rank above weak keyword/region matches.
5. Role matters:
   - `Reiseziel`: country/region/island/city relevance according to the typed intent.
   - `Abreise ab`: primary city and useful associated airport choices should outrank low-value districts or remote same-keyword places.
6. Same-name places in different countries/regions are valid results. Show enough context to distinguish them: type + region/country.
7. Do not silently treat free text as canonical truth. The confirmed result must retain the existing canonical place ID contract.
8. Preserve keyboard navigation, screen-reader combobox semantics, loading, empty and error states.

### Mandatory ranking examples

- Query `Peru` for destination: **Peru — Land** should be a leading result. Do not drown it in loosely related entries.
- Query `Zürich` / `Zurich` for departure: primary **Zürich, Switzerland** and relevant **Zürich Airport (ZRH)** should rank ahead of low-value district variants.
- `Lake Zurich, Illinois, United States` must not outrank the obvious Zürich/Switzerland intent for query `Zürich`.
- Zürich Kreis/neighbourhood variants must not flood the initial dropdown when the primary city/airport are the useful choices.
- If two genuinely relevant places share the same name, both may appear with region/country disambiguation.

Do not hard-code the examples as one-off exceptions; improve ranking/category logic so equivalent cases behave correctly worldwide.

## 2. Workspace flight search — names first, IATA still supported

The current Workspace flight fields must no longer require visitors to know three-letter airport codes.

### Binding behaviour

1. `Von` / `Nach` accept airport name, city name and IATA input.
2. Reuse `/api/search/airports`; no new paid provider is required for this slice.
3. Typing e.g. `Zürich` / `Zurich` should open a compact suggestion list such as:
   - `Zürich Airport · ZRH`
   - `Zürich, Switzerland`
4. Typing `ZRH` must still find/select the same airport.
5. A selected option stores/uses the canonical IATA code required by the flight-search request, while the visible UI remains human-readable.
6. Do not submit an arbitrary unknown city string as though it were a valid airport code.
7. If a city maps to several plausible airports, show the choices; do not invent one silently.
8. If a trip origin/destination can be prefilled from **proven canonical airport evidence**, do so. If the trip only proves a city and several airports are plausible, require selection rather than guessing.
9. Preserve distinct states for loading / empty / unavailable / invalid. Never fake airport availability or flight-provider truth.
10. Preserve keyboard selection and accessible combobox semantics on desktop and mobile.

## 3. Presentation

- Keep result rows compact and finger-friendly.
- Primary line: human place/airport name.
- Secondary context: city/region/country as appropriate.
- For airports, IATA is visible as helpful context, not required prior knowledge.
- Type labels such as `Land`, `Stadt`, `Flughafen` may remain where useful.
- Dropdown must not cover an excessive portion of the mobile form when only a few high-relevance choices exist.

## 4. Truth / security boundaries

- Search suggestions are selection assistance, not a new source of persisted truth.
- Keep canonical place IDs and verified IATA codes at the data boundary.
- No free-text-to-ID invention.
- No new client-trusted provider fields.
- No change to commercial price/provider/availability semantics.
- No database write needed merely to search.
- Do not log sensitive form payloads.

## 5. Required tests

At minimum cover:

- `Peru` exact destination relevance
- `Zürich` / `Zurich` departure ranking: city + ZRH useful, remote/low-value variants do not dominate
- genuine same-name place disambiguation with region/country
- result-count/bounded dropdown behaviour on mobile-oriented rendering
- airport query by natural name/city (`Zürich`)
- airport query by IATA (`ZRH`)
- selecting an airport yields the correct IATA for `/api/flights/search`
- invalid/unselected natural text cannot masquerade as a three-letter airport
- keyboard ArrowUp/ArrowDown/Enter/Escape behaviour
- loading / empty / unavailable states
- existing TripPlanner place-confirmation contract remains intact
- no regression to flight-search provider/commercial truth contract
- typecheck, lint, tests, hygiene and production build

## 6. Delivery / agent stop rule

1. Start from current live `main`; re-check the SHA before coding.
2. Inspect existing place and airport ranking/search code before introducing new abstractions.
3. Keep changes bounded to this visitor-search slice and necessary tests/docs.
4. Open a **Draft PR**.
5. Report exact head, merge-base, ahead/behind, changed files, local tests, GitHub Actions exact-head evidence and Vercel exact-head evidence.
6. **STOP.** Do not mark Ready, do not merge, do not start a follow-up slice. Technical Lead performs the independent final review.
