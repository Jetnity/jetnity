# Jetnity – Travel Safety & Disruption Intelligence Policy

Stand: 22. August 2026  
Status: **verbindliche Produkt- und Wahrheitsregel**

## 1. Zweck

Jetnity soll relevante Sicherheits- und Störungsereignisse erkennen können, wenn sie eine konkrete geplante oder laufende Reise betreffen. Dazu gehören insbesondere Ereignisse wie bewaffnete Konflikte/Krieg, schwere politische Unruhen, Erdbeben, Tsunami, Vulkanaktivität, Hochwasser, Waldbrände, Wirbelstürme sowie andere belastbar belegte Ereignisse mit erheblicher Reiseauswirkung.

Die Funktion ist kein allgemeiner Nachrichtenfeed. Sie soll ausschließlich dann sichtbar werden, wenn ein Ereignis für die konkrete Reise, Route, Etappe, Region, Zeit oder Reiseentscheidung des Nutzers relevant ist.

Leitsatz:

> **Warnen, wenn es die konkrete Reise betrifft – nicht pauschal alarmieren.**

## 2. Evidence- und Wahrheitsprinzip

Jetnity darf niemals allein durch ein Sprachmodell entscheiden, dass ein Ziel oder eine Region gefährlich ist.

Verbindlich:

- Sicherheits-/Disruption-Truth muss aus belastbaren, aktuellen und fachlich geeigneten Quellen stammen.
- Relevante Facts müssen mindestens Quelle/Authority, Aktualität, räumlichen Geltungsbereich und Ereignis-/Warnkontext nachvollziehbar machen.
- Ein Sprachmodell darf diese Information erklären, zusammenfassen oder priorisieren, aber nicht die zugrunde liegende Gefahren-/Warnwahrheit erzeugen.
- Bei unzureichender Evidence gilt `unknown` / `insufficient context`; keine Scheinsicherheit.
- Keine pauschale Warnung für ein ganzes Land, wenn nur eine klar abgegrenzte Region betroffen ist und belastbare Daten eine feinere Einordnung erlauben.
- Keine Entwarnung, wenn die Datenlage nicht ausreicht.

## 3. Reisebezug statt Nachrichtenlogik

Ein Ereignis ist für Jetnity nur dann produktrelevant, wenn es eine konkrete Reise beeinflussen kann.

Zu prüfen sind insbesondere:

- geplante Reiseziele / `trip_stages`
- Transit- und Flugroute
- Flughäfen / Bahnhöfe / Transfers
- Unterkunftsregion
- Aktivitäten / Tagesplan
- Reisezeitraum
- bereits gebuchte oder ausgewählte Reisebestandteile

Beispiel:

Ein Erdbeben in einem Land führt nicht automatisch zu einer Warnung für jede Reise in dieses Land. Jetnity muss prüfen, ob die konkret geplante Region, Verbindung oder Zeit tatsächlich betroffen oder vernünftigerweise erneut zu prüfen ist.

## 4. Prioritätsklassen

Die Oberfläche soll mindestens zwischen folgenden semantischen Ebenen unterscheiden:

1. **Kritische Warnung** – ernstes, belastbar belegtes Risiko oder offizielle starke Warnung mit hoher Reiseauswirkung.
2. **Wichtiger Reisehinweis** – relevantes Ereignis, das eine Etappe, Route, Buchung oder Entscheidung wahrscheinlich beeinflussen kann und geprüft werden sollte.
3. **Information / beobachten** – potenziell relevant, aber aktuell keine belastbare Grundlage für eine stärkere Warnung.

Diese Ebenen dürfen nicht nur über Farbe vermittelt werden.

Alarmmüdigkeit ist zu vermeiden. Nicht jede externe Meldung darf den Nutzer unterbrechen.

## 5. Trip Workspace / Übersicht

Der Trip Workspace ist die primäre Stelle für reiserelevante Warnungen.

Die Übersicht muss relevante Safety-/Disruption-Hinweise in die intelligente Priorisierung aufnehmen können, z. B. unter `Jetzt wichtig`, `Warnungen` oder einem gleichwertigen klaren Bereich.

Dabei gilt:

- Kritische Warnungen dürfen wichtige normale Planungshinweise überpriorisieren.
- Die Warnung muss erklären, **welcher Teil der Reise** betroffen ist.
- Quelle/Aktualität müssen bei Bedarf nachvollziehbar sein.
- Der Nutzer soll eine sinnvolle nächste Aktion erhalten, nicht nur Angstinformation.

Mögliche Aktionen:

- betroffene Etappe prüfen
- Route erneut prüfen
- Alternative Region / Verbindung suchen
- Unterkunft / Aktivität prüfen
- Auswirkungen auf andere Reisebereiche anzeigen

## 6. Cross-Domain-Intelligence

