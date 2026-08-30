# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 30. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / AP-10-S1 POST-MERGE / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice – auch im selben Chat – muss zuerst der relevante Live-Stand rekonstruiert werden. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

Verbindliches Start-/Continuity-Gate:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

Aktuellster vollständiger Technical-Lead-Checkpoint:

`docs/CHATGPT_TL_AP10_S1_POST_MERGE_CHECKPOINT_2026-08-30.md`

Voriger Chat-Transition-Checkpoint:

`docs/CHATGPT_TL_CHAT_TRANSITION_CHECKPOINT_2026-08-30.md`

Dieser Einstieg ersetzt niemals Live-Prüfung. Vor Änderung, Review, Ready, Merge oder neuem Agenten `main`, PRs/Issues/Branches, Exact Heads, CI, Vercel, relevante Supabase-/Production-Wahrheit, offene Threads, Risiken und Product-Owner-Gates selbst verifizieren.

---

## 1. Aktueller Übergabestand

Letzte vollständig integrierte und post-merge verifizierte **Runtime-Baseline**:

- `main/runtime @ a4d9384e2583ae52733c87006cd578f7489cb656`
- AP-10-S1 Confirmed Booking Folder ist integriert.
- Recovery PR #247: **MERGED**.
- Source Draft PR #246: **CLOSED transport-only / unmerged** wegen bekanntem Draft→Ready-Connectorfehler.
- Parent Issue #245: **CLOSED / completed**.
- final unabhängig geprüfter PASS-Head: `9cf7de12e58f4296c6a802dff6d3f65a01413e59`.
- Recovery CI #1347 / Run `33310082106`: **SUCCESS**.
- Post-Merge CI #1348 / Run `33310203614`: **SUCCESS** auf exact `a4d9384e...`.
- Vercel Production `dpl_9h1r9iuJe4xrYpXLSFGE6gimGJjn`: **READY** auf exact `a4d9384e...`.
- `main protected=false` bleibt P2-Governance-Risiko.

Nach dieser Runtime-Baseline kann ein docs-only Continuity-Merge den live aktuellen `main` weiterbewegen. Deshalb immer den aktuellen `main` **und** die letzte Runtime-Baseline live bestimmen.

**Kein Produkt-/Runtime-Folgeslice ist automatisch aktiv. Kein Cursor-Agent ist aktiv. Agent 24 wurde nicht gestartet.**

---

## 2. Zuletzt abgeschlossen – AP-10-S1

Cursor-Agent:

`Account plattform audit vorbereitung 23`

Session:

`bc-ec79a6cd-8076-4ec4-a130-249f9f650420`

Agentstatus: **STOPPED / completed**.

Task:

`docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_TASK_2026-08-30.md`

Final independently reviewed Head:

`9cf7de12e58f4296c6a802dff6d3f65a01413e59`

Der erste relevante Review-Head erhielt **CHANGES REQUIRED** wegen zwei Findings: unbekannter Trip-Status wurde als `draft` erfunden und der 200er-Cutoff war vor dem Limit nicht deterministisch geordnet. Derselbe Agent/dieselbe Session korrigierte beide. Der neue Exact Head wurde vollständig neu gegatet und erhielt unabhängigen TL-PASS.

Current Behavior:

- `/account/bookings` = read-only Confirmed Booking Folder;
- ausschließlich bestehendes `booking_status='booked'`;
- nur bestehende buchbare Arten `flight`, `stay`, `transfer`, `rental_car`;
- kein zweites Booking-Modell und keine neue Commercial Truth;
- unknown/inconsistent Trip Status fail-closed;
- deterministische Sortierung vor `limit(200)`;
- Empty ≠ Error;
- archivierte Reisen bleiben sichtbar gekennzeichnet;
- keine Preise/Provider-Bestätigung/Affiliate-/Conversion-/Deeplink-Claims;
- keine DB-/Migration-/RLS-/Auth-/PII-Änderung und kein Service Role;
- AP-UX-NAV1 bleibt vier Haupttabs: Übersicht → Reisen → Reisende → Einstellungen.

Wegen des bekannten Draft→Ready-Connectorfehlers `Repository.fullDatabaseId` wurde Source PR #246 transport-only geschlossen und Recovery PR #247 mit **demselben unveränderten PASS-Head** nach frischer CI über Expected-Head-Lock gemergt.

---

## 3. Verbindlicher Produkt-Nordstern

Kanonische Doctrine:

`docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`

Arbeitsbegriff:

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler:

1. **Planen**
2. **Entscheiden**
3. **Reisebereit sein**

Leitfrage:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Strategisches Opportunity Register:

`docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`

Die dortigen Kandidaten sind **Strategieoptionen, keine automatische Runtime-Roadmap**. Issue #236 bleibt do-not-auto-start.

---

## 4. Traveller / Account – Current Truth

Verbindliches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Dual-Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth einer konkreten Reise.**

Integriert und nicht neu zu bauen:

- trip-scoped Foundation E;
- Multi-Citizenship / Multi-Document;
- Issuer Country ≠ Citizenship;
- Document↔Citizenship-Relation;
- kein Default-/Primary-/Preferred-/Chosen-Pass und keine Default-Citizenship;
- Guest→Account Trip-Copy;
- AP-7 Gate 0 + S1–S4;
- AP-5 Gate 0 + S1–S5 + AP-5-R1;
- TA-DL1 Document Lifecycle;
- AP-UX-NAV1 Account Navigation Rail;
- TA-CUX1 Shared localized Country UX;
- **AP-10-S1 Confirmed Booking Folder**.

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

`docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` bleibt der kanonische AP-5–AP-12-Plan. Für AP-10-S1 supersediert der aktuelle Post-Merge-Checkpoint ältere zeitgebundene `not started`-Aussagen. Kein AP-10-Folgeslice ist automatisch freigegeben.

---

## 5. PrivacyBee – ausgewählt, aber Jetnity-Runtime geparkt

Product-Owner-binding:

- **PrivacyBee AG / `privacybee.io` (Switzerland)** ist der beabsichtigte Provider für Jetnitys website-visible Privacy Layer.
- `docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md`
- `docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md`

Aktuelle reale Evidence bleibt:

- bestehendes PrivacyBee-Konto mit alter Website `pazzar.ch`;
- `jetnity.com` kann erst sinnvoll als PrivacyBee-Website verwendet werden, wenn dort eine echte erreichbare Jetnity-Production läuft.

Daher verbindlich:

- PrivacyBee Jetnity-Activation/Trial/Lizenz **noch nicht starten**;
- keinen Preview-Link/Ersatzdomain als rechtliche Production-Domain verwenden;
- keinen Cookie-Banner ohne reale nicht-essenzielle Tracker montieren;
- keine Secrets/API-Keys an Agenten/Repo geben;
- `/terms` bleibt separater Legal-Input und wird nicht erfunden;
- PrivacyBee ersetzt nicht AP-6b Consent/Export/Delete oder Account/Auth/Traveller/RLS/Commercial Truth.

AP-6a PrivacyBee-Runtime ist bewusst **geparkt**.

---

## 6. Supabase Migration-History Replay – P1

Production `qscbgcdmivbbnzrcyegn` besitzt Version `20260829140000_trip_item_commercial_provenance`, deren gespeicherter Statement-Body ein **nicht replaybarer Prosa-Marker** ist. Die tatsächlichen Production-S5-B-Objekte existieren; der Commercial Write Path bleibt geschlossen (`production_write_path_allocated=false`).

Development `yfvbxvijcorffwxbxahl` besitzt diese Migration-Version und die S5-B Runtime-Gate-/Provenance-Objekte/Rollen nicht.

Keine Reparatur wurde ausgeführt. Vor Rebase/Reset/Replay-/migrationsnaher Arbeit ist dies **P1 Infrastructure Debt**. Repair bleibt Product-Owner-gated mit Backup/PITR/Before-Image/Fingerprints/Replay-Proof.

---

## 7. Offene alte PRs – nicht mit aktiver Arbeit verwechseln

Beim letzten Live-Check weiterhin offen:

- #52 – historischer alter ChatGPT-Handoff-Draft;
- #50 – historischer Provider-Ops-Dokumentations-Draft;
- #40 – historischer Admin-Audit-/Vorbereitungs-Draft;
- #39 – historischer Account-Audit-Draft;
- #28 – historische/future Collaboration Foundation, nicht automatisch starten.

PR #246 ist geschlossen/unmerged; PR #247 ist gemergt.

Beim Übergabepunkt existiert **kein offener aktueller Runtime-PR**. Live erneut verifizieren.

---

## 8. Risiken / Gates

- P0: keine aus dem aktuellen Übergabestand bekannten.
- P1: malformed Production Migration-History `20260829140000` vor migrationsnaher Arbeit.
- P2: `main protected=false` / Enforcement off.
- P3: keine neue AP-10-S1-spezifische Runtime-Störung.

Besondere PO-Gates aus dem Operating Standard bleiben vollständig bestehen, insbesondere vor Production-Migrationen, materiellen RLS/Identity/Ownership-Änderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Secrets/paid calls/Live-Aktivierung, Commercial Write-Öffnung, Payments, Kosten > USD 100/Monat, fundamentalen Product/Build-Order-Entscheidungen, Public Launch/Domain Cutover und Branch-Protection-Änderung.

---

## 9. Pflichtlektüre für einen neuen Chat

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `JETNITY_HANDOFF.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/CHATGPT_TL_AP10_S1_POST_MERGE_CHECKPOINT_2026-08-30.md`
7. `docs/JETNITY_BINDING_BUILD_ORDER.md`
8. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
9. Product Differentiation Doctrine + Strategy Register
10. relevante AP-10-S1-, AP-5-R1-, PrivacyBee- und Supabase-Replay-Evidence
11. danach **Live-GitHub/CI/Vercel/Supabase**.

Bei Chatwechsel kann zusätzlich `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md` gelesen werden.

---

## 10. FIRST NEXT ACTION

> **Keinen Runtime-Slice und keinen Agenten 24 automatisch starten.**

Der neue Technical Lead führt zuerst einen frischen **Binding Slice Precheck** durch:

1. aktuellen `main`, letzte Merges und docs-only Drift live verifizieren;
2. offene PRs/Issues/Branches und Agentenstatus live klassifizieren;
3. Current CI/Vercel prüfen;
4. bei DB-/Security-Bezug Supabase live prüfen;
5. Binding Build Order + Account Plan gegen Runtime-Baseline `a4d9384e...` und den aktuellen Checkpoint reconciliieren;
6. PrivacyBee/AP-6a bis erreichbarer `jetnity.com` Production als geparkt behandeln;
7. migrationsnahe/AP-6b-Arbeit hinter P1 + PO-Gates behandeln;
8. die besten **nicht blockierten** Kandidaten nach Differentiation Impact oder Enabler Justification bewerten;
9. erst danach bounded Slice, Workstream und frische Agenten-Generation bestimmen.

**Kein Folgeslice ist automatisch freigegeben.**