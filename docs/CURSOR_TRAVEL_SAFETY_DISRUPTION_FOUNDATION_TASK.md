# Cursor-Auftrag – Travel Safety & Disruption Intelligence: provider-neutrale Foundation

Stand: 23. August 2026  
Status: **verbindlicher neuer Kernblock nach Foundation E / Implementierung noch nicht begonnen**

## Rolle

Du arbeitest als Senior Staff Engineer / Product Architect / Security / Truth / UX / QA Agent für Jetnity.

Foundation D – Route & Transit Intelligence und Foundation E – Traveller Context / Multi-Citizenship / Multi-Document sind vollständig abgeschlossen, auf `main` gemergt und auf Production verifiziert. **Beide Foundations werden nicht erneut gebaut.**

Dieser Auftrag baut als nächsten Kernblock die **provider-neutrale Travel Safety & Disruption Intelligence Foundation**. Es wird **kein echter Safety-/Event-/Government-/Weather-Provider angeschlossen** und keine Safety-Wahrheit erfunden.

Leitsätze:

> **Warnen, wenn es die konkrete Reise betrifft – nicht pauschal alarmieren.**

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Safety & Disruption ist eine eigene Truth-Domäne – kein Newsfeed und keine LLM-Meinung.**

---

## 0. Pflichtlektüre vor jeder Implementierung

Lies vollständig und behandle als verbindlich:

