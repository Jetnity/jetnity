# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 29. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice – auch im selben Chat – muss zuerst der relevante Live-Stand rekonstruiert werden. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

Verbindliches Start-/Continuity-Gate:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

Aktuellster Post-Merge-Checkpoint:

`docs/CHATGPT_TL_PROVIDER_TRAVELLER_POST_MERGE_CHECKPOINT_2026-08-29.md`

Dieser Einstieg ersetzt keine Live-Prüfung. Vor Änderung, Review, Ready oder Merge immer `main`, relevante PRs/Heads, CI, Vercel, Supabase/Production-Evidence und parallele Workstreams live verifizieren.

---

## 1. Aktueller Baseline- und Workstream-Stand

Letzter vollständig post-merge verifizierter Produkt-/Current-State-Stand:

- `main @ c698abd3c7785500fe6586f068f1cd843ade19ac`
- Merge: Provider-/Traveller-Reconciliation über Recovery-PR #204 nach TL PASS auf exact head `9e6a2009315995d70565756e389b2e4d639baf40`
- Post-Merge CI: Run `33271023725` / #1255 = **SUCCESS**
- Post-Merge Vercel Production: `dpl_Gd5YthM5FVWpqoQ8kZRJXwx1Zhtv` = **READY** auf exakt diesem `main`
- Branch Protection: `protected=false` bleibt Governance-Risiko.

Aktueller TL-owned Continuity-Workstream:

- Branch: `docs/provider-traveller-post-merge-continuity-2026-08-29`
- Draft-PR: **#205**
- Scope: nur Current-State-/Continuity-Dokumentation.
- Kein Cursor-Coding-Agent in diesem Slice.
- Kein Runtime-/UI-/Provider-/Auth-/RLS-/Supabase-/Production-Change.

**Self-expiring:** Sobald #205 integriert und post-merge verifiziert ist, ist dieser Authoring-Block historisch. Danach ist der erste Schritt ein frischer Binding Slice Precheck – kein automatisch gestarteter Produkt-Slice.

---

## 2. Provider – Current Truth

Integriert:

- Shared Provider Adapter Core / ADR-0199;
- Skyscanner Flights Offline Adapter Foundation, strikt fixture-only;
- HBX Hotels Contract/Audit;
- Viator Activities Contract/Audit;
- 12Go Mobility Contract/Audit / ADR-0200;
- Commercial Provenance S5-A/S5-B Contract + Production Persistence Foundation.

Nicht vorhanden/aktiv:

- keine echten Provider API-Keys/Secrets;
- keine echten Provider-Calls;
- kein Production Provider Runtime Principal;
- kein echter `live_api`-Snapshot;
- kein realer Provider-`persisted_snapshot`;
- kein Provider Orchestrator / Multi-Provider-Fanout;
- TW-8 bleibt geschlossen.

Supabase Production `qscbgcdmivbbnzrcyegn` wurde beim #203 Review read-only erneut bestätigt: Migration `20260829140000` registriert; Provenance-Tabelle vorhanden; 0 Rows; Writer/Runtime NOLOGIN; `authenticated`/`anon` ohne Writer-EXECUTE und ohne Tabellen-Write. S5-B Runtime-Write bleibt geschlossen.

---

## 3. Traveller / Multi-Citizenship – Current Truth

Kanonisches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Integriert:

- 1:n Citizenships / 1:n Documents;
- Issuer Country ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-Pass / keine Default-Citizenship;
- historische `documents[0]`-/First-Evaluation-Kollapse geschlossen/fail-closed;
- Guest→Account Trip-Copy erhält Arrays/Relation;
- AP-7 Gate 0 + Dual-Authority-Freigabe + AP-7-S1 Domain Contract.

Offen:

- **AP-7-S2 Account-Registry Persistence / Identity / RLS**;
- Registry CRUD/Lifecycle/UX;
- Registry→Trip Runtime-Materialisierung;
- Requirements Provider bleibt `null`;
- spätere option-scharfe Official-/Safety-/Booking-Dokumentdarstellung nur mit echter Evidence;
- P3 Duplicate-Country/`clientRef` Write-Hygiene laut aktuellem Audit.

Keine Passnummern, Scans, MRZ, Biometrie oder Health-Daten im Kernmodell.

---

## 4. Letzter Cursor-Agent

#203/#204 und #205 sind Technical-Lead-owned Docs-Slices ohne Cursor-Coding-Agent.

Letzter tatsächlich eingesetzter Cursor-Agent:

- `Jetnity traveller multicitizenship audit 1`
- Generation 1
- Session: `bc-060f0713-5f92-46b8-9631-72366bc8fb32`
- finaler gegateter Head: `7bdd7da81e56808d9ff1b004999314935b3a5812`
- kein aktiver Folgeauftrag.

---

## 5. Risiken und besondere Product-Owner-Gates

- P0: keine bekannten.
- blocking P1 für aktuellen Docs-Continuity-Slice: keine bekannten.
- P2 Governance: `main protected=false`.
- P2 Delivery/Gate: AP-7-S2 fehlt und kann wegen Identity/RLS/Production-Grenzen ein besonderes PO-Gate auslösen.
- P3: Traveller Duplicate-Country/`clientRef` Write-Hygiene; referenzierte verworfene Refs scheitern fail-closed, keine dangling Relation.

Ausdrückliche PO-Entscheidung bleibt erforderlich insbesondere vor Production-Migrationen/destruktiven Production-Datenänderungen, großen produktiven RLS-/Identity-/Ownership-Vertragsänderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Öffnung des Provider Runtime/S5-B Write-Pfads, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

Routine-Technik, unabhängige Reviews und normale scope-treue Merges bleiben Technical-Lead-autonom.

---

## 6. Pflichtlektüre vor einem neuen Slice

Mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
6. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
7. `JETNITY_HANDOFF.md`
8. `docs/ACTIVE_WORK_STATUS.md`
9. `docs/CHATGPT_TL_PROVIDER_TRAVELLER_POST_MERGE_CHECKPOINT_2026-08-29.md`
10. konkret relevante Task-/Status-/Handoff-/ADR-Dateien;
11. danach Live-GitHub/CI/Vercel/Supabase-Evidence.

Bei Chatwechsel zusätzlich `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`.

---

## 7. Exakter nächster Schritt

**Solange Draft-PR #205 offen ist:**

1. Exact Head / Merge-Base / Ahead-Behind prüfen.
2. Docs-only Diff unabhängig reviewen.
3. Exact-Head CI + Vercel terminal grün.
4. TL PASS.
5. TL-only Ready/Merge; bei bekanntem Draft→Ready-Connectorfehler Recovery-Transport nur desselben gegateten SHA.
6. Post-Merge `main`, CI und Vercel verifizieren.

**Nach Integration von #205:**

Frischen Binding Slice Precheck ausführen. Dabei zuerst Binding Build Order, AP-7-S2 Gate-/Approval-Status, Provider-Restarbeit, offene PRs/Issues/Branches, aktuelle Production-Wahrheit und Risiken gegeneinander abgleichen.

Der derzeitige Provider-Kandidat **Skyscanner Flights Server Create/Poll Transport Foundation** ist nur ein Kandidat. Er darf erst gewählt werden, wenn der frische Precheck bestätigt, dass kein vorrangiger unblocked Account-/Traveller-Schritt besteht und die binding Reihenfolge nicht verletzt wird.
