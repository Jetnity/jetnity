# Jetnity – Marketing & Growth Standard

Stand: 25. August 2026  
Status: **Product-Owner-verbindlich; muss als kanonische Grundlage für Marketing, Growth, Attribution, CRM, Referral, Creator, Paid, ASO und Launch-Distribution umgesetzt werden**

## 1. Ziel

Jetnity soll nicht nur ein hervorragendes Reiseprodukt werden, sondern **messbar, vertrauenswürdig und effizient wachsen können**.

Marketing darf bei Jetnity kein nachträglich angeklebtes Werbesystem sein. Die Produkt-, Daten-, Content-, Analytics-, Account-, Subscription-, Provider-, Admin- und Discoverability-Architektur muss so aufgebaut werden, dass später nachvollziehbar ist:

- woher ein Besucher oder Nutzer kommt;
- welches Problem bzw. welcher Reise-Intent ihn zu Jetnity gebracht hat;
- welche öffentlichen Inhalte, Kampagnen, Empfehlungen oder Partner zur Nutzung beigetragen haben;
- welche Produktmomente Aktivierung, Wiederkehr, Empfehlung und Zahlung auslösen;
- welche Akquisitionskanäle nachhaltigen Wert statt nur Klicks erzeugen;
- wie viel Akquisition kostet und welchen realen Kundenwert sie erzeugt;
- welche Kommunikation nützlich ist und welche nur Lärm wäre.

Leitprinzip:

> **Jetnity wächst durch ein hervorragendes Produkt, klare Distribution und belastbare Messung – nicht durch Spam, Dark Patterns, erfundene Reichweite oder blindes Werbebudget.**

## 2. Marketing-Positionierung

Alle öffentlichen Marketingflächen müssen dieselbe Kernpositionierung respektieren:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

Jetnity soll nicht primär damit werben, „mehr Funktionen“ zu besitzen. Marketing muss zeigen, dass Nutzer **weniger selbst zusammensuchen, vergleichen, koordinieren und nachdenken müssen**.

Verbindliche Regeln:

- konkrete Nutzerprobleme statt Feature-Wände kommunizieren;
- nur Funktionen als live bewerben, die tatsächlich live und belastbar sind;
- keine Fake-Preise, Fake-Verfügbarkeit, Fake-Nutzerzahlen, Fake-Bewertungen, Fake-Awards oder erfundene Zeitersparnis;
- intelligente/automatisierte Funktionen verständlich erklären, ohne Marketing unnötig mit dem Wort „KI“ zu überladen;
- Hard Truth, Empfehlung und Erklärung nicht vermischen;
- Einreise-, Safety-, Preis-, Verfügbarkeits- und Provider-Aussagen nur mit der jeweils erforderlichen Evidence/Freshness kommunizieren.

Kanonische Produktpositionierung: `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`.

## 3. Growth-Architektur: ein gemeinsamer Funnel

Jetnity braucht einen kanalübergreifenden, produktnahen Funnel. Mindestens folgende Stufen müssen später sauber messbar sein:

1. **Reach** – Jetnity wird gesehen oder empfohlen.
2. **Visit** – Nutzer landet auf einer öffentlichen Jetnity-Fläche.
3. **Intent** – Nutzer zeigt eine konkrete Reiseabsicht, z. B. Ziel, Zeitraum, Route, Einreise- oder Planungsfrage.
4. **Activation** – Nutzer erlebt erstmals einen echten Jetnity-Kernnutzen.
5. **Trip Creation / Adoption** – Nutzer erstellt oder übernimmt eine Reise in den Workspace.
6. **Return / Retention** – Nutzer kommt wieder, weil Jetnity für die Reise relevant bleibt.
7. **Collaboration / Referral** – Nutzer lädt Reisepartner ein oder teilt Jetnity sinnvoll.
8. **Commercial Intent** – Nutzer vergleicht oder öffnet ein echtes Angebot / einen Deep Link.
9. **Subscription Intent** – Nutzer erreicht einen echten Pro-Mehrwert oder Pricing-/Upgrade-Moment.
10. **Paid Conversion** – Abo/Lifetime/anderes bezahltes Produkt wird real abgeschlossen, sobald diese Systeme live sind.
11. **Revenue Quality** – Umsatz, Provision, Refund, Churn und laufender Kundenwert werden korrekt zugeordnet.

