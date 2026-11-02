# Mietwagen Layout 1 — Prüfnachweis

Stand 2. November 2026, Branch `feat/rental-search-layout-1`, Basis `9c0e619bbf20309f44785c1c2f4020d7ac2ac082`. Kein Gesamtprodukt-/Launch-PASS. Exakte Head-, CI-, Preview- und spätere Release-Belege: [Live-Index #751](https://github.com/Jetnity/jetnity/issues/751).

## Ergebnis

Kompakte Suchvorbereitung mit Stationen/Mietzeitraum/Fahrerangaben; einzelne Länderwahl aus dem vorhandenen Katalog. Separates 1/2/3/4-Spaltenraster mit Fahrzeugbild, Modell, Vermieterbewertung, wesentlichen Konditionen, Gesamtpreis, Details und Vergleich. Detaildialog mit fester Kopfzeile, Bild und Preis, gruppierten Konditionen und Stationsangaben. Manuelle Erfassung startet geschlossen; leerer Bestand und Verbindungskopf sind verkürzt.

Keine Providervertrags-/API-/Schema-/Auth-/Homepageänderung. Suchänderung, Abbruch, Verfall und unveränderte Buchungslinks bleiben erhalten. Keine automatische Suche oder Buchung. Nur gelieferte Fahrzeugbilder, mit neutralem Platzhalter bei fehlenden/defekten Bildern.

## Lokale Prüfung

- 117 gezielte Tests: Providertransport/-vertrag, Mietwagenmodell, Affiliate-/SSR-Grenzen und Organisationsintegration; alle erfolgreich.
- TypeScript und gezieltes ESLint ohne Fehler/Warnungen. Alle fünf Hygieneprüfungen sowie lokaler Produktionsbuild (27/27 Seiten) erfolgreich.
- Isolierter Browser: reale Stationssuche, 147 echte Angebote und echter Detailabruf bei 1440px; zurückgelieferte Daten bei 1920/390/320px weitergeprüft. Fahrzeugbilder und Detailansicht visuell geprüft. Keine Buchung ausgelöst.
- Finaler Layoutlauf mit kontrollierten Daten bei 1440/1920/1024/640/390/320px: Raster 3/4/2/2/1/1; lokale Filter und Vergleich; manueller Bereich auf/zu; Keyboard/Escape/Fokusrückgabe; Leer-/Fehlerzustand; Verfall; Abbruch bei Eingabeänderung und Verlassen; keine horizontale Seitenüberbreite; Reise unverändert; keine Browserfehler.
- Unabhängiger Read-only-Review: enge mobile Datumsfelder gefunden und durch Stapelung unter 1024px behoben. Abschließende Nachprüfung PASS, keine offenen P1/P2; Reviewer prüfte Datumsfelder zusätzlich unabhängig bei 320/640/1280px. Finaler Browseraudit prüft zusätzlich mindestens 150px Datumsfeldbreite.

Browserbelege liegen im lokalen Output `outputs/jetnity-rental-layout-2026-11-02`. Isolierte Chromium-Emulation ist kein Nachweis auf physischen Geräten. Vollständige Tests, Hygiene und Produktionsbuild übernimmt zusätzlich die native CI am exakten Head; kein lokaler Vollsuite-PASS behauptet. Hosted Preview, Release und tatsächlicher Main werden separat abgenommen und in #751 ergänzt.
