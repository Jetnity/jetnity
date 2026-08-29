# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 29. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice – auch im selben Chat – muss zuerst der relevante Live-Stand rekonstruiert werden. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

Verbindliches Start-/Continuity-Gate:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

Aktuellster Technical-Lead Checkpoint:

`docs/CHATGPT_TL_AP7_S3_AND_INFRA_AUDIT_POST_MERGE_CHECKPOINT_2026-08-29.md`

Dieser Einstieg ersetzt keine Live-Prüfung. Vor Änderung, Review, Ready oder Merge immer `main`, relevante PRs/Heads, CI, Vercel, Supabase/Production-Evidence und parallele Workstreams live verifizieren.

---

## 1. Aktueller vollständig verifizierter Baseline-Stand

- `main @ bb0fb2050e09e8fa5bf670e4290523c037790954`
- AP-7-S3 Account Traveller Registry CRUD/UI ist integriert und Production-verifiziert.
- Supabase Migration-History Replay Gate-0 Audit ist als reine Evidence integriert.
- Post-Merge CI auf aktuellem `main`: #1284 / Run `33277102071` = **SUCCESS**.
- Vercel Production auf aktuellem `main`: `dpl_BFHHnDoekhxq6CvsLQXiSHrTkmpT` = **READY**.
- `main protected=false` bleibt Governance-Risiko.

Es gibt **keinen automatisch gestarteten Folgeslice**.

---

## 2. Traveller / Account – Current Truth

Kanonisches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Integriert sind u. a.:

- trip-scoped Foundation E;
- 1:n Citizenships / 1:n Documents;
- Issuer Country ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-/Primary-/Chosen-Pass und keine Default-Citizenship;
- Guest→Account Trip-Copy erhält Arrays/Relation;
- AP-7 Gate 0 + Dual-Authority-Freigabe;
- AP-7-S1 Domain Contract;
- AP-7-S2 Account Registry Persistence / Identity / owner-only RLS auf Production;
- **AP-7-S3 reale `/account/travellers` CRUD/UI auf Production**.

Production Registry Tabellen:

- `account_travellers`;
- `account_traveller_citizenships`;
- `account_traveller_documents`.

AP-7-S3 liefert Owner CRUD, mehrere Citizenships (max. 8), mehrere Document-Metadaten (max. 12), getrenntes Issuing Country, optionale Citizenship-Relation und `expires_on`. Keine Pass-/Dokumentnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten.

Weiter offen ist insbesondere die bewusst getrennte Registry→Trip Runtime-Materialisierung sowie weitere Account-/Traveller-Arbeit gemäß aktuellem Account-Plan. Sie ist **nicht automatisch autorisiert**.

---

## 3. Supabase Migration-History Replay – Current Truth

Gate-0 Audit ist abgeschlossen und dokumentiert.

Production `qscbgcdmivbbnzrcyegn` besitzt Version `20260829140000_trip_item_commercial_provenance`, deren gespeicherte einzige Statement-Body jedoch ein **nicht replaybarer 234-Zeichen-Prosa-Marker** ist. Der Production S5-B Catalog existiert trotzdem und der Production Write Path bleibt geschlossen.

Current Development `yfvbxvijcorffwxbxahl` besitzt weder diese Migration-Version noch die S5-B Provenance-/Runtime-Gate-Objekte/Rollen.

**Keine Reparatur wurde ausgeführt.** Vor einem künftigen Rebase/Reset/Replay-/migrationsnahen Slice ist dies P1 Infrastructure Debt. Eine History-Reparatur ist ein separater Product-Owner-Gate mit Backup/PITR-/Before-Image- und Replay-Nachweis.

Kanonische Audit-Evidence:

- `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_LIVE_EVIDENCE_2026-08-29.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_RECOMMENDATION_2026-08-29.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_HANDOFF_2026-08-29.md`

---

## 4. Aktive Agenten / Provider

Die zuletzt eingesetzten Agenten sind gestoppt und ihre Slices abgeschlossen:

- `Account plattform audit vorbereitung 17` – AP-7-S3;
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate-0 Audit.

Provider-Arbeit ist weiterhin nicht abgeschlossen. Echte Provideraktivierung, Secrets/paid calls und weitere Runtime-Slices bleiben hinter Binding Build Order und besonderen Gates. TW-8 bleibt geschlossen.

---

## 5. Risiken und besondere Product-Owner-Gates

- P0: keine aus den aktuellen Closures bekannten.
- P1 Infrastructure Debt: malformed Production Migration-History-Body `20260829140000` vor migrationsnahem Replay/Rebase/Reset.
- P2 Governance: `main protected=false`.

Ausdrückliche Product-Owner-Entscheidung bleibt erforderlich insbesondere vor neuen Production-Migrationen/destruktiven Production-Datenänderungen, materiellen produktiven RLS-/Identity-/Ownership-Vertragsänderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Öffnung geschlossener Commercial-Write-Pfade, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

Routine-Technik, unabhängige Reviews und normale scope-treue Merges bleiben Technical-Lead-autonom.

---

## 6. Pflichtlektüre vor einem neuen Slice

Mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
6. `JETNITY_HANDOFF.md`
7. `docs/ACTIVE_WORK_STATUS.md`
8. `docs/CHATGPT_TL_AP7_S3_AND_INFRA_AUDIT_POST_MERGE_CHECKPOINT_2026-08-29.md`
9. konkret relevante Task-/Status-/Handoff-/ADR-Dateien;
10. danach Live-GitHub/CI/Vercel/Supabase-Evidence.

Bei Chatwechsel zusätzlich `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`.

---

## 7. Exakter nächster Schritt

1. Frischen Binding Slice Precheck ausführen.
2. Aktuellen `main`, offene PRs/Issues/Branches und CI/Vercel/Supabase live prüfen.
3. Account-/Traveller-Restarbeit gegen Binding Build Order und Provider-Restarbeit abgleichen.
4. Bei jedem migrationsnahen Kandidaten den Supabase Replay-Defekt als P1-Abhängigkeit behandeln.
5. Erst danach den nächsten bounded Slice bestimmen und dafür eine frische Cursor-Agent-Generation anstoßen.

Registry→Trip Runtime-Materialisierung ist ein naheliegender AP-7-Kandidat, aber **nicht durch diesen Checkpoint freigegeben**.