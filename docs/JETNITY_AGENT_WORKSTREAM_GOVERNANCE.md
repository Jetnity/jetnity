# Jetnity – verbindliches Agent-/Workstream-Modell

Stand: 25. August 2026  
Status: **Product-Owner-verbindlich; für neue Chats, Technical Leads und Coding Agents verpflichtend**

## 1. Zweck

Jetnity soll parallel entwickelt werden können, ohne dass mehrere Coding Agents dieselben fachlichen Verträge, dieselbe Produktwahrheit oder dieselben zentralen Dateien unkontrolliert verändern.

Dieses Dokument definiert deshalb verbindlich:

- welche fünf Cursor-Agent-Workstreams Jetnity verwenden soll;
- welche Verantwortung jeder Workstream hat;
- welche Bereiche ausdrücklich nicht zu seinem Scope gehören;
- wann paralleles Arbeiten erlaubt ist;
- wann ein Agent warten muss;
- wie Shared Contracts und Querschnittsthemen kontrolliert werden;
- wie neue Chats die aktive Agentenlandschaft übernehmen;
- wann ein sechster Agent überhaupt in Betracht kommt.

Mehr Parallelität ist **kein Selbstzweck**. Geschwindigkeit darf Architektur, Wahrheit, Sicherheit, Merge-Qualität und Wartbarkeit nicht verschlechtern.

## 2. Übergeordnete Steuerung

ChatGPT / Technical Lead bleibt die übergreifende Instanz für:

- Produkt-/Systemarchitektur;
- Workstream-Reihenfolge und konfliktarme Parallelisierung;
- Shared Contracts;
- unabhängige Reviews;
- Exact-Head-Gates;
- Ready-/Merge-Entscheidungen im Rahmen der genehmigten Autonomie;
- Querschnittsthemen zwischen mehreren Agents;
- technische Eskalationen und Grenzfälle;
- Wahrheits-, Security-, Privacy- und Integrationskontrolle.

Kein Cursor-Agent darf sich selbst zum Eigentümer eines Shared Contracts erklären oder still die Zuständigkeit eines anderen Workstreams übernehmen.

## 3. Verbindliche fünf Cursor-Agent-Workstreams

Die ersten vier bestehenden Cursor-Agent-Anzeigenamen bleiben **exakt** erhalten. Der fünfte Agent ist verbindlich als eigener zukünftiger Workstream reserviert und muss bei seiner Erstellung exakt so benannt werden.

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
- Integration bereits vorhandener provider-neutraler Truth-/Readiness-/Safety-/Seasonal-Signale in die Reiseoberfläche;
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
- Traveller Registry auf dem bereits vorhandenen Foundation-E-Modell;
- Dokument-Lifecycle/UX, soweit im Account-/Traveller-Scope;
- Reiseprofil;
- Favoriten;
- Booking Overview;
- Account Notifications;
- Subscription-/Entitlement-Grundlage, soweit im AP-Plan vorgesehen.

Harte Regel für Traveller:

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
- spätere reale Providerintegration **nur nach den besonderen Product-Owner-Gates**.

Darf **nicht** eigenmächtig:

- neue Production-Secrets aktivieren;
- kostenpflichtige Provider-Calls starten;
- Verträge abschließen;
- Provider als `healthy` vortäuschen;
- echte Preise/Verfügbarkeit ohne Evidence exponieren;
- Product-UI oder Account-Contracts still ummodellieren.

### 3.4 `Admin platform audit`

**Rolle:** internes Jetnity Control Center.

Verantwortet insbesondere:

- Admin D–K gemäß Admin-Plan;
- Security-/Support-/Finance-/Operations-Bereiche;
- Billing-/Refund-Integrität vor Finance-/Payment-Live;
- Bexio-/Payment-/Ads-/Connector-Fähigkeiten nur in den vorgesehenen Gates;
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

**Status:** verbindlich reservierter fünfter Cursor-Agent. **Noch nicht starten, bis die Aktivierungsbedingungen in Abschnitt 5 erfüllt sind.**

**Rolle:** öffentliche Jetnity-Oberflächen für Acquisition, Brand, Search-/Answer-Engine-Discoverability und organisches Wachstum.

Dieser Agent ist ausdrücklich **nicht** das interne Marketing-Control-Center. Das interne Control Center bleibt bei `Admin platform audit`.

Der Agent `Jetnity growth discoverability` verantwortet später insbesondere:

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

- hochwertige öffentliche Reiseinhalte, die echte Nutzerfragen beantworten;
- strukturierte Destination-/Season-/Route-/Entry-/Use-Case-Flächen nur auf belegbarer Wahrheit;
- Programmatic SEO nur mit echtem Mehrwert und ausreichender Informationsdichte;
- keine dünnen Massen-Seiten;
- keine erfundenen Preise, Visa-Regeln, Safety-Aussagen oder Provider-Truth.

#### Acquisition-Oberflächen