Die konkrete Funnel-Visualisierung darf sich später ändern. Die fachliche Regel bleibt: **Marketing-Optimierung darf nicht bei Klicks oder Registrierungen aufhören.** Entscheidend sind Aktivierung, Retention, Revenue Quality und Nutzerwert.

## 4. Verbindliches Marketing-/Attribution-Datenmodell

### 4.1 Acquisition Context

Jetnity muss bei zulässiger Messung einen strukturierten Acquisition Context erfassen können, z. B.:

- referrer;
- Landingpage;
- UTM source / medium / campaign / content / term;
- Click IDs relevanter Werbeplattformen, soweit datenschutzrechtlich und technisch zulässig;
- Affiliate-/Partner-ID;
- Creator-/Referral-Code;
- Campaign-/Creative-ID;
- App-/Web-/Deep-Link-Einstieg;
- Locale, Markt und Währungskontext;
- Zeitpunkt und Session-Kontext.

Diese Felder dürfen nicht unkontrolliert als freie Wahrheit über mehrere Systeme dupliziert werden. Es braucht einen dokumentierten kanonischen Contract.

### 4.2 Attribution

Später müssen mindestens folgende Sichtweisen möglich sein:

- First Touch;
- Last Non-Direct Touch;
- Conversion Touch;
- Referral-/Partner-Attribution;
- Assisted Touches für Analysen, wo belastbar.

Jetnity darf keine falsche Präzision vortäuschen. Wenn Browser-, Consent-, App- oder Plattformgrenzen eine Zuordnung verhindern, bleibt Attribution `unknown`/unvollständig statt erfunden.

### 4.3 Anonymous → Account

Wenn ein anonymer Besucher später ein Konto erstellt, darf Acquisition Context **nur innerhalb der geltenden Privacy-/Consent-Verträge** verbunden werden. Es darf keine heimliche geräteübergreifende Identitätsauflösung oder Fingerprinting-Logik geben.

### 4.4 Event-Verträge

Marketing-, Product- und Revenue-Analytics müssen definierte versionierte Events verwenden. Ein Event braucht mindestens:

- stabilen Eventnamen;
- Version;
- Timestamp;
- Surface/Context;
- zulässige IDs bzw. pseudonyme Zuordnung;
- dokumentierte Properties;
- Herkunft/Producer;
- bekannte Privacy-Klasse.

Events dürfen keine Passnummern, MRZ, biometrischen Daten, vollständigen privaten Reisedokumente, Auth-Secrets oder unnötige sensible Reiseinhalte enthalten.

## 5. North-Star- und Business-Metriken

Jetnity darf Growth nicht anhand einer Vanity Metric steuern.

Später müssen mindestens messbar sein:

- qualifizierte Besucher;
- Activation Rate;
- Trip Creation / Trip Adoption Rate;
- D1/D7/D30 bzw. reisesinnvolle Retention-Kohorten;
- Anteil wiederkehrender aktiver Reisen;
- Einladung/Collaboration Rate;
- Referral Conversion;
- Pricing-/Upgrade-View → Purchase Conversion;
- Trial → Paid, falls Trial eingeführt wird;
- Monthly/Annual/Lifetime Mix, sobald entschieden;
- Churn / Renewal / Refund;
- Affiliate-/Commercial Conversion und Revenue;
- CAC je Kanal/Kampagne/Markt;
- LTV bzw. belastbare LTV-Näherung;
- CAC Payback;
- Contribution Margin nach realen Provider-/Modell-/Infrastruktur-/Payment-Kosten;
- organischer Anteil vs. Paid-Anteil;
- Brand Search und direkte Nachfrage.

Keine Kampagne gilt als „gut“, nur weil CTR oder Registrierungen hoch sind, wenn Aktivierung, Retention oder Unit Economics schlecht sind.

## 6. Lifecycle CRM: nützlich statt laut

Jetnity soll Kommunikation an den **Reise-Lifecycle** koppeln, nicht an beliebige Marketingfrequenzen.

Relevante Zustände können später z. B. sein:

