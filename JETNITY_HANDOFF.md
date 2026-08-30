# Jetnity – Handoff und nächste Schritte

Stand: 30. August 2026  
Status: **CURRENT HANDOFF / CHAT TRANSITION / AP-5-R1 POST-MERGE VERIFIED / NO ACTIVE RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

Dieser Handoff ist Current-State-Evidence, kein Ersatz für Live-Rekonstruktion. Vor jedem neuen Slice gilt verbindlich `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

Aktuellster vollständiger Transition-Checkpoint:

`docs/CHATGPT_TL_CHAT_TRANSITION_CHECKPOINT_2026-08-30.md`

## 1. Verifizierter Übergabestand

Letzte vollständig verifizierte **Runtime-Baseline**:

- `main/runtime @ 4549b0264b57052d1ab6737add9bbe7fd8801c3b`
- Post-Merge CI #1338 / Run `33306700851`: **SUCCESS**
- Vercel Production auf exact `4549b026...`: **SUCCESS**
- Branch Protection: `protected=false`

Nach `4549b026...` wird nur der docs-only Transition-/Continuity-Stand integriert. Ein neuer Chat kann deshalb einen neueren `main` vorfinden, ohne dass danach Runtime geändert wurde. Den aktuellen `main` immer live verifizieren.

**Kein automatischer Produkt-/Runtime-Folgeslice. Kein aktiver Cursor-Agent.**

## 2. AP-5-R1 – abgeschlossen

Issue #241: **CLOSED / completed**.

Agent:

- `Account plattform audit vorbereitung 22`
- Session `bc-f631838b-21f3-4290-aa1f-db450a037ac3`
- Status: **STOPPED / completed**

Source Draft PR #242:

- erster reviewed Head `c0abee5091511d241c2c1f55c04baa4e5baee10c` → **CHANGES REQUIRED**;
- Findings: zentrale ADR/Architecture-Kollision, falsches Admin-Success-Ziel, persistenter Admin-Menü-Reopen-Callback;
- gleicher Agent/dieselbe Session lieferte Review-Fix.

Final independently reviewed Head:

`ccc50345b0f55e0a387c9f16f5fb3f8fac2e8d2a`

Gates:

- TL PASS auf exact Head;
- 7 ahead / 0 behind;
- CI #1336 / `33306211723`: SUCCESS;
- Vercel exact Head: SUCCESS;
- 0 Review Threads.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId` → Source PR #242 transport-only geschlossen → Recovery PR #243 auf **identischem PASS-Head** → Recovery CI #1337 SUCCESS → Expected-Head-Lock Merge → `main 4549b026...` → Post-Merge CI #1338 SUCCESS → Vercel Production SUCCESS.

Geliefert:

- allgemeines/public Logout bleibt unscoped/global;
- Success-Redirect nur nach bestätigtem Auth-Erfolg;
- `{ error }`/Wurf bleibt fail-closed und retrybar;
- sanitized Error Copy, keine Tokens/Session-IDs/Secrets;
- Public Success `/`;
- Admin Success `/admin/login`;
- kein Open Redirect;
- AP-5-S3 scoped `local` / `others` / `global` unverändert;
- keine DB/Migration/RLS/Identity/Auth-Config/PrivacyBee/Provider-Änderung.

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
- TA-CUX1 Shared localized Country UX.

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

## 4. PrivacyBee – Product-Owner-binding, Jetnity-Activation geparkt

Binding:

- **PrivacyBee AG / `privacybee.io` (Schweiz)** ist der vorgesehene Provider für Jetnitys website-visible Privacy Layer.
- `docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md`
- `docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md`

Neue reale Evidence:

- bestehendes PrivacyBee-Konto mit alter Website `pazzar.ch`;
- `jetnity.com` wird aktuell von PrivacyBee nicht als neue Website akzeptiert, weil dort noch keine erreichbare Jetnity-Website läuft.

Daher:

- **keinen Jetnity-Trial/Lizenz-/Activation-Start jetzt**;
- warten, bis echte `jetnity.com` Production erreichbar ist;
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

`docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md` bewahrt sieben strategische Kandidaten. Sie sind **keine automatische Roadmap**. Issue #236 bleibt do-not-auto-start.

## 6. Supabase Replay – P1 unverändert

