# Jetnity – Travel Timing & Seasonal Intelligence Policy

Stand: 22. August 2026  
Status: **verbindliche Produkt- und Wahrheitsregel**

## 1. Zweck

Jetnity soll erkennen können, wenn ein gewählter Reisezeitraum für ein konkretes Ziel oder eine konkrete Etappe typischerweise mit deutlich ungünstigeren saisonalen Bedingungen zusammenfällt.

Beispiele:

- Monsun-/starke Regenzeit
- Hurrikan-/Taifun-/Zyklonsaison
- ausgeprägte Hitzeperioden
- extreme Kälte / Winterbedingungen
- Waldbrand-/Rauchsaison
- Hochwasser-/Starkregenperioden
- saisonale Schnee-/Lawinenrisiken, soweit reisebezogen und belastbar
- saisonale Erreichbarkeits-/Schließzeiten
- andere belastbar belegte saisonale Muster mit erheblicher Auswirkung auf Reisequalität, Durchführbarkeit oder Risiko

Die Funktion soll dem Nutzer helfen, **eine bewusstere Zeitentscheidung** zu treffen. Sie darf seine Entscheidung nicht bevormunden.

Leitsatz:

> **Bessere Reisezeit erkennen und erklären – Entscheidung beim Nutzer lassen.**

## 2. Verhältnis zu Travel Safety & Disruption

Travel Timing & Seasonal Intelligence ist eng mit `Travel Safety & Disruption Intelligence` verbunden, aber nicht dieselbe Wahrheit.

- `Travel Safety & Disruption` behandelt akute bzw. aktuelle Ereignisse und offizielle Warnlagen.
- `Travel Timing & Seasonal Intelligence` behandelt vorhersehbare, wiederkehrende oder historische saisonale Muster für einen geplanten Zeitraum.

Beispiel:

- `September fällt typischerweise in die Hurrikansaison` = saisonaler Kontext.
- `Für deine konkrete Region besteht aktuell eine Hurrikanwarnung` = akute Safety-/Disruption-Truth.

Jetnity darf diese beiden Ebenen nicht vermischen.

## 3. Kein pauschales Urteil „schlechte Saison“

Jetnity darf eine Reisezeit nicht allein aufgrund eines groben Monatslabels als `schlecht`, `gefährlich` oder `ungeeignet` einstufen.

Verbindlich:

- Region statt nur Land berücksichtigen, wenn Daten dies erlauben.
- konkrete Reisedaten statt nur Monat berücksichtigen.
- saisonale Muster als Wahrscheinlichkeit/typischen Kontext behandeln, nicht als exakte Vorhersage.
- unterschiedliche Reiseziele und Reisearten können dieselbe Saison unterschiedlich bewerten.
- mögliche Vorteile ungünstigerer Saisons dürfen erwähnt werden, wenn belastbar: z. B. weniger Besucher oder niedrigere Preise.
- keine erfundenen Wetterwahrscheinlichkeiten, Saisonwerte oder Risiken.

Bei unzureichender Datenlage gilt `unknown` / `insufficient context`.

## 4. Evidence- und Wahrheitsklassen

Jetnity muss zwischen mindestens folgenden Informationsarten unterscheiden:

1. **Seasonal Pattern / Klimatologie** – historische oder langfristige typische Bedingungen.
2. **Official Seasonal Risk Window** – offiziell definierte oder fachlich belastbare saisonale Risikoperiode.
3. **Forecast / Near-term Outlook** – zeitnahe Prognose, nur wenn geeignete Quelle und Zeitraum dies zulassen.
4. **Active Warning / Event** – aktuelle konkrete Warnung oder Störung; gehört in Travel Safety & Disruption.

Ein Sprachmodell darf erklären und zusammenfassen, aber keine dieser Wahrheiten erfinden.

## 5. UX und Nutzerkontrolle

Wenn Jetnity einen relevanten saisonalen Nachteil erkennt, soll die Information ruhig, konkret und handlungsorientiert sein.

Beispiel:

> **Reisezeit prüfen**  
> Dein Aufenthalt fällt in dieser Region typischerweise in die stärkere Regenzeit. Das muss deine Reise nicht ausschließen, kann aber Outdoor-Aktivitäten und Transfers beeinflussen.

Mögliche Aktionen:

- `Trotzdem so planen`
- `Bessere Reisezeiten ansehen`
- `Auswirkungen auf meine Reise prüfen`
- `Alternative Daten vergleichen`

Jetnity darf Datum, Ziel oder Etappen **niemals automatisch ändern**.

Wenn der Nutzer bewusst bei seiner Entscheidung bleibt, wird dies respektiert. Jetnity darf relevante aktuelle Warnungen später trotzdem erneut anzeigen, wenn die Safety-/Disruption-Lage sich ändert.

