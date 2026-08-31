# Jetnity – Technical-Lead Review – Entry Requirements E5-B3C

Stand: 31. August 2026  
Status: **INDEPENDENT TECHNICAL-LEAD PASS ON RUNTIME REVIEW HEAD / TL CONTINUITY UPDATE + FINAL EXACT-HEAD RE-GATE REQUIRED BEFORE READY/MERGE**

Issue: #347  
Draft-PR: #348  
Branch: `feat/entry-requirements-flight-event-persistence-mint-e5b3c-2026-08-31`  
Agent: **`Jetnity entry requirements flight event persistence mint 1`**, Generation 1  
Cursor session: `bc-8579f2af-62df-45f3-b15b-d9a1d2d4c180`

## 1. Exact reviewed runtime head

`0d80514b0aac49fec0760d95ef126ed2e845eda2`

Baseline / merge-base:

`main@8868f91319f2747ca6f3dc8cb46ab0a40cba417b`

Fresh comparison at review time:

- ahead: **9**;
- behind: **0**;
- merge-base: exact baseline main;
- changed files: only TL preparation/continuity, E5-B3C runtime/tests and agent delivery docs;
- no Supabase migration, API route, Trip/Route, Readiness provider, Commercial Provenance, package or Production configuration change.

## 2. Review history

Initial agent delivery was **not accepted**.

Technical Lead issued CHANGES REQUIRED on prior head `5473cd851942055ead8a1bd4b055861ecd6d5ada` for:

1. P1: exact Evidence plus sibling coordinate with contradictory IATA could be silently first-picked;
2. P2: missing technical `server-only` boundary;
3. P2: TypeScript mint did not itself enforce E5-B3A occurrence index/count bounds;
4. P2: event-instant validation could accept JavaScript-normalized impossible calendar dates.

Binding governance was followed: the review-fix stayed in the **same Cursor session**, same logical agent and same Generation 1. No new agent or follow-up slice was opened.

## 3. Independent re-review result

All four blocking findings are closed on `0d80514b...`.

### 3.1 Evidence ambiguity / no first-match

`evidenceKlassifizieren()` now distinguishes exact, mismatch, conflict and absent. If the same `optionId + legIndex + segmentIndex + endpoint` contains both the expected IATA and a contradictory sibling IATA, the result is `conflict` and the mint returns `ok: false`.

This is enforced for both:

- E5-B1R `airportTimezoneEvidence`;
- E5-B2A `airportEventInstantEvidence`.

Regression coverage proves the exact row is not silently selected.

### 3.2 Server-only boundary

`lib/flight-event-provenance/persistenz.ts` now contains:

`import 'server-only'`

The mint remains Next-/Supabase-/provider-SDK-/DB-free and has no browser/client import path in the reviewed contracts.

### 3.3 E5-B3A writer-compatible bounds

The mint now fails closed before payload output when:

- `leg_index` could exceed 99;
- `segment_index` could exceed 99;
- more than 200 proven occurrences would be emitted.

It therefore does not produce a payload that violates those binding E5-B3A writer limits.

### 3.4 Strict event-instant calendar validation

`eventInstantLesen()` now parses UTC calendar/time components and verifies that the reconstructed UTC date preserves every component. Impossible values such as `2026-02-30T08:15:00Z` are rejected instead of being accepted through JavaScript date normalization.

No new timezone/DST resolution was introduced.

## 4. Binding truth preserved

Verified:

- selected option must be unique inside the same `FlugProviderTreffer`;
- exact occurrence identity remains `optionId + legIndex + segmentIndex + endpoint + IATA`;
- `local_date` / `local_time` come only from the selected normalized segment endpoint;
- `time_zone` comes only from exact E5-B1R Evidence;
- `event_instant` comes only from exact E5-B2A Evidence;
- B1R/B2A timezones must agree;
- duplicates/conflicts fail closed;
- missing Evidence remains explicit `unresolved` and does not create fake Occurrences;
- `retrieved_at === observed_at === treffer.retrievedAt`;
- no `Date.now()` / second observation timestamp;
- `fresh_until === null`;
- no TypeScript `occurrence_event_ref`;
- no browser/client provenance is trusted;
- no Supabase/API/private-writer invocation exists;
- `flugNachweisAusUmgebung()` remains `null`;
- `requirementsProviderAus()` remains `null`;
- no automatic E5-A binding, deadline, task or reminder runtime was added.

## 5. Exact-head gates on reviewed runtime head

GitHub Actions CI #1545 / Run `33440664269`: **SUCCESS** on exact `0d80514b...`.

Verified successful CI stages include:

- setup check;
- Typecheck;
- Lint;
- full tests;
- Admin API protection;
- schema reference check;
- dead/unreachable code check;
- unused exports;
- unused packages;
- Production build;
- Auth configuration against `config.toml`.

Agent-reported focused/full test counts were also consistent with CI delivery evidence: focused mint 34/34 and repository tests 3049/3049.

Vercel Preview:

- exact head `0d80514b...`: **READY**;
- deployment `dpl_AvvPGm3sQJLwyckFfJ9dkzG9pEcC`;
- unresolved toolbar threads: **0**.

GitHub inline review threads: **0**.

## 6. Production / Supabase truth

Fresh read-only verification against Production project `qscbgcdmivbbnzrcyegn` on 31 August 2026 confirmed all still absent/unapplied:

- `public.trip_item_flight_event_provenance`: absent;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`: absent;
- `jetnity_internal.flight_event_write_runtime_gate`: absent;
- `jetnity_flight_event_writer`: absent;
- `jetnity_flight_event_runtime`: absent;
- migration `20260831190000`: unapplied.

No Production mutation was performed during this review.

## 7. Risk verdict

### P0

None open.

### P1

None open after review-fix.

### P2

None open **inside E5-B3C scope**.

Known gated/incomplete capabilities remain intentionally inactive:

- Production Flight Event Provenance;
- runtime/login writer principal;
- real DB writer/backfill;
- account `flugNachweis` adoption;
- Trip/Route occurrence resolver into E5-A;
- automatic temporal binding/deadlines/tasks/reminders;
- real Requirements provider/credential ranking.

These are not E5-B3C defects and must not be auto-activated.

### P3

- E5-B3B observation time is host-server-observed and has no independent NTP attestation;
- a future writer must define an explicit complete-vs-partial snapshot policy before writing partial/empty mint results.

## 8. Product-Owner gates

E5-B3C itself is DB-free, invocation-free, provider-activation-free and cost-neutral. No special Product-Owner approval is required for this merge.

Explicit Product-Owner approval remains mandatory before any later:

- E5-B3A Production migration apply;
- Production RLS/grant/role/function mutation;
- runtime/login principal allocation;
- real writer/backfill activation;
- provider/vendor/DPA/secret/paid/live activation;
- public/irreversible external effect or unapproved spend.

## 9. Technical-Lead verdict

**PASS / NO OPEN P0-P1-P2 ON RUNTIME REVIEW HEAD `0d80514b0aac49fec0760d95ef126ed2e845eda2`.**

The Technical Lead is now updating TL-owned continuity files. Those docs-only commits create a new PR head and therefore invalidate earlier Exact-Head gates. Before Ready/Merge, re-run and independently verify CI, Vercel, review threads, `main`, merge-base and ahead/behind on the final docs-only descendant.

No follow-up slice may start automatically.