Production-History-Version `20260829140000_trip_item_commercial_provenance` speichert einen nicht replaybaren Prosa-Statement-Body, obwohl die Production S5-B Objekte existieren. Development besitzt die Version und S5-B Runtime-Gate-/Provenance-Objekte nicht.

Keine Reparatur wurde durchgeführt. Vor migrationsnahem Rebase/Reset/Replay ist dies **P1 Infrastructure Debt** und ein separater Product-Owner-gated Repair mit Backup/PITR/Before-Image/Fingerprints/Replay-Proof.

AP-6b ist migrations-/RLS-/Delete-nah und daher zusätzlich von diesem P1 und besonderen PO-Gates betroffen.

## 7. Provider / Trip Workspace

Provider-Arbeit ist nicht abgeschlossen. Keine echten Provider-Secrets/API-Keys/paid calls/Production Runtime Principal aus diesem Handoff heraus aktivieren. TW-8 bleibt hinter Provider S5 + realer Commercial Provenance geschlossen.

Binding Build Order: `docs/JETNITY_BINDING_BUILD_ORDER.md`.

## 8. Offene PRs – historische Klassifikation

Beim Übergang waren exakt fünf alte PRs offen:

- #52 – alter ChatGPT-Handoff-Draft, historisch/veraltet;
- #50 – alter Provider-Ops-Dokumentations-Draft, historisch/veraltet;
- #40 – Admin Audit/Preparation, historisch, kein aktiver Runtime-Slice;
- #39 – Account Audit/Preparation, historisch und durch spätere Integration überholt;
- #28 – Collaboration Foundation, future/historical Draft, nicht automatisch starten.

**Kein aktueller Runtime-PR ist aktiv.** Der neue Chat muss die Liste live neu prüfen.

## 9. Agentenstatus

Zuletzt abgeschlossen:

- `Account plattform audit vorbereitung 22` – AP-5-R1 – STOPPED / completed – Session `bc-f631838b-21f3-4290-aa1f-db450a037ac3`.

Davor abgeschlossen:

- Agent 21 – TA-CUX1;
- Agent 20 – AP-UX-NAV1;
- Agent 19 – TA-DL1;
- Agent 18 – AP-7-S4;
- Agent 17 – AP-7-S3;
- `Jetnity infrastructure migration audit 1` – Replay Gate 0.

Aktiver Cursor-Agent: **keiner**.

**Agent 23 ist nicht gestartet.** Erst ein frischer Binding Slice Precheck bestimmt Workstream und nächste Generation.

## 10. Risiken / Gates

- P0: keine aus dem Übergabestand bekannten.
- P1: malformed Production Migration-History-Body `20260829140000` vor migrationsnaher Arbeit.
- P2: `main protected=false` / Enforcement off.
- P3: keine neue transitionsrelevante Runtime-Störung.

Alle besonderen Product-Owner-Gates aus dem Operating Standard bleiben bestehen: Production-Migration/RLS/Identity, fundamentale Auth/MFA/AAL-Änderung, sensitive Dokumentdaten/externe Weitergabe, Provider-Verträge/Secrets/paid calls/Live-Aktivierung, Commercial Write-Öffnung, Payments, > USD 100/Monat, fundamentale Product-/Build-Order-Änderung, Public Launch/Domain Cutover und Branch Protection.

## 11. Exakter erster Schritt im neuen Chat

**Kein automatischer Folgeslice. Kein Agent 23 sofort.**

Der neue Technical Lead muss zuerst:

1. `main`, letzte Merges und den docs-only Transition-Merge live rekonstruieren;
2. offene PRs/Issues/Branches und Agentenstatus live prüfen;
3. Current CI/Vercel verifizieren;
4. bei DB-/Security-Bezug Supabase Production/Development/Migration-History/RLS live prüfen;
5. Binding Build Order + Account Plan gegen den tatsächlich integrierten Stand reconciliieren;
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
6. `docs/CHATGPT_TL_CHAT_TRANSITION_CHECKPOINT_2026-08-30.md`
7. `docs/JETNITY_BINDING_BUILD_ORDER.md`
8. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
9. Product Differentiation Doctrine + Opportunity Register
10. AP-5-R1 / PrivacyBee / Supabase Replay Evidence
11. danach Live-GitHub/CI/Vercel/Supabase.

**Live-Evidence gewinnt immer.**