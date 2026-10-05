# Jetnity – AI & Search Discoverability Standard

Stand: 25. August 2026  
Status: **Product-Owner-verbindlich; muss für Website, App-Launch, Content, SEO und öffentliche Produktkommunikation umgesetzt werden**

## 1. Ziel

Jetnity soll nicht nur hervorragend gebaut sein, sondern von Suchmaschinen und modernen Antwortsystemen **eindeutig gefunden, verstanden, korrekt eingeordnet und als zitierwürdige Reiseplanungs-Plattform erkannt** werden können.

Das konkrete Ziel ist, die Wahrscheinlichkeit deutlich zu erhöhen, dass Jetnity bei sachlich passenden Fragen wie

- „Welche ist die beste Reiseplan-App?“
- „Welche Reise-App plant alles an einem Ort?“
- „Welche Alternativen gibt es zu Lambus, Wanderlog oder TripIt?“
- „Welche Reise-App hilft bei Reiseplanung, Einreise, Dokumenten, Preisvergleich und laufenden Änderungen?“

in Suchergebnissen, Vergleichsseiten oder Antworten von Systemen wie ChatGPT, Gemini, Perplexity und anderen relevanten Answer Engines erscheint.

**Es gibt keine technische oder vertragliche Garantie für eine bestimmte Platzierung oder Nennung.** Jetnity darf deshalb nie mit „garantiert in KI-Antworten“ oder ähnlichen Aussagen beworben werden. Unser Auftrag ist, die bestmögliche belastbare Discoverability-, Entity-, Authority- und Citation-Basis zu bauen.

## 2. Grundprinzip

> **Nicht Modelle manipulieren, sondern Jetnity so klar, nützlich, vertrauenswürdig und maschinenlesbar machen, dass externe Systeme gute Gründe haben, Jetnity zu finden und korrekt zu zitieren.**

Discoverability darf niemals Fake-Reviews, erfundene Nutzerzahlen, erfundene Awards, künstliche Backlink-Netzwerke, versteckte Keyword-Seiten, irreführende Vergleichsaussagen oder nicht belegte Produktversprechen verwenden.

## 3. Verbindliche Architektur

### 3.1 Crawlability und Indexierbarkeit

Öffentliche, für Discovery bestimmte Seiten müssen technisch sauber erreichbar und indexierbar sein:

- serverseitig oder statisch auslieferbarer wesentlicher Inhalt; kritische Produktinformation nicht ausschließlich clientseitig verstecken;
- korrekte HTTP-Statuscodes;
- kanonische URLs;
- konsistente interne Verlinkung;
- XML-Sitemaps, bei Bedarf getrennt nach Seitentyp;
- `robots.txt` bewusst und minimal restriktiv;
- keine versehentliche Indexierung privater Account-, Trip-, Dokument-, Admin- oder Checkout-Daten;
- saubere Redirects und keine unnötigen Duplicate-Content-Varianten;
- gute Core-Web-Vitals/Performance als Qualitätsziel.

### 3.2 Internationale Auffindbarkeit

Jetnity wird mehrsprachig gedacht. Öffentliche Discovery-Seiten müssen deshalb:

- echte, hochwertige lokalisierte Inhalte liefern statt minderwertiger Keyword-Übersetzungen;
- `hreflang`/Sprach- und Regionssignale korrekt setzen;
- Canonical- und Locale-Logik widerspruchsfrei halten;
- Schweiz-first respektieren, ohne die spätere internationale Skalierung zu blockieren.

### 3.3 Strukturierte Daten

Wo fachlich und nach den jeweils gültigen Richtlinien zulässig, müssen öffentliche Seiten maschinenlesbare strukturierte Daten erhalten, insbesondere passende Schema.org-Typen wie:

