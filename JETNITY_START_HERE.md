# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 30. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / CHAT-TRANSITION / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice – auch im selben Chat – muss zuerst der relevante Live-Stand rekonstruiert werden. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

Verbindliches Start-/Continuity-Gate:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

Aktuellster Technical-Lead-Transition-Checkpoint:

`docs/CHATGPT_TL_CHAT_TRANSITION_CHECKPOINT_2026-08-30.md`

Dieser Einstieg ersetzt niemals Live-Prüfung. Vor Änderung, Review, Ready, Merge oder neuem Agenten `main`, PRs/Issues/Branches, Exact Heads, CI, Vercel, relevante Supabase-/Production-Wahrheit, offene Threads, Risiken und Product-Owner-Gates selbst verifizieren.

---

## 1. Aktueller Übergabestand

Letzte vollständig integrierte und post-merge verifizierte **Runtime-Baseline**:

- `main/runtime @ 4549b0264b57052d1ab6737add9bbe7fd8801c3b`
- AP-5-R1 Honest Global Logout Failure Semantics ist integriert.
- Post-Merge CI #1338 / Run `33306700851`: **SUCCESS** auf exact `4549b026...`.
- Vercel Production auf exact `4549b026...`: **SUCCESS**.
- Issue #241: **CLOSED / completed**.
- `main protected=false` bleibt P2-Governance-Risiko.

Nach dieser Runtime-Baseline folgt nur der docs-only Chat-Transition-/Continuity-Merge. Daher kann der live aktuelle `main` beim nächsten Chat neuer sein, ohne dass danach Runtime verändert wurde. **Live verifizieren.**

**Kein Produkt-/Runtime-Folgeslice ist automatisch aktiv. Kein Cursor-Agent ist aktiv. Agent 23 wurde nicht gestartet.**

---

## 2. Zuletzt abgeschlossen – AP-5-R1

Cursor-Agent:

`Account plattform audit vorbereitung 22`

Session:

`bc-f631838b-21f3-4290-aa1f-db450a037ac3`

Final independently reviewed Head:

`ccc50345b0f55e0a387c9f16f5fb3f8fac2e8d2a`

Der erste Agent-Head erhielt **CHANGES REQUIRED** wegen drei Findings: zentrale ADR-/Architecture-Kollision, falsches Admin-Success-Ziel und persistenter Admin-Menü-Reopen-Callback. Derselbe Agent/dieselbe Session korrigierte alle drei. Der finale Head erhielt unabhängigen TL-PASS, CI/Vercel waren grün und 0 Review Threads offen.

Wegen des bekannten Draft→Ready-Connectorfehlers `Repository.fullDatabaseId` wurde Source PR #242 geschlossen und Recovery PR #243 mit **demselben unveränderten PASS-Head** gemergt.

Current Behavior:

- allgemeines/public Logout bleibt unscoped/global;
- Redirect nur nach bestätigtem Auth-Erfolg;
- Fehler/Wurf bleiben fail-closed, sichtbar und retrybar;
- keine Raw-Auth-/Token-/Session-ID-/Secret-Copy;
- Public Success `/`;
- Admin Success `/admin/login`;
- kein Open Redirect;
- AP-5-S3 `local` / `others` / `global` unverändert;
- keine DB/Migration/RLS/Auth-Config/PrivacyBee/Provider-Änderung.

Agent 22: **STOPPED / completed**.

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

Die sieben Kandidaten – Trip Audit, Change Impact & Recovery, Multi-Citizenship/Entry Decision Engine, True Trip Cost, Route & Connection Feasibility, What-if Simulator, Next Best Action – sind **Strategieoptionen, keine automatische Runtime-Roadmap**. Issue #236 bleibt do-not-auto-start.

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
- TA-CUX1 Shared localized Country UX.

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

---

## 5. PrivacyBee – ausgewählt, aber Jetnity-Runtime geparkt

Product-Owner-binding:

- **PrivacyBee AG / `privacybee.io` (Switzerland)** ist der beabsichtigte Provider für Jetnitys website-visible Privacy Layer.
- `docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md`
- `docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md`

Aktuelle reale Evidence:

- bestehendes PrivacyBee-Konto mit alter Website `pazzar.ch`;
- `jetnity.com` kann derzeit nicht als PrivacyBee-Website registriert/gescannt werden, weil dort noch keine erreichbare Jetnity-Website ausgeliefert wird.

Daher verbindlich:

- PrivacyBee Jetnity-Activation/Trial/Lizenz **noch nicht starten**;
- warten, bis die echte `jetnity.com` Production erreichbar ist;
- keinen Preview-Link/Ersatzdomain als rechtliche Production-Domain verwenden;
- keinen Cookie-Banner ohne reale nicht-essenzielle Tracker montieren;
- keine Secrets/API-Keys an Agenten/Repo geben;
- `/terms` bleibt separater Legal-Input und wird nicht erfunden;
- PrivacyBee ersetzt nicht AP-6b Consent/Export/Delete oder Account/Auth/Traveller/RLS/Commercial Truth.

AP-6a PrivacyBee-Runtime ist damit bewusst **geparkt**, nicht vergessen.

---

## 6. Supabase Migration-History Replay – P1

Production `qscbgcdmivbbnzrcyegn` besitzt Version `20260829140000_trip_item_commercial_provenance`, deren gespeicherter Statement-Body ein **nicht replaybarer Prosa-Marker** ist. Die tatsächlichen Production S5-B Objekte existieren; der Commercial Write Path bleibt geschlossen.

Development `yfvbxvijcorffwxbxahl` besitzt diese Migration-Version und die S5-B Runtime-Gate-/Provenance-Objekte/Rollen nicht.

Keine Reparatur wurde ausgeführt. Vor Rebase/Reset/Replay-/migrationsnaher Arbeit ist dies **P1 Infrastructure Debt**. Repair bleibt Product-Owner-gated mit Backup/PITR/Before-Image/Fingerprints/Replay-Proof.

---

## 7. Offene alte PRs – nicht mit aktiver Arbeit verwechseln

Beim Transition-Precheck waren genau fünf alte PRs offen:

- #52 – historischer alter ChatGPT-Handoff-Draft;
- #50 – historischer Provider-Ops-Dokumentations-Draft;
- #40 – historischer Admin-Audit-/Vorbereitungs-Draft;
- #39 – historischer Account-Audit-Draft, durch spätere Integration stark überholt;
- #28 – historische/future Collaboration Foundation, nicht automatisch starten.

Beim Übergabepunkt existiert **kein offener aktueller Runtime-PR**. Der neue Chat prüft dies live erneut.

---

## 8. Risiken / Gates

- P0: keine aus dem Übergabestand bekannten.
- P1: malformed Production Migration-History `20260829140000` vor migrationsnaher Arbeit.
- P2: `main protected=false` / Enforcement off.
- P3: keine neue transitionsrelevante Runtime-Störung.

Besondere PO-Gates aus dem Operating Standard bleiben vollständig bestehen, insbesondere vor Production-Migrationen, materiellen RLS/Identity/Ownership-Änderungen, fundamentalen Auth/MFA/AAL-Änderungen, sensitiver Dokument-/MRZ-/Biometrie-Speicherung, sensibler externer Datenweitergabe, realen Providerverträgen/Secrets/paid calls/Live-Aktivierung, Payments, Kosten > USD 100/Monat, fundamentalen Product/Build-Order-Entscheidungen, Public Launch/Domain Cutover und Branch-Protection-Änderung.

---

## 9. Pflichtlektüre für einen neuen Chat

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `JETNITY_HANDOFF.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/CHATGPT_TL_CHAT_TRANSITION_CHECKPOINT_2026-08-30.md`
7. `docs/JETNITY_BINDING_BUILD_ORDER.md`
8. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
9. Product Differentiation Doctrine + Strategy Register
10. relevante AP-5-R1-, PrivacyBee- und Supabase-Replay-Evidence
11. danach **Live-GitHub/CI/Vercel/Supabase**.

Bei Chatwechsel kann zusätzlich `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md` gelesen werden; der Product Owner besitzt außerdem einen universellen Recovery-Prompt.

---

## 10. FIRST NEXT ACTION

> **Keinen Runtime-Slice und keinen Agenten 23 sofort starten.**

Der neue Technical Lead führt zuerst einen frischen **Binding Slice Precheck** durch:

1. aktuellen `main`, letzte Merges und docs-only Transition-Drift live verifizieren;
2. offene PRs/Issues/Branches und Agentenstatus live klassifizieren;
3. Current CI/Vercel prüfen;
4. bei DB-/Security-Bezug Supabase live prüfen;
5. Binding Build Order + Account Plan gegen den tatsächlich integrierten Stand reconciliieren;
6. PrivacyBee/AP-6a bis erreichbarer `jetnity.com` Production als geparkt behandeln;
7. migrationsnahe/AP-6b-Arbeit hinter P1 + PO-Gates behandeln;
8. die besten **nicht blockierten** Kandidaten nach Differentiation Impact oder Enabler Justification bewerten;
9. erst danach bounded Slice, Workstream und frische Agenten-Generation bestimmen.

**Kein Folgeslice ist automatisch freigegeben.**