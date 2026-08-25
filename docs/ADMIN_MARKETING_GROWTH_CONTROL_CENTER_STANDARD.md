# Jetnity – Admin Marketing & Growth Control Center Standard

Stand: 25. August 2026  
Status: **Product-Owner-verbindlich; muss beim späteren Admin-/Growth-Ausbau umgesetzt werden**

## 1. Ziel

Das Jetnity Admin Control Center muss Marketing nicht nur anzeigen, sondern **professionell steuerbar, messbar, sicher, nachvollziehbar und wirtschaftlich optimierbar** machen.

Es darf später kein wesentlicher Marketing-/Growth-Prozess außerhalb von Jetnitys Kontrollzentrum liegen, nur weil dafür im Admin kein sauberer Arbeitsbereich vorgesehen wurde. Externe Anbieter wie Google Ads, Meta, TikTok, E-Mail-/Push-Provider, App Stores, Search Console, Analytics- oder Affiliate-Systeme bleiben Provider und Datenquellen; Jetnity benötigt darüber eine eigene, provider-neutrale Steuer- und Wahrheitslage.

Leitprinzip:

> **Ein Marketing-Kontrollzentrum, eine nachvollziehbare Growth-Wahrheit. Externe Plattformen liefern Daten und Aktionen; Jetnity verbindet sie mit echter Produkt-, Revenue-, Cost- und Conversion-Evidence.**

Marketing darf niemals auf Klicks, Impressionen oder Provider-ROAS allein optimiert werden. Maßgeblich sind reale Aktivierung, Retention, Revenue Quality, Contribution Margin, CAC, Payback und langfristiger Nutzerwert.

Kanonische Nachbardokumente:

- `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
- `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- Admin-Implementierungs-/Security-/Billing-Pläne

## 2. Abgrenzung zum bestehenden Admin-Plan

Der bisherige Admin-Plan enthält bereits wichtige Grundlagen wie Security, Support-/System-Sichten, Finance Readiness, Copilot Pro, Analytics/SEO sowie spätere Ads-/Bexio-/Payment-Integrationen. Das reicht für ein vollständiges Growth-Betriebssystem jedoch nicht aus.

Dieser Standard ergänzt verbindlich die fehlende **end-to-end Marketing Operations-, Attribution-, CRM-, Experiment-, Reputation-, Creator-/Referral-, Unit-Economics-, Data-Quality- und Control-Plane-Schicht**.

Er ersetzt keine bestehenden Admin-Slices und darf den aktuellen Trip-Workspace-Baupfad nicht aufblähen. Die Umsetzung erfolgt später in kontrollierten Admin-/Growth-Slices.

## 3. Informationsarchitektur

Marketing darf im Admin nicht als einzelne überladene Dashboard-Seite entstehen. Vorgesehen ist ein eigener Bereich **Growth & Marketing** mit klaren Unterbereichen:

1. Übersicht
2. Funnel & Kohorten
3. Akquisition & Attribution
4. Kampagnen / Paid Media
5. CRM & Lifecycle
6. Content, SEO & AI/Search Discoverability
7. Experimente
8. Referral, Creator & Partner
9. Reviews, Reputation & Brand
10. Subscription Growth
11. Märkte & Internationalisierung
12. Economics & Forecast
13. Tracking-/Datenqualität
14. Privacy & Consent
15. Connectors & Settings
16. Audit & Approvals

Die Admin-Startseite zeigt nur verdichtete Lage, Prioritäten und Risiken. Detailarbeit erfolgt in den jeweiligen Drill-down-Flächen.

## 4. Growth Executive Overview

Die Übersichtsseite muss innerhalb weniger Sekunden beantworten:

- Wächst Jetnity gesund?
- Woher kommt qualifizierter Traffic?
- Wie viele Nutzer werden tatsächlich aktiviert?
- Welche Kanäle erzeugen wiederkehrende Nutzer und Umsatz?
- Welche Kampagnen verbrennen Geld?
- Wo brechen Funnel oder Tracking?
- Gibt es SEO-/CRM-/Review-/Spend-Risiken?
- Welche Maßnahmen haben heute höchste Priorität?

Pflicht-KPIs, soweit fachlich live:

- qualifizierte Visits;
- Activation Rate;
- Trip Creation / Adoption;
- D1/D7/D30 bzw. reisesinnvolle Retention;
- Referral-/Invite-Rate;
- Subscription-/Commercial Conversion;
- Affiliate-/Subscription Revenue;
- CAC;
- LTV bzw. belastbare LTV-Näherung;
- CAC Payback;
- Contribution Margin;
- Churn / Renewal / Refund;
- Organic/Paid/Referral Mix;
- Brand Search;
- aktuelle Marketingkosten;
- laufende Anomalien und Datenlücken.

Jede Kennzahl benötigt Zeitraum, Vergleichsperiode, Datenquelle und Freshness. `unknown` bleibt `unknown`.

## 5. Funnel Explorer

Der Admin benötigt einen frei analysierbaren, aber governance-kontrollierten Funnel Explorer.

Mindestens:

- Reach → Visit → Intent → Activation → Trip Adoption → Return → Referral → Commercial/Subscription Intent → Paid Conversion → Revenue Quality;
- Drop-off je Stufe;
- Zeit bis zur nächsten Stufe;
- Funnel-Vergleich nach Zeitraum;
- Web/App getrennt und kombiniert, soweit belastbar;
- Guest→Account-Übergänge innerhalb zulässiger Consent-/Identity-Grenzen;
- Segmente nach Markt, Sprache, Plattform, Acquisition Source, Campaign, Landingpage und grober Intent-Kategorie;
- kein Marketing-Segment aus Passnummer, MRZ, biometrischen Daten oder hochsensitiven Identitätsmerkmalen.

Funneldefinitionen müssen versioniert sein, damit historische Zahlen nicht still ihre Bedeutung ändern.

## 6. Kohorten & Retention

Jetnity benötigt Growth-Kohorten statt nur aggregierter Monatszahlen.

Pflicht:

- Acquisition-Kohorten;
- Activation-Kohorten;
- Subscription-Kohorten;
- Trial-Kohorten, falls Trial später eingeführt wird;
- Markt-/Locale-Kohorten;
- Kanal-/Campaign-Kohorten;
- reisesinnvolle Lifecycle-Kohorten;
- Revenue-, Churn-, Refund- und Retention-Verläufe;
- Vergleich organisch vs. paid vs. referral/creator.

Der Admin muss erkennen können, ob ein Kanal nur billige Registrierungen bringt oder langfristig hochwertige Nutzer.

## 7. Akquisition & Attribution

Der Admin benötigt eine provider-neutrale Attributionsebene.

Pflichtansichten:

- First Touch;
- Last Non-Direct Touch;
- Conversion Touch;
- Assisted Touches, soweit belastbar;
- Referral-/Creator-/Partner-Attribution;
- Web→App/App→Web-Attribution, soweit technisch belegbar;
- Landingpage/UTM/Campaign/Creative/Keyword-Kontext;
- `unknown`/unattributed als eigener ehrlicher Zustand.

Pflichtkontrollen:

- UTM-Namenskonventionen;
- Campaign-ID-/Creative-ID-Registry;
- Duplicate-/Malformed-UTM-Erkennung;
- Click-ID-Verarbeitung nur mit zulässigem Consent;
- keine Fingerprinting-Umgehung;
- Providerzahlen gegen Jetnity Conversion-/Revenue-Evidence abgleichen.

## 8. Campaign Control Center / Paid Media

Spätere Google-Ads-, Meta-, TikTok- oder andere Integrationen werden unter einer gemeinsamen Campaign Control Plane zusammengeführt.

