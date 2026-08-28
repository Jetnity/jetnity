# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 27. August 2026  
Status: **kanonischer erster Einstieg. Live-Evidence gewinnt immer. Production Gate A ist PASS; Production Gate B ist operativ PASS. PR #87, PR #94, PR #95, PR #96, PR #97, PR #98, PR #102, PR #106, PR #108, PR #111, PR #113, PR #114 und PR #115 sind integriert. Visitor Search UX ist integriert. `TW6-REST-01` ist geschlossen. TW7-A Runtime ist integriert. AP-4 Account Archive Lifecycle ist integriert. P2-TA-06 ist durch PR #113 integriert und Issue #112 CLOSED / completed. Production-AAL2 `20260827170000` ist angewendet und verifiziert, exakt einmal. P2-TA-03 ist durch PR #117 integriert. P2-TA-04 Gate 0 liegt auf Draft-PR #120; das ist kein RLS-/Grant-Change und kein AP-5-Start. Kein automatischer Folgeslice. Live-`main` immer live prüfen.**

> **Do not blindly trust this file — live verify `origin/main`, PRs, CI, Vercel, Supabase and Branch Protection first.**

Aktuelle operative Evidence:

- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_PR113_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
- `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_STATUS_2026-08-27.md`
- `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_HANDOFF_2026-08-27.md`
- `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` – kanonischer AP-5–AP-12-Plan nach P2-TA-03 / PR #117
- `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_STATUS_2026-08-28.md` – aktueller Account-Audit-Slice
- `docs/P2_TA03_ACCOUNT_PLATFORM_PLAN_RECONCILIATION_STATUS_2026-08-28.md`
- `docs/CHATGPT_PR108_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
- `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md`
- `docs/TRIP_WORKSPACE_TW7_HUB_GAP_STATUS.md`
- `docs/TRIP_WORKSPACE_TW7_A_STATUS.md`
- `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
- `docs/CHATGPT_TL_POST_PR94_CHECKPOINT_2026-08-27.md`
- `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`
- `docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`
- `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`
- `docs/TRIP_WORKSPACE_TW6_GATE_B_PREP_STATUS.md`
- historischer Continuity-Checkpoint: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`

## 1. Pflichtlektüre vor jeder Aktion

Jeder neue Chat, Technical Lead oder Coding Agent liest mindestens in dieser Reihenfolge:

1. `JETNITY_START_HERE.md`
2. `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
3. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
4. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
5. `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
6. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
7. `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
8. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
9. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
10. `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
11. `docs/JETNITY_BINDING_BUILD_ORDER.md`
12. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
13. `JETNITY_HANDOFF.md`
14. `docs/ACTIVE_WORK_STATUS.md`
15. `docs/CHATGPT_PR113_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
16. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_STATUS_2026-08-27.md`
17. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_HANDOFF_2026-08-27.md`
17a. bei Account-Folgearbeit: `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` und `docs/P2_TA03_ACCOUNT_PLATFORM_PLAN_RECONCILIATION_STATUS_2026-08-28.md`
18. `docs/CHATGPT_PR108_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
19. `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
20. `docs/CHATGPT_TL_POST_PR94_CHECKPOINT_2026-08-27.md`
21. `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`
22. `docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`
23. `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`
24. `docs/TRIP_WORKSPACE_TW6_GATE_B_PREP_STATUS.md`
25. den aktuell relevanten Slice-Task/Status/Handoff sowie ADRs/Checkpoints.

Historische Checkpoints und ältere Governance-/PR-Dokumente bleiben Evidence ihres damaligen Stands. Widersprechende alte Aussagen werden nicht gelöscht, aber durch spätere kanonische Entscheidungen und Live-Evidence superseded.

### Verbindliche New-Chat-Betriebsregeln

Ein neuer ChatGPT-Technical-Lead erfindet **keinen** eigenen Workflow. Diese Regeln sind bindend, nicht optional. Die ausführlichen Standards werden referenziert, nicht ersetzt.