- öffentliche Landingpage-Komponenten;
- Web→App-/Deep-Link-Einstiege;
- Referral-/Invite-Einstiegspunkte auf der öffentlichen Seite, wenn die Product-Contracts vorhanden sind;
- Creator-/Campaign-entry surfaces;
- Conversion-UX ohne Dark Patterns;
- truth-aware Experiment-Flächen innerhalb der freigegebenen Contracts.

#### App-Store-/ASO-Vorbereitung

- konsistente App-Store-Positionierung;
- Keyword-/Metadata-Struktur;
- Deep-Link-/Web→App-Kohärenz;
- Screenshot-/Feature-Claim-Vorbereitung auf realer Produktfähigkeit;
- keine erfundenen Ratings, Nutzerzahlen oder Awards.

#### Messbarkeit

Der Agent baut öffentliche Flächen so, dass die bereits kanonisch definierten Attribution-/Event-/Consent-Verträge korrekt verwendet werden können. Er **erfindet keine zweite Analytics- oder Attribution-Wahrheit**.

### Abgrenzung zu `Admin platform audit`

`Jetnity growth discoverability` baut **die öffentliche Seite und ihre Acquisition-/Discovery-Oberflächen**.

`Admin platform audit` baut **das interne Kontrollzentrum**, das Marketing, Attribution, SEO, CRM, Paid Media, Experimente, Creators, Reviews, Economics und Incidents überwacht und steuert.

Beide müssen dieselben kanonischen Claims-/Attribution-/Consent-/Event-Verträge verwenden. Keine doppelte Wahrheit.

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
- Guardian-/Simulator-/Value-Impact-Verträge, wenn sie mehrere Domains verbinden.

Wenn ein Agent für seinen Slice eine Änderung an einem solchen Contract für nötig hält:

1. Problem und gewünschte Änderung explizit dokumentieren.
2. Nicht still implementieren.
3. Technical Lead entscheidet Architektur und Owner.
4. Shared Änderung erhält eigenen kontrollierten Task/PR oder explizite Scope-Erweiterung.
5. Abhängige Agents synchronisieren erst nach bestätigtem Contract.

## 5. Verbindliche Aktivierungsreihenfolge für Parallelisierung

### Aktuell

Der zentrale Trip-Workspace-Integrationspfad hat Priorität.

`Trip workspace audit architecture` bleibt primärer aktiver Cursor-Agent, bis der stabile Workspace-Checkpoint erreicht ist.

### Stabile Parallelisierungs-Schwelle

Die bevorzugte Schwelle für breitere Parallelisierung ist:

1. TW-4 vollständig integriert und auf `main` verifiziert;
2. TW-3 vollständig integriert und auf `main` verifiziert;
3. kurzer Technical-Lead-Integrations-Checkpoint;
4. keine offenen Shared-Contract-Blocker zwischen Workspace und den wartenden Workstreams.

Erst danach sollen zusätzliche große Runtime-Workstreams wieder parallel anlaufen.

### Nach diesem Checkpoint

Bevorzugtes Modell:

- `Trip workspace audit architecture` arbeitet weiter an den verbleibenden Workspace-Slices;
- `Jetnity provider readiness audit` darf mit einem konfliktarmen Provider-Readiness-Slice weiterlaufen;
- `Admin platform audit` darf mit einem klar abgegrenzten Admin-Slice weiterlaufen;
- `Account plattform audit vorbereitung` wird gemäß großer Build-Reihenfolge besonders dann aktiviert, wenn der Traveller-/Pass-/Account-Block beginnt; Account-/Traveller-Shared-Contracts bleiben TL-gesteuert;
- `Jetnity growth discoverability` wird erst aktiviert, wenn der öffentliche/Homepage-/Discoverability-Block fachlich sinnvoll geöffnet werden kann und die unten genannten Voraussetzungen erfüllt sind.

### Aktivierungsbedingungen für `Jetnity growth discoverability`

Der fünfte Agent darf gestartet werden, wenn mindestens folgende Bedingungen erfüllt bzw. bewusst vom Technical Lead als konfliktarm bewertet sind:

- TW-4 und TW-3 sind integriert;
- zentraler Workspace-Kern ist stabil genug, dass öffentliche Produktversprechen nicht auf beweglicher Kernlogik beruhen;
- Product Positioning Standard ist unverändert bindend;
- AI/Search Discoverability Standard ist bindend;
- Marketing & Growth Standard ist bindend;
- öffentliche Claims dürfen nur auf bereits realer oder ausdrücklich als „geplant“ gekennzeichneter Produktfähigkeit beruhen;
- Attribution-/Event-/Consent-Grundverträge sind entweder bereits vorhanden oder werden als klar kontrollierter G0-/D0-Foundation-Slice definiert;
- es gibt keinen gleichzeitig laufenden Agenten, der dieselben Homepage-/Public-Surface-Dateien ohne abgestimmte Ownership bearbeitet.

Der Technical Lead darf den fünften Agenten bei einem stabilen Checkpoint etwas früher für **docs-only Audit, Target Architecture oder konfliktarme D0/G0-Vorbereitung** einsetzen. Public Runtime, Claims und Campaign-Aktivierung bleiben trotzdem an ihre Truth-/Launch-Gates gebunden.

## 6. Parallelisierungsregeln

