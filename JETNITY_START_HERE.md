# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 30. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice – auch im selben Chat – muss zuerst der relevante Live-Stand rekonstruiert werden. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

Verbindliches Start-/Continuity-Gate:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

Aktuellster Technical-Lead-Checkpoint:

`docs/CHATGPT_TL_TA_CUX1_POST_MERGE_CHECKPOINT_2026-08-30.md`

Verbindliche Produktstrategie:

- `docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`
- `docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`

Dieser Einstieg ersetzt keine Live-Prüfung. Vor Änderung, Review, Ready oder Merge immer `main`, relevante PRs/Heads, CI, Vercel, Supabase/Production-Evidence, offene Issues und parallele Workstreams live verifizieren.

---

## 1. Aktuellster vollständig verifizierter Runtime-Stand

- `main @ 292e52bf76d78eef1e9967b15a189ffaeca16ceb`
- TA-DL1 Document Lifecycle / Trip-Date Awareness ist integriert.
- AP-UX-NAV1 Mobile Account Navigation Rail + `/reisen` consistency ist integriert.
- **TA-CUX1 Shared Country UX ist integriert.**
- Post-Merge CI #1326 / Run `33286617319`: **SUCCESS** auf exact `main`.
- Vercel Production auf exact `main`: **SUCCESS / READY**.
- `main protected=false` bleibt Governance-Risiko.

**Kein Produkt-/Runtime-Folgeslice ist automatisch aktiv.**

---

## 2. Verbindlicher Produkt-Nordstern

Jetnity wird **nicht** als weiterer generischer Reiseplaner oder über Feature-Parität aufgebaut.

Arbeitsbegriff:

> **Jetnity = Travel Operating System für die konkrete Reise.**

Drei Produktpfeiler:

1. **Planen** – natürliche Reiseabsicht in eine zusammenhängende Reise verwandeln.
2. **Entscheiden** – belegte Trade-offs der Gesamtreise statt isolierter Preis-/Optionslisten erklären.
3. **Reisebereit sein** – aus Traveller-, Route-, Dokument-, Requirements- und Commercial-Truth ehrlich ableiten, was belegt, offen, riskant oder erneut zu prüfen ist.

Vor neuen Produktfeatures gilt verbindlich:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Jeder größere neue Product-/Runtime-Slice benötigt künftig einen dokumentierten **Differentiation Impact** oder eine **Enabler Justification**. Security, Privacy, Reliability, Accessibility und Compliance dürfen unabhängig davon höchste Priorität haben.

Das strategische Opportunity Register bewahrt sieben Kandidaten dauerhaft, **ohne sie automatisch zu autorisieren**:

- Trip Audit / Journey Integrity;
- Change Impact & Recovery;
- Multi-Citizenship / Entry Decision Engine;
- True Trip Cost;
- Route & Connection Feasibility;
- What-if Simulator;
- Next Best Action.

Issue #236 bleibt absichtlich als Strategy Pointer offen: **do not auto-start runtime**.

---

## 3. Traveller / Account – Current Truth

Kanonisches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Verbindliche Dual-Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Integriert sind u. a.:

- trip-scoped Foundation E;
- 1:n Citizenships / 1:n Documents;
- Issuer Country ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-/Primary-/Preferred-/Chosen-Pass und keine Default-Citizenship;
- Guest→Account Trip-Copy erhält Arrays/Relation;
- AP-7 Gate 0 + Dual-Authority-Freigabe;
- AP-7-S1 Domain Contract;
- AP-7-S2 Account Registry Persistence / Identity / owner-only RLS auf Production;
- AP-7-S3 reale `/account/travellers` CRUD/UI;
- AP-7-S4 explizite Registry → unabhängige Trip-Snapshot-Materialisierung;
- TA-DL1 kalenderdatums-/timezone-sichere Document-Lifecycle-Auswertung;
- AP-UX-NAV1 Account Navigation Rail;
- **TA-CUX1 gemeinsame Country-Auswahl/-Darstellung für Account Registry + Trip Workspace.**

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

---

## 4. TA-CUX1 – Country UX integriert

Issue #233: **CLOSED / completed**.  
Agent: `Account plattform audit vorbereitung 21` – **STOPPED / completed**.

Final independently reviewed Source Head:

`3e021f534ca97f32dda4260138403ab4e9840c72`

Integration:

- Source CI #1324 / Run `33286044982`: SUCCESS;
- Source Vercel Preview: SUCCESS;
- 0 Review Threads;
- bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId`;
- Recovery PR #238 auf exakt demselben PASS-SHA;
- Recovery CI #1325 / Run `33286509759`: SUCCESS;
- Recovery Vercel: SUCCESS;
- Merge/Main `292e52bf76d78eef1e9967b15a189ffaeca16ceb`;
- Post-Merge CI #1326 / Run `33286617319`: SUCCESS;
- Vercel Production: SUCCESS.

Current Product Behavior:

- Persistenz/Domain bleibt kanonischer ISO-3166-1-alpha-2-Code.
- Normale UI zeigt Flagge + lokalisierten vollständigen Ländernamen statt technischer `CH`/`HR`-Eingabe.
- Ein gemeinsamer Katalog enthält die 249 offiziell zugewiesenen ISO-3166-1-alpha-2-Codes.
- Ein gemeinsames `LandFeld` wird in Account Registry und Trip Workspace Traveller-Kontext verwendet.
- Control ist accessibility-first: natives `<select>` plus lokalisierter Namensfilter, keine riskante Custom-Combobox.
- Keine automatische Country-Vorauswahl aus Locale, Browser oder IP.
- Issuer, Citizenship und Residence bleiben getrennte Facts.
- Mehrere Citizenships/Documents sowie nullable Document→Citizenship-Relation bleiben erhalten.
- Legacy/unbekannte bestehende Zwei-Buchstaben-Codes werden ehrlich als bestehender Code angezeigt und nicht still überschrieben; sie sind nicht neu auswählbar.
- Locale-Foundation ist explizit für DE/EN/FR/IT/ES/PT/PL parametrisiert; kein vollständiger App-i18n-Rollout wurde vorgetäuscht.
- Keine Migration, kein Schema/RLS/Auth/Supabase/Provider-Scope und keine neue npm-Abhängigkeit.

---

## 5. Supabase Migration-History Replay – P1 bleibt offen

Production `qscbgcdmivbbnzrcyegn` besitzt Version `20260829140000_trip_item_commercial_provenance`, deren gespeicherte einzige Statement-Body ein **nicht replaybarer Prosa-Marker** ist. Der Production S5-B Catalog existiert trotzdem und der Production Write Path bleibt geschlossen.

Current Development `yfvbxvijcorffwxbxahl` besitzt weder diese Migration-Version noch die S5-B Provenance-/Runtime-Gate-Objekte/Rollen.

Vor einem künftigen Rebase/Reset/Replay-/migrationsnahen Slice ist dies **P1 Infrastructure Debt**. Eine History-Reparatur bleibt ein separater Product-Owner-Gate mit Backup/PITR-/Before-Image- und Replay-Nachweis.

---

## 6. Provider / große Build-Reihenfolge

Provider-Arbeit ist weiterhin nicht abgeschlossen. Echte Provideraktivierung, Secrets/paid calls, Production Runtime Principal und weitere Live-Runtime-Slices bleiben hinter Binding Build Order und besonderen Gates. TW-8 bleibt geschlossen hinter Provider S5 + realer Commercial Provenance.

`docs/JETNITY_BINDING_BUILD_ORDER.md` bleibt Product-Owner-binding. Die Product Differentiation Doctrine ergänzt den Priorisierungsfilter, ändert aber die große Build Order nicht still.

---

## 7. Agentenstatus

Gestoppt / abgeschlossen:

- `Account plattform audit vorbereitung 21` – TA-CUX1;
- `Account plattform audit vorbereitung 20` – AP-UX-NAV1;
- `Account plattform audit vorbereitung 19` – TA-DL1;
- `Account plattform audit vorbereitung 18` – AP-7-S4;
- `Account plattform audit vorbereitung 17` – AP-7-S3;
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate-0 Audit.

Aktiver Cursor-Agent: **keiner durch diesen Status autorisiert**.

Neue logische Einheit → frische Cursor-Agent-Generation erst nach Binding Slice Precheck. Review-Fix → derselbe gespeicherte Agent/dieselbe Session.

---

## 8. Risiken und besondere Product-Owner-Gates

- P0: keine aus den aktuellen Closures bekannten.
- P1 Infrastructure Debt: malformed Production Migration-History-Body `20260829140000` vor migrationsnahem Replay/Rebase/Reset.
- P2 Governance: `main protected=false`.

Ausdrückliche Product-Owner-Entscheidung bleibt erforderlich insbesondere vor Production-Migrationen/destruktiven Production-Datenänderungen, materiellen produktiven RLS-/Identity-/Ownership-Vertragsänderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Öffnung geschlossener Commercial-Write-Pfade, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

Routine-Technik, unabhängige Reviews und normale scope-treue Merges bleiben Technical-Lead-autonom nach vollständigem Exact-Head-Gating.

---

## 9. Pflichtlektüre vor einem neuen Slice

Mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`
6. `docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`
7. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
8. `JETNITY_HANDOFF.md`
9. `docs/ACTIVE_WORK_STATUS.md`
10. `docs/CHATGPT_TL_TA_CUX1_POST_MERGE_CHECKPOINT_2026-08-30.md`
11. konkret relevante Task-/Status-/Handoff-/ADR-Dateien;
12. danach Live-GitHub/CI/Vercel/Supabase-Evidence.

Bei Chatwechsel zusätzlich `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`.

---

## 10. Exakter nächster Schritt

1. Frischen Binding Slice Precheck ausführen.
2. Aktuellen `main`, offene PRs/Issues/Branches, CI/Vercel und bei DB-Bezug Supabase live prüfen.
3. Binding Build Order + Account Platform Plan gegen AP-7-S1–S4 + TA-DL1 + AP-UX-NAV1 + TA-CUX1 reconciliieren.
4. Verbleibende Traveller-/Multi-Citizenship-/Requirements-/Route-/Account-Lücken priorisieren.
5. Für jeden Kandidaten **Differentiation Impact** oder **Enabler Justification** dokumentieren.
6. Opportunity Register #236 nicht als automatische Bau-Reihenfolge behandeln; vor einem solchen Slice Markt/Nutzerwert/Evidence neu prüfen.
7. Bei migrationsnahen Kandidaten zuerst Replay-P1 behandeln.
8. Erst danach bounded Slice(s), Kollisionsmatrix und neue Cursor-Agent-Generation(en) bestimmen.

**Kein Folgeslice ist automatisch freigegeben.**