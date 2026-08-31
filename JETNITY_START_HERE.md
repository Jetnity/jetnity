# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B3A AGENT HEAD TL-PASS / FINAL INTEGRATION CONTINUITY GATING / REPOSITORY-ONLY / NO PRODUCTION APPLY / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

> Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Jeder neue Head invalidiert ältere Exact-Head-Gates.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_REVIEW_2026-08-31.md` ← **aktuellster TL-Review**
2. `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_HANDOFF_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_SELF_REVIEW_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_SERVER_OWNED_FLIGHT_EVENT_PROVENANCE_E5B3A_TASK_2026-08-31.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`
8. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
9. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Baseline / aktueller Main vor E5-B3A-Merge

`main@3df9af4d6c3da750d50777706bce03589007a58a`

Commit:
`Close Entry Requirements E5-B2A continuity (#337)`

Vor E5-B3A verifiziert:

- Main CI #1517 / Run `33420869626`: SUCCESS;
- Vercel Production: SUCCESS;
- Ruleset `Jetnity main protection` / ID `21875372`: active;
- strict PR/CI/Auth/Vercel/Conversation-Resolution/merge-only, bypass empty.

## 3. Aktueller Slice – E5-B3A

Issue:
**#338 – Entry Requirements E5-B3A – server-owned flight event provenance persistence foundation**

Draft PR:
**#340 – Entry Requirements E5-B3A – server-owned flight event provenance foundation**

Branch:
`feat/entry-requirements-flight-event-provenance-e5b3a-2026-08-31`

Agent:
**`Jetnity entry requirements event provenance persistence 1`**, Generation 1

Session:
`bc-e7a50347-1c66-4cd1-bbd2-979b89590a40`

Initial agent head:
`79dda7593bb9fbb20c36dc54348920e994da6823`

Dieser Head erhielt **CHANGES REQUIRED** wegen eines P2: `provider_belegt=true` konnte ohne konkrete Provider-Source-Referenz persistiert werden.

Same-agent Fix:
`f918dc0ed58b4962389a860d5a1b6bf74513cd1b`

Finaler unabhängiger Agent-Review-Head:
`d37b600f67537f4ccb816182009b6018a39f82a3`

Technical-Lead Verdict:
**PASS / no open P0-P1-P2 findings.**

Exact-head Gates auf `d37b600f...`:

- CI #1522 / Run `33427796712`: SUCCESS;
- Auth: SUCCESS;
- Typecheck/Lint/Tests/Hygiene/Production Build: SUCCESS;
- Vercel Preview: READY / SUCCESS;
- GitHub Reviewthreads: 0;
- Vercel unresolved feedback: 0;
- merge-base exact main, branch 0 behind.

Nach dem PASS wurden nur TL-owned Review/Continuity-Docs ergänzt. Deshalb muss der **neue finale Integrations-Head** noch einmal vollständig gegatet werden, bevor Ready/Merge zulässig ist.

## 4. Was E5-B3A baut

Nur eine **repository-only Persistence-/Security-Foundation**:

- neue Relation `public.trip_item_flight_event_provenance` neben `trip_items`;
- Current-Occurrence-Identität Item × Leg × Segment × `departure|arrival`;
- `local_date` / `local_time`, `time_zone` und `event_instant` bleiben getrennte Fakten;
- konkrete Provider-Source-Referenz `external_ref` ist verpflichtend (`NOT NULL`, nonblank, bounded);
- `occurrence_event_ref` wird serverseitig erzeugt und ist keine Provider-Source-Referenz;
- authenticated Owner darf später nur SELECT;
- kein Direct-Write durch authenticated/anon;
- privater SECURITY-DEFINER-Writer im nicht exponierten `jetnity_internal`;
- dedizierte NOLOGIN-Rollen;
- Production Runtime-Gate standardmäßig geschlossen/unallocated;
- vollständige Validierung vor atomarem Current-Snapshot DELETE+INSERT;
- kein zweiter Timezone-/DST-Resolver im SQL.

## 5. Production ist unverändert

Supabase Production Projekt `qscbgcdmivbbnzrcyegn` wurde nach finaler Agent-Lieferung read-only geprüft.

Weiterhin **nicht vorhanden**:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`.

Damit gilt:

**Repository-Migration vorhanden ≠ Production-Migration angewendet.**

Keine Production-Daten wurden verändert.

## 6. Harte Runtime-/Truth-Grenzen

Weiterhin unverändert/inaktiv:

- `flugNachweisAusUmgebung()` bleibt `null`;
- `requirementsProviderAus()` bleibt `null`;
- keine Timezone/Event-Felder in `FlugSegment` / `FlugOption` / Browser / Route-Metadata;
- kein App-/API-Writer für E5-B3A;
- kein Trip/Route → OfficialTemporalAnchor Resolver;
- keine E5-A-Autobindung;
- keine Deadline-/Urgency-/Task-/Reminder-/Notification-Runtime;
- kein Credential-/Pass-Ranking;
- keine Provider-/Secret-/paid-call-Aktivierung.

## 7. Product-Owner-Gate

Explizite Product-Owner-Freigabe bleibt zwingend **vor**:

- Anwendung der E5-B3A-Migration auf Production;
- Production-RLS/Grants/Roles/Functions;
- Runtime-/Login-Principal-Allokation;
- realem Application-Writer;
- Backfill oder Mutation realer Trip-Daten.

Der aktuelle Repository-PR selbst löst diese Production-Aktionen nicht aus.

## 8. P3 / spätere Pflichtprüfung

Vor einem späteren Production-Apply muss die Migration zusätzlich gegen eine disposable PostgreSQL/Supabase-Testumgebung ausgeführt werden. Die aktuellen Repository-Vertragstests prüfen den SQL-Vertrag, nicht einen Live-Apply.

Timezone-Erkennung und lokale Wanduhr → Instant bleiben bewusst außerhalb SQL: ein zukünftiger Trusted-Mint muss E5-B1R + E5-B2A wiederverwenden.

## 9. Traveller-/Produktwahrheit unverändert

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

Kein Default-/Primary-/Preferred-/Chosen Passport oder Citizenship. Issuer Country != Citizenship. Keine Residence→Nationality-Inferenz. Kein `documents[0]` / `evaluations[0]` als Product Truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = only current truth for a concrete trip.

## 10. FIRST NEXT ACTION

1. finalen PR-Head nach TL-Continuity feststellen;
2. Diff ab `d37b600f...` muss ausschließlich TL-owned Review/Continuity-Dokumentation enthalten;
3. finaler Head braucht neue CI/Auth/Vercel/Threads/Main-Drift-Gates;
4. bei grünem finalen Head Ready/Merge nur durch Technical Lead;
5. **keine Production-Migration anwenden**;
6. nach Merge Main-CI + Vercel Production prüfen;
7. Supabase Production read-only erneut bestätigen: E5-B3A weiterhin unapplied;
8. Issue #338 als repository-foundation completed schließen und Parent #294 fortschreiben;
9. keinen E5-B3B/Folgeslice automatisch starten.

**Live-Evidence wins always.**
