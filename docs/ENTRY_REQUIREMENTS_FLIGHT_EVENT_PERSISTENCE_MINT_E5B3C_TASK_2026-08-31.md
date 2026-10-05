# Jetnity – Entry Requirements E5-B3C: Server-only Flight Event Persistence Payload Mint

Stand: 31. August 2026  
Status: **BINDING BOUNDED AGENT TASK / ISSUE #347 / DB-FREE / NO PRODUCTION APPLY / NO AUTO-FOLLOW-UP**

## 1. Baseline

Exakter Startpunkt:

`main@8868f91319f2747ca6f3dc8cb46ab0a40cba417b`

Branch:

`feat/entry-requirements-flight-event-persistence-mint-e5b3c-2026-08-31`

Issue:

`#347 – Entry Requirements E5-B3C – server-only Flight Event persistence payload mint`

Parent target:

`#294 – Entry Requirements Detail Architecture`

Fresh Technical-Lead live precheck verified before branch cut:

- Main CI #1539 / Run `33436658462`: **SUCCESS** on exact baseline;
- Vercel Production: **READY/SUCCESS** on exact baseline;
- ruleset `Jetnity main protection` / ID `21875372`: active, strict CI/Auth/Vercel + review-thread resolution + merge-only, bypass empty;
- no competing current runtime PR; #52/#50/#40/#39/#28 are historical Drafts;
- E5-B3B historical branch is fully integrated (`ahead=0`) and behind current main;
- last Cursor agent `Jetnity entry requirements provider retrieval timestamp 1`, Generation 1, session `bc-1b857acd-7a88-4355-9bc1-4f94ece44f9b`, is stopped;
- Vercel unresolved toolbar threads: 0;
- GitHub review threads on the last recovery/closure path: 0;
- Supabase Production `qscbgcdmivbbnzrcyegn`: E5-B3A relation/function/gate/roles remain absent and migration `20260831190000` remains unapplied;
- `flugNachweisAusUmgebung()` remains `null`;
- `requirementsProviderAus()` remains `null`.

## 2. Why E5-B3C is the smallest safe next slice

E5-B3A defines the repository-only SQL persistence contract:

- `vertrag = jetnity.flight_event_persistence.v1`;
- `mint = e5b2a_validated_snapshot`.

There is no TypeScript mint for it.

The required server-only ingredients now exist:

- E5-B1R: exact provider-observed Airport IANA timezone evidence;
- E5-B2A: exact uniquely resolved Airport event-instant evidence;
- E5-B3B: exact server-observed provider snapshot time `FlugProviderTreffer.retrievedAt`.

A future writer must not reconstruct these facts after the provider snapshot has been lost. E5-B3C therefore builds **only the deterministic validated server-side payload mint**.

It does **not** apply or call the database, does not activate `flugNachweis`, and does not activate a provider/secret/paid path.

## 3. Binding truth rule

> **One validated server-side `FlugProviderTreffer` snapshot + one exact selected option from that same snapshot + a future server-known `tripItemId` → one deterministic E5-B3A persistence payload.**

No browser/client `FlugOption`, actor/source marker, timestamp, timezone, event instant or `eventRef` may establish provenance.

> **`retrieved_at` and `observed_at` must come from E5-B3B `FlugProviderTreffer.retrievedAt`. The mint must never call `Date.now()` or mint a second retrieval timestamp.**

## 4. Mandatory implementation

### 4.1 Dedicated server-only module

Create a small Next-/Supabase-/provider-SDK-free module under the existing domain, preferably:

`lib/flight-event-provenance/persistenz.ts`

Exact filename may differ if a better existing-domain fit is proven. Do not create a second provider, temporal, route or Commercial Provenance domain.

### 4.2 Server-owned snapshot input

The primary input must carry only what a future trusted server caller can legitimately know:

- `tripItemId`;
- selected `optionId`;
- the complete validated server-side `FlugProviderTreffer`.

The mint must locate the selected option **inside** `treffer.options`.

Fail closed when:

- selected option absent;
- selected option id duplicated/ambiguous;
- trip item id invalid for the repository contract;
- provider identity invalid/unusable;
- external reference invalid/unusable;
- retrieval timestamp invalid.

Do not accept a free-standing browser/client `FlugOption` plus separately supplied provenance values as proof.

