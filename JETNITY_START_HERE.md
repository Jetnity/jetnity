# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 30. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice – auch im selben Chat – muss zuerst der relevante Live-Stand rekonstruiert werden. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

Verbindliches Start-/Continuity-Gate:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

Aktuellster Technical-Lead Checkpoint:

`docs/CHATGPT_TL_TA_DL1_AND_AP_UX_NAV1_POST_MERGE_CHECKPOINT_2026-08-30.md`

Dieser Einstieg ersetzt keine Live-Prüfung. Vor Änderung, Review, Ready oder Merge immer `main`, relevante PRs/Heads, CI, Vercel, Supabase/Production-Evidence und parallele Workstreams live verifizieren.

---

## 1. Aktuellster vollständig verifizierter Runtime-Stand

- `main @ ebaead3263c57298f5102df6cffeff49e6bd6ea6`
- TA-DL1 Document Lifecycle / Trip-Date Awareness ist integriert.
- AP-UX-NAV1 Mobile Account Navigation Rail + `/reisen` consistency ist integriert.
- Post-Merge CI #1311 / Run `33282649222`: **SUCCESS** auf exact `main`.
- Vercel Production auf exact `main`: **SUCCESS / READY**, Deployment `6aViQ9poQF2p4WWoxiQ8o3aDWkcz`.
- `main protected=false` bleibt Governance-Risiko.

Es gibt **keinen automatisch gestarteten Folgeslice** und aktuell keinen durch diese Continuity autorisierten Cursor-Agenten.

---

## 2. Traveller / Account – Current Truth

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
- **TA-DL1 kalenderdatums-/timezone-sichere Document-Lifecycle-Auswertung**.

### TA-DL1 – integriert

Issue #226 ist **CLOSED / completed**.

Agent: `Account plattform audit vorbereitung 19` – **STOPPED / completed**.

Final independently reviewed Source Head:

`d9c16415b56a624812aa57b2d6110346f24ca633`

Integration:

- Source CI #1302 / Run `33281760672`: SUCCESS;
- Recovery PR #230 wegen bekanntem Draft→Ready-Connectorfehler;
- Recovery CI #1305 / Run `33282195722`: SUCCESS;
- Merge/Main danach `20c203f5bee950b43db611f220c7cc5b88699dcb`;
- Post-Merge CI #1306: SUCCESS;
- später durch AP-UX-NAV1 in aktuellen `main` fortgeschrieben.

TA-DL1 wertet jedes Dokument unabhängig aus:

- fehlendes/ungültiges Ablaufdatum → unknown/fail closed;
- Account Registry: nur Ablauf relativ zum belegten Geräte-Kalendertag;
- Trip Workspace: Ablauf vor Reisebeginn, während der Reise oder nicht vor Reiseende;
- keine Behauptung, dass ein Dokument für Einreise, Visum, Transit oder Boarding genügt;
- keine automatische Dokument-/Passwahl und kein Ranking;
- kein persistierter Lifecycle-Status.

Review-Hinweis: Agent 19 hatte zunächst `docs/ACTIVE_WORK_STATUS.md` unzulässig als Feature-Handoff umgeschrieben. Der Technical Lead stoppte den PASS; derselbe Agent stellte die globale Continuity vollständig auf Baseline zurück. Erst danach erfolgte PASS und Merge. **Global Continuity bleibt TL-owned.**

---

## 3. Account Navigation – Current Truth

### AP-UX-NAV1 – integriert

Issue #228 ist **CLOSED / completed**.

Agent: `Account plattform audit vorbereitung 20` – **STOPPED / completed**.

Final independently reviewed und integrierter Runtime Head:

`23e3885f89d0f1f71cd99cf9aef454a78f41ca66`

Integration:

- Source CI #1308 / Run `33282430023`: SUCCESS;
- Source Vercel Preview: SUCCESS;
- Recovery PR #231 wegen bekanntem Draft→Ready-Connectorfehler;
- Recovery CI #1310 / Run `33282563776`: SUCCESS;
- Merge/Main `ebaead3263c57298f5102df6cffeff49e6bd6ea6`;
- Post-Merge CI #1311 / Run `33282649222`: SUCCESS;
- Vercel Production Deployment `6aViQ9poQF2p4WWoxiQ8o3aDWkcz`: SUCCESS.

Produktverhalten:

- Mobile Account Navigation ist eine **einzeilige native horizontal scrollbare Tab-Leiste**, kein 2×2-Grid;
- normales Wischen scrollt die Leiste, **kein custom Swipe-to-Navigate**;
- Reihenfolge: Übersicht → Reisen → Reisende → Einstellungen;
- aktiver Tab bleibt semantisch mit `aria-current="page"` und wird bei Bedarf nur horizontal ins Sichtfeld gebracht;
- eingeloggte Nutzer sehen dieselbe Account Navigation auch auf `/reisen`;
- Gäste auf `/reisen` sehen keine Account Navigation;
- die bestehende serverseitige `auth.getUser()`-Wahrheit wird wiederverwendet;
- Sticky wurde bewusst **nicht** erzwungen.