- Inspiration / noch keine Reise;
- Reise begonnen zu planen;
- Reise teilweise geplant;
- Reise nähert sich;
- Readiness-/Dokument-/Planungslücken vorhanden;
- unterwegs;
- Reise abgeschlossen;
- nächste Reise wahrscheinlich / neue Inspiration.

Daraus dürfen nützliche E-Mail-, Push- oder In-App-Kommunikationen entstehen, z. B.:

- offene Planungsschritte;
- relevante echte Preis-/Verfügbarkeitsänderungen, wenn entsprechende Provider-/Evidence-Verträge existieren;
- Einreise-/Readiness-/Safety-Hinweise aus belastbaren Quellen;
- Reiseerinnerungen;
- sinnvolle nächste Schritte;
- nach der Reise: Reisebuch, Erinnerung, Review-/Referral-Moment oder neue Inspiration.

### Harte CRM-Regeln

- Service-/Safety-/Security-Kommunikation und Marketing-Consent sauber trennen;
- Abmeldung einfach und zuverlässig;
- Frequenzbegrenzung und Quiet-/Suppression-Regeln;
- keine künstliche Dringlichkeit;
- keine „Dein Flug wird teurer“-Behauptung ohne reale Evidence;
- keine Verwendung sensibler Pass-/Dokumentdaten für Werbesegmentierung;
- keine Werbung in kritischen Safety-/Security-Meldungen, die Vertrauen verwässert.

Für E-Mail müssen Domain-Reputation und Deliverability professionell betrieben werden, einschließlich SPF/DKIM/DMARC und Bounce-/Complaint-Handling, sobald der Versand produktiv ist.

## 7. Referral & Viral Loops

Reisen sind sozial. Jetnity soll organisches Wachstum direkt aus echten Produktmomenten ermöglichen.

Verbindliche Produktmechaniken, sobald der jeweilige Workspace-/Collaboration-Scope reif ist:

- „Reisepartner einladen“;
- sicher teilbare Reise-/Planungsansichten;
- sauberer Deep Link zurück zur konkreten Jetnity-Reise oder öffentlichen freigegebenen Ansicht;
- Attribution einer Einladung ohne unnötige Offenlegung privater Reisedaten;
- später optional Referral-Rewards, falls wirtschaftlich sinnvoll und ausdrücklich beschlossen.

Referral-Rewards brauchen vor Auszahlung/Entitlement:

- Anti-Fraud-Regeln;
- Self-Referral-Schutz;
- Duplicate-/Abuse-Erkennung;
- klaren Status und Audit Trail;
- definierte Storno-/Refund-Regeln;
- Kosten-/Budgetgrenzen.

Der Empfehlungsmoment soll dort erscheinen, wo der Nutzer echten Wert erlebt – nicht als dauerndes Pop-up.

## 8. Content Engine

Jetnity soll Inhalte nicht als getrennten Blog-Betrieb behandeln, sondern als **wiederverwendbare, truth-aware Content Engine**.

Aus belastbaren öffentlichen Daten und redaktionellen Strukturen können später entstehen:

- Destination-/Land-/Stadtseiten;
- Reisezeit-/Saisonseiten;
- Einreise-/Readiness-Erklärungen;
- Route-/Transport-Erklärungen;
- Trend- und Inspirationsinhalte;
- Vergleichs- und Use-Case-Seiten;
- Newsletter-Bausteine;
- Social-Post-Vorschläge;
- Creator-Briefings;
- Kampagnen-Landingpages.

### Content Source of Truth

Ein Inhalt muss nachvollziehbar unterscheiden können zwischen:

- stabiler Produktinformation;
- externer Hard Truth;
- zeitkritischer Evidence;
- redaktioneller Einordnung;
- intelligenter Zusammenfassung/Erklärung.

Content darf nicht durch ein Sprachmodell zur regulatorischen, Safety-, Preis- oder Verfügbarkeitswahrheit werden.

Programmatic Content ist nur erlaubt, wenn jede veröffentlichte Seite echten individuellen Nutzen besitzt. Dünne Keyword-Massenproduktion ist verboten.

Kanonische Discoverability-Regeln: `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`.

## 9. Creator & UGC Growth

Jetnity soll Creator und reale Nutzerbeiträge später als Qualitäts- und Distributionskanal nutzen können.

Mögliche Bausteine:

