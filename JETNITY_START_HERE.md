# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 27. August 2026  
Status: **kanonischer erster Einstieg. Live-Evidence gewinnt immer. PR #89 ist integriert; Production Gate A ist PASS; TW6-B Gate B bleibt nicht freigegeben; PR #87 bleibt Draft und muss neu gegen den aktuellen `main` re-konstruiert und re-gegatet werden.**

> **Do not blindly trust this file — live verify `origin/main`, PRs, CI, Vercel, Supabase and Branch Protection first.**

Aktuelle operative Evidence:

- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
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
15. `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`
16. `docs/TRIP_WORKSPACE_TW6_GATE_B_PREP_STATUS.md`
17. den aktuell relevanten Slice-Task/Status/Handoff sowie ADRs/Checkpoints.

Historische Checkpoints und ältere Governance-/PR-Dokumente bleiben Evidence ihres damaligen Stands. Widersprechende alte Aussagen werden nicht gelöscht, aber durch spätere kanonische Entscheidungen und Live-Evidence superseded.

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

Die Gate-A-Freigabe vom 27. August 2026 galt ausschließlich für `20260824160000` und anschließend `20260824180000`. Sie ist keine Sammelfreigabe für weitere Production-Schritte.

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

Foundation E ist vorhanden und wird nicht neu gebaut. P1-TA-02 ist geschlossen. P2-TA-06 bleibt offen.

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

Aktuell hat kein Fachagent automatisch einen offenen Folgeslice. PR #87 darf nur nach neuer Technical-Lead-Einordnung weiterbearbeitet werden.

## 10. Aktuelle Integrationsbaseline

Verifizierter `main` vor dem aktuellen Continuity-PR:

`3d0ffa2d97df66a4d6006587047bf27b0df9606c`

Dieser SHA ist **keine dauerhaft behauptete Wahrheit**. Nach jedem Merge oder direkten Commit live neu prüfen.

Wichtige aktuelle Integration:

- PR #89 – TW6-B Gate 0 migrations-only + transactional playbook;
- Merge-Commit `5fc4d1b873f1fa7aff8e4064163275bf30f9ce98`;
- PR-#89 Exact Head `986fa8b7592286731e44ab46d36a8f299531d669`;
- Exact-Head Actions Run `33023062522`: SUCCESS;
- Exact-Head Vercel: SUCCESS/READY;
- Post-Merge `main` CI Run `33023988403`: SUCCESS.

`main` Branch Protection ist live weiterhin nicht aktiviert (`protected=false`) und bleibt Governance-/Engineering-Risiko.

## 11. Production Gate A – PASS

Production ist nach Gate A `ACTIVE_HEALTHY`.

Kanonische Production-Migration-History enthält jetzt zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Finale Verifikation:

- `reise_anlegen(jsonb)` verwirft bei `kind='flight'` untrusted `price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url`;
- Route-Itinerary bleibt erhalten;
- RPC bleibt `SECURITY INVOKER`;
- `authenticated` RPC EXECUTE=true, `anon`=false;
- Trigger `trip_items_flug_handelsfelder_schuetzen` genau einmal vorhanden und enabled;
- Trigger-Scope korrekt;
- Guard-Funktion für authenticated/anon nicht direkt executable;
- Production Flight-Items weiterhin 0.

Vollständige Evidence:

`docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`

## 12. Explizit nicht auf Production

Weiterhin nicht freigegeben / nicht angewendet:

- TW6-B `20260826220000`
- TW6-B `20260826230000`
- TW6-B `20260826240000`
- AAL2 `20260826090000`
- Development-AAL2-Version `20260826052735`
- Direction A

Auf Production existiert weiterhin weder `day_stage_assignment_source` noch `day_stage_assignment_mode`.

**Gate 0 ≠ Gate B.**

## 13. Trip-Workspace-Gates

Integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅
- TW6-A ✅
- TW6-B Gate 0 / Provenance ✅

PR #87 bleibt der offene Runtime-Draft für progressive weitere Ziele / Day→Stage Mode Contract.

Der frühere PLAN-PASS auf PR #87 bezog sich auf einen älteren `main`. Vor jeder Fortsetzung zwingend:

1. aktuellen `main` live lesen;
2. PR-#87-Head live lesen;
3. Merge-Base/Ahead/Behind neu bestimmen;
4. aktuellen Diff prüfen;
5. Drift/Kollisionen mit PR #89 auflösen;
6. Shared Contracts erneut prüfen;
7. Exact-Head Actions/Vercel neu verlangen;
8. Production-Zustand erneut prüfen.

Kein alter PASS ist eine aktuelle Merge- oder Production-Freigabe.

TW-7 bleibt hinter Account-/Hub-Grenzen. TW-8 bleibt hinter Provider S5 und realer Commercial Provenance. TW-9 danach.

## 14. Große Build-Reihenfolge

Weiter gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md`:

1. Trip Workspace vollständig abschließen – nur nach seinen Gates;
2. Traveller / Pass / Multi-Citizenship produktweit vervollständigen;
3. Account AP-4 bis AP-12;
4. Provider Readiness Rest inkl. S5-B, danach echte Provider unter besonderen Gates;
5. Admin D–K + Marketing/Growth Control Plane;
6. Homepage finalisieren;
7. AI/Search Discoverability / Authority phasengerecht;
8. Marketing/Growth G0–G5 phasengerecht;
9. kommerzielle Produktschicht;
10. Guardian / What-if / Value + finaler Launch-Hardening-Audit.

## 15. Quality / Security

Nach Production Gate A wurden Supabase Security- und Performance-Advisors erneut gelesen.

Separate vorhandene Warn-/Info-Funde betreffen u. a. GraphQL-Exposition, ältere Admin-`SECURITY DEFINER`-Funktionen, fehlende FK-Indizes und ungenutzte Indizes. Kein Advisor-Fund zeigt auf die beiden Gate-A-Funktionen als neue Gate-A-spezifische Fehlkonfiguration.

Diese Funde sind eigene QS-/Security-Arbeit und wurden im Gate-A-Lauf nicht still verändert.

## 16. Exakter nächster Technical-Lead-Schritt

**PR #87 gegen den aktuellen `main` vollständig neu rekonstruieren und unabhängig re-reviewen.**

Wenn nötig, gezielte Korrektur an:

`Cursor-Agent: Trip workspace audit architecture`

Danach neuer Exact Head → neue CI/Vercel-Evidence → unabhängiger PASS.

Erst dann darf der Product Owner separat um Freigabe für Production Gate B gebeten werden.

Bis dahin:

> **Kein Gate B. Kein AAL2. Kein Direction A. Kein PR-#87-Merge. Kein TW-7/8/9-Folgeslice.**

## 17. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Reviews, Merges, Integrationsentscheidungen, Governance-Entscheidungen, Agentenstatus, Blocker und nächste Schritte werden im Repository versioniert.

Ein neuer Chat oder Agent behauptet niemals aus Erinnerung oder Screenshot, ein PR sei aktuell, grün oder gemergt. **Immer live verifizieren.**
