# Realistic World Cartography 1 – Kartografie-Provenienz

Stand: 17. September 2026
Slice: Realistic World Cartography 1
Issue: #442 · Product-Owner-Direktive: #441 · Draft PR: #443
Binding: `docs/REALISTIC_WORLD_CARTOGRAPHY_1_TASK_2026-09-17.md`

Dieses Dokument beantwortet eine Frage vollständig: **Woher kommt die Geometrie der Account-Weltkarte, unter welcher Lizenz steht sie, und wie kommt aus der Quelle Zeichen für Zeichen die Datei im Repository?**

---

## 1. Quelle

| Feld | Wert |
| --- | --- |
| Datensatz | Natural Earth, Vektor |
| Herausgeber | Natural Earth (naturalearthdata.com), gepflegt u. a. von Nathaniel Vaughn Kelso und Tom Patterson |
| Bezugsrepository | `github.com/nvkelso/natural-earth-vector` |
| Release/Tag | `v5.1.2` (fest verdrahtet, kein `master`) |
| Verzeichnis | `geojson/` |
| Detailstufe | 50m („1:50 Millionen“) |
| Lizenz | **Public domain.** Natural Earth: „All versions of Natural Earth raster + vector map data found on this website are in the public domain. You may use the maps in any manner, including modifying the content and design, electronic dissemination, and offset printing. The primary authors, Tom Patterson and Nathaniel Vaughn Kelso, and all other contributors renounce all financial claim to the maps and invite you to use them for personal, educational, and commercial purposes. No permission is needed to use Natural Earth. Crediting the authors is unnecessary.“ |

Bezugsadresse der drei verwendeten Dateien (Build-Zeit, nie zur Laufzeit):

```
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_land.geojson
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_boundary_lines_land.geojson
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_lakes.geojson
```

Prüfsummen der geladenen Quelldateien (auch in `lib/account/world-map-geografie.ts` hinterlegt):

| Datei | Bytes | SHA-256 |
| --- | --- | --- |
| `ne_50m_land.geojson` | 1 636 166 | `e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b` |
| `ne_50m_admin_0_boundary_lines_land.geojson` | 760 189 | `2faac4f6b34386f3d21b6e018cf151f241f00e5c936d44dd17d7d9bfb147fa48` |
| `ne_50m_lakes.geojson` | 876 018 | `d350b75978b26fe839b797c2c529b2fb8f47fb3983c03f4964e36d5df9378a52` |

Es wurde **keine** proprietäre Geometrie, Kachel, Beschriftung oder Gestaltungsvorlage von Google, Apple, Mapbox, HERE, MapTiler, ArcGIS oder OpenStreetMap übernommen.

Nennung an der Karte: Natural Earth verlangt keine Namensnennung. Jetnity nennt die Quelle trotzdem sichtbar unter der Karte (`WORLD_MAP_GRUNDKARTE_HINWEIS`), weil eine Karte ohne erkennbare Herkunft eine Behauptung ohne Quelle ist.

---

## 2. Erzeugung

Erzeuger: `scripts/kartografie/weltkarte-geometrie.mjs`
Ausgabe: `lib/account/world-map-geografie.ts` (erzeugt, nicht von Hand gepflegt)

```
node scripts/kartografie/weltkarte-geometrie.mjs           # erzeugen
node scripts/kartografie/weltkarte-geometrie.mjs --pruefen # Drift-Check
node scripts/kartografie/weltkarte-geometrie.mjs --messen  # nur Kennzahlen
```

Die Quelldateien liegen unter `.cache/naturalearth/` und sind über `.gitignore` ausgeschlossen. Fehlen sie, lädt das Skript sie einmalig von der oben genannten Adresse. Im Repository liegt nur das Ergebnis.

### Schrittfolge je Ring beziehungsweise Linie

1. **Zuschneiden** auf den gezeigten Ausschnitt (Sutherland-Hodgman für Flächen, Liang-Barsky für Linien). Ausschnitt: `lon −180 … 180`, `lat −58 … 84`. Das Skript liest den Ausschnitt aus `lib/account/world-map-ansicht.ts` und bricht ab, wenn beide auseinanderlaufen.
2. **Mindestgrösse** prüfen: Flächen unter 0,05 Quadratgrad (Gausssche Trapezformel, mit dem Kosinus der mittleren Breite korrigiert; rund 620 km² am Äquator) entfallen. Sie wären auf 1280 px Kartenbreite unter einem Bildpunkt. Für Binnenseen gilt 1,2 Quadratgrad, damit nur die weltweit orientierungsrelevanten Seen bleiben.
3. **Vereinfachen** mit Douglas-Peucker, Toleranz 0,25 Grad.
4. **Projizieren und runden**: `x = lon + 180`, `y = 90 − lat`, eine Nachkommastelle. Danach entfallen aufeinanderfolgende gleiche Punkte.
5. **Schreiben** als SVG-Pfad; Flächen geschlossen (`Z`), Grenzen offen.

### Warum diese Parameter

| Entscheidung | Begründung |
| --- | --- |
| Detailstufe **50m** statt 110m | Bei gleicher Nutzlast deutlich mehr erkennbare Wirklichkeit: Inselgruppen (Indonesien, Philippinen, Karibik, Ägäis), Patagonien, Fjorde, Japan. Gemessen, nicht geschätzt – Tabelle unten. |
| Toleranz **0,25 Grad** | Entspricht rund 0,9 px bei 1280 px Kartenbreite und rund 0,27 px bei 390 px. Sie liegt damit unter dem, was das gezeigte Bild auflösen kann; im Direktvergleich mit 0,15 Grad ist kein Unterschied sichtbar, die Datei aber 40 KB kleiner. |
| **Eine** Nachkommastelle | 0,1 Grad sind bei 1280 px rund 0,36 px. Zwei Stellen kosten Bytes ohne sichtbaren Gewinn. |
| Gleichwinklige Projektion | Nicht gewählt, sondern übernommen: `weltKarteProjektion` in `lib/account/world-map.ts` setzt gespeicherte Etappenkoordinaten genau so. Jede andere Projektion hätte die Marker von ihren Küsten getrennt. |
| Antarktis fehlt | Sie liegt vollständig südlich von −58°. Der gezeigte Ausschnitt stammt aus World Map Polish 2 und wurde hier nicht verändert. Nichts anderes wird vom Zuschnitt getroffen: der nördlichste Landpunkt liegt bei 83,65°, der südlichste ausserhalb der Antarktis bei rund −55,9°. Es entsteht deshalb keine künstliche gerade Schnittkante. |

### Gemessene Alternativen

Jede Zeile ist ein echter Lauf des Erzeugers; „Geometrie“ ist die Summe aller Pfadzeichen.

| Variante | Landflächen | Landpunkte | Geometrie | Geometrie gzip |
| --- | ---: | ---: | ---: | ---: |
| 110m, Toleranz 0,00 | 120 | 4 343 | 89,4 KB | 29,0 KB |
| 110m, Toleranz 0,12 | 119 | 3 340 | 68,6 KB | 22,7 KB |
| 110m, Toleranz 0,20 | 118 | 2 659 | 54,7 KB | 18,4 KB |
| **50m, Toleranz 0,25 (gewählt)** | **278** | **4 326** | **74,3 KB** | **24,8 KB** |
| 50m, Toleranz 0,15 | 359 | 6 843 | 113,5 KB | 36,2 KB |
| 50m, Toleranz 0,35 | 172 | 2 921 | 53,5 KB | 18,2 KB |

Die gewählte Variante liefert 50m-Erkennbarkeit zum Preis einer 110m-Karte.

### Reproduzierbarkeit

Nachgewiesen: in einem frischen Arbeitsverzeichnis ohne `.cache/` lädt das Skript die drei Quelldateien neu, erhält dieselben SHA-256-Werte und erzeugt eine **byte-identische** Ausgabedatei (`--pruefen` meldet „ist aktuell“).

---

## 3. Ergebnis

| Ebene | Pfade | Stützpunkte |
| --- | ---: | ---: |
| Land (mit Loch Kaspisches Meer) | 278 | 4 326 |
| Binnenseen | 14 | 167 |
| Internationale Landgrenzen | 397 | 1 851 |

| Grösse | Wert |
| --- | ---: |
| Pfaddaten roh | 76 089 B |
| Pfaddaten gzip | 25 361 B |
| erzeugtes Modul roh | 82 096 B |
| erzeugtes Modul gzip | 27 822 B |

Vorher: elf handgezeichnete Ringe mit 192 Stützpunkten, ohne Seen und ohne Grenzen.

### Client-Nutzlast, gemessen am Production-Build

Der Account-Client-Chunk, der `Deine Welt` enthält:

| | roh | gzip | brotli |
| --- | ---: | ---: | ---: |
| vorher (`main@03842a64`) | 35 780 B | 12 145 B | 10 731 B |
| nachher | 102 431 B | 35 391 B | 25 983 B |
| **Differenz** | **+66 651 B** | **+23 246 B** | **+15 252 B** |

Vercel liefert Brotli aus; über die Leitung kostet die echte Weltgeografie also rund **15 KB**. Kein neues npm-Paket, keine Kartenbibliothek, keine bezahlte Abhängigkeit, keine neuen laufenden Kosten.

Im Gegenzug sinkt die Zahl der Elemente im Dokument: 11 `path`-Elemente und 29 SVG-Knoten werden zu **3 `path`-Elementen und 22 SVG-Knoten**, weil jede Ebene als ein zusammengesetzter Pfad gezeichnet wird. Die Löcher trägt `fill-rule="evenodd"`.

---

## 4. Grenzen sind Orientierung, keine Aussage

Die Ebene der internationalen Landgrenzen verbessert die Orientierung erheblich – ohne sie ist Europa eine grüne Fläche. Sie ist aber ausdrücklich **keine** Aussage Jetnitys über völkerrechtliche Grenzverläufe, Hoheit, Anerkennung oder Streitfälle.

Dieser Vorbehalt steht an drei Stellen und nicht nur in dieser Datei:

- sichtbar unter der Karte (`WORLD_MAP_GRUNDKARTE_HINWEIS`),
- im Kopf der erzeugten Datei,
- als Feld `grenzenSindOrientierung: true` in `WORLD_MAP_GEOGRAFIE_HERKUNFT`.

Jetnity leitet aus der Karte keine Einreise-, Visa-, Transit- oder Zugehörigkeitsaussage ab. Reisewahrheit hängt weiterhin ausschliesslich an gespeicherten Etappendaten.

---

## 5. Was zur Laufzeit passiert

Nichts wird geladen. Kein Kartendienst, keine Kachel, keine Ortsauflösung, keine Quelldatei, kein Schriftschnitt für die Karte.

Belegt durch:

- `lib/account/world-map.test.ts`: die Dateien der Weltkarte enthalten keine URL und kein Anbieter-Stichwort; `WORLD_MAP_GEOGRAFIE_HERKUNFT.runtimeFetch === false`;
- `scripts/kartografie/weltkarte-belege.mjs`: der Lauf protokolliert **jede** Netzwerkanfrage der Seite. Ergebnis auf allen drei Breiten: ausschliesslich `http://127.0.0.1:<port>`, keine fremde Herkunft (`docs/evidence/realistic-world-cartography-1/nachher-bericht.json`).
