# Jetnity – ChatGPT Technical-Lead Chat Transition Checkpoint

Stand: 30. August 2026  
Status: **CHAT-TRANSITION-CHECKPOINT / KEIN AKTIVER RUNTIME-SLICE / KEIN AKTIVER CURSOR-AGENT / LIVE-EVIDENCE GEWINNT IMMER**

> Dieser Checkpoint ist für die Übergabe an einen neuen ChatGPT Technical Lead geschrieben. Er autorisiert **keinen** Folgeslice. Der neue Chat muss zuerst den tatsächlichen Live-Stand rekonstruieren. Prompt, Checkpoint, Handoffs und Agenten-Self-Reviews sind Evidence ihres Zeitpunkts; Live-Evidence gewinnt.

## 1. Exakter Übergabeanker

Letzte vollständig integrierte und post-merge verifizierte **Runtime-Baseline**:

- Repository: `Jetnity/jetnity`
- Runtime-`main`: `4549b0264b57052d1ab6737add9bbe7fd8801c3b`
- Commit: `AP-5-R1 – Honest global logout failure semantics`
- Post-Merge CI: #1338 / Run `33306700851` = **SUCCESS** auf exakt `4549b026...`
- Vercel Production auf exakt `4549b026...` = **SUCCESS**
- Branch Protection: `protected=false`, Enforcement off

Nach diesem Runtime-Commit wird ausschließlich dieser docs-only Continuity-/Transition-Stand gemergt. Deshalb kann der beim neuen Chat live sichtbare `main` **neuer als `4549b026...` sein, ohne dass danach Runtime geändert wurde**. Der neue Chat verifiziert den aktuellen `main` live und trennt Runtime-Baseline von docs-only Continuity-Merge.

## 2. Unmittelbar abgeschlossen – AP-5-R1

Issue #241: **CLOSED / completed**.

Slice: **AP-5-R1 – Honest Global Logout Failure Semantics**

Cursor-Agent:

- logischer Name: `Account plattform audit vorbereitung 22`
- Session/Run-ID: `bc-f631838b-21f3-4290-aa1f-db450a037ac3`
- Status bei Übergabe: **STOPPED / completed**

Source:

- Branch: `feat/ap5-r1-honest-global-logout-2026-08-30`
- Source Draft-PR #242
- erster TL-geprüfter Head: `c0abee5091511d241c2c1f55c04baa4e5baee10c`
- TL-Verdict auf diesem Head: **CHANGES REQUIRED**

Drei gefundene und anschließend durch denselben Agenten/dieselbe Session korrigierte Findings:

1. Cursor hatte entgegen Scope `ARCHITECTURE.md` / `DECISIONS.md` geändert und eine bereits belegte ADR-Nummer `ADR-0200` kollidierend verwendet. Review-Fix entfernte diese zentralen Änderungen vollständig.
2. AdminTopbar nutzte noch den öffentlichen Logout-Zielpfad `/`. Review-Fix stellt alle echten Admin-Logout-Flächen auf das feste Success-Ziel `/admin/login`.
3. Ein `onErgebnis`-/Effect-Pfad konnte nach einem fehlgeschlagenen Logout das Admin-Menü wiederholt öffnen. Review-Fix entfernte diesen persistenten Callback; das Menü bleibt normal schließbar.

Final independently reviewed Source Head:

`ccc50345b0f55e0a387c9f16f5fb3f8fac2e8d2a`

Finale Exact-Head-Gates:

- vollständiger TL-Diff-/Scope-/Security-Review: **PASS**
- `main...head`: **7 ahead / 0 behind**
- CI #1336 / Run `33306211723`: **SUCCESS**
- Vercel auf exakt `ccc50345...`: **SUCCESS**
- Review Threads: **0**
- PASS Review: `5060543804`, exakt head-gebunden

Der bekannte GitHub-Connectorfehler beim Draft→Ready (`Repository.fullDatabaseId`) trat erneut auf. Deshalb:

- PR #242 wurde als Transport-Draft geschlossen, nicht gemergt;
- Recovery PR #243 verwendete **denselben unveränderten PASS-Head** `ccc50345...`;
- Recovery CI #1337 / Run `33306595444`: **SUCCESS**;
- Merge mit Expected-Head-SHA-Lock;
- Merge/Main: `4549b0264b57052d1ab6737add9bbe7fd8801c3b`;
- Post-Merge CI #1338: **SUCCESS**;
- Vercel Production: **SUCCESS**.

