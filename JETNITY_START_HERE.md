# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 26. August 2026  
Status: **kanonischer erster Einstieg. Operative Wahrheit immer aus Repository + Live-Systemen rekonstruieren. Technical Lead darf normale PRs nach strenger unabhängiger Prüfung selbst Ready setzen / mergen; blindes Vertrauen ist verboten.**

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
15. `docs/CHATGPT_D0_1_MERGE_CHECKPOINT_2026-08-25.md`
16. den aktuell aktiven Slice-Task/Status/Handoff sowie relevante ADRs/Checkpoints.

Historische Merge-Governance-Dokumente vom 22./25. August bleiben Evidence ihres damaligen Stands. Für normale Ready-/Merge-Entscheidungen werden widersprechende Passagen durch `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md` superseded.

## 2. Vor jeder technischen Entscheidung live verifizieren

Zwingend prüfen:

- aktuellen `main`-SHA und Merge-Stand;
- offene PRs/Draft-PRs und Branches;
- Ahead/Behind/Merge-Base;
- tatsächlichen Diff und alle betroffenen Dateien;
- GitHub Actions / Exact-Head-CI;
- Vercel Exact-Head Preview bzw. Production;
- relevante Supabase-/Migrationsstände, wenn der Slice DB-/Production-Bezug haben könnte;
- offene Review-Threads, Blocker und P0/P1/P2/P3-Findings;
- parallele Workstreams und mögliche Datei-/Shared-Contract-Kollisionen;
- ob historische PR-Bodies/Handoffs nur Evidence ihres Zeitpunkts sind.

Bei Widerspruch gilt: **Live-Evidence + aktuellste ausdrückliche Product-Owner-Entscheidung gewinnen. Abweichung dokumentieren und Continuity reparieren.**

## 3. Ready-/Merge-Governance – aktuell

Der Product Owner hat am 26. August 2026 ausdrücklich entschieden:

> **ChatGPT / Technical Lead darf bei normalen scope-treuen PRs selbst entscheiden, ob Ready/Merge sinnvoll und verantwortbar ist.**

Das ist keine Auto-Merge-Freigabe.

Vor Ready/Merge muss der Technical Lead:

- den Auftrag gegen den tatsächlichen Code prüfen;
- Tests **und die Testannahmen selbst** hinterfragen;
- Security/Privacy/Truth/Shared Contracts prüfen;
- Exact-Head-CI und Vercel prüfen;
- relevante Production-/Supabase-Grenzen prüfen;
- bei Fehlern zuerst selbst korrigieren oder den zuständigen Cursor-Agenten gezielt korrigieren lassen;
- nach jeder Korrektur neu gaten und neu reviewen;
- erst bei echtem unabhängigem PASS mergen.

**Autonom mergen ist erlaubt. Blind mergen ist verboten.**

Der Product Owner kann jederzeit einen konkreten Hold setzen oder Änderungen verlangen.

## 4. Besondere Product-Owner-Gates bleiben zwingend

Eine ausdrückliche Product-Owner-Entscheidung bleibt vor der betreffenden Aktion erforderlich für insbesondere:

- Production-Migrationen oder destruktive / schwer rücknehmbare Production-Datenänderungen;
- große produktive RLS-/Ownership-/Identity-Vertragsänderungen;
- fundamentale Auth-/Session-/MFA-/AAL-Änderungen;
- neue besonders sensitive Pass-/MRZ-/Biometrie-/Dokument-Speicherung;
- neue sensible externe Datenweitergabe;
- reale Providerverträge, Production-Secrets oder paid calls;
- reale Payments / Geldbewegung;
- neue laufende Kosten über USD 100/Monat;
- fundamentale Produkt-/Business-/Build-Order-Änderungen;
- Public Launch, Provider-Live, Store-/Production-Großaktivierung.

## 5. Verbindliche Produkt- und Engineering-Wahrheit

Jetnity muss produktionsreif, wartbar, testbar, sicher, performant und auf Mobile/Tablet/Desktop kohärent gebaut werden.

Verbindlich:

- keine Demo-/Placeholder-Wahrheit als Endzustand;
- `unknown`, `stale`, `error`, `unavailable`, `insufficient_context`, `empty` und bestätigte Zustände getrennt halten;
- keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health oder erfundene Visa-/Einreise-/Safety-/Live-Truth;
- LLM/Assistant erklärt und priorisiert Hard Truth, erzeugt sie aber nicht;
- starke Security, Privacy, Ownership/RLS und Least Privilege;
- Accessibility und Performance sind Definition-of-Done-Bestandteile;
- adversarial Agent-Self-Review plus unabhängiger Technical-Lead-Review;
- vollständige Exact-Head-Gates;
- keine stillen Shared-Contract- oder Scope-Erweiterungen.

Produktleitsatz:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

## 6. Traveller-Wahrheit

Kanonisch:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine relevante Funktion darf still genau eine Staatsbürgerschaft oder einen Default-Pass annehmen. Ausstellerland ist nicht automatisch Staatsbürgerschaft. Fehlt Evidence, bleibt Official/Regulatory `insufficient_context`/`unknown` statt erfunden.

Foundation E ist vorhanden und wird nicht neu gebaut.

## 7. Shared Contracts

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
- Guardian / Simulator / Value Impact.

Ein Fachagent dokumentiert einen benötigten neuen oder wesentlich geänderten Shared Contract und stoppt. Keine stille Erweiterung.

## 8. Agentenmodell und Parallelität

Exakte Cursor-Anzeigenamen:

1. `Trip workspace audit architecture`
2. `Account plattform audit vorbereitung`
3. `Jetnity provider readiness audit`
4. `Admin platform audit`
5. `Jetnity growth discoverability`
6. `Jetnity quality security audit`
7. `Jetnity native app architecture` – für die spätere Native-Phase reserviert.

Parallelität ist erlaubt, wenn konfliktarm:

- eigener Branch + eigener Draft-PR + eigener Task/Status;
- Agenten ändern **nicht parallel** die zentrale `docs/ACTIVE_WORK_STATUS.md`; zentrale Continuity wird durch ChatGPT / Technical Lead zusammengeführt;
- Audit-only und Runtime-Slices klar trennen;
- keine stillen Shared-Contract-Änderungen;
- jeder Agent endet mit `STOPP` und startet keinen Folgeslice selbstständig;
- ChatGPT / Technical Lead prüft jeden Agenten-Change unabhängig vom kanonischen Startpunkt aus.

`Jetnity quality security audit` ist unabhängige QA/Security/Release-Prüfinstanz, kein allgemeiner Feature-Entwickler. `Jetnity native app architecture` bleibt bis zur vorgesehenen Native-Phase reserviert.

## 9. Live integrierter Stand

Aktueller `main` nach Product-Owner-freigegebenem PR #72:

`5f9dc4b0e87d8b2adbcaca6962a76463cad32304`

Integriert sind insbesondere:

- Foundation C – Readiness;
- Foundation D – Route & Transit Intelligence;
- Foundation E – Traveller Context;
- Safety/Disruption und Timing/Seasonal Foundations;
- Account AP-1 bis AP-3;
- Provider Readiness S1 bis S3;
- Admin A bis C;
- TW-1, TW-2, TW-4, TW-3, TW-5;
- QS-1;
- D0/G0 Foundation Audit;
- Merge-Governance-Reparatur #71;
- D0-1 Index Boundary Contract #70;
- Post-D0-1 Continuity #72.

D0-1 geschlossen:

- D0-P1-01 private Reise-Indexgrenze;
- D0-P1-02 parametrisierte `/planen`-Indexgrenze;
- D0-P2-03 Admin-/Unauthorized-Indexgrenze;
- P2-D0-1-TL-01 Search-Param-Presence-Contract.

Vercel-Production-Stand muss bei jeder neuen Arbeit live geprüft werden; der letzte vor dieser Governance-Reparatur verifizierte Runtime-Merge war `083eda22189e1dad8bd70413889d2486755d7fe6` mit READY Production.

`main` Branch Protection ist live weiterhin nicht aktiviert und bleibt ein Governance-/Engineering-Risiko.

## 10. Offene D0/G0-Kanten

Weiter offen:

- **D0-P1-03** – `/privacy` und `/terms` 404; eigener Legal-/PO-Slice, keine Rechtstexte erfinden;
- **D0-P2-01** – deny-all / Sitemap-/Host-Semantik;
- **D0-P2-02** – Canonical-/Origin-Vertrag und `NEXT_PUBLIC_APP_URL` vs `NEXT_PUBLIC_SITE_URL`;
- **D0-P2-04** – Locale / hreflang;
- **D0-P2-05** – JSON-LD / Entity Foundation;
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02.

Der nächste konfliktarme Runtime-Candidate ist **D0-2 – Canonical / Origin / robots-sitemap Consistency**, jedoch erst auf eigenem Branch/Task/Draft-PR.

## 11. Trip-Workspace-Gates

TW-1, TW-2, TW-4, TW-3 und TW-5 sind integriert.

TW-6 darf nicht blind starten:

- TW-6 – Create-Entry Alignment benötigt dokumentierten Product-Owner-Schnitt + Guest-One-Trip-Vertrag;
- TW-7 – Hub-Anschluss hängt an Account-/Hub-Grenzen;
- TW-8 – Commercial Surfaces hängt an Provider S5 / realer Commercial Provenance;
- TW-9 – Polish/Evidence/Closure danach;
- anschließend finaler Function-by-Function-/Intelligence-Audit.

## 12. Große Build-Reihenfolge

Weiter gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md`:

1. Trip Workspace vollständig abschließen – nur nach seinen Gates;
2. Traveller / Pass / Multi-Citizenship produktweit vervollständigen;
3. Account AP-4 bis AP-12;
4. Provider Readiness S4 bis S8, danach echte Provider unter besonderen Gates;
5. Admin D–K + Marketing/Growth Control Plane;
6. Homepage finalisieren;
7. AI/Search Discoverability / Authority phasengerecht;
8. Marketing/Growth G0–G5 phasengerecht;
9. kommerzielle Produktschicht;
10. Guardian / What-if / Value + finaler Launch-Hardening-Audit.

Konfliktarme **Audit-/Vorbereitungsarbeit** darf parallel laufen, wenn sie keine spätere Runtime-/Production-Aktivierung vorzieht und keine Shared Contracts verändert.

## 13. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Zuletzt live verifiziert: `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`;
- `20260824140000_flug_route_itinerary_untrusted_surface`.

Development enthält zusätzlich, weiterhin nicht Production-approved:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`;
- `20260824180000_trip_items_flug_handelsfelder_guard`.

## 14. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Reviews, Merges, Integrationsentscheidungen, Governance-Entscheidungen, Agentenstatus, Blocker und nächste Schritte werden im Repository versioniert.

Ein neuer Chat oder Agent behauptet niemals aus Erinnerung oder Screenshot, ein PR sei aktuell, grün oder gemergt. **Immer live verifizieren.**

Für Merge-Entscheidungen gilt ab 26. August 2026:

> **Technical Lead darf normale PRs selbst integrieren – aber erst nach vollständiger unabhängiger Prüfung, Korrektur aller Blocker und Exact-Head-Re-Gating.**
