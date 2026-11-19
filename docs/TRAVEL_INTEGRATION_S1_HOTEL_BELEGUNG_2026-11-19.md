# Reiseintegration S1 — Hotel-Etappen-Belegung

**19. November 2026.** Issue [#1256](https://github.com/Jetnity/jetnity/issues/1256). Branch `feat/travel-integration-20261119`, Basis `65c0720bfc39bef9972e6d2df456455b617ac269`. Nur dieser Auftrag. S2, S3 und S4 sind nicht umgesetzt.

## Ergebnis

Die vorhandene Hotelsuche übernimmt den Aufenthalt einer Etappe aus `hotelZeitraumAusEtappe`. Zwei gleiche Ziele, zum Beispiel zweimal Bangkok, behalten jeweils die eigenen Daten. Fehlt bei mehreren Etappen eine Grenze, wird der Reisezeitraum nicht eingesetzt. Eine ungültige Spanne wird nicht als Aufenthalt angezeigt. Eine einzelne Etappe ohne eigene Daten darf weiterhin die Reisedaten nutzen; der Hinweis sagt das.

Erwachsene, Kinder und Zimmer werden nicht aus `Trip.travellers` und nicht aus `Trip.party` vorbelegt. Die Kopfzahl erscheint als Personenzahl. Die Suche läuft erst, nachdem diese drei Felder gesetzt sind. Mehrere Zimmer oder mindestens ein Kind erzeugen den Hinweis, Kinderalter und Zimmeraufteilung beim Anbieter zu bestätigen. Die Stay22-URL enthält weiterhin nur `adults`, `children` und `rooms`.

Eigene Datums- und Belegungseingaben bleiben je Etappe erhalten. „Reisedaten übernehmen“ und „Belegung zurücksetzen“ stellen nur den jeweiligen Teil auf die ehrliche Vorlage zurück. Gast ohne Party und Konto mit Party ohne Geburtsdatum ergeben dieselbe Vorlage.

Funktion 18 im Gesamtplan vom 18.11. bleibt **P**. Dieser Stand ist die Autorenlieferung, kein Technical-Lead-PASS und kein Hosted-Nachweis.

## Grenzen

- Kein PR, solange #1254, #1252 und #1240 offen sind.
- Keine Datenbank, keine Migration, keine neue öffentliche Schemawahrheit.
- Keine Provideraktivierung, kein kostenpflichtiger Aufruf, keine Buchung.
- Keine Änderung an Viator, GetYourGuide, DiscoverCars, Flügen oder der Merkliste.
- `hotelDaten` für Karten und andere Aufrufer bleibt unverändert. Nur der Suchentwurf nutzt die strengere Terminableitung.
- Live-Anbieteranzeige, physisches Mobilgerät und Preview sind nicht Teil dieses Laufs.

## Tests

`node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/hotel-suchbelegung.test.ts lib/trips/hotel-suchbelegung-ui.test.ts lib/hotels/reisegraph.test.ts lib/providers/stay22/suche.test.ts lib/trips/organisieren/katalog.test.ts lib/trips/hotel-suchkontext.test.ts`

Abgedeckt: Solo, zwei Personen, Familie, mehr Zimmer als Erwachsene, zweimal Bangkok, fehlende, halbe und verkehrte Daten, eine Etappe mit Reisefallback, Gast/Konto, Etappenwechsel mit getrenntem Rücksetzen, Stay22-Parameter ohne Kinderalter, sowie die gerenderte Hotelsuche für vier Personen und eine Person. Lokaler Lauf: 34 bestanden, 0 übersprungen. `tsc --noEmit` und ESLint der geänderten Dateien ohne Befund. `check:exports` und `check:dead` ohne neue Verweise. Das ist kein Live-Anbieter- und kein Geräte-Nachweis.

## Nächster Schritt

Unabhängiger Technical-Lead-Review dieses Branch-Heads. Danach erst S2, und ein PR erst, wenn ein Slot unter dem Limit von drei offenen PRs frei ist.
