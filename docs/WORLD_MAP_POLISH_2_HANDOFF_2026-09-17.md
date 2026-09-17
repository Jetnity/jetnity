# World Map Polish 2 – Implementation Handoff

Stand: 17. September 2026  
Status: **IMPLEMENTED / STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW**

Issue: #436  
Draft PR: #437  
Branch: `feat/phase-1-world-map-polish-2`  
Binding: `docs/WORLD_MAP_POLISH_2_TASK_2026-09-17.md`  
Cursor-Agent: **`Jetnity world map polish 2`**  
Generation: **1**  
Parent model: **Claude Opus 5 High**

Canonical base: `main@15aa125addf39b15dcb50a1cdf8dece661796fc5`  
Initial task head: `abcb09a0ac916aa818a944a7c876dc7ca32ec787`

Der exakte Review-Head ist der letzte Commit dieses Branch inklusive dieser Evidenzdokumente. Ein neuer Head macht die hier genannten Gates ungültig und braucht ein neues Gating.

---

## Was geändert wurde und warum

### 1. Der graue Balken war kein Kontinent

`lib/account/world-map-land.ts` enthielt eine „Antarktis“, die in Wahrheit ein Rechteck von −63,2° bis zum Pol war. Es erschien als voll breiter grauer Balken unter der Karte – das prototypische Artefakt aus dem Product-Owner-Feedback. Der Platzhalter ist entfernt, nicht überdeckt. Eine Regression prüft, dass kein Landpfad mehr über die ganze Projektionsbreite läuft.

### 2. Der gezeigte Ausschnitt ist jetzt eine eigene Ebene

Neu: `lib/account/world-map-ansicht.ts`.

- `WORLD_MAP_RAHMEN` zeigt 84° N bis 58° S. Die leeren Polbänder verschwinden, die bewohnte Welt füllt den Rahmen.
- `weltKarteProjektion()` in `lib/account/world-map.ts` bleibt unverändert (`x = lon + 180`, `y = 90 − lat`). Der Rahmen leitet seinen Nullpunkt aus `WORLD_MAP_VIEWBOX` ab; die Wahrheitsschicht rechnet nicht neu.
- Koordinaten ausserhalb des Ausschnitts werden **nicht** an den Rand geschoben. Sie verlieren ihren Marker und bekommen in der Liste `Gespeicherte Koordinaten liegen ausserhalb des gezeigten Kartenausschnitts.` sowie einen Hinweis unter der Karte. Clamping wäre eine erfundene Position.
- Ein deterministisches Gradnetz (11 Meridiane, 4 Parallelen) macht die Fläche als Karte lesbar. Rein lokal, kein Asset, kein Fetch.

### 3. Dichte Marker waren nachweisbar unbedienbar

Beim Nachfahren der Interaktion mit Playwright liess sich der Kyoto-Marker **nicht** anklicken: Tokios 44px-Trefferfläche lag darüber (`subtree intercepts pointer events`). Zwei Punkte, die auf einer Weltkarte 4px auseinanderliegen, können nicht zwei getrennte 44px-Flächen haben.

Lösung ohne Zusammenlegen:

- Punkte innerhalb von 5 Projektionsgrad teilen eine Trefferfläche (`WORLD_MAP_MARKER_ABSTAND`).
- Die Fläche sitzt auf den **gespeicherten Koordinaten ihres ersten Ortes**, nicht auf einem gemittelten Kunstpunkt.
- Der Marker zeigt die Anzahl und öffnet eine Auswahl **unter** der Karte. Er entscheidet nicht selbst, welcher Ort gemeint war – derselbe Grund, aus dem `herkuenfte[0]` in World Map 1 abgelehnt wurde.
- Die Auswahl steht unter der Karte statt als Überlagerung darauf: eine am Punkt verankerte Blase lief bei 390px messbar über den Rand (`scrollWidth 417 > 390`).
- Die Orte bleiben getrennte Orte: getrennt in der Liste, getrennt auswählbar, getrennte `tripId`-Aktionen.

### 4. Gleich betitelte Reisen sehen nicht mehr gleich aus

