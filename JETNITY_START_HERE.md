# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B3C PRE-AGENT ACTIVE / SERVER-ONLY PERSISTENCE MINT / PRODUCTION EVENT PROVENANCE UNAPPLIED / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/ACTIVE_WORK_STATUS.md` ← **aktueller aktiver Status**
2. `docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_TASK_2026-08-31.md` ← **bindender aktiver Task**
3. Issue **#347**
4. aktueller Draft-PR für #347, sobald live vorhanden
5. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3B_CLOSED_2026-08-31.md`
6. `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_HANDOFF_2026-08-31.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_CLOSED_2026-08-31.md`
8. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
9. E5-B1R Closure/Handoff
10. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
11. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
12. `docs/JETNITY_BINDING_BUILD_ORDER.md`
13. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Aktueller Live-Baseline-main

`main@8868f91319f2747ca6f3dc8cb46ab0a40cba417b`

Commit:
`Close Entry Requirements E5-B3B continuity (#346)`

Fresh verified before E5-B3C branch cut:

- Main CI #1539 / Run `33436658462`: **SUCCESS**;
- Auth-Konfiguration: **SUCCESS**;
- Typecheck/Lint/full Tests/Hygiene/Production Build: **SUCCESS**;
- Vercel Production: **READY/SUCCESS** on exact main;
- Vercel unresolved toolbar threads: **0**;
- ruleset `Jetnity main protection` / ID `21875372`: active, strict CI/Auth/Vercel + review-thread resolution + merge-only + no bypass;
- no competing current runtime PR; open #52/#50/#40/#39/#28 are historical Drafts.

## 3. Aktiver Slice E5-B3C

Issue:
**#347 – Entry Requirements E5-B3C – server-only Flight Event persistence payload mint**

Branch:
`feat/entry-requirements-flight-event-persistence-mint-e5b3c-2026-08-31`

Task:
`docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_TASK_2026-08-31.md`

Planned fresh Cursor agent:
**`Jetnity entry requirements flight event persistence mint 1`**, Generation 1

Cursor session:
**Noch nicht behaupten. Erst nach live Cursor-Evidence im Repository persistieren.**

Current phase:
**Technical-Lead pre-agent preparation. No E5-B3C runtime implementation is accepted yet.**

## 4. Why E5-B3C

The fresh precheck established:

- E5-B1R provides exact provider-observed Airport timezone evidence;
- E5-B2A provides exact resolved Airport event-instant evidence;
- E5-B3B provides exact server-observed provider snapshot time `FlugProviderTreffer.retrievedAt`;
- E5-B3A defines the repository-only SQL contract `jetnity.flight_event_persistence.v1` / `e5b2a_validated_snapshot`;
- no TypeScript mint exists yet;
- no existing Trip/Route → OfficialTemporalAnchor occurrence resolver exists;
- `flugNachweisAusUmgebung()` is still `null`, so account flight adoption is intentionally fail-closed;
- Production E5-B3A objects are absent/unapplied.

Therefore the smallest safe next slice is **not** a Production migration or deadline autobinding. It is a pure server-only/DB-free mint that constructs the validated future E5-B3A writer payload from one exact server-side `FlugProviderTreffer` snapshot.

## 5. Binding E5-B3C truth

Input must use:

- future server-known `tripItemId`;
- selected `optionId` located inside the same server-side `FlugProviderTreffer`;
- exact E5-B1R timezone evidence;
- exact E5-B2A event-instant evidence;
- exact E5-B3B `treffer.retrievedAt`.

Mandatory:

`retrieved_at === observed_at === treffer.retrievedAt`

No second `Date.now()` observation.  
No invented Freshness: `fresh_until = null`.  
No TypeScript-generated `occurrence_event_ref`; SQL owns it.  
No browser/client actor/source/timestamp/timezone/instant/eventRef trust.  
No first-match across ambiguous option/occurrence/evidence identity.

Only fully proven exact occurrences may be included. Missing/ambiguous/conflicting evidence remains explicit and fail-closed.

## 6. Production remains closed

Supabase Production project:
`qscbgcdmivbbnzrcyegn`

Fresh read-only verification confirmed absent/unapplied:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`;
- migration `20260831190000`.

No Production mutation occurred.

`flugNachweisAusUmgebung()` remains `null`.  
`requirementsProviderAus()` remains `null`.

## 7. E5-B3B final history

Last completed agent:
**`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1

Session:
`bc-1b857acd-7a88-4355-9bc1-4f94ece44f9b`

Final agent/delivery head:
`6dc59f7e26d77f616cf390db724385b200ba6f2a`

Final integration head:
`fdc41ae9d644c87525f90f932b630c1ac7fa8fd1`

Runtime merge:
`9fb1e801fb6f7bf6f5f54fea6763f4b7f784def7`

Continuity/current baseline main:
`8868f91319f2747ca6f3dc8cb46ab0a40cba417b`

Independent TL verdict:
**PASS / no open P0-P1-P2.**

Old E5-B3B branch is fully integrated: **ahead 0**, behind current main, no unmerged diff.

## 8. Entry Requirements foundation present

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
- E5-B3B server-observed provider retrieval timestamp.

Still inactive:

- E5-B3C until independent TL review/merge;
- Production-applied Flight Event Provenance;
- real writer/runtime principal;
- account `flugNachweis` activation;
- Trip/Route → OfficialTemporalAnchor occurrence resolver;
- automatic E5-A binding;
- deadlines/action windows/urgency;
- task persistence/completion;
- reminders/push/email;
- real Requirements provider;
- credential/passport ranking.

## 9. Product-Owner gates

No special Product-Owner gate for the exact E5-B3C repository/server-only, DB-free, invocation-free, cost-neutral slice.

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

## 10. Current risks

### P0
None proven.

### P1
None proven in current E5-B3C scope.

### P2
- account flight adoption remains intentionally unavailable (`flugNachweisAusUmgebung() === null`);
- event provenance remains absent in Production;
- automatic event binding/deadline runtime must therefore remain inactive.

### P3
- historical Draft PRs/branches remain as non-current evidence;
- E5-B3B uses host server clock with no independent NTP attestation; do not overstate it beyond server-observed snapshot time.

## 11. FIRST NEXT ACTION

1. open dedicated Draft PR for #347 after TL preparation commits;
2. verify exact pre-agent head, merge-base and ahead/behind against live main;
3. verify pre-agent diff is only TL-owned preparation;
4. dispatch fresh Cursor agent **`Jetnity entry requirements flight event persistence mint 1`**, Generation 1;
5. persist exact Cursor session evidence when it actually exists;
6. agent implements only binding E5-B3C task then STOP;
7. Technical Lead performs independent exact-head review;
8. every changed head invalidates older gates;
9. only TL may Ready/merge after PASS and full exact-head CI/Vercel/thread gates.

**Live-Evidence wins always.**