- Creator-Profile und veröffentlichte Reiseinhalte;
- öffentliche Reise-/Ziel-Collections;
- freigegebene Fotos/Videos;
- nachvollziehbare Creator-/Partner-Attribution;
- Affiliate-/Revenue-Share nur mit transparenten Verträgen;
- Moderation und Rechte-/Lizenzstatus für veröffentlichte Medien;
- klare Kennzeichnung bezahlter Kooperationen.

Verbindlich:

- keine ungeklärte Wiederverwendung von Nutzerfotos;
- keine Veröffentlichung privater Trips ohne explizite Freigabe;
- keine gekauften Fake-Testimonials;
- keine Creator-Empfehlung als unabhängige Meinung darstellen, wenn bezahlt/gesponsert;
- UGC muss Moderations-, Abuse- und Takedown-Prozesse besitzen, bevor es groß skaliert.

## 10. Social Distribution

Jetnity soll Inhalte kanalgerecht wiederverwenden können, ohne überall denselben Text zu spammen.

Später relevante Kanäle können sein:

- Instagram;
- TikTok;
- YouTube/Shorts;
- Pinterest;
- Facebook/Meta, wo Zielgruppe sinnvoll;
- relevante Communities und Foren;
- Newsletter;
- Creator-/Partner-Kanäle.

Jetnity Copilot Pro darf später aus echten Trends, Content-Performance und Produktdaten Vorschläge für Themen, Creatives und Kampagnen machen. **Er darf nicht ungeprüft falsche Claims veröffentlichen oder eigenmächtig neue bezahlte Kampagnen mit realem Budget aktivieren, wenn dafür ein Product-Owner-/Kosten-/Launch-Gate gilt.**

## 11. Paid Acquisition

Paid Marketing darf erst aggressiv skaliert werden, wenn mindestens vorhanden sind:

- belastbares Conversion-Tracking;
- realer Activation Funnel;
- Revenue-/Subscription-/Affiliate-Attribution;
- definierte CAC-/Payback-Grenzen;
- Landingpage-/Creative-Truth;
- Budget- und Kill-Switch-Controls;
- Datenschutz-/Consent-Abnahme der eingesetzten Tracking-/Ad-Technik.

### Paid Guardrails

- Budget pro Kanal/Kampagne konfigurierbar;
- harte tägliche/monatliche Spend Caps;
- Anomalie-/Runaway-Spend-Alarm;
- Pause/Kill Switch im Admin;
- keine automatische Budgeterhöhung ohne definierte Policy;
- keine Kampagne auf nicht-live Features;
- keine irreführenden Preis-/Rabattclaims;
- keine Nutzung sensitiver Traveller-/Pass-/Health-/Identity-Daten für Targeting;
- neue produktive Ad-Provider, Tracking-Secrets oder relevante neue laufende Kosten unterliegen den geltenden Product-Owner-Gates.

Google Ads, Meta, TikTok oder andere Kanäle sind **Provider**, nicht Marketing-Wahrheit. Ihre Reportings müssen mit Jetnitys eigener Conversion-/Revenue-Evidence abgeglichen werden.

## 12. Landingpages & Campaign Surfaces

Kampagnen brauchen keine technisch separaten Mini-Websites. Sie sollen auf denselben Design-, Content-, Analytics-, Consent-, Accessibility- und Performance-Verträgen wie Jetnity aufbauen.

Landingpages müssen:

- einen klaren Intent bedienen;
- zur Anzeige/Quelle passen;
- nur reale Funktionen versprechen;
- schnell laden;
- auf Mobile hervorragend funktionieren;
- klare nächste Schritte besitzen;
- Attribution erhalten;
- SEO-/Canonical-Regeln respektieren;
- testbar sein;
- nach Ende einer Kampagne sauber weiterleiten, archiviert oder kontrolliert noindex gesetzt werden können.

## 13. Experimente & Conversion Optimization

Jetnity darf A/B-Tests und andere Experimente nutzen, wenn diese echten Produkt-/Marketingnutzen untersuchen.

Jedes produktive Experiment braucht:

- Hypothese;
- Zielmetrik;
- Guardrail-Metriken;
- definierte Zielgruppe;
- Start-/Endzeit;
- Varianten/Control;
- Owner;
- Ergebnis und Entscheidung;
- Auditierbarkeit.

