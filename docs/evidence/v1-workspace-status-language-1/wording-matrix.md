# V1 Workspace Status Language 1 — Wording matrix

Stand: 21. September 2026  
Quelle: bestehende kanonische Ableitungen, nicht ein zweiter Formatter.  
Before-Texte: Runtime auf Baseline/`f6372928` (identisch mit `main@4278cd04` für diese Dateien).  
After-Texte: dieser Slice. Nicht-textliche Felder bleiben gleich.

## Übersicht `fortschrittText`

| Machine state | Before | After | Unchanged non-text |
| --- | --- | --- | --- |
| alle `offen` | Noch nichts ausgewählt | Noch nichts ausgewählt | lagen `offen,offen,offen,offen` |
| alle `unbestimmt` | Abdeckung noch nicht vollständig bestimmbar | Stand der Bereiche noch unklar | keine Lage wird `belegt` |
| alle `belegt` | Wesentliche Bereiche sind belegt | Wesentliche Bereiche sind vorhanden | kein trip-ready/booked Claim |
| Mix belegt + offen | N von 4 Bereichen belegt · M offen | N von 4 Bereichen vorhanden · M noch offen | Zählung N/M unverändert |
| Mix teilweise | … teilweise abgedeckt | … nur teilweise geplant | `lage === teilweise` bleibt |
| Mix unbestimmt | … noch nicht vollständig bestimmbar | … noch unklar | `lage === unbestimmt` bleibt |
| kein Geräte-Kalender | Zeitliche Lage noch nicht bestimmbar | Zeitliche Einordnung noch unklar | `lage === null` |

## Flug `zusammenfassung` / Attention-Titel

| Machine state | Before | After | Unchanged non-text |
| --- | --- | --- | --- |
| `bestimmbar` + alle `open` + 0 Items | Noch kein Flug ausgewählt | Noch kein Flug ausgewählt | status `open` |
| `!bestimmbar` + 0 Items | Noch kein Flug ausgewählt | Flugstand noch unklar | `bestimmbar === false`, keine Abschnitte |
| `!bestimmbar` + 1 Item | 1 Flug ausgewählt · Abdeckung noch nicht vollständig bestimmbar | 1 Flug ausgewählt · Stand noch unklar | Item bleibt `unzugeordnet` |
| Abschnitte alle `unknown` | noch nicht vollständig bestimmbar | Flugstand noch unklar | status `unknown` |
| Mix known + unknown | … weitere Abschnitte noch nicht vollständig bestimmbar | … weitere Abschnitte noch unklar | known statuses bleiben |
| Hinflug `booked` + Rückflug `open` | Hinflug gebucht · Rückflug offen | Hinflug gebucht · Rückflug offen | booked ≠ selected ≠ open |
| Hinflug `booked` + Rückflug `selected` | Hinflug gebucht · Rückflug ausgewählt | Hinflug gebucht · Rückflug ausgewählt | selected ≠ booked |
| keine Strecke nötig | Kein Flugabschnitt erforderlich | Kein Flugabschnitt erforderlich | `abschnitte.length === 0` |
| Attention `offen` | Flugstrecke noch offen | Flugstrecke noch offen | `lage: known_gap` |
| Attention `teilweise` | Flugabdeckung nur teilweise | Flüge nur teilweise geplant | `lage: known_gap` |
| Attention `unbestimmt` | Flugabdeckung noch nicht vollständig bestimmbar | Flugstand noch unklar | `lage: unknown`, kein `known_gap` |

## Unterkunft `zusammenfassung` / Attention-Titel

