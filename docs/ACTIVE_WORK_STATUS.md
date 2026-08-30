# Jetnity – Active Work Status

Stand: 30. August 2026  
Status: **CURRENT / TA-DL1 + AP-UX-NAV1 CLOSED / NO AUTOMATIC FOLLOW-UP / LIVE-EVIDENCE GEWINNT**

> Diese Datei ist ein Current-State-Pointer, kein historisches Archiv. Vor jedem neuen Slice gilt `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

## 1. Aktueller Arbeitsblock

**Kein Produkt-/Runtime-Slice automatisch aktiv.**

Letzter vollständig post-merge verifizierter Runtime-`main`:

- `ebaead3263c57298f5102df6cffeff49e6bd6ea6`
- Post-Merge CI: #1311 / Run `33282649222` = **SUCCESS**
- Vercel Production Deployment `6aViQ9poQF2p4WWoxiQ8o3aDWkcz` = **SUCCESS / READY** exact `main`
- Branch Protection: `protected=false`

Aktuellster Checkpoint:

`docs/CHATGPT_TL_TA_DL1_AND_AP_UX_NAV1_POST_MERGE_CHECKPOINT_2026-08-30.md`

## 2. Unmittelbar abgeschlossen – TA-DL1

Issue #226: **CLOSED / completed**.

- Cursor-Agent: `Account plattform audit vorbereitung 19` – STOPPED
- final reviewed Head: `d9c16415b56a624812aa57b2d6110346f24ca633`
- Source CI #1302: SUCCESS
- Recovery PR #230 / CI #1305: SUCCESS
- Merge/Main danach: `20c203f5bee950b43db611f220c7cc5b88699dcb`
- Post-Merge CI #1306: SUCCESS

Geliefert: kalenderdatums-/timezone-sichere Document-Lifecycle-Auswertung je Dokument in Account Registry und Trip Workspace. Missing/invalid fail closed. Keine Visa-/Einreise-/Boarding-Sufficiency, kein Default-/Primary-/Preferred-/Chosen-Credential, kein Ranking, keine Migration/RLS/Auth/Supabase-Mutation.

Governance-Fix: Agent 19 hatte `docs/ACTIVE_WORK_STATUS.md` unzulässig überschrieben; vor PASS vollständig aus Feature-Diff entfernt.

## 3. Unmittelbar abgeschlossen – AP-UX-NAV1

Issue #228: **CLOSED / completed**.

- Cursor-Agent: `Account plattform audit vorbereitung 20` – STOPPED
- final reviewed/integrated Runtime Head: `23e3885f89d0f1f71cd99cf9aef454a78f41ca66`
- Source CI #1308: SUCCESS
- Recovery PR #231 / CI #1310: SUCCESS
- Merge/Main: `ebaead3263c57298f5102df6cffeff49e6bd6ea6`
- Post-Merge CI #1311: SUCCESS
- Production Vercel: SUCCESS / READY

Geliefert:

- Mobile Account Navigation als einzeilige horizontal scrollbare Tab-Rail;
- kein 2×2-Grid, kein custom Swipe-to-Navigate;
- Reihenfolge Übersicht → Reisen → Reisende → Einstellungen;
- aktiver Tab bleibt semantisch und wird horizontal sichtbar gemacht;
- eingeloggte `/reisen`-Nutzer sehen die gemeinsame Account Navigation;
- Gäste sehen dort keine Account Navigation;
- keine neue Auth-Wahrheit;
- Sticky bewusst nicht erzwungen.

Review-Fix: `touch-pan-x` wurde entfernt, damit vertikales Page-Scrolling auf iPhone nicht durch eine auf der Rail begonnene Geste blockiert wird.

Source PR #229 erhielt nach dem gegateten Runtime Head noch `08a626c466631cc2e0d1d434d58d28241c625faa`, einen reinen Slice-Doku-Evidence-Stamp ohne Runtime. Er wurde nicht nachträglich in den SHA-gelockten Runtime-Merge gezogen; TL-Continuity superseded diesen Stamp. Source PR #229 ist geschlossen.

## 4. Traveller / Account – aktueller Reifegrad

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
- AP-UX-NAV1 Account Navigation Rail.

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

## 5. Product Direction – Country UX noch nicht gebaut

Künftige UX-Richtung:

- ISO-2 bleibt intern kanonisch;
- Nutzer sollen Codes wie `CH`/`HR` nicht kennen oder eintippen müssen;
- UI soll suchbare lokalisierte vollständige Ländernamen, sinnvollerweise mit Flagge, zeigen;
- intern wird weiterhin ISO-2 gespeichert;
- wiederverwendbar für Wohnsitz, Citizenship und Issuing Country;
- Issuer ≠ Citizenship; keine automatische Ableitung/Vorauswahl/Default-Semantik.

**Noch kein Slice autorisiert.** Frischer Precheck erforderlich.

## 6. Supabase Replay Gate 0 / P1 Infrastructure Debt

Unverändert:

Production History-Version `20260829140000_trip_item_commercial_provenance` besitzt einen nicht replaybaren Prosa-Statement-Body, obwohl der Production S5-B Catalog existiert. Development besitzt weder die Version noch S5-B Objekte/Rollen.

Keine Reparatur ausgeführt. Vor migrationsnahem Replay/Rebase/Reset ist dies P1 und separat PO-gated.

## 7. Agentenstatus

Gestoppt / abgeschlossen:

- `Account plattform audit vorbereitung 20` – AP-UX-NAV1
- `Account plattform audit vorbereitung 19` – TA-DL1
- `Account plattform audit vorbereitung 18` – AP-7-S4
- `Account plattform audit vorbereitung 17` – AP-7-S3
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate-0 Audit

Aktiver Cursor-Agent: **keiner**.

Neue logische Einheit → frischer Agent erst nach Binding Slice Precheck. Review-Fix → derselbe Agent.

## 8. Provider / Risiken / Gates

Provider-Arbeit bleibt nicht abgeschlossen. Echte Provider-Secrets/API-Keys, echte Calls, Production Runtime Principal, `live_api`-/`persisted_snapshot`-Runtime und TW-8 bleiben nicht aktiviert. TW-8 bleibt hinter Provider S5 + realer Commercial Provenance.

- P0: keine aus den aktuellen Closures bekannten.
- P1: malformed Production Migration-History-Body `20260829140000` vor migrationsnaher Arbeit.
- P2: `main protected=false`.

Besondere PO-Gates bleiben vor Production-Migrationen/destruktiven Datenänderungen, materiellen RLS-/Identity-/Ownership-Änderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Commercial Runtime Write-Öffnung, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

## 9. Exakter nächster Schritt

1. Frischen Binding Slice Precheck ausführen.
2. `main`, offene PRs/Issues/Branches, CI/Vercel/Supabase live rekonstruieren.
3. Binding Build Order + Account Platform Plan gegen AP-7-S1–S4 + TA-DL1 + AP-UX-NAV1 reconciliieren.
4. verbleibende Traveller-/Multi-Citizenship-/Country-UX-Lücken priorisieren.
5. Country-Picker als möglichen migrationsfreien UX-Slice prüfen, aber nicht automatisch starten.
6. bei migrationsnaher Arbeit zuerst Replay-P1 behandeln.
7. erst danach bounded Slice(s) und neue Agenten bestimmen.

**Kein Folgeslice ist automatisch freigegeben.**
