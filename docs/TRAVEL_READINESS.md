# Jetnity – Travel Readiness & Einreisebestimmungen

Stand: 20. August 2026
Status: verbindliche Produktanforderung, Umsetzung bewusst für den passenden Zeitpunkt vorgemerkt

## Ziel

Jetnity soll einen Nutzer nicht nur bei Flug, Hotel und Aktivitäten unterstützen, sondern ihm für **seine konkrete Reise** verständlich sagen, welche Einreise- und Vorbereitungsschritte noch nötig sind.

Die Funktion soll aus einer Reise eine persönliche Vorbereitungsliste erzeugen und dabei den tatsächlich verwendeten Reisepass, Wohnsitz, Route, Transitländer, Aufenthaltsdauer und Reisezweck berücksichtigen.

Verbindlicher Grundsatz:

> **Jetnity soll nicht nur sagen, wohin der Nutzer reist, sondern was er für genau diese Reise vor der Abreise noch erledigen muss und bis wann.**

## Reiseprofil

Für die reine Bestimmung von Einreisebedingungen soll Jetnity nur die Daten erheben, die wirklich benötigt werden.

Vorgesehen sind insbesondere:

- Staatsangehörigkeit bzw. Ausstellungsland des tatsächlich verwendeten Reisepasses
- optional mehrere Staatsangehörigkeiten/Reisepässe
- bevorzugter Reisepass für eine Reise
- Wohnsitzland, soweit für Regeln relevant
- Reisezweck, z. B. Tourismus
- Reisedauer und konkrete Route

Passnummern, Passkopien oder andere hochsensible Dokumentdaten sind für diese Funktion **nicht standardmäßig erforderlich** und sollen nicht ohne klaren zusätzlichen Nutzen erhoben werden.

## Persönliche Einreiseprüfung

Jetnity soll pro Reise und pro Grenzübertritt prüfen können:

- Visum / visumfreie Einreise / eVisa
- digitale Einreise- oder Anmeldeformulare
- Passgültigkeit und gegebenenfalls freie Passseiten
- Weiter- oder Rückreisenachweis
- Transitbestimmungen
- verpflichtende Versicherungs- oder Dokumentnachweise, soweit relevant
- verpflichtende Gesundheits-/Impfvorschriften für die Einreise
- weitere behördliche Einreiseanforderungen

Mehrländer- und Transitstrecken müssen als **gesamte Route** verstanden werden. Ein Transitland darf nicht ignoriert werden, nur weil es nicht das eigentliche Reiseziel ist.

Beispiel: Zürich → New York → Costa Rica muss auch mögliche Anforderungen des US-Transits berücksichtigen.

## Pflicht vs. Empfehlung

Jetnity muss klar zwischen zwei Kategorien unterscheiden:

1. **Rechtliche bzw. behördliche Einreisevoraussetzungen** – z. B. Visum, Einreiseformular oder verpflichtender Impfnachweis.
2. **Gesundheitliche oder praktische Empfehlungen** – z. B. Reiseimpfungen, Malariavorsorge oder freiwillige Versicherungen.

Empfehlungen dürfen niemals so dargestellt werden, als seien sie gesetzlich vorgeschrieben.

## Quellen und Vertrauensmodell

Ein Sprachmodell darf **nicht die maßgebliche Quelle** für Visa-, Pass-, Transit- oder Gesundheitsvorschriften sein.

Jetnity benötigt dafür eine professionelle, laufend aktualisierte und rechtlich geeignete Datenquelle bzw. Provider-Anbindung. Kandidaten wie IATA Timatic können später geprüft werden; die konkrete Providerentscheidung ist noch nicht festgelegt.

Anforderungen an die spätere Datenquelle:

- personalisierte Regeln nach Reisepass/Nationalität, Wohnsitz und Route
- Transit- und Multi-City-Unterstützung
- Visa-, Pass- und Gesundheitsanforderungen
- nachvollziehbare Aktualität
- rechtlich und kommerziell für Jetnity nutzbar
- möglichst offizielle/behördlich gespeiste Daten

Wo sinnvoll, soll Jetnity zusätzlich auf die zuständige offizielle Behörde verlinken.

Jede wichtige Aussage soll intern mit Quelle und Prüfzeitpunkt nachvollziehbar sein. Jetnity darf nicht so tun, als sei eine veraltete Regel aktuell.

## Travel-Readiness-Checkliste