`WorldMapReise` trägt jetzt `tripStatus`, `startDate` und `endDate` – alles Felder, die `reisenLaden()` bereits liefert. Keine zweite Abfrage, keine Ableitung.

- Sichtbar: `Lissabon` / `Geplant · 12.–16. Sept. 2026` gegen `Lissabon` / `Entwurf · 2.–9. Apr. 2027`.
- Status kommt aus `STATUS_BEZEICHNUNG`, nicht als Rohwert `planned`.
- Fehlen Daten, steht dort `Zeitraum offen`. Es wird kein Datum erfunden.
- Sähen Titel **und** Meta identisch aus, ergänzt `Reise 1 von 2` die Unterscheidung.
- Navigation bleibt `/reisen/{tripId}`; das `aria-label` enthält Titel, Meta und die `tripId`.

### 5. Status ruhig statt dominant

- Zwei grosse Statuskarten sind zu einer zweizeiligen Legende geworden, deren Marken die Kartenmarker spiegeln. Nicht nur Farbe: gefüllter Punkt gegen gestrichelten Ring, dazu immer Text.
- `Besucht bestätigt · Noch nicht erfasst` in der Legende, der vollständige Satz als ruhige Fussnote in `text-xs`.
- `zusammenfassung` zeigt keine Null mehr: `1 Ort auf der Karte` statt `1 Ort auf der Karte · 0 ohne gespeicherte Koordinaten`.
- Der leere Zustand steht nicht doppelt: die Legende sagt `Noch keine geplanten Orte`, der volle Satz steht unter der Karte.

### 6. Die Besucht-Unterscheidung überlebt jetzt den Lesefehler

Die V1-Karte zeigte `Besucht bestätigt` nur im Erfolgsfall. Gerade wenn die Reisen nicht geladen werden konnten, ist die stille Annahme „dann ist eben nichts erfasst“ am gefährlichsten. Die Legende trägt die Unterscheidung deshalb in jedem Zustand; nur die geplante Hälfte entfällt im Fehlerfall, weil dazu keine Aussage möglich ist.

### 7. Bewegung und Bedienung

- `scrollIntoView` prüft `prefers-reduced-motion` und fällt auf `auto` zurück.
- Nur die Kartenfläche wird beschnitten. Die Marker-Ebene bleibt frei, damit ein Punkt am Rand seine ganze Trefferfläche behält; der Innenabstand der Karte trägt den Überhang.
- Fokusringe nutzen `ring-ring` aus dem Design-System.
- Desktop: volle Kartenbreite, Ortskarten darunter in 2 bzw. 3 Spalten.

---

## Wahrheitsvertrag – unverändert

- geplant ≠ besucht; `besuchtLage` bleibt `nicht_erfasst`
- kein `0 besucht`
- kein Land aus Name, Koordinaten oder `placeId`
- keine Koordinaten aus Name, Land oder `placeId`
- kein Besuch aus Datum, Status, Archiv oder Reihenfolge
- Lesefehler ≠ leere Welt
- keine zweite Reiseabfrage, kein Service-Role-Read
- kein externes Karten-/Tile-/Geocoder-Runtime, kein neues Paket
- keine neue Persistenz, keine Migration

## Gates auf dem finalen Head

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **3231 pass / 0 fail** (3228 auf dem Basis-Head + 3 neue Suites) |
| `lib/account/*.test.ts` fokussiert | **120 pass / 0 fail** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors**, 138 vorbestehende warnings |
| `npm run check:dead` | pass |
| `npm run check:exports` | pass, 0 Exporte ohne Aufrufer |
| `npm run check:deps` | pass |
| `npm run check:api-schutz` | pass |
| `npm run check:schema-bezug` | pass |
| `npm run build` | pass, `Compiled successfully` |
| `npm run audit:account` | **48/48 grün** |

Nicht gelaufen und bewusst nicht behauptet: `db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen`, `production:pruefen`. Dieser Slice ändert weder Datenbank noch Anmeldung; die Werkzeuge brauchen Secrets, die diese Umgebung nicht hat. Ein Werkzeug, das sich selbst überspringt, gilt nicht als gelaufen – deshalb steht hier, dass es nicht gelaufen ist.