### 4.3 Exact occurrence rebinding

For the selected option only, bind evidence by the full exact identity:

`optionId + legIndex + segmentIndex + endpoint + IATA`

For each provable occurrence:

- `local_date` / `local_time` come from the exact normalized selected `FlugSegment` endpoint;
- `time_zone` comes from the exact matching E5-B1R evidence;
- `event_instant` comes from the exact matching E5-B2A evidence;
- B1R and B2A timezone must agree exactly;
- duplicate/conflicting timezone evidence fails closed for that occurrence;
- duplicate/conflicting instant evidence fails closed for that occurrence;
- identity mismatch never first-picks or falls back;
- no Country/City/IATA-only occurrence search;
- no new timezone/DST resolution;
- no `Z` concatenation to local wall clock.

Only fully proven occurrences enter `occurrences`.

Unresolved endpoints must be explicit in the typed outcome and must never be invented. A later full-current-snapshot write may legitimately clear stale rows; therefore an empty proven occurrence set is not to be silently converted into old/stale truth.

### 4.4 Exact E5-B3A payload

The payload must match the current SQL repository contract:

```ts
{
  vertrag: 'jetnity.flight_event_persistence.v1',
  mint: 'e5b2a_validated_snapshot',
  trip_item_id: string,
  domain: 'flights',
  provider_id: string,
  source_kind: 'persisted_snapshot',
  persistenz: 'snapshot',
  source_label: null,
  external_ref: string,
  retrieved_at: string,
  observed_at: string,
  fresh_until: null,
  occurrences: Array<{
    leg_index: number,
    segment_index: number,
    endpoint: 'departure' | 'arrival',
    iata: string,
    local_date: string,
    local_time: string,
    time_zone: string,
    event_instant: string,
  }>,
}
```

The exact TypeScript type name is implementation-owned; contract semantics are not.

Rules:

- `provider_id` from the selected server-proven option/snapshot identity, never client actor/source metadata;
- `external_ref` from the exact selected server-proven option;
- `retrieved_at === observed_at === treffer.retrievedAt` after strict validation;
- `fresh_until` stays `null`; E5-B3B is observation time, not a freshness guarantee;
- no `occurrence_event_ref` in the TS payload — SQL generates it server-side;
- no provider-belegt flag from client/input; E5-B3A writer owns that invariant.

### 4.5 Typed fail-closed result

Normal invalid/missing evidence must return typed failure/partial evidence rather than relying on exceptions.

At minimum distinguish semantically:

- `invalid_trip_item_id`;
- `selected_option_missing`;
- `selected_option_ambiguous`;
- `invalid_provider_identity`;
- `invalid_external_ref`;
- `invalid_retrieved_at`;
- occurrence identity mismatch;
- duplicate/conflicting timezone evidence;
- duplicate/conflicting event-instant evidence;
- timezone/instant evidence mismatch;
- invalid local endpoint wall clock;
- unresolved/partial occurrence evidence.

Exact names may be refined; first-row-wins is forbidden.

### 4.6 Raw-client rejection boundary

Add a narrow helper/regression proving a raw client-style provenance object cannot be mistaken for the validated E5-B3A persistence contract.

Align with the SQL deny-list/allow-list semantics. Do not create a looser parallel contract.

## 5. Mandatory tests

At minimum:

1. direct single-segment option produces exactly departure + arrival when both endpoints have exact B1R+B2A evidence;
2. multi-leg/multi-segment option preserves exact deterministic identity/order;
3. selected option B cannot consume option A evidence;
4. duplicate selected option id fails closed, no first match;
5. wrong B1R leg/segment/endpoint/IATA cannot bind;
6. wrong B2A leg/segment/endpoint/IATA cannot bind;
7. duplicate/conflicting B1R evidence fails closed;
8. duplicate/conflicting B2A evidence fails closed;
9. B1R/B2A timezone disagreement fails closed;
10. local date/time only from selected normalized segment endpoint;
11. no local wall-clock `Z` concatenation or timezone recalculation;
12. `retrieved_at === observed_at === treffer.retrievedAt` exactly;
13. timestamp-like provider/browser payload fields cannot override `treffer.retrievedAt`;
14. no `Date.now()` / implicit-now path; identical input yields deterministic payload;
15. `fresh_until === null`;
16. missing/unresolved endpoint is explicit and no fake occurrence exists;
17. zero proven occurrences is explicit and compatible with future full-current-snapshot clearing;
18. provider id / external ref bounds match E5-B3A SQL constraints;
19. no client/server `occurrence_event_ref` accepted or minted by TS;
20. `FlugOption`, `FlugSegment`, browser response, route itinerary, trip metadata unchanged;
21. `flugNachweisAusUmgebung()` stays `null`;
22. no Supabase/API/private-writer invocation exists;
23. E5-B1R/B2A/B3B tests remain green;
24. E5-B3A repository SQL-contract tests remain green;
25. full repository Typecheck/Lint/Tests/Hygiene/Production Build green.