Safety & Disruption ist keine isolierte Karte.

Wenn ein Ereignis einen wichtigen Reisefakt betrifft, muss Jetnity relevante Folgeeffekte bestimmen können, z. B.:

- Ziel/Region betroffen → Unterkunft, Aktivitäten, Tagesplan, Mobilität prüfen
- Flughafen/Route betroffen → Flug, Transit, Transfer, Readiness und Anschlussplanung prüfen
- Naturereignis → regionale Erreichbarkeit und gebuchte Leistungen neu bewerten, soweit Evidence vorhanden
- offizielle Reisewarnung → betroffene Etappe und relevante Traveller-/Readiness-Kontexte sichtbar machen

Verbindliches Änderungsprinzip bleibt:

> **Änderung erkennen → Auswirkungen auf die Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen.**

Jetnity darf keine Reiseetappe, Buchung oder Route aufgrund einer Warnung still ändern oder entfernen.

## 7. Verhältnis zu Readiness und Traveller Context

Travel Safety & Disruption ist fachlich verwandt mit Readiness, aber nicht identisch.

- `Travel Readiness` beantwortet, welche offiziellen Einreise-/Dokumentanforderungen für Traveller gelten und was vorbereitet wurde.
- `Travel Safety & Disruption` beantwortet, ob externe aktuelle Ereignisse die konkrete Reise oder ihre Durchführung beeinflussen.

Beide dürfen gemeinsame Evidence-/Freshness-Prinzipien verwenden, aber keine gemeinsame unscharfe Truth erzeugen.

Traveller Context ist nur dann einzubeziehen, wenn ein Sicherheits-/Reisehinweis tatsächlich travellerabhängig ist. Keine unnötige Sammlung sensibler Daten.

## 8. Freshness / Reevaluation

Diese Funktion ist zeitabhängig.

Jetnity muss Safety-/Disruption-Facts erneut bewerten, wenn relevante Änderungen eintreten, insbesondere:

- Reisezeitraum ändert sich
- Ziel/Etappe ändert sich
- Route/Transit ändert sich
- relevante neue externe Evidence erscheint
- bestehende Evidence abläuft oder zurückgezogen wird

Veraltete Warnungen dürfen nicht still als aktuell weiterlaufen.

## 9. Provider-/Quellen-Gate

Vor produktiver Aktivierung müssen geeignete Quellen/Provider separat bewertet werden nach:

- Authority / Vertrauenswürdigkeit
- geografischer Abdeckung und Granularität
- Ereignistypen
- Aktualisierungsgeschwindigkeit
- Historie/Korrekturen
- Lizenz / erlaubter Anzeige und Weiterverarbeitung
- Rate Limits / Kosten
- Datenschutz / Datenhaltung
- strukturierte Geo-/Zeit-Metadaten
- Verfügbarkeit von Source-/Action-Links

Keine kostenpflichtige Aktivierung, kein Vertrag und keine neuen laufenden Kosten außerhalb der bestehenden Freigaberegeln.

## 10. UX-Regel

Warnungen müssen psychologisch verantwortungsvoll sein:

- konkret statt dramatisch
- Reisebezug statt pauschaler Angst
- Handlungsmöglichkeit statt Alarm ohne nächsten Schritt
- klare Trennung zwischen bestätigter Warnung, Hinweis und unbekannter Lage
- progressive Details statt Informationsüberlastung
- auf allen unterstützten Geräten gleich verständlich und fachlich gleich

## 11. Audit-Pflicht

Der finale Trip-Workspace Intelligence Audit muss Travel Safety & Disruption berücksichtigen, sobald die Funktion Bestandteil der betreffenden Ausbaustufe ist.

Mindestens zu prüfen:

- kritische Warnung für genau eine Etappe einer Mehrzielreise
- Ereignis im Land, aber außerhalb der konkreten Reisezone
- Route/Transit betroffen, Ziel selbst nicht betroffen
- Ereignis wird aufgehoben oder Evidence wird stale
- mehrere gleichzeitige Hinweise mit Priorisierung
- fehlende/unklare Evidence
- Cross-Domain-Auswirkungen und Nutzerfreigabe
- Smartphone/Tablet/Desktop

## 12. Priorität / Umsetzung

Die Produktfähigkeit ist **verbindlich**. Ihre konkrete Implementierungsphase wird separat priorisiert.

Sie verändert nicht die aktuell verbindliche Reihenfolge:

1. Foundation D abschließen
2. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document
3. zentralen Trip Workspace auf belastbarer Gesamtarchitektur optimieren

Safety & Disruption darf nicht als Schnelllösung in Foundation D hineingebaut werden. Die spätere Implementierung muss in die gemeinsame Reise-Wahrheit und Workspace-Priorisierung integriert werden.
