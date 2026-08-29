# Jetnity – Ortsbasis

**Stand:** 29. August 2026 · Phase 3.1 / ADR-0196  
**Gilt für:** die lokale, provider-unabhängige Referenz `public.places` und `/api/search/places`.

Diese Datei beschreibt, woher Reiseziele und Abreiseorte kommen, was in die Suche darf und wie ein Refresh läuft. Entscheidung: ADR-0067 in [DECISIONS.md](../DECISIONS.md). Flughäfen als Verkehrsorte stehen in [docs/FLUGHAFEN.md](FLUGHAFEN.md). `public.airports` ist **keine** weltweite Destination-Datenbank.

---

## 1. Was die Basis ist – und was nicht

Startseite und `/planen` speichern den geografischen Kern einer Reise nur nach einer bestätigten Auswahl. Ein freier Text wie `Test` oder `Mordor` wird nicht als Ort abgelegt.

Die Autocomplete-Suche liest **nur** `public.places`. Sie hängt nicht an GeoNames-Webservices, Google, Nominatim, Amadeus oder Duffel.

Nicht gebaut:

- eine globale Places-Plattform
- ein Geocoding-Proxy
- eine Live-Abfrage gegen GeoNames bei jedem Tastendruck
- ein Dump im Git oder im CI-Image
- ein Schreibweg aus der öffentlichen Suche

Eine leere Tabelle bleibt eine leere Liste. Ein Fehler bleibt ein Fehler. Beides darf nicht in denselben Zustand fallen ([AGENTS.md](../AGENTS.md) Regel 15, ADR-0037).

---

## 2. Quelle und Lizenz