- `AGENTS.md`
- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`
- `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/EXPERT_PROACTIVITY_POLICY.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
- `docs/PRODUCT_OWNER_REVIEW_DEPTH_MANDATE.md`
- `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`
- `docs/PRODUCT_OWNER_PR34_TRAVEL_SAFETY_ADDENDUM.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
- `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md`
- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `docs/TRAVEL_READINESS.md`
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- `docs/TRAVELLER_CONTEXT.md`
- aktuelle Trip-/Route-/Readiness-/Workspace-Dokumentation und relevante ADRs.

Wenn ältere Addenda eine frühere Reihenfolge nennen, gilt die **neuere verbindliche Reihenfolge** aus `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`, `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md`, `ROADMAP.md` und `docs/ACTIVE_WORK_STATUS.md`.

Keine Annahme aus Dokumentation übernehmen, wenn der aktuelle Code, die aktuelle DB oder Production nachweislich anders sind. Abweichungen dokumentieren und fachlich sauber lösen.

---

## 1. Ausgangslage / bestätigte Systemwahrheit

### Foundation D – wiederverwenden, nicht duplizieren

Route/Transit Truth existiert bereits. Safety muss die vorhandene kanonische Route-/Itinerary-Wahrheit wiederverwenden, insbesondere für:

- Origin
- Destinationen / `trip_stages`
- Flight-Itinerary
- Transitpunkte / Airports
- relevante Route-Facts

Keine zweite Transit-, Airport- oder Länder-Wahrheit bauen.

### Foundation E – wiederverwenden, nicht duplizieren

Traveller Context ist produktiv vorhanden. Safety bleibt grundsätzlich **trip-/route-/eventbezogen**. Traveller Context wird nur einbezogen, wenn ein konkreter Safety-/Official-Hinweis fachlich wirklich travellerabhängig ist.

Keine neue parallele Citizenship-/Document-Wahrheit und keine unnötige Sammlung sensibler Daten.

### Provider-Grenze

Es existiert **noch kein freigegebener echter Safety-/Disruption-Provider**.

Darum gilt in diesem Block:

- Provider-Port / Interface und interne Normalisierung bauen.
- kontrollierte Test-Doubles verwenden.
- Factory / Live-Provider standardmäßig `null` / unavailable / disabled.
- keine erfundenen Provider-Schemas.
- keine Live-Secrets.
- keine kostenpflichtige Quelle.
- kein allgemeiner Web-Scraper als Production-Truth-Quelle.
- kein LLM als Safety-Truth-Quelle.

Der spätere konkrete Adapter wird erst gegen aktuelle offizielle Provider-Dokumentation gebaut.

---

## 2. Produktziel

Jetnity soll später belastbare externe Sicherheits- und Störungsereignisse auf eine **konkrete Reise** beziehen können und daraus eine fachlich nachvollziehbare, nicht alarmistische Reisebewertung erzeugen.

Beispiele für spätere Eventklassen:

- bewaffneter Konflikt / Krieg
- schwere politische Unruhen
- Erdbeben
- Tsunami
- Vulkanaktivität
- Hochwasser
- Waldbrand / Rauch
- Wirbelsturm / Hurrikan / Taifun / Zyklon
- erhebliche Infrastruktur-/Transportstörung
- weitere belastbar belegte Ereignisse mit konkreter Reiseauswirkung

Die Foundation muss später einen seriösen Provider anschließbar machen, ohne die Domäne, Entscheidungslogik oder Kern-UI neu zu bauen.

Sie soll insbesondere beantworten können:

1. Gibt es belastbare Evidence?
2. Ist sie aktuell genug?
3. Welchen räumlichen und zeitlichen Geltungsbereich hat sie?
4. Schneidet dieser Bereich die konkrete Reise tatsächlich?
5. Welche Etappe, Route oder Reisebestandteile sind betroffen?
6. Welche semantische Priorität ist fachlich vertretbar?
7. Was soll der Nutzer als Nächstes prüfen?
8. Welche anderen Reisebereiche müssen aufgrund desselben Ereignisses neu bewertet werden?

---

## 3. Nicht verhandelbare Truth-Regeln

1. **Kein LLM erzeugt Safety-Truth.** Ein Sprachmodell darf später nur belegte Facts erklären oder zusammenfassen.
2. **Keine Länder-Pauschalisierung.** Ein regionales Ereignis darf nicht automatisch als Warnung für jede Reise im Land gelten.
3. **Keine Scheingenauigkeit.** Wenn eine Quelle nur Country-Level-Scope liefert, darf Jetnity keine erfundene Stadt-/Radiuspräzision behaupten.
4. **Keine Scheinsicherheit.** Fehlende oder unzureichende Evidence darf nicht als `safe` / `kein Risiko` dargestellt werden.
5. `unknown`, `unavailable`, `insufficient_context`, `stale` oder gleichwertige Zustände bleiben fachlich sichtbar.
6. Event-/Warnstärke, Source-Authority, Jetnity-Relevanz und UI-Priorität sind getrennte Konzepte. Nicht in ein einzelnes unscharfes Severity-Feld pressen.
7. Source-/Evidence-Freshness muss deterministisch geprüft werden.
8. Aufgehobene / abgelaufene / zurückgezogene Evidence darf nicht still aktiv bleiben.
9. Widersprüchliche belastbare Evidence darf nicht durch Reihenfolge oder „best effort“ zu einer sicheren Gewinnerbehauptung werden.
10. Provider-Rohdaten dürfen nicht unvalidiert in UI oder Trip-Domäne lecken.
11. Browser-/Client-Input darf niemals Official-/Safety-Evidence setzen.
12. Keine automatische Reiseänderung aufgrund einer Warnung.

---

## 4. Arbeitsbranch / Draft PR / Governance

Vor Implementierung:

1. `origin/main` frisch laden.
2. Verifizieren, dass Foundation D und E auf `main` und Production abgeschlossen sind.
3. Neuen Branch von exakt aktuellem `origin/main` erstellen:

`feat/travel-safety-disruption-intelligence`

4. Früh einen **Draft PR** öffnen und diesen Task verlinken.

Harte Governance:

- **NICHT mergen.**
- **NICHT eigenmächtig Mark Ready.**
- **KEINE Production-Migration.**
- **KEIN echter Safety-/Disruption-Provider.**
- **KEINE Provider-Secrets.**
- **KEINE neuen laufenden Providerkosten.**
- Product-Owner-Merge-Gate bleibt separat.
- Falls DB-Migrationen fachlich nötig sind: nur Development, sauber versioniert, Production separat gesperrt.

Der Agent darf innerhalb des freigegebenen Blocks technische Detailentscheidungen eigenständig treffen. Größere Produkt-/Architektur-/Kosten-/Provider-/PII-Entscheidungen werden als Proposal dokumentiert und nicht still vorausgesetzt.

---

## 5. Phase 1 – vollständiger Ist-Audit vor Code

Bevor neue Safety-Domäne implementiert wird, aktuelle Architektur lesen und dokumentieren.

Mindestens auditieren:

- Trip Domain / `Trip` / `trip_stages`
- `trip_items` und Domain-spezifische Metadaten
- Flight Route / Foundation-D Route-Facts
- Hotel / Activities / Mobility / Rental-Car Referenzen
- Day Plan / `trip_days`
- Readiness / Traveller Context
- Guest vs Account
- Trip Workspace / Übersicht / `Jetzt wichtig`-Logik bzw. aktueller Priorisierungsstand
- vorhandene Fingerprint-/Freshness-/Evidence-Muster
- Provider-Factories / Feature Gates / API-Sicherheitsmuster
- DB/RLS nur falls Persistenz erwogen wird.

Explizit dokumentieren:

- welche stabilen IDs/Refs Safety für `stage`, `trip_item`, Route-Punkt, Traveller, Tag usw. wiederverwenden kann,
- wo heute bereits External Evidence / Freshness modelliert wird,
- wie eine Safety-Reevaluation bei Trip-Änderungen ausgelöst werden kann,
- wo Cross-Domain-Auswirkungen später am saubersten andocken,
- welche aktuelle Workspace-Integration minimal möglich ist, ohne den späteren großen Workspace-Umbau vorwegzunehmen,
- ob überhaupt eine DB-Persistenz in dieser Foundation nötig ist.

Ergebnis versionieren als:

`docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ARCHITECTURE_AUDIT.md`

Keine neue DB-Tabelle nur deshalb anlegen, damit die Foundation „vollständiger“ wirkt. Persistenz muss einen konkreten fachlichen Grund haben (z. B. später notwendiger Snapshot/State/acknowledgement) und Lizenz-/Freshness-Risiken berücksichtigen.

---

## 6. Phase 2 – provider-neutrale Safety-Domäne

Baue eine eigenständige interne Domäne, bevorzugt unter:

`lib/safety/`

Namenswahl darf nach Audit verbessert werden; **keine Provider-Namen in der Kerndomäne**.

Die Domäne muss mindestens sauber trennen:

### 6.1 External Event / Source Fact

Normalisierte externe Wahrheit, sinngemäß mit:

- stabiler provider-neutraler Event-/Fact-Identität
- Event-Kategorie
- Status (z. B. active / monitoring / resolved / unknown), nur wenn source-backed
- Source-/Authority-Provenance
- checked/updated/published Zeitpunkte, soweit vorhanden
- optionaler gültiger Zeitraum
- räumlicher Geltungsbereich
- source-backed Severity/Advisory-Klasse, soweit Provider das zuverlässig liefert
- Quell-/Action-Link, wenn vorhanden und lizenziert
- strukturierte Evidence-Metadaten

### 6.2 Spatial Scope

Räumliche Relevanz muss strukturiert sein und darf nicht aus freiem Text geraten werden.

Unterstütze nur fachlich belastbare Scope-Formen, die ein späterer Provider normalisieren kann, z. B.:

- Country
- administrative Region
- City / Place, wenn belastbar referenzierbar
- Airport / Transport Hub
- Point/Coordinate + fachlich belegter Radius / Polygon, wenn die Quelle dies tatsächlich liefert
- Route-/corridor-spezifischer Scope nur wenn Provider ihn strukturiert liefert

Keine erfundene Geometrie. Unzureichende Geo-Information => `insufficient_context` / nicht präzise vergleichbar.

### 6.3 Temporal Scope

Normalisiere soweit belegbar:

- Beginn
- Ende / erwartetes Ende
- `updatedAt` / `checkedAt`
- expiry / freshness class

Ein Ereignis außerhalb der konkreten Reisezeit darf nicht wie ein aktives Reiseproblem behandelt werden.

### 6.4 Safety Evaluation

Trenne External Fact von Jetnity-Evaluation.

Eine Evaluation bezieht ein normalisiertes Event auf den aktuellen Trip und enthält sinngemäß:

- event/fact ref
- Evidence-Status / Freshness
- Relevanzstatus
- konkret betroffene Reise-Refs
- nachvollziehbaren Grund der Zuordnung
- semantische Präsentationsklasse, z. B. `critical_warning`, `important_notice`, `information`, `unknown`
- empfohlene nächste **Prüfaktion**, nicht automatische Mutation
- Cross-Domain-Impact-Hinweise

Die Präsentationsklasse darf nur aus belegbaren Event-Facts + konkreter Trip-Relevanz entstehen. Keine LLM-Klassifizierung als Truth.

### 6.5 Begriffe getrennt halten

Mindestens diese Ebenen nicht vermischen:

- Event-Kategorie
- Source-/Authority-Klasse
- source-backed Severity / Advisory-Level
- Freshness
- räumliche/zeitliche Relevanz
- Jetnity-Trip-Impact
- UI-Priorität

---

## 7. Phase 3 – Provider-Port und strikte Normalisierungsgrenze

Baue einen provider-neutralen Port / Interface für spätere Safety-Quellen.

Der Port muss einen klaren, minimalen Query-Kontext erhalten und normalisierte Facts liefern. Provider-Rohpayloads bleiben adapterintern.

Anforderungen:

- server-only Provider Factory
- Default/Production in diesem Block: **kein Live-Provider**
- kontrollierte Test-Doubles
- strikte Runtime-Validierung jeder Providerantwort
- unknown fields nicht blind vertrauen
- invalid response => fail closed
- timeout / throw / malformed / unavailable => kein erfundener Safety-Fact
- Feature/Kill-Switch-Grenze
- kein Secret zum Client
- keine Provider-Rohantwort in Browser/Local Storage
- deterministisches Verhalten bei Duplicate-/Conflict-Facts

Der konkrete Adapter für einen echten Anbieter ist **nicht** Teil dieses Tasks.

### Konflikte / Deduplizierung

Wenn mehrere normalisierte Zeilen denselben fachlichen Fact-Schlüssel betreffen:

- semantisch identische Duplikate dürfen deterministisch dedupliziert werden,
- widersprüchliche decision-relevante Semantik muss sichtbar konfliktbehaftet bleiben,
- Input-Reihenfolge darf das Ergebnis nicht ändern,
- ein Konflikt darf nicht von einem zweiten „sauberen“ Fact so umgangen werden, dass Jetnity unbegründet eine eindeutige Warn-/Entwarnentscheidung behauptet.

Evidence-URL-Unterschied allein ist nicht zwingend ein semantischer Konflikt, sofern die fachliche Aussage identisch ist.

---

## 8. Phase 4 – Reisebezug / Relevance Engine

Baue eine deterministische Relevance Engine, die External Facts gegen die **bestehende Reise-Wahrheit** auswertet.

Mindestens berücksichtigen, soweit aktuelle Jetnity-Facts vorhanden sind:

### 8.1 Stages / Ziele

- konkreter Stage-/Place-Kontext
- Country nur als grobe Grenze, wenn Source selbst nur Country-Level liefert
- Mehrzielreise: genau betroffene Etappe identifizieren

### 8.2 Route / Transit

Foundation-D-Route Truth wiederverwenden:

- Flight Route
- Transit Airports / Länder
- Origin/Destination
- Route-Änderungen

Ein Transit-Ereignis darf eine Route betreffen, ohne das Endziel pauschal als betroffen zu markieren.

### 8.3 Reisebestandteile

Wenn anhand vorhandener strukturierter Facts belegbar:

- Unterkunft
- Aktivität
- Mobilität / Transfer
- Mietwagen
- Tagesplan / Tag
- gebuchte / ausgewählte Reisebestandteile

Keine Betroffenheit aus Titeltexten raten.

### 8.4 Zeit

- konkreter Reisezeitraum
- Stage-/Item-/Day-Zeiten, soweit strukturiert vorhanden
- Event-Zeitfenster

### 8.5 Unklarheit

Wenn für eine präzise Zuordnung relevante Trip- oder Event-Geodaten fehlen:

- nicht breit raten,
- `insufficient_context` / `unknown` liefern,
- ggf. als „prüfen“ statt Warnung behandeln.

---

## 9. Phase 5 – Cross-Domain Impact Graph / nächste Aktion

Safety darf nicht bei „Warnung anzeigen“ enden.

Die Foundation muss aus einer Safety-Evaluation **deterministisch ableiten können, welche Reisebereiche erneut geprüft werden sollen**, ohne diese Bereiche automatisch zu ändern.

Beispiele:

- Stage/Region betroffen → Unterkunft, Aktivitäten, Tagesplan, lokale Mobilität prüfen
- Airport/Transit betroffen → Flight, Transit, Transfer, Readiness prüfen
- Erreichbarkeit betroffen → Unterkunft/Activity/Mobility-Verbindungen neu bewerten
- offizieller starker Hinweis auf eine konkrete Etappe → betroffene Stage + relevante Buchungs-/Readiness-Kontexte anzeigen

Implementiere einen provider-neutralen Impact-/Dependency-Output mit stabilen Domain-Refs, soweit aktuelle Architektur dies erlaubt.

Wichtig:

- `affected` / `needs_recheck` / `unknown` semantisch trennen.
- Keine Buchung stornieren.
- Keine Stage löschen.
- Keine Route ersetzen.
- Keine Empfehlung als bereits übernommene Änderung speichern.

Das globale Änderungsprinzip bleibt:

> **Änderung erkennen → Auswirkungen auf Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen.**

In dieser Foundation genügt die belastbare Impact-/Recheck-Naht; der spätere große Workspace-/Change-Flow darf hier nicht vorweggebaut werden.

---

## 10. Phase 6 – Fingerprint / Freshness / Reevaluation

Safety ist zeitabhängig und tripabhängig.

Baue einen deterministischen Kontext-/Evaluation-Fingerprint oder gleichwertige Invalidation-Logik, der nur relevante Facts berücksichtigt.

Mindestens testen:

- Stage hinzufügen/entfernen/ändern
- Reisezeitraum ändern
- Route-/Transitänderung
- Event-Scope ändern
- Event-Zeitfenster ändern
- Evidence-Freshness ändert sich
- Event wird resolved/withdrawn
- reine Array-/Input-Reihenfolge ändert sich => kein semantischer Fingerprintwechsel
- unabhängige Reisebestandteile dürfen nicht unnötig alles stale machen, wenn fachlich keine Abhängigkeit besteht

Kein stale Safety-Fact darf still aktuell bleiben.

Falls keine Persistenz existiert, muss trotzdem klar definiert sein, wann neu evaluiert wird und wie stale/unknown an der API-/Service-Grenze repräsentiert wird.

---

## 11. Phase 7 – API / Server Boundary / Abuse-Schutz

Falls eine API-/Server-Action-Grenze für die Foundation sinnvoll ist, gelten mindestens:

- nur serverseitig erzeugte External Evidence
- Client darf nur validierten Trip-/UI-Kontext senden, soweit überhaupt nötig
- Request-Größenlimits
- Content-Type-Check
- Zod/Runtime-Validation
- keine Provider-Secrets im Client
- `Cache-Control` passend zu persönlichem Trip-Context und Freshness
- fail-closed bei Timeout/Provider unavailable
- kein Fake-Fallback
- Preview-/Development-Rate-Limit mindestens nach bestehendem Muster
- dokumentieren, dass vor kostenpflichtiger Production-Provideraktivierung ggf. ein global persistentes Rate-Limit nötig ist

Bevorzugt bestehende Trip-/Server-Wahrheit laden statt Browser-Facts zu vertrauen, wo Account-Trip-Daten serverseitig verfügbar sind.

Guest-Reisen dürfen validierte lokale Nutzer-Facts liefern, aber niemals Official Evidence.

---

## 12. Phase 8 – minimale UX-Integration, keinen großen Workspace-Umbau vorwegnehmen

Diese Foundation muss beweisen, dass Safety-Evaluations fachlich verständlich darstellbar sind. Sie soll aber **nicht** den späteren großen Workspace-/Übersicht-Umbau aus `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md` vorziehen.

Ziel:

- kleine, saubere Integrationsnaht in den bestehenden Workspace / Audit Harness,
- echte Evaluation kann später unter `Jetzt wichtig` / Warnungen priorisiert werden,
- keine permanente leere „Safety“-Karte nur um ein Feature sichtbar zu machen,
- ohne Live-Provider keine Fake-Warnungen,
- falls Provider unavailable: keine dramatische Fehlermeldung; nur dort `unknown/unavailable`, wo der Nutzer tatsächlich einen Safety-Status erwartet.

Warnungsdarstellung mit echten kontrollierten Testdaten muss zeigen:

- semantische Klasse als Text, nicht nur Farbe
- konkret betroffene Etappe / Route / Teil der Reise
- kurze sachliche Begründung
- Aktualität / Quelle progressiv nachvollziehbar
- sinnvolle nächste Prüfaktion
- keine alarmistische Sprache
- kein versteckter automatischer Änderungsbutton

Geräteparität:

- Smartphone
- Tablet
- Laptop/Desktop
- Portrait/Landscape, soweit vorhandener Audit dies abdeckt
- Touch/Keyboard-Bedienbarkeit
- Safe Areas / Zoom / Text Scaling nicht verschlechtern

---

## 13. Phase 9 – keine falsche Safety/Seasonality-Vermischung

Travel Safety & Disruption und Travel Timing & Seasonal Intelligence sind getrennte Domains.

In diesem Block **nicht** als akute Safety-Warnung modellieren:

- typische Monsunzeit ohne akutes Event
- übliche Hurrikansaison ohne konkretes Ereignis
- normale saisonale Hitze/Kälte
- historische Regenwahrscheinlichkeit
- saisonale Schließzeiten

Diese Themen gehören in den **nächsten separaten Seasonal-Foundation-Block**.

Akutes aktuelles Hochwasser / aktiver Wirbelsturm / konkreter Waldbrand etc. gehört Safety, wenn belastbare Evidence vorhanden ist.

---

## 14. Phase 10 – Persistenz / DB nur wenn fachlich begründet

Der Default dieses Tasks ist **keine unnötige neue Persistenz**.

Wenn der Audit zeigt, dass für eine belastbare Foundation eine DB-Struktur zwingend nötig ist, dokumentiere vor Implementierung:

- warum reine Derived Evaluation nicht genügt,
- welche Daten wirklich persistiert werden,
- Lizenz-/Caching-/Retention-Auswirkungen späterer Provider,
- Owner-/Trip-/Cross-User-Invarianten,
- RLS/FKs,
- Freshness/Deletion,
- Guest/Account-Verhalten.

Dann:

- Migration nur auf Development,
- neue RLS-/Security-/Parallelitätstests,
- keine Production-Migration ohne separates Product-Owner-Gate.

Keine Source-Rohpayloads oder unnötige externe personenbezogene Daten persistieren.

---

## 15. Pflicht-Testmatrix

Mindestens folgende Szenarien als Unit-/Domain-/Integration-/UI-Tests, passend zur Architektur:

### Evidence / Provider

1. Provider fehlt => `unavailable` / keine Fake-Warnung.
2. Provider throw/timeout => fail closed.
3. malformed Provider-Response => verworfen / unknown.
4. stale Evidence => nicht als current Warning weiterverwenden.
5. resolved/withdrawn Event => nicht still aktiv.
6. semantisch identische Duplikate => deterministisch dedupliziert.
7. widersprüchliche decision-relevante Duplikate => konfliktbehaftet / kein order-dependent Ergebnis.
8. umgekehrte Provider-Reihenfolge => identisches Resultat.

### Raum / Zeit / Reisebezug

9. Kritisches Event betrifft genau **eine** Etappe einer Mehrzielreise.
10. Event im selben Land, aber klar außerhalb der konkreten Reisezone => keine pauschale Warnung.
11. Country-Level Official Warning => darf Country-Level-Relevanz erzeugen, aber keine erfundene regionale Präzision.
12. Transit-Airport betroffen, Ziel selbst nicht => Route/Transit markiert, Destination nicht pauschal.
13. Event-Zeitfenster endet vor Reisebeginn => keine aktive Betroffenheit.
14. Event beginnt erst nach Reiseende => keine aktive Betroffenheit.
15. unklare Geo-Evidence => insufficient context statt geratenem Match.

### Cross-Domain

16. betroffene Stage => relevante Hotel/Activity/Mobility/Day-Plan-Refs werden als recheck-Kandidaten geliefert, soweit strukturiert verknüpfbar.
17. betroffener Transit => Flight/Transfer/Readiness-Recheck, keine stille Routeänderung.
18. unabhängige Stage bleibt unbetroffen.
19. keine Cross-Trip-/Cross-User-Referenz, falls persistierte IDs beteiligt sind.

### Freshness / Fingerprint

20. Stage-Änderung verändert relevante Evaluation.
21. Route-/Transitänderung verändert relevante Evaluation.
22. Datumsänderung verändert relevante Evaluation.
23. reine Array-Reihenfolge verändert die Fachsemantik nicht.
24. Source-Freshness-Wechsel invalidiert alte Bewertung.

### UX / Accessibility

25. Warnungsstufe ist ohne Farbe verständlich.
26. betroffener Reiseteil ist klar benannt.
27. Source/Freshness ist progressiv zugänglich.
28. keine automatische Änderungswirkung.
29. mehrere Hinweise werden deterministisch und ohne Alarmmüdigkeit priorisiert.
30. Smartphone/Tablet/Desktop bleiben verständlich.

### Safety vs Seasonal

31. nur saisonales typisches Muster ohne akutes Ereignis => **keine Safety-Warnung**.

Ergänze weitere Tests, wenn der Ist-Audit konkrete Risiken zeigt.

---

## 16. Security-/Truth-Audit im Block

Prüfe explizit:

- untrusted provider payload
- XSS/HTML/URLs in Source-/Event-Feldern
- oversized payloads
- stale replay
- duplicate/conflicting facts
- client-injected Evidence
- source spoofing / fehlende Authority
- cross-trip refs
- cross-user refs
- Secret-Leakage
- logs mit Provider-Rohdaten
- falsches `safe` bei unavailable
- falsche Landes-Pauschalisierung
- LLM-/OpenAI-Code als Safety-Truth-Pfad

Wenn HTML/Markdown aus externer Quelle später möglich wäre: Raw HTML niemals ungeprüft rendern. Bevorzugt normalisierte Plain-Text-Felder und sichere Links.

---

## 17. Definition of Done – Foundation

Der Block ist technisch erst reviewbereit, wenn mindestens gilt:

- Architektur-Audit versioniert
- provider-neutrale Safety-Domäne vorhanden
- Provider-Port + Factory/Kill-Switch vorhanden
- Live-Provider bleibt aus
- strikte Normalisierung / Evidence / Freshness vorhanden
- räumlich + zeitlich konkrete Relevance Engine vorhanden
- Foundation-D Route Truth wiederverwendet
- Foundation-E Traveller Truth nur bei echter Relevanz genutzt, nicht dupliziert
- Cross-Domain Impact-/Recheck-Output vorhanden
- kein automatisches Mutieren der Reise
- Safety vs Seasonal sauber getrennt
- keine Fake-Warnungen ohne Provider
- minimale UX-/Audit-Integration vorhanden, ohne großen Workspace-Umbau vorwegzunehmen
- Pflicht-Testmatrix grün
- Full Test Suite grün
- Typecheck / Lint / Hygiene grün
- Production Build grün
- bestehende DB-Security/RLS-Gates grün
- falls DB geändert: neue Development-DB-Security-/RLS-/Parallelitätstests grün
- UI-Audit auf vorhandener vollständiger Device-/Viewport-Matrix grün
- GitHub Actions auf exakt finalem Head grün
- Vercel Preview auf exakt finalem Head READY/SUCCESS
- Branch vor Abschluss **0 hinter aktuellem `main`**
- Production unverändert
- Draft PR bleibt Draft

---

## 18. Pflicht-Dokumentation während des Blocks

Mindestens neu/aktualisiert:

- `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ARCHITECTURE_AUDIT.md`
- `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ACCEPTANCE.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` / neue ADRs
- `ROADMAP.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `JETNITY_HANDOFF.md`
- ggf. `docs/DATENBANK.md`, falls DB wirklich geändert wird
- ggf. `types/supabase.ts`, falls DB geändert wird
- relevante Provider-/Security-/UX-Dokumentation

