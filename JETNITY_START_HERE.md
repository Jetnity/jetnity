# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B2A INDEPENDENT TL PASS / FINAL INTEGRATION GATES PENDING / LIVE-EVIDENCE WINS**

> **Vor jedem neuen Slice zuerst Live-Stand, Duplicate-/Integration-/Truth-/Security-Grenzen und betroffene Persistenz verifizieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_REVIEW_2026-08-31.md` ← **aktueller unabhängiger TL-Review**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_TASK_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_HANDOFF_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_SELF_REVIEW_2026-08-31.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_CLOSED_2026-08-31.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md`
8. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
9. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Storage-/Migration-/Persistenzannahmen zusätzlich Supabase live prüfen.

## 2. Canonical main beim E5-B2A Task-Cut

`main@f7ccdc5b98ce933b06c216135be7c4f4b08f8222`

Commit:
`Close Entry Requirements E5-B1R continuity (#333)`

Task-Cut/Post-closure Evidence:

- Main CI #1507 / Run `33415587649`: **SUCCESS**;
- Vercel Production: **SUCCESS**;
- Ruleset `Jetnity main protection` / ID `21875372`: active;
- strict required checks `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`;
- Conversation Resolution;
- merge-only;
- bypass empty.

`main` war beim unabhängigen E5-B2A-Review weiterhin exakt unverändert. Vor Integration immer live neu lesen.

## 3. Aktiver Slice – E5-B2A

Issue:
**#334 – Entry Requirements E5-B2A – ephemeral airport event instant resolution**

Draft PR:
**#335**

Branch:
`feat/entry-requirements-airport-event-instant-e5b2a-2026-08-31`

Logical Cursor Agent:
**`Jetnity entry requirements airport event instant 1`**, Generation 1

Session:
`bc-2f16caec-271e-4911-ac36-5abc36ab0806`

Agent runtime + handoff head:
`4d7e1d002eba06490da59cb4416c55229e8cb559`

Independent Technical-Lead verdict on that exact agent head:
**PASS / no P0-P1-P2 findings.**

Canonical review:
`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_REVIEW_2026-08-31.md`

The TL review document was committed after the reviewed agent head; therefore all earlier exact-head gates became historical review evidence. The final integration head must receive fresh gates after this continuity update.

## 4. What E5-B2A delivers

E5-B2A resolves only:

> **exact local airport wall clock + exact E5-B1R provider-observed IANA timezone evidence -> exactly one canonical UTC instant or an explicit fail-closed issue.**

Exact binding is revalidated by:

- option ID;
- leg index;
- segment index;
- endpoint `departure | arrival`;
- exact endpoint IATA.

Departure reads only origin + departure date/time. Arrival reads only destination + arrival date/time.

DST behavior:

- nonexistent local time / spring gap -> no instant;
- ambiguous local time / fall overlap -> no instant;
- never silently choose earlier/later/compatible.

No IATA/country/city/name/server/browser timezone inference. No local-string `Z` append. No new timezone dependency.

## 5. Runtime / trust boundary

Timezone and event-instant evidence remain **ephemeral server-side companion evidence** on the active `FlugProviderTreffer` seam.

They are not part of:

- `FlugSegment`;
- `FlugOption` / `BewerteteFlugOption`;
- browser/client response;
- route itinerary;
- trip metadata;
- account adoption / `flugNachweis`;
- Supabase.

`fluegeSuchen()` deliberately forwards neither timezone nor event-instant evidence to ranking/client serialization.

Duffel applies the retained-offer cap first, filters timezone evidence to retained option IDs, then resolves event instants. Unresolvable evidence does not discard an otherwise valid flight option.

## 6. Reviewed-head evidence

On agent head `4d7e1d002eba06490da59cb4416c55229e8cb559`:

- CI #1510 / Run `33417793387`: **SUCCESS**;
- Auth: SUCCESS;
- Typecheck: SUCCESS;
- Lint: SUCCESS;
- Tests: SUCCESS;
- Admin API / Schema / Dead Code / Exports / Dependencies: SUCCESS;
- Production Build: SUCCESS;
- Vercel Preview: READY / SUCCESS;
- GitHub review threads: 0;
- Vercel live feedback: 0 unresolved / 0 total.

These are now review evidence only because TL continuity commits moved the branch head.

## 7. Hard non-scope / still inactive

- persistent server-owned timezone/event provenance;
- Route/Trip -> OfficialTemporalAnchor occurrence resolver;
- E5-A automatic binding;
- workspace deadline/action-window/urgency runtime;
- task persistence/completion;
- reminder/push/e-mail/notification runtime;
- real Requirements provider;
- credential/passport ranking;
- E5-B2B or another follow-up.

`requirementsProviderAus()` remains `null`.

## 8. Provenance rule

The abandoned first E5-B1 attempt remains invalid:

- Issue #327 CLOSED / not_planned;
- PR #328 CLOSED / NOT MERGED.

Binding rule:

> **Persisted does not mean provider-proven.**

Owner-writable Trip metadata cannot establish provider provenance. Persistent trusted timezone/event provenance later requires technically enforced server-owned write authority and, if Production DB/RLS/grants/triggers change, the special Product-Owner gate.

## 9. Traveller / product truth unchanged

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

No default/primary/preferred/chosen passport or citizenship. Issuer Country != Citizenship. No Residence -> Nationality inference. No `documents[0]` / `evaluations[0]` as Product Truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = only current truth for a concrete trip.

## 10. Product-Owner gate assessment

E5-B2A triggers no special Product-Owner gate: no Production DB/security change, persistence, provider/secret/paid activation, Auth/MFA/AAL, sensitive data, new running cost or public launch.

STOP if future integration crosses into persistent trusted timezone/event provenance or Production DB/security write-authority changes.

## 11. FIRST NEXT ACTION

1. determine the new exact integration head after all TL continuity commits;
2. verify diff from reviewed agent head contains only TL-owned docs;
3. verify current `main`, merge-base, ahead/behind and PR head live;
4. require fresh CI/Auth/Vercel on the exact new head;
5. require zero unresolved GitHub/Vercel threads;
6. mark Ready only after exact-head PASS; if the known `Repository.fullDatabaseId` connector bug occurs, use the documented identical non-draft recovery carrier without weakening protection;
7. merge only with expected-head guard;
8. post-merge verify main CI + Vercel Production;
9. close #334 only after post-merge green;
10. create and gate the docs-only closure checkpoint;
11. **do not auto-start E5-B2B or another follow-up.**

**Live-Evidence wins always.**
