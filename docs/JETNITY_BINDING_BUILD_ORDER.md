# Jetnity – verbindliche Build-Reihenfolge

Stand: 25. August 2026  
Status: **Product-Owner-verbindlich; Änderung nur durch neue ausdrückliche Product-Owner-Entscheidung**

## Grundsatz

Diese Datei definiert die kanonische große Entwicklungsreihenfolge. Neue Chats, Technical Leads und Cursor-Agenten dürfen die Reihenfolge nicht aus alten Handoffs, historischen PR-Bodies oder eigener Bequemlichkeit verändern.

Die Reihenfolge beschreibt die großen Programme. Innerhalb eines Programms dürfen konfliktarme Vorbereitungs-, Review- und Dokumentationsarbeiten parallelisiert werden, solange Shared Contracts und der aktive Integrationspfad nicht gefährdet werden.

## 1. Trip Workspace vollständig fertigbauen

Primärer Agent: `Trip workspace audit architecture`

Reihenfolge:

1. TW-1 – Shell & Geräteparität
2. TW-2 – Reiseübersicht
3. TW-4 – Aufmerksamkeit / `Jetzt wichtig`
4. TW-3 – Timeline / Etappe / Tag
5. TW-5 – Item- und Gap-Details
6. TW-6/TW-7/TW-8 nur nach ihren dokumentierten Abhängigkeiten/Gates
7. TW-9 – Polish, Evidence, Closure
8. verpflichtender finaler Function-by-Function-/Intelligence-Audit

TW-1 und TW-2 bleiben getrennte Runtime-Slices. Keine Monster-PRs.

## 2. Traveller / Pass / Multi-Citizenship produktweit vervollständigen

Foundation E ist bereits auf Production und darf **nicht neu gebaut** werden.

Kanonisches Modell:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Fehlende Produktarbeit umfasst insbesondere Account-Traveller-Registry, Dokument-Lifecycle/UX und die konsequente Nutzung dieses Modells in relevanten Reise-, Einreise- und Transitfunktionen.

Primärer Account-Agent: `Account plattform audit vorbereitung`. Shared Traveller-/Identity-Verträge bleiben Technical-Lead-gesteuert.

## 3. Account Platform vollständig weiterführen

Agent: `Account plattform audit vorbereitung`

AP-1 bis AP-3 sind auf `main`. Weiter mit AP-4 bis AP-12 gemäß `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` und den jeweiligen Shared Gates.

Dazu gehören u. a. Archiv/Lifecycle, Security, Privacy, Traveller Registry, Reiseprofil, Favoriten, Booking Overview, Notifications und Subscription-/Entitlement-Grundlage.

## 4. Provider Readiness S4–S8, danach echte Provider

Agent: `Jetnity provider readiness audit`

S1–S3 sind auf `main`. Weiter mit S4–S8 gemäß Provider-Plan.

Erst danach echte Provideraktivierung. Verträge, Secrets/API-Keys, kostenpflichtige Calls, Datenschutz/Lizenz und Production-Aktivierung bleiben besondere Product-Owner-Gates.

## 5. Admin Control Center D–K

Agent: `Admin platform audit`

A–C sind auf `main`. D–K werden gemäß Admin-Plan fertiggestellt.

Der bekannte Billing-/Refund-P1 muss zwingend vor Finance-/Payment-Live und vor finaler Billing Technical Closure geschlossen werden.

## 6. Homepage finalisieren

Homepage erst nach stabilem zentralem Trip-Workspace-Kern, insbesondere nachdem TW-2 und TW-4 fachlich tragen.

Ziel: klare Positionierung und einfacher Einstieg in Jetnity, keine Feature-Wand und keine Versprechen über noch nicht produktive Funktionen.

Mit der finalen Homepage beginnt verbindlich **Discoverability Phase D1** aus `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`: klare Jetnity-Entity, technische SEO-Basis, indexierbare Kernpositionierung, strukturierte Daten, Canonical-/hreflang-Strategie, zentrale ehrliche Produkt-/Use-Case-Seiten und saubere interne Verlinkung.