## 6. Duplicate / integration precheck

Must reuse:

- `lib/flights/provider.ts` — `FlugProviderTreffer`, B1R/B2A types, E5-B3B retrieval timestamp;
- `lib/flights/domain.ts` — normalized flight option/segment and local wall-clock facts;
- `supabase/migrations/20260831190000_trip_item_flight_event_provenance.sql` — binding repository writer contract;
- `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts` — repository contract regression;
- `lib/commercial-provenance/persistenz.ts` — **pattern reference only**, never overload Commercial Provenance.

Do not import E5-A projection into the mint. The dependency direction is event provenance → later anchor binding/projection, not projection → persistence.

Before adding a helper, search for existing generic UUID/ISO/IATA validators. Reuse only if the domain layering remains correct; do not create an unsafe cross-domain dependency merely to save a few lines.

## 7. Hard non-scope

Absolutely do **not** implement:

- Supabase Production migration apply;
- Production RLS/grant/role/function mutation;
- runtime/login principal allocation;
- call to `jetnity_internal.trip_item_flight_event_provenance_schreiben`;
- DB writer/backfill/read integration;
- generated Production Supabase types for an unapplied table;
- `flugNachweisAusUmgebung()` implementation;
- account flight-adoption activation;
- browser/client provenance exposure;
- flight-search contract changes;
- provider refresh/refetch path;
- provider/vendor/secret/API key/paid/live activation;
- Commercial Provenance changes;
- Trip/Route → `OfficialTemporalAnchor` resolver;
- E5-A automatic binding;
- concrete deadlines/action windows/urgency;
- task persistence/completion;
- reminders/push/email/notifications;
- Requirements provider activation;
- credential/passport ranking;
- Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health storage;
- new dependencies;
- follow-up slice.

`flugNachweisAusUmgebung()` remains `null`.  
`requirementsProviderAus()` remains `null`.

## 8. Product-Owner gates

No special Product-Owner gate for this exact DB-free, invocation-free, cost-neutral slice.

STOP for explicit Product-Owner approval before any later action that:

- applies E5-B3A to Production;
- mutates Production RLS/grants/roles/functions;
- allocates a runtime/login principal;
- activates a real application writer/backfill;
- activates provider/secret/paid/live paths;
- creates public/irreversible effects or unapproved running cost.

## 9. Deliverables

Agent must deliver:

- runtime mint module + focused tests;
- `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_STATUS_2026-08-31.md`;
- `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_HANDOFF_2026-08-31.md`;
- `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_SELF_REVIEW_2026-08-31.md`;
- only small ARCHITECTURE/DECISIONS updates if actually required by implemented semantics.

`docs/ACTIVE_WORK_STATUS.md` and `JETNITY_START_HERE.md` are Technical-Lead-owned and must not be edited by Cursor.

Self-review is not a Technical-Lead PASS.

## 10. Gates before delivery

Agent runs and records:

- Typecheck;
- Lint;
- full tests;
- Admin API protection;
- schema reference check;
- unreachable/dead code;
- unused exports;
- unused packages;
- Production build.

Before handoff, re-read `origin/main` live and report exact ahead/behind.

## 11. Agent / STOP

Fresh Cursor agent:

**`Jetnity entry requirements flight event persistence mint 1`**, Generation 1.

Agent may not:

- mark PR Ready;
- merge;
- mutate Production;
- start a follow-up slice.

After implementation + docs + gates, STOP for independent Technical-Lead exact-head review.

Any new push invalidates prior exact-head evidence.