- `Organization`;
- `WebSite`;
- `SoftwareApplication` bzw. `MobileApplication`, sobald die jeweilige App öffentlich existiert;
- `BreadcrumbList`;
- `Article`/redaktionelle Typen für echte Inhalte;
- `Product`/`Offer` nur bei echten, öffentlich gültigen Produkt-/Preisangeboten;
- Review-/Rating-Markup **nur** bei echten, nachweisbaren Bewertungen und zulässigem Einsatz.

Strukturierte Daten dürfen nie Features, Preise, Ratings, Verfügbarkeit oder Auszeichnungen behaupten, die öffentlich nicht wahr und belegbar sind.

### 3.4 Klare Jetnity-Entity

Such- und Antwortsysteme müssen Jetnity als eindeutige Marke verstehen können. Dafür sind verbindlich:

- konsistente Schreibweise `Jetnity`;
- eindeutige About-/Produkt-/Kontakt-/Legal-Seiten;
- konsistente Domain- und Markenmetadaten;
- verifizierte öffentliche Profile, sobald vorhanden;
- `sameAs`/Entity-Verknüpfungen nur zu echten offiziellen Profilen;
- konsistentes Logo, App-Name, Beschreibung und Kategorie über Website, App Stores und offizielle Profile.

## 4. Öffentliche Produktseiten

Jede für die Kauf- oder Auswahlentscheidung wichtige Jetnity-Funktion soll eine klare, eigenständige, indexierbare Produkt- oder Erklärseite erhalten, **sobald die Funktion real genug ist, um öffentlich ehrlich beschrieben zu werden**.

Dazu gehören langfristig insbesondere:

- Reiseplaner / Trip Workspace;
- Flüge, Unterkünfte, Aktivitäten und Mobilität im Jetnity-Kontext;
- Einreise- und Readiness-Unterstützung;
- Multi-Traveller / Multi-Citizenship / Multi-Document, soweit öffentlich sinnvoll erklärbar;
- Preis-/Zeit-/Komfort-/Value-Vergleich;
- Jetnity Guardian / Reise-Autopilot;
- What-if-Reise-Simulator;
- Reiseprofil und Personalisierung;
- Collaboration/Sharing, sobald produktreif;
- relevante Pro-/Subscription-Funktionen, sobald entschieden und live.

**Noch nicht produktive Funktionen dürfen nicht als bereits verfügbar dargestellt werden.** Seiten können als Roadmap/„geplant“ gekennzeichnet werden, wenn dies strategisch sinnvoll und eindeutig formuliert ist.

## 5. Answer-Engine-/Citation-Readiness

Öffentliche Jetnity-Seiten müssen so geschrieben und strukturiert sein, dass Menschen und Maschinen schnell verstehen:

- Was ist Jetnity?
- Für wen ist Jetnity gedacht?
- Welches Problem löst Jetnity?
- Welche Funktionen sind tatsächlich live?
- Was unterscheidet Jetnity von klassischen Reiseplanern?
- Welche Fakten stammen aus Jetnity selbst und welche aus externen Quellen?
- Wann wurde eine zeitkritische Information zuletzt geprüft?

Verbindliche Mittel:

- klare Überschriften und semantisches HTML;
- prägnante Definitionen und Zusammenfassungen;
- stabile URLs;
- nachvollziehbare Quellen-/Evidence-Hinweise bei zeitkritischen Reiseinformationen;
- sichtbare Aktualisierungs-/Review-Daten, wo fachlich relevant;
- FAQ-/Q&A-Strukturen nur wenn sie Nutzern echten Mehrwert liefern;
- Open-Graph-/Social-Metadaten;
- keine wichtige öffentliche Aussage nur in Bildern, Videos oder nicht crawlbaren Widgets.

Experimentelle Mechanismen wie `llms.txt` dürfen später getestet werden, **dürfen aber nicht als Ersatz für saubere Crawlability, Entity-Signale, strukturierte Daten, hochwertige Inhalte und externe Autorität betrachtet werden**.