### 8.1 Lesen und Vergleichen

Je Kampagne/Ad Group/Creative soweit Provider unterstützt:

- Spend;
- Impressions;
- Clicks;
- CTR/CPC/CPM;
- Jetnity Visits;
- Activation;
- Trip Adoption;
- Subscription-/Commercial Conversion;
- Revenue;
- CAC;
- ROAS;
- Payback;
- Contribution Margin;
- Provider Conversion vs. Jetnity Conversion;
- Attribution Confidence / Datenlücken.

### 8.2 Kontrollierte Aktionen

Später mögliche Aktionen:

- Pause/Resume;
- Budget ändern;
- Spend Cap setzen;
- Kampagnen-/Creative-Status steuern;
- zulässige Campaign Drafts vorbereiten;
- Landingpage-Zuordnung ändern;
- Schedule/Market/Locale-Zuordnung verwalten.

Produktive Writes brauchen Capability-Gates, Audit Trail und bei riskanten Änderungen ggf. Vier-Augen-/Product-Owner-Gate.

### 8.3 Budgetschutz

Verbindlich:

- harte Daily-/Monthly-Caps;
- globaler Marketing Spend Cap;
- kanalbezogene Caps;
- Campaign Caps;
- Runaway-Spend Detection;
- Kill Switch;
- Alarm bei ungewöhnlichem Spend ohne Conversion;
- Alarm bei CAC-/Payback-Verschlechterung;
- keine automatische Budgetsteigerung über freigegebene Policy;
- keine Überschreitung der globalen Jetnity-Kosten-/Product-Owner-Gates.

## 9. Creative & Brand Asset Library

Der Admin benötigt eine zentrale Bibliothek für Marketingassets und Claims.

Mindestens:

- Bilder/Videos/Logos;
- Ad-Creatives und Varianten;
- Copy-/Headline-Varianten;
- Kanal/Format/Locale;
- Rechte-/Lizenzstatus;
- Creator-/UGC-Einwilligung;
- Freigabestatus;
- Nutzungszeitraum;
- zugeordnete Kampagnen;
- Performance je Asset;
- Archivierung.

Zusätzlich eine **Approved Claims Registry**:

- Claim;
- Status: Entwurf / belegt / freigegeben / abgelaufen;
- Evidence/Quelle;
- Gültigkeitsdatum/Freshness;
- erlaubte Märkte/Sprachen;
- zugehörige reale Funktion.

Damit soll Jetnity verhindern, dass Ads oder Landingpages alte oder unbelegte Produktversprechen verwenden.

## 10. Landingpage & Campaign Surface Manager

Jetnity braucht später keine externen Wildwuchs-Microsites. Der Admin soll kontrollierte Kampagnenflächen auf Jetnitys eigener Design-/SEO-/Analytics-Basis verwalten können.

Pflicht:

- Template-basierte Landingpages;
- Draft/Preview/Publish/Unpublish;
- Locale/Market;
- Campaign-Zuordnung;
- Conversion-Ziel;
- Approved Claims;
- SEO/Canonical/noindex-Steuerung;
- strukturierte Daten nur wenn fachlich zulässig;
- Performance-/Accessibility-Gates;
- Preview vor Veröffentlichung;
- Versionierung/Rollback;
- Audit Trail.

Öffentliche Launch-/Positionierungsänderungen bleiben den entsprechenden Product-Owner-Gates unterworfen.

## 11. CRM & Lifecycle Orchestration

Der Admin braucht ein professionelles CRM-/Journey-Cockpit für E-Mail, Push und In-App-Kommunikation.

### 11.1 Audience Builder

Zulässige Filter können umfassen:

- Reise-Lifecycle;
- Produktnutzung;
- Markt/Locale;
- Consent-Status;
- Acquisition-/Campaign-Kontext;
- Subscription-Status;
- grobe Interessen/Intent, soweit zulässig und nicht sensitiv.

