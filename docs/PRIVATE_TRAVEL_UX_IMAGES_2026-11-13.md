# Private UX: Zielbilder und Aktivitätenziel

## Umsetzung

`lib/trips/organisieren/reisebilder.ts` ordnet lokale Bilder zentral einer kanonischen Ortskennung zu. Anzeigename und Land werden nur bei Altbeständen ohne Ortskennung verwendet; dafür muss das Land ausdrücklich passen. Eine unbekannte oder zum Land widersprüchliche Kennung wird nicht durch Namensraten überstimmt.

Alle bestehenden Aufrufer von `reiseFoto` (Reisekarte, Reiseplan, Organisieren mit Flügen, Unterkunft, Aktivitäten und weiteren Kategorien) erhalten für dieselbe Etappe dasselbe Motiv. Der bisherige Unterschied zwischen Kopf- und Kartenbild entfällt. Verschiedene Etappen behalten ihre eigenen Ziele; wiederholte Aufenthalte in derselben Stadt behalten dasselbe Motiv.

Der begrenzte Katalog umfasst Paris, Bangkok, Ko Chang, Phuket, Thailand, Nusa Penida, Panama, Amsterdam, Lissabon und Zermatt. Unbekannte Ziele erhalten überall den neutralen Reiseatlas. Eine Weltkarte ist dabei ausdrücklich ein Ersatzmotiv, kein Foto des Zielorts. Das vorherige generische Luftbild europäischer Berge wird nicht mehr als Zielbild ausgegeben.

Dies ist **noch keine weltweite automatische Stadtbildversorgung**. Dafür wäre eine abgestimmte Bildquelle mit eindeutiger Ortszuordnung, Nutzungsrechten, Autoren-/Lizenzmetadaten und einem geregelten Aktualisierungsverfahren nötig. Es wurde weder ein neuer Anbieter noch ein externer Bildabruf zur Laufzeit hinzugefügt.

In `AktivitaetenBereich.tsx` führte eine gemeinsame Verzweigung für die optionale eigene Zielauswahl und den Leerzustand zu einer falschen Meldung: Sobald Organisieren bereits eine Etappe übergab, erschien „Diese Reise hat noch kein Ziel“. Die Meldung hängt nun ausschließlich von einer tatsächlich leeren Zielliste ab. Die Anbietersuche, Freigaben und Übernahmewege bleiben unverändert.

## Paris: Quelle und Lizenz

- Datei: `public/images/organisieren/paris.jpg`, unverändertes Original-JPEG, 2.05 MiB.
- Werk: *Skyline of Paris with the Eiffel Tower 2.jpg*, DiscoA340, 4. Juli 2019.
- Quelle: <https://commons.wikimedia.org/wiki/File:Skyline_of_Paris_with_the_Eiffel_Tower_2.jpg>
- Original: <https://upload.wikimedia.org/wikipedia/commons/2/2f/Skyline_of_Paris_with_the_Eiffel_Tower_2.jpg>
- Lizenz: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Die Dateiseite und Lizenz wurden am 13. November 2026 geprüft. Das Foto wurde lokal visuell auf das Paris-Motiv geprüft. CSS kann den sichtbaren Ausschnitt je nach Fläche ändern; die bereitgestellte Bilddatei bleibt unverändert.
- Autoren-/Lizenzhinweis ist in `public/images/organisieren/Bildnachweise.txt` und auf der öffentlichen Seite `/datenquellen` erreichbar. Die Seite ist bereits aus dem Kontomenü verlinkt; Organisieren verlinkt die Bildnachweise zusätzlich.

Die erneute Abnahme hat die Provenienzlücke der alten Amsterdam-/Lissabon-/Zermatt-JPGs geschlossen **für den gemeinsamen Reisebildresolver**: Er verwendet jetzt eigene, unveränderte Commons-Originale unter `images/organisieren/*-commons.jpg`. Quellen und Lizenzen wurden live gelesen, alle drei Motive visuell geprüft: Kája Kinová (Amsterdam, CC BY-SA 4.0), Ex13 (Lissabon, CC BY-SA 3.0), Zermatt photos (Zermatt, CC BY-SA 3.0). Die vollständigen Nachweise stehen in `Bildnachweise.txt`, erreichbar aus Meine Reisen, Organisieren und `/datenquellen`. Die älteren Dateien ausserhalb dieses Resolvers werden nicht als lizenziert ausgegeben; andere gemeinsame Inspirationsflächen wurden nicht verändert. Weitere übernommene Motive unter `images/organisieren` besitzen bereits Nachweise.

