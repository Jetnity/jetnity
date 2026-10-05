# Jetnity – Multi-Citizenship & Passport Choice Readiness Amendment

Stand: 22. August 2026  
Status: **verbindliche Product-Owner-Entscheidung / zukünftige Readiness-Erweiterung vor echtem Requirements-Provider**

## 1. Produktentscheidung

Jetnity muss Reisende mit **mehreren Staatsbürgerschaften und mehreren nutzbaren Reisedokumenten** korrekt unterstützen.

Ein Reisender darf fachlich nicht dauerhaft auf genau eine Staatsbürgerschaft oder genau einen Pass reduziert werden.

Beispiel:

- Schweizer Staatsbürgerschaft + Schweizer Reisepass
- serbische Staatsbürgerschaft + serbischer Reisepass

Für eine konkrete Reise kann ein Dokument gegenüber einem anderen einen belegbaren Vorteil haben, z. B.:

- visumfreie Einreise statt Visumpflicht
- ETA/eVisa statt klassischem Visum
- günstigere / einfachere regulatorische Anforderungen
- bessere Transitbedingungen
- andere zulässige Aufenthaltsdauer
- andere Passgültigkeits-/Dokumentanforderungen

Jetnity soll solche Unterschiede automatisch erkennen, **aber nur auf Basis belastbarer Official-/Provider-Evidence**.

## 2. Harte Truth-Regeln

- Kein LLM entscheidet regulatorisch, welcher Pass „besser“ ist.
- Keine Visa-/Transit-/Health-/Pass-Aussage ohne belastbare Evidence.
- `unknown` bleibt `unknown`.
- Ein vermeintlicher Vorteil darf nie eine gesetzliche Pflicht überstimmen.
- Wenn ein Land eigene Staatsangehörige verpflichtet, mit einem bestimmten nationalen Dokument ein-/auszureisen, muss diese Regel Vorrang haben, sofern sie vom Provider/Official Evidence belegt ist.
- Jetnity darf kein unkontrolliertes „Pass-Hopping“ zwischen Grenzen empfehlen.
- Route, Transit, Einreise, Ausreise und ggf. Carrier-/APIS-Kontext müssen gemeinsam berücksichtigt werden, soweit die Provider-Evidence das unterstützt.

## 3. Ziel-Datenmodell

Foundation C modelliert aktuell nur ein singuläres `nationality_country_code` und ein Dokumentprofil je `trip_traveller`. Das ist für Mehrfachstaatsbürgerschaft nicht ausreichend und wird vor produktiver Requirements-Provider-Aktivierung erweitert.

Bevorzugte fachliche Richtung:

- ein stabiler Traveller
- 1:n Staatsbürgerschaften
- 1:n Reisedokumente
- je Dokument mindestens:
  - Dokumenttyp
  - ausstellendes Land
  - zugehörige Staatsangehörigkeit, falls erforderlich
  - Ablaufdatum nur soweit benötigt
- weiterhin **keine** Pass-/Ausweisnummern, Scans, Biometrie oder Dokumentvault in diesem Scope.

Konkretes Schema wird erst im zuständigen Implementierungsblock nach Architektur-/Security-Review festgelegt.

## 4. Requirements-Auswertung

Für eine konkrete Reise soll Jetnity mehrere **zulässige Credential-/Passport-Profile** separat gegen die tatsächliche Route auswerten.

Konzeptionell:

`Traveller + Citizenship/Document Option + Route/Transit + Datum + Provider Evidence -> Official Evaluations`

Anschließend darf Jetnity die belegten Optionen vergleichen.

Priorisierung:

1. gesetzliche Zulässigkeit / zwingende Dokumentpflicht
2. vollständige Route-/Transit-Kompatibilität
3. regulatorische Reibung (z. B. Visa > eVisa/ETA > visumfrei, nur wenn Evidence dies trägt)
4. weitere belegte Faktoren wie Fristen, Aufenthaltsdauer oder Kosten, nur wenn Provider diese zuverlässig liefert

Es darf keine erfundene Score-Logik geben, die regulatorische Wahrheit ersetzt.

## 5. UX

Die Oberfläche soll Mehrfachstaatsbürgerschaften nicht kompliziert wirken lassen.

Beispiel:

**Sasa · 2 Staatsbürgerschaften**

> Für diese Reise voraussichtlich am einfachsten: **Schweizer Reisepass**  
> Grund: visumfreie Einreise; serbischer Reisepass würde ein Visum erfordern.

Sekundäre Aktion:

`Alternativen anzeigen`

Dort kann Jetnity die anderen belegten Optionen erklären.

Wenn eine bestimmte Staatsbürgerschaft / ein bestimmtes Dokument zwingend verwendet werden muss, darf Jetnity nicht „empfohlen“ sagen, sondern muss die Pflicht klar formulieren.

Wenn Provider-Evidence fehlt oder Optionen nicht sicher vergleichbar sind:

> **Noch nicht zuverlässig vergleichbar.**

Keine Scheingenauigkeit.

## 6. Reiseänderungen / Freshness

Der Readiness Context Fingerprint muss künftig relevante Änderungen an der Menge der Staatsbürgerschaften und Dokumente berücksichtigen.

Änderungen können eine erneute Prüfung auslösen:

- Staatsbürgerschaft hinzugefügt/entfernt
- Dokument hinzugefügt/entfernt
- Dokumenttyp geändert
- ausstellendes Land geändert
- Ablaufdatum geändert
- ausgewählte/empfohlene Dokumentoption geändert
- Route/Transit/Destination/Datum geändert.

Alte Visa-/Transit-/Health-Ergebnisse dürfen danach nicht still als aktuell weitergelten.

## 7. Verhältnis zu Foundation D

Foundation D – Route & Transit Intelligence bleibt der aktive Arbeitsblock.

Foundation D muss:

- Route Facts provider-/traveller-neutral liefern;
- keine Architektur einführen, die nur eine Staatsbürgerschaft pro Reisendem voraussetzt;
- die spätere Auswertung mehrerer Credential-Profile ermöglichen.

Foundation D soll **nicht** eigenmächtig das Traveller-Production-Schema migrieren. Die eigentliche Multi-Citizenship-/Multi-Document-Erweiterung wird als eigener Readiness-Schritt vor echtem Timatic/Requirements-Provider umgesetzt und separat reviewed/freigegeben.

## 8. Provider-Gate

Ein echter Travel-Requirements-Provider darf erst produktiv aktiviert werden, wenn geklärt ist:

- unterstützt er Mehrfachstaatsbürgerschaften / mehrere Dokumentprofile fachlich ausreichend?
- können dieselbe Route und dieselben Reisenden mit unterschiedlichen Dokumentoptionen getrennt ausgewertet werden?
- liefert er Pflichten für eigene Staatsangehörige / Transit / Dokumentwahl zuverlässig?
- sind Kosten, Lizenz, Rate Limits und erlaubte Vergleichs-/Caching-Nutzung geklärt?

Timatic bleibt Kandidat, aber keine Architektur darf Timatic-spezifisch verhärtet werden.

## 9. Verbindlicher Merksatz

> **Jetnity bewertet nicht nur, wohin jemand reist, sondern auch mit welchen rechtlich nutzbaren Staatsbürgerschaften und Reisedokumenten die konkrete Reise am einfachsten und korrektesten möglich ist.**
