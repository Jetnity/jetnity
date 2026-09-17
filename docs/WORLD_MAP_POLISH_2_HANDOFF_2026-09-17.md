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

Commits auf diesem Branch über der kanonischen Basis:

| Commit | Inhalt |
| --- | --- |
| `abcb09a0ac916aa818a944a7c876dc7ca32ec787` | Task-Definition (Initial task head) |
| `b622019ef139073635d5d85f1962e0bf23f462b9` | Karte, Darstellungsschicht, Marker-Gruppierung, Reise-Labels – **vom Technical Lead reviewt, CI rot** |
| `f5052963774c8cf6dfb6b0893690fadbef6f44db` | **gegateter Code-Head** – Besucht-Unterscheidung im Lesefehler, Rahmen-Nullpunkt, CI-Blocker behoben |
| danach | ausschliesslich Dokumentation und Evidenz |

Alle unten genannten Gates wurden auf dem Code-Stand von `f5052963774c8cf6dfb6b0893690fadbef6f44db` erhoben. Jeder Commit danach ist reine Dokumentation und ändert keine Datei unter `components/`, `lib/`, `app/`, `scripts/`, `supabase/` oder `types/`. Prüfbar mit:

```
git diff --stat f5052963774c8cf6dfb6b0893690fadbef6f44db HEAD -- components lib app scripts supabase types
```

Diese Ausgabe muss leer sein. Der exakte Review-Head ist der letzte Commit dieses Branch; er ist code-identisch mit dem gegateten Head. Ein neuer **Code**-Head macht die hier genannten Gates ungültig und braucht ein neues Gating.

---

## Review-Fix: Technical-Lead CHANGES REQUIRED auf `b622019e`

Reviewter Head: `b622019ef139073635d5d85f1962e0bf23f462b9`.

### Befund 1 – CI #1742 rot: `Exporte ohne Aufrufer`

**Ursache.** Der Umbau hat zwei Exporte ohne Aufrufer hinterlassen:

- `WORLD_MAP_MARKER_ABSTAND` in `lib/account/world-map-ansicht.ts` wurde nur intern benutzt.
- `WORLD_MAP_VIEWBOX` in `lib/account/world-map.ts` hatte seinen Aufrufer verloren: die alten Helfer `markerLinks()`/`markerOben()` in `AccountWeltKarte.tsx` sind entfallen, die Komponente liest die `viewBox` jetzt aus der Ansichtsschicht.

Der CI-Schritt `Exporte ohne Aufrufer` (`npm run check:exports`) hat das korrekt gemeldet. Weil der Schritt vor `Production build` steht, wurde der Build übersprungen – nicht, weil er fehlgeschlagen wäre, sondern weil er nie lief.

**Behebung, innerhalb der Slice-Ownership.** Kein Skript und keine Ausnahmeliste angefasst:

- Der Gruppenabstand wird jetzt in `lib/account/world-map.test.ts` festgeschrieben (`assert.equal(WORLD_MAP_MARKER_ABSTAND, 5)`). Ein Schwellwert, der das Verhalten bestimmt, gehört in eine Zusicherung.
- Die Ansichtsschicht leitet ihren Projektions-Nullpunkt aus `WORLD_MAP_VIEWBOX` ab (`PROJEKTION_LON_NULL`, `PROJEKTION_LAT_NULL`) statt 180 und 90 erneut hinzuschreiben. Das ist eine echte Abhängigkeit, keine Alibi-Referenz: die Wahrheitsschicht definiert den Projektionsraum, die Darstellung schneidet nur einen Ausschnitt daraus.

`npm run check:exports` meldet auf dem neuen Code-Head `Exporte ohne Aufrufer: 0`.

### Befund 2 – fehlende Acceptance-Evidenz