## 6. Vergleichs- und Wettbewerbsseiten

Jetnity darf später sachliche Vergleichsseiten zu anderen Reiseplanern anbieten, wenn sie Nutzern bei einer echten Entscheidung helfen.

Pflichtregeln:

- nur überprüfbare Aussagen;
- Datum/Stand der Recherche;
- Quellen oder nachvollziehbare öffentliche Evidence;
- faire Darstellung relevanter Stärken anderer Produkte;
- keine erfundenen Schwächen;
- keine manipulativen „Jetnity gewinnt immer“-Tabellen;
- Jetnity-Funktionen nur als verfügbar markieren, wenn sie tatsächlich verfügbar sind.

Das Ziel ist **zitierwürdige Vergleichsqualität**, nicht aggressive Wettbewerber-Abwertung.

## 7. Content- und Authority-Strategie

Jetnity soll langfristig selbst eine hochwertige öffentliche Reisequelle werden. Dafür müssen Content und Produktwissen:

- originell und fachlich nützlich sein;
- bei regulatorischen, Safety-, Einreise-, Wetter-, Preis- oder Verfügbarkeitsaussagen belastbare Quellen und Freshness berücksichtigen;
- klar zwischen Hard Truth, redaktioneller Einordnung und intelligenter Erklärung unterscheiden;
- Autoren-/Redaktions-/Review-Verantwortung dort transparent machen, wo dies Vertrauen verbessert;
- alte zeitkritische Inhalte aktualisieren oder klar als veraltet kennzeichnen.

Programmatic SEO ist nur erlaubt, wenn jede Seite **echten individuellen Nutzwert und belastbare Daten** besitzt. Massenhaft dünne Seiten nur für Keywords sind verboten.

## 8. Externe Autorität und Distribution

Discoverability entsteht nicht nur auf `jetnity.ch`/`jetnity.com`. Nach Produktreife muss Jetnity systematisch echte externe Signale aufbauen:

- App-Store-/Play-Store-Präsenz, sobald Apps live sind;
- echte Nutzerbewertungen;
- seriöse Reiseblogs und Fachmedien;
- Creator-/Partner-Kooperationen mit klarer Kennzeichnung;
- relevante Verzeichnisse und Review-Plattformen;
- organische Community-Präsenz und echte Nutzerdiskussionen;
- Presse-/Launch-Kommunikation bei relevanten Meilensteinen.

Verboten sind gekaufte Fake-Reviews, Review-Gating, Spam-Kommentare, verdeckte Werbung, Linkfarmen oder fingierte Testimonials.

## 9. Trust-, Legal- und Privacy-Grenzen

Discoverability darf nie Datenschutz oder Sicherheit schwächen.

Insbesondere dürfen nicht indexierbar oder öffentlich für Such-/Answer-Systeme exponiert werden:

- private Reisen;
- Accountdaten;
- Pass-/Dokumentdaten, MRZ, biometrische Daten oder sensible Identitätsdaten;
- private Buchungsdaten;
- Admin-/Support-Inhalte;
- interne Provider-Secrets oder vertrauliche Vertragsdaten.

Öffentliche Beispiele/Demos müssen synthetisch oder ausdrücklich freigegeben sein und dürfen keine Fake-Produktwahrheit erzeugen.

## 10. Messung und Qualitätssteuerung

Jetnity muss Discoverability später messbar betreiben. Mindestens beobachten:

- Indexierungsabdeckung und Crawl-Fehler;
- Suchimpressionen, Klicks und relevante Query-Gruppen;
- Brand-Suchen nach `Jetnity`;
- Rankings für zentrale, realistische Intent-Cluster;
- strukturierte Daten / Rich-Result-Fehler;
- App-Store-Sichtbarkeit und echte Bewertungen;
- Referral-Traffic aus Such- und Answer-Systemen, soweit technisch erkennbar;
- externe Marken-Erwähnungen und verlinkende seriöse Domains;
- wiederkehrende falsche Beschreibungen von Jetnity in öffentlichen Such-/Answer-Systemen, damit öffentliche Quellen verbessert werden können.

