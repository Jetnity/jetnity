# Aktuelle Freigabe und verbleibende Grenzen – PR #1198

Die jüngste PO-Antwort ersetzt die frühere allgemeine Zeitfreigabe:

- Merkliste: nur neue Tabelle `saved_offers` und ihre RLS, zuerst bisherige
  Vorschau-Datenbank, Production gemeinsam mit dem PO. Bestehende Tabellen,
  Regeln und Auth bleiben unverändert.
- `components/trips/Reisevorbereitung.tsx` bleibt vollständig beim Hauptchat.
- Vorschau-Einstellungen sind freigegeben; API-Schlüssel ausschliesslich serverseitig.
- Vor Production genaue Variablenliste vorlegen. Vor Merge aktuellen main holen,
  #1196/#1197 auf Überschneidungen prüfen und vollständigen Core-PASS abwarten.
  Erst dann den PO fragen, ob der Zeitpunkt passt.

## Ausgeführt in der Vorschau

Branch basiert auf veröffentlichtem main `63544e8`. Die beiden Hauptchat-PRs
bleiben unverändert. Kein Merge und keine Production-Veröffentlichung.

Neue Migration `20261113173644_saved_offers.sql` auf Preview-Projekt
`yfvbxvijcorffwxbxahl` installiert. RLS-Transaktion unter zwei vorhandenen
Kontoeigentümern bestanden: eigenes CRUD erlaubt; fremdes Lesen, Ändern,
Löschen und fremde Eigentümer beim Anlegen gesperrt; anonymes Lesen gesperrt.
Alle Testzeilen zurückgerollt. Bestehender Policy-Fingerprint vorher/nachher:
`4971993b6a3d775e01cc66eac9dc8d02`. Keine Auth-Konten erstellt/geändert.

Die Oberfläche enthält jetzt kontoweite Merkliste, Entfernen, manuelle konkrete
Angebotserfassung, ein DiscoverCars-Herz mit serverseitiger Nachprüfung und
vorausgefüllte Planübernahme. Dieser Code ist bis zum neuen Deployment und
angemeldeten Browsertest ausdrücklich noch kein Funktionsnachweis.

## Genaue Konfiguration

| Variable | Eigene Vorschau | Production vor gemeinsamem Schritt |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Unverändert bisherige Vorschau-DB | Bestehenden Live-Wert behalten |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Unverändert bisheriger öffentlicher Key | Bestehenden Live-Wert behalten |
| `NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN` | Öffentliche URL der getrennten statischen Widget-Vorschau | Bestehendes `https://jetnity-flight-widget.vercel.app` behalten |
| `NEXT_PUBLIC_ACTIVITIES_FRAME_ORIGIN` | Öffentliche URL der getrennten statischen Aktivitätsrahmen | Nicht setzen; bestehende Live-Routen bleiben |
| `JETNITY_DISCOVERCARS_SEARCH_ENABLED` | Bestehenden aktivierten Suchwert übernommen | Bestehenden Wert behalten |
| `DISCOVERCARS_API_KEY` | Serverseitiger Sensitive-Wert, vorhandene Integration | Bestehenden serverseitigen Wert behalten |
| `OMIO_KATALOG_SCHLUESSEL` | Serverseitiger Sensitive-Wert, vorhandene Integration | Bestehenden serverseitigen Wert behalten |

Nach aktuellem Abgleich sind **keine zusätzlichen Production-Variablen** nötig.
Vor dem gemeinsamen Schritt nochmals live prüfen. Keine Schlüsselwerte in Git,
Browsercode oder Bericht. Kein service_role-Schlüssel übernommen.

Widget-Preview: `jetnity-flight-widget-agzgac1z3-jetnity-e1b93c82.vercel.app`,
Deployment `dpl_HgvAf8LyQkaiaN1Y2mhT4QSSzcHN`, target Preview, READY. Dessen CSP
lässt nur den stabilen eigenen App-Vorschau-Origin als Parent zu. Das bestehende
produktive Widget wurde nicht geändert.

## Offene Nachweise und Grenzen

- Der volle Core muss auf dem neuen Code-Head grün sein; alte Ergebnisse ersetzen ihn nicht.
- Echte angemeldete Browserprüfung, erneuter Login und zweites Gerät fehlen noch.
- Safari ist über die native Oberfläche erreichbar; Remote Automation bleibt deaktiviert.
  Die private App verlangt dort noch Vercel-Anmeldung; echtes iPhone nicht vorhanden.
- Hotel-/Flug-/Aktivitäts-Widgets liefern keine verifizierbaren Einzelangebotsdaten.
  Kein Herz über einer Suchseite als angebliches konkretes Angebot. Manuelle
  Erfassung ist getrennt gekennzeichnet. Preise/Bilder/Tokens werden nicht gespeichert.
- Datumsgrenzen der vorhandenen Reise-Datenbank bleiben: Ein Flug über die Datumsgrenze
  mit rückwärts laufendem lokalem Datum benötigt den vollständigen Flugeditor.
  Die Merkliste darf ihn behalten, die einfache Übernahme weist die Grenze aus.
- Zusätzlich ausdrücklich freigegeben und ausgeführt: 5.331 fehlende öffentliche
  Flughafen-Referenzen aus dem aktuellen Live-Bestand nur in Preview eingefügt.
  Bestand jetzt 5.332, CDG/BKK vorhanden. Keine vorhandenen Zeilen überschrieben,
  Zürich-Fingerprint unverändert `9b89551731e6bbd498570b9090e08cf0`.
  Schema/RLS unverändert; keine Production-Schreibzugriffe. Freigegebenes Paket:
  SHA-256 `fb567e725fb7e3b95e64bc102a013a32c32c91008b987c641a4386d7b7dfd820`.
- Credentialless Aktivitätsrahmen verwenden in der Vorschau eine getrennte öffentliche
  statische Hülle mit exakter Parent-CSP. Consent, Sandbox und Nachrichtenprüfung bleiben.
  Production nutzt ohne Vorschauvariable unverändert die bestehenden eigenen Embed-Routen.
  Chrome: GetYourGuide und Viator zeigen echte Paris-Angebote; beide Rahmen bleiben
  beim Kategorienwechsel erhalten. Die isolierten Hosts sind nur Preview.
- Automatische Ergänzung der Stadtbilder über exakte GeoNames-/Land-Zuordnung und
  freie Commons-Lizenz ist implementiert; Metadatenprobe Berlin bestanden.
  Chrome: Berlin-Foto lädt in Meine Reisen, Reiseplan und Organisieren mit
  verlinktem Urheber-/Lizenznachweis; 390 px ohne horizontalen Überlauf. Ohne passende freie Aufnahme neutral.

Details zum begrenzten Merkliste-Schnitt: [Umsetzungsnachweis](PRIVATE_UX_SAVED_OFFERS_2026-11-13.md).

## Browser- und Core-Nachlauf am 13.11.2026

- Laufzeitcode `8bf7155`, darauf nur Testinventar-Korrektur `f85f22a`. Preview
  `dpl_3zv8qkwc1BencLwmaQDMEYRKQwfd` READY, aktueller main weiter `63544e8`.
- Sichtbares Chrome: Travelpayouts ZRH–CDG, 20.–25.11.2026, zwei Personen,
  echte SWISS-/Condor-/Air-France-Angebote. Suche und Ergebnisabrufe HTTP 200.
  Separate Headless-Chrome-Probe bekam HTTP 403 vom Anbieter; dieser Lauf ist
  kein bestandener Angebotsnachweis und ersetzt nicht den sichtbaren Browser.
- Sichtbares Chrome: Normandy Hotel Paris über linke Liste und Kartenmarker
  führt zu Booking mit Hotelreferenz 51548, 20.–25.11., zwei Erwachsenen, einem
  Zimmer und aid 1607597; Zielseiten gefüllt, keine Buchung ausgelöst.
- Chrome: Hotelsterne allein, Bewertung allein, Kombination 4 Sterne / 8 von 10,
  Reset, CHF-Gesamtpreis und EUR-Nachtpreis liefern Paris-Angebote.
  Hotelrahmen und Ergebnistext nach Flugwechsel identisch. Ferienwohnungen
  bleiben Teil des Anbieters; Hotelsterne klassifizieren keine Ferienwohnungen.