Verboten für Marketingtargeting:

- Passnummer/MRZ;
- biometrische Daten;
- hochsensitive Identity-Daten;
- geheime Dokumentinformationen;
- unzulässige Gesundheits-/Safety-/private Reisedaten.

### 11.2 Journey Builder

Mindestens:

- Trigger;
- Bedingungen;
- Wartezeiten;
- Channel-Auswahl;
- Frequency Caps;
- Quiet Hours;
- Suppression;
- Stop Conditions;
- Conversion Goal;
- Versionierung;
- Testmodus;
- Rollback/Disable.

### 11.3 Deliverability

Admin-Sicht für:

- Delivered;
- Open/Click, soweit datenschutzkonform und belastbar;
- Bounce;
- Complaint;
- Unsubscribe;
- Suppression;
- Domain Reputation;
- SPF/DKIM/DMARC-Zustand;
- Provider Health;
- Send-Failure-/Queue-Anomalien.

Service-/Safety-/Security-Nachrichten dürfen nicht mit Marketing-Journeys vermischt werden.

## 12. Content, SEO & AI/Search Discoverability Center

Der heutige geplante Analytics/SEO-Bereich wird verbindlich zu einem echten **Discoverability Operations Center** erweitert.

Pflichtmodule:

### 12.1 Content Inventory

- URL;
- Seitentyp;
- Locale/Market;
- Owner;
- Published/Updated/Reviewed At;
- fachliche Source-of-Truth;
- Freshness;
- Indexierungsstatus;
- Traffic;
- Conversion;
- externe Evidence/Quellen, wo relevant;
- Content Decay/Refresh Queue.

### 12.2 Technical SEO

- Sitemap-Status;
- robots/noindex;
- Canonical-Konflikte;
- hreflang-Fehler;
- 3xx/4xx/5xx;
- Duplicate-/Thin-Content-Hinweise;
- structured-data errors;
- Core Web Vitals;
- Performance;
- Accessibility;
- Crawl-/Indexierungsanomalien.

### 12.3 Search Performance

- Queries;
- Impressions;
- Clicks;
- CTR;
- Position;
- Landingpages;
- Brand vs. non-brand;
- Intent Cluster;
- Market/Locale;
- Conversion nach Query/Landingpage, soweit belastbar.

### 12.4 Answer Engine / AI Discoverability

- bekannte Referral-Traffic-Signale aus Answer Engines;
- öffentliche Jetnity-Erwähnungen, soweit legal/technisch zugänglich;
- wiederkehrende falsche öffentliche Beschreibungen;
- Citation-/Entity-Probleme;
- zentrale Fragen-/Intent-Cluster, bei denen Jetnity relevant sein sollte;
- Authority-/Evidence-Lücken;
- kein behauptetes „AI Ranking“, wenn dies nicht objektiv messbar ist.

## 13. Experimentation Platform

Marketing- und Product-Growth-Experimente dürfen nicht in Tabellen oder Chatnotizen verschwinden.

Experiment Registry mit:

- Hypothese;
- Owner;
- Start/Ende;
- Surface;
- Zielgruppe;
- Control/Variant;
- Primary Metric;
- Guardrail Metrics;
- Sample-/Exposure-Definition;
- Status;
- Ergebnis;
- Entscheidung;
- Rollback;
- Lessons Learned.

Verbindliche Guardrails:

- keine Experimente an Safety-/Regulatory-/Payment-Wahrheit;
- keine Dark Patterns;
- keine künstliche Dringlichkeit;
- keine irreführenden Preisexperimente;
- Consent/Privacy gilt auch für Experimente;
- Experimente müssen reproduzierbar und auditierbar sein.

## 14. Referral, Creator & Partner Center

### Referral

