# Jetnity – Handoff und nächste Schritte

Stand: 30. August 2026  
Status: **CURRENT HANDOFF / TA-DL1 + AP-UX-NAV1 POST-MERGE VERIFIED / LIVE-EVIDENCE GEWINNT**

Dieser Handoff ist Current-State-Evidence, kein Ersatz für Live-Rekonstruktion. Vor jedem neuen Slice gilt verbindlich `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

## 1. Aktuellster verifizierter Stand

Aktueller vollständig post-merge und Production-verifizierter Runtime-Baseline-Stand:

- `main @ ebaead3263c57298f5102df6cffeff49e6bd6ea6`
- Post-Merge CI #1311 / Run `33282649222`: **SUCCESS**
- Vercel Production Deployment `6aViQ9poQF2p4WWoxiQ8o3aDWkcz`: **SUCCESS / READY** auf exact `main`
- `main protected=false` bleibt Governance-Risiko.

Aktuellster Checkpoint:

`docs/CHATGPT_TL_TA_DL1_AND_AP_UX_NAV1_POST_MERGE_CHECKPOINT_2026-08-30.md`

Es gibt aus diesem Handoff **keinen automatisch aktiven Produkt-/Runtime-Slice**.

## 2. TA-DL1 – abgeschlossen

Issue #226: **CLOSED / completed**.

Agent:

- `Account plattform audit vorbereitung 19` – STOPPED.

Final independently reviewed Source Head:

- `d9c16415b56a624812aa57b2d6110346f24ca633`

Gates / Integration:

- Source CI #1302 / Run `33281760672`: SUCCESS;
- Vercel Source Preview: SUCCESS;
- bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId`;
- Recovery PR #230 mit identischem reviewed Head;
- Recovery CI #1305 / Run `33282195722`: SUCCESS;
- Merge/Main danach `20c203f5bee950b43db611f220c7cc5b88699dcb`;
- Post-Merge CI #1306: SUCCESS;
- später durch AP-UX-NAV1 in den aktuellen `main` fortgeschrieben.

Geliefert:

- reine, kalenderdatums-/timezone-sichere Auswertung von `expiresOn`;
- fehlende/ungültige Daten bleiben unknown/fail closed;
- Account Registry zeigt nur Ablauf relativ zum belegten Geräte-Kalendertag;
- Trip Workspace bewertet jedes Dokument einzeln gegen Reisebeginn/-ende;
- keine Einreise-/Visa-/Transit-/Boarding-Sufficiency-Aussage;
- keine Default-/Primary-/Preferred-/Chosen-Credential-Wahl und kein Ranking;
- kein persistierter Lifecycle-Status;
- keine Migration/RLS/Auth/MFA/AAL/Supabase-Mutation.

Review-Fund:

Agent 19 hatte zunächst `docs/ACTIVE_WORK_STATUS.md` als Feature-Branch-Handoff stark umgeschrieben. Das war ein Governance-/Continuity-Blocker. Der Technical Lead gab CHANGES REQUIRED an denselben Agenten; die globale Datei wurde vollständig aus dem Feature-Diff entfernt und erst danach PASS erteilt.

## 3. AP-UX-NAV1 – abgeschlossen

Issue #228: **CLOSED / completed**.

Agent:

- `Account plattform audit vorbereitung 20` – STOPPED.

Final independently reviewed und integrierter Runtime Head:

- `23e3885f89d0f1f71cd99cf9aef454a78f41ca66`

Gates / Integration:

- Source CI #1308 / Run `33282430023`: SUCCESS;
- Source Vercel Preview: SUCCESS;
- Recovery PR #231 mit identischem reviewed Runtime Head;
- Recovery CI #1310 / Run `33282563776`: SUCCESS;
- Recovery Vercel Preview: READY;
- 0 GitHub Review Threads;
- Merge/Main `ebaead3263c57298f5102df6cffeff49e6bd6ea6`;
- Post-Merge CI #1311 / Run `33282649222`: SUCCESS;
- Vercel Production `6aViQ9poQF2p4WWoxiQ8o3aDWkcz`: SUCCESS / READY.

Geliefert:

- Account Navigation Mobile als eine horizontal scrollbare Tab-Rail statt 2×2-Grid;
- normale Links; kein custom Swipe-to-Navigate;
- Reihenfolge Übersicht → Reisen → Reisende → Einstellungen;
- aktiver Tab wird bei Bedarf nur horizontal sichtbar gemacht;
- `aria-current="page"` bleibt erhalten;
- eingeloggte Nutzer sehen dieselbe Account Navigation auch auf `/reisen`;
- Gäste auf `/reisen` sehen keine Account Navigation;
- bestehende serverseitige `auth.getUser()`-Wahrheit bleibt die Authority;
- Sticky bewusst nicht erzwungen.

Review-Fund:

Die erste Rail-Fassung verwendete `touch-pan-x`. Das kann auf iPhone vertikales Page-Scrolling blockieren, wenn die Geste auf der Rail beginnt. CHANGES REQUIRED ging an denselben Agenten; die restriktive Touch-Action wurde entfernt und der Slice gegen den nach TA-DL1 aktualisierten `main` reconciled und vollständig neu gegatet.