STATUS, HANDOFF, SELF_REVIEW und der maschinenlesbare UI-Bericht wurden in `3d853378db1f4a2bff072a7e08505ac787ed1d5d` ergänzt, also nach dem reviewten Head. Die visuelle Evidenz ist mit diesem Review-Fix nachgezogen und liegt jetzt **im Repository** statt nur als Anhang: `docs/WORLD_MAP_POLISH_2_VISUAL_EVIDENCE_2026-09-17.md` mit 14 Bildern unter `docs/evidence/world-map-polish-2/`, aufgenommen gegen den **Production-Build**, nicht gegen `next dev`.

### Befund 3 – Vercel READY ersetzt keine Evidenz

Zugestimmt. Preview-READY steht in diesem Handoff als Tatsache, nicht als Argument.

### Befund 4 – Kollisionsgrenze zu #435

Unverändert eingehalten. Die Dateiliste unten ist der Nachweis.

### Befund 5 – Branch-Bezug zu `main`

Neu erhoben, siehe Abschnitt „Drift“.

### Eigener Zusatzbefund: falsche SHA in der ersten Fassung dieses Dokuments

Die erste Fassung nannte den ersten Code-Commit als `b622019eae3ba0eefd9b91e3e07cbccd57ba9c95`. Diese SHA existiert nicht. Die richtige ist `b622019ef139073635d5d85f1962e0bf23f462b9` – dieselbe, die der Technical Lead reviewt hat. Ursache: die Tabelle wurde aus einer Kurz-SHA (`git log --oneline`) heraus geschrieben, statt die vollen SHAs mit `git rev-parse` zu lesen. In einem head-gebundenen Prozess ist das kein Schönheitsfehler, deshalb steht die Korrektur hier und nicht nur im Diff.

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

## Gates auf dem gegateten Code-Head

Lokal in der Reihenfolge von `.github/workflows/ci.yml` durchlaufen, damit die Reihenfolge dieselbe ist wie die, die auf `b622019e` abgebrochen hat.

| CI-Schritt | Gate | Ergebnis |
| --- | --- | --- |
| Setup check | `npm run check:setup:ci` | pass |
| Typecheck | `npm run typecheck` | pass |
| Lint | `npm run lint` | **0 errors**, 138 vorbestehende warnings |
| Tests | `npm test` | **3231 pass / 0 fail** (3228 auf dem Basis-Head + 3 neue Suites) |
| Schutz der Admin-API | `npm run check:api-schutz` | pass |
| Bezug auf das Schema | `npm run check:schema-bezug` | pass |
| Unerreichbarer Code | `npm run check:dead` | pass |
| Exporte ohne Aufrufer | `npm run check:exports` | pass, **`Exporte ohne Aufrufer: 0`** ← war der Blocker |
| Ungenutzte Pakete | `npm run check:deps` | pass |
| Production build | `npm run build` | pass, `Compiled successfully`, 23/23 statische Seiten |

Zusätzlich, nicht Teil von CI:

| Gate | Ergebnis |
| --- | --- |
| `lib/account/*.test.ts` fokussiert | **120 pass / 0 fail** |
| `npm run audit:account` | **48/48 grün** |
| eigene Responsive-/Tastatur-/Bewegungsprobe | **108/108 grün** |

Nicht gelaufen und bewusst nicht behauptet: `db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen`, `production:pruefen`. Dieser Slice ändert weder Datenbank noch Anmeldung; die Werkzeuge brauchen Secrets, die diese Umgebung nicht hat. Ein Werkzeug, das sich selbst überspringt, gilt nicht als gelaufen – deshalb steht hier, dass es nicht gelaufen ist.

### `audit:account` – Befund zum Basis-Head

`npm run audit:account` war auf dem Task-Basis-Head `abcb09a0` in **allen 48** Kombinationen rot, mit `Besucht-Unterscheidung fehlt`. Ursache: die V1-Statuskarte rendert `Besucht bestätigt` mit `uppercase`, und `innerText` liefert die transformierte Schreibweise. Der Harness konnte die geprüfte Schreibweise deshalb nie finden. Das war latent, weil das World-Map-1-Self-Review festhält, dass der volle Harness damals abgebrochen ist und nie grün lief.

