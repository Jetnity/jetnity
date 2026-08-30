# Jetnity – Handoff und nächste Schritte

Stand: 30. August 2026  
Status: **CURRENT HANDOFF / AP-10-S1 POST-MERGE VERIFIED / NO ACTIVE RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

Dieser Handoff ist Current-State-Evidence, kein Ersatz für Live-Rekonstruktion. Vor jedem neuen Slice gilt verbindlich `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

Aktuellster vollständiger Checkpoint:

`docs/CHATGPT_TL_AP10_S1_POST_MERGE_CHECKPOINT_2026-08-30.md`

Voriger Chat-Transition-Checkpoint:

`docs/CHATGPT_TL_CHAT_TRANSITION_CHECKPOINT_2026-08-30.md`

## 1. Verifizierter Übergabestand

Letzte vollständig verifizierte **Runtime-Baseline**:

- `main/runtime @ a4d9384e2583ae52733c87006cd578f7489cb656`
- AP-10-S1 Confirmed Booking Folder integriert
- Source Draft PR #246: transport-only CLOSED / unmerged
- Recovery PR #247: MERGED
- Issue #245: CLOSED / completed
- final TL-PASS Head `9cf7de12e58f4296c6a802dff6d3f65a01413e59`
- Recovery CI #1347 / Run `33310082106`: SUCCESS
- Post-Merge CI #1348 / Run `33310203614`: SUCCESS
- Vercel Production `dpl_9h1r9iuJe4xrYpXLSFGE6gimGJjn`: READY auf exact `a4d9384e...`
- Branch Protection: `protected=false`

Nach `a4d9384e...` kann nur der docs-only Continuity-Stand integriert werden. Ein neuer Chat kann deshalb einen neueren `main` vorfinden, ohne dass danach Runtime geändert wurde. Den aktuellen `main` immer live verifizieren und die letzte Runtime-Baseline separat bestimmen.

**Kein automatischer Produkt-/Runtime-Folgeslice. Kein aktiver Cursor-Agent.**

## 2. AP-10-S1 – abgeschlossen

Slice: **Confirmed Booking Folder**.

Agent:

- `Account plattform audit vorbereitung 23`
- Session `bc-ec79a6cd-8076-4ec4-a130-249f9f650420`
- Status: **STOPPED / completed**

Task:

`docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_TASK_2026-08-30.md`

Source Draft PR #246:

- erster Runtime-Head `aac0dae0644028bd9fe9083c59d7ea9c6c2dc0cd` hatte CI/Vercel-Zwischenfehler;
- reviewed Head `848292182bf9d8a89a19db651b35222323144a19` → **CHANGES REQUIRED**;
- Finding 1: unbekannter Trip-Status wurde fälschlich auf `draft` zurückgestuft und damit Domain Truth erfunden;
- Finding 2: `.limit(200)` wurde ohne deterministische DB-Sortierung davor angewandt;
- derselbe Agent/dieselbe Session lieferte den Review-Fix;
- Runtime-Fix-Commit `87f6f3cf8dde5f1424f6c65fadd4e97eb95b4362`;
- finaler independently reviewed Head `9cf7de12e58f4296c6a802dff6d3f65a01413e59`.

Finale Gates:

- vollständiger TL-Diff-/Truth-/Security-/RLS-/Scope-Review = PASS;
- Agent-Self-Review wurde nicht als TL-PASS verwendet;
- merge-base exact `main @ 30c0493c38cd4bf3ceb904ef443126808c79add6`;
- Branch vor Merge 8 ahead / 0 behind;
- CI #1346 auf finalem Source-Head = SUCCESS;
- Vercel Preview exact final Head = READY;
- 0 offene Review Threads.

Beim Draft→Ready-Schritt trat der bekannte Connectorfehler `Repository.fullDatabaseId` auf. Entsprechend dem bewährten AP-5-R1-Recovery-Verfahren wurde Source PR #246 transport-only geschlossen und Recovery PR #247 auf **demselben unveränderten PASS-Head** erstellt. Fresh Recovery CI #1347 wurde SUCCESS, danach Expected-Head-Lock-Merge auf `9cf7de12...` → `main a4d9384e...` → Post-Merge CI #1348 SUCCESS → Production READY.

Geliefert:

- neue read-only `/account/bookings`-Ansicht;
- ausschließlich bestehende Nutzer-Booking-Truth `booking_status='booked'`;
- nur `flight`, `stay`, `transfer`, `rental_car`;
- kein zweites Booking-Modell;
- unbekannte/inkonsistente Trip-Statuswerte fail-closed;
- deterministische Sortierung `booking_confirmed_at DESC`, danach `id ASC`, vor 200er-Limit;
- Empty ≠ Error;
- archivierte Trips discoverable und sichtbar markiert;
- interne Trip-Links, keine externen Provider-/Affiliate-Deeplinks;
- keine Preise, Provider-Bestätigung, Availability-, Conversion- oder Commercial-Claims;
- bestehender owner-scoped `authenticated` RLS-Pfad, kein Service Role;
- keine DB/Migration/RLS/Identity/Auth/Traveller-PII/Payment-Änderung;
- AP-UX-NAV1 bleibt vier Haupttabs: Übersicht → Reisen → Reisende → Einstellungen.

## 3. Traveller / Account – kumulative Current Truth

Verbindliches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Dual-Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth einer konkreten Reise.**

Integriert und nicht erneut als Zukunft planen:

- trip-scoped Foundation E;
- Multi-Citizenship/Multi-Document und Document↔Citizenship;
- Issuer Country ≠ Citizenship;
- kein Default-/Primary-/Preferred-/Chosen-Pass;
- Guest→Account Trip-Copy;
- AP-7 Gate 0 + S1–S4;
- AP-5 Gate 0 + S1–S5 + AP-5-R1;
- TA-DL1 Document Lifecycle;
- AP-UX-NAV1 Account Navigation Rail;
- TA-CUX1 Shared localized Country UX;
- **AP-10-S1 Confirmed Booking Folder**.

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

`docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` bleibt der kanonische AP-5–AP-12-Plan. Für AP-10-S1 supersediert `docs/CHATGPT_TL_AP10_S1_POST_MERGE_CHECKPOINT_2026-08-30.md` ältere zeitgebundene `not started`-Statusaussagen. Dies ist keine automatische Freigabe weiterer AP-10-Slices.

## 4. PrivacyBee – Product-Owner-binding, Jetnity-Activation geparkt

Binding:

- **PrivacyBee AG / `privacybee.io` (Schweiz)** ist der vorgesehene Provider für Jetnitys website-visible Privacy Layer.
- `docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md`
- `docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md`

Aktuelle reale Evidence bleibt:

- bestehendes PrivacyBee-Konto mit alter Website `pazzar.ch`;
- `jetnity.com` ist noch nicht als echte erreichbare Jetnity-Production verfügbar.

Daher:

- **keinen Jetnity-Trial/Lizenz-/Activation-Start jetzt**;
- kein Vercel-Preview/Ersatzdomain als Legal-Production-Domain;
- kein Cookie-Banner ohne reale nicht-essenzielle Tracker;
- keine Passwörter/API-Keys/Session-Secrets in Repo/Agenten;
- `/terms` bleibt separater Legal-Input und wird nicht erfunden;
- PrivacyBee ersetzt nicht AP-6b Consent/Export/Delete oder Account/Auth/Traveller/RLS/Commercial Truth.

AP-6a PrivacyBee-Runtime ist bewusst **geparkt**.

## 5. Product Differentiation – verbindlich

`docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