1. Rolle: übergeordneter Jetnity **Technical Lead**.
2. Pflichtlektüre: die Reihenfolge in Abschnitt 1; zuerst `JETNITY_START_HERE.md`, dann der aktuellste Post-Merge-New-Chat-Checkpoint (`docs/CHATGPT_PR113_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`).
3. **Live-Evidence gewinnt** über Docs, Chat, Screenshots und Erinnerung.
4. Cursor-Aufträge nennen den **exakten Anzeigenamen** aus Abschnitt 9.
5. Der Feature-/Audit-Autor ist **nicht** der unabhängige Finalreviewer.
6. Autonomes Ready/Merge nur nach unabhängigem Exact-Head-PASS (Actions + Vercel) gemäß Abschnitt 3. Blind mergen ist verboten.
7. Besondere Product-Owner-Gates aus Abschnitt 4 bleiben zwingend.
8. Keine stillen Shared-Contract- oder fundamentalen Produktentscheidungen.
9. **Kein automatischer Folgeslice** nach einem abgeschlossenen Auftrag.
10. Jede materielle Aktion wird im Repository persistiert (`docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`, `docs/CONTINUITY_STANDARD.md`).
11. Produktmaxime: **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

## 2. Vor jeder technischen Entscheidung live verifizieren

Zwingend prüfen:

- aktuellen `main`-SHA und Merge-Stand;
- offene PRs/Drafts und Branches;
- Ahead/Behind/Merge-Base;
- tatsächlichen Diff und alle betroffenen Dateien;
- GitHub Actions / Exact-Head-CI;
- Vercel Exact-Head Preview bzw. Production;
- relevante Supabase-/Migrationsstände, wenn DB-/Production-Bezug besteht;
- offene Review-Threads, Blocker und P0/P1/P2/P3;
- parallele Workstreams und Datei-/Shared-Contract-Kollisionen;
- ob historische PR-Bodies/Handoffs nur Evidence ihres Zeitpunkts sind.

Bei Widerspruch gilt:

> **Live-Evidence + aktuellste ausdrückliche Product-Owner-Entscheidung + aktuellste kanonische Governance gewinnen.**

Abweichung danach im Repository dokumentieren.

## 3. Ready-/Merge-Governance

Der Product Owner hat ausdrücklich entschieden:

> **ChatGPT / Technical Lead darf bei normalen scope-treuen PRs selbst Ready/Merge entscheiden.**

Das ist keine Auto-Merge-Freigabe.

Vor Ready/Merge muss der Technical Lead:

- Auftrag gegen tatsächlichen Code prüfen;
- Tests und Testannahmen selbst hinterfragen;
- Security/Privacy/Truth/Shared Contracts prüfen;
- Exact-Head-CI und Vercel prüfen;
- relevante Production-/Supabase-Grenzen prüfen;
- bei Fehlern zuerst korrigieren oder den zuständigen Cursor-Agenten gezielt korrigieren lassen;
- nach jeder Korrektur neu gaten;
- erst bei echtem unabhängigen PASS mergen.

> **Autonom mergen ist erlaubt. Blind mergen ist verboten.**

Feature-/Audit-Autoren dürfen ihr eigenes finales Review nicht als unabhängigen Technical-Lead-PASS ersetzen.

## 4. Besondere Product-Owner-Gates

Ausdrückliche Product-Owner-Freigabe bleibt erforderlich für insbesondere:

- Production-Migrationen oder destruktive / schwer rücknehmbare Production-Datenänderungen;
- große produktive RLS-/Ownership-/Identity-Vertragsänderungen;
- fundamentale Auth-/Session-/MFA-/AAL-Änderungen;
- neue besonders sensitive Pass-/MRZ-/Biometrie-/Dokument-Speicherung;
- sensible externe Datenweitergabe;
- reale Providerverträge, Production-Secrets oder paid calls;
- reale Payments / Geldbewegung;
- neue laufende Kosten über USD 100/Monat;
- fundamentale Produkt-/Business-/Build-Order-Änderungen;
- Public Launch, Provider-Live, Store-/Production-Großaktivierung.

Die Gate-A-Freigabe vom 27. August 2026 galt ausschließlich für `20260824160000` und anschließend `20260824180000`. Sie ist keine Sammelfreigabe für TW6-B, AAL2, Direction A, PR #87 oder andere Production-Schritte.

## 5. Verbindliche Produkt- und Engineering-Wahrheit

Jetnity muss produktionsreif, wartbar, testbar, sicher, performant und auf Mobile/Tablet/Desktop kohärent gebaut werden.

Verbindlich:

- keine Demo-/Placeholder-Wahrheit als Endzustand;
- `unknown`, `stale`, `error`, `unavailable`, `insufficient_context`, `empty` und bestätigte Zustände getrennt halten;
- keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health oder erfundene Visa-/Einreise-/Safety-/Live-Truth;
- LLM/Assistant erklärt und priorisiert Hard Truth, erzeugt sie aber nicht;
- Security, Privacy, Ownership/RLS und Least Privilege sind Kernanforderungen;
- Accessibility und Performance gehören zur Definition of Done;
- adversarial Agent-Self-Review plus unabhängiger Technical-Lead-Review;
- vollständige Exact-Head-Gates;
- keine stillen Shared-Contract- oder Scope-Erweiterungen.

