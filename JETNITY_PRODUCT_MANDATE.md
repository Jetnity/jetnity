# Jetnity – verbindliches Produkt- und Technologie-Mandat

Stand: 22. August 2026  
Status: **dauerhaft verbindlich für Product Owner, ChatGPT und alle Coding Agents**

Dieses Dokument ergänzt `JETNITY_VISION.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `docs/PRODUCT_QUALITY_STANDARD.md`, `docs/LOGIC_STANDARD.md`, `docs/CONTINUITY_STANDARD.md` und `docs/CHATGPT_CURSOR_WORKFLOW.md`.

Es beschreibt den dauerhaften Anspruch, mit dem Jetnity entwickelt wird. Es ist **kein Marketingversprechen und keine Behauptung, Jetnity sei bereits Marktführer**. Es ist das verbindliche Produkt- und Qualitätsziel, gegen das zukünftige Entscheidungen bewertet werden.

---

## 1. Verbindliches Ziel

Jetnity soll zum **führenden und für Nutzer besten intelligenten Reiseplanungs- und Reisebegleitungsprodukt seiner Kategorie** entwickelt werden.

Der Product Owner formuliert das Ziel ausdrücklich als:

> **Jetnity soll die Nummer 1 in seinem Bereich werden.**

Daraus folgt für Entwicklung und Produktentscheidungen:

- nicht nur „funktioniert“, sondern außergewöhnlich nützlich
- nicht nur „modern“, sondern langfristig tragfähig
- nicht nur viele Features, sondern die richtigen Features in überragender Qualität
- nicht nur gute Einzelmodule, sondern ein zusammenhängendes Reisesystem
- nicht nur hübsche Oberfläche, sondern messbare Zeitersparnis und weniger Reisestress
- nicht nur plausible Antworten, sondern belastbare Datenwahrheit
- nicht nur Preview-Qualität, sondern Production-Qualität

Die Marktführerschaft ist ein **Ziel**, kein Grund für unbelegte Superlative im Produkt oder für technische Übertreibung.

---

## 2. Was „das beste Tool“ für Jetnity bedeutet

Jetnity gewinnt nicht dadurch, dass es jede denkbare Reisefunktion besitzt.

Jetnity soll besser sein, weil es die komplette Reise **intelligenter zusammenführt** und dem Nutzer Arbeit abnimmt, die heute über viele Websites, Apps und manuelle Schritte verteilt ist.

Der Nutzer soll erleben:

- Ich komme schneller von der Reiseidee zu einer guten Reise.
- Jetnity versteht meine komplette Reise und nicht nur einzelne Suchanfragen.
- Ich muss bekannte Angaben nicht wiederholen.
- Jetnity erkennt Lücken, Konflikte und Abhängigkeiten automatisch.
- Jetnity zeigt wenige, gute und begründete Entscheidungen statt Option-Overload.
- Jetnity vergleicht nicht nur Preis, sondern auch Zeit, Komfort, Lage, Umstiege und Gesamtreibung.
- Änderungen an einem Teil der Reise werden auf Auswirkungen auf die gesamte Reise geprüft.
- Ich sehe, was gebucht, offen, unsicher oder erneut zu prüfen ist.
- Einreise-, Visa-, Pass-, Transit-, Impf-/Health- und Dokumentanforderungen sollen später automatisch und pro Reisendem aus vertrauenswürdigen Quellen erkannt werden.
- Jetnity sagt ehrlich `unknown`, wenn eine belastbare Aussage nicht möglich ist.
- Ich vertraue Jetnity genug, um meine nächste Reise wieder dort zu beginnen.

---

## 3. Produktkern bleibt fokussiert

„Nummer 1“ bedeutet **nicht Feature-Bloat**.

Neue Funktionen werden nur gebaut, wenn sie mindestens einen klaren Beitrag leisten zu:

- deutlich einfacherer Reiseplanung
- weniger Suchaufwand oder Doppelarbeit
- besseren Reiseentscheidungen
- weniger organisatorischem Stress
- höherer Verlässlichkeit und Sicherheit
- sinnvoller Nutzerbindung
- realistischem Umsatzpotenzial
- notwendigem technischem Unterbau für ein Kernfeature.

Nebenfunktionen dürfen den Kern nicht verwässern oder die Architektur unnötig aufblasen.

Der Kern bleibt:

**Reiseidee → strukturierte Reise → gute Auswahl → Buchungs-/Partnerübergabe → Reisevorbereitung → Änderungen verstehen → Reise zuverlässig begleiten.**

---

## 4. Eine Reise, ein zusammenhängendes System

Jetnity ist keine Sammlung unabhängiger Suchmaschinen.

Flüge, Unterkunft, Aktivitäten, Mobilität, Mietwagen, Tagesplan, Budget, Reisende, Präferenzen, Buchungsstatus, Reisevorbereitung und spätere Live-/Providerinformationen arbeiten um **denselben Reisegraphen**.

Verbindlich:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Wenn Jetnity einen relevanten Fakt bereits kennt, soll ein anderer Bereich ihn wiederverwenden, statt eine konkurrierende Wahrheit aufzubauen oder den Nutzer erneut danach zu fragen.

---

## 5. Top-Web-Technologie – aber ohne Technologie-Theater

Jetnity soll mit **erstklassiger moderner Web-Technologie und Architektur** entwickelt werden.

Das bedeutet:

- moderne, production-taugliche Webplattform
- mobile-first und responsive
- schnelle Interaktionen und geringe Ladezeiten
- starke TypeScript-Typisierung
- serverseitige sensible Logik
- saubere API-Grenzen
- klare Domain-Module und Verantwortlichkeiten
- strukturierte, versionierte Datenmodelle
- sichere Auth-/RLS-/Ownership-Grenzen
- gute Observability und nachvollziehbare Fehlerzustände
- automatisierte Tests und Regressionstests
- Browser-/Mobile-Audits
- Accessibility als Qualitätsmerkmal
- SEO dort, wo öffentlich relevant
- saubere Deployment-/Preview-/Production-Trennung
- provider-neutrale Architektur dort, wo reale externe Abhängigkeiten wechseln können
- kontrollierte Migrationen und Rollouts
- keine Secrets oder vertrauenswürdige Official Truth im Client.

„Top-Technologie“ bedeutet **nicht**, jedem Trend hinterherzulaufen.

Neue Frameworks, Libraries, Dienste oder Architekturformen werden nur eingeführt, wenn sie für Jetnity einen konkreten Vorteil bei Produktqualität, Performance, Sicherheit, Entwicklerproduktivität, Wartbarkeit oder Skalierbarkeit bringen.

Keine vorzeitigen Microservices. Keine unnötigen Abstraktionen. Keine Technologie nur für Prestige.

---

## 6. Architektur muss langfristig tragen

Jetnity soll so gebaut werden, dass Kernfunktionen wachsen können, ohne ständig neu entworfen werden zu müssen.

Dafür gelten dauerhaft:

- klare Domain-Grenzen
- eine maßgebliche Source of Truth pro fachlichem Fakt
- keine parallelen Mini-Systeme
- Datenwahrheit vor UI-Komfort
- Provideradapter an klaren Ports
- externe Provider dürfen nicht die interne Jetnity-Domain diktieren
- Guest und Account sollen fachlich dieselbe Produktlogik verwenden
- Änderungen müssen idempotent und nachvollziehbar sein, wo relevant
- Fehlerzustand und „keine Daten“ dürfen nicht gleichgesetzt werden
- bekannte Abhängigkeiten und technische Schulden bleiben dokumentiert
- migrationsfähige Datenmodelle
- Security und Datenschutz von Anfang an, nicht nachträglich.

Wenn eine kurzfristige Lösung später einen teuren Kernumbau erzwingen würde, soll vor Umsetzung eine bessere Architektur gewählt werden, sofern der zusätzliche Aufwand verhältnismäßig ist.

---

## 7. Datenwahrheit und Vertrauen sind Wettbewerbsvorteile

Jetnity darf niemals besser wirken, indem es mehr behauptet als seine Daten belegen.

Verbindlich:

- `unknown` bleibt `unknown`
- keine erfundenen Preise
- keine erfundenen Verfügbarkeiten
- keine erfundenen Visa-/Pass-/Impf-/Transitregeln
- keine LLM-Aussage als regulatorische Wahrheit
- keine stillen Annahmen, wenn strukturierter Kontext fehlt
- Nutzerangabe und offizielle Provider-Evidence bleiben getrennt
- alte oder ungültige Evidence darf nicht als aktuell erscheinen
- Empfehlungen müssen ihre fachliche Grundlage nachvollziehbar behalten.

Das Ziel ist nicht maximale Behauptungssicherheit in der Oberfläche, sondern maximale **Vertrauenswürdigkeit**.

---

## 8. Intelligenz soll Arbeit abnehmen

Jetnitys Intelligenz ist kein Chatfenster als Selbstzweck.

Sie zeigt sich daran, dass Jetnity:

- Reiseabsichten versteht
- bekannte Daten wiederverwendet
- Reiseelemente miteinander verbindet
- Auswirkungen von Änderungen erkennt
- sinnvolle Alternativen vorbereitet
- Preis gegen Zeit, Komfort und Reibung abwägt
- fehlende Informationen gezielt statt pauschal abfragt
- Reisevorbereitung automatisch strukturiert
- später offizielle Travel Requirements automatisch pro Reisendem und Route auswertet
- proaktiv auf echte relevante Änderungen reagieren kann
- dem Nutzer Entscheidungen erklärt, statt sie still zu treffen.

---

## 9. UX-Qualitätsanspruch

Jetnity soll sich wie ein hochwertiges Consumer-Produkt anfühlen, nicht wie ein internes Dashboard oder ein generisches SaaS-Template.

Verbindliche Ziele:

- mobile-first
- sehr einfache erste Nutzung
- möglichst wenig Pflichtfelder vor erkennbarem Nutzen
- progressive Offenlegung komplexerer Details
- klare Hierarchie und wenige primäre Entscheidungen
- keine unnötigen Tabs und Unterbereiche
- keine Sackgassen
- konsistente Begriffe und Status
- große, sichere Touch-Ziele
- gute Lesbarkeit
- Status nie ausschließlich über Farbe
- ruhige Premium-Wirkung
- schnelle Rückmeldung auf Aktionen
- Fehlermeldungen müssen verständlich und handlungsorientiert sein.

Die beste Architektur ist wertlos, wenn die Nutzeroberfläche ihre Vorteile nicht einfach nutzbar macht.

---

## 10. Performance, Reliability und Security gehören zum Produkt

Performance, Stabilität und Sicherheit sind keine spätere Optimierung.

Vor Production müssen relevante Kernpfade je nach Phase geprüft werden auf:

- Typecheck
- Lint
- Unit-/Domain-/Regressionstests
- Production Build
- Auth-/Security-Konfiguration
- Datenbankmigrationen und RLS
- WebKit und Chromium
- Mobile-Breiten und relevante Real-Device-Abnahmen
- CI
- Preview
- Production-Grenzen / Kill Switches
- mögliche Missbrauchs- oder Kostenpfade.

Ein bekannter kritischer Truth-, Security-, Datenintegritäts- oder Kernlogikfehler ist ein Merge-Blocker.

---

## 11. Monetarisierung darf die Nutzerentscheidung nicht korrumpieren

Jetnity soll wirtschaftlich stark werden.

Affiliate-/Providerprovisionen, Partnerangebote und spätere Premium-Funktionen sind legitim, aber:

> **Die für Jetnity lukrativere Option darf nicht vor einer für den Nutzer besseren Gesamtlösung gerankt werden.**

Vertrauen und langfristige Wiederkehr sind strategisch wichtiger als kurzfristige Klickoptimierung.

---

## 12. Jeder neue Chat und Agent muss den Gesamtstand rekonstruieren können

Ein neuer Chat oder Coding Agent darf Jetnity nicht aus einer alten Erinnerung oder einem einzelnen Prompt rekonstruieren.

Vor größerer Arbeit muss er mindestens verstehen:

### Was Jetnity ist

Aus:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `docs/LOGIC_STANDARD.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`

### Was Jetnity bereits kann / was gebaut wurde

Aus:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- relevanten Fach-Dokumenten unter `docs/`
- aktuellem `main`-/PR-/CI-/Production-Stand.

### Was noch fehlt oder blockiert ist

Aus:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- offenen Provider-/API-Abhängigkeiten
- aktuellen Draft-PRs und Tasks.

### Wie gearbeitet werden muss

Aus:

- `AGENTS.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `docs/CONTINUITY_STANDARD.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`.