Geliefertes Verhalten:

- allgemeines/public Logout bleibt Supabase-default/unscoped/global;
- Success-Redirect nur nach bestätigtem `signOut()` ohne Fehler;
- `{ error }` oder geworfener Operations-/Netzfehler erzeugt **keinen** Success-Redirect;
- Fehlercopy ist generisch, retrybar und gibt keine Raw-Supabase-/Token-/Session-ID-/Secret-Wahrheit preis;
- Public Success-Ziel = `/`;
- Admin Success-Ziel = `/admin/login`;
- kein request-controlled Redirect / kein Open Redirect;
- AP-5-S3 `local` / `others` / `global` bleibt unverändert;
- keine DB-/Migration-/RLS-/Identity-/Auth-Project-Config-/PrivacyBee-/Provider-Änderung.

Bewusster Residual außerhalb des Slices: der interne Admin-Login-Denial-Cleanup-Pfad hat eine eigene `signOut()`-Semantik und war kein allgemeiner Logout-Caller. Nicht automatisch als Folgeslice behandeln.

## 3. PrivacyBee – bindende Entscheidung, Runtime bewusst geparkt

Product-Owner-binding:

- Anbieter: **PrivacyBee AG, Switzerland / `privacybee.io`**
- Intended responsibility: website-visible Datenschutzschicht für Jetnity, insbesondere `/privacy`; mögliche weitere sichtbare Privacy-/Impressum-Flächen nur nach jeweiliger Prüfung.
- Binding Decision: `docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md`
- Integrationsvertrag: `docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md`

Neue reale Account-Evidence aus dieser Chatphase:

- Product Owner besitzt bereits ein Schweizer PrivacyBee-Konto mit einer alten Website `pazzar.ch`;
- `jetnity.com` lässt sich aktuell nicht als neue PrivacyBee-Website registrieren, weil dort noch **keine erreichbare Jetnity-Website** ausgeliefert wird;
- die alte PrivacyBee-Konfiguration zeigt den erwarteten Website-Scan-/Datenschutz-/Cookie-/Impressum-Workflow;
- kein Passwort, API-Key, Session-Cookie oder Secret wurde benötigt oder soll in Repo/Agenten gelangen.

Verbindlicher aktueller Zustand:

- **PrivacyBee für Jetnity parken, bis `jetnity.com` die echte Jetnity-Production erreichbar ausliefert.**
- keinen unnötigen Trial/Vertrag/Lizenzstart jetzt;
- keinen Vercel-Preview-Link oder Ersatzdomain als rechtliche Produktionsdomain verwenden;
- Cookie-Banner nicht montieren, solange keine echten nicht-essenziellen Tracker dies erfordern;
- `/terms` bleibt ein separater Legal-Content-Pfad und darf nicht erfunden werden;
- PrivacyBee ersetzt nicht AP-6b Consent-Persistenz, Datenexport, Kontolöschung, Account/Auth/Traveller/RLS/Provider-/Commercial-Truth.

Folge für Build Order: AP-6a PrivacyBee-Runtime ist **extern geparkt**, nicht fehlinterpretiert als technisch vergessen. AP-6b ist migrations-/RLS-/Delete-nah und zusätzlich vom unten stehenden P1 sowie besonderen PO-Gates betroffen.

## 4. Traveller / Account – kumulative Current Truth

Verbindliches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Verbindliche Dual-Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth einer konkreten Reise.**

Integriert und nicht neu zu bauen:

- trip-scoped Foundation E;
- 1:n Citizenships und 1:n Documents;
- Issuer Country ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship;
- Guest→Account trip-scoped Copy;
- AP-7 Gate 0 + PO-approved Dual Authority;
- AP-7-S1 Domain Contract;
- AP-7-S2 Account Registry Persistence + owner-only RLS auf Production;
- AP-7-S3 `/account/travellers` CRUD/UI;
- AP-7-S4 explizite Registry → unabhängige Trip-Snapshot-Materialisierung;
- TA-DL1 Document Lifecycle / Trip-Date Awareness;
- AP-UX-NAV1 Account Navigation Rail + `/reisen` consistency;
- TA-CUX1 Shared localized Country UX;
- AP-5 Gate 0 + S1–S5 und jetzt AP-5-R1.

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

## 5. Product Differentiation – unverändert bindend

Kanonische Doctrine:

`docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`

Arbeitsbegriff:

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

Feature-Gate:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Strategisches Register:

`docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`

Dort dauerhaft erhalten, aber **nicht automatisch autorisiert**:

- Trip Audit / Journey Integrity;
- Change Impact & Recovery;
- Multi-Citizenship / Entry Decision Engine;
- True Trip Cost;
- Route & Connection Feasibility;
- What-if Simulator;
- Next Best Action.

Issue #236 bleibt Strategy Pointer / do-not-auto-start.

## 6. Supabase Migration-History Replay – P1 bleibt offen

Production `qscbgcdmivbbnzrcyegn`:

- Migration-History-Version `20260829140000_trip_item_commercial_provenance` existiert;
- gespeicherter Statement-Body ist ein **nicht replaybarer Prosa-Marker**;
- die tatsächlichen Production S5-B Objekte existieren;
- Production Commercial Write Path bleibt geschlossen.

Development `yfvbxvijcorffwxbxahl`:

- besitzt diese Migration-Version nicht;
- besitzt die zugehörigen S5-B Provenance-/Runtime-Gate-Objekte/Rollen nicht.

Keine Reparatur wurde durchgeführt. Vor Rebase/Reset/Replay-/migrationsnaher Arbeit bleibt dies **P1 Infrastructure Debt**. Die Reparatur ist ein eigener Product-Owner-Gate und benötigt Backup/PITR/Before-Image/Fingerprints/Replay-Proof. Nicht durch `migration repair` oder blindes DDL-Reapply improvisieren.

## 7. Provider / Trip Workspace / größere Build Order

- Trip Workspace Kern ist weit fortgeschritten; TW-8 bleibt hinter Provider S5 + realer Commercial Provenance geschlossen.
- Keine echten Provider-Secrets/API-Keys oder bezahlten Live-Calls aus diesem Übergang heraus aktivieren.
- Production Runtime Principal / echte `live_api`-/`persisted_snapshot`-Commercial Truth ist nicht automatisch freigegeben.
- `docs/JETNITY_BINDING_BUILD_ORDER.md` bleibt Product-Owner-binding.
- PrivacyBee-Parkzustand und Migration-P1 sind echte Abhängigkeiten; sie dürfen nicht durch Fake-/Placeholder-Implementierungen umgangen werden.

## 8. Offene PRs – live klassifiziert, kein aktiver Runtime-PR

Live-Suche beim Übergang fand genau diese fünf offenen alten PRs:

- **#52** – alter ChatGPT Technical-Lead-Handoff: historischer, deutlich veralteter docs-only Draft; nicht als Current Truth verwenden.
- **#50** – alter Provider-Ops-S1-Dokumentations-Draft; historisch/veraltet, kein aktiver Provider-Slice.
- **#40** – Admin Platform Audit: historischer Audit-/Vorbereitungs-Draft, kein aktiver Control-Center-Runtime-Slice.
- **#39** – alter Account Platform Audit: historischer Audit-/Vorbereitungs-Draft, durch viele inzwischen integrierte Account-Slices überholt.
- **#28** – Trip Collaboration Foundation: historischer/future Draft; Collaboration bleibt future und darf nicht automatisch gestartet/gemergt werden.

**Kein aktueller Runtime-PR ist beim Übergabepunkt aktiv.**

Der neue Chat verifiziert diese Liste live; alte PR-Bodies sind keine heutige Produktwahrheit.

## 9. Agentenstatus

Zuletzt abgeschlossen:

- `Account plattform audit vorbereitung 22` – AP-5-R1 – **STOPPED / completed** – Session `bc-f631838b-21f3-4290-aa1f-db450a037ac3`.

Davor abgeschlossen:

- Agent 21 – TA-CUX1;
- Agent 20 – AP-UX-NAV1;
- Agent 19 – TA-DL1;
- Agent 18 – AP-7-S4;
- Agent 17 – AP-7-S3;
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate-0 Audit.

Aktiver Cursor-Agent bei Übergabe: **keiner**.

**Agent 23 ist nicht gestartet und nicht vorautorisiert.** Eine neue logische Einheit bekommt erst nach neuem Binding Slice Precheck eine frische Agenten-Generation. Falls der Account-Workstream fachlich Owner bleibt, wäre die nächste Nummer 23; der neue TL entscheidet dies erst nach Live-Rekonstruktion.

## 10. Risiken und Product-Owner-Gates

