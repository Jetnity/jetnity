# Jetnity – verbindliches Agent-/Workstream-Modell

Stand: 25. August 2026; Nachtrag 28. August 2026  
Status: **Product-Owner-verbindlich; für neue Chats, Technical Leads und Coding Agents verpflichtend. Aktuelle Ready-/Merge-Regel: `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`.**

## 1. Zweck

Jetnity soll mit mehreren spezialisierten Cursor-Agenten parallel entwickelt werden können, ohne dass mehrere Agents dieselben fachlichen Verträge, dieselbe Produktwahrheit oder dieselben zentralen Dateien unkontrolliert verändern.

Dieses Dokument definiert deshalb verbindlich:

- welche **sechs** Cursor-Agent-Workstreams Jetnity verwendet bzw. reserviert;
- die exakten Anzeigenamen;
- Verantwortung und Non-Scope jedes Workstreams;
- wann ein Agent gestartet, pausiert oder wieder aktiviert wird;
- wie Shared Contracts geschützt werden;
- wie ChatGPT / Technical Lead alle sechs Agents steuert;
- wie Parallelisierung und Merge-Reihenfolge funktionieren;
- wie unabhängige Qualität, Security und Release Readiness organisiert werden.

Mehr Parallelität ist **kein Selbstzweck**. Geschwindigkeit darf Architektur, Wahrheit, Security, Privacy, UX, Merge-Qualität und Wartbarkeit niemals verschlechtern.

## 2. Übergeordnete Führung durch ChatGPT / Technical Lead

ChatGPT / Technical Lead bleibt die übergreifende Steuerungs- und Integrationsinstanz für **alle sechs** Cursor-Agenten.

Der Technical Lead verantwortet insbesondere:

- Produkt- und Systemarchitektur;
- verbindliche Build-Reihenfolge;
- Auswahl des aktuell aktiven Primär-Workstreams;
- konfliktarme Parallelisierung;
- Shared Contracts und deren Ownership;
- genaue Scope-/Non-Scope-Grenzen pro Slice;
- Branch-/Draft-PR-Strategie;
- unabhängige Reviews;
- Exact-Head-Gates;
- Ready-/Merge-Entscheidungen im Rahmen der genehmigten Autonomie;
- Synchronisation gegen aktuelles `main`;
- Cross-Agent-Abhängigkeiten;
- Wahrheit, Security, Privacy, Kosten- und Production-Gates;
- Eskalation an den Product Owner bei besonderen Freigaben.

Kein Cursor-Agent darf sich selbst zum Eigentümer eines Shared Contracts erklären oder still die Zuständigkeit eines anderen Workstreams übernehmen.

### Führungsregel für neue Chats

Jeder neue Chat / Technical Lead muss:

1. zuerst `JETNITY_START_HERE.md` lesen;
2. dieses Dokument vollständig lesen;
3. GitHub/PR/CI/Vercel/Supabase live verifizieren;
4. für jeden der sechs Agents bestimmen: **aktiv / wartet / blockiert / später reserviert**;
5. nur konfliktarme Agents parallel starten;
6. jedem Agent einen versionierten Auftrag mit Scope, Non-Scope, Gates und STOPP-Punkt geben;
7. nach Agent-Self-Review immer einen unabhängigen Technical-Lead-Re-Review durchführen;
8. Ready/Merge ausschließlich selbst ausführen, und nur nach unabhängigem Exact-Head-Review gemäß `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`. Cursor-Agenten dürfen Ready/Merge niemals ausführen.

## 3. Verbindliche sechs Cursor-Agent-Workstreams

Die exakten Anzeigenamen sind verbindlich. Bestehende Agents dürfen nicht umbenannt werden. Reservierte zukünftige Agents müssen bei Erstellung exakt so benannt werden.

### 3.1 `Trip workspace audit architecture`

**Rolle:** zentrale Reiseoberfläche / Trip Workspace.

Verantwortet insbesondere:

- Trip Workspace IA und Geräteparität;
- Reiseübersicht;
- `Jetzt wichtig` / Attention;
- Timeline / Etappen / Tage;
- Item- und Gap-Details;
- Workspace-interne progressive Disclosure;
- Workspace-UX und Workspace-spezifische Tests/Audits;
- Integration vorhandener provider-neutraler Truth-/Readiness-/Safety-/Seasonal-Signale in die Reiseoberfläche;
- spätere Workspace-Polish-/Closure-Slices gemäß kanonischem Workspace-Plan.

Darf **nicht** eigenmächtig übernehmen:

- Account Platform;
- Traveller Registry als Account-System;
- Provider-Aktivierung;
- Admin Control Center;
- öffentliche Growth-/SEO-/Landingpage-Systeme;
- Guardian-/What-if-Simulator außerhalb des später ausdrücklich zugeteilten Integrationsblocks;
- neue Shared Auth/RLS/Identity/Traveller/Route-/Billing-Verträge ohne Technical-Lead-Entscheidung.

### 3.2 `Account plattform audit vorbereitung`

**Rolle:** persönliches Konto, Traveller Registry und Account-nahe Produktfunktionen.

Verantwortet insbesondere:

- Account Home;
- Account Lifecycle innerhalb des freigegebenen AP-Plans;
- Account Security-/Privacy-UX;
- Traveller Registry auf dem bestehenden Foundation-E-Modell;
- Dokument-Lifecycle/UX im Account-/Traveller-Scope;
- Reiseprofil;
- Favoriten;
- Booking Overview;
- Account Notifications;
- Subscription-/Entitlement-Grundlage, soweit im AP-Plan vorgesehen.

Harte Traveller-Regel:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Der Agent darf **niemals** einen impliziten Standard-Pass oder eine Standard-Staatsbürgerschaft einführen.

Darf **nicht** eigenmächtig übernehmen:

- Trip Workspace IA;
- Provider-Truth;
- Admin Growth Control Plane;
- öffentliche SEO-/Discoverability-/Landingpage-Verantwortung;
- Shared Auth/RLS/Identity-/Traveller-Vertragsänderungen ohne Technical-Lead-Steuerung.

### 3.3 `Jetnity provider readiness audit`

**Rolle:** provider-neutrale Provider Readiness, Adapter, Provenance, Kosten-/Health-Grenzen und spätere kontrollierte Provider-Anbindung.

Verantwortet insbesondere:

- Provider Readiness S4–S8 gemäß kanonischem Provider-Plan;
- einheitliche provider-neutrale Contracts;
- Truth-Domain-Ops-Parität;
- Commercial Provenance;
- Cost Guard;
- Observability und ehrliche Provider-Health;
- Cache-/Lizenz-Hooks;
- spätere reale Providerintegration **nur nach besonderen Product-Owner-Gates**.

Darf **nicht** eigenmächtig:

- Production-Secrets aktivieren;
- kostenpflichtige Provider-Calls starten;
- Verträge abschließen;
- Provider als `healthy` vortäuschen;
- Preise/Verfügbarkeit ohne Evidence exponieren;
- Product-UI oder Account-Contracts still ummodellieren.

### 3.4 `Admin platform audit`

**Rolle:** internes Jetnity Control Center.

Verantwortet insbesondere:

- Admin D–K gemäß Admin-Plan;
- Security-/Support-/Finance-/Operations-Bereiche;
- Billing-/Refund-Integrität vor Finance-/Payment-Live;
- Bexio-/Payment-/Ads-/Connector-Fähigkeiten nur in vorgesehenen Gates;
- vollständiges Marketing-&-Growth-Control-Center gemäß `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`;
- Growth Executive Overview;
- Funnel/Kohorten/Attribution;
- Paid-Media-Control-Plane;
- CRM/Journeys/Deliverability;
- Approved Claims Registry;
- Landingpage-/Campaign-Control;
- SEO/Discoverability Operations;
- Referral/Creator/Partner Control;
- Reviews/PR/Subscription Growth;
- Economics/Forecasting;
- Tracking/Data Quality;
- Consent/Connector/Incident Center;
- Jetnity Copilot Pro als evidence-aware Analyst.

Darf **nicht** eigenmächtig:

- öffentliche Homepage-/SEO-Flächen als primärer Implementierungsagent übernehmen;
- sensible Pass-/MRZ-/Identity-Daten für Marketingtargeting verwenden;
- Budgets, Production Ads, Provider, Zahlungen oder externe Writes ohne Capability-/PO-Gates produktiv aktivieren.