Source PR #229 erhielt nach dem SHA-gelockten Runtime-Merge noch den docs-only Evidence-Commit `08a626c466631cc2e0d1d434d58d28241c625faa`. Keine Runtime wurde verändert. Dieser späte Doku-Stamp wurde bewusst nicht in den bereits gegateten Runtime-Merge gezogen; seine Evidence wird durch diesen TL-Handoff/Checkpoint ersetzt. Source PR #229 ist geschlossen.

## 4. Traveller / Account – kumulative Current Truth

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
- AP-UX-NAV1 skalierbare Mobile Account Navigation.

Kein Default-/Primary-/Preferred-/Chosen-Pass oder Default-Citizenship. Issuer Country bleibt Citizenship-unabhängig. Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

## 5. Country UX – Produkt-Richtung, noch offen

Aus Product-Owner-Feedback gilt als künftige UX-Richtung:

- ISO-2 bleibt intern kanonischer Country Key;
- Nutzer sollen `CH`, `HR` usw. nicht kennen/eintippen müssen;
- User-facing Auswahl soll suchbare lokalisierte Ländernamen, sinnvollerweise mit Flaggen, zeigen;
- intern bleibt ISO-2 gespeichert;
- für Wohnsitz, Staatsbürgerschaft und Dokument-Ausstellungsland wiederverwendbar;
- Issuer ≠ Citizenship bleibt unangetastet;
- keine automatische Ableitung/Vorauswahl/Default-Semantik.

**Noch nicht gebaut. Kein automatisch autorisierter Slice.** Vor Umsetzung müssen vorhandene Country-/i18n-Verträge live geprüft und ein bounded migrationsfreier UX-Slice geschnitten werden.

## 6. Supabase Migration-History Replay – P1 bleibt offen

Production `qscbgcdmivbbnzrcyegn` besitzt für Version `20260829140000_trip_item_commercial_provenance` eine nicht replaybare Prosa-Statement-Body, obwohl der Production S5-B Catalog existiert. Development besitzt weder die Version noch die S5-B Objekte/Rollen.

Keine Reparatur wurde ausgeführt. Vor migrationsnahem Replay/Rebase/Reset bleibt dies **P1 Infrastructure Debt** und ein separater Product-Owner-gated Repair mit Backup/PITR/Before-Image/Replay-Proof.

## 7. Provider – Current Truth

Provider-Arbeit ist nicht abgeschlossen. Echte Provider-Secrets/API-Keys, echte Calls, Production Runtime Principal, realer `live_api`-/`persisted_snapshot`-Pfad und TW-8 bleiben nicht freigegeben/aktiviert. TW-8 bleibt hinter Provider S5 + realer Commercial Provenance.

## 8. Agentenstatus

Gestoppt / abgeschlossen:

- `Account plattform audit vorbereitung 20` – AP-UX-NAV1;
- `Account plattform audit vorbereitung 19` – TA-DL1;
- `Account plattform audit vorbereitung 18` – AP-7-S4;
- `Account plattform audit vorbereitung 17` – AP-7-S3;
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate 0.

Aktiver Cursor-Agent: **keiner durch diesen Handoff autorisiert**.

Neue logische Einheit → frische Agenten-Generation nach Binding Slice Precheck. Review-Fix innerhalb eines laufenden Slices → derselbe gespeicherte Agent/dieselbe Session.

## 9. Risiken und Gates

- P0: keine aus den aktuellen Closures bekannten.
- P1 Infrastructure Debt: malformed Production Migration-History-Body `20260829140000` vor Rebase/Reset/Replay-/migrationsnaher Arbeit.
- P2 Governance: `main protected=false`.

Product-Owner-Entscheidung bleibt erforderlich vor insbesondere Production-Migrationen/destruktiven Datenänderungen, materiellen RLS-/Identity-/Ownership-Änderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Production-Secrets/paid calls/Live-Aktivierung, Öffnung des Commercial Runtime Write-Pfads, Payments/Geldbewegungen, Kosten > USD 100/Monat und fundamentalen Product/Business/Build-Order/Launch-Entscheidungen.

Normale scope-treue Technik/Reviews/Merges bleiben TL-autonom nach unabhängiger Exact-Head-Prüfung.

## 10. Exakter nächster Schritt

**Kein automatischer Folgeslice.**

Neuer Chat/Technical Lead muss zuerst:

1. `main`, offene PRs/Issues/Branches, CI/Vercel/Supabase live rekonstruieren;
2. Binding Build Order und `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` gegen AP-7-S1–S4 + TA-DL1 + AP-UX-NAV1 reconciliieren;
3. verbleibende Traveller-/Multi-Citizenship-/Country-UX-Lücken bestimmen;
4. Country-Picker als möglichen migrationsfreien UX-Kandidaten bewerten, ohne ihn automatisch zu starten;
5. bei migrationsnahen Kandidaten den Replay-Defekt als P1-Abhängigkeit behandeln;
6. P0/P1/P2/P3 und PO-Gates neu bewerten;
7. erst danach bounded Slice(s), Kollisionsmatrix und neue Cursor-Agent-Generation(en) festlegen.

## 11. Pflicht für Übernahme

Neuer Chat liest zuerst:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
6. `docs/ACTIVE_WORK_STATUS.md`
7. diesen Handoff
8. `docs/CHATGPT_TL_TA_DL1_AND_AP_UX_NAV1_POST_MERGE_CHECKPOINT_2026-08-30.md`
9. relevante Task/Status/Handoff/ADR-Dateien
10. danach Live-GitHub/CI/Vercel/Supabase.