Verboten sind insbesondere:

- Dark Patterns;
- versteckte Kündigungsbarrieren;
- künstliche Countdown-Timer ohne reale Frist;
- irreführende Default-Opt-ins;
- versteckte Preisunterschiede ohne zulässige Grundlage;
- Experimente, die Safety-, Privacy-, Regulatory- oder Payment-Wahrheit relativieren.

## 14. Subscription Marketing

Das Subscription-/Entitlement-System soll architektonisch Free, monatlich, jährlich und – falls später final beschlossen – Lifetime/Founder-Lifetime unterstützen können. **Konkrete Preise, Trial-Dauer und Lifetime-Konditionen bleiben eine spätere Product-Owner-Entscheidung.**

Marketing-Regeln:

- Preis und Abrechnungsintervall klar;
- Jahresersparnis korrekt berechnet;
- Trial nur mit transparentem Ende/Übergang;
- Kündigung nicht absichtlich erschweren;
- keine versteckten Verlängerungen;
- Lifetime exakt definieren und keine Leistungen versprechen, die aus rechtlichen/wirtschaftlichen Gründen nicht umfasst sind;
- Paywall-/Upgrade-Momente an echten Nutzerwert koppeln statt zufällig zu blockieren.

## 15. App Store Optimization (ASO) und Web → App

Sobald native Apps geplant/produktiv sind, muss Jetnity Web und App als eine Marke betreiben.

Pflicht:

- konsistenter App-Name, Beschreibung, Kategorie und Branding;
- hochwertige Screenshots/Videos mit realen Funktionen;
- lokalisierte Store-Metadaten;
- Deep Links / Universal Links / App Links;
- Web → App und App → Web Attribution soweit belastbar;
- Store-Review-Monitoring;
- Review-Prompts nur nach sinnvollen positiven Produktmomenten, nicht als Review-Gating;
- Release-Notes und Feature-Claims müssen wahr sein.

## 16. Reviews, Reputation & Social Proof

Echte Reviews sind gleichzeitig Produktfeedback, Conversion-Signal und Discoverability-Signal.

Jetnity braucht später einen Prozess für:

- App-Store-Reviews;
- öffentliche Review-Plattformen, wenn relevant;
- Support-/Feedback-Verknüpfung;
- Erkennung wiederkehrender Kritikmuster;
- Antwort- und Eskalationsregeln;
- verifizierbare Testimonials mit Einwilligung.

Verboten:

- Fake-Reviews;
- gekaufte positive Bewertungen ohne zulässige Kennzeichnung;
- Review-Gating, bei dem unzufriedene Nutzer systematisch vom öffentlichen Review abgehalten werden;
- erfundene „X Millionen Nutzer“-Claims.

## 17. PR, Medien & Partnerschaften

Zum Launch und bei echten Meilensteinen soll Jetnity aktiv externe Autorität aufbauen.

Geeignete Bausteine:

- Press Kit;
- klare Fact Sheet / Company-/Product-Facts;
- hochwertige Produkt-Demos;
- journalistisch prüfbare Claims;
- relevante Reise-, Tech- und Schweizer Medien;
- Creator-/Tourismus-/Mobility-/Finance-/Insurance-Partnerschaften, soweit passend;
- Affiliate-/Partnerprogramme mit nachvollziehbarer Attribution.

Provider-, Partner- und Medienbeziehungen dürfen nicht so dargestellt werden, als seien sie offizielle Empfehlungen, wenn dies nicht stimmt.

## 18. Internationales Growth-Modell

Schweiz bleibt der erste Markt. Die Marketingarchitektur muss trotzdem von Anfang an folgende Dimensionen trennen können:

- Markt/Land;
- Sprache;
- Währung;
- Kampagne;
- Acquisition Source;
- Plattform;
- Reise-/Intent-Kategorie.

Staatsbürgerschaft bzw. Dokumentkontext ist **kein allgemeines Werbeprofil**. Er darf nur dort fachlich verwendet werden, wo der Nutzer eine entsprechende Reise-/Einreise-/Dokumentfunktion nutzt und die Privacy-/Purpose-Grenze dies zulässt.