- Referral-/Invite-Codes;
- Invites sent/accepted/activated;
- Conversion;
- Revenue;
- Reward Status, falls später eingeführt;
- Anti-Fraud;
- Self-Referral Detection;
- Abuse Queue;
- Kosten/ROI.

### Creator

- Creator-Profil;
- Vertrag/Status;
- Kampagnen;
- Codes/Links;
- Content Assets;
- Usage Rights;
- Performance;
- Affiliate-/Revenue-Share;
- offene Freigaben/Takedowns.

### Partner/Affiliate

- Partnerstatus;
- Tracking-ID;
- Klicks/Conversions;
- Revenue/Commission;
- Reconciliation;
- Vertrag/Freigabe;
- offene Abweichungen.

Keine Auszahlung oder Entitlement ohne deduplizierte, auditable Conversion-Evidence.

## 15. Reviews, Reputation & Brand Center

Der Admin benötigt eine zentrale Reputation-Sicht:

- App-Store-Reviews;
- relevante öffentliche Review-Plattformen;
- Rating-Verlauf;
- Review-Volumen;
- wiederkehrende Themen;
- ungelöste kritische Reviews;
- Antwortstatus;
- Support-Eskalation;
- verifizierte Testimonials;
- Zustimmung/Nutzungsrecht;
- Reputation Alerts.

Jetnity Copilot Pro darf Themen clustern und Antwortentwürfe vorbereiten, aber keine erfundenen Fakten oder unfreigegebenen öffentlichen Antworten veröffentlichen.

## 16. PR, Media & Launch Workspace

Für Launches und echte Meilensteine soll der Admin verwalten können:

- Press Kit;
- Fact Sheet;
- freigegebene Zahlen/Claims;
- Produkt-Screenshots/Demos;
- Medienkontakte/Status, soweit datenschutzrechtlich zulässig;
- Press Releases als Draft/Version;
- Launch Checklist;
- Embargo-/Publish-Datum;
- Creator-/Partner-Koordination;
- Coverage/Links;
- Follow-up Tasks.

Öffentliche Veröffentlichung bleibt ein Launch-/Product-Owner-Gate, wenn dies nach Governance erforderlich ist.

## 17. Subscription Growth Center

Sobald Subscription real ist, benötigt der Admin:

- Free/Monthly/Annual/Lifetime Mix;
- Pricing-page Funnel;
- Paywall-/Upgrade Funnel;
- Trial Start/Activation/Conversion, falls Trial eingeführt wird;
- Renewal;
- Churn;
- Refund;
- Cancellation Reasons;
- Cohort LTV;
- Plan Migration;
- Revenue Retention;
- Entitlement-/Billing-Anomalien.

Retention-Angebote oder Experimente dürfen nicht zu Kündigungsbehinderung oder Dark Patterns werden.

Konkrete Preise, Trial-Dauer und Lifetime-Bedingungen bleiben Product-Owner-Entscheidungen.

## 18. Market Expansion Cockpit

Für spätere internationale Expansion braucht Jetnity je Markt eine Readiness-/Growth-Sicht:

- Traffic/Nachfrage;
- Activation/Retention;
- Revenue/Unit Economics;
- Locale-/Content-Abdeckung;
- SEO/Discoverability;
- App-Store-Abdeckung;
- Providerabdeckung;
- Support Readiness;
- Legal/Privacy Readiness;
- Currency/Payment Readiness;
- CRM/Deliverability;
- Creator/Partner Coverage.

Ein Markt wird nicht nur aufgrund von Traffic als „ready“ markiert.

## 19. Economics & Profitability

Das Marketing-Cockpit muss eng mit Finance-/Provider-Cost-Truth verbunden werden.

Pflicht:

- Spend;
- gross Revenue;
- Refunds;
- Affiliate Commission;
- Payment Fees;
- relevante Provider-/Model-/Infrastructure Variable Costs;
- Contribution Margin;
- CAC;
- LTV;
- Payback;
- Margin je Channel/Campaign/Market/Plan, soweit belastbar;
- Forecast vs. Actual.

