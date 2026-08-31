# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B3B CLOSED & POST-MERGE VERIFIED / PRODUCTION EVENT PROVENANCE UNAPPLIED / NO ACTIVE FOLLOW-UP SLICE / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3B_CLOSED_2026-08-31.md` ← **aktuellster Entry-Requirements Closure-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3B_REVIEW_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_HANDOFF_2026-08-31.md`
5. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_CLOSED_2026-08-31.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
7. E5-B1R Closure/Handoff
8. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
9. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Aktueller verifizierter Runtime-/Repository-main vor dieser docs-only Closure

`main@9fb1e801fb6f7bf6f5f54fea6763f4b7f784def7`

Commit:
`Merge E5-B3B server-observed provider retrieval timestamp (#345)`

Post-merge verified:

- Main CI #1537 / Run `33435736002`: **SUCCESS**;
- Vercel Production: **SUCCESS** auf exakt diesem SHA;
- Issue #343: **CLOSED / completed**;
- Parent #294: OPEN;
- Supabase Production: E5-B3A Flight Event Provenance weiterhin **UNAPPLIED / ABSENT**.

Nach Merge dieser docs-only Closure muss `main` live neu gelesen werden, weil der kanonische SHA ohne Runtime-Verhaltensänderung weiterläuft.

## 3. E5-B3B final history

Agent:
**`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1

Session:
`bc-1b857acd-7a88-4355-9bc1-4f94ece44f9b`

Final agent/delivery head:
`6dc59f7e26d77f616cf390db724385b200ba6f2a`

Final integration head:
`fdc41ae9d644c87525f90f932b630c1ac7fa8fd1`

Independent TL verdict:
**PASS / no open P0-P1-P2.**

Original Draft PR #344:
**CLOSED / NOT MERGED** because of known `Repository.fullDatabaseId` Ready connector error.

Recovery PR #345:
**MERGED** after independent recovery gates.

Runtime/repository merge:
`9fb1e801fb6f7bf6f5f54fea6763f4b7f784def7`

## 4. Entry Requirements foundation now present

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution;
- E5-B3A server-owned Flight Event Provenance repository persistence/security foundation;
- E5-B3B server-observed provider retrieval timestamp core.

E5-B3B final truth:

- `FlugProviderTreffer.retrievedAt` is required and server-only;
- it is the Jetnity server observation time of the successfully read provider snapshot;
- active Duffel adapter mints it from Jetnity clock after successful HTTP + JSON read;
- it cannot be sourced from provider/browser payload;
- it is not in `FlugOption`, `FlugSegment`, browser response, route, trip metadata or DB;
- it is not a freshness/availability guarantee.

## 5. Production / persistence remain closed

Still absent in Supabase Production:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`.

No Production migration, RLS/grant/role/function mutation, runtime principal, real writer or backfill occurred.

`flugNachweisAusUmgebung()` remains `null`.  
`requirementsProviderAus()` remains `null`.

## 6. Still inactive

- Production-applied Flight Event Provenance;
- TypeScript persistence mint;
- real writer/runtime principal;
- Trip/Route → OfficialTemporalAnchor occurrence resolver;
- automatic E5-A binding;
- workspace deadlines/action windows/urgency;
- task persistence/completion;
- reminders/push/email;
- real Requirements provider;
- credential/passport ranking.

## 7. Product-Owner gates remain binding

Explicit Product-Owner approval remains mandatory before:

- E5-B3A Production migration apply;
- Production RLS/grant/role/function mutation;
- runtime/login principal allocation;
- real application writer or backfill;
- provider/vendor/DPA/secret/paid/live activation;
- fundamental Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health storage changes;
- real payments;
- infrastructure spend outside approved budget;
- public/irreversible external activation.

## 8. Traveller/product truth unchanged

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

No default/primary/preferred/chosen passport or citizenship. Issuer Country != Citizenship. No residence→nationality inference. No `documents[0]` / `evaluations[0]` as truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = only current truth for a concrete trip.

## 9. FIRST NEXT ACTION

There is **no active runtime follow-up slice** at this checkpoint.

Before any next slice:

1. reconstruct exact live `main` after this docs-only closure;
2. verify open PRs/issues, CI and Vercel;
3. run fresh Duplicate/Integration/Truth/Security/Persistence precheck;
4. determine the smallest safe next product/runtime slice from actual architecture;
5. do not silently cross Production/provider/cost or other Product-Owner gates;
6. version Issue + Task + Branch + Draft PR before implementation;
7. dispatch one fresh Cursor agent only after the pre-agent diff is clean;
8. independently review the delivered exact head.

A future Flight Event persistence mint must reuse E5-B1R + E5-B2A + E5-B3B and must not invent a new retrieval timestamp.

**Live-Evidence wins always.**