Die vorhandene Inspirationsdatenquelle ordnet Zermatt der Kennung `geonames:2657915` zu. GeoNames führt darunter Zofingen; Zermatt hat `geonames:2657928`. Der neue Bildresolver verwendet nur die richtige Zermatt-Kennung. Die Orts-/Inspirationsdaten selbst wurden gemäß Arbeitsaufteilung nicht verändert. Der fehlerhafte Altbestand erhält ein neutrales Motiv, bis die Ortszuordnung separat korrigiert ist.

## Merkliste und Übernahme: konkrete Grenzen

Diese Runde ergänzt keine scheinbaren Merken- oder Planen-Schaltflächen über fremden Suchfenstern. Die lokalen Integrationen liefern dafür derzeit nicht in allen Kategorien verlässlich ein bestimmtes Angebot:

| Kategorie | Vorhandener Weg | Offene Voraussetzung für kontoweites Merken/Übernahme |
| --- | --- | --- |
| Hotels | Stay22-iFrame, Partnerweiterleitung | Keine lokale Einzelangebots-Schnittstelle. API-Zugang und erlaubte Speicherung müssen konkret bestätigt sein; Widget-Inhalte dürfen nicht ausgelesen und als eigene Angebote gespeichert werden. |
| Flüge | Travelpayouts-White-Label | Die vorhandene Nachrichtenprüfung in `lib/providers/travelpayouts/rahmen.ts` akzeptiert Bereitschaft/Fehler, keine Flugangebote. Ein freigegebener strukturierter Angebotsweg fehlt. |
| Aktivitäten | GetYourGuide-/Viator-Widgets; zusätzlich native Such-/Übernahmemodelle | Widget-Angebote haben keinen lokalen Übernahmevertrag. Der native Kontoweg ist ebenfalls geschlossen: `activityNachweisAusUmgebung()` in `lib/activities/nachweis.ts` gibt immer `null` zurück. Ein zusätzlicher Vorauswahldialog würde diesen fehlenden serverseitigen Angebotsnachweis nicht lösen. |
| Mietwagen | Strukturierter DiscoverCars-Vertrag mit Angebots-ID, Token, Preis, Abhol-/Rückgabedaten und Ablaufzeit | `lib/rental-cars/konto-uebernahme.ts` verwendet im Standardaufruf noch leere Nachweis-/Reise-/Suchadapter. Ein sicherer serverseitiger Adapter vom DiscoverCars-Angebot zum vorhandenen Kontomodell fehlt. Clientseitige Preiswerte dürfen den Nachweis nicht ersetzen. |
| Verbindungen | Omio-Weiterleitung und lokale Routenvormerkung | `OmioVergleich.tsx` merkt Route/Verkehrsmittel auf diesem Gerät; das ist kein bestimmtes Ticket und keine kontoweite Angebotsmerkliste. Ein offizieller Einzelangebotsvertrag fehlt. |

Die vorhandenen nativen Übernahmemodelle prüfen Etappe/Tag sowie Suchkontext und führen die Einträge als unbestätigt, nicht als gebucht. Flugmodelle können lokale Abflug-/Ankunftsdaten und Folgetage ausdrücken. Diese Schutzmechanismen wurden nicht verändert oder umgangen.

Ein konkretes Freigabepaket für eine spätere echte Merkliste benötigt:

1. Pro Anbieter einen bestätigten Datenvertrag für Referenz, Titel, Ziel, Zeitangaben, verifizierte Weiterleitung und gegebenenfalls erlaubte Bilder/Preise inklusive Verfallsregeln. Suchlinks und konkrete Angebote müssen unterscheidbar bleiben.
2. Eine neue benutzereigene Referenztabelle, beispielsweise mit `user_id`, Kategorie, Anbieter, Angebotsreferenz, zulässigem Suchkontext, optionaler Reise-/Etappen-/Tageszuordnung und Zeitstempeln. Preis-/Bild-Snapshots nur bei ausdrücklicher Erlaubnis des Anbieters; keine versteckten Favoriten in `trip_items`.
3. RLS und Serveraktionen zur Eigentumsprüfung sowie einen Adapter zu den bestehenden validierten Übernahmewegen. Aufenthaltsspannen, lokale Flugzeiten und Ankunft am Folgetag gehören in den Angebotsvertrag, nicht in heuristisch erfundene Werte.
4. Bei eindeutigem Reise-/Etappen-/Tageskontext direkte Übernahme; andernfalls ein kleiner vorausgefüllter Dialog. Merken und Planen bestätigen weiterhin keine Buchung.

