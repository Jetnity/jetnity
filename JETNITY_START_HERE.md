# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B3C CLOSED & POST-MERGE VERIFIED / NO ACTIVE FOLLOW-UP SLICE / PRODUCTION FLIGHT EVENT PROVENANCE UNAPPLIED / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3C_CLOSED_2026-08-31.md` ← **aktuellster Closure-/Continuity-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3C_REVIEW_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_HANDOFF_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_SELF_REVIEW_2026-08-31.md`
6. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_TASK_2026-08-31.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3B_CLOSED_2026-08-31.md`
8. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_CLOSED_2026-08-31.md`
9. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
10. E5-B1R Closure/Handoff
11. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
12. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
13. `docs/JETNITY_BINDING_BUILD_ORDER.md`
14. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Current verified main

Runtime/repository main after E5-B3C:

`main@8663fded8a8f7381450a30f4b919a1aca5bc49f6`

Commit:

`Merge Entry Requirements E5-B3C server-only persistence mint (#349)`

Post-merge verification on exact runtime main:

- Main CI #1550 / Run `33442405068`: **SUCCESS**;
- Vercel Production deployment `dpl_B77qNkMXEpeXhco65tTumvw9zCVW`: **READY**;
- Issue #347: **CLOSED / completed**.

This docs-only closure may advance the canonical main SHA after its own merge without changing runtime behavior. Always read live `main` rather than assuming the SHA above is still the repository tip.

## 3. E5-B3C final history

Issue:

**#347 – Entry Requirements E5-B3C – server-only Flight Event persistence payload mint**

Agent:

**`Jetnity entry requirements flight event persistence mint 1`**, Generation 1

Cursor session:

`bc-8579f2af-62df-45f3-b15b-d9a1d2d4c180`

Review history:

- initial head `5473cd851942055ead8a1bd4b055861ecd6d5ada`: **CHANGES REQUIRED**;
- same-session review-fix/runtime head `0d80514b0aac49fec0760d95ef126ed2e845eda2`: **independent TL PASS**;
- final TL/recovery head `6e704867fb1c3cd09d875da9a6215ae27008f19b`;
- original Draft PR #348: **CLOSED / NOT MERGED** due known connected GitHub `Repository.fullDatabaseId` Ready error;
- Recovery PR #349: **MERGED** after fresh gates;
- runtime/repository merge: `8663fded8a8f7381450a30f4b919a1aca5bc49f6`.

No new agent or generation was used for the review-fix.

## 4. E5-B3C truth now integrated

The Flight Event persistence mint is:

- server-only;
- DB-free;
- writer-invocation-free;
- client-provenance-free.

It binds one uniquely selected option from the same server-side `FlugProviderTreffer` to exact E5-B1R timezone and E5-B2A event-instant Evidence.

Binding invariants include:

- exact identity `optionId + legIndex + segmentIndex + endpoint + IATA`;
- duplicate/conflicting Evidence fails closed;
- exact + contradictory sibling IATA fails closed;
- local date/time only from selected normalized segment endpoint;
- B1R/B2A timezone agreement required;
- impossible UTC calendar instant rejected;
- `leg_index` / `segment_index` 0..99;
- at most 200 proven Occurrences;
- `retrieved_at === observed_at === treffer.retrievedAt`;
- no second observation timestamp;
- `fresh_until = null`;
- no TypeScript `occurrence_event_ref`;
- `import 'server-only'` boundary;
- no Supabase/API/private-writer call.

Missing Evidence remains explicit as unresolved; no fake Occurrence is invented.

## 5. Production remains closed

Supabase Production project:

`qscbgcdmivbbnzrcyegn`

Fresh E5-B3C read-only verification confirmed absent/unapplied:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`;
- migration `20260831190000`.

No Production mutation occurred.

`flugNachweisAusUmgebung()` remains `null`.  
`requirementsProviderAus()` remains `null`.

## 6. Product-Owner gates remain binding

Explicit Product-Owner approval is required before any future:

- E5-B3A Production migration apply;
- Production RLS/grant/role/function mutation;
- runtime/login principal allocation;
- real application writer/backfill;
- provider/vendor/DPA/secret/paid/live activation;
- fundamental Auth/MFA/AAL change;
- sensitive passport/MRZ/scan/biometric/health storage change;
- real payment or spend outside approved limits;
- public/irreversible external activation.

## 7. Risk state

### P0
None open from completed E5-B3C.

### P1
None open from completed E5-B3C.

### P2
None open inside completed E5-B3C scope.

Intentionally inactive/gated capabilities remain outside that completion verdict.

### P3

- E5-B3B host-server observation clock has no independent NTP attestation;
- future full-current-snapshot writer needs an explicit complete-vs-partial write policy.

## 8. Current programme state

**NO ACTIVE FUNCTIONAL FOLLOW-UP SLICE.**

Do not automatically dispatch an agent or infer the next implementation from E5-B3C.

The first action in a future work cycle is a fresh live reconstruction/precheck against:

- current `main`;
- open PRs/issues;
- latest continuity;
- binding build order and target architecture;
- CI/Vercel;
- relevant Supabase Production truth.

Only then determine the smallest safe next slice. If that step crosses a Product-Owner gate, stop for explicit approval.

**Production Flight Event Provenance remains UNAPPLIED.**

**Live-Evidence wins always.**