## 6. Intelligente Alternativen

Wenn belastbare Daten vorhanden sind, darf Jetnity alternative Zeiträume vorschlagen.

Dabei sollen nicht nur Wetter-/Saisonfaktoren betrachtet werden, sondern – soweit echte Daten vorhanden sind – auch relevante Trade-offs wie:

- Wetter-/Saisonqualität
- Reiseintensität / Besucherandrang
- Preise
- Verfügbarkeit
- saisonale Aktivitäten
- Tageslicht / Öffnungszeiten
- Transport-/Erreichbarkeitsbedingungen

Jetnity soll nicht behaupten, eine alternative Zeit sei objektiv besser, wenn die Bewertung von Nutzerwünschen abhängt.

## 7. Cross-Domain-Intelligence

Ein saisonaler Hinweis ist keine isolierte Info-Karte.

Wenn er für die konkrete Reise relevant ist, kann Jetnity Auswirkungen prüfen auf:

- Aktivitäten / Outdoor-Plan
- Mobilität / Transfers
- Insel-/Fährverbindungen
- Mietwagen / Straßenbedingungen
- Unterkunftslage
- Tagesplan
- Budget / Preisniveau, sofern echte Daten vorliegen
- Safety & Disruption bei später eintretenden aktuellen Ereignissen

Beispiel:

Eine ausgeprägte Regenzeit muss nicht bedeuten, dass das Ziel vermieden werden soll, kann aber dazu führen, dass Jetnity mehr wetterunabhängige Aktivitäten oder robustere Transfers empfiehlt.

## 8. Zeitpunkt der Hinweise

Jetnity soll Timing-/Seasonality-Kontext dort zeigen, wo er eine echte Entscheidung verbessert:

- bei Auswahl oder Änderung von Ziel + Reisedatum
- im Trip Workspace unter `Jetzt wichtig` bzw. Empfehlungen, wenn der Effekt erheblich ist
- vor weitreichenden Buchungsentscheidungen, wenn der saisonale Kontext relevant ist
- nach Datumsänderungen erneut

Keine permanente Alarmbox für normale saisonale Schwankungen.

## 9. Freshness / Neubewertung

Seasonal Patterns können länger gültig sein als akute Warnungen, brauchen aber trotzdem Quelle und Version/Freshness.

Neu bewerten bei:

- geändertem Reisedatum
- geändertem Ziel / Region / Etappe
- geänderter Route, wenn saisonale Transit-/Transportfolgen relevant sind
- neuen oder aktualisierten Quellen
- Übergang von langfristiger Planung in einen Zeitraum, in dem konkrete Forecasts/Warnings verfügbar werden

Dann kann ein allgemeiner saisonaler Hinweis durch konkrete aktuelle Information ergänzt oder ersetzt werden.

## 10. Provider-/Quellen-Gate

Vor produktiver Aktivierung müssen geeignete Datenquellen nach folgenden Kriterien bewertet werden:

- geografische Granularität
- saisonale/historische Datenqualität
- offizielle Risikozeiträume, soweit vorhanden
- Prognosehorizont und Qualität
- Aktualität
- Lizenz / Caching / Anzeige
- API-Zuverlässigkeit
- Kosten / Rate Limits
- Datenschutz

Keine laufenden Kosten oder Provider-Aktivierung ohne die bestehenden Freigaberegeln.

## 11. Audit-Pflicht

Sobald die Funktion Teil der betreffenden Ausbaustufe ist, muss der finale Workspace Intelligence Audit mindestens prüfen:

- Reisedatum mitten in typischer Monsunzeit
- Reisedatum in offizieller Hurrikan-/Zyklonsaison ohne aktuelle Warnung
- aktuelle konkrete Warnung zusätzlich zum saisonalen Kontext
- Region innerhalb eines Landes mit anderer Saisonlage als das restliche Land
- Nutzer entscheidet bewusst, bei den Daten zu bleiben
- alternative Reisezeit wird vorgeschlagen, aber nicht automatisch übernommen
- fehlende oder widersprüchliche Datenlage
- Smartphone / Tablet / Desktop

## 12. Priorität / Umsetzung

Die Produktfähigkeit ist **verbindlich**.

Sie wird als eng gekoppelte Schwesterfunktion von `Travel Safety & Disruption Intelligence` geplant und in denselben intelligenten Workspace-Kontext integriert, erhält aber eine eigene Truth-Klasse und darf akute Warnungen nicht mit historischen Saisonmustern vermischen.

Die unmittelbare Priorität bleibt unverändert:

1. Foundation D abschließen
2. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document
3. zentralen Trip Workspace auf belastbarer Gesamtarchitektur optimieren

Die konkrete Implementierungsphase von Safety/Disruption + Timing/Seasonality wird danach professionell geplant.