Provider-Reported Revenue oder Ad-Platform-ROAS darf nicht automatisch als Jetnity-Finance-Truth gelten.

## 20. Budget Planner & Forecasting

Der Admin soll später Marketingbudgets planen können:

- Monats-/Quartalsbudget;
- Channel Allocation;
- Market Allocation;
- CAC Target;
- Revenue/Activation Targets;
- Szenarien Base/Conservative/Upside;
- Seasonality;
- Forecast vs. Actual;
- Remaining Budget;
- erwarteter Payback;
- Warnung bei Annahmen mit geringer Datenbasis.

Forecasts sind Schätzungen und müssen als solche gekennzeichnet sein.

## 21. Marketing Calendar

Ein gemeinsamer Kalender für:

- Kampagnen;
- Content;
- CRM Sends/Journeys;
- Product Launches;
- App Releases;
- Creator Deliverables;
- PR/Media;
- saisonale Reiseanlässe;
- Experimente;
- Promotions, falls später zulässig.

Kalenderzustände dürfen reale technische Publish-/Campaign-Zustände nicht ersetzen; sie koordinieren sie.

## 22. Tracking & Data Quality Center

Marketing kann nur so gut sein wie seine Daten.

Pflichtkontrollen:

- Event Volume/Latency;
- Event Schema Version;
- Missing Required Properties;
- Duplicate Events;
- Broken Funnels;
- UTM/Click-ID parsing;
- Web/App mismatch;
- Ad Provider vs. Jetnity discrepancy;
- Revenue/Refund reconciliation;
- Bot/Spam Traffic;
- Internal/Test Traffic;
- Consent Drop/Failure;
- Deep Link Failures;
- CRM Delivery Failures;
- Data Freshness;
- Backfill/Reprocessing Status.

Tracking-Ausfall ist ein operativer Incident und braucht Alerting.

## 23. Privacy & Consent Center

Mindestens:

- Consent Rates nach Zweck;
- Consent-Versionen;
- Opt-in/Opt-out;
- Suppression Lists;
- Retention Policies;
- Provider-/Purpose-Mapping;
- Audience Export Registry;
- Data Deletion/Privacy Request Status;
- dokumentierte Drittanbieter-Datenflüsse;
- keine heimlichen Audience-Exporte;
- keine Pass-/MRZ-/biometrischen Daten im Marketingprofil.

Marketing soll datensparsam optimiert werden. Mehr Daten ist nicht automatisch besser.

## 24. Connector Center

Externe Systeme werden zentral sichtbar verwaltet:

- Connector Name;
- Purpose;
- Status;
- Environment;
- Last Sync;
- Freshness;
- Error State;
- Permissions/Scopes;
- Cost/Plan, soweit relevant;
- Data Classes;
- Owner;
- Contract/DPA/Legal Status;
- Kill/Disconnect Control, soweit technisch vorgesehen.

Mögliche spätere Connectoren: Ads-Plattformen, Search/SEO, CRM/Email/Push, App Stores, Review-Plattformen, Affiliate/Partner, Analytics, Bexio/Finance. Keine Aktivierung ohne geltende Provider-/Secret-/Privacy-/Cost-Gates.

## 25. Alerts & Incident Center

Mindestens Alarmklassen:

- Spend Spike;
- Campaign Spend ohne Conversion;
- CAC Spike;
- Conversion Drop;
- Revenue Tracking Break;
- Tracking Event Drop;
- Landingpage Down/Slow;
- SEO Deindexation/Crawl Spike;
- Structured Data Fehler;
- CRM Bounce/Complaint Spike;
- Review/Reputation Spike;
- Affiliate Fraud;
- Referral Abuse;
- Connector Failure;
- Consent/Privacy Misconfiguration;
- Budget Cap erreicht.

