# 12Go — Bangkok-Region: Korrekturauftrag V1

Stand: 1. November 2026, Europe/Zurich. Ausgangs-Main/Production `68071953355e1164891611e7eea9a26c00c7cd6a` nach PR #1101. Builder und Technical Lead: Codex gemäß bestehender Owner-Beauftragung; kein zusätzlicher Cursor-Auftrag.

## Befund und Ziel

Der Owner zeigt nach dem Livegang: Bangkok–Ko Chang fällt auf die externe Suche zurück, Ko Chang–Phuket zeigt Fahrplandaten. Eine lesende Prüfung der drei öffentlichen Ortsidentitäten bestätigt Bangkok `geonames:1609348` (ADM1), Ko Chang `1611309`, Phuket `1151254`. Die bisherige Registry kennt nur Bangkok-Stadt `1609350` (PPLC). Die Anfrage wird bereits im Client verworfen. Der frühere Browser-PASS verwendete ausschließlich die Stadt-ID und deckte diese reale Variante nicht ab.

Die belegte Verwaltungsregion Bangkok erhält denselben Zugang zur allgemeinen 12Go-Zielregion wie Bangkok-Stadt. Gespeicherte Reisen und ihre Ortsidentitäten bleiben unverändert. Zwei verschiedene Orts-IDs derselben Provider-Region dürfen keine künstliche Bangkok–Bangkok-Verbindung erzeugen.

## Scope, Belege und Nichtziele

- Schmale Änderung im Timetable-Schema und gezielte Regressionstests; keine neue Provider- oder UX-Funktion.
- GeoNames bestätigt [Bangkok ADM1, 1609348](https://www.geonames.org/1609348/bangkok.html) und [Bangkok PPLC, 1609350](https://www.geonames.org/1609350/bangkok.html), dessen Verwaltungshierarchie auf 1609348 verweist. Gelesen am 1. November 2026.
- Bestehende offizielle 12Go-Bangkok-Fahrplanquelle aus der Evidence bleibt unverändert. Es handelt sich um eine allgemeine Region, nicht um einen zugesicherten Abholpunkt.
- Keine Namensheuristik für unbekannte IDs, keine Erweiterung auf beliebige Provinzen, Flughäfen oder Länder.
- Keine Datenbank-, Reise-, Secret-, ENV- oder Abrechnungsänderung, keine Buchung, kein neuer laufender Dienst. Vorhandene Quoten/Cache/Schalter bleiben.
- PR #1086 und alle anderen STOP-/HOLD-/Owner-Gates bleiben unverändert. Kein Protection-Bypass.

## Abnahme

1. Beide Bangkok-IDs erzeugen für Bangkok–Ko Chang dieselbe offizielle Quelle; umgekehrte Richtung bleibt richtungsgenau.
2. Der bestehende Reise→Kanten→Schema→HTTP→Service→Parser-Pfad funktioniert mit einer künstlichen Reise mit ADM1-ID. Route und Reiseinhalt werden nicht mutiert.
3. Stadt↔Verwaltungsregion, unbekannte/falsche IDs, falsches Land, ID/Name-Widerspruch und die gleichnamige Ranong-Insel werden weiterhin abgewiesen; dabei kein Anbieterabruf.
4. Cache wird zwischen beiden gültigen Bangkok-Identitäten geteilt. Wiederholte Ziele erzeugen nur die vorhandenen aufeinanderfolgenden Abschnitte.
5. Isolierte Browserprüfung mit ADM1-Gastreise: beide Abschnitte, Smartphone/Desktop, echte Anbieterantwort und unveränderte Gastdaten. Preview vor Production; anschließend begrenzte Live-Nachprüfung.
6. Typecheck, Lint, Build, Hygiene-Checks, relevante Tests und native CI am exakten Head. Unabhängige Codeprüfung gemäß Review-Standard.

Stop bei widersprüchlicher geografischer Zuordnung, falscher Strecke, Änderungen privater Daten, neuem Providerzugang oder ungeklärtem Schutz-Gate. Normales Ready/Merge ausschließlich durch Technical Lead nach Abnahme. Frühere Belege bleiben historisch erhalten; neue Regression und Prüfgrenze werden ausdrücklich ergänzt.