| Feld | Wert |
| --- | --- |
| Datensatz | [GeoNames](https://www.geonames.org/) Dump `allCountries` plus `countryInfo` |
| Verteilung | [download.geonames.org/export/dump](https://download.geonames.org/export/dump/) |
| Dateien | `allCountries.zip`, `countryInfo.txt` |
| Lizenz | [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) (CC BY 4.0) |
| Kosten | keine Lizenzkosten, kein API-Schlüssel, kein laufender Anbietervertrag |

GeoNames erlaubt die freie Nutzung der Dump-Dateien, sofern GeoNames namentlich genannt wird. Jetnity nutzt **nicht** den GeoNames-Webservice (kein Username, kein Credit-Kontingent).

Flughafen-Orte (`airport:ZRH`) kommen beim Import aus der bereits lokalen Tabelle `public.airports` (OurAirports, Public Domain). Sie ergänzen die Destination-Basis, ersetzen sie nicht.

Verworfene Alternativen:

1. *Nominatim öffentlich als Autocomplete.* Die Usage Policy verbietet schwere Autocomplete-Last; Selbst-Hosting wäre neue Infrastruktur.
2. *Google Places.* Kostenpflichtige API.
3. *`public.airports` als Destination-Datenbank.* Bali, Südtirol und Toskana sind keine Flughäfen.
4. *Eine erfundene Kurzliste.* Verboten: keine geratenen Ortslisten.

---

## 3. Filter

In `public.places` kommt nur, was als Reiseziel oder Abreise taugt:

| Typ | GeoNames | Schwelle |
| --- | --- | --- |
| Land | `PCLI`, `PCLD`, `PCLS`, `TERR` | alle |
| Region | `ADM1`; `ADM2` | ADM2 nur bei Einwohnerzahl ≥ 50 000 (Südtirol) |
| Insel | `ISL`, `ISLS`, `ATOL` | Einwohnerzahl ≥ 5 000 (Mallorca) |
| Stadt | `PPLC`, `PPLA`, `PPLA2`, `PPLA3`, `PPLG` oder `PPL*` | sonst Einwohnerzahl ≥ 5 000 (Zermatt bleibt) |
| Flughafen | aus `public.airports` | bestehender Airport-Filter |

Helipads und winzige `PPL`-Einträge (Fixtures: Mordor, Test, abcxyz) bleiben draussen.

IDs:

- `geonames:<numerische GeoNames-ID>`
- `airport:<IATA>`

---

## 4. Rollen

| Rolle | gültig | Beispiele |
| --- | --- | --- |
| Reiseziel | Land, Region, Insel, Stadt – **kein** Flughafen | Bali, Thailand, Südtirol, Toskana, Japan, New York, Mallorca |
| Abreise | Stadt oder Flughafen | Zürich, Luzern, Basel, ZRH |

Der Browser darf eine Place-ID behaupten. Gültig ist sie erst nach der Serverprüfung gegen `public.places` (`ortBestaetigen` / `reiseorteBestaetigen`). Dieselbe Regel gilt für Konto und Gast.

`title`, `origin` und `trip_stages.name` bleiben der menschenlesbare Text. `trips.origin_place_id` und `trip_stages.place_id` tragen die kanonische Referenz. Altbestand ohne diese Felder bleibt lesbar.

Der Modellweg löst Abreise und Etappen serverseitig gegen `public.places` auf. Ein eindeutiger Treffer (Name plus Ländercode) wird zur `place_id`. Mehrere plausible Treffer oder keiner bleiben ausdrücklich unaufgelöst – der Anzeigetext bleibt, die Referenz nicht. Dasselbe gilt für den Änderungsweg. Eine Place-ID aus dem Modell oder dem Browser ist untrusted und muss im Bestand stehen.

---

## 5. Suche

`GET /api/search/places?q=&rolle=` liest die lokale Tabelle und rangiert in Prozess. Kein Geocoding-Proxy.

Umlaute werden gefaltet (`Südtirol` trifft `South Tyrol` über Keywords). Gleichnamige Orte bleiben über Land/Region unterscheidbar (`Paris, France`).

Die Abfrage sucht zuerst im Namen und in der IATA, nicht im Land. Für die Abreise werden passende Flughäfen extra dazugeholt, damit `Zürich` auch `ZRH` trifft. Die breite Keyword-Ergänzung (`Südtirol`, `Toskana`) kommt nur dazu, wenn die Namenstreffer noch keine kleine, starke Menge bilden. Sonst würden `Thailand` oder `Japan` in den Städten desselben Landes untergehen.

Rang: exakter Name vor starkem Präfix vor späterem Wort oder Keyword. Rolle zählt mit: ein Land gewinnt als Reiseziel gegen lose Keyword-Treffer. Ein **exaktes Länder-Alias/Keyword** (geläufiger Kurzname in `keywords`, gespeicherter Name oft der offizielle Langname) gilt für Rolle `ziel` als Namenswahrheit. Das ist eine **ordinale** Regel, nicht nur ein Score-Bonus: gleichnamige Städte erben ihren Namen oft als Keyword aus dem Import (`asciiName`) und würden sonst Name+Keyword stapeln und das Land überholen. Abreise hebt die primäre Stadt und den zugehörigen Flughafen über Bezirke und entfernte Gleichnamen; Länder-Alias-Vorrang gilt dort nicht. Gleichnamige echte Orte bleiben über Typ, Region und Land unterscheidbar. Die Liste wird nicht aufgefüllt, nur damit sie lang wirkt; sichtbar bleiben etwa 4–6 relevante Treffer, höchstens 8 wenn alle weiterhin stark sind.

Für Rolle `ziel` holt der Länder-Alias-Nachzug **selektiv** nur Länder mit exaktem Namen oder exaktem Komma-Token (`ortLandAliasExaktfilter`). Die Retrieval-Muster folgen derselben Trim-Semantik wie das Ranking: umgebendes Whitespace am Token, auch am Feldende, zählt nicht. Er lädt nicht das ganze Länder-Universum und nicht per Substring-`ilike %token%`. Das Limit `ORT_LAND_UNIVERSUM` ist eine Sicherheitskappe, kein Transfer des Bestands. Rolle `abreise` holt keinen Länder-Nachzug.

Die Eingabe `Test` ist ein Platzhalter und liefert bewusst keine Treffer. Ein realer Ort wie Testaccio bleibt über den vollen Namen erreichbar.

Die Abfrage holt höchstens 40 Namenszeilen, für `ziel` selektive Exact-Länder-Alias-Zeilen (Limit 500 als Kappe, nicht als Universum-Transfer) und höchstens 40 Keyword-Zeilen. Die Antwort bleibt höchstens 6–8 Optionen. Sonderzeichen, die PostgREST-`.or()` oder `LIKE` zerlegen würden, werden vorher entfernt. Die UI zeigt den verständlichen Namen zuerst; IATA ist Zusatz, nie vorausgesetztes Wissen. Ein exaktes Länder-Alias wird als Anzeigename verwendet, wenn der gespeicherte Name der offizielle Langname ist; die Place-ID bleibt kanonisch. Jede Zeile trägt den Typ im Kontext (`Land`, `Stadt · Region, Land`, `Region · Land`, `Insel · Land`, `Flughafen · IATA · Ort, Land`) und als lesbare Pille, nicht nur als kleines rechtes Label. Teilen mehrere sichtbare Länder dasselbe exakte Alias, bleibt das Alias das Label; sichtbare Zeile und `aria-label` hängen kanonischen Namen und Ländercode an (`Land · {Name} · {Code}`). Ein eindeutiges Alias bleibt natürlich (`Schweiz` + `Land`). Persistiert wird weiterhin nur die kanonische Place-ID.

Startseite und `/planen` nutzen dieselbe Komponente (`OrtSuche`) und dieselbe Fachregel (`lib/places/auswahl.ts`, `lib/places/pruefen.ts`). Nur Text ohne bestätigten Treffer wird nicht als Ort gespeichert.

---

## 6. Import

Der einzige Schreibweg liegt im Repository und läuft von Hand:

```bash
npm run places:importieren
npm run places:importieren -- --datei lib/places/fixtures
npm run places:importieren -- --schreiben --entwicklung
```

Ohne `--schreiben --entwicklung` ist jeder Lauf eine Probe. `--schreiben` allein reicht nicht.

Vor dem Development-Schreiben ruft das Skript `ziel()` auf. Zeigt `SUPABASE_PROJECT_REF` auf ein eigenständiges Projekt statt auf einen Branch, bricht der Lauf ab. Production-Schreiben ist ein zweiter Weg (`--schreiben --produktion --projekt-ref`) und steht in [PRODUCTION_ROLLOUT.md](PRODUCTION_ROLLOUT.md).

Der GeoNames-Dump wird gestreamt (`unzip -p`) und schon beim Lesen gefiltert. Der volle Bestand liegt nicht im Speicher und nicht im Repository.

`npm run build`, `prebuild` und die CI rufen den Import nicht auf.

Der Anzeigename bleibt der offizielle GeoNames-Name, ausser bei den bekannten Verwaltungspräfixen `Provinsi` und `Kingdom of`, wenn der Rest bereits als Alternativname vorkommt (`Provinsi Bali` → `Bali`). Südtirol bleibt über Keywords auffindbar, auch wenn der gespeicherte Name englisch oder italienisch ist.

Im Development-Import vom 20. August 2026 stehen **124 811** Orte:

| Quelle | Typ | Anzahl |
| --- | --- | ---: |
| GeoNames | Stadt | 105 914 |
| GeoNames | Region | 13 035 |
| GeoNames | Insel | 290 |
| GeoNames | Land | 240 |
| OurAirports | Flughafen | 5 332 |

Production hat diese Tabelle noch nicht. Ein erneuter Development-Import mit `--schreiben --entwicklung` upsertet den Development-Bestand.

Nach dem ersten Import wurden auf Development die Anzeigenamen `geonames:1650535` → `Bali` und `geonames:1605651` → `Thailand` nachgezogen. Ein späterer Import wendet dieselbe Präfixregel selbst an.

---

## 7. Development befüllen

1. Migration `20260820120000_places_referenz.sql` nur auf dem Development-Branch anwenden (`npm run db:anwenden`).
2. Nachtrag `20260820130000_reise_aendern_places.sql` anwenden, damit `reise_aendern()` die Referenzen mitschreibt.
3. Typen neu erzeugen (`npm run db:typen`).
4. Airport-Bestand muss bereits existieren, weil Flughafen-Orte daraus kopiert werden.
5. Import schreiben: `npm run places:importieren -- --schreiben --entwicklung`.
6. Pflichtbeispiele prüfen: Bali, Thailand, Südtirol/Toskana, New York, Japan, Zürich, ZRH.

Production bleibt unverändert, bis der kontrollierte Rollout in [PRODUCTION_ROLLOUT.md](PRODUCTION_ROLLOUT.md) ausdrücklich freigegeben ist. Places kommen **nach** dem Airport-Import, weil Flughafen-Orte aus `public.airports` kopiert werden. Production-Schreiben braucht `--schreiben --produktion --projekt-ref`.

---

## 8. Attribution

Contains geographical data from [GeoNames](https://www.geonames.org/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Airport rows additionally derive from OurAirports Open Data (Public Domain).
