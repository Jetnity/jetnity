# Noch benötigte Entscheidungen für die private UX-Runde

## Aktuelle Freigabe vom 13. November 2026

Der PO hat Umsetzung und anschliessende Veröffentlichung der vollständigen Wunschliste
auf jetnity.com freigegeben. Eine weitere allgemeine Veröffentlichungs- oder zeitliche
Freigabe ist nicht nötig. Voraussetzungen bleiben vollständige Funktion, erfolgreiche
Abschlussprüfung und keine Kollision mit dem Hauptchat. Zusätzliche Eingriffe in
geschützte Bereiche müssen weiterhin vorab konkret gemeldet und freigegeben werden.

Der eigene Branch wurde konfliktfrei auf den veröffentlichten main `63544e8` gebracht
(Integrationscommit `416d4e3`). Die bereits veröffentlichten gemeinsamen Dateien wurden
unverändert übernommen; der eigene PR-Diff gegenüber main enthält weiterhin keine Datei
von #1196/#1197. Deren offene Branches wurden nicht übernommen oder verändert.

### Konkrete noch geschützte Eingriffe

1. **Merkliste / Datenbank:** neue Tabelle `public.saved_offers`, passende Indizes,
   Eigentümerzugriff über RLS und bestehende Anmeldung, zuerst in der bisherigen
   Vorschau-Datenbank und nach bestandener Abnahme in Production. Das genaue
   begrenzte Datenpaket steht unten. Keine Änderungen an bestehenden Auth-Regeln,
   keine Service-Role-Nutzung in der Anwendung und keine versteckte Speicherung
   in vorhandenen Reise-/Buchungstabellen. Die Umsetzung und Anwendung dieser
   Migration sind noch nicht freigegeben. Anbieterfreigaben sind davon getrennt.
2. **Geschützte Datei aus #1197:** `components/trips/Reisevorbereitung.tsx`,
   ausschliesslich das vorhandene Datumsfeld „Ablaufdatum, falls bekannt“ durch den
   gemeinsamen Einzeltermin-Kalender ersetzen. Keine Änderung an Dokumentdaten,
   Validierung oder Readiness-Logik. Die Datei gehört weiterhin dem Hauptchat;
   vor diesem Eingriff ist dessen Eigentums-/Integrationskonflikt zu klären.
3. **Vollständig vergleichbare Vorschau:** zusätzlich zu den zwei bereits erlaubten
   Supabase-Werten fehlen `NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN`,
   `JETNITY_DISCOVERCARS_SEARCH_ENABLED`, `DISCOVERCARS_API_KEY` und
   `OMIO_KATALOG_SCHLUESSEL` im eigenen Branch. Nur diese Branch-Preview-Zuordnung
   ist vorgeschlagen, nicht eine Änderung der vorhandenen Production-Werte.
   Für Travelpayouts muss zusätzlich ein getrenntes statisches Widget-Preview mit
   exakt erlaubtem Branch-Ursprung vorbereitet werden; der produktive Widget-Host
   wird nicht verändert. Die credentialless Aktivitäten-Frames brauchen ebenfalls
   einen ausdrücklich abgestimmten Vorschau-Zugangsweg; kein pauschales Abschalten
   des Zugangsschutzes oder Auslesen fremder Widget-Inhalte.
4. **Vorschau-Referenzdaten:** Orts-/Flughafensuche bleibt auf der bereits genehmigten
   Datenbank. CDG/BKK sind über den öffentlichen Vorschau-Leseweg leer, auf Production
   nicht. Vor Datenimport oder RLS-Eingriff sind Ursache und begrenztes Datenpaket
   separat nachzuweisen; keine automatische Umstellung auf die Live-Datenbank.

Dies ist eine konkrete Eingriffsübersicht, keine ausgeführte Migration, keine
Anbieteraktivierung und keine Umgebungsänderung. Der bestehende Stay22-Weg und die
Travelpayouts-Anbindung bleiben erhalten. Ohne belastbaren Einzelangebotsvertrag
werden Suchlinks nicht als konkrete gemerkte Angebote ausgegeben.

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
Der Reisebildresolver verwendet inzwischen nachgewiesene Commons-Originale für Amsterdam,
Lissabon und Zermatt. Die älteren Bilder anderer Inspirationsflächen sind damit nicht auditiert.

## Private Vorschau

Der lokale Serverstart wurde mit `listen EPERM 127.0.0.1:4317` verweigert; die Browser-
Sicherheitsprüfung lehnt `file://` ab. Es werden keine lokalen Schutzgrenzen umgangen
und keine Umgebungsdateien kopiert oder geändert.

Als regulärer HTTPS-Vorschauweg ist das vorhandene Vercel-Projekt `jetnity-app` vorgesehen,
Team `jetnity-e1b93c82`. Seine Nicht-Custom-Domains sind bereits per SSO geschützt
(`all_except_custom_domains`). Dafür wird ausschließlich der eigene Feature-Branch
und ein eigener Draft-PR verwendet. Kein Production-Ziel, keine Domainzuordnung und
keine Änderung der Auth-, Schutz-, Build- oder Umgebungs-Konfiguration.

Die frühere allgemeine Veröffentlichungs-/Zeitfreigabe ist durch die aktuelle Freigabe
oben ersetzt. Vor Merge bleiben die vollständige Funktionsabnahme und die erneute
Prüfung des aktuellen main sowie der laufenden Hauptchat-Arbeit erforderlich.
