# Jetnity – verbindliche Build-Reihenfolge

Stand: 26. August 2026  
Status: **Product-Owner-verbindlich; Änderung nur durch neue ausdrückliche Product-Owner-Entscheidung. Operativer Integrationsstand: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`.**

## Grundsatz

Diese Datei definiert die kanonische große Entwicklungsreihenfolge. Neue Chats, Technical Leads und Cursor-Agenten dürfen die Reihenfolge nicht aus alten Handoffs, historischen PR-Bodies oder eigener Bequemlichkeit verändern.

Die Reihenfolge beschreibt die großen Programme. Innerhalb eines Programms dürfen konfliktarme Vorbereitungs-, Review- und Dokumentationsarbeiten parallelisiert werden, solange Shared Contracts und der aktive Integrationspfad nicht gefährdet werden.

Die Querschnittsprogramme **AI/Search Discoverability** und **Marketing & Growth** besitzen bewusst phasenabhängige Vorarbeiten, die an passende Hauptprogramme gekoppelt werden. Das bedeutet nicht, dass ein späterer Block vollständig vorgezogen werden darf. Runtime-/Provider-/Campaign-/Public-Aktivierung folgt weiterhin ihren Abhängigkeiten und besonderen Product-Owner-Gates.

## 1. Trip Workspace vollständig fertigbauen

Primärer Agent: `Trip workspace audit architecture`

Reihenfolge:

1. TW-1 – Shell & Geräteparität ✅
2. TW-2 – Reiseübersicht ✅
3. TW-4 – Aufmerksamkeit / `Jetzt wichtig` ✅
4. TW-3 – Timeline / Etappe / Tag ✅
5. TW-5 – Item- und Gap-Details ✅
6. TW6-A – Create-Entry Alignment ✅ – **nicht** gesamtes TW-6
7. TW6-REST-01 – progressive weitere Ziele / zusätzliche `trip_stages` im Create ❌ offen
8. TW-7 / TW-8 nur nach ihren dokumentierten Abhängigkeiten/Gates
9. TW-9 – Polish, Evidence, Closure
10. verpflichtender finaler Function-by-Function-/Intelligence-Audit

TW-1, TW-2, TW-4, TW-3, TW-5 und TW6-A bleiben getrennte Runtime-Slices. Keine Monster-PRs. TW-8 bleibt hinter Provider S5 **und** realer Commercial Provenance; S5-A allein öffnet TW-8 nicht.

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

Marketing-/Growth-Abhängigkeit: Account-/Consent-/Notification-/Entitlement-Wahrheit darf später von CRM, Subscription Growth und Referral verwendet werden, aber Marketing darf keine zweite Account-/Consent-Wahrheit erzeugen. Sensitive Identity-/Document-Daten bleiben vom Marketing-Targeting ausgeschlossen.

## 4. Provider Readiness S4–S8, danach echte Provider

Agent: `Jetnity provider readiness audit`

S1–S3 und **S5-A** (Commercial-Provenance-Domainvertrag) sind auf `main`. S5-B ist nicht gestartet. Weiter mit S5-B und S4/S6–S8 gemäß Provider-Plan.

Erst danach echte Provideraktivierung. Verträge, Secrets/API-Keys, kostenpflichtige Calls, Datenschutz/Lizenz und Production-Aktivierung bleiben besondere Product-Owner-Gates.

Marketing-/Growth-Abhängigkeit: Paid-/Affiliate-/Commercial-Claims dürfen Provider-/Preis-/Verfügbarkeitswahrheit erst verwenden, wenn sie real und provenance-/freshness-gesichert vorliegt. Kein Marketing-Provider darf still als Produktprovider oder Hard-Truth-Quelle behandelt werden.

## 5. Admin Control Center D–K + Marketing/Growth Control Plane

Agent: `Admin platform audit`

A–C sind auf `main`. D–K werden gemäß Admin-Plan fertiggestellt.

Der bekannte Billing-/Refund-P1 muss zwingend vor Finance-/Payment-Live und vor finaler Billing Technical Closure geschlossen werden.

Zusätzlich ist `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md` **verbindlich**. Der bestehende Admin-Plan muss damit abgeglichen und die fehlenden Growth-/Marketing-Control-Slices kontrolliert ergänzt werden; kein Monster-PR.

Pflichtfähigkeiten umfassen phasenweise insbesondere:

- Executive Growth Overview, Funnel Explorer und Kohorten;
- provider-neutrale Attribution und Campaign-/Revenue-Reconciliation;
- Paid-Media-Control-Plane mit Spend Caps, Kill Switch, Approval und Audit;
- Creative-/Brand-Asset-Library plus Approved-Claims-Registry;
- Landingpage-/Campaign-Surface-Management;
- CRM Audience-/Journey-/Deliverability-Control;
- Content-/SEO-/AI-Search-Discoverability Operations;
- Experiment Registry/Platform;
- Referral-/Creator-/Partner Center mit Anti-Fraud/Reconciliation;
- Reviews/Reputation/PR/Launch Workspace;
- Subscription Growth und Market Expansion Cockpit;
- CAC/LTV/Payback/Contribution-Margin-/Forecasting-Ebene;
- Tracking-/Data-Quality-, Privacy-/Consent-, Connector- und Incident-Center;
- Marketing Calendar;
- Jetnity Copilot Pro als evidence-aware Growth Analyst;
- Capability-/Vier-Augen-/Audit-Trail-Regeln für produktive Marketing-Writes.

Produktive Ads-/CRM-/Audience-/Provider-Writes, neue Secrets, Verträge, kostenpflichtige Calls oder öffentliche Aktivierungen bleiben den geltenden besonderen Gates unterworfen.

## 6. Homepage finalisieren

Homepage erst nach stabilem zentralem Trip-Workspace-Kern, insbesondere nachdem TW-2 und TW-4 fachlich tragen.

Ziel: klare Positionierung und einfacher Einstieg in Jetnity, keine Feature-Wand und keine Versprechen über noch nicht produktive Funktionen.

Mit der finalen Homepage beginnt verbindlich **Discoverability Phase D1** aus `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`: klare Jetnity-Entity, technische SEO-Basis, indexierbare Kernpositionierung, strukturierte Daten, Canonical-/hreflang-Strategie, zentrale ehrliche Produkt-/Use-Case-Seiten und saubere interne Verlinkung.

Parallel werden die passenden **Marketing-&-Growth-G0/G1-Grundlagen** aus `docs/JETNITY_MARKETING_GROWTH_STANDARD.md` eingebaut, soweit deren Abhängigkeiten erfüllt sind: kanonische Acquisition-/Attribution-Parameter, versionierte Events, Landingpage-/Deep-Link-Verträge, Consent-kompatible Messung und messbare Activation-Ziele. Keine Paid-Skalierung ohne Revenue-/Conversion-Evidence.

Konfliktarme D0-/G0-Grundlagen wie semantische Seitenstruktur, Metadata-/Canonical-Verträge, Sitemap-/robots-Grundlage, getestete strukturierte Daten sowie provider-neutrale Event-/Attribution-Contracts dürfen schon vorher vorbereitet werden, wenn sie den aktiven Integrationspfad nicht aufblähen.

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

## 8. Marketing & Growth – G0 bis G5

Dieses Programm ist durch ausdrückliche Product-Owner-Entscheidung **verbindlich**. Kanonische Spezifikation: `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`.

Ziel ist ein professionelles Growth-System, das Wachstum, Wiederkehr und Monetarisierung messbar optimiert, ohne Product Truth, Privacy, Security oder Wirtschaftlichkeit zu unterlaufen.

Pflichtbestandteile:

- gemeinsame Marketing-/Growth-Positionierung entlang der realen Produktwahrheit;
- kanonischer Funnel von Reach bis Revenue Quality;
- provider-neutraler Acquisition-/Attribution-Context mit First-/Last-/Conversion-/Assist-Touch und ehrlichem `unknown`;
- versionierte Product-/Marketing-/Revenue-Events;
- Activation, Retention, CAC, LTV, Payback und Contribution Margin;
- Lifecycle CRM mit Consent, Frequency Caps, Quiet Hours, Suppression und Deliverability;
- Referral-/Invite-Loops mit Anti-Fraud und Self-Referral-Schutz;
- truth-aware Content Engine und Creator-/UGC-/Social-Distribution;
- Paid Acquisition nur mit belastbarer Conversion-/Revenue-Evidence, Spend Caps und Kill Switch;
- Landingpage-/A/B-Test-Regeln ohne Dark Patterns;
- Subscription Marketing auf realer Entitlement-/Pricing-Truth;
- App-Store-/ASO- und Web→App-Deep-Link-Fähigkeit;
- echte Reviews/Reputation/PR/Partnerschaften;
- internationales Growth-Modell nach Land/Sprache/Währung und realer Produkt-/Provider-/Legal-Readiness;
- Privacy/Security-Grenzen, insbesondere kein Pass-/MRZ-/sensitives Identity-Targeting;
- technische Marketing-Reliability, Tracking/Data-Quality und Incident-Behandlung.

Harte Truth-/Ethik-Regeln:

- keine Fake-Reviews, erfundenen Nutzerzahlen/Awards oder unbelegten Produktversprechen;
- keine Dark Patterns;
- `unknown` bleibt `unknown`;
- keine versteckte Affiliate-Verzerrung gegen Nutzerinteresse;
- keine Paid-Skalierung, wenn CAC/LTV/Payback/Contribution Margin nicht belastbar messbar sind;
- keine öffentliche Bewerbung einer Funktion als live, bevor sie real verfügbar und truth-ready ist.

Phasen und Abhängigkeiten:

1. **G0 – Foundation:** Event-/Attribution-/Consent-/Deep-Link-/Data-Quality-Verträge dürfen konfliktarm früh vorbereitet werden.
2. **G1 – Public/Homepage Foundation:** Landingpages, Activation-Messung, organische Distribution und erste Lifecycle-Basis zusammen mit truth-ready öffentlichen Flächen.
3. **G2 – Product Growth:** Referral, CRM/Journeys, Retention, Experimente und Creator-/UGC-Loops auf stabilen Account-/Notification-/Consent-Verträgen.
4. **G3 – Commercial Growth:** Affiliate-/Revenue-Reconciliation, CAC/LTV/Payback/Contribution Margin, Subscription Growth und Paid Acquisition erst auf realer Commercial Truth.
5. **G4 – Launch/Scale:** ASO, PR/Media, Reviews, Markt-Expansion und skalierte Kampagnen erst nach Launch-/Provider-/Legal-/Privacy-Readiness.
6. **G5 – Continuous Optimization:** fortlaufende datenbasierte Optimierung mit Audit, Forecasting, Experimenten und Incidents.

Die Phasen sind querschnittlich an ihre fachlichen Voraussetzungen gekoppelt; sie ändern die Hauptreihenfolge nicht und rechtfertigen kein Vorziehen gegateter produktiver Aktivierungen.

## 9. Kommerzielle Produktschicht

Danach die vollständige kommerzielle Schicht:

- echte Preise und Verfügbarkeit;
- Multi-Provider-Vergleich;
- Preis vs. Zeit/Komfort/Gesamtnutzen;
- Commercial Provenance/Freshness;
- Affiliate-/Deep-Link-Attribution;
- Revenue-/Provisionserfassung;
- Entitlements/Subscriptions, wo Produktplan dies vorsieht.

Keine Fake-Commercial-Truth.

Die kommerzielle Wahrheit speist anschließend Discoverability Phase D2 und Marketing-&-Growth Phase G3. Öffentliche Preis-/Value-/Vergleichsaussagen und Paid-Skalierung dürfen erst auf reale, belegte Commercial-Truth zugreifen.

## 10. Guardian / Reise-Autopilot & What-if-Reise-Simulator

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

Nach realer Produktreife erhalten Guardian und Simulator ihre öffentlichen Discoverability-/Feature-Seiten gemäß D2 und Growth-/Content-Distribution gemäß G1/G4; vorher dürfen sie öffentlich nicht als bereits live dargestellt werden.

## 11. Production-Härtung / Launch Readiness

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
- finaler Marketing-/Growth-/Tracking-Audit: Attribution, Revenue-Reconciliation, Consent, Data Quality, CRM/Deliverability, Spend Caps/Kill Switch, Claims Registry, Referral/Creator Anti-Fraud, Economics/Forecasting und Admin-Audit-Trail;
- Discoverability Phase D3 und Growth Phase G4 für Public Launch nur nach den jeweils geltenden Launch-/Distribution-/Provider-/Privacy-/Kosten-Gates.

## Arbeitsweise

Die technische Ausführung folgt `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`.

Normale vollständig geprüfte PRs dürfen nach der Product-Owner-Entscheidung vom 26. August 2026 durch den Technical Lead selbst Ready gesetzt und gemergt werden, jedoch nur nach unabhängigem Review. Blind mergen ist verboten. Kanonisch: `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`. Besondere Production-/Kosten-/Provider-/Produkt-/Sensitive-Data-Gates bleiben Product-Owner-pflichtig.