Jeder Alarm braucht Severity, Evidence, betroffenen Scope, First Seen/Last Seen, Owner, Status und Audit Trail.

## 26. Jetnity Copilot Pro – Growth Analyst

Copilot Pro wird im Growth Control Center zu einem **Analysten und Entscheidungsvorbereiter**, nicht zu einer unkontrollierten Marketing-Automatik.

Er darf später:

- Anomalien erklären;
- Funnel-Brüche priorisieren;
- Campaign-/Channel-Performance vergleichen;
- CAC/LTV/Payback analysieren;
- SEO-/Content-Chancen priorisieren;
- CRM-/Retention-Chancen identifizieren;
- Review-Themen clustern;
- Experiment-Hypothesen vorschlagen;
- Forecasts und Szenarien erklären;
- Kampagnen-/Creative-Briefs entwerfen;
- konkrete nächste Schritte mit Evidence vorschlagen.

Er darf nicht:

- Zahlen erfinden;
- fehlende Attribution als sichere Attribution darstellen;
- selbstständig neue bezahlte Provider aktivieren;
- ohne erlaubte Policy Budgets erhöhen;
- ungeprüfte öffentliche Claims publizieren;
- sensible Nutzer-/Passdaten als Marketingtargeting verwenden;
- Product-Owner-/Provider-/Cost-/Privacy-/Launch-Gates umgehen.

Jede Copilot-Empfehlung muss verwendete Daten/Freshness und bekannte Unsicherheit nachvollziehbar machen.

## 27. Roles, Capabilities & Vier-Augen-Prinzip

Nicht jeder Admin darf Marketingkosten oder öffentliche Kommunikation verändern.

Spätere Capability-Gruppen können z. B. sein:

- growth.read;
- analytics.read;
- campaign.read;
- campaign.write;
- budget.write;
- crm.read;
- crm.write;
- content.read;
- content.write;
- experiment.write;
- connector.admin;
- privacy.read;
- reputation.respond;
- launch.publish.

Exakte Capability-Namen werden im jeweiligen Shared-Auth/Admin-Slice festgelegt.

Riskante Writes wie hohe Budgetänderungen, neue Connector-Aktivierung, produktiver Massensend, Launch Publish oder große Audience-Exporte benötigen je nach Risiko Bestätigung, Vier-Augen-Regel oder besonderes Product-Owner-Gate.

## 28. Audit Trail

Produktive Marketingänderungen müssen nachvollziehbar sein.

Pflichtfelder soweit passend:

- actor;
- capability;
- action;
- target;
- before/after;
- reason/comment;
- timestamp;
- request/correlation id;
- provider result;
- approval reference;
- environment.

Besonders relevant für Budget, Campaign Status, CRM Publish, Audience Export, Connector, Public Content, Claims, Referral Rewards und Review-/PR-Publishing.

## 29. Mobile/Admin UX

Der Admin ist primär professionelles Desktop-/Tablet-Backoffice, muss aber auf kleineren Geräten sicher lesbar bleiben.

Regeln:

- keine horizontale Tabellenhölle als einzige Bedienform;
- große Tabellen mit Saved Views, Filter, Sortierung, Export und Drill-down;
- klare Zustände `healthy`, `warning`, `critical`, `unknown` nur wenn fachlich belegt;
- wichtige Budget-/Publish-Writes mit eindeutiger Bestätigung;
- Keyboard-Navigation und Accessibility;
- Datum/Währung/Zeitzone sichtbar;
- niemals eine grüne Gesamtlage aus unvollständigen Daten ableiten.

## 30. Exporte & Reporting

Der Admin muss belastbare Reports exportieren können:

- CSV für operative Analyse;
- später ggf. PDF/Board Summary;
- Zeitraum/Filter/Timezone klar;
- Datenquelle/Freshness;
- keine unnötigen personenbezogenen Daten;
- Berechtigungsprüfung auch beim Export;
- Exporte im Audit Trail, wenn sensible Daten betroffen sind.

