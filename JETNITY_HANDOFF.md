# Jetnity – Handoff und nächste Schritte

Stand: 30. August 2026  
Status: **CURRENT HANDOFF / TA-CUX1 POST-MERGE VERIFIED / PRODUCT DIFFERENTIATION PERSISTED / LIVE-EVIDENCE GEWINNT**

Dieser Handoff ist Current-State-Evidence, kein Ersatz für Live-Rekonstruktion. Vor jedem neuen Slice gilt verbindlich `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

## 1. Aktuellster verifizierter Stand

Aktueller vollständig post-merge und Production-verifizierter Runtime-Baseline-Stand:

- `main @ 292e52bf76d78eef1e9967b15a189ffaeca16ceb`
- Post-Merge CI #1326 / Run `33286617319`: **SUCCESS**
- Vercel Production auf exact `main`: **SUCCESS / READY**
- `main protected=false` bleibt Governance-Risiko.

Aktuellster Checkpoint:

`docs/CHATGPT_TL_TA_CUX1_POST_MERGE_CHECKPOINT_2026-08-30.md`

Es gibt aus diesem Handoff **keinen automatisch aktiven Produkt-/Runtime-Slice**.

## 2. TA-CUX1 – abgeschlossen

Issue #233: **CLOSED / completed**.

Agent:

- `Account plattform audit vorbereitung 21` – STOPPED / completed.

Final independently reviewed Source Head:

- `3e021f534ca97f32dda4260138403ab4e9840c72`

Gates / Integration:

- Source CI #1324 / Run `33286044982`: SUCCESS;
- Source Vercel Preview: SUCCESS;
- 0 GitHub Review Threads;
- bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId`;
- Recovery PR #238 mit exakt identischem reviewed Head;
- Recovery CI #1325 / Run `33286509759`: SUCCESS;
- Recovery Vercel Preview: SUCCESS;
- 0 Recovery Review Threads;
- Merge mit Expected-Head-Lock;
- Merge/Main `292e52bf76d78eef1e9967b15a189ffaeca16ceb`;
- Post-Merge CI #1326 / Run `33286617319`: SUCCESS;
- Vercel Production: SUCCESS / READY.

Geliefert:

- eine gemeinsame Country Foundation für Account Registry und Trip Workspace Traveller-Kontext;
- offizieller auswählbarer ISO-3166-1-alpha-2-Katalog mit 249 Codes;
- lokalisierte Country-Namen via expliziter Locale und Flag-Presentation;
- gemeinsame `LandFeld`-Control als natives Select plus Namensfilter;
- keine sichtbaren ISO-2-Freitextfelder in den beiden Scope-Flächen;
- Codes bleiben Persistenz-/Domain-Wahrheit, Namen/Flaggen bleiben Presentation;
- keine automatische Vorauswahl aus IP/Locale/Browser und kein First-Item-Default;
- Issuer Country bleibt unabhängig von Citizenship und Residence;
- Multi-Citizenship/Multi-Document + nullable Document→Citizenship bleiben verlustfrei;
- unbekannte bestehende Zwei-Buchstaben-Codes bleiben als Legacy-Werte sichtbar, werden nicht still umgedeutet und sind nicht neu auswählbar;
- DE/EN/FR/IT/ES/PT/PL sind in der Country-Presentation locale-parametrisiert;
- keine Migration, kein Schema/RLS/Auth/Supabase/Provider-Scope, keine neue npm-Abhängigkeit.

Agent-Self-Review meldete 2759/2759 Tests und zusätzliche Account/Trip-UI-Prüfungen. Der Technical Lead verließ sich nicht darauf, sondern prüfte den finalen Diff, Truth-/Scope-Grenzen, aktuelle CI/Vercel-Evidence und die Drift zu `main` unabhängig. Die `main`-Drift bestand ausschließlich aus disjunkten Strategie-Dokumenten und erforderte keinen Rebase nur der Form halber.

## 3. Traveller / Account – kumulative Current Truth

Verbindliche Authority-Grenze:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Verbindliches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Integriert:

- AP-7 Gate 0 + Dual-Authority PO approval;
- AP-7-S1 pure Domain Contract;
- AP-7-S2 Account Registry Persistence / Identity / owner-only RLS auf Production;
- AP-7-S3 Registry CRUD/UI;
- AP-7-S4 Registry → unabhängige Trip Snapshot Runtime-Materialisierung;
- TA-DL1 Document Calendar Lifecycle;
- AP-UX-NAV1 skalierbare Mobile Account Navigation;
- TA-CUX1 Shared localized Country UX.

Kein Default-/Primary-/Preferred-/Chosen-Pass oder Default-Citizenship. Issuer Country bleibt Citizenship-unabhängig. Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

## 4. Product Differentiation – verbindlich

Product-Owner-verbindliche Doctrine:

`docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`

Jetnity wird **nicht** als weiterer generischer Reiseplaner gebaut. Langfristiger Arbeitsbegriff:

> **Jetnity = Travel Operating System für die konkrete Reise.**