### Erlaubt

Mehrere Agents dürfen gleichzeitig arbeiten, wenn:

- ihre Dateiflächen und Contracts überwiegend getrennt sind;
- jeder einen eigenen Branch und Draft-PR besitzt;
- Scope und Non-Scope versioniert sind;
- Shared Contracts nicht still geändert werden;
- alle Agents vor Merge gegen aktuelles `main` synchronisieren;
- jeder Runtime-PR seine eigenen Exact-Head-Gates und unabhängigen TL-Review erhält.

### Nicht erlaubt

Nicht einfach alle Agents gleichzeitig starten, wenn:

- ein zentraler Integrationsblock gerade Shared Contracts bewegt;
- mehrere Agents dieselbe Kernkomponente umbauen würden;
- einer der PRs eine Production-/Provider-/Billing-/Identity-/Security-Grenze öffnet;
- der zusätzliche Workstream nur „mehr Geschwindigkeit“ erzeugt, aber keine saubere Ownership besitzt;
- Rebase-/Merge-/Full-Audit-Kosten den Parallelitätsgewinn übersteigen.

## 7. Merge- und Synchronisationsregel

Jeder aktive Branch muss vor Ready/Merge gegen das **aktuelle** `main` geprüft werden.

Wenn `main` während eines Slices weiterläuft:

- Branch kontrolliert synchronisieren;
- Konflikte fachlich lösen, nicht blind übernehmen;
- alle durch die Synchronisation ungültig gewordenen Exact-Head-Nachweise erneut ausführen;
- unabhängigen Technical-Lead-Review auf dem finalen Head durchführen.

Bei parallelen Agents bestimmt der Technical Lead die Merge-Reihenfolge so, dass Shared-Contract- und Audit-Risiken minimiert werden.

## 8. Pflicht-Handoff jedes Agents

Jeder Agent muss vor seinem STOPP mindestens dokumentieren:

- exakten Anzeigenamen;
- Branch;
- PR;
- Exact Head;
- Base / Merge-Base;
- ahead/behind;
- tatsächlich umgesetzten Scope;
- bewusst nicht umgesetzten Scope;
- geänderte Runtime-/Contract-Dateien;
- Tests/Gates;
- GitHub Actions;
- Vercel;
- DB/RLS/Auth/Provider/Secrets/Kosten/Production-Änderungen;
- offene Risiken;
- bekannte Shared-Contract-Berührungen;
- nächsten erlaubten Schritt;
- klaren STOPP für unabhängigen Technical-Lead-Review.

Grüne Tests ersetzen den unabhängigen Review nicht.

## 9. Pflicht für neue Chats

Ein neuer Chat muss vor Agentensteuerung:

1. `JETNITY_START_HERE.md` lesen;
2. dieses Dokument `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md` lesen;
3. `docs/JETNITY_BINDING_BUILD_ORDER.md` lesen;
4. aktuelle Handoffs/Active Work lesen;
5. GitHub/PR/CI/Vercel live verifizieren;
6. die exakten Agent-Anzeigenamen verwenden;
7. keine wartenden Agents nur aus Geschwindigkeitserwägungen starten.

Wenn ein alter Chat/Handoff einer aktuellen kanonischen Agentenregel widerspricht, gilt die neuere Product-Owner-verbindliche Governance.

## 10. Exakte Anzeigenamen – verbindlich

Bestehend:

- `Trip workspace audit architecture`
- `Account plattform audit vorbereitung`
- `Jetnity provider readiness audit`
- `Admin platform audit`

Reservierter fünfter Agent:

- `Jetnity growth discoverability`

Neue Chats und Technical Leads sollen **immer die exakten Anzeigenamen** verwenden, damit der Product Owner sofort weiß, welcher Cursor-Agent gemeint ist.

## 11. Sechster Agent oder weitere Agents

Ein sechster Agent wird **nicht automatisch** eingeführt.

Er kommt nur in Frage, wenn ein neuer großer Workstream:

- fachlich klar isolierbar ist;
- über längere Zeit genügend eigenständige Arbeit besitzt;
- nicht besser einem der fünf bestehenden Owners zugeordnet werden kann;
- Shared Contracts nicht unnötig fragmentiert;
- realen Parallelitätsgewinn bringt;
- durch den Technical Lead mit eigenem Scope, Non-Scope, Handoff und Merge-Regeln spezifiziert wurde.

Mehr Agents ohne klare Ownership gelten als Architektur-/Integrationsrisiko.

## 12. Qualitätsregel

Alle fünf Workstreams unterliegen unverändert:

- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`;
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`;
- Truth-/Evidence-/Freshness-Regeln;
- Multi-Citizenship-/Multi-Document-Regeln;
- Security/Privacy;
- Accessibility/Performance;
- vollständigen relevanten Tests;
- adversarial Self-Review;
- unabhängigem Technical-Lead-Review.

Ziel ist nicht, fünf Agents möglichst viel Code produzieren zu lassen. Ziel ist, dass fünf spezialisierte Workstreams gemeinsam **ein einziges konsistentes, hervorragend gebautes Jetnity** liefern.