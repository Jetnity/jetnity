# 12Go Bangkok und Ortsdaten — Fortsetzungscheckpoint

Stand: 1. November 2026, Europe/Zurich. Datiertes Ergebnis, keine dauerhafte Current-Main-Behauptung. Vor Folgearbeit Main, PRs, CI und Production neu lesen.

## Auftrag und Übernahme

Der Owner bat, den unterbrochenen Chat „Finde passende Jetnity-Provider“ fortzusetzen. Dessen neueste offene Frage betraf eine Untersuchung besserer Ortsdaten/Alternativen zu GeoNames. Der gespeicherte Chat endete mit „Bad Request“; ein zu voller Kontext ist nicht als Ursache nachgewiesen. Vorheriger Bangkok-Fix und die ausdrückliche Freigabe für vier ausschließlich branchgebundene Preview-Konfigurationen wurden übernommen. Keine allgemeine Freigabe für kostenpflichtige Anbieter oder eine Migration abgeleitet.

## Veröffentlichtes Produkt

- [PR #1102](https://github.com/Jetnity/jetnity/pull/1102) regulär gemergt. Geprüfter Head `5158a01e50614caaae28c254100a434698a37056`; Merge/Main `0d813e8229f672438c59c01ffe58de53fbfbf7db`; identischer Tree `f0e40d87603318f12c3cc94baeeea887c080d3ce`.
- Bangkok ADM1 `1609348` und Stadt `1609350` dürfen beide die belegte allgemeine 12Go-Bangkok-Region verwenden. Stadt↔Region erzeugt keine Bangkok–Bangkok-Abfrage. Gespeicherte Reiseidentitäten werden nicht verändert.
- Production `dpl_CnJK6D7R93w8p44UKo7x2hKRHfHD`, exakter Merge-SHA, READY; Alias `jetnity.com` bestätigt. Normaler Main-Build, kein Preview-Promote, kein Protection-Bypass.
- Keine Production-Konfiguration, Datenbank, RLS, Secrets oder persönlichen Reisen geändert. Keine neue laufende Kostenverpflichtung. Nur für Preview-Branch `fix/12go-bangkok-region-20261101` vier neue Einträge gemäß früherer ausdrücklicher Freigabe: öffentliche develop-Verbindung plus Server-/Client-Fahrplanschalter.

## Prüfbelege

- 40/40 betroffene 12Go-Tests bestanden. Frischer unabhängiger Reviewer: PASS ohne Findings, zusätzlich 64 Identitäts-/Land-/Zusatzfeldkombinationen.
- [PR-CI 41337162855](https://github.com/Jetnity/jetnity/actions/runs/41337162855), Versuch 2: SUCCESS. 7.819 Tests, 7.817 bestanden, 0 Fehler, 2 bestehende bedingte Auslassungen. Typecheck, Lint, Hygiene, Build und Auth-Abgleich erfolgreich.
- Versuch 1: 5-Sekunden-Timeout im unveränderten `lib/trips/ux-u1c-route-design-alignment-1/workspace-browser.test.ts`. Gezielter unveränderter Lauf 7/7 bestanden; genau ein nativer Wiederholungslauf. Keine Test-/Timeout-/Konfigurationsänderung. Ursache nicht als behoben ausgeben.
- Preview `dpl_6yY6yhAm7mtMkncHjA2dQrpKKBa7` am exakten Head: echte HTTP-200-Fahrpläne, Bangkok–Ko Chang vier Kategorien, Ko Chang–Phuket eine; Streckenwechsel, Tastaturdetails, vier Bildschirmbreiten, 200% Root-Schrift und unveränderte künstliche Gastreise bestanden.
- Live auf jetnity.com mit derselben künstlichen ADM1-Gastreise: echte HTTP 200, vier/eine/vier Kategorien beim Hin- und Herwechsel. Keine Browserfehler; korrekte Partner-/Strecken-/CHF-Links; keine 12Go-Browseranfrage vor einem Klick; Gastdaten unverändert.
- Live-Bildschirmprüfung 320/390/768/1440 px: erste Messung unmittelbar nach Resize meldete 323 statt 320 px an „Zur Organisation“. Nach zwei Animation Frames betrug die Seitenbreite 320 px. Alle anderen Breiten und 200% Root-Schrift bestanden. Ursprünglicher FAIL-Beleg bleibt erhalten; Prüfharness wartet in diesem Fall auf fertiges Layout. Kein Produktcode geändert.
- [Post-Merge-CI 41341988725](https://github.com/Jetnity/jetnity/actions/runs/41341988725), erster Versuch auf exakt `0d813e8229f672438c59c01ffe58de53fbfbf7db`: SUCCESS. 7.819 Tests, 7.817 bestanden, 0 Fehler, 2 bestehende bedingte Auslassungen, 929 Suites. Typecheck/Lint/Hygiene/Production-Build sowie Auth-Abgleich erfolgreich. Abschließend keine Inline-Review-Threads auf #1102.

Grenzen: isolierter Chromium 140, kein physisches Smartphone, Safari oder VoiceOver. Keine Buchung, kein Nachweis tagesgenauer Verfügbarkeit und keine bestätigte Provision. Allgemeine Fahrpläne sind keine konkreten Abholorte oder Buchungsangebote.

## Ortsdatenuntersuchung — Befunde, keine Umsetzung

Jetnity durchsucht lokal importierte GeoNames-/OurAirports-Daten. Die GeoNames-Web-API wird nicht bei jedem Suchzeichen abgefragt. Die aktuellen Probleme begründen keinen sofortigen Quellenwechsel.

- `lib/places/suche.ts`: Bei sonst gleichem Treffer erhält Region 90 Zusatzpunkte, Stadt 50. Live stehen bei Bangkok und Paris Regionen vor Städten.
- `lib/places/importieren.ts`: Inseltypen ISL/ISLS/ATOL brauchen mindestens 5.000 eingetragene Einwohner; fehlende Angaben werden als 0 gelesen. Das kann touristisch relevante Inseln ausschließen. Verwaltungsregionen werden zum Teil als Code statt verständlichem Namen gespeichert.
- 13 öffentliche Suchabfragen plus einmalige Nachkontrolle dreier auffälliger Begriffe: Ko/Koh Chang auffindbar, mehrere gleichnamige Ko-Chang-Treffer schlecht unterscheidbar; Ko/Koh Lipe und Nusa Penida leer. Ein erster Ubud-Aufruf lieferte 503 / Datenbank-Statement-Timeout, die Nachkontrolle 200 mit korrektem Ubud. Häufigkeit/Ursache ungeklärt; kein Performance-Benchmark.
- Gezielte read-only Abfrage von sechs öffentlichen IDs im Production-Ortsbestand: Bangkok ADM1/Stadt, Ko Chang, Phuket vorhanden; Ko Lipe `1342638` und Nusa Penida `1631470` fehlen. Beide existieren bei GeoNames. Ko Lipe hat dort keine eingetragene Einwohnerzahl und würde am aktuellen Filter scheitern. Der historische Importgrund für Nusa Penida wurde nicht rekonstruiert.
- `domain.ts`/`reiseziele.ts` begrenzen unterstützte Kennungen; gespeicherte Ziele verwenden GeoNames-IDs. Ein Anbieterwechsel braucht Kompatibilität/Migration und ist kein bloßer API-Tausch.
- Die 12Go-Registry kennt vier IDs für drei Zielregionen. Ein größerer Ortsbestand erweitert diese Zuordnung nicht automatisch. Keine pauschale Zusammenlegung von Stadt, Insel und Verwaltungsregion.

## Empfehlung und offener Folgescope

1. GeoNames behalten; zunächst Relevanzsortierung, verständliche Verwaltungshierarchie und klare Typanzeige verbessern.
2. Inselimport an einer überprüfbaren Auswahl echter Reiseziele bewerten; Einwohnerzahl allein reicht nicht. Vor geändertem Datenimport Kriterien und Bestandsverträglichkeit prüfen.
3. Reiseanbieter-Zuordnung separat mit geografischer Evidence erweitern; unbekannte/mehrdeutige Fälle bleiben ungeklärt.
4. Geoapify als ersten Ergänzungskandidaten mit 50–100 typischen Zielen vergleichen; LocationIQ als zweite Option. Bessere Trefferqualität ist noch nicht empirisch belegt. Keine neuen Konten/Keys/Abonnements angelegt.
5. Der beobachtete Ubud-Timeout bleibt ein separat zu untersuchender Befund. Keine neue Produktimplementierung aus dieser reinen Untersuchung ableiten.

Offizielle Quellen, gelesen am 1. November 2026:
- [GeoNames Export/Lizenz](https://www.geonames.org/export/), [Bangkok ADM1](https://www.geonames.org/1609348/bangkok.html), [Bangkok Stadt](https://www.geonames.org/1609350/bangkok.html), [Ko Lipe](https://www.geonames.org/1342638/ko-li-pe.html), [Nusa Penida](https://www.geonames.org/1631470/nusa-penida.html).
- [Geoapify Tarife](https://www.geoapify.com/pricing/), [Credits](https://www.geoapify.com/pricing-details/), [Geocoding / Speicherung](https://www.geoapify.com/geocoding-api/): kostenloser Einstieg, Autocomplete, gespeicherte Ergebnisse mit Attribution; Kosten anhand realer Anfragezahl vergleichen.
- [LocationIQ](https://locationiq.com/pricing): dauerhafte Ergebnisdaten und zeitlich begrenztes Anfrage-Antwort-Caching unterscheiden.
- [Mapbox](https://docs.mapbox.com/api/search/geocoding/) und [Google Places](https://developers.google.com/maps/documentation/places/web-service/policies): für gespeicherte Reisen Speicher-/Attributionsbedingungen genau prüfen.
- [Photon](https://github.com/komoot/photon) öffentlicher Demo-Dienst ohne Verfügbarkeitsgarantie; [öffentlicher Nominatim-Dienst](https://operations.osmfoundation.org/policies/nominatim/) erlaubt kein Autocomplete.

Ausführlicher HTML-Bericht und lokale Rohbelege liegen im fortsetzenden Codex-Workspace unter `outputs/jetnity-fortsetzung-2026-11-01/`: `ORTSDATEN-ANALYSE.html`, `ortssuche-live.json`, `ortssuche-live-nachkontrolle.json`, Preview- und Production-Prüfprotokolle/Screenshots. Diese lokalen Dateien sind nicht als auf GitHub hochgeladen behauptet.

## Arbeitsgrenzen und Wiedereinstieg

Dieser Checkpoint ist ein separater Dokumentationsstand, kein weiterer Runtime-Release. Die PR-Beschreibung #1102 verlinkt diesen Stand und enthält das endgültige Release-Ergebnis. Nicht aus älteren „in Prüfung“-Absätzen erneut #1102 implementieren. Vor jeder Folgephase aktuelle Repository-/CI-/Production-Wahrheit lesen. #1086 und alle übrigen besonderen STOP/HOLD/Owner-Gates bleiben unverändert; daraus folgt keine neue Provider-/Privacy-/Production-Identity-Freigabe.

Produktvision, Design-System und Architektur wurden durch die Recherche nicht geändert. Relevante Fix-Dokumentation bereits in #1102: Task, Timetable-Evidence, ARCHITECTURE, DECISIONS, ROADMAP. Die allgemeine Ortsverbesserung ist ein Vorschlag, kein umgesetztes Produkt.