### `audit:account` – Befund zum Basis-Head

`npm run audit:account` war auf dem Task-Basis-Head `abcb09a0` in **allen 48** Kombinationen rot, mit `Besucht-Unterscheidung fehlt`. Ursache: die V1-Statuskarte rendert `Besucht bestätigt` mit `uppercase`, und `innerText` liefert die transformierte Schreibweise. Der Harness konnte die geprüfte Schreibweise deshalb nie finden. Das war latent, weil das World-Map-1-Self-Review festhält, dass der volle Harness damals abgebrochen ist und nie grün lief.

Auf diesem Head ist der Lauf **48/48 grün**, weil die Legende die Bezeichnung ohne `uppercase` trägt. Beide Läufe liegen in `docs/evidence/WORLD_MAP_POLISH_2_UI_2026-09-17.json`.

### Eigene Responsive-/Tastatur-/Bewegungsprobe

108 Kombinationen, alle grün: Chromium mit und ohne `prefers-reduced-motion: reduce`, WebKit, Breiten 280/320/360/390/430/768/844×390/1280/1536, Zustände `welt`/`reise`/`leer`/`fehler`.

Geprüft je Kombination:

- kein horizontales Scrollen der Seite, auch mit offener Marker-Auswahl
- Sektion nicht breiter als ihr Kasten
- jede Trefferfläche in der Sektion ≥ 44px hoch
- kein Marker ausserhalb der Kartenfläche
- kein `0 besucht`, kein `undefined`/`NaN`/`null` im sichtbaren Text
- `Besucht bestätigt` sichtbar
- `data-world-map-visited="nicht_erfasst"`
- geteilte Trefferfläche öffnet mit Enter, schliesst mit Escape, markiert nach der Auswahl genau eine Ortskarte und genau einen Marker
- einzelner Marker markiert per Enter genau eine Ortskarte und genau einen Marker
- keine Konsolenfehler, keine Page-Errors

Gerenderte Kartenfläche: 188×74 bei 280px, 298×118 bei 390px, 1068×421 ab 1280px.

Das Skript dieser Probe war temporär und ist nicht eingecheckt; sein Bericht liegt in `docs/evidence/WORLD_MAP_POLISH_2_UI_2026-09-17.json`.

### Vercel Preview

Preview auf dem exakten finalen Head ist **nicht** von diesem Agenten verifiziert. Preview-HTML ist erwartungsgemäss Vercel-SSO-geschützt und muss authentifiziert gelesen werden. Der Technical Lead muss CI und Preview auf der exakt reviewten SHA selbst lesen.

## Drift

`origin/main` vor diesem Handoff neu geholt.

- `origin/main`: `15aa125addf39b15dcb50a1cdf8dece661796fc5`
- merge-base mit diesem Branch: `15aa125addf39b15dcb50a1cdf8dece661796fc5`
- ahead: **3**, behind: **0**
- merge-base ist identisch mit der kanonischen Basis; **keine Drift**

## Parallelitäts-Lock

Geänderte Dateien gegen merge-base:

```
components/account/AccountAuditClient.tsx
components/account/AccountWeltKarte.tsx
docs/WORLD_MAP_POLISH_2_*
docs/evidence/WORLD_MAP_POLISH_2_UI_2026-09-17.json
lib/account/world-map-ansicht.ts
lib/account/world-map-land.ts
lib/account/world-map.test.ts
lib/account/world-map.ts
```

Kein `components/trips/**`, kein `lib/reisebegleiter/**`, kein `lib/modell/**`, kein `supabase/**`, kein `types/supabase.ts`, keine Assistant-Runtime-Datei, keine globale Continuity-/Handoff-/Roadmap-Datei, kein `package.json`, kein Lockfile.

`AGENTS.md` wird von `next dev` automatisch um einen Next-Hinweisblock ergänzt. Diese Änderung wurde bei jedem Commit verworfen und ist nicht Teil dieses Branch.

## Nächster Schritt

Unabhängiges Technical-Lead-Exact-Head-Review von Draft PR #437.  
**Nicht Ready setzen. Nicht mergen. Keinen Folge-Slice starten.**