Aktuelle Klassifikation:

- **P0:** keine aus dem Übergabestand bekannten.
- **P1:** malformed Production Migration-History-Body `20260829140000` vor migrationsnaher Arbeit.
- **P2:** `main protected=false` / Enforcement off.
- **P3:** keine zusätzliche für den Übergang relevante neue Runtime-Störung.

Besondere Product-Owner-Freigabe bleibt erforderlich insbesondere vor:

- Production-Migrationen oder destruktiven/schwer rücknehmbaren Production-Datenänderungen;
- materiellen Production-RLS-/Ownership-/Identity-Vertragsänderungen;
- fundamentalen Auth-/Session-/MFA-/AAL-Änderungen;
- sensitiver Pass-/MRZ-/Biometrie-/Dokument-Speicherung oder sensibler neuer externer Datenweitergabe;
- realen Providerverträgen, Production-Secrets, paid calls oder Live-Aktivierung;
- Öffnung geschlossener Commercial-Write-Pfade;
- Payments/Geldbewegung;
- laufenden Infrastruktur-/Servicekosten über USD 100/Monat;
- fundamentalen Product-/Business-/Binding-Build-Order-Änderungen;
- Public Launch, Indexing/Domain-Cutover, App-Store-Live oder vergleichbarer extern bindender Aktivierung;
- Branch-Protection-Änderung gemäß bestehender Governance.

## 11. Pflichtlektüre für den neuen Chat

In dieser Reihenfolge starten:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `JETNITY_HANDOFF.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. **dieser Checkpoint**
7. `docs/JETNITY_BINDING_BUILD_ORDER.md`
8. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
9. `docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`
10. `docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`
11. AP-5-R1 Task/Status/Handoff/Review-Evidence und relevante PrivacyBee-/Replay-Gate-Dokumente
12. danach GitHub/CI/Vercel/Supabase live.

## 12. FIRST NEXT ACTION – exakt erster noch nicht erledigter Schritt

> **KEINEN neuen Runtime-Slice und keinen Agenten 23 sofort starten.**

Der neue Technical Lead führt zuerst einen **frischen Binding Slice Precheck** auf dem dann aktuellen `main` durch:

1. aktuellen `main` und die letzten Merges live lesen;
2. offene PRs/Issues/Branches und Agenten-Parallelität live klassifizieren;
3. aktuellen `main`-CI- und Vercel-Status prüfen;
4. bei DB-/Security-Bezug Supabase Production/Development/Migration-History/RLS live gegenprüfen;
5. Binding Build Order + Account Platform Plan gegen den tatsächlich integrierten Stand reconciliieren;
6. PrivacyBee AP-6a als geparkt behandeln, solange `jetnity.com` nicht real erreichbar ist;
7. migrationsnahe/AP-6b-Kandidaten hinter P1 + PO-Gates behandeln;
8. verbleibende **nicht blockierte** Kandidaten auf Differentiation Impact oder Enabler Justification bewerten;
9. erst dann den kleinsten verantwortbaren nächsten Slice, Workstream und frischen Agentennamen festlegen.

Wenn die Build Order nach dieser Rekonstruktion eine echte Product-Owner-Entscheidung verlangt, nicht improvisieren: Entscheidung vor dem betreffenden Slice einholen.

## 13. Adversarial Continuity Check

Ein vollständig neuer Chat muss aus Repo + Live-Evidence beantworten können:

- Was ist wirklich in `main`? → live verifizieren; letzte Runtime-Baseline dieses Checkpoints `4549b026...`.
- Ist AP-5-R1 fertig? → ja, integriert, post-merge CI/Vercel grün, Issue #241 geschlossen.
- Läuft ein Agent? → nein.
- Gibt es einen offenen aktuellen Runtime-PR? → beim Übergang nein; fünf alte offene PRs sind oben historisch klassifiziert.
- Darf PrivacyBee jetzt aktiviert werden? → nein, bis `jetnity.com` real erreichbar ist und die Integrations-/Legal-Gates erfüllt sind.
- Darf eine neue Migration einfach gestartet werden? → nein, Replay-P1 + besondere PO-Gates beachten.
- Was ist der nächste Schritt? → **Live-Rekonstruktion + neuer Binding Slice Precheck, danach erst Slice-Auswahl.**

Wenn Live-Evidence hiervon abweicht, gewinnt Live-Evidence und die Continuity wird zuerst korrigiert.