Dieses Paket ist nur dokumentiert. Es wurden keine Tabellen, RLS-Regeln, Anbieterzugänge, Auth-Flows oder Umgebungsvariablen geändert.

Quellen zur späteren Vertragsprüfung: [Stay22 Maps](https://dev.stay22.com/docs/maps), [Stay22 API](https://dev.stay22.com/docs/api), [Travelpayouts White Label Web](https://support.travelpayouts.com/hc/en-us/articles/203955753-What-is-White-Label-Web-by-Travelpayouts), [Viator Technical Guide](https://partnerresources.viator.com/travel-commerce/technical-guide/). Keine dieser allgemeinen Dokumentationen ersetzt eine Freischaltung oder den konkreten Vertrag des Jetnity-Kontos.

## Prüfung

Gezielte Node-Tests: 15 erfolgreich, keine übersprungen. Enthalten sind Zielauflösung (Paris, widersprüchliche IDs/Länder, länderspezifische Altbestände, mehrere Etappen), die Paris-Leerzustand-Regression, die bestehenden Katalogtests und bestehende GetYourGuide-Flächentests.

ESLint für die geänderten TS/TSX-Dateien: keine Fehler; zwei bereits vorhandene `set-state-in-effect`-Warnungen in `AktivitaetenBereich.tsx` bleiben bestehen. `git diff --check` ist erfolgreich. Die vollständige TypeScript-Prüfung im separaten Worktree ist durch fehlendes `leaflet`/Leaflet-Typen in den übernommenen `node_modules` blockiert (betroffen: unveränderte Streckenkarte/Etappenkarte); es wurden dafür keine Abhängigkeiten geändert.

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/organisieren/reisebilder.test.ts lib/trips/organisieren/katalog.test.ts lib/activities/organisieren-zielanzeige.test.ts lib/activities/getyourguide/flaeche.test.ts
```

Die integrierte private Browser-Vorschau, responsive Bildausschnitte und übergreifende Prüfung erfolgen im Hauptarbeitsverzeichnis. In diesem Teilzweig wurden keine Browser-/Production-/Datenbankaktionen ausgeführt und nichts veröffentlicht oder gemergt.


## Automatische Ergänzung – 13. November, neuer Umsetzungsschritt

Für Ziele ausserhalb des lokalen Katalogs wird jetzt die exakte GeoNames-Kennung
zusammen mit dem Land über Wikidata aufgelöst. Nur eindeutig zugeordnete Commons-
Bilder mit akzeptierter freier Lizenz und vollständiger Attribution werden verwendet.
Keine Namenssuche, keine Bildgenerierung, kein API-Schlüssel, keine neue Datenbank.
Fehlende Zuordnung oder unklare Rechte bleiben neutral. Vorhandene lokale Motive,
insbesondere Paris, bleiben konsistent. Urheber, Originalseite und Lizenz stehen
verlinkt bei den Reisekarten sowie im Plan und Organisieren.

Neue Grenze: `/api/travel-images` liest ausschliesslich feste Wikimedia-Endpunkte,
validiert Zielkennung/Land, begrenzt Antwortgrösse/Timeout und Parallelität und cached
öffentliche Metadaten. Kein Bildproxy und keine Erweiterung von Next Image Remote-
Patterns. HTML-Metadaten werden nur als bereinigter Text verwendet. Bilder werden
unverändert vom Commons-Bildhost geladen; der Darstellungszuschnitt ist bezeichnet.

Live-Metadatenprobe Berlin (`geonames:2950159`, DE): `Cityscape Berlin.jpg`,
Thomas Wolf, www.foto-tw.de, CC BY-SA 3.0, Originalquelle
https://commons.wikimedia.org/wiki/File:Cityscape_Berlin.jpg.
33 gezielte Tests bestanden (einschliesslich Eingabe-/Lizenzgrenzen und bestehenden
Workspace-/Bildtests). Die Browserabnahme des neuen Deployments steht noch aus.

Offizielle Schnittstellen: https://www.mediawiki.org/wiki/API:Imageinfo und
https://www.wikidata.org/wiki/Wikidata:Data_access. Diese Erweiterung ersetzt die
oben dokumentierte frühere reine Zehn-Ziele-Grenze; ohne freie Aufnahme bleibt der
Fallback bewusst bestehen.