Auf diesem Head ist der Lauf **48/48 grün**, weil die Legende die Bezeichnung ohne `uppercase` trägt. Beide Läufe liegen in `docs/evidence/WORLD_MAP_POLISH_2_UI_2026-09-17.json`.

### Eigene Responsive-/Tastatur-/Bewegungsprobe und visuelle Evidenz

Aufgenommen gegen den **Production-Build** (`npm run build` + `next start -p 3470`, `JETNITY_UI_AUDIT=1`, `VERCEL_ENV=preview`), nicht gegen `next dev`.

108 Kombinationen, alle grün: Chromium mit und ohne `prefers-reduced-motion: reduce`, WebKit, Breiten 280/320/360/390/430/768/844×390/1280/1536, Zustände `welt`/`reise`/`leer`/`fehler`.

Geprüft je Kombination:

- kein horizontales Scrollen der Seite, auch mit offener Marker-Auswahl
- Sektion nicht breiter als ihr Kasten
- jede Trefferfläche in der Sektion ≥ 44px hoch
- kein Marker ausserhalb der Kartenfläche
- kein Landpfad über die ganze Projektionsbreite (der entfernte Polplatzhalter)
- kein `0 besucht`, kein `undefined`/`NaN` im sichtbaren Text
- `Besucht bestätigt` sichtbar
- `data-world-map-visited="nicht_erfasst"`, `data-world-map-search="nein"`
- geteilte Trefferfläche öffnet mit Enter, schliesst mit Escape, markiert nach der Auswahl genau eine Ortskarte und genau einen Marker
- einzelner Marker markiert per Enter genau eine Ortskarte und genau einen Marker
- keine Konsolenfehler, keine Page-Errors, keine echten Anfragefehler, keine Anfrage an einen fremden Host

Summen über alle 108: Konsolen- und Seitenfehler **0**, echte Anfragefehler **0**, fremde Anfragen **0**, Landpfade über die volle Breite **0**.

Gerenderte Kartenfläche: 188×74 bei 280px, **298×118 bei 390px**, **1068×421 ab 1280px**; `viewBox` überall `0 6 360 142`.

**Abgebrochene RSC-Vorabrufe.** 730 Einträge, alle `net::ERR_ABORTED` auf `next/link`-Vorabrufe mit `_rsc=`. Sie sind benannt, aber nicht als Fehler gewertet, und das ist begründet: dieselben Abbrüche treten in den Zuständen `leer` und `fehler` auf, in denen die Weltkarte **keinen einzigen** Reiselink rendert. Sie stammen aus der Account-Navigation und der Leerzustands-Aktion, deren Ziele ohne Sitzung auf `/login` umleiten. Kein Laufzeitfehler dieser Oberfläche und kein Regress dieses Slice.

**Visuelle Evidenz.** 14 Bilder bei 390px und 1280px liegen im Repository unter `docs/evidence/world-map-polish-2/`, eingeordnet und erklärt in `docs/WORLD_MAP_POLISH_2_VISUAL_EVIDENCE_2026-09-17.md`. Dort stehen auch die gemessenen Kartenmasse, der Vergleich des ausgewählten gegen den nicht ausgewählten Marker (Grösse, Ring, `aria-current`, Namensschild – nicht nur Farbe) und die aus dem DOM gelesenen `href`/`aria-label`-Paare der beiden gleich betitelten `Lissabon`-Reisen.

Die Skripte für Probe und Aufnahme waren temporär und sind nicht eingecheckt; ihre Ergebnisse liegen vollständig in `docs/evidence/WORLD_MAP_POLISH_2_UI_2026-09-17.json`.

### GitHub CI und Vercel Preview