Aus den Regeln entsteht eine persönliche, verständliche Vorbereitungsliste, zum Beispiel:

- Reisepass: geprüft
- Visum: nicht erforderlich / erforderlich / beantragen
- Einreiseformular: offen
- verpflichtende Impfnachweise: geprüft
- Weiterreisenachweis: erforderlich
- Versicherung: Empfehlung oder Pflicht klar gekennzeichnet

Die Oberfläche soll nicht mit Paragraphen überladen werden. Der Nutzer soll schnell erkennen:

- Was ist bereits in Ordnung?
- Was fehlt noch?
- Was ist verpflichtend?
- Was ist nur empfohlen?
- Bis wann muss etwas erledigt sein?
- Wo ist der offizielle Antrag bzw. die offizielle Information?

Eine Fortschrittsdarstellung wie „4 von 6 erledigt“ oder „Reisevorbereitung 80 %“ ist vorgesehen, wenn sie verständlich und nicht irreführend umgesetzt werden kann.

## Fristen und Erinnerungen

Jetnity kennt die Reisedaten und soll daraus konkrete Fristen ableiten können.

Beispiele:

- Einreiseformular frühestens bzw. spätestens X Stunden/Tage vor Einreise
- Visum rechtzeitig vor Abflug beantragen
- benötigte Dokumente vor dem ersten betroffenen Grenzübertritt erledigen

Später können daraus Erinnerungen und Pro-Funktionen entstehen. Free-/Pro-Grenzen werden hierfür noch nicht festgelegt; sie müssen über die zentrale spätere Entitlement-Schicht flexibel steuerbar sein.

## Verbindung mit dem Reisegraphen

Travel Readiness ist kein isolierter Ratgeber. Die Funktion soll auf dem strukturierten Jetnity-Reisegraphen aufbauen.

Wenn sich ein Flug, Reisedatum oder eine Route ändert, muss Jetnity prüfen können, ob dadurch auch betroffen sind:

- Visa-Gültigkeitszeiträume
- Einreiseanmeldungen
- Transitregeln
- Fristen
- Impfnachweise
- andere Reisevorbereitungsaufgaben

Das folgt dem bestehenden Jetnity-Grundsatz:

> Änderung erkennen → Auswirkungen bestimmen → neue Vorbereitungssituation erklären → Nutzer entscheiden lassen.

## Datenschutz

Da Staatsangehörigkeit und Reisedokumentinformationen personenbezogen und teilweise besonders sensibel für den Nutzer sind, gilt Datenminimierung.

- nur benötigte Attribute speichern
- keine Passnummer oder Passkopie für die Basisfunktion
- klare Transparenz, wofür Daten genutzt werden
- mehrere Reisepässe nur auf Wunsch
- sichere serverseitige Verarbeitung
- keine unnötige Weitergabe an Drittanbieter

Vor einer Provider-Anbindung müssen Datenschutz, Datenübermittlung, Auftragsverarbeitung und Schweizer DSG/DSGVO-Anforderungen geprüft werden.

## Richtiger Implementierungszeitpunkt

Diese Funktion soll **nicht während der aktuellen Phase 3.1 zusätzlich in die Flight-/Place-Arbeiten hineingemischt werden**.

Der sinnvolle Startpunkt ist, sobald folgende Grundlagen stabil genug sind:

1. kanonische reale Orte/Destinationen und Länderzuordnung
2. strukturierter Reisegraph mit Etappen und Reisedaten
3. belastbare Flug-/Routeninformationen inklusive Transit
4. Nutzerprofil kann benötigte Reiseprofil-Angaben sicher speichern

Danach soll Travel Readiness in Phase 3/4 vor der öffentlichen Launch-Reife umgesetzt werden, weil es dann echten Nutzen aus den bereits vorhandenen Reisedaten ziehen kann und nicht als paralleles Inselsystem gebaut werden muss.

Die genaue Reihenfolge darf der Hauptentwickler anhand des tatsächlichen Projektstands anpassen. Die Funktion darf nicht vergessen oder unnötig vorgezogen werden.

## Nicht jetzt bauen

Aktuell noch nicht:

- Timatic oder anderen Regelprovider vertraglich/API-seitig anbinden
- Passdokumente speichern
- Free-/Pro-Grenze festlegen
- automatische Erinnerungen aktivieren
- Production-Datenmodell erweitern

Erst die laufende Flight-/Place-Grundlage sauber abschließen.