Feature-Frage:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

`docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md` ist ein Kandidatenpool, **keine automatische Roadmap**. Issue #236 bleibt do-not-auto-start.

## 6. Supabase Replay – P1 unverändert

Production-History-Version `20260829140000_trip_item_commercial_provenance` speichert einen nicht replaybaren Prosa-Statement-Body, obwohl die Production-S5-B-Objekte existieren. Development besitzt die Version und S5-B Runtime-Gate-/Provenance-Objekte nicht. Production Commercial Write Gate bleibt geschlossen (`production_write_path_allocated=false`).

Keine Reparatur wurde durchgeführt. Vor migrationsnahem Rebase/Reset/Replay ist dies **P1 Infrastructure Debt** und ein separater Product-Owner-gated Repair mit Backup/PITR/Before-Image/Fingerprints/Replay-Proof.

AP-6b ist migrations-/RLS-/Delete-nah und daher zusätzlich von diesem P1 und besonderen PO-Gates betroffen.

## 7. Provider / Trip Workspace

Provider-Arbeit ist nicht abgeschlossen. Keine echten Provider-Secrets/API-Keys/paid calls/Production Runtime Principal aus diesem Handoff heraus aktivieren. TW-8 bleibt hinter Provider S5 + realer Commercial Provenance geschlossen.