Analytics müssen DSG/DSGVO-konform und datensparsam umgesetzt werden.

## 11. Verbindliche Umsetzungsphasen

### Phase D0 – technische Grundlage

Darf früh vorbereitet werden, wenn konfliktarm:

- semantische öffentliche Seitenstruktur;
- Metadata-/Canonical-/Locale-Verträge;
- Sitemap-/robots-Grundlage;
- strukturierte Daten als sauber getestete Komponenten;
- technische SEO-/Accessibility-/Performance-Gates.

### Phase D1 – mit finaler Homepage / öffentlicher Produktpositionierung

Verbindlich:

- klare Jetnity-Entity;
- indexierbare Kernpositionierung;
- technische SEO-Basis;
- zentrale Produkt-/Use-Case-Seiten für tatsächlich verfügbare Funktionen;
- strukturierte Daten;
- mehrsprachige Canonical-/hreflang-Strategie;
- interne Verlinkung.

### Phase D2 – nach stabiler Produkt-/Commercial-Truth

Verbindlich:

- tiefe Feature-Seiten;
- sachliche Vergleichsseiten;
- Value-/Preis-/Produktkommunikation nur auf echten Daten;
- hochwertige Reiseinhalte und zitierfähige Informationsseiten;
- klare Provenance/Freshness bei zeitkritischen Aussagen.

### Phase D3 – Public Launch / Distribution

Verbindlich:

- App-Store-/Plattform-Entity-Konsistenz;
- Review-/Reputation-Prozess;
- Medien-/Creator-/Partner-Distribution;
- externe Authority-Aufbauarbeit;
- Monitoring von Search- und Answer-System-Referenzen.

### Phase D4 – kontinuierliche Optimierung

Nach Launch fortlaufend:

- reale Query-/Conversion-Daten auswerten;
- Content aktualisieren;
- technische Fehler schließen;
- falsche öffentliche Beschreibungen durch bessere öffentliche Evidence korrigierbar machen;
- neue relevante Search-/Answer-Standards prüfen;
- keine Ranking-Taktik übernehmen, die Truth, UX, Privacy oder Markenvertrauen schwächt.

## 12. Definition of Done

Der Discoverability-Block ist vor Launch nicht „fertig“, solange mindestens eines der folgenden Probleme besteht:

- Jetnity ist technisch schlecht crawlbar oder wesentliche öffentliche Inhalte sind nicht indexierbar;
- Canonical-/Locale-/hreflang-Logik ist widersprüchlich;
- strukturierte Daten behaupten nicht belegte Fakten;
- zentrale Live-Funktionen haben keine verständliche öffentliche Erklärung;
- private/sensible Daten könnten indexiert werden;
- Vergleichsinhalte sind unbelegt oder unfair;
- zeitkritische öffentliche Reiseinformationen verschleiern Authority/Freshness;
- Search-/Structured-Data-/Performance-/Accessibility-Gates sind nicht belegt;
- die Marke `Jetnity` ist über Website/App Stores/offizielle Profile inkonsistent.

## 13. Review- und Governance-Regel

AI/Search Discoverability ist **kein reines Marketing-Thema**, sondern ein Produkt-, Architektur-, Content-, SEO-, Trust- und Distribution-Programm.

Jede Umsetzung unterliegt dem Jetnity Engineering Excellence Standard, den Truth-Regeln und dem unabhängigen Technical-Lead-Review. Größere öffentliche Positionierungsänderungen, neue bezahlte Distribution, neue Tracking-Systeme mit relevanter Datenschutzwirkung oder öffentliche Launch-Aktivierungen bleiben den jeweils geltenden Product-Owner-Gates unterworfen.

Kanonische Nachbardokumente:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