### 3.5 `Jetnity growth discoverability`

**Status:** verbindlich reservierter fünfter Cursor-Agent. Noch nicht starten, bis die Aktivierungsbedingungen erfüllt sind.

**Rolle:** öffentliche Jetnity-Oberflächen für Acquisition, Brand, Search-/Answer-Engine-Discoverability und organisches Wachstum.

Dieser Agent ist ausdrücklich **nicht** das interne Marketing-Control-Center. Das interne Control Center bleibt bei `Admin platform audit`.

Verantwortet später insbesondere:

#### Öffentliche Website / Brand Surface

- finale Homepage innerhalb der kanonischen Produktpositionierung;
- öffentliche Feature-/Use-Case-Seiten;
- truth-ready Landingpages;
- konsistente öffentliche Jetnity-Entity;
- klare Positionierung ohne Feature-Wand;
- konsistente öffentliche Aussagen zwischen Website, App Stores und offiziellen Profilen.

#### Technisches SEO

- Crawlability und Indexability;
- Canonicals;
- Sitemaps;
- kontrolliertes `robots.txt`;
- saubere Statuscodes und Redirects;
- semantisches HTML;
- interne Verlinkung;
- Core Web Vitals / öffentliche Performance;
- öffentliche Accessibility;
- mehrsprachige URL-/Locale-/`hreflang`-Architektur.

#### AI-/Search-/Answer-Engine-Discoverability

- Umsetzung des öffentlichen Teils von `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`;
- strukturierte Daten / Schema.org / JSON-LD;
- eindeutige Jetnity-Entity und maschinenlesbare Produktbeschreibung;
- zitierfähige öffentliche Feature- und Informationsseiten;
- Evidence-/Freshness-Darstellung bei zeitkritischen öffentlichen Aussagen;
- sachliche, belegte Vergleichsseiten;
- technische Citation-/Authority-Readiness;
- keine Manipulations-, Fake-Review-, Linkfarm- oder Keyword-Spam-Strategien.

#### Content-/Programmatic-SEO-Surfaces

- hochwertige öffentliche Reiseinhalte mit echtem Nutzwert;
- Destination-/Season-/Route-/Entry-/Use-Case-Flächen nur auf belegbarer Wahrheit;
- Programmatic SEO nur mit ausreichender Informationsdichte;
- keine dünnen Massen-Seiten;
- keine erfundenen Preise, Visa-Regeln, Safety-Aussagen oder Provider-Truth.

#### Acquisition-Oberflächen

- öffentliche Landingpage-Komponenten;
- Web→App-/Deep-Link-Einstiege;
- Referral-/Invite-Einstiegspunkte, wenn Product-Contracts vorhanden sind;
- Creator-/Campaign-entry surfaces;
- Conversion-UX ohne Dark Patterns;
- truth-aware Experiment-Flächen innerhalb freigegebener Contracts.

#### App-Store-/ASO-Vorbereitung

- konsistente App-Store-Positionierung;
- Keyword-/Metadata-Struktur;
- Deep-Link-/Web→App-Kohärenz;
- Screenshot-/Feature-Claim-Vorbereitung auf realer Produktfähigkeit;
- keine erfundenen Ratings, Nutzerzahlen oder Awards.

#### Messbarkeit

Der Agent verwendet die kanonischen Attribution-/Event-/Consent-Verträge und erfindet **keine zweite Analytics- oder Attribution-Wahrheit**.

### Abgrenzung `Jetnity growth discoverability` vs. `Admin platform audit`

`Jetnity growth discoverability` baut **öffentliche Acquisition-/Discovery-Oberflächen**.

`Admin platform audit` baut **das interne Kontrollzentrum**, das Marketing, Attribution, SEO, CRM, Paid Media, Experimente, Creators, Reviews, Economics und Incidents überwacht und steuert.

Beide verwenden dieselben Claims-/Attribution-/Consent-/Event-Verträge. Keine doppelte Wahrheit.

### 3.6 `Jetnity quality security audit`