Der Nutzer soll diese Informationen nicht in jedem neuen Chat erneut erklären müssen.

---

## 13. Dokumentation muss Zielbild und Ist-Stand trennen

Das Repository muss jederzeit unterscheiden können zwischen:

- **Vision / verbindlichem Ziel**
- **bereits umgesetzt**
- **Preview/Draft**
- **Development-only**
- **Production**
- **extern blockiert**
- **bewusst verschoben**.

Es ist verboten, eine Vision als bereits verfügbare Funktion zu dokumentieren.

Ebenso darf eine bereits verbindlich getroffene Produktentscheidung nicht nur in einem Chat verbleiben.

---

## 14. Qualitätsfrage vor jeder größeren Entscheidung

Vor einer größeren Produkt- oder Architekturentscheidung soll mindestens geprüft werden:

1. Macht das Jetnity für den Nutzer nachweislich einfacher oder besser?
2. Nutzt die Lösung den gemeinsamen Reisegraphen sinnvoll?
3. Entsteht eine neue konkurrierende Source of Truth?
4. Ist die Lösung sicher, wartbar und testbar?
5. Skaliert die Architektur für den realistischen nächsten Entwicklungsschritt?
6. Ist die UX auch mobil klar?
7. Kann ein neuer Agent später verstehen, warum diese Entscheidung getroffen wurde?
8. Wird eine externe Abhängigkeit ehrlich als solche behandelt?
9. Entstehen Kosten oder Lock-in?
10. Bringt uns diese Entscheidung näher an ein führendes Produkt – oder nur zu mehr Code?

---

## 15. Verbindlicher Merksatz

> **Jetnity soll die Nummer 1 werden, weil es Reisen einfacher, intelligenter, verlässlicher und ganzheitlicher macht – getragen von erstklassiger Web-Technologie, sauberer Architektur, belastbarer Datenwahrheit und einem außergewöhnlich einfachen Nutzererlebnis.**

Und weiterhin unverändert:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**
