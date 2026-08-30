# Jetnity – Active Work Status

Stand: 30. August 2026  
Status: **CURRENT / TA-CUX1 CLOSED / NO AUTOMATIC FOLLOW-UP / LIVE-EVIDENCE GEWINNT**

> Diese Datei ist ein Current-State-Pointer, kein historisches Archiv. Vor jedem neuen Slice gilt `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

## 1. Aktueller Arbeitsblock

**Kein Produkt-/Runtime-Slice automatisch aktiv.**

Letzter vollständig post-merge verifizierter Runtime-`main`:

- `292e52bf76d78eef1e9967b15a189ffaeca16ceb`
- Post-Merge CI #1326 / Run `33286617319` = **SUCCESS**
- Vercel Production = **SUCCESS / READY** auf exact `main`
- Branch Protection: `protected=false`

Aktuellster Checkpoint:

`docs/CHATGPT_TL_TA_CUX1_POST_MERGE_CHECKPOINT_2026-08-30.md`

## 2. Unmittelbar abgeschlossen – TA-CUX1

Issue #233: **CLOSED / completed**.

- Cursor-Agent: `Account plattform audit vorbereitung 21` – STOPPED / completed
- final independently reviewed Source Head: `3e021f534ca97f32dda4260138403ab4e9840c72`
- Source CI #1324 / Run `33286044982`: SUCCESS
- Source Vercel Preview: SUCCESS
- 0 Review Threads
- Draft→Ready scheiterte am bekannten Connectorfehler `Repository.fullDatabaseId`
- Recovery PR #238 exakt auf demselben PASS-SHA
- Recovery CI #1325 / Run `33286509759`: SUCCESS
- Recovery Vercel: SUCCESS
- Merge/Main: `292e52bf76d78eef1e9967b15a189ffaeca16ceb`
- Post-Merge CI #1326 / Run `33286617319`: SUCCESS
- Production Vercel: SUCCESS / READY

Geliefert:

- eine Shared Country Foundation für Account Registry und Trip Workspace;
- 249 offiziell zugewiesene ISO-3166-1-alpha-2-Codes als neu auswählbarer Katalog;
- persistierte/domainseitige Country-Wahrheit bleibt Code;
- User-facing Darstellung = Flagge + lokalisierter vollständiger Ländername;
- gemeinsame accessibility-first Country-Control = natives Select + Namensfilter;
- kein sichtbares ISO-2-Freitextfeld in den beiden Traveller-Scope-Flächen;
- kein Defaultland, keine Locale/IP/Browser-Vorauswahl;
- Issuer Country ≠ Citizenship;
- Multi-Citizenship/Multi-Document und nullable Document→Citizenship bleiben erhalten;
- bestehende unbekannte Zwei-Buchstaben-Codes bleiben ehrlich sichtbar und werden nicht still überschrieben;
- Foundation ist für DE/EN/FR/IT/ES/PT/PL locale-parametrisiert;
- keine Migration/RLS/Auth/Supabase/Provider-/Dependency-Erweiterung.

## 3. Kumulativer Traveller-/Account-Reifegrad

Verbindlicher Vertrag:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Verbindliche Dual-Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Integriert:

- Trip-scoped 1:n Citizenships/Documents;
- Issuer ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-/Primary-/Preferred-/Chosen-Pass und keine Default-Citizenship;
- Guest→Account Trip-Copy erhält Arrays/Relation;
- AP-7 Gate 0 + Dual-Authority;
- AP-7-S1 Domain Contract;
- AP-7-S2 Account Registry Persistence / owner-only RLS;
- AP-7-S3 Registry CRUD/UI;
- AP-7-S4 Registry → unabhängige Trip Snapshot Materialisierung;
- TA-DL1 Document Lifecycle;
- AP-UX-NAV1 Account Navigation Rail;
- TA-CUX1 Shared localized Country UX.

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

## 4. Product Differentiation – verbindliche Current Truth

Verbindlich:

`docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`

> **Jetnity wird nicht gebaut, um der Reiseplaner mit den meisten Funktionen zu sein. Jetnity soll die konkrete Reise besser verstehen als gewöhnliche Reiseplaner und daraus belegte, kontextbezogene Entscheidungen und Reisebereitschaft ableiten.**

Leitfrage für neue Features:

> **Macht das Jetnity einzigartiger oder nur größer?**

Strategisches Register:

`docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`

Persistierte Kandidaten:

- Trip Audit / Journey Integrity;
- Change Impact & Recovery;
- Multi-Citizenship / Entry Decision Engine;
- True Trip Cost;
- Route & Connection Feasibility;
- What-if Simulator;
- Next Best Action.

Issue #236 bleibt als offener Strategy Pointer bestehen. **Das Register ist keine automatische Roadmap und autorisiert keinen Runtime-Slice.**

## 5. Supabase Replay Gate 0 / P1 Infrastructure Debt

Unverändert:

Production History-Version `20260829140000_trip_item_commercial_provenance` besitzt einen nicht replaybaren Prosa-Statement-Body, obwohl der Production S5-B Catalog existiert. Development besitzt weder die Version noch S5-B Objekte/Rollen.

Keine Reparatur ausgeführt. Vor migrationsnahem Replay/Rebase/Reset ist dies P1 und separat PO-gated.

## 6. Agentenstatus

Gestoppt / abgeschlossen:

- `Account plattform audit vorbereitung 21` – TA-CUX1
- `Account plattform audit vorbereitung 20` – AP-UX-NAV1
- `Account plattform audit vorbereitung 19` – TA-DL1
- `Account plattform audit vorbereitung 18` – AP-7-S4
- `Account plattform audit vorbereitung 17` – AP-7-S3
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate-0 Audit

Aktiver Cursor-Agent: **keiner**.

Neue logische Einheit → frischer Agent erst nach Binding Slice Precheck. Review-Fix → derselbe Agent.

## 7. Provider / Risiken / Gates

Provider-Arbeit bleibt nicht abgeschlossen. Echte Provider-Secrets/API-Keys, echte Calls, Production Runtime Principal, `live_api`-/`persisted_snapshot`-Runtime und TW-8 bleiben nicht aktiviert. TW-8 bleibt hinter Provider S5 + realer Commercial Provenance.

- P0: keine aus den aktuellen Closures bekannten.
- P1: malformed Production Migration-History-Body `20260829140000` vor migrationsnaher Arbeit.
- P2: `main protected=false`.

Besondere PO-Gates bleiben vor Production-Migrationen/destruktiven Datenänderungen, materiellen RLS-/Identity-/Ownership-Änderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Commercial Runtime Write-Öffnung, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

## 8. Exakter nächster Schritt

1. Frischen Binding Slice Precheck ausführen.
2. `main`, offene PRs/Issues/Branches, CI/Vercel und bei DB-Bezug Supabase live rekonstruieren.
3. Binding Build Order + Account Platform Plan gegen AP-7-S1–S4 + TA-DL1 + AP-UX-NAV1 + TA-CUX1 reconciliieren.
4. Verbleibende Traveller-/Multi-Citizenship-/Requirements-/Route-/Account-Lücken priorisieren.
5. Pro Kandidat **Differentiation Impact** oder **Enabler Justification** festhalten.
6. Strategy Issue #236 und Opportunity Register nur als Kandidatenpool verwenden; vor Umsetzung aktuellen Markt/Nutzerwert/Evidence neu prüfen.
7. Bei migrationsnaher Arbeit zuerst Replay-P1 behandeln.
8. Erst danach bounded Slice(s) und neue Agenten bestimmen.

**Kein Folgeslice ist automatisch freigegeben.**