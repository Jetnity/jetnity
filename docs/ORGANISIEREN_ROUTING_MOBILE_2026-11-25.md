# Organisieren – Mobile Routing, 25. November 2026

Auftrag #1311. Basis `main` `2daeff2cbbb2622163970bb05805d9868d3db486`. Keine Datenänderung, kein Production-Deploy, kein Login. #1307 und #1308 sind unberührt.

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

## Regression

`lib/trips/organisieren-routing-1/browser.test.ts` fährt WebKit über den bestehenden Harness-Weg (esbuild, lokaler Prüfserver, kein Next-Dev-Server). 5 Kategorien × 320/390/1280 × Hell/Dunkel = 30. Je Kombination: Reiter, vorhandener Eintrag, `punkt` und Reise-ID `trip-phuket-routing`, Suche zu, kein KAYAK-Text, kein horizontaler Überlauf, Fokus nicht in einer verborgenen Fläche, Zurück nach Organisieren, Revision unverändert.

Auf `main` ohne weitere Produktänderung ist dieser Lauf grün. Ein Vorher-Rot gibt es auf diesem Kopf nicht. Der Test hält den beobachteten Pfad fest, damit eine spätere Änderung die Testvorschau nicht ungefragt in den Eintrag legt. Hell und Dunkel setzen `color-scheme` und `data-workspace-theme`. Die Shell-Stylesheets der laufenden App lädt der Harness nicht mit. Die Kartenflächen bleiben deshalb die hellen Token. Der Gastpfad im Dev-Server wurde hell geprüft.