Produktpfeiler:

- Planen;
- Entscheiden;
- Reisebereit sein.

Verbindliche Feature-Frage:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Jeder größere neue Product-/Runtime-Slice braucht einen **Differentiation Impact** oder eine **Enabler Justification**.

Strategisches Opportunity Register:

`docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`

Darin dauerhaft erhalten, aber **nicht automatisch autorisiert**:

1. Trip Audit / Journey Integrity;
2. Change Impact & Recovery;
3. Multi-Citizenship / Entry Decision Engine;
4. True Trip Cost;
5. Route & Connection Feasibility;
6. What-if Simulator;
7. Next Best Action.

Issue #236 bleibt absichtlich offen als persistenter Strategy Pointer und darf nicht als Runtime-Freigabe interpretiert werden.

Die wöchentliche Wettbewerbsbeobachtung ist ein Produkt-Owner-seitig eingerichteter zusätzlicher Marktcheck; sie ersetzt keinen aktuellen Wettbewerbscheck vor einem konkreten Differenzierungs-Slice.

## 5. Supabase Migration-History Replay – P1 bleibt offen

Production `qscbgcdmivbbnzrcyegn` besitzt für Version `20260829140000_trip_item_commercial_provenance` eine nicht replaybare Prosa-Statement-Body, obwohl der Production S5-B Catalog existiert. Development besitzt weder die Version noch die S5-B Objekte/Rollen.

Keine Reparatur wurde ausgeführt. Vor migrationsnahem Replay/Rebase/Reset bleibt dies **P1 Infrastructure Debt** und ein separater Product-Owner-gated Repair mit Backup/PITR/Before-Image/Replay-Proof.

## 6. Provider – Current Truth

Provider-Arbeit ist nicht abgeschlossen. Echte Provider-Secrets/API-Keys, echte Calls, Production Runtime Principal, realer `live_api`-/`persisted_snapshot`-Pfad und TW-8 bleiben nicht freigegeben/aktiviert. TW-8 bleibt hinter Provider S5 + realer Commercial Provenance.

## 7. Agentenstatus

Gestoppt / abgeschlossen:

- `Account plattform audit vorbereitung 21` – TA-CUX1;
- `Account plattform audit vorbereitung 20` – AP-UX-NAV1;
- `Account plattform audit vorbereitung 19` – TA-DL1;
- `Account plattform audit vorbereitung 18` – AP-7-S4;
- `Account plattform audit vorbereitung 17` – AP-7-S3;
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate 0.

Aktiver Cursor-Agent: **keiner durch diesen Handoff autorisiert**.

Neue logische Einheit → frische Agenten-Generation nach Binding Slice Precheck. Review-Fix innerhalb eines laufenden Slices → derselbe gespeicherte Agent/dieselbe Session.

## 8. Risiken und Gates

- P0: keine aus den aktuellen Closures bekannten.
- P1 Infrastructure Debt: malformed Production Migration-History-Body `20260829140000` vor Rebase/Reset/Replay-/migrationsnaher Arbeit.
- P2 Governance: `main protected=false`.

Product-Owner-Entscheidung bleibt erforderlich vor insbesondere Production-Migrationen/destruktiven Datenänderungen, materiellen RLS-/Identity-/Ownership-Änderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Öffnung des Commercial Runtime Write-Pfads, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

Normale scope-treue Technik/Reviews/Merges bleiben TL-autonom nach unabhängiger Exact-Head-Prüfung.

## 9. Exakter nächster Schritt

**Kein automatischer Folgeslice.**

Neuer Chat/Technical Lead muss zuerst:

1. `main`, offene PRs/Issues/Branches, CI/Vercel und bei DB-Bezug Supabase live rekonstruieren;
2. Binding Build Order und `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` gegen AP-7-S1–S4 + TA-DL1 + AP-UX-NAV1 + TA-CUX1 reconciliieren;
3. verbleibende Traveller-/Multi-Citizenship-/Requirements-/Route-/Account-Lücken bestimmen;
4. je Kandidat **Differentiation Impact** oder **Enabler Justification** festhalten;
5. Opportunity Register/Issue #236 nicht automatisch abarbeiten, sondern aktuellen Nutzerwert, Wettbewerb und notwendige Evidence neu prüfen;
6. bei migrationsnahen Kandidaten den Replay-Defekt als P1-Abhängigkeit behandeln;
7. P0/P1/P2/P3 und PO-Gates neu bewerten;
8. erst danach bounded Slice(s), Kollisionsmatrix und neue Cursor-Agent-Generation(en) festlegen.

## 10. Pflicht für Übernahme

Neuer Chat liest zuerst:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`
6. `docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`
7. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
8. `docs/ACTIVE_WORK_STATUS.md`
9. diesen Handoff
10. `docs/CHATGPT_TL_TA_CUX1_POST_MERGE_CHECKPOINT_2026-08-30.md`
11. relevante Task/Status/Handoff/ADR-Dateien
12. danach Live-GitHub/CI/Vercel/Supabase.