# Lokale Orts-Fixtures

`geonames.tsv` ist ein kleiner Auszug im Format der GeoNames-Datei `allCountries.txt` für lokale Importer-Läufe, Tests und Audit-Skripte (kein Produktionsdatenbestand). Die Datei wird zeilenweise gelesen; Kommentarzeilen sind darin nicht erlaubt, deshalb steht die Herkunft hier.

Quelle: GeoNames (https://www.geonames.org/). Zuordnung von Kennung und Name am 27.11.2026 auf den öffentlichen GeoNames-Seiten gelesen (`/2657915/` Zofingen, `/2657928/` Zermatt); Koordinaten, Klasse, Region und Bevölkerung nach den Angaben des Technical Lead im PR-Review ([#1320 (comment)](https://github.com/Jetnity/jetnity/pull/1320#issuecomment-7207422459)), nicht unabhängig neu vermessen:

| geonameid | Name | Land / Region | Klasse | Koordinaten | Hinweis |
|---|---|---|---|---|---|
| `2657915` | Zofingen | CH / AG | PPLA2 | 47.28779, 7.94586 | Bevölkerung im Auszug bewusst `0` (nicht erfasst); PPLA2 wird vom Importer unabhängig von der Bevölkerung behalten |
| `2657928` | Zermatt | CH / VS | PPL | 46.01998, 7.74863 | Bevölkerung 5820 (≥ 5000, Importer-Schwelle für PPL), Höhe 1608 m |

Beide Orte sind getrennte Datensätze. Frühere Fassungen führten Zermatt fälschlich unter `2657915`; das ist Zofingen. Die Planung übergibt Zermatt mit `geonames:2657928` (`zielId` in `lib/places/inspiration.ts`); `geonames:2657915` bleibt als redaktionelle CMS-Identität der Reiseidee erhalten (ADR-0250, Fortschreibung 27.11.2026) und wird nie als Zermatt behandelt.