**Status:** verbindlich reservierter sechster Cursor-Agent. Bei Erstellung exakt so benennen.

**Rolle:** unabhängige Qualität, Security, Resilience und Release Readiness für das gesamte Jetnity-System.

Dieser Agent ist **kein sechster Feature-Entwickler**. Seine Hauptaufgabe ist, Jetnity systematisch zu prüfen, Fehler zu finden, Integrationsrisiken aufzudecken und Releases fachlich/technisch adversarial zu testen.

#### Qualität / Regression / E2E

Verantwortet insbesondere:

- vollständige E2E- und Regressionstests über mehrere Domains;
- Cross-Domain-Szenarien zwischen Workspace, Account, Traveller, Readiness, Route, Provider, Admin und Commercial;
- Tests für Guest/Account-Parität;
- Multi-Traveller-/Multi-Citizenship-/Multi-Document-Regressionen;
- negative Testfälle, Boundary Cases und Recovery-Flows;
- Browser-/Viewport-/Geräteparität;
- später native iOS-/Android-Qualitätsprüfungen, sobald die Native-Phase existiert;
- Fehlerzustände bei Offline, schlechtem Netzwerk, Timeouts und partiellen Provider-Ausfällen.

#### Security

Prüft adversarial insbesondere:

- Auth-/Session-Grenzen;
- MFA/AAL-Verhalten;
- RLS und Ownership;
- IDOR/BOLA-artige Zugriffsfehler;
- Guest→Account-Grenzen;
- Admin-Capabilities und Privilege Escalation;
- Datenlecks zwischen Accounts/Trips/Travellern;
- Secret Exposure;
- unsichere Logs/Telemetry;
- Input-/Output-Grenzen;
- sensible Identity-/Document-Daten;
- Provider-/Webhook-/External-Connector-Grenzen, sobald vorhanden.

Der Agent darf Security-Tests durchführen, aber **keine Production-Sicherheitsgrenze eigenmächtig verändern**, wenn dies einen Shared Contract oder besonderes PO-Gate berührt.

#### Privacy / Consent

Prüft insbesondere:

- Consent-Flows;
- Zweckbindung;
- Marketing-vs.-Identity-Datentrennung;
- Export/Delete-/Privacy-Flows;
- Logging/Analytics auf unnötige personenbezogene Daten;
- ob sensible Pass-/MRZ-/Dokumentdaten unzulässig in Marketing, Analytics oder öffentliche Flächen geraten.

#### Performance / Accessibility / UX-Robustheit

Prüft insbesondere:

- Core Web Vitals;
- langsame Render-/API-Pfade;
- Bundle-/Asset-Regressions;
- große Datenmengen;
- Accessibility;
- Tastatur-/Screenreader-Grundpfade;
- 280px-/Small-Viewport-Robustheit;
- Loading-/Error-/Empty-/Unknown-/Unavailable-State-Konsistenz.

#### Reliability / Operations

Prüft insbesondere:

- Monitoring-/Alert-Blindspots;
- Provider-Timeout-/Fallback-Verhalten;
- Rate-/Cost-Guard-Fehler;
- Retry-/Idempotency-Risiken;
- Backup-/Restore-Prozesse;
- Disaster Recovery;
- Rollback-Verfahren;
- Release-/Deployment-Sicherheit;
- Cache-/Stale-/Freshness-Probleme;
- Incident-Readiness.

#### Release Readiness

Vor größeren Releases oder Production-Aktivierungen erstellt `Jetnity quality security audit` einen unabhängigen **Go/No-Go Quality Report** mit mindestens:

- geprüfter Exact Head / Release Candidate;
- Testabdeckung und relevante Gates;
- offene P0/P1/P2-Risiken;
- Security-/Privacy-Befunde;
- Performance-/Accessibility-Befunde;
- Recovery-/Rollback-/Monitoring-Status;
- Known Limitations;
- klare Empfehlung `GO`, `GO WITH ACCEPTED RISKS` oder `NO-GO`.

`GO` ersetzt **keine** Product-Owner-Freigabe für besondere Production-/Provider-/Payment-/Sensitive-Data-Gates.

#### Defect Ownership

Wenn `Jetnity quality security audit` einen Fehler findet:

1. Defekt reproduzierbar dokumentieren;
2. Schweregrad und betroffene Contracts nennen;
3. zuständigen Fachagenten bestimmen;
4. Fachagent behebt den Defekt normalerweise im eigenen Workstream;
5. `Jetnity quality security audit` verifiziert den Fix unabhängig erneut.

Der Quality-Agent darf **selbst** ändern:

- isolierte Test-/Audit-Harnesses;
- Testfixtures;
- kontrollierte CI-/Audit-Verbesserungen;
- klar abgegrenztes Hardening ohne Produkt-/Shared-Contract-Änderung.

Er darf **nicht** zum allgemeinen Feature-Agenten werden oder breite Fachlogik still umschreiben.

### Abgrenzung zum Technical Lead

`Jetnity quality security audit` ist ein unabhängiger Prüf-Workstream, **ersetzt aber nicht ChatGPT / Technical Lead**.

Der Technical Lead:

- entscheidet Architektur;
- entscheidet Workstream-Ownership;
- führt den finalen unabhängigen PR-Review;
- integriert Ergebnisse aller Agents;
- entscheidet Ready/Merge im Autonomie-Rahmen.

Der Quality-Agent liefert zusätzliche adversariale Evidence, Cross-Domain-Tests und Release-Sicherheitsbewertung.

## 4. Shared Contracts bleiben Technical-Lead-kontrolliert

Folgende Themen dürfen nie von einem einzelnen Workstream still umgebaut werden:

- Auth;
- Identity;
- Sessions;
- MFA / AAL;
- RLS;
- Ownership;
- Guest→Account;
- Traveller-Kernmodell;
- Multi-Citizenship-/Document-Verträge;
- Route-/Transit-Verträge;
- Privacy-/Consent-Kernverträge;
- Billing-/Payment-Kernverträge;
- Admin Audit / Capabilities;
- Provider Activation;
- zentrale Attribution-/Revenue-Truth;
- öffentliche Claims-Truth;
- Guardian-/Simulator-/Value-Impact-Verträge;
- Release-/Production-Gates, wenn sie mehrere Domains betreffen.

Wenn ein Agent eine Shared-Contract-Änderung für nötig hält:

1. Problem und gewünschte Änderung explizit dokumentieren.
2. Nicht still implementieren.
3. Technical Lead entscheidet Architektur und Owner.
4. Shared Änderung erhält eigenen kontrollierten Task/PR oder explizite Scope-Erweiterung.
5. Abhängige Agents synchronisieren erst nach bestätigtem Contract.

## 5. Verbindliche Aktivierungsreihenfolge und Parallelisierung

### Aktuell

Stand 26. August 2026, nach Integration von TW6-A, S5-A, P1-TA-02, P1-QS2-02 und Admin-AAL2-Application-Guard: **kein spezialisierter Cursor-Agent hat einen offenen Runtime-Auftrag.** Alle sechs Workstreams sind STOPP, bis ChatGPT / Technical Lead einen neuen versionierten Auftrag gibt. `Jetnity native app architecture` bleibt reserviert.

Der zentrale Trip-Workspace-Integrationspfad hat weiter Priorität in der Build Order, ist aber kein Freibrief, TW6-REST-01, TW-7 oder TW-8 still zu starten.

`Trip workspace audit architecture` bleibt der fachliche Owner für verbleibende Workspace-Slices, ist aber derzeit nicht aktiv.

### Stabile Parallelisierungs-Schwelle

Die bevorzugte Schwelle für breitere Runtime-Parallelisierung ist:

1. TW-4 vollständig integriert und auf `main` verifiziert;
2. TW-3 vollständig integriert und auf `main` verifiziert;
3. kurzer Technical-Lead-Integrations-Checkpoint;
4. keine offenen Shared-Contract-Blocker zwischen Workspace und wartenden Workstreams.

### Nach diesem Checkpoint

Bevorzugtes Modell:

- `Trip workspace audit architecture` arbeitet weiter an verbleibenden Workspace-Slices;
- `Jetnity provider readiness audit` darf mit einem konfliktarmen Provider-Readiness-Slice weiterlaufen;
- `Admin platform audit` darf mit einem klar abgegrenzten Admin-Slice weiterlaufen;
- `Account plattform audit vorbereitung` wird besonders mit Beginn des Traveller-/Pass-/Account-Blocks aktiviert;
- `Jetnity growth discoverability` wird erst bei stabilem Public-/Workspace-Truth-Kontext aktiviert;
- `Jetnity quality security audit` kann ab diesem stabilen Mehr-Agenten-Checkpoint als unabhängiger QA-/Security-Workstream hinzukommen.

### Aktivierungsbedingungen für `Jetnity growth discoverability`

Der fünfte Agent darf gestartet werden, wenn:

- TW-4 und TW-3 integriert sind;
- zentraler Workspace-Kern stabil genug für belastbare öffentliche Claims ist;
- Product Positioning, Discoverability und Marketing/Growth Standards bindend sind;
- Claims nur reale oder explizit als geplant gekennzeichnete Fähigkeiten darstellen;
- Attribution-/Event-/Consent-Grundverträge kontrolliert vorhanden oder als G0/D0-Slice definiert sind;
- kein anderer Agent dieselben Homepage-/Public-Surface-Dateien unkoordiniert bearbeitet.

Docs-only Audit/Target Architecture/D0/G0-Vorbereitung darf der Technical Lead an einem stabilen Checkpoint früher zulassen.

### Aktivierungsbedingungen für `Jetnity quality security audit`

Der sechste Agent darf gestartet werden, sobald mindestens eines der folgenden Szenarien sinnvoll ist:

- mehrere Runtime-Agents arbeiten parallel und Cross-Domain-Regressionen werden relevant;
- der Workspace-Kern ist stabil genug für systematische E2E-/Security-Tests;
- ein größerer Integrationscheckpoint steht an;
- Provider-/Commercial-/Admin-/Account-Systeme beginnen stärker miteinander zu interagieren;
- eine größere Production-/Launch-Readiness-Phase nähert sich.

Der Quality-Agent darf auch früher für einen **klar abgegrenzten Audit** eingesetzt werden, wenn dadurch ein hohes Risiko sinnvoll unabhängig geprüft werden kann. Er soll aber nicht dauerhaft jeden kleinen Slice blockieren.

## 6. Praktisches Führungsmodell für sechs Agents

### 6.1 Jeder Agent erhält immer

- exakten Anzeigenamen;
- eigenen Branch;
- eigenen Draft-PR;
- versionierten Task;
- expliziten Scope;
- expliziten Non-Scope;
- relevante Shared-Contract-Grenzen;
- verpflichtende Tests/Gates;
- STOPP-Punkt für unabhängigen Technical-Lead-Review.

### 6.2 Kein Agent setzt Ready oder merged

Coding Agents stoppen nach Self-Review und Evidence. Sie setzen niemals Ready und mergen niemals.

Ready/Merge führt ausschließlich ChatGPT / Technical Lead aus, gemäß `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`.

### 6.3 Wenn `main` während eines Slices weiterläuft

Vor Merge zwingend:

1. mit aktuellem `main` synchronisieren;
2. Konflikte fachlich prüfen, nicht blind lösen;
3. neue Exact Head bestimmen;
4. relevante Gates auf diesem Head erneut ausführen;
5. CI/Vercel erneut prüfen;
6. unabhängigen Technical-Lead-Re-Review durchführen.

### 6.4 Cross-Agent-Defects

Wenn Agent A einen Defekt im Bereich von Agent B entdeckt:

- nicht still großflächig reparieren;
- reproduzierbaren Befund dokumentieren;
- Technical Lead ordnet Ownership zu;
- Fix möglichst im zuständigen Workstream;
- unabhängige Re-Verifikation.

### 6.5 Prioritätsregel

P0/P1 Security-, Data-Truth-, Privacy-, Billing-/Money-, Ownership- oder Production-Risiken schlagen Feature-Tempo.

## 7. Rolle des sechsten Agents im Entwicklungszyklus

`Jetnity quality security audit` arbeitet bevorzugt in drei Modi:

### Modus A – Integrations-Audit

Nach mehreren relevanten Merges:

- Cross-Domain-E2E;
- Regression;
- Security/Privacy;
- Performance/Accessibility;
- offene Integrationsrisiken.

### Modus B – gezieltes Risiko-Audit

Bei besonders riskanten Bereichen:

- Auth/RLS/Ownership;
- Traveller/Pass;
- Payment/Billing/Refund;
- Provider-/Commercial-Truth;
- Admin-Capabilities;
- sensitive data;
- Production migrations.

### Modus C – Release Readiness

Vor größeren Production-Aktivierungen:

- vollständiger Release Candidate Audit;
- Backup/Restore/DR;
- Monitoring/Alerts;
- Rollback;
- E2E;
- Security/Privacy;
- Performance/Accessibility;
- Go/No-Go Report.

## 8. Aktuelle sechs Agenten auf einen Blick

| Agent | Verantwortungsbereich | Typische Phase |
| --- | --- | --- |
| `Trip workspace audit architecture` | Trip Workspace / Reiseoberfläche | aktuell primär |
| `Account plattform audit vorbereitung` | Account / Traveller Registry / Profil | Traveller-/Account-Block |
| `Jetnity provider readiness audit` | Provider Readiness / Adapter / Provenance / Cost Guard | nach stabilem Workspace-Checkpoint parallelisierbar |
| `Admin platform audit` | internes Control Center inkl. Marketing/Growth Control | nach stabilem Workspace-Checkpoint parallelisierbar |
| `Jetnity growth discoverability` | öffentliche Website / SEO / AI-Discoverability / Acquisition | später bei stabiler Public Truth |
| `Jetnity quality security audit` | unabhängige QA / Security / Resilience / Release Readiness | ab stabiler Mehr-Agenten-Integration und besonders vor Releases |

## 9. Besondere Product-Owner-Gates bleiben unverändert

Kein Agent und auch der Technical Lead im normalen Autonomie-Flow darf ohne ausdrückliche Product-Owner-Freigabe insbesondere:

- Production DB migrations;
- destructive/hard-to-reverse Production data changes;
- große Production RLS/Ownership/Identity-Risiken;
- neue Providerverträge;
- neue Production API keys/secrets;
- paid provider calls;
- recurring provider/infrastructure cost über USD 100/Monat;
- Production payment activation / real money movement;
- große Produkt-/Business-Model-/Monetization-Abweichungen;
- neue Speicherung besonders sensitiver Pass-/MRZ-/Biometrie-Daten;
- fundamentale Auth/MFA/AAL/Session-Änderungen mit großem Nutzerimpact;
- neue externe Weitergabe sensitiver personenbezogener Daten;
- Public Launch / große Production-Aktivierung;
- reale Provideraktivierung.

## 10. Definition guter Multi-Agent-Führung

Das sechs-Agenten-Modell gilt nur dann als erfolgreich, wenn:

- jeder Agent einen klaren fachlichen Eigentumsbereich hat;
- keine zwei Agents dieselbe Truth-Schicht erzeugen;
- Shared Contracts zentral kontrolliert bleiben;
- Agents nicht auf Kosten von Review-Qualität parallelisiert werden;
- alle Runtime-PRs Exact-Head-Evidence haben;
- unabhängige Reviews echte Defekte finden dürfen;
- Quality/Security nicht erst kurz vor Launch beginnt;
- der Quality-Agent unabhängig bleibt;
- der Product Owner nur für echte Sonder-Gates unterbrochen wird;
- neue Chats den Zustand der sechs Agents sofort nachvollziehen und korrekt weiterführen können.

## 11. Siebter Agent

Ein siebter Agent ist **nicht automatisch vorgesehen**. Er kommt nur in Frage, wenn später ein neuer großer, klar abgrenzbarer Workstream entsteht, der die bestehenden sechs nicht sinnvoll überlappt. Ein möglicher späterer Kandidat wäre eine echte Native-iOS-/Android-Spezialisierung, aber dies ist **keine aktuelle Entscheidung** und benötigt eine neue ausdrückliche Product-Owner-Festlegung.

Bis dahin gilt verbindlich: **sechs spezialisierte Cursor-Agent-Workstreams + ChatGPT / Technical Lead als übergreifende Führung.**
