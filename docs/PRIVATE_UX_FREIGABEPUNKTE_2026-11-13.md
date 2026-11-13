# Noch benötigte Entscheidungen für die private UX-Runde

Keine Freigabe für eine öffentliche Veröffentlichung, einen Merge oder Änderungen an Supabase.
Dieses Dokument ist ein Entwurf zur Entscheidung, keine Migration und keine Anbieteraktivierung.

## Kontoweite Merkliste

Die bestehenden Anbietergrenzen stehen im [Anbieterbericht](PRIVATE_TRAVEL_UX_IMAGES_2026-11-13.md).
Insbesondere liefern Stay22- und Travelpayouts-iFrames in der vorhandenen Integration
keinen von Jetnity überprüfbaren Einzelangebotsdatensatz. Ein Herz über dem gesamten
Suchfenster würde kein bestimmtes Hotel oder keinen bestimmten Flug speichern.

Vorgeschlagenes, separat freizugebendes Datenpaket:

| Bestandteil | Konkreter Inhalt |
| --- | --- |
| Neue Tabelle `saved_offers` | `id` (UUID), `user_id` (bestehender Kontoeigentümer), `category`, `provider`, `provider_offer_id`, `title`, freigegebene `partner_url`, `destination_place_id`, `created_at`, `updated_at`, optional `expires_at` |
| Zeitdaten | Getrennte optionale lokale Anfangs-/Enddaten, Anfangs-/Endzeiten und jeweilige IANA-Zeitzone bzw. vom Anbieter bestätigter Offset. Fehlende Werte bleiben leer. |
| Planbezug | Optionale `trip_id`, `stage_id`, `trip_item_id`; vor jedem Schreiben nachgewiesenes Eigentum und gültige Etappen-/Tageszuordnung. Merken bleibt unabhängig von einer Reise möglich. |
| Doppelte Einträge | Eindeutigkeit aus Kontoeigentümer, Anbieter und offizieller Angebots-ID; erneutes Merken erzeugt keine Dublette. |
| Rechte | RLS für Lesen, Anlegen, Ändern und Löschen ausschließlich eigener Einträge; Serveraktionen mit bestehender Identitätsprüfung. Keine Änderung des Login-Verhaltens. |
| Anbieterinhalt | Nur ausdrücklich erlaubte Felder speichern. Im ersten Paket keine Preis- oder Bildkopien. Keine Zugangstokens, Zahlungsdaten oder Widget-DOM-Inhalte speichern. |
| Status | „Gemerkt“ und „Im Reiseplan“; diese Aktionen erzeugen niemals eine bestätigte Buchung. Abgelaufene Angebote bleiben als solche erkennbar und benötigen eine neue Anbieterprüfung. |

Die Tabelle allein aktiviert keinen Anbieter. Vor der Umsetzung je Kategorie muss ein
offizieller, für Jetnity freigegebener Angebotsvertrag einschließlich Speicherrechten
vorliegen. Die nativen Aktivitäts- und Mietwagenmodelle besitzen derzeit noch keinen
vollständigen produktiven Nachweisadapter. Diese Lücke wird nicht mit Clientdaten übergangen.

## Intelligente Übernahme

Bei eindeutiger passender Etappe und vollständigen Anbieterdaten kann die vorhandene
validierte Planmutation direkt aufgerufen werden. Bei mehreren passenden Aufenthalten
oder fehlendem Datum erscheint ein kleiner vorausgefüllter Dialog.

- Hotels: tatsächlicher Check-in und Check-out; die Abreise wird nicht als zusätzliche Übernachtung gezählt.
- Flüge/Verbindungen: Abflug und Ankunft mit ihren jeweils lokalen Datums- und Zeitangaben. Ein Nachtflug wird nicht aufgrund der Uhrzeit auf den Abflugtag zurückgesetzt. Unterschiedliche Zeitzonen dürfen nicht aus dem Browserstandort abgeleitet werden.
- Aktivitäten: bestätigter Ort, lokales Datum, optionale Startzeit und vorhandene Dauer; keine erfundene Uhrzeit.
- Mietwagen: bestätigte Abhol-/Rückgabestation und lokale Zeitpunkte; bestehende Angebotsablaufzeit beachten.

Dieses Verhalten ist beschrieben, aber noch nicht durch neue Merken-/Übernahme-Schaltflächen vorgetäuscht.

## Weltweite Stadtbilder

Paris und die bereits vorhandenen Ziele sind lokal und konsistent abgedeckt. Andere Ziele
erhalten ein als Ersatz geeignetes neutrales Motiv. Für weltweite echte Stadtbilder fehlt
eine abgestimmte Quelle mit Ortsauflösung, Nutzungsrechten und vollständiger Attribution.
Die Provenienz älterer Amsterdam-/Lissabon-/Zermatt-Bilder ist im Bestand nicht belegt.

## Private Vorschau

Der lokale Serverstart wurde mit `listen EPERM 127.0.0.1:4317` verweigert; die Browser-
Sicherheitsprüfung lehnt `file://` ab. Es werden keine lokalen Schutzgrenzen umgangen
und keine Umgebungsdateien kopiert oder geändert.

Als regulärer HTTPS-Vorschauweg ist das vorhandene Vercel-Projekt `jetnity-app` vorgesehen,
Team `jetnity-e1b93c82`. Seine Nicht-Custom-Domains sind bereits per SSO geschützt
(`all_except_custom_domains`). Dafür wird ausschließlich der eigene Feature-Branch
und ein eigener Draft-PR verwendet. Kein Production-Ziel, keine Domainzuordnung und
keine Änderung der Auth-, Schutz-, Build- oder Umgebungs-Konfiguration.

Die öffentliche Veröffentlichung bleibt bis zu Sasas ausdrücklicher Freigabe nach der
Vorschau gesperrt. Ein Merge braucht zusätzlich die zeitliche Abstimmung mit dem Hauptchat
sowie eine erneute Aktualisierung von main und Prüfung gegen #1196/#1197.