Konfliktarme D0-Grundlagen wie semantische Seitenstruktur, Metadata-/Canonical-Verträge, Sitemap-/robots-Grundlage und getestete strukturierte Daten dürfen schon vorher vorbereitet werden, wenn sie den aktiven Integrationspfad nicht aufblähen.

## 7. AI & Search Discoverability / Authority

Dieses Programm ist durch ausdrückliche Product-Owner-Entscheidung **verbindlich**. Ziel ist, Jetnity so zu bauen und öffentlich zu dokumentieren, dass Suchmaschinen und moderne Answer Engines Jetnity eindeutig finden, verstehen, korrekt einordnen und bei fachlich passenden Reiseplaner-Fragen als zitierwürdige Option berücksichtigen können.

Kanonische Spezifikation: `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`.

Pflichtbestandteile:

- Crawlability, Indexierbarkeit, Canonicals, Sitemaps und kontrolliertes `robots.txt`;
- mehrsprachige Locale-/`hreflang`-Architektur;
- passende, wahrheitsgetreue Schema.org-/JSON-LD-Strukturen;
- eindeutige Jetnity-Entity über Website, App Stores und offizielle Profile;
- indexierbare Seiten für reale Kernfunktionen und echte Use Cases;
- Answer-Engine-/Citation-Readiness mit semantischem HTML, stabilen URLs, klaren Definitionen und Evidence/Freshness bei zeitkritischen Aussagen;
- sachliche, belegte Vergleichsseiten statt manipulativer „Jetnity gewinnt immer“-Inhalte;
- hochwertige Reiseinhalte mit Authority-/Freshness-/Truth-Grenzen;
- echte externe Autorität über Reviews, Medien, Creator/Partner und organische Community-Präsenz;
- Search-/Structured-Data-/Performance-/Accessibility-Messung;
- strikte Privacy-Grenzen: keine privaten Reisen, Pass-/Dokumentdaten, Accountdaten oder Admin-/Provider-Secrets in öffentlichen Discovery-Flächen.

Es gibt **keine Garantie**, dass ChatGPT, Gemini, Perplexity, Google oder andere Systeme Jetnity in einer konkreten Antwort nennen oder auf Platz 1 setzen. Verbindlich ist die bestmögliche technische, inhaltliche und externe Citation-/Authority-Basis — ohne Fake-Reviews, erfundene Nutzerzahlen, Linkfarmen, Keyword-Spam oder nicht belegte Produktversprechen.

Zeitliche Umsetzung:

1. D0 darf konfliktarm früh vorbereitet werden.
2. D1 wird mit der finalen Homepage umgesetzt.
3. D2 folgt nach stabiler Produkt-/Commercial-Truth mit tiefen Feature-, Vergleichs- und zitierfähigen Informationsseiten.
4. D3 wird zum Public Launch mit App-Store-/Review-/Media-/Creator-/Partner-Distribution umgesetzt.
5. D4 läuft nach Launch kontinuierlich datenbasiert weiter.

## 8. Kommerzielle Produktschicht

Danach die vollständige kommerzielle Schicht:

- echte Preise und Verfügbarkeit;
- Multi-Provider-Vergleich;
- Preis vs. Zeit/Komfort/Gesamtnutzen;
- Commercial Provenance/Freshness;
- Affiliate-/Deep-Link-Attribution;
- Revenue-/Provisionserfassung;
- Entitlements/Subscriptions, wo Produktplan dies vorsieht.

Keine Fake-Commercial-Truth.

Die kommerzielle Wahrheit speist anschließend Discoverability Phase D2. Öffentliche Preis-/Value-/Vergleichsaussagen dürfen erst auf reale, belegte Commercial-Truth zugreifen.