| Machine state | Before | After | Unchanged non-text |
| --- | --- | --- | --- |
| bekannt + 0 Stays | Noch keine Unterkunft ausgewählt | Noch keine Unterkunft ausgewählt | `naechteAbgedeckt === 0` |
| unbekannt / Stay ohne Daten | Abdeckung noch nicht vollständig bestimmbar | Unterkunftsstand noch unklar | keine erfundene `0/14` |
| 2/4 Nächte | 2/4 Nächte abgedeckt | 2/4 Nächte abgedeckt | counts 2/4 |
| 4/4, davon 2 gebucht | 4/4 Nächte abgedeckt · 2 gebucht | 4/4 Nächte abgedeckt · 2 gebucht | booked ≠ selected |
| Attention `offen` | Unterkunftsnächte fehlen noch | Unterkunftsnächte fehlen noch | `lage: known_gap` |
| Attention `teilweise` | Unterkunftsnächte nur teilweise abgedeckt | Unterkunftsnächte nur teilweise geplant | `lage: known_gap` |
| Attention `unbestimmt` | Unterkunftsabdeckung noch nicht vollständig bestimmbar | Unterkunftsstand noch unklar | `lage: unknown` |

## Mobilität

| Machine state | Before | After | Unchanged non-text |
| --- | --- | --- | --- |
| `bestimmbar` + alle `open` | Noch keine Verbindung geplant | Noch keine Verbindung geplant | status `open` |
| `!bestimmbar` + 0 Transfers | Noch keine Verbindung geplant | Verbindungsstand noch unklar | `bestimmbar === false` |
| Kanten `unknown` | … noch nicht vollständig bestimmbar | … noch unklar | kein `covered_by_flight` aus Titel/Datum |
| `selected` / `booked` | ausgewählt / gebucht | ausgewählt / gebucht | selected ≠ booked |
| keine Bodenkante | Keine offene Bodenverbindung erkennbar / Keine Verbindung erforderlich | unverändert | `sucheAnbietbar === false` |

## Gap-Eyebrow / Nebenzeile / nächster Schritt

| Machine state | Before eyebrow | After eyebrow | Before secondary | After secondary |
| --- | --- | --- | --- | --- |
| Flug `offen` Pflicht | Lücke | Noch offen | Lage: Offen | Noch offen |
| Flug `unbestimmt` Pflicht | Lücke | Noch unklar | Lage: Noch nicht bestimmbar | Noch unklar |
| Flug `teilweise` Pflicht | Lücke | Teilweise offen | Lage: Teilweise | Nur teilweise geplant |
| Aktivitäten `offen` | Lücke | Optional | Lage: Offen · keine Pflichtlücke | Noch offen · kein Pflichtpunkt |
| Domain `belegt` | Lücke | Vorhanden | Lage: Belegt · keine Pflichtlücke | Vorhanden · kein Pflichtpunkt |
| `coveredByFlight` | Lücke | Hinweis | … über Flug abgedeckt | … durch den vorhandenen Flug abgedeckt |

| Machine state | Before next step | After next step |
| --- | --- | --- |
| `unbestimmt` | Die Lage ist noch nicht vollständig bestimmbar. Es wird kein fehlender Anbieter erfunden. | Der Stand ist noch unklar. Prüfe Reisedaten und vorhandene Einträge. Es wird kein Anbieter oder Ergebnis vorgetäuscht. |
| Aktivitäten | Aktivitäten sind optional. … ausdrücklich öffnest. | Aktivitäten sind freiwillig. … ausdrücklich öffnest. |
| Mobilität Pflicht | … Es gibt keinen Live-Mobilitätsadapter. | … Eine Live-Suche für Verbindungen gibt es hier nicht. |
| `coveredByFlight` | … Das ist keine offene Bodenmobilitätslücke. | … Es fehlt keine Bodenverbindung. |
| Flug/Stay offen | Du kannst den vorhandenen Bestand prüfen oder eine Suche ausdrücklich öffnen. | Du kannst vorhandene Einträge prüfen oder eine Suche ausdrücklich öffnen. |

## Rejected mappings

- unknown → „noch nicht gewählt“ / „noch nichts ausgewählt“
- unknown → `known_gap`
- „Anbieter folgt“
- Selection → Verfügbarkeit oder Buchung
- Fully covered section → ganze Reise ready/booked
- Gap-Eyebrow „Lücke“ für unknown, optional oder covered-by-flight