## 31. Definition of Done

Das Marketing-/Growth-Control-Center ist nicht fertig, solange mindestens eines gilt:

- Ad-Provider-Zahlen werden ungeprüft als Business Truth behandelt;
- CAC/LTV/Payback/Contribution Margin sind nicht nachvollziehbar;
- Funnel-/Attribution-Definitionen ändern sich unversioniert;
- Kampagnen können ohne Spend Caps oder Audit Trail Geld ausgeben;
- CRM hat keine Consent-/Suppression-/Frequency-Grenzen;
- Tracking-Ausfälle bleiben unbemerkt;
- SEO/Discoverability kann Deindexation/Canonical/hreflang/Schema-Probleme nicht erkennen;
- Referral/Creator/Affiliate fehlt Anti-Fraud/Reconciliation;
- Reviews/Claims/UGC haben keine Rechte-/Truth-/Freigabekontrolle;
- Copilot kann fehlende Daten als sichere Aussage tarnen;
- private Reise-/Pass-/Identity-Daten können als Marketing-Audience verwendet werden;
- produktive Marketing-Writes sind nicht autorisiert/auditierbar;
- Budget-/Launch-/Connector-/Privacy-Gates können umgangen werden;
- Web/App/Revenue/Refund-Daten können nicht ausreichend reconciled werden;
- wichtige Growth-Entscheidungen erfordern weiterhin unkontrollierte externe Tabellen, weil Jetnity im Admin keine fachliche Heimat dafür besitzt.

## 32. Umsetzungsreihenfolge

Dieser Standard wird **nicht jetzt** als Monster-Slice gebaut.

Empfohlene kontrollierte Reihenfolge:

### M0 – Contracts & Read-only Foundation
- Metric/Event/Attribution Contracts;
- Admin IA;
- Read-only Growth Overview;
- Data Quality Foundation;
- Privacy-/Consent-Grenzen.

### M1 – Funnel, Attribution & Economics
- Funnel Explorer;
- Cohorts;
- Acquisition/Attribution;
- Revenue/Cost Reconciliation;
- CAC/LTV/Payback/Contribution Margin.

### M2 – Content/Discoverability & Reputation
- SEO/AI Discoverability Ops;
- Content Inventory/Freshness;
- Reviews/Reputation;
- Claims/Brand Assets.

### M3 – CRM, Referral, Creator & Experiments
- Lifecycle CRM;
- Referral/Creator/Partner Center;
- Experiment Registry/Platform;
- Marketing Calendar.

### M4 – Paid Control Plane
- Ads connector read-only first;
- reconciliation;
- spend/limits/alerts;
- controlled campaign writes;
- Kill Switch;
- approval/audit.

### M5 – Subscription & International Growth
- Subscription Growth;
- Market Expansion Cockpit;
- App Store/ASO operations;
- international unit economics.

### M6 – Copilot Pro Growth Analyst & Automation Policies
- evidence-aware recommendations;
- anomaly triage;
- forecasts;
- briefs;
- only explicitly allowed bounded automations.

Jeder Slice braucht Self-Review, vollständige relevante Tests/Gates und unabhängigen Technical-Lead-Review. Provider-, Secret-, Privacy-, Cost-, Production- und Launch-Gates bleiben unverändert.

## 33. Governance

Primärer späterer Admin-Agent bleibt:

`Admin platform audit`

Der Agent darf diesen Standard nicht als Freigabe verstehen, jetzt außerhalb der verbindlichen großen Build-Reihenfolge mit Marketing-Runtime zu beginnen.

Vor Implementierung muss der damalige Live-Stand von Admin, Marketing Growth Standard, Discoverability, Account/Subscriptions, Provider, Finance/Billing und Privacy erneut geprüft werden. Überschneidende Shared Contracts bleiben Technical-Lead-gesteuert.
