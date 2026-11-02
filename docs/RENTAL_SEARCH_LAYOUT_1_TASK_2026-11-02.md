# Mietwagensuche — Layout 1

Owner-Auftrag vom 02.11.2026: funktionierende Suche professionell aufräumen,
Vorbereitung als kompakten Suchkasten, 3–4 Fahrzeugkarten pro Desktopreihe.
Baseline: 9c0e619bbf20309f44785c1c2f4020d7ac2ac082. Mode NORMAL.
Branch: feat/rental-search-layout-1. Root alleiniger Writer; unabhängiger Read-only-Review.

## Umsetzung

- Suchvorbereitung in einer ruhigen, gegliederten Fläche: Stationen, Mietzeitraum,
  Fahrerangaben. Länderwahl kompakt, vorhandener Länderkatalog bleibt maßgeblich.
- Ergebnisse außerhalb der Suchfläche: responsives Raster mit 1/2/3/4 Karten,
  einheitlichen Bildflächen, Fakten, Gesamtpreis, Details und Vergleich.
- Angebotsdialog mit Bild, Preis, klar gruppierten Bedingungen und Stationsdaten.
- Leerer Bestand wird kompakt; manuelle Erfassung ist aufklappbar.
- Betroffen: rental-Komponenten, MietwagenBereich, gegebenenfalls kompakter
  Mobilitätskopf, LandFeld (opt-in), Browseraudit und Designdokumentation.

Keine API-/Providervertrags-, Datenbank-, Auth-, Schema- oder Homepageänderung.
Keine zusätzliche laufende Infrastruktur oder automatische Anbietersuche.
Suchänderung/Abbruch/Verfall, unveränderter Buchungslink und getrennte
Buchungsbestätigung bleiben erhalten. Keine erfundenen Fahrzeugbilder/-merkmale.

## Prüfung

Gezielte Provider-/Mietwagenregressionen, TypeScript/Lint, responsive Browserprüfung
(320/390/1440/1920px; Kartenanzahl, Formulare, Vergleich, Dialog, manuelle Erfassung,
Fehler/Leerzustand/Verfall/Abbruch), Build und Hygiene in CI. Preview vor Merge,
unabhängiger Review, exakte Head-Prüfung und Production-Nachprüfung.