Binding Build Order: `docs/JETNITY_BINDING_BUILD_ORDER.md`.

## 8. Offene PRs – historische Klassifikation

Beim letzten Live-Check weiterhin offen:

- #52 – alter ChatGPT-Handoff-Draft, historisch/veraltet;
- #50 – alter Provider-Ops-Dokumentations-Draft, historisch/veraltet;
- #40 – Admin Audit/Preparation, historisch, kein aktiver Runtime-Slice;
- #39 – Account Audit/Preparation, historisch und durch spätere Integration überholt;
- #28 – Collaboration Foundation, future/historical Draft, nicht automatisch starten.

AP-10-S1:

- #246 – CLOSED transport-only / unmerged;
- #247 – MERGED.

**Kein aktueller Runtime-PR ist aktiv.** Die Liste live neu prüfen.

## 9. Agentenstatus

Zuletzt abgeschlossen:

- `Account plattform audit vorbereitung 23` – AP-10-S1 – STOPPED / completed – Session `bc-ec79a6cd-8076-4ec4-a130-249f9f650420`.

Davor abgeschlossen:

- Agent 22 – AP-5-R1;
- Agent 21 – TA-CUX1;
- Agent 20 – AP-UX-NAV1;
- Agent 19 – TA-DL1;
- Agent 18 – AP-7-S4;
- Agent 17 – AP-7-S3;
- `Jetnity infrastructure migration audit 1` – Replay Gate 0.

Aktiver Cursor-Agent: **keiner**.

**Agent 24 ist nicht gestartet.** Erst ein frischer Binding Slice Precheck bestimmt Workstream und nächste Generation.

## 10. Risiken / Gates

- P0: keine aus dem aktuellen Übergabestand bekannten.
- P1: malformed Production Migration-History-Body `20260829140000` vor migrationsnaher Arbeit.
- P2: `main protected=false` / Enforcement off.
- P3: keine neue AP-10-S1-spezifische Runtime-Störung.

Alle besonderen Product-Owner-Gates aus dem Operating Standard bleiben bestehen: Production-Migration/RLS/Identity, fundamentale Auth/MFA/AAL-Änderung, sensitive Dokumentdaten/externe Weitergabe, Provider-Verträge/Secrets/paid calls/Live-Aktivierung, Commercial Write-Öffnung, Payments, > USD 100/Monat, fundamentale Product-/Build-Order-Änderung, Public Launch/Domain Cutover und Branch Protection.

## 11. Exakter erster Schritt im nächsten Chat

**Kein automatischer Folgeslice. Kein Agent 24 automatisch.**

Der neue Technical Lead muss zuerst:

1. `main`, letzte Merges und eventuelle docs-only Drift live rekonstruieren;
2. offene PRs/Issues/Branches und Agentenstatus live prüfen;
3. Current CI/Vercel verifizieren;
4. bei DB-/Security-Bezug Supabase Production/Development/Migration-History/RLS live prüfen;
5. Binding Build Order + Account Plan gegen Runtime-Baseline `a4d9384e...` und den aktuellen Checkpoint reconciliieren;
6. PrivacyBee/AP-6a bis erreichbarer `jetnity.com` Production als geparkt behandeln;
7. migrationsnahe/AP-6b-Arbeit hinter P1 + PO-Gates behandeln;
8. die besten nicht blockierten Kandidaten auf **Differentiation Impact** oder **Enabler Justification** prüfen;
9. erst danach bounded Slice, Kollisionsmatrix und frische Agenten-Generation festlegen.

Wenn dabei eine echte Product-Owner-Entscheidung nötig ist, vor dem betreffenden Slice fragen; nicht improvisieren.

## 12. Pflicht für Übernahme

Neuer Chat liest zuerst:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. diesen Handoff
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/CHATGPT_TL_AP10_S1_POST_MERGE_CHECKPOINT_2026-08-30.md`
7. `docs/JETNITY_BINDING_BUILD_ORDER.md`
8. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
9. Product Differentiation Doctrine + Opportunity Register
10. AP-10-S1 / AP-5-R1 / PrivacyBee / Supabase Replay Evidence
11. danach Live-GitHub/CI/Vercel/Supabase.

**Live-Evidence gewinnt immer.**