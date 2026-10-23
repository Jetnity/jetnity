# Jetnity Trip Audit V1 — Journey Integrity / verbindlicher unveränderlicher TASK

**Datum:** 2026-10-16 (Europe/Zurich)  
**Issue:** [#954](https://github.com/Jetnity/jetnity/issues/954)  
**Workstream:** Trip Workspace / Journey Integrity, OP-01 aus strategischem Register #236.  
**Einziger Autor:** **Jetnity Trip Audit V1 — Codex Generation 1** (neuer logischer Agent, Session-ID wird erst nach echtem Codex-Start vom Autor berichtet).  
**Branch:** `feat/trip-audit-v1-readonly`  
**PR:** bestehender Draft-PR auf diesem Branch (Nummer bei Agent-Start live ermitteln).  
**Baseline:** `main@9847b2c9e1bf9840c5557a71663a0f56c8b9d50c`, tree `d66a33a0f50539e9d0b40dba9ae9e88c2b919a2b`; `.jetnity/operating-mode.json` = `NORMAL`.  
**TASK-Status beim Seed:** PREPARED / TASK-ONLY / NO AUTHOR IMPLEMENTATION.  
**Diese TASK-Datei wird nach Erstellung nicht verändert; Blob beim Start unabhängig aus GitHub lesen.**

## 1. Produktziel / überprüfbarer Mehrwert

Der Reisende hat eine reale (Gast- oder Account-)Reise und möchte verstehen: **„Ist mein gespeicherter Reiseplan in sich konsistent, und wo fehlen noch Angaben?“** V1 liefert auf ausdrücklichen Klick in der bestehenden Workspace-Übersicht einen *read-only Auditbericht aus bereits gespeicherter Reise-Wahrheit*. Keine zweite Trip-Wahrheit, kein LLM-Urteil und kein neuer Provider.

**End-to-End-Produktweg:** geöffnete Workspace-Übersicht → **„Reise prüfen“** → kanonischer `Trip` + exakt derselbe ungeplante Item-Bestand wie in der Workspace-Übersicht → vorhandene reine Coverage-/Zeitfunktionen → deterministischer, begrenzter, ehrlicher Befundkatalog + geprüfter/nicht geprüfter Scope → zugängliche Ergebnisanzeige innerhalb der Übersicht. Die aktuelle Reise bleibt unverändert; Änderungen am Trip dürfen einen veralteten Befund **nicht** weiter als aktuell zeigen.

Das ist eine zusätzliche **Zusammenschau und Evidenz-Lesbarkeit**, keine Duplikation von `Jetzt wichtig` (kurze Prioritäten), `Reisevorbereitung` (User-Checks), `tripZeitpruefung` (Zeitmathematik) oder einer regulatorischen Readiness Engine. V1 erfordert einen tatsächlich nutzbaren UI-Weg, **nicht nur ein ungenutztes Offline-Modul**.

**Differentiation Impact:** Ganzheitliche Prüfung eines konkreten gespeicherten Trip-Snapshots mit transparentem Status `known gap / proven conflict / possible conflict / unknown` statt einer generischen Checkliste. Ein Exklusivitätsclaim ist ausdrücklich unzulässig: TripIt Pro bietet bereits Risk-/Flight-Alerts, Wanderlog Route-/Reservations-/Checklist-Funktionen. Das neue Angebot differenziert sich über Jetnitys vorhandene kanonische Reisegraph-Kombination und ehrliche Evidenzgrenzen, nicht über „weltweit einzigartig“.

## 2. Zu lesende, NICHT zu verändernde Kanonik

Vor Implementierung live vollständig lesen, einschliesslich vorhandener Tests und Aufrufsemantik:

- `types/trips.ts`: kanonischer `Trip`, `TripItem`, `TripStage`, User-Booking- und Traveller-Kontext.
- `lib/trips/arbeitsbereich.ts`: `ungeplantePunkteLesen`, `bereichStatus`; keine doppelte `ohneTag`-Liste zählen.
- `lib/trips/naechte-abdeckung.ts`: `unterkunftAbdeckung`; `bekannt`/`luecken`/`aufenthalte`/`selected` vs `booked`; kein unbekannt = Null.
- `lib/trips/flug-abdeckung.ts`: `flugAbdeckung`, `bestimmbar`, `open / selected / booked / unknown`, `unzugeordnet`.
- `lib/mobility/kanten.ts`: `mobilitaetsAbdeckung`, `bestimmbar`, `covered_by_flight`, `unknown`.
- `lib/trips/trip-timeline-temporal-review-1.ts`: `tripZeitpruefung`, `coverage.state`, `pairs[].state` (proven/possible/not_evaluable/no_proven_conflict), `comparisonBasis`, `reasons`, `basisRefs`. Keine eigene Zeit-/Timezone-/Transfer-Rechenengine erfinden.
- `lib/trips/attention.ts` + `attention-presentation.ts`: `Jetzt wichtig` bleibt auf der Hauptfläche; nicht erneut kopieren oder eigene Pseudo-Priorität errechnen.
- `components/trips/TripWorkspace.tsx`: bisherige `ungeplantePunkte`-Projektion, `uebersicht`/ `attention` und `TripWorkspaceUebersicht`-Render (etwa im Übersichtszweig).
- `components/trips/TripWorkspaceUebersicht.tsx`, `TripWorkspaceJetztWichtig.tsx`, vorhandene UI- und Accessibility-Tests.
- `docs/JETNITY_BINDING_BUILD_ORDER.md`, `docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`, `docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`.
- `JETNITY_START_HERE.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`, `docs/ACTIVE_WORK_STATUS.md`, `.jetnity/operating-mode.json`, #751 und relevante **neue** #748-MATERIAL.

Falls die bestehenden APIs keine sichere Zusammensetzung innerhalb des Dateiumfangs erlauben: **STOP für enges Technical-Lead-Scope-Amendment mit genauem Reproducer.** Keine Kanonik umschreiben.

## 3. Lieferumfang — ein integrierter, begrenzter Slice

### D1 — reine V1-Auditprojektion (NEU)

In `lib/trips/trip-audit-v1/**` einen reinen deterministischen Aggregator `tripAuditV1` (Name kann konsistent im neuen Namespace präzisiert werden) erstellen. Eingabe: kanonischer `Trip` und optional ein genau definierter, vom Workspace bereits gewählter `ohneTag`-Bestand; keine User-/Provider-Authority durch fremde Daten. Ausgabe: versionierter, nicht persistierter Snapshot-Bericht mit:
- festen, verständlichen Feldern zu geprüften Bereichen, nicht geprüften Bereichen und Auswertbarkeit;
- typisierten Befunden, stabilen deterministischen IDs, Fachbereich, sachlicher Lage, vorhandenem kanonischem Nachweis/Funktionsursprung, optionalen vorhandenen Trip/Stage/Item/Day-Referenzen;
- ausdrücklichem Unknown/Partial, wenn kanonische Inputs fehlen, unbestimmbar, veraltet, fehlerhaft oder bounded evaluation nicht vollständig sind;
- begrenzter CPU-/Output-Arbeit mit explizitem `incomplete`/Limitsignal statt stiller Unterdrückung;
- keinerlei „Trip safe“/„ready to travel“, „Visa OK“/„Visa not needed“ oder fingierter Echtzeitqualität.

Keine neue Persistenz, Event-Emission, Cookies, lokale Browser Storage, SSR/API, Cron/Automations, Provider, Netzwerkanfrage, Secret oder global mutabler Audit-Cache.

### D2 — kanonische lokale Befunde statt Doppelprüfer

**Unterkunft:** aus `unterkunftAbdeckung` nur dann konkrete nachweisbare `geplante Unterkunftsnacht fehlt` mit Zeitraum/Etappe, wenn `bekannt=true` und originale kanonische `luecken` vorhanden. Unbekannter Zeitraum/Stay, unzugeordnete oder nicht vollständige Daten ergeben unbekannt/teilweise, niemals „0/14 sicher“. `selected` ist **nicht** als extern bestätigt gebucht anzugeben. Keine separate Intervallberechnung.

**Zeit:** `tripZeitpruefung` unverändert auf dem gleichen aktuellen Trip/Unplanned-Snapshot aufrufen. `proven_conflict` darf nur genau so bezeichnet werden, wenn kanonisch bewiesen, `possible_conflict` nur als möglich und `not_evaluable` ausdrücklich nicht bewertbar. `no_proven_conflict` oder `coverage.state=partial` ist **kein** globaler Freispruch. `basisRefs` und `comparisonBasis` nur als bestehende Evidenzreferenz, nicht als neue Zeitzonenwahrheit. Keine erfundenen Anschluss-/Mindestumsteigezeiten.

**Flüge/Mobilität:** optionaler nachweisbarer Planungs-Gap aus bestehenden `flugAbdeckung`/`mobilitaetsAbdeckung` **nur** wenn `bestimmbar=true` und entsprechende offene kanonische Abschnitte. `unknown`/unzugeordnet/undeterminable als nicht bewertbar statt verpflichtender externer Flug-/Transportbuchung. `covered_by_flight` nicht als fehlenden Boden-Transfer ausgeben. Keine Anbieter-/Preis-/Verfügbarkeits-/Pünktlichkeitsbehauptung.

**Scope:** Reine gespeicherte Reiseplanung. Keine Behauptung über Einreise, Sicherheit, medizinische Lage, offizielle Quellen, Vertragsbedingungen, Wetter, Echtzeitflug, Tickets, Unterkunftsverfügbarkeit, tatsächliche Durchführung oder Zahlungsstatus. Explizit „nicht geprüft“ anzeigen.

### D3 — echte, nutzbare UI auf der vorhandenen Übersicht

Neue Komponente `components/trips/TripAuditV1Panel.tsx`: ein Nutzer-initiierter Button **„Reise prüfen“**, gut zugängliche Offenlegung der Ergebnisse. Vor Nutzerklick weder schwere Auditberechnung noch externe Aktion. Im geöffnten Zustand neu aus dem aktuellen kanonischen Trip-Snapshot berechnen oder bei Trip-Änderung sauber invalidieren; **nie einen alten Befund als aktuellen Trip ausgeben**. Der Text muss ehrliche Zustände vermitteln, nachvollziehbar gruppieren und vorhandene `Jetzt wichtig`-Karten nicht duplizieren oder verdecken. Platzierung in `TripWorkspaceUebersicht` nahe Übersicht/Attention, nicht ein neues Top-Level-Tab/Route.

Semantik: eigener `section`-Name, realer `button`, `aria-expanded`/`aria-controls`, tastaturbedienbar, verständliche Screenreader-Reihenfolge, sichtbarer Fokus, 44px Touch-Targets, Mobile 320px & 200% Zoom, kein horizontaler Overflow. Bei vielen Befunden sichtbare Begrenzung mit `Weitere anzeigen` und korrektem Gesamtstand, keine stille Löschung von Kanonik oder falsches „0 Probleme“. Kein neues UI-Kit, keine globale CSS/Navigation, keine Promotion zu „öffentlich live geprüft“. Die Desktop/Mobile Grund-IA unverändert.

Bereits existierende `TripWorkspace.tsx`-Ableitung `ungeplantePunkte` muss als **identischer Bestand** durch die Übersicht und neue Panel-Projektion gereicht werden; niemals unplanbare Items doppelt zählen, um ein neues Häkchen zu erzeugen.

### D4 — end-to-end synthetische Akzeptanz und adversarial Tests

Neue Tests in `lib/trips/trip-audit-v1/**` müssen die originale kanonische Auswertung beweisen, mindestens:

T01 Typischer gespeicherter Mehr-Etappen-Trip mit bekannten Etappendaten und einer echten *Planungs*-Unterkunftsnacht-Lücke, ohne erfundene Buchung; exakter V1-Vergleich gegen `unterkunftAbdeckung`.  
T02 Mehrere verbundene zeitliche Items mit vom bestehenden `tripZeitpruefung` belegtem Konflikt; kein eigenes Zeitmodell.  
T03 Möglicher Konflikt, fehlende Zeitzone/Uhrzeit, unklare/teilweise Timeline-Coverage und unerfassbare Zeit: keine falsche Proven/No-problem-Behauptung.  
T04 Unbekannte Aufenthaltsdaten und nur ausgewählte (nicht bestätigte) Unterkunft: nicht als bestätigt gebucht/abgedeckt melden; `unknown` bleibt unknown.  
T05 Known flight/mobility plan gap vs unknown/not-determinable; `covered_by_flight` nicht als separate fehlende Mobilität behandeln.  
T06 Identische kanonische Snapshot-Inputs mit stabilen IDs/sortierten Berichten; Gast-/Account-Reise gleicher Fachvertrag; keine von Lokale/Uhrzeit/API/LLM abhängigen Ergebnisse.  
T07 Explizites `ohneTag` entspricht im Audit exakt der bereits gewählten Workspace-Projektion; keine Duplikate oder Hidden Items, und Änderungen am Trip invalidieren die Anzeige.  
T08 Grosse/defekte/über der bestehenden kanonischen Grenze liegende Fälle: `incomplete` statt stiller PASS, Boundedness, keine Reaktivitätsschleife oder PII-Rohlogausgabe.  
T09 Sichtbare/UI-Runtime-Integration: „Reise prüfen“ ist im bestehenden Guest **und** Account Workspace über die gemeinsame Komponente erreichbar, vor Klick keine externe Aktion, nach Klick differenzierte Ergebnisse; Mobile/Focus/200%-Zoom soweit unter verfügbaren UI-Testtools sicher belegbar. Nicht geprüfte physische Geräte als **NOT VERIFIED** ausweisen.  
T10 Nichtaktivierung: keinerlei geänderter Provider/Official Truth/Source/Safety/Seasonal/Traveller/Account/Auth/Payment-Contract, keine Network-/Supabase-Calls, keine automatische Trip-Mutation.

Die benötigten Fixtures sind strikt synthetisch; keine personenbezogenen Reisepläne, reale Buchungsbestätigungen, privaten Screenshots oder Original-Logs verwenden.

### D5 — Bericht, Dokumentation und Grenzen

Erstelle nur task-eigene `PLAN`, `REPORT`, `SELF_REVIEW`, `HANDOFF`; dokumentiere vor/nach, tatsächliche Originalgates, Fehler, offene Risks, ausgenommenen Nutzerwert, Server-/Public-Nichtaktivierung und später sinnvolle Folgeschritte **als Empfehlung**, nicht automatisch als neuen Slice. Nach Implementierung keine unaufgeforderte neue Flight-, Official-Truth-, Safety-, AI-, Copilot-, Payment- oder Subscription-Integration.

## 4. Strikte Datei-Ownership — keine stillen Ausnahmen

**Zulässige WRITES ausschliesslich:**

1. **NEUE** Runtime und Tests: `lib/trips/trip-audit-v1/**`
2. **NEUE** UI-Komponente: `components/trips/TripAuditV1Panel.tsx`
3. **EXISTING** `components/trips/TripWorkspaceUebersicht.tsx`: nur kleiner, additiver Panel-Mount + typed prop
4. **EXISTING** `components/trips/TripWorkspace.tsx`: nur Durchreichen von bestehendem `ungeplantePunkte` zur Übersicht; keine weitere Logik-/Navigationänderung
5. **NEUE** task-eigene Docs: `docs/JETNITY_TRIP_AUDIT_V1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-16.md`
6. Optional **NEUE** rein synthetische/sanitisierte Berichte in `docs/evidence/jetnity-trip-audit-v1/**` (keine privaten Pfade, Tokens, Namen, E-Mails, User-Daten, rohe Testlogs oder Archivdateien).

**NICHT ändern:** diese TASK-Datei; alle übrigen `lib/trips/**` Bestandscodes/-tests, `lib/readiness/**`, `lib/route/**`, `lib/mobility/**`, `lib/flight*/**`, `lib/safety/**`, `lib/seasonal/**`, `types/**`, app routes, APIs, DB/Supabase/Migrations/RLS, `package.json`/`package-lock.json`, Next/Sharp, Workflows, Guards, Auth, Public SEO/robots, global styles, Guardian/Chief of Staff oder #953 Branch. Wenn Scope-Erweiterung nötig, **STOP + genaues TL-Amendment**.

## 5. Multi-Agent-Suitability / Integrationsordnung

**SINGLE_AGENT für diesen eng gekoppelten Trip-Audit-Slice**, parallel zu einem **separaten** Search-Bridge-Author. Keine Überlappung der Files oder Shared Contracts: Search Bridge #953 schreibt ausschliesslich `lib/readiness/official-truth-source-discovery-v1/search-bridge-1/**` plus eigene Docs; dieser Agent schreibt nur oben genannte `lib/trips/trip-audit-v1/**` und die drei eng begrenzten UI-Pfade. Beide lesen den jeweils anderen Bereich allenfalls READ-ONLY. Beide Branches starten vom aktuellen bestätigten `main`, **nicht voneinander**.

Nur TL entscheidet später die Merge-Reihenfolge. Nach Merge eines parallelen PR: `main` neu lesen, Merge-Base/Ahead/Behind neu vergleichen und nötigenfalls geprüfte branch-only Integration mit frischen HEAD-Gates; keine selbst autorisierte Main-Merge-, Rebase-Force- oder Scope-Änderung. Eigenständige Reviews: vollständiger Diff, bestehende Kanonik, Regression, UI/Accessibility, Security/Privacy, Original Actions/Auth/Vercel Preview exact head. Kein Agent darf Ready setzen/mergen. Keine zweite Generation für unmittelbare Review-Korrekturen.

## 6. Sicherheits- und Product-Owner-Gates

Operating Mode bei jedem Dispatch rechecken: `NORMAL` erlaubt normale begrenzte Produktarbeit, nicht gated Production- oder Truth-Aktionen. `unknown` bleibt `unknown`, `not_evaluable` bleibt `not_evaluable`, User-Snapshot ist kein Provider-/Official Truth. Keine neue Passport-/MRZ-/Health-Datenhaltung; keine Datenausleitung, Tracking, Modell/API/paid calls, externes Netzwerk, Credentials, neue Permission, GitHub Ruleset, Third-Party-Booking, Contract Acceptance, Upload/Import, DB/RLS, Production-Manual-Deploy, Public Launch oder Indexing. 100 USD/Monat Infrastrukturgrenze unverändert; dieser Slice aktiviert **0** zusätzliche kostenpflichtige Dienste.

Schütze insbesondere: #917 SOURCE_NOT_QUALIFIED; #944 kein live BP1-GET / Owner hat BMDS-Kontakt ausdrücklich abgelehnt; DEV-PREP-1 first Development migration response SUCCESS/required DB readback PLATFORM-SAFETY-BLOCKED/second NOT ATTEMPTED (keine Wiederholung, neue Query, anderer DB-Kanal oder Umgehung); #911 P2 privacy/#913 safety-blocked; Bern #934 HARD-BLOCKED/#937 PAUSED; #626; 18 residual npm findings. Next/eslint-config-next `16.4.1` und Sharp `0.35.5` bleiben. Public noindex/nofollow bleibt.

**Codex permissions:** Der für **#953** gesondert PO-freigegebene TEMPORARY Full Access **gilt nicht** diesem neuen Agenten. Neue Session startet mit regulärer Genehmigung. Bei Host/DNS/npm-Blockade **STOP**, mit TL/PO separat Freigabe klären; kein alternativer Runner, Proxy, mirror oder Credential-Pfad. Keine allgemeine Aufgabeinstellung selbst erweitern.

## 7. Agent-Workflow / Exact-Head-Gates

1. Eine **neue** Codex-Session für **exakt `Jetnity Trip Audit V1 — Codex Generation 1`** erstellen; echte Session-ID erst nach dem Start dokumentieren; keine erfundene UI-Umbenennung behaupten.
2. Live `main`, Operating Mode, #751, neue MATERIAL #748, #954, Draft PR, HEAD/Task-Blob, relevanten Code, alle oben genannten Sicherheitsgates lesen. Zuerst selbst Baseline und echten Diff prüfen. Kein weiteres Issue/Branch/PR.
3. Ein kurzer task-eigener `PLAN`; dann eigenständig nur erlaubte Dateien implementieren; dabei echten UI-Weg abschliessen.
4. Fokustests T01–T10, gesamte unveränderte Projektprüfroutine: Mode-Guard, Typecheck, Lint, npm Tests, API-Schutz, Schema-Bezug, Dead/Exports/Deps, Production Build; `git diff --check`; originale Auth via GitHub Actions; exakter Preview-SHA via Vercel. Fehlende lokale PG-Umgebung ist **kein** passender Ersatz für fehlgeschlagenen Test.
5. Keine persönlichen oder privaten Original-Artefakte aus CI/Workstation öffnen oder veröffentlichen. Nur sanitized Suite-Zusammenfassung + sichere synthetic fixtures.
6. Task-eigener REPORT/SELF_REVIEW/HANDOFF mit geänderter Datei-Inventur, exaktem aktuellen `main`, branch HEAD/tree, Merge-Base/Ahead/Behind, unverändertem TASK-Blob, Tests und Lücken.
7. Commit/Push **ausschliesslich** `feat/trip-audit-v1-readonly` auf bestehenden Draft PR, danach original CI/Auth/Preview soweit zugänglich prüfen; **STOP** für unabhängigen TL.

**Autor darf NICHT Ready setzen, mergen, auf Production deployen, den nächsten Slice starten, eine neue Generation beginnen, Scope erweitern oder sein Self-Review als TL-PASS darstellen.** Ein neuer Head invalidiert alte Exact-Head-Gates. Bei `CHANGES REQUIRED` dieselbe Agent-Session / gleiche Generation für gezielte Fixes, dann vollständiges Re-Gating.

**STOP — TRIP_AUDIT_V1 TASK-ONLY; AWAITING SINGLE NEW CODEX AUTHOR.**