Die Dokumentation muss am Ende tatsächliche Branch-/PR-/Head-/CI-/Vercel-/Development-/Production-Zustände enthalten. Keine zukünftigen Behauptungen als erledigt markieren.

---

## 19. Unabhängiger Review / Stop-Kriterium

Nach Cursor-Implementierung folgt ein unabhängiger ChatGPT-Review gegen den **tatsächlichen finalen PR-Head**.

Der Review muss insbesondere tief prüfen:

- Safety-Truth / Evidence / Freshness
- räumliche und zeitliche Relevanz
- Country-Pauschalisierung
- Provider-Konflikte / Order-Independence
- Route-/Transit-Integration
- Cross-Domain-Impact
- Safety-vs-Seasonal-Grenze
- Guest/Account-Grenzen
- Security / RLS / Cross-User / Cross-Trip, soweit relevant
- Provider-disabled Production-Verhalten
- UI-Semantik / Accessibility / Device-Parität
- Rollout-/Migration-Grenze

Nicht wegen theoretischer Mikro-Perfektion endlos verlängern. Merge-blocking sind nur konkrete/reproduzierbare oder direkt code-derived Defekte mit relevantem Einfluss auf:

- Safety-/Evidence-Truth
- falsche räumliche/zeitliche Betroffenheit
- falsche Entwarnung / falsche kritische Warnung
- Cross-Domain-Wahrheit
- Datenverlust / Source-of-Truth
- Security / Cross-User / Cross-Trip
- Production-Rollout / Migration
- zentrale Foundation-Funktion

