# Organisieren – Mobile Routing, 25. November 2026

Auftrag #1311. Ausgang `a32c888f`, danach `main` `c52b9df12` ohne Force-Push. Keine Datenänderung, kein Production-Deploy, kein Login. #1307 und #1308 sind unberührt.

## Vorher-Befund auf dieser Basis

Synthetische Gastreise `trip-phuket-routing` im lokalen Dev-Server: Abflug Zürich, Etappe Phuket, drei Flüge (ZRH–BKK, BKK–HKT, HKT–ZRH) plus Unterkunft, Aktivität, Mietwagen und Verbindung. Pfad: Reise öffnen, Organisieren, Kategorie, gespeicherten Eintrag antippen.

Playwright-WebKit lädt den Next-Dev-Server nicht. Die Seiten-CSP enthält `upgrade-insecure-requests`. WebKit fordert darauf `https://localhost` an, der Dev-Server spricht nur HTTP. Das ist kein Reise-Routing und kein Cache. Der gleiche Pfad lief in Chromium mit iPhone-Viewport 390×664, Touch und zusätzlich bei 1280×800.

| Schritt | URL | Sichtbar | KAYAK |
| --- | --- | --- | --- |
| Kategorie Flüge | `/reisen/trip-phuket-routing?ansicht=organisieren` | «Das hast du schon», drei Flüge, darunter das Booking-Formular «Flug suchen» (Zürich (ZRH) nach Phuket (HKT)) | nein |
| Antippen ZRH–BKK, 390 px, nachdem die Zeile frei über der unteren Leiste liegt | `?ansicht=plan&tag=day-1&punkt=flug-zrh-bkk` | Eintrag ZRH–BKK, «Ausgewählt», CHF 640, Knopf «Flug suchen», «Zur Route» | nein (`data-detail-suche=aus`) |
| derselbe Klick, 1280 px | dieselbe Adresse und dieselbe Eintrags-ID | dieselbe Karte, «Zur Route» im Detailkopf | nein |

Die gemeldeten Sätze «Deine Anreise», «Der passende Flug für deine Reise.» und «KAYAK · Testvorschau» standen auf diesem Pfad nicht im sichtbaren Dokument. «Zürich → Zürich» ebenfalls nicht. Die Flugabdeckung zeigt «Zürich → Phuket» und «Phuket → Zürich».

Auf 390×664 liegt die erste Flugzeile vor dem Scrollen unter der fixierten Leiste «Reisebereiche». `elementFromPoint` trifft dort `button.workspace-nav-link`, nicht die Zeile. Nach dem Scrollen trifft derselbe Touch die Zeile und öffnet den Eintrag. Die Revision der Reise blieb 1. Es wurde nichts gebucht und nichts gespeichert.

## Codepfad

`OrganisierenBestand` ruft `onItem(eintrag.id)` auf. `TripWorkspace.oeffneItem` prüft, dass die ID in dieser Reise liegt, und setzt `ansicht=plan` mit dieser `itemId`. `auswahlAusModus` baut daraus `itemAuswahl` mit `sucheOffen: false`. Die KAYAK-Fläche sitzt in `FlugSuche` und ist nur sichtbar, wenn die Suche ausdrücklich offen ist (`sucheIstOffen`).

Desktop ab 1024 px zeigt «Zur Route» im Detailkopf. Darunter ist die Rückkehrleiste die mobile Variante. Beide bleiben im Reiseplan. Der Browser-Zurücksprung kehrt nach Organisieren zurück.

## Unterschied Smartphone / Desktop

Dieselbe Funktion, dieselbe Adresse, dieselbe Eintrags-ID. Auf dem schmalen Viewport verdeckt die untere Leiste Zeilen, die noch im unteren Bildausschnitt liegen. Die Suche öffnet sich dadurch nicht. Ein bedingtes Rendering nur für Touch, das die KAYAK-Vorschau statt des Eintrags zeigt, ist im Code nicht vorhanden.