Review-Hinweis: Eine erste Fassung verwendete `touch-pan-x`. Der Technical Lead verlangte Korrektur, weil dies auf iPhone vertikales Page-Scrolling für Gesten blockieren kann, die auf der Rail beginnen. Derselbe Agent entfernte die Restriktion und re-gatete gegen den nach TA-DL1 aktualisierten `main`.

Source PR #229 bekam nach dem bereits SHA-gelockten Runtime-Merge noch den **docs-only** Evidence-Commit `08a626c466631cc2e0d1d434d58d28241c625faa`. Dieser enthält keine Runtime und wurde bewusst nicht nachträglich integriert; seine CI/Vercel-Evidence ist in der TL-Continuity festgehalten. Source PR #229 ist geschlossen; Runtime kam über Recovery PR #231.

---

## 4. Country UX – verbindliche Produkt-Richtung, noch nicht gebaut

Aus aktuellem Product-Owner-Feedback gilt für einen künftigen, separat zu schneidenden UX-Slice:

- ISO-2 (`CH`, `HR`, `DE` usw.) bleibt intern der kanonische, sprachunabhängige Country Key;
- normale Nutzer sollen ISO-2 **nicht kennen oder eintippen müssen**;
- User-facing Country-Auswahl soll suchbare, lokalisierte vollständige Ländernamen zeigen, sinnvollerweise mit Flagge, z. B. `🇨🇭 Schweiz`, `🇭🇷 Kroatien`;
- intern wird weiterhin `CH`, `HR` usw. gespeichert;
- gleiche Grundlösung für Wohnsitzland, Staatsbürgerschaft und Ausstellungsland eines Dokuments;
- Issuing Country bleibt fachlich getrennt von Citizenship;
- keine automatische Ableitung, Vorauswahl, Primary-/Default-Semantik;
- Mehrsprachigkeit muss erhalten bleiben.

**Noch nicht implementiert. Nicht automatisch starten.** Vor Umsetzung ist ein frischer Slice-Precheck erforderlich, inklusive Prüfung vorhandener Country-/i18n-Contracts und Wiederverwendbarkeit statt paralleler Country-Wahrheit.

---

## 5. Supabase Migration-History Replay – Current Truth

Gate-0 Audit ist abgeschlossen; **keine Reparatur wurde ausgeführt**.

Production `qscbgcdmivbbnzrcyegn` besitzt Version `20260829140000_trip_item_commercial_provenance`, deren gespeicherte einzige Statement-Body ein **nicht replaybarer Prosa-Marker** ist. Der Production S5-B Catalog existiert trotzdem und der Production Write Path bleibt geschlossen.

Current Development `yfvbxvijcorffwxbxahl` besitzt weder diese Migration-Version noch die S5-B Provenance-/Runtime-Gate-Objekte/Rollen.

Vor einem künftigen Rebase/Reset/Replay-/migrationsnahen Slice ist dies **P1 Infrastructure Debt**. Eine History-Reparatur bleibt ein separater Product-Owner-Gate mit Backup/PITR-/Before-Image- und Replay-Nachweis.

---

## 6. Provider / große Build-Reihenfolge

Provider-Arbeit ist weiterhin nicht abgeschlossen. Echte Provideraktivierung, Secrets/paid calls, Production Runtime Principal und weitere Live-Runtime-Slices bleiben hinter Binding Build Order und besonderen Gates. TW-8 bleibt geschlossen hinter Provider S5 + realer Commercial Provenance.

`docs/JETNITY_BINDING_BUILD_ORDER.md` bleibt Product-Owner-binding; kein Chat/Agent darf die große Reihenfolge still verändern.

---

## 7. Agentenstatus

Gestoppt / abgeschlossen:

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
5. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
6. `JETNITY_HANDOFF.md`
7. `docs/ACTIVE_WORK_STATUS.md`
8. `docs/CHATGPT_TL_TA_DL1_AND_AP_UX_NAV1_POST_MERGE_CHECKPOINT_2026-08-30.md`
9. konkret relevante Task-/Status-/Handoff-/ADR-Dateien;
10. danach Live-GitHub/CI/Vercel/Supabase-Evidence.

Bei Chatwechsel zusätzlich `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`.

---

## 10. Exakter nächster Schritt

1. Frischen Binding Slice Precheck ausführen.
2. Aktuellen `main`, offene PRs/Issues/Branches und CI/Vercel/Supabase live prüfen.
3. Binding Build Order + Account Platform Plan gegen AP-7-S1–S4 + TA-DL1 + AP-UX-NAV1 reconciliieren.
4. Verbleibende Traveller-/Multi-Citizenship-/Country-UX-Lücken priorisieren.
5. Den Country-Picker als möglichen migrationsfreien UX-Kandidaten prüfen, aber **nicht automatisch autorisieren**.
6. Bei migrationsnahen Kandidaten zuerst die Replay-P1-Abhängigkeit behandeln.
7. Erst danach bounded Slice(s), Kollisionsmatrix und neue Cursor-Agent-Generation(en) bestimmen.

**Kein Folgeslice ist automatisch freigegeben.**
