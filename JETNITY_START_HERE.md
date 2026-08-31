# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B3C TECHNICAL-LEAD PASS ON RUNTIME HEAD / FINAL DOCS-ONLY EXACT-HEAD RE-GATE REQUIRED / PRODUCTION EVENT PROVENANCE UNAPPLIED / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/ACTIVE_WORK_STATUS.md` ← **aktueller aktiver Status**
2. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3C_REVIEW_2026-08-31.md` ← **aktueller unabhängiger TL-Review**
3. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_HANDOFF_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_SELF_REVIEW_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_TASK_2026-08-31.md`
6. Issue **#347** und Draft-PR **#348**
7. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3B_CLOSED_2026-08-31.md`
8. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_CLOSED_2026-08-31.md`
9. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
10. E5-B1R Closure/Handoff
11. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
12. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
13. `docs/JETNITY_BINDING_BUILD_ORDER.md`
14. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Aktueller Live-Baseline-main

`main@8868f91319f2747ca6f3dc8cb46ab0a40cba417b`

Commit:
`Close Entry Requirements E5-B3B continuity (#346)`

Main blieb während des E5-B3C Runtime-Reviews unverändert.

## 3. Aktiver Slice E5-B3C

Issue:
**#347 – Entry Requirements E5-B3C – server-only Flight Event persistence payload mint**

Draft-PR:
**#348**

Branch:
`feat/entry-requirements-flight-event-persistence-mint-e5b3c-2026-08-31`

Task:
`docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_TASK_2026-08-31.md`

Agent:
**`Jetnity entry requirements flight event persistence mint 1`**, Generation 1

Cursor session:
`bc-8579f2af-62df-45f3-b15b-d9a1d2d4c180`

Independent TL-reviewed runtime head:
`0d80514b0aac49fec0760d95ef126ed2e845eda2`

Runtime-head comparison at review:
**9 ahead / 0 behind**, merge-base exact baseline main.

Technical-Lead verdict on that runtime head:
**PASS / no open P0-P1-P2 inside E5-B3C scope.**

Important: the TL review/continuity commits made after that runtime review create a new docs-only PR head. The final docs-only descendant must receive fresh exact-head CI/Vercel/thread/main gates before Ready/Merge.

## 4. Review history

Initial agent delivery head `5473cd851942055ead8a1bd4b055861ecd6d5ada` was rejected with CHANGES REQUIRED.

Blocking findings were:

1. exact Evidence plus contradictory sibling IATA could avoid fail-closed behavior;
2. no technical `server-only` marker;
3. missing E5-B3A occurrence bounds in the TypeScript mint;
4. invalid calendar event-instants could be normalized by JavaScript.

The **same Cursor session**, same agent and same Generation 1 performed the immediate review-fix. All four findings are now closed and regression-covered on `0d80514b...`.

## 5. Binding E5-B3C truth now implemented

The mint is server-only and DB-free.

It requires:

- future server-known `tripItemId`;
- selected `optionId` uniquely present in the same server-side `FlugProviderTreffer`;
- exact E5-B1R timezone Evidence;
- exact E5-B2A event-instant Evidence;
- exact E5-B3B `treffer.retrievedAt`.

Mandatory invariants:

- occurrence identity = `optionId + legIndex + segmentIndex + endpoint + IATA`;
- no first-match on duplicate/conflicting Evidence;
- exact + contradictory sibling IATA = fail closed;
- local date/time only from the selected segment endpoint;
- B1R/B2A timezones must agree;
- impossible UTC calendar instants are rejected;
- `leg_index` / `segment_index` stay 0..99;
- at most 200 proven Occurrences;
- `retrieved_at === observed_at === treffer.retrievedAt`;
- no second `Date.now()` observation;
- `fresh_until = null`;
- no TypeScript `occurrence_event_ref`;
- no browser/client actor/source/timestamp/timezone/instant/eventRef trust;
- no Supabase/API/private-writer invocation;
- `import 'server-only'` protects the module boundary.

Missing Evidence remains explicit as `unresolved`; no fake occurrence is invented.

## 6. Exact runtime-head gates already passed

On exact reviewed runtime head `0d80514b...`:

- GitHub Actions CI #1545 / Run `33440664269`: **SUCCESS**;
- Typecheck: SUCCESS;
- Lint: SUCCESS;
- full tests: SUCCESS;
- Admin API/schema/hygiene checks: SUCCESS;
- Production build: SUCCESS;
- Auth config check: SUCCESS;
- Vercel Preview: **READY**;
- Vercel unresolved toolbar threads: **0**;
- GitHub inline review threads: **0**.

These gates do **not** automatically apply to the newer TL docs-only descendant. Re-gate final head before Ready/Merge.

## 7. Production remains closed

Supabase Production project:
`qscbgcdmivbbnzrcyegn`

Fresh read-only verification after the review-fix confirmed absent/unapplied:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`;
- migration `20260831190000`.

No Production mutation occurred.

`flugNachweisAusUmgebung()` remains `null`.  
`requirementsProviderAus()` remains `null`.

## 8. Product-Owner gates

No special Product-Owner gate for merging this exact E5-B3C repository/server-only, DB-free, invocation-free and cost-neutral slice after final gates.

Explicit Product-Owner approval remains mandatory before:

- E5-B3A Production migration apply;
- Production RLS/grant/role/function mutation;
- runtime/login principal allocation;
- real application writer/backfill;
- provider/vendor/DPA/secret/paid/live activation;
- fundamental Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health storage changes;
- real payments;
- spend outside approved budget;
- public/irreversible external activation.

## 9. Current risks

### P0
None open.

### P1
None open after the E5-B3C review-fix.

### P2
None open inside E5-B3C scope.

Known gated/inactive capabilities are not defects of this slice:

- Production Flight Event Provenance;
- real writer/runtime principal;
- account flight adoption;
- Trip/Route occurrence resolver and E5-A autobinding;
- deadlines/tasks/reminders;
- real Requirements provider and credential ranking.

### P3
- E5-B3B host-server clock has no independent NTP attestation;
- future writer needs a complete-vs-partial snapshot policy;
- historical Draft PRs remain non-current evidence.

## 10. FIRST NEXT ACTION

Reconstruct the **final TL docs-only PR head** and re-run exact-head gates:

1. head / merge-base / ahead-behind;
2. actual final diff;
3. GitHub Actions;
4. Vercel Preview;
5. GitHub review threads and Vercel toolbar threads;
6. current `main`.

If all remain clean, the Technical Lead may mark PR #348 Ready and merge autonomously. No Product-Owner approval is required for this exact merge.

No follow-up functional slice starts automatically.

**Live-Evidence wins always.**