Produktleitsatz:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

Native-Strategie:

> **one product, one truth, multiple clients.**

Keine separate mobile Business-Truth.

## 6. Domain-Wahrheit

- `https://jetnity.com` = einzige kanonische / später indexierte Public-Hauptdomain;
- `jetnity.ch` = Schweizer Entry-/Redirect-Domain, keine zweite indexierte Plattform;
- Public Indexing bleibt explizites Opt-in über exakt `NEXT_PUBLIC_ALLOW_INDEXING=true`;
- Default bleibt fail-closed / deny-all;
- HTML-`robots` folgt `darfIndexieren` fail-closed;
- Canonical / `metadataBase` / OG / JSON-LD verwenden `https://jetnity.com`;
- `*.vercel.app` ist niemals kanonische Produktdomain;
- `/planen` emittiert robots explizit;
- kein Domain-Cutover, kein Public Indexing, kein automatischer Redirect-Gate.

## 7. Traveller-Wahrheit

Kanonisch:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine relevante Funktion darf still genau eine Staatsbürgerschaft oder einen Default-Pass annehmen. Ausstellerland ist nicht automatisch Staatsbürgerschaft. Fehlt Evidence, bleibt Official/Regulatory `insufficient_context`/`unknown` statt erfunden.

Keine `first-item` / `documents[0]` / `evaluations[0]`-Semantik als Product Truth.

Foundation E ist vorhanden und wird nicht neu gebaut. P1-TA-02 ist geschlossen. **P2-TA-06 ist durch PR #113 integriert; Issue #112 ist CLOSED / completed.** Der kanonische App-Pfad bleibt 1:n und der Legacy-/Direct-Normalisierungspfad kollabiert mehrere Dokumente nicht mehr auf `documents[0]`.

## 8. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere:

- Auth / Identity / Sessions / MFA / AAL;
- RLS / Ownership / Guest→Account;
- Traveller / Multi-Citizenship / Multi-Document;
- Route / Transit;
- Privacy / Consent;
- Billing / Payment;
- Admin Audit / Capabilities;
- Provider Activation;
- Attribution / Revenue / Claims Truth;
- Commercial Provenance;
- Guardian / Simulator / Value Impact.

Ein Fachagent dokumentiert einen benötigten neuen oder wesentlich geänderten Shared Contract und stoppt. Keine stille Erweiterung.

## 9. Exakte Cursor-Anzeigenamen

1. `Trip workspace audit architecture`
2. `Account plattform audit vorbereitung`
3. `Jetnity provider readiness audit`
4. `Admin platform audit`
5. `Jetnity growth discoverability`
6. `Jetnity quality security audit`
7. `Jetnity native app architecture` – spätere Native-Phase.

Neue Aufträge nennen immer den exakten Anzeigenamen als `Cursor-Agent: <Name>`.

## 10. Aktuelle Integrationsbaseline

Post-PR-#113 verifizierte Baseline unmittelbar nach Merge:

`286d26fec2eed87e1227ebb2cf7327f50e8f5f1a`

- PR #113 – P2-TA-06 Readiness Credential Normalization: MERGED;
- Reviewed Exact Head `928215a2c6c4d4ce914f12ba1bd88dbcab8f548b`;
- Independent Technical-Lead PASS Review `5046006374`;
- Exact-Head Actions Run `33119531505`: SUCCESS;
- Exact-Head Vercel Inspector `2T1QpsbVLLasdX9E5j9P3EM1jbPh`: READY;
- Merge-Commit `286d26fec2eed87e1227ebb2cf7327f50e8f5f1a`;
- Post-Merge `main` Actions Run `33120743073`: SUCCESS;
- Post-Merge Vercel Production `dpl_7V8WetsqrXC8m4CQcUZoQb9hXn1e`: READY auf demselben Merge-SHA;
- Issue #112: CLOSED / completed;
- PR #111 – AP-4 post-merge continuity: integriert;
- PR #108 – AP-4 Account Archive Lifecycle: integriert;
- PR #106 – TW7-A Runtime: integriert, Issue #103 CLOSED / completed;
- PR #102 – Admin AAL2 production apply gate closure: integriert;
- PR #94 – Visitor Search UX: integriert;
- PR #87 – TW6-B Runtime + Day→Stage Mode Contract: integriert.

Historische frühere Baseline nach PR #98:

`beaef64a151adceb8f5bc759f58ae9ad13cecc51`