## 9. Guardian / Reise-Autopilot & What-if-Reise-Simulator

Diese beiden Funktionen sind durch ausdrückliche Product-Owner-Entscheidung **verbindliche Kernfunktionen** und müssen vollständig gebaut werden.

Kanonische Spezifikation: `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`.

### Guardian / Reise-Autopilot

Guardian muss reale Änderungen und Probleme – soweit belastbare Evidence vorhanden ist – cross-domain gegen die gesamte Reise bewerten. Er soll Auswirkungen auf z. B. Anschluss, Transfer, Unterkunft, Aktivitäten, Route, Readiness, Safety, Seasonal, Traveller-/Document-Kontext, Zeit und kommerzielle Alternativen verständlich zusammenführen.

Guardian erzeugt **keine zweite Reise-Wahrheit** und darf keine kanonische Reise, Buchung, Zahlung oder Provideraktion still verändern. Reale Änderungen benötigen einen kontrollierten, expliziten Apply-/Command-Pfad.

### What-if-Reise-Simulator

Der Simulator muss hypothetische Reiseänderungen in einem isolierten Scenario-/Sandbox-State berechnen und Baseline vs. Scenario als verständliches Delta vergleichen. Die reale Reise bleibt während der Simulation unverändert. Erst ein ausdrückliches `Übernehmen` darf den normalen kontrollierten Write-Pfad aufrufen.

### Gemeinsame Architektur

Guardian, Simulator und Value Optimizer müssen gemeinsame kanonische Intelligence-/Impact-/Evidence-Bausteine wiederverwenden, wo fachlich identisch. Es dürfen keine drei widersprüchlichen Berechnungswelten entstehen.

Multi-Traveller, Multi-Citizenship, Multi-Document, Evidence/Freshness/Authority, `unknown`-/stale-/error-Grenzen und LLM-vs-Hard-Truth-Regeln gelten vollständig.

Der aktuell laufende Trip-Workspace-Slice darf dafür **nicht** aufgebläht werden. Technische Hooks dürfen früher entstehen, wenn sie ohnehin für einen aktuellen Slice nötig sind; die vollständige Integration bleibt ein eigener kontrollierter Programmblock.

Nach realer Produktreife erhalten Guardian und Simulator ihre öffentlichen Discoverability-/Feature-Seiten gemäß D2; vorher dürfen sie öffentlich nicht als bereits live dargestellt werden.

## 10. Production-Härtung / Launch Readiness

Vor echtem Launch verpflichtend:

- reale sequentielle E2E-Szenarien;
- Security-/Privacy-Abnahme;
- Backup-/Restore-/Recovery-Nachweis;
- Monitoring/Observability;
- globale Rate-/Cost-Grenzen;
- Performance;
- Accessibility;
- Mobile/Tablet/Laptop/Desktop-Acceptance;
- Release-/Rollback-Plan;
- Branch Protection / Required Checks;
- provider-backed Truth-Audit nach echter Provider-Aktivierung;
- finaler cross-domain Guardian-/Simulator-Audit inklusive No-Silent-Write-, Scenario-Isolation-, Multi-Citizenship- und Evidence/Freshness-Nachweis;
- finaler Discoverability-Audit: Crawlability/Indexability, Canonical/Locale/hreflang, strukturierte Daten, private-data-noindex, zentrale Live-Feature-Seiten, Entity-Konsistenz, Search-/Performance-/Accessibility-Evidence;
- Discoverability Phase D3 für Public Launch nur nach den jeweils geltenden Launch-/Distribution-Gates.

## Arbeitsweise

Die technische Ausführung folgt `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`.

Normale vollständig geprüfte PRs dürfen nach der Product-Owner-Freigabe vom 25. August 2026 durch den Technical Lead selbst Ready gesetzt und gemergt werden. Besondere Production-/Kosten-/Provider-/Produkt-/Sensitive-Data-Gates bleiben Product-Owner-pflichtig.