- Safari, direktes öffentliches Stay22-Fenster mit denselben Suchparametern:
  Hotel des Orfèvres über Liste und Kartenmarker erfolgreich; Hotelreferenz
  212149, Zeitraum, Personen/Zimmer und Partnerparameter auf Booking korrekt.
  Dies ist noch keine Prüfung der eingebetteten privaten Safari-App.
- Chrome: DiscoverCars Paris-CDG liefert 522 Angebote; erste zwölf echte Karten
  mit CHF-Gesamtpreisen sichtbar. Station und erste Angebotskarte nach
  Kategorienwechsel unverändert. Omio zeigt die vorhandenen Zürich–Paris-
  Katalogwerte für Zug, Bus und Flug und erhält sie beim Wechsel. Keine
  Abfahrtszeit oder Live-Verfügbarkeit aus dem Katalog erfunden.
- Die Chrome-Anmeldung des PO ist weiterhin offen. Kontoweites Merken,
  Wiederanmelden, zweites Gerät und echte Planübernahme sind daher noch keine
  bestandenen Browserprüfungen. SQL-RLS- und Vertragsprüfungen separat siehe oben.
- Core `43480815808`: neue Serveraktionen fehlten im isolierten Browser-Bundler
  und im exakten Sicherheitsinventar. Nur explizite neue Dateihashes ergänzt;
  historische Auth-/Action-Hashes, Konfiguration und Paket-Pins unverändert.
  41 Security-Kontrolltests und drei Security-Vertragstests lokal bestanden,
  einschliesslich Negativfällen für veränderte/fehlende/unbekannte Actions.
- Core `43483237261`: 8.787 Tests, 8.773 bestanden, null Testfehler, aber zwölf
  Abbrüche im White/Mint-Browser-Harness durch dieselbe fehlende Action-Grenze.
  Deshalb ausdrücklich nicht grün. Der Harness verwendet jetzt die vorhandene
  gemeinsame Serveraktionsgrenze; alle Assertions bleiben bestehen. Neuer voller
  Core-Lauf ist vor Merge weiterhin zwingend. Keine Workflow-/Paketänderung.

## Angemeldete Chrome-Prüfung

Der PO meldete sich mit einem vorhandenen Preview-Testkonto an. Kein Auth-Konto
und kein Passwort wurden vom Agent geändert. Die eigene Paris-Gastreise wurde
über den bestehenden Ablauf ins Konto übernommen und in `QA PR1198 – Paris`
umbenannt. Bestehende andere Reisen bleiben unberührt.

- Konkretes Normandy-Hotel manuell gemerkt; nach Neuladen vorhanden.
- Echte DiscoverCars-Karte Toyota Aygo am Herz gemerkt, serverseitig erneut gelesen,
  in der Merkliste mit Anbieterreferenz, Zeitraum und Ortszeiten angezeigt.
- Hotel über vorausgewählten Paris-Tag übernommen: 20.–25.11.2026, fünf Nächte,
  `unconfirmed`, ohne Bestätigungsdatum. Wiederholter Klick bleibt ein Planpunkt.
- Klar synthetischer Nachtflug für den Zeitgrenzentest: 20.11., 23:30 bis 21.11.,
  01:00. Browsermeldung und tatsächlicher Datenbank-Readback stimmen überein;
  kein reales Flugangebot oder gebuchter Flug behauptet.
- Ergänzt: erfolgreiche Planübernahme invalidiert die vorhandenen Reiseansichten
  und `/reisen`; der Erfolgslink öffnet unmittelbar `?ansicht=reiseplan`.
  Echte Serveraktionslogik mit ersetzter Auth-/DB-Transportgrenze geprüft:
  anonym/fremdes Angebot ohne Schreiben, bestätigter Readback, idempotenter Retry,
  fehlender Readback ohne Erfolgsmeldung. Neun Merkliste-/Planprüfungen und
  41 strenge Security-Inventarprüfungen bestanden. Neuer Core-Head erforderlich.
- Erneutes Anmelden, unabhängige zweite Sitzung und physisches Gerät bleiben bis
  zum tatsächlichen Nachweis offen. Browser-Neuladen ist kein Gerätewechsel.
