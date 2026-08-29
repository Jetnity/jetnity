# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 29. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice – auch im selben Chat – muss zuerst der relevante Live-Stand rekonstruiert werden. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

Verbindliches Start-/Continuity-Gate:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

Aktuellster Technical-Lead Production-Closure-Checkpoint:

`docs/CHATGPT_TL_AP7_S2_PRODUCTION_CLOSURE_2026-08-29.md`

Dieser Einstieg ersetzt keine Live-Prüfung. Vor Änderung, Review, Ready oder Merge immer `main`, relevante PRs/Heads, CI, Vercel, Supabase/Production-Evidence und parallele Workstreams live verifizieren.

---

## 1. Aktueller Baseline-Stand

Letzter vollständig post-merge und Production-verifizierter Account-/Traveller-Stand:

- `main @ b8ea3354c14407793b6e9d19f80ab06a20c29244`
- AP-7-S2 Integration über Recovery-PR #211
- Post-Merge CI: Run `33274497121` / #1270 = **SUCCESS**
- Vercel Production: `dpl_5qJzPjxhfZh6ZtCXgvFEzSPAv3wY` = **READY** auf exakt diesem `main`
- Supabase Production `qscbgcdmivbbnzrcyegn`: Migration `20260829210052_account_traveller_registry_persistence` angewendet und read-only verifiziert
- Issue #209: **CLOSED / completed**
- Branch Protection: `protected=false` bleibt Governance-Risiko.

AP-7-S2 ist abgeschlossen. Es gibt **keinen automatisch gestarteten Folgeslice**.

---

## 2. Traveller / Multi-Citizenship – Current Truth

Kanonisches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Integriert:

- trip-scoped Foundation E;
- 1:n Citizenships / 1:n Documents;
- Issuer Country ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-Pass / keine Default-Citizenship;
- historische First-Item-Kollapse geschlossen/fail-closed;
- Guest→Account Trip-Copy erhält Arrays/Relation;
- AP-7 Gate 0 + Dual-Authority-Freigabe + AP-7-S1 Domain Contract;
- **AP-7-S2 Account Registry Persistence / Identity / RLS auf Production**.

Production Registry Tabellen:

- `account_travellers`;
- `account_traveller_citizenships`;
- `account_traveller_documents`.

Owner-only RLS ist aktiv. `anon` hat keine Tabellenrechte. `authenticated` CRUD bleibt owner-begrenzt. Direkt nach Apply waren alle drei Tabellen leer.

Weiter offen sind insbesondere Registry CRUD/Lifecycle/UX, Registry→Trip Runtime-Materialisierung und weitere gemäß aktuellem Account-Plan gegatete Traveller-/Account-Arbeit. Keine Passnummern, Scans, MRZ, Biometrie oder Health-Daten im Kernmodell.

---

## 3. Provider – Current Truth

Provider-Arbeit ist **nicht abgeschlossen**.

Integriert sind u. a. Shared Provider Adapter Core, Offline-/Contract-Foundations und Commercial Provenance Foundation. Echte Provideraktivierung, Secrets/paid calls und weitere Provider Runtime Slices bleiben hinter ihren Gates.

Vor Auswahl eines Provider-Slices muss die aktuelle Binding Build Order erneut live mit Account-/Traveller-Restarbeit abgeglichen werden. Historische Provider-Drafts sind keine automatische Startfreigabe.

Während AP-7-S2 wurde außerdem eine separate historische Supabase S5-B Migration-History-/Replay-Störung auf Development entdeckt. Production wurde dafür nicht manipuliert. Vor einem migrationsnahen Provider-Slice ist diese Evidence erneut live zu prüfen.

---

## 4. Cursor-Agent / Arbeitsverteilung

Verbindlicher Ablauf:

- Technical Lead rekonstruiert Live-Stand, wählt Slice und definiert versionierten Scope;
- neue logische Implementierungseinheit → frische Cursor-Agent-Session gemäß Rotation Standard;
- Cursor-Agent implementiert und self-reviewt;
- Technical Lead prüft unabhängig Diff, Architektur, Security, Tests, CI, Vercel und ggf. Supabase;
- `CHANGES REQUIRED` geht an denselben Agenten/dieselbe Session;
- nur Technical Lead setzt PASS / Ready / Merge;
- neuer Head invalidiert vorherige Exact-Head-Gates.

AP-7-S2 ist abgeschlossen; für den nächsten Implementierungsslice ist noch kein neuer Agentenauftrag durch diesen Closure-Checkpoint freigegeben. Zuerst frischer Binding Slice Precheck.

---

## 5. Risiken und besondere Product-Owner-Gates

- P0: keine aus AP-7-S2 bekannten.
- P2 Governance: `main protected=false`.
- Separate Infrastructure Debt: historische Supabase S5-B Migration-History-/Replay-Störung auf Development.
- Supabase Advisor: generische authenticated-GraphQL-Warnungen für owner-RLS-geschützte Registry-Tabellen sowie ältere, AP-7-S2-fremde Warnungen.

Ausdrückliche Product-Owner-Entscheidung bleibt erforderlich insbesondere vor neuen Production-Migrationen/destruktiven Production-Datenänderungen, materiellen produktiven RLS-/Identity-/Ownership-Vertragsänderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Öffnung geschlossener Provider-Write-Pfade, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

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
9. `docs/CHATGPT_TL_AP7_S2_PRODUCTION_CLOSURE_2026-08-29.md`
10. konkret relevante Task-/Status-/Handoff-/ADR-Dateien;
11. danach Live-GitHub/CI/Vercel/Supabase-Evidence.

Bei Chatwechsel zusätzlich `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`.

---

## 7. Exakter nächster Schritt

1. AP-7-S2 Closure-/Continuity-Dokumentation integrieren und post-merge verifizieren.
2. Danach frischen Binding Slice Precheck ausführen.
3. Binding Build Order gegen aktuelle Account-/Traveller-Restarbeit, Provider-Restarbeit, offene PRs/Issues/Branches, Production Truth und Risiken abgleichen.
4. Erst dann den nächsten bounded Implementierungsslice bestimmen.
5. Für diesen neuen logischen Slice einen frischen Cursor-Agenten gemäß Operating Standard anstoßen.

Kein historischer Draft-PR und kein alter Agentenauftrag darf ohne diesen Precheck als Current Truth fortgesetzt werden.