## Verbleibende legitime KAYAK-Pfade

Nicht entfernt. Sie starten erst am ausdrücklichen Knopf im geöffneten Eintrag:

- «Flug suchen» öffnet `FlugSuche`: zuerst `KayakFlights` («KAYAK · Testvorschau»), die bestehende Flugsuche hinter «Weitere Flugsuche öffnen».
- «Unterkunft suchen» öffnet `HotelBereich`: zuerst `KayakHotels`, die bestehende Suche hinter «Gegenden und weitere Unterkunftssuche öffnen».

Die fünf Reiter in Organisieren selbst nutzen weiterhin Booking-Flüge, Hotelsuche, Aktivitäten, DiscoverCars und Omio. Das sind andere Flächen.

## KAYAK-Meldung, getrennt

Die Sätze «Deine Anreise», «Der passende Flug für deine Reise.», «KAYAK · Testvorschau» und «Zürich → Zürich» liessen sich auf diesem Pfad nicht reproduzieren. Ein gespeicherter Eintrag öffnet den Planpunkt mit `data-detail-suche=aus`. Die Abdeckung zeigt «Zürich → Phuket». «Flug suchen» und «Unterkunft suchen» bleiben die ausdrücklichen KAYAK-Wege und wurden nicht entfernt.

## Überdeckung, vor dem Fix rot

Auf 390×664 liegt die erste gespeicherte Zeile im Bild, aber unter der fixierten Kosten- und Navigationsleiste. Der Test tippt die Koordinate an, ohne vorher `scrollIntoView` aufzurufen.

WebKit, echte `WorkspaceShell`, `workspace.css` und `workspace-surfaces.css`, Hell, Kategorie Flüge, `scrollY` 0:

- Zeile top 539, bottom 639, Leiste bei 547
- `elementFromPoint` trifft `button.workspace-cost-bar`, nicht die Zeile

Dieselbe Reise im Next-Dev-Server, Chromium, vor dem Fix: Zeile top 617, Leiste bei 591, Treffer `button.workspace-nav-link`. WebKit lädt den Dev-Server nicht: die CSP enthält `upgrade-insecure-requests`, und der Dev-Modus braucht `eval`, das die CSP nicht erlaubt.

## Fix

`organisierenZeileScroll` schiebt das Fenster so weit, dass die Unterkante der ersten Zeile 8 px über der fixierten Leiste liegt. Das gilt nur, solange die Leiste fest ist: Breite ab 360 und unter 1024, Höhe ab 500, normale Schrift, keine Tastatur. Bei 320 px und auf dem Desktop passiert nichts. Ein späteres Wachstum von Zeile oder Leiste wird neu gemessen. Die Routing-Funktion bleibt.

## Nach dem Fix

WebKit-Regression mit Shell und echten Darstellungs-Token, 5 × 320/390×664/1280 × Hell/Dunkel = 30, grün. Dunkel prüft `color-scheme: dark` und `--workspace-bg: #121921`. Je Kombination: erste Zeile nicht von der Leiste gedeckt, echter Touch oder Klick, richtige Reise- und Eintrags-ID, Suche zu, kein KAYAK-Text, kein horizontaler Überlauf, Fokus nicht in einer verborgenen Fläche, Zurück nach Organisieren.

Zusätzlich `next start` hinter lokalem HTTPS, WebKit, 390×664, dieselbe Gastreise. Kein Konsolenfehler. Nach dem Laden `scrollY` 122, Zeile bottom 583, Leiste bei 591, Treffer ist die Zeile. Der Tap öffnet `punkt=flug-zrh-bkk`. Dieselben fünf Kategorien liefern ihre eigene Eintrags-ID, ohne KAYAK-Text. Der Dev-Server in Chromium zeigt danach `scrollY` 135 und denselben Treffer auf der Zeile.