Gelesen über die GitHub-API. `b622019e` ist der vom Technical Lead reviewte Head, `e15ebe80` und `065fd9cd` sind dokumentationsonly-Heads über dem gegateten Code-Head.

| SHA | `Typecheck, Lint & Build` | `Auth-Konfiguration` | `Vercel` | Commit-Status |
| --- | --- | --- | --- | --- |
| `b622019ef139073635d5d85f1962e0bf23f462b9` | **failure** (`Exporte ohne Aufrufer`, Build übersprungen) | success | success | red |
| `e15ebe80533de9fa7b48d2216db5efc2dfd8db3b` | **success** | success | **success** | success |
| `065fd9cd4c5a37aa1d70e9e6fe6c31006fcdeb2b` | **success** | success | **success** | success |

Vercel-Deployments: `6493160784` für `e15ebe80` (`Preview`, `state: success`), Deployment für `065fd9cd` ebenfalls `Preview` / `state: success`.

Der Preview-**Inhalt** ist nicht von diesem Agenten gelesen: die Deployment-URL antwortet mit `302` auf `https://vercel.com/sso-api?...` und setzt `_vercel_sso_nonce`. Das ist der erwartete Vercel-SSO-Schutz. Deshalb wurde die visuelle Evidenz gegen den lokalen **Production-Build** aufgenommen, der dieselbe `next build`-Ausgabe benutzt wie das Deployment.

Der finale Head dieses Review-Fix liegt über `065fd9cd` und ist weiterhin code-identisch mit `f5052963`. Der Technical Lead muss CI und Preview auf der tatsächlich reviewten SHA selbst lesen.

## Drift

`origin/main` unmittelbar vor diesem Review-Fix neu geholt.

- `origin/main`: `15aa125addf39b15dcb50a1cdf8dece661796fc5`
- merge-base mit diesem Branch: `15aa125addf39b15dcb50a1cdf8dece661796fc5`
- behind: **0**
- merge-base ist identisch mit der kanonischen Basis; **keine Drift**

Der Technical Lead hatte auf `b622019e` ahead 2 gemessen. Der Zuwachs seither ist ein Code-Commit (`f5052963`, der CI-Blocker) und ausschliesslich Dokumentation und Evidenz.

## Parallelitäts-Lock

Geänderte Pfade gegen merge-base:

```
components/account/AccountAuditClient.tsx
components/account/AccountWeltKarte.tsx
docs/WORLD_MAP_POLISH_2_HANDOFF_2026-09-17.md
docs/WORLD_MAP_POLISH_2_SELF_REVIEW_2026-09-17.md
docs/WORLD_MAP_POLISH_2_STATUS_2026-09-17.md
docs/WORLD_MAP_POLISH_2_TASK_2026-09-17.md
docs/WORLD_MAP_POLISH_2_VISUAL_EVIDENCE_2026-09-17.md
docs/evidence/WORLD_MAP_POLISH_2_UI_2026-09-17.json
docs/evidence/world-map-polish-2/*.png   (14 Bilder)
lib/account/world-map-ansicht.ts
lib/account/world-map-land.ts
lib/account/world-map.test.ts
lib/account/world-map.ts
```

Kein `components/trips/**`, kein `lib/reisebegleiter/**`, kein `lib/modell/**`, kein `supabase/**`, kein `types/supabase.ts`, keine Assistant-Runtime-Datei, keine globale Continuity-/Handoff-/Roadmap-Datei, kein `package.json`, kein Lockfile, kein CI-Workflow, kein Hygiene-Skript.

`AGENTS.md` wird von `next dev` automatisch um einen Next-Hinweisblock ergänzt. Diese Änderung wurde bei jedem Commit verworfen und ist nicht Teil dieses Branch.

## Nächster Schritt

Technical-Lead-Exact-Head-**Re-Review** von Draft PR #437 auf dem neuen finalen Head.  
**Nicht Ready setzen. Nicht mergen. Keinen Folge-Slice starten.**
