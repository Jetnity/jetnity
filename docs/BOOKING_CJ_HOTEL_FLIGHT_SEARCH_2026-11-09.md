# Booking.com im Jetnity-Reisebereich

Der Auftrag umfasst die Unterkunfts- und Flugsuche. Basis für den separaten Branch ist `ce3366e`. Der parallele Official-Truth-Auftrag nutzt andere Dateien. Dieses Dokument beschreibt die Implementierung und die Browserprüfung vom 9. November 2026. Den Veröffentlichungsstand zeigen der zugehörige Pull Request und dessen Deployment.

## Partnerschaft und Suchübergabe

Im angemeldeten CJ-Konto erschien Booking.com DACH (Advertiser 4297289) unter „Teilnehmend“. Der Linkgenerator für „Jetnity – intelligente Reiseplattform“ (Website 101919996) lieferte das Textwerbemittel „Booking.com use for deep linking“ (14082404, Deep Linking aktiviert). Die beiden festen SID-Werte `jetnity-hotel` und `jetnity-flug` trennen die Platzierungen für die Auswertung. CJ stellt die Tracking-Domains. Der Redirect ergänzt die Attribution auf der Booking.com-Seite.

Die bestehende Suchmaske übernimmt editierbare Angaben aus der Reise. Der primäre Button öffnet die Suche bei Booking.com im neuen Tab. Die Hotelsuche übergibt den angezeigten Etappenort mit Land, An- und Abreise, Erwachsene, Zimmer und Anzeigewährung. Die Flugsuche übergibt bestätigte Flughäfen mit expliziter Flughafenidentität, Flugrichtung, Termine, Erwachsene, Reiseklasse und Anzeigewährung. Bei unvollständigen Suchangaben gibt es auch einen Einstieg ohne Reisedaten. Kinder lassen sich beim Anbieter ergänzen.

Die Weiterleitung besteht aus der Platzierungskennung und einer fest aufgebauten Booking.com-Zieladresse. Sie enthält keine Konto-, Reise-, Dokument- oder Personenkennungen. Die Integration startet beim Öffnen des Reisebereichs keine Anbieterabfrage und lädt keine externen Skripte. Preis, Verfügbarkeit und Abschluss liefert Booking.com. Die bestehende KAYAK-Testvorschau bleibt separat auf ausdrückliche Auswahl nutzbar.

## Prüfung und Betrieb

- In Chrome zwei vom CJ-Generator ausgegebene Links bis zu den Suchergebnissen geprüft. Beide Zielseiten hatten die erwarteten Suchdaten und CJ-Attributionsparameter. Hotels in Lissabon für zwei Erwachsene, ein Zimmer, 12.–17. März 2027 und CHF. Hin- und Rückflug Zürich–Lissabon für zwei Erwachsene im gleichen Zeitraum.
- Zusätzlich öffentliche Booking.com-Flugziele für einen einfachen Flug, Premium Economy, EUR sowie konkrete Flughafenwahl JFK–BKK mit Business-Klasse geprüft.
- Automatisierte Tests prüfen die Parameter, beide Platzierungen, Sonderzeichen, offene Länderangaben, ungültige Zeiträume und Flughäfen. Der Workspace-Browsertest fängt ausgehende CJ-Navigationen lokal ab und prüft an fünf Bildschirmbreiten die Übergabe sowie die KAYAK-Regressionsfälle.
- Es wurde keine provisionspflichtige Buchung ausgelöst. Buchungszuordnung und Auszahlung können erst aus den CJ-Transaktionsberichten für eine qualifizierte Buchung bestätigt werden. Laut Programmbeschreibung muss sie in derselben Sitzung erfolgen.
- Kein API-Schlüssel und keine Datenbankänderung erforderlich. Rücknahme über Revert dieses PR. Die von CJ erteilte Freigabe betrifft den Affiliate-Einstieg. Eine native Booking.com-Inventarschnittstelle würde gesonderten Zugang erfordern.