GitHub Actions auf exakt diesem SHA: Run `33087558642` SUCCESS. GitHub Production-Deployment `6125680097` success.

Weitere historische Integration:

- PR #95 – docs-only New-Chat-Checkpoint nach PR #94; Merge `943d14c27a01b4c783340c658c911434fcc62b27`;
- PR #94 – Visitor Search UX; Reviewed Head `8da869fd2756f3c1514de6d33678c8c7abfad1c4`; Technical-Lead PASS `5040199350`;
- PR-#94 Exact-Head Actions Run `33066516282`: SUCCESS;
- PR-#94 Exact-Head Vercel Preview `CBuVobvymHT9m7A4uUKmb2exU4PU`: SUCCESS;
- PR-#94 Merge-Commit `819715b1567417893d894b7b110eff1a2ab6cded`;
- Post-Merge `main` Actions Run `33067498607`: SUCCESS;
- Post-Merge Vercel `GrD4MaYqtnR9UL619gVnKx9HSUmH`: SUCCESS auf demselben Merge-SHA;
- GitHub Production deployment `6121770601`: SUCCESS auf demselben SHA;
- PR #89 / PR #91 – TW6-B Gate 0 / Gate 0B Provenance bleiben Vorgeschichte.

Jeder hier genannte SHA ist Evidence seines Zeitpunkts und **keine dauerhaft behauptete Live-Wahrheit**. Nach jedem Merge oder direkten Commit live neu prüfen.

`main` Branch Protection ist live zuletzt weiterhin nicht aktiviert (`protected=false`) und bleibt Governance-/Engineering-Risiko. Vor einer aktuellen Aussage erneut live prüfen.

## 11. Production Gate A – PASS / Gate B – operativ PASS

Production-Projekt: `qscbgcdmivbbnzrcyegn` (`ACTIVE_HEALTHY`).

