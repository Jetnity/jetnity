# Jetnity – World Map 1 / Planned Account Truth

Stand: 2. September 2026  
Status: **ACTIVE CODING TASK / PHASE 1 JETNITY CORE / SINGLE_AGENT / TECHNICAL LEAD REVIEWS + READY + MERGES**

Issue: #419  
Canonical base: `main@7feb9960bdb4ddac07465ab7fc0a62d9d9fe28e6`  
Branch: `feat/phase-1-world-map-1-planned-truth`  
Cursor-Agent: **`Jetnity world map 1`**  
Generation: **1**

## 1. Why this slice now

Destination Essentials 1 is closed. Real Flight/Hotel/Activities/Official-provider work remains behind deferred Product-Owner/external gates. The binding V1 build order still lists a minimal World Map as an open Product Surface Gap.

Live reconstruction found:

- account `/account` and `/reisen` already load the authenticated account's trips through existing RLS-protected `reisenLaden()`;
- `public.trip_stages` already stores canonical `country_code`, `place_id`, `latitude`, and `longitude`;
- `TripStage` already exposes those fields in the application model;
- `TripSummaryStage` / `reisenLaden()` intentionally currently expose only `name` + `position`;
- Production currently has **no explicit visited/travel-history table or visited column**.

Therefore this first World Map slice must create useful map value from existing planned Trip Stage truth without inventing a visited history and without introducing a Production migration.

## 2. Binding truth contract

> **A past date, archived trip, trip status, stage order, location label or existing trip record is not evidence that the traveller actually visited that place.**

For this slice:

- **planned/account-trip truth** may come only from authenticated account trips and their canonical `trip_stages` fields;
- `countryCode` may only come from stored `trip_stages.country_code`;
- coordinates may only come from stored `trip_stages.latitude/longitude`;
- canonical place identity may only come from stored `trip_stages.place_id`;
- no geocoding, name matching or free-text country/place inference;
- confirmed `visited` truth has no source yet and therefore remains explicitly unavailable/not yet captured;
- no trip/status/date may silently become `visited`;
- missing coordinate/country/place evidence stays missing.

## 3. Product goal

Add a bounded, responsive **"Deine Welt"** surface to the authenticated account home that lets a traveller see where their Jetnity trips are planned, while honestly separating this from future confirmed visited-history truth.

The surface should feel like a real World Map feature, not a placeholder card, but it must remain V1-bounded and should not turn Account Home into another Trip Workspace.

## 4. Required implementation

### 4.1 Extend the existing summary read contract only as needed

Reuse `reisenLaden()` and the existing `TripSummary`/`TripSummaryStage` path.

Allow the summary stage to carry the canonical fields needed by the map:

- `countryCode: string | null`;
- `placeId: string | null`;
- `latitude: number | null`;
- `longitude: number | null`.

Requirements:

- update `UEBERSICHT_SPALTEN` to read only these already-existing stage columns in addition to existing `name`/`position`;
- map numeric DB values safely;
- keep existing `TripSummary` callers backward-compatible;
- update `tripAlsUebersicht()` so guest/application Trip→Summary projection does not silently drop the new stage fields;
- do not add a second account-trip query or N+1 read path;
- do not add service-role access or client-side ownership filtering; existing RLS remains the authority.

### 4.2 Deterministic World Map derivation

Create one small presentation/domain derivation for the World Map rather than putting truth decisions inside JSX.

It must:

- consume `readonly TripSummary[]`;
- produce planned map points only from stages with valid finite coordinates inside latitude/longitude bounds;
- preserve source trip/stage identity;
- expose explicit country codes only when stored;
- expose destinations without coordinates as unplotted known stage entries rather than silently dropping them;
- never derive `visited`;
- never derive a country from name, coordinates or `placeId`;
- never derive coordinates from name/country/placeId;
- never use date/status/archive as visit evidence;
- use exact non-null `placeId` as the only acceptable semantic place-deduplication key if deduplication is useful; stages without the same canonical `placeId` must not be merged merely because labels or coordinates look similar;
- keep duplicate trip/stage provenance available even if a display aggregate groups an exact canonical place;
- produce deterministic ordering independent of input array accidents where presentation ordering matters.

### 4.3 Account Home World Map surface

Integrate the map into the existing authenticated `/account` personal-home flow. Reuse the trips already supplied to `AccountUebersichtLive`; do not add an equal-rank top-level navigation domain in this slice.

Expected UX:

- heading such as `Deine Welt`;
- concise distinction between **in Jetnity planned** and **besucht bestätigt**;
- plotted planned locations when coordinates exist;
- truthful count/summary of explicit planned countries/places only from available data;
- destinations lacking coordinates remain discoverable in an accessible text/list fallback;
- visited section/state must say in substance that confirmed visited history is not yet captured, rather than showing `0 besucht` as if Jetnity knew the user had visited none;
- empty-account state should not fabricate a map history;
- account trip read error must stay an error, never an empty-world state;
- no commercial cards/search mounts/provider calls in this surface.

### 4.4 Map rendering and runtime boundaries

The map must be local/runtime-safe:

- **no external map API**;
- no runtime tile request;
- no Mapbox/Google/Here token;
- no geocoding API;
- no new recurring service cost;
- no remote geography fetch at runtime.

A small local SVG/geography asset or a small license-compatible pinned package may be used only if it materially improves a real map experience. If a dependency or geography asset is added:

- provenance/license must be documented in the handoff;
- package version must be pinned and lockfile updated;
- avoid bringing a large map stack when a small local implementation is sufficient;
- no user location tracking.

### 4.5 Accessibility / responsive quality

- same information architecture on mobile and desktop;
- map cannot be the only way to obtain the information;
- provide an accessible list/text representation;
- meaningful headings/labels;
- interactive markers, if any, must be keyboard reachable and use Jetnity-consistent minimum touch targets (~44 px);
- no hover-only essential information;
- visible focus state;
- avoid horizontal page overflow;
- map must remain usable with no plotted coordinates.

## 5. Required tests / regression protection

Add deterministic tests for at least:

1. `TripSummaryStage`/summary projection preserves explicit `countryCode`, `placeId`, latitude and longitude;
2. `reisenLaden()` summary select contains the required canonical stage fields and does not introduce a second query path;
3. valid stored coordinates become planned map points;
4. invalid/missing coordinates do not become guessed points;
5. missing `countryCode` never becomes an inferred country;
6. past dates, `archived`, `booked`, `planned`, `draft` or any trip status never produce `visited=true` or equivalent;
7. same exact non-null `placeId` may aggregate without losing trip/stage provenance;
8. same label / same country / similar coordinates without identical canonical `placeId` are not silently merged as one place;
9. stages without coordinates stay visible in the accessible fallback derivation;
10. account load error remains distinguishable from empty account/map state;
11. World Map does not auto-mount/trigger Flight/Hotel/Activities commercial searches;
12. no external map/geocoding runtime endpoint is introduced.

Run relevant existing account/trip-summary tests as regression coverage.

## 6. Hard non-scope

Do **not** change or introduce:

- Supabase schema/migrations/RLS/grants/roles/functions;
- Production data mutation for World Map;
- visited/travel-history persistence or write UI;
- inference that past/archived/completed-looking trips were visited;
- Auth/session/MFA/AAL;
- Account Traveller Registry / citizenship/document contracts;
- provider selection, application/contact/terms/DPA/secrets/paid/live calls;
- Production S6;
- Commercial Provenance runtime writer;
- TW-8/TW-9;
- Hotel/Activities provider paths;
- service worker/offline/push;
- public indexing/domain cutover;
- payments;
- native app architecture;
- Social/Collaboration;
- full Account IA redesign;
- follow-up World Map visited-persistence slice.

If the implementation discovers that correct planned-map rendering genuinely requires a new DB contract, migration, Production permission, external map service or another Product-Owner gate, **STOP and report it** rather than crossing the boundary.

## 7. Multi-Agent Suitability

**Decision: SINGLE_AGENT.**

Reason:

- the slice is tightly coupled across the same `TripSummaryStage` contract, `reisenLaden()` projection, World Map derivation, Account Home rendering and regression tests;
- parallel writers would likely touch the same central trip/account files and could create divergent map truth contracts;
- there is no independent backend migration or external research workstream in scope;
- a second coding agent would add coordination risk without meaningful speed gain.

## 8. Required validation / evidence

On the final exact agent head provide:

- focused World Map tests;
- relevant existing Account/Trip summary tests;
- full repository test suite;
- TypeScript/typecheck;
- lint;
- repository hygiene gates required by CI;
- Production build;
- Vercel Preview on exact head;
- mobile + desktop acceptance evidence for `/account`;
- no horizontal overflow / keyboard/focus check;
- browser console/runtime error check;
- exact changed-file list;
- dependency/asset license evidence if a map asset/package is added;
- explicit proof that no DB/Auth/provider/visited persistence/external runtime map call entered the diff;
- fresh `origin/main` drift report before handoff.

## 9. Governance / STOP

Cursor-Agent exact logical name: **`Jetnity world map 1`**  
Generation: **1**.

The agent must:

- implement only this slice;
- perform adversarial self-review;
- persist a clear handoff/status if useful;
- push the final exact head;
- **DO NOT mark Ready**;
- **DO NOT merge**;
- **DO NOT start a follow-up slice**;
- stop at **`STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW`**.

Technical-Lead review is independent. Agent self-review, green tests, CI or Vercel are not a PASS by themselves.

## 10. Acceptance principle

> **World Map 1 may show only places Jetnity can locate from existing canonical account-trip evidence. A planned trip is not proof of a visit. Missing visit truth stays missing.**
