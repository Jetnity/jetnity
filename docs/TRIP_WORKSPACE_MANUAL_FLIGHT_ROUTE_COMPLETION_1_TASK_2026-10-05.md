# Trip Workspace Manual Flight Route Completion 1 — Task

Date: 5 October 2026
Issue: #836
Status: **BINDING / B03b / MANUAL FLIGHT ROUTE COMPLETION / NO DB MIGRATION / NO PROVIDER FACT REWRITE**

## 1. Live baseline

- main: `58d2781d4b48cfdc8f9131f374f90d9b96a10787`
- mode: `NORMAL`
- #832/#833 and #834/#835 closed/post-merge verified
- Development Official Truth hardening apply is complete but unrelated to this slice
- no active implementation writer at dispatch

Re-read main/mode/#751/#748/open PRs before edits. Live evidence wins. STOP on overlapping writer or material drift.

## 2. Writer

Logical writer: **Jetnity Trip Workspace manual flight route completion 1**, Generation 1.

Execution: **Codex Desktop**
Required model: **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

No Cursor. No replacement writer. Remain Draft.

## 3. Goal

Complete the visible manual-flight data flow without weakening Route Truth.

A manual user-owned flight may receive one structured flight leg containing **1–4 contiguous air segments**.

Each segment input may contain only:
- origin IATA;
- destination IATA;
- departure date;
- optional departure local time;
- arrival date;
- optional arrival local time.

The user does **not** submit:
- countryCode;
- city;
- country;
- surfaceFromAirportCode;
- transit-country claims;
- provider/commercial identity.

The resulting canonical `TripItem.routeItinerary` remains the only route/transit truth input.

## 4. Manual-only boundary

The editor/update path is allowed only when:
- `kind === 'flight'`;
- `provider == null`;
- `externalRef == null`;
- `bookingUrl == null`.

Booking status/source does not by itself make a manual flight provider-backed.

Use one shared pure predicate if needed.

Provider/search-result flights are display-only for this editor.

## 5. Input contract

Create one narrow input schema/helper.

Requirements:
- 1–4 segments;
- IATA = exactly 3 ASCII letters after trim/uppercase;
- origin != destination;
- segment 2+ origin must exactly equal prior segment destination;
- no manual surface-transfer claim in this slice;
- valid `YYYY-MM-DD`;
- optional time either null/empty or valid `HH:MM`;
- segment arrival must not be before its departure when comparable;
- next segment departure must not precede previous segment arrival when enough date/time information exists;
- reject unknown extra keys;
- reject user country/city/countryCode/surfaceFrom fields;
- bounded object/array sizes.

Do not infer missing airports, dates or times from title/note/trip/stage.

## 6. Account canonicalization

Add one narrow server action, e.g. `flugRouteManuellSetzen`.

Server flow:
1. validate untrusted input;
2. authenticate using existing `konto()`;
3. pre-read exact `trip_items` row by `trip_id + item_id`;
4. require manual-flight boundary;
5. collect every unique IATA code;
6. resolve those codes using the existing server-side airport reference path (`flughafenReferenzLesen` / `public.airports`);
7. **every submitted IATA must resolve**; unknown IATA => fail before write;
8. build canonical `FlugRouteItinerary` with country/city/country values only from server-held airport references;
9. no `surfaceFromAirportCode`;
10. validate/canonicalize through existing route schema;
11. preserve any unrelated metadata keys while replacing only `metadata.routeItinerary`;
12. update only:
   - `metadata`
   - `starts_on`
   - `starts_at`
   - `ends_on`
   - `ends_at`
13. derive item start from first segment departure and item end from final segment arrival;
14. repeat exact manual-flight guards in the UPDATE itself to close races;
15. RLS remains ownership authority;
16. existing DB trigger remains final canonicalization defense;
17. fail if returned update row is absent;
18. sanitize DB errors;
19. revalidate only on success.

Do not update title/note/day/stage/position/provider/external_ref/booking_url/price/booking fields.

## 7. Guest path

Add one narrow guest helper, e.g. `gastFlugRouteManuellSetzen`.

Guest/localStorage cannot claim airport reference truth.

Therefore:
- validate the same IATA/date/time contract;
- exact item id must match exactly one item across days + `ohneTag`;
- require manual-flight boundary;
- build route points with:
  - submitted IATA;
  - `countryCode=null`;
  - `city=null`;
  - `country=null`;
- no `surfaceFromAirportCode`;
- replace only routeItinerary + startsOn/startsAt/endsOn/endsAt on the target;
- preserve every sibling and every other target field;
- persist through existing `gastreiseSpeichern` and schema validation.

Guest route may display IATA but must not fabricate transit/destination country facts. Guest→Account existing canonicalization remains the path that can later attach server-held airport facts.

## 8. UI

In `FlugBestand`, for manual editable flight items:
- if no usable route: show `Flugroute ergänzen`;
- if route exists: show `Flugroute ändern`;
- prefill current IATA/date/time fields;
- support 1–4 contiguous segments;
- explicit add/remove segment controls;
- no autosave;
- explicit save/cancel;
- bounded inline validation;
- provider-backed flight has no manual route editor;
- route display remains through existing `FlugRoute`;
- booking action remains separate.

Accessible:
- labelled inputs;
- keyboard-operable add/remove/save/cancel;
- errors with appropriate alert/status semantics;
- no horizontal overflow at narrow mobile widths.

## 9. Workspace wiring

Add only one narrow callback through Account/Guest -> `TripWorkspace` -> `FlugBestand`.

Example:
`onFlugRouteManuell?: (itemId, segments) => Promise<string | null>`

No generic arbitrary item update API.

## 10. Required tests

### Eligibility
- manual flight => editable;
- provider/externalRef/bookingUrl => not editable;
- non-flight => not editable;
- user booking status does not block manual editing.

### Input
- one valid direct segment;
- valid contiguous multi-segment;
- lowercase IATA normalizes;
- malformed IATA rejects;
- same origin/destination rejects;
- discontinuous segments reject;
- invalid calendar date rejects;
- invalid time rejects;
- impossible chronological reversal rejects;
- country/city/surface extra fields reject.

### Account
- exact trip+item pre-read;
- unknown/foreign/non-flight/provider-backed => no write;
- all IATAs resolved server-side;
- unknown airport => no write;
- client cannot inject country/city/countryCode/surface;
- canonical metadata contains server-held airport facts;
- UPDATE includes only metadata + start/end date/time;
- unrelated metadata retained;
- race conversion to provider/non-flight => no success;
- no revalidate on failure; revalidate on success.

### Guest
- exact one target required;
- day and ohneTag covered;
- route points carry IATA but country/city/country null;
- no surface evidence;
- siblings unchanged;
- target non-route fields unchanged;
- persistence/schema pass.

### Route/coverage
- before route, relevant coverage remains incomplete/unknown;
- after valid route, existing `routeFactsFuerPunkt` sees the itinerary;
- account canonical IATA refs can produce destination/transit country facts;
- guest IATA-only draft does not invent country facts;
- route chronology stays fail-closed.

### UI
- add/change affordance;
- provider flight no editor;
- existing fields prefilled;
- add/remove segments;
- invalid submit no callback;
- exact callback payload;
- success closes editor;
- error retains inputs;
- booking control unaffected.

## 11. Allowed files

Runtime only as genuinely required:
- `components/trips/FlugBestand.tsx`
- `components/trips/TripWorkspace.tsx`
- `components/trips/KontoArbeitsbereich.tsx`
- `components/trips/GastArbeitsbereich.tsx`
- `lib/trips/schema.ts`
- `lib/trips/aktionen.ts`
- `lib/trips/gastspeicher.ts`
- `lib/route/referenz.ts` only if a pure helper is needed, without weakening semantics
- `lib/route/flughafen-lesen.ts`
- optional one new bounded helper such as `lib/trips/flug-manuell.ts`

Tests:
- existing trip/route/guest/workspace tests
- at most one new narrowly scoped manual-flight test file

Docs:
- immutable TASK
- REPORT / HANDOFF / SELF_REVIEW for this slice

If a DB migration, new API route, different route trust model or another runtime surface is required: STOP.

## 12. Non-scope

Absolutely no:
- DB migration;
- stage/day reassignment;
- provider/search flight mutation;
- price/booking/provider/externalRef/bookingUrl editing;
- surface-transfer evidence;
- new airport truth source;
- Official Truth;
- U02/U03;
- B01;
- broad Workspace redesign;
- Production data mutation;
- provider network call;
- follow-up slice.

## 13. Validation

Run:
- git diff --check
- npm run check:operating-mode
- focused manual-flight / route / guest / workspace tests
- npm test
- npm run typecheck
- npm run lint
- npm run check:api-schutz
- npm run check:schema-bezug
- npm run check:dead
- npm run check:exports
- npm run check:deps
- npm run build

Before delivery re-read main/mode/#751/#748/PR, prove immutable task, exact changed files, merge-base/ahead/behind, review threads, model evidence, no hosted DB/Production mutation.

Create REPORT/HANDOFF/SELF_REVIEW. Keep Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready/merge/start U02/U03/B01/follow-up.