Gate A ist vollständig PASS und enthält kanonisch:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Technical-Lead Re-Review vom 27. August 2026 (PR #87, Review `5039338077`): **Production Gate B ist operativ PASS.** Der Vier-Datei-Vertrag `20260826220000 → 20260826230000 → 20260826240000 → 20260827010000` wurde unter Write-Gate angewendet. Der Post-PR-#91-Read-only-Stand (TW6-B-Count = 0, keine Mode-Spalte) ist historische Evidence vor diesem Apply.

Explizit weiterhin nicht auf Production angewendet:

- historische AAL2-Datei `20260826090000`
- Development-AAL2-Version `20260826052735`
- Direction A
- andere nicht freigegebene Production-Migrationen

Production `20260827170000_admin_aal2_data_plane_alignment` ist über PR #102 angewendet und verifiziert, exakt einmal. `aktuelles_admin_aal2()` ist live. Kein zweiter Apply. Ältere Sätze „Production-AAL2-Apply bleibt ein Gate“ sind Pre-Apply-Evidence.

**Gate 0 / Gate 0B ≠ Gate B.** PR #94 und PR #113 haben Production-Daten nicht erneut geschrieben.

## 12. TW6-B Vier-Datei-Vertrag — bereits angewendet, kein Re-Apply

Der Vier-Datei-Vertrag ist der **bereits angewendete historische Production-Gate-B-Rollout**, nicht ein offener späterer Apply-Auftrag.

Angewendete Reihenfolge:

`20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`

Kein zweiter Production-Gate-B-Apply ist pending. Ältere Formulierungen „für einen später separat freigegebenen Production-Gate-B-Apply“ sind historische Evidence vor dem operativen PASS.

Weiterhin gilt nur die Sicherheitsregel: Development und Production **nicht blind erneut** mit diesem Bundle migrieren. `db:anwenden` darf die vier Dateien nicht dateiweise ausspielen. `27010000` bleibt die Zero-Stage-Regel: 0 Stages fail-closed; `single_destination` nur bei genau einer Stage.

**Gate 0 / Gate 0B ≠ Gate B.** Gate 0B war Provenance auf `main`. Gate B ist der bereits ausgeführte Production-Apply.

Development `yfvbxvijcorffwxbxahl` enthält bereits alle vier Versionen. Dort nicht erneut blind migrieren.

## 13. Trip Workspace / PR #87

Integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅
- TW6-A ✅
- TW6-B Gate 0 ✅
- TW6-B Gate 0B ✅

PR #87 (TW6-B Runtime + Day→Stage Mode Contract, inkl. Workspace-Tempo-Wahrheit) ist gemergt und **schließt `TW6-REST-01`** (progressive weitere Ziele / zusätzliche `trip_stages` im Create). Checkpoint: `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`. Ältere Dateien, die `TW6-REST-01 bleibt offen` schreiben, sind historische Evidence.

PR #94 (Visitor Search UX) ist gemergt. Reviewed Head `8da869fd`. Checkpoint: `docs/CHATGPT_TL_POST_PR94_CHECKPOINT_2026-08-27.md`. P1/P2 aus Review `5040068359` sind geschlossen. Es gibt **keinen offenen Visitor-Search-Implementation-Draft**.

Kein alter PASS ist eine aktuelle Merge- oder Production-Freigabe.

TW-7-Start-Gate ist erfüllt. TW7-A Runtime ist integriert (PR #106, Issue #103). Spec: `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md`. Stand: `docs/TRIP_WORKSPACE_TW7_A_STATUS.md`. Issue #103 ist CLOSED / completed. TW-8 bleibt hinter Provider S5 und realer Commercial Provenance. TW-9 danach.

## 14. Große Build-Reihenfolge

Weiter gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md`:

1. Trip Workspace vollständig abschließen – nur nach seinen Gates;
2. Traveller / Pass / Multi-Citizenship produktweit vervollständigen;
3. Account AP-5 bis AP-12 gemäß `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` (P2-TA-03 / PR #117 integriert). P2-TA-04 Gate 0 ist der aktuelle Account-Audit-Slice (Draft-PR #120). AP-4 ist integriert (PR #108). Historischer PR-#39-Plan ist keine Current Truth;
4. Provider Readiness Rest inkl. S5-B, danach echte Provider unter besonderen Gates;
5. Admin D–K + Marketing/Growth Control Plane;
6. Homepage finalisieren;
7. AI/Search Discoverability / Authority phasengerecht;
8. Marketing/Growth G0–G5 phasengerecht;
9. kommerzielle Produktschicht;
10. Guardian / What-if / Value + finaler Launch-Hardening-Audit.

P2-TA-06 ist abgeschlossen. P2-TA-03 ist integriert. P2-TA-04 Gate 0 klärt den Traveller-Write-Path, startet aber weder C1/C2 noch AP-5. Diese Liste gibt **nicht automatisch AP-5** frei; vor dem nächsten Slice müssen aktuelle Traveller-/Account-Gates, offene P0/P1/P2, Parallelität und Shared Contracts live neu geprüft werden.

## 15. Quality / Security / Sanitation

Separate vorhandene Security-/Performance-Funde bleiben eigene QS-Arbeit. Keine stillen Änderungen aus TW6-B oder PR #113 ableiten.

Project-Sanitation-Audit PR #88 bleibt non-destructive Evidence. Kein Repo-/Branch-/Supabase-/Vercel-Delete automatisch ausführen. Historische Evidence nicht löschen.

## 16. Exakter nächster Technical-Lead-Schritt

TW7-A Runtime ist integriert (PR #106), Issue #103 CLOSED / completed. AP-4 ist integriert (PR #108/#111). P2-TA-06 ist integriert (PR #113), Issue #112 CLOSED / completed. P2-TA-03 ist integriert (PR #117), Issue #116 CLOSED / completed. P2-TA-04 Gate 0 ist der aktuelle Account-Audit-Slice auf Draft-PR #120.

**Kein automatischer Folgeslice.** Unabhängiger Technical-Lead-Review von PR #120. Kein C1/C2, kein AP-5. Live-`main`, offene PRs/Issues, Binding Build Order und Gates erneut prüfen, bevor ein neuer Slice vergeben wird.

Issue #109 (Visitor Search Country/City-Relevance) und Issue #110 (spätere Homepage-Multi-Destination-Absicht) bleiben separate dokumentierte Themen und werden durch PR #113 nicht automatisch gestartet.

Visitor Search UX ist integriert. Production Gate B ist operativ PASS, kein Re-Apply. `TW6-REST-01` ist geschlossen. PR #96/#97/#98/#102/#106/#108/#111/#113 sind integriert. Production-AAL2 `20260827170000` ist angewendet und verifiziert, exakt einmal; kein zweiter Apply.

> **Kein automatischer Folgeslice. Kein Direction A. Kein TW-8/9. Kein weiterer Production-Write aus diesem Dokumentensatz.**

## 17. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Reviews, Merges, Integrationsentscheidungen, Governance-Entscheidungen, Agentenstatus, Blocker und nächste Schritte werden im Repository versioniert.

Ein neuer Chat oder Agent behauptet niemals aus Erinnerung oder Screenshot, ein PR sei aktuell, grün oder gemergt. **Immer live verifizieren.**