Internationalisierung erfolgt datenbasiert. Ein neuer Markt wird nicht nur wegen Traffic geöffnet, sondern wenn Produktwahrheit, Support/Legal, Lokalisierung, Providerabdeckung und Unit Economics tragfähig sind.

## 19. Admin Control Center / Growth Cockpit

Jetnity braucht später im Admin einen professionellen Growth-/Marketing-Bereich. Dieser soll nicht bloß Charts zeigen, sondern Entscheidungen unterstützen.

Mindestens vorgesehen:

- Funnel Overview;
- Acquisition Channels;
- Campaign Performance;
- CAC/LTV/Payback;
- Subscription-/Affiliate-Revenue;
- Referral Performance;
- Content/SEO/Discoverability Performance;
- CRM Delivery/Engagement/Unsubscribe;
- App Store/Review Signals;
- Experiment Registry;
- Spend Caps und Kill Switches;
- Alerts bei Tracking-Ausfall, Spend-Anomalie oder Conversion-Bruch;
- Audit Trail für produktive Marketing-/Budgetänderungen.

Jetnity Copilot Pro darf daraus später **Analyse, Ursachenhypothesen und priorisierte Verbesserungsvorschläge** erstellen. Er darf Zahlen nicht erfinden und muss Datenlücken als Datenlücken benennen.

**Der vollständige verbindliche Aufbau des Admin-Marketing-Kontrollzentrums steht in `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`.** Dieser Standard erweitert den bisherigen Admin-Plan ausdrücklich um end-to-end Growth Operations, Funnel/Kohorten, provider-neutrale Attribution, Paid Control Plane, Creative-/Claims-Registry, Landingpage-Management, CRM/Journey-Orchestrierung, SEO-/AI-Discoverability-Ops, Experimente, Referral/Creator/Partner, Reputation/PR, Subscription Growth, Market Expansion, Economics/Forecasting, Tracking Quality, Privacy/Consent, Connector- und Incident-Control sowie Copilot-Pro-Growth-Analyse. Er ist für den späteren Admin-Ausbau verbindlich und darf nicht als optionaler Zusatz behandelt werden.

## 20. Privacy, Consent & Security

Marketing ist dem Schweizer DSG, DSGVO und den jeweils anwendbaren Kommunikations-/Tracking-Regeln untergeordnet.

Verbindlich:

- Consent-/Purpose-Trennung;
- Data Minimization;
- Retention-Regeln;
- Lösch-/Privacy-Requests auch für Marketingdaten;
- keine Fingerprinting-Umgehung von Consent;
- keine geheimen Audience-Exporte;
- externe Marketing-Provider nur mit dokumentiertem Datenfluss, Vertrag und Zweck;
- Service Role / Secrets niemals im Client;
- private Reiseinhalte nicht automatisch als Werbe- oder Audience-Daten verwenden;
- Pass-/MRZ-/biometrische/hochsensible Identitätsdaten sind für Marketingtargeting tabu.

## 21. Marketing Reliability

Marketingmessung ist ein produktives System und braucht technische Qualität.

Vor größerem Marketing-Scale müssen vorhanden sein:

- Event-Schema-Tests;
- Duplicate-/Idempotency-Schutz, wo relevant;
- Bot-/Spam-Filter;
- Referral-Abuse-Schutz;
- Tracking-Failure-Monitoring;
- Consent-/Suppression-Tests;
- Deep-Link-Tests;
- Revenue-/Refund-Reconciliation;
- Test-/Internal-Traffic-Ausschluss;
- Staging/Production-Trennung;
- Backfill-/Reprocessing-Policy für Analytics, falls notwendig.

## 22. Verbindliche Umsetzungsphasen

### G0 – Architekturgrundlage

Konfliktarm vorbereitbar, ohne den aktuellen Kernbau aufzublähen:

- kanonischer Event-/Attribution-Contract;
- UTM-/Referral-/Deep-Link-Konzept;
- Consent-/Privacy-Grenzen;
- Funnel-/Metric-Taxonomie;
- Marketing-Provider-Gates;
- Growth-Cockpit-Zielmodell gemäß `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`.

### G1 – Homepage / Public Product Foundation

Mit der finalen Homepage und Discoverability D1:

- klare Conversion-Pfade;
- Landingpage-/Campaign-Templates;
- First-/Last-Touch-Grundlage;
- saubere Acquisition Context-Erfassung;
- Brand-/Use-Case-Messaging;
- erste Content-/CRM-Grundlagen;
- Social-/Open-Graph-/Share-Verträge.

### G2 – Product Growth / Account / Collaboration / Subscription Readiness

Nach stabilen Kernsystemen:

- Activation-/Retention-Messung;
- Guest→Account-Attribution innerhalb Privacy-Grenzen;
- Collaboration-/Invite-/Referral-Messung;
- CRM-Lifecycle und Notification-Grenzen;
- Subscription-/Entitlement-Messgrundlage;
- Experiment Registry;
- Admin Growth Cockpit read-only Grundausbau.

### G3 – Commercial / Revenue Growth

Mit realer Commercial-/Subscription-Truth:

- Revenue-/Commission-/Refund-Attribution;
- CAC/LTV/Payback/Contribution Margin;
- Affiliate-/Partner-Attribution;
- Paid Conversion Tracking;
- Budget-/Spend-Controls;
- Campaign Performance gegen echte Revenue Quality;
- kein ROAS auf Fake-/unvollständige Revenue-Daten.

### G4 – Public Launch / Scale

Nach Launch Readiness:

- Paid Channels kontrolliert aktivieren;
- ASO/Web→App;
- Reviews/Reputation;
- Creator-/Partner-Distribution;
- PR/Media;
- Referral Growth;
- internationale Expansion nach Readiness/Unit Economics;
- Growth Alerts und Copilot-Pro-Analyse.

### G5 – kontinuierliche Optimierung

Fortlaufend:

- Kohorten und Unit Economics;
- Content-/SEO-/AI-Discoverability;
- CRM/Retention;
- Experimente;
- Creative-/Campaign-Performance;
- Market Expansion;
- Provider-/Tracking-Änderungen;
- Kosten-/Margin-Optimierung;
- niemals Truth, Privacy oder Nutzervertrauen für kurzfristige Conversion opfern.

## 23. Definition of Done

Marketing-/Growth-Readiness ist nicht abgeschlossen, solange mindestens eines gilt:

- zentrale Acquisition-/Attribution-Daten sind nicht nachvollziehbar;
- Eventnamen/-semantik sind unversioniert oder widersprüchlich;
- Funnel endet bei Klick/Signup statt Activation/Retention/Revenue Quality;
- Marketing kann Revenue/Refund/Cost nicht ausreichend reconciliieren;
- Paid Spend hat keine Caps/Kill-Switches;
- Referral Rewards können ohne Anti-Fraud/Audit laufen;
- CRM ignoriert Consent/Suppression/Frequency;
- private/sensitive Travel-/Document-/Identity-Daten können unzulässig ins Marketing gelangen;
- Landingpages oder Ads können nicht-live/falsche Claims publizieren;
- App/Web Deep Links und Attribution sind ungeprüft;
- Reviews/Testimonials können ohne Echtheit/Einwilligung genutzt werden;
- ein neuer Markt wird ohne Produkt-/Legal-/Provider-/Support-Readiness skaliert;
- Jetnity kann CAC/LTV/Payback/Contribution Margin nicht belastbar beurteilen;
- Tracking-Ausfall oder Spend-Anomalien bleiben unbemerkt;
- Admin/Copilot kann Datenlücken als sichere Wahrheit darstellen;
- der vollständige `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md` ist für den produktiven Growth-Betrieb nicht umgesetzt oder nicht gegen die dann reale Admin-/Provider-/Finance-/Privacy-Architektur geprüft.

## 24. Governance

Marketing-/Growth-Arbeit unterliegt dem Jetnity Engineering Excellence Standard und den aktuellen Product-Owner-Gates.

Insbesondere bleiben Product-Owner-pflichtig, soweit die aktuelle Governance dies vorsieht:

- neue produktive Tracking-/Ads-/CRM-Provider und Secrets;
- relevante neue externe Datenweitergabe;
- größere Privacy-/Consent-Änderungen;
- bezahlte Kampagnen/Produktionsaktivierung;
- neue laufende Kosten oberhalb der geltenden Budgetgrenze;
- große Preis-/Subscription-/Geschäftsmodellentscheidungen;
- öffentliche Launch-Aktivierung.

Kanonische Nachbardokumente:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
- `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