Style, hypothetische Providerdetails, die erst mit einem echten Adapter prüfbar werden, oder reine Mikro-Härtungen ohne konkreten Impact verlängern diesen Foundation-Block nicht.

---

## 20. Was ausdrücklich NICHT in diesen Task gehört

- kein echter Safety-/Disruption-Provider
- kein Timatic / Travel-Requirements-Provider
- keine Safety-Webscraping-Productionlösung
- keine Weather-/Government-API-Auswahl oder Vertrag
- keine neuen laufenden Providerkosten
- keine Production-Migration
- kein großer Workspace-/Homepage-Umbau
- keine finale Homepage-Positionierung
- keine Seasonal-Foundation
- keine automatische Umbuchung/Stornierung/Reiseänderung
- keine Passnummern/Scans/MRZ/Biometrie
- kein LLM als Safety-Truth-Quelle

---

## 21. Abschlussmeldung des Cursor-Agenten

Wenn der Block aus Cursor-Sicht fertig ist, antworte nicht nur „fertig“.

Melde mindestens:

- Branch
- Draft-PR-URL
- finaler Head SHA
- aktuelle `main` SHA / ahead-behind
- Architekturentscheidungen
- ob DB geändert wurde; wenn ja welche Development-Migrationen und warum
- Production unverändert bestätigt
- Testzahlen
- DB-/Security-Ergebnisse
- UI-Audit-Ergebnisse + Browser/Viewports
- GitHub Actions Run + Ergebnis
- Vercel Preview + Ergebnis
- bekannte Nicht-Blocker / technische Schulden
- exakter Status für unabhängigen ChatGPT-Review

**Kein Mark Ready, kein Merge und keine Production-Migration ohne neue ausdrückliche Product-Owner-Freigabe.**