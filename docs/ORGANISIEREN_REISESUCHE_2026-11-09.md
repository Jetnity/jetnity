# Zentrale Reisesuche im Reisebereich

Grundlage ist der am 9. November freigegebene Entwurf. Im regulären Gast- und Konto-Einstieg unter „Organisieren“ zeigt Jetnity die eigene Reise mit Fotokopf, fünf Suchkategorien und Etappenkarten. Reisedetails führen weiter zu gespeicherten Buchungen und zur manuellen Bearbeitung.

## Suchergebnisse

- Flüge übernehmen Startort, erste und letzte Etappe, Termine, Reisende und Währung. Für verschiedene Hin- und Rückflugorte ist ein Gabelflug vorausgewählt. Die Jetnity-Flugsuche liefert verfügbare Optionen oder den aktuellen Anbieterstatus.
- Unterkünfte öffnen über den freigegebenen CJ-Partnerlink die Booking.com-Suchergebnisse für die gewählte Etappe. Beim bewussten Klick werden Ziel, Belegung, Währung und gegebenenfalls die Aufenthaltsdaten übergeben. In dieser Übergangsphase zeigt Booking.com die Hotelprofile, Fotos und Preise.
- Aktivitäten öffnen mit der ersten Etappe. Redaktionelle Ideen und vorhandene Partnerangebote folgen der gewählten Etappe.
- Mietwagen verwenden die DiscoverCars-Stations- und Angebotssuche. Verbindungen nutzen die Mobilitätssuche sowie den vorhandenen 12Go-Fahrplan für unterstützte Strecken.

## Integrationsprüfung

Die normale Gastreise dient zur Prüfung von Kategorie- und Etappenwechsel, Fotoladen, Standortauswahl, Partnerübergabe, Anbieterstatus, Bedienung auf kleinen Bildschirmen und Reisedetails. Die automatisierten Katalogtests sichern Ortszuordnung, Flughafenwahl und die Weitergabe gültiger Aufenthaltsdaten. Änderungen an Datenbankschema, Konto- oder Anbieterschlüsseln sind für diese Oberfläche nicht erforderlich.

## Omio im Reiter Verbindungen

Gäste und angemeldete Reisende verwenden dasselbe Formular für Start, Ziel, Reisedatum und Reisende. Der Vergleich zeigt CHF-Mindestpreise und kürzeste Dauern pro Verkehrsmittel aus dem Schweizer Partnerkatalog. Erst ein Klick auf den gekennzeichneten Partnerlink übergibt Orte, Datum und ggf. Verkehrsmittel an Impact/Omio. Die Gruppengröße wird für Jetnitys zusätzliche Mobilitätssuche verwendet. Die Belegung für die Buchung wählt der Reisende bei Omio. Die Kartenansichten zeigen Orte bzw. Stationen. Die Übersicht kennzeichnet die Luftlinie. Die bisherige Mobilitätssuche und der 12Go-Fahrplan sind für denselben Abschnitt verfügbar.

Der private, auf Anzeigeinformationen reduzierte Katalog lässt sich mit `python3 scripts/omio/importiere-katalog.py <Advertiser-CSV.gz> --stand YYYY-MM-DD` in `data/omio/ch.json` erneuern. Die Datei bleibt lokal. Anschließend erstellt `node --import tsx scripts/omio/archivieren.ts` mit dem serverseitigen `OMIO_KATALOG_SCHLUESSEL` ein komprimiertes, authentifiziert verschlüsseltes Archiv in `data/omio/ch.katalog`. Nur dieses Archiv wird mit dem Release ausgeliefert. Der Anzeigenstand stammt aus dem jeweiligen Import. Der Browser erhält das Ortsregister und pro Anfrage die Vergleichswerte für eine einzige Fahrtrichtung. Bei einem Ausfall der Katalogquelle bleibt der bisherige Verbindungseinstieg nutzbar. Eine neue Kataloglieferung wird erneut importiert, archiviert und ausgerollt.
