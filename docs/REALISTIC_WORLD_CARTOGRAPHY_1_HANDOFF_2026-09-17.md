# Realistic World Cartography 1 – Handoff

Stand: 17. September 2026
Status: **STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #442 · Product-Owner-Direktive: #441 · Draft PR: #443
Branch: `feat/phase-1-realistic-world-cartography-1`
Binding: `docs/REALISTIC_WORLD_CARTOGRAPHY_1_TASK_2026-09-17.md`
Cursor-Agent: **`Jetnity realistic world cartography 1`**, Generation **1**, Parent model **Claude Opus 5 High** (kein Auto)

---

## 1. Worum es ging, in einem Absatz

Die Account-Weltkarte trug eine handgezeichnete Silhouette: elf Polygone mit 192 Stützpunkten, ohne Inselgruppen, ohne Seen, ohne Grenzen. Sie war als Orientierung gemeint und wirkte als Prototyp. Dieser Slice ersetzt sie durch echte, im Repository erzeugte Vektorgeografie aus Natural Earth 50m. Nichts an der Reisewahrheit ändert sich; es ändert sich, wie die Welt aussieht, auf der die Wahrheit liegt.

## 2. Was gebaut wurde

**Erzeuger statt Handarbeit.** `scripts/kartografie/weltkarte-geometrie.mjs` lädt drei gemeinfreie Natural-Earth-Dateien (Release `v5.1.2`) in einen ignorierten Zwischenspeicher, schneidet sie auf den gezeigten Ausschnitt zu, vereinfacht mit Douglas-Peucker, rundet auf 0,1 Grad und schreibt `lib/account/world-map-geografie.ts`. Der Lauf ist deterministisch: aus einem leeren Zwischenspeicher entsteht dieselbe Datei, Byte für Byte. `--pruefen` macht daraus einen Drift-Check, `--messen` gibt nur die Kennzahlen aus.

**Drei Ebenen, drei Pfade.** Land (278 Ringe), Binnenseen (14) und internationale Landgrenzen (397 Linien) werden je als *ein* zusammengesetzter Pfad gezeichnet. Löcher – etwa das Kaspische Meer in Eurasien – trägt `fill-rule="evenodd"`. Das Dokument enthält dadurch weniger Elemente als vorher, nicht mehr: 3 statt 11 `path`-Elemente, 22 statt 29 SVG-Knoten.

**Strichstärken, die nicht mitskalieren.** Eine in Projektionsgrad gemessene Küstenlinie wäre auf 390 px Breite dünner als ein Bildpunkt und verwüsche zu Grau. Die Karte benutzt deshalb `vector-effect: non-scaling-stroke`; Küste, Grenze und Gradnetz bleiben auf jeder Breite gleich scharf.

**Herkunft und Vorbehalt sind sichtbar.** Unter der Karte steht: „Kartengrundlage: Natural Earth (gemeinfrei). Grenzen dienen der Orientierung und sind keine Aussage über völkerrechtliche Grenzverläufe.“ Natural Earth verlangt keine Nennung. Sie steht da, weil eine Karte ohne erkennbare Herkunft eine Behauptung ohne Quelle ist – und weil gezeichnete Grenzen sonst als Position Jetnitys gelesen werden könnten.

Alles Weitere zu Quelle, Lizenz, Prüfsummen, Parametern, gemessenen Alternativen und Nutzlast: `docs/REALISTIC_WORLD_CARTOGRAPHY_1_KARTOGRAFIE_PROVENIENZ.md`.

## 3. Was bewusst *nicht* geändert wurde

`lib/account/world-map.ts` ist unberührt. Die Wahrheitsableitung – geplant ≠ besucht, kein Geocoding, keine Länder- oder Koordinatenerschliessung, keine zweite Abfrage, keine Persistenz – hat diesen Slice nicht bemerkt. Auch der gezeigte Ausschnitt (`lat −58 … 84`) und die Projektion stammen unverändert aus World Map Polish 2; der Erzeuger liest den Ausschnitt aus `lib/account/world-map-ansicht.ts` und bricht ab, wenn beide auseinanderlaufen.

`components/account/AccountAuditClient.tsx` wurde nicht angefasst: die Fixture `zustand=welt` aus World Map Polish 2 deckte alle drei geforderten Fälle bereits ab.

## 4. Gates auf dem gegateten Code-Head

Gegateter Code-Head: **`4b6ff53bcbe41978dfab2f11b5911dee99b4b5ef`**

Alle Läufe in einem frischen Arbeitsverzeichnis (`git worktree` auf genau diesem Head), damit kein Zustand aus der Entwicklung mitspielt.

| Gate | Befehl | Ergebnis |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | grün |
| Lint | `npm run lint` | 0 Fehler, 138 Warnungen (unverändert gegenüber `main@03842a64`) |
| Tests | `npm test` | **3 240/3 240 grün**, 572 Suiten |
| Weltkarte gezielt | `npx tsx --test lib/account/world-map.test.ts` | 42/42 grün, 8 Suiten |
| Erreichbarkeit | `npm run check:dead` | keine unbegründet verwaiste Datei |
| Exporte | `npm run check:exports` | 0 Exporte ohne Aufrufer |
| Pakete | `npm run check:deps` | 0 ohne Verwendung, keine neue Abhängigkeit |
| API-Schutz | `npm run check:api-schutz` | 12 Admin-Routen, alle geschützt |
| Schema-Bezug | `npm run check:schema-bezug` | grün |
| Production-Build | `npm run build` | grün |
| Account-UI-Audit | `npm run audit:account` | **48/48 grün** (WebKit + Chromium × 8 Breiten × 3 Zustände) |
| Geometrie-Drift | `node scripts/kartografie/weltkarte-geometrie.mjs --pruefen` | „ist aktuell“ aus frischem Download |

Datenbank-Gates (`db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen`) wurden **nicht** ausgeführt und sind hier auch nicht einschlägig: der Slice ändert keine Datenbankstruktur, keine Richtlinie und nichts an der Anmeldung. Er fasst `supabase/**` und `types/supabase.ts` nicht an.

`npm ci` wurde nicht ausgeführt. Die Abhängigkeiten sind unverändert (`package.json` und `package-lock.json` sind nicht Teil des Diffs); die Läufe benutzten den vorhandenen, aus dem Lockfile installierten Stand. Das ist eine bewusste Auslassung und keine stille.

## 5. Sichtbelege

Im Repository: `docs/evidence/realistic-world-cartography-1/`

| Datei | Zeigt |
| --- | --- |
| `vorher-390-karte.webp`, `vorher-1280-karte.webp` | die abgelöste Handzeichnung auf `main@03842a64` |
| `nachher-390-karte.webp`, `nachher-1280-karte.webp`, `nachher-1440-karte.webp` | die ruhende Karte |
| `nachher-*-marker-gewaehlt.webp` | ausgewählter Marker mit Beschriftung und hervorgehobener Ortskarte |
| `nachher-*-gruppe-offen.webp` | zwei Orte an einer Stelle, Auswahl unter der Karte |
| `nachher-bericht.json` | Messbericht des Laufs |

Aufgenommen von `scripts/kartografie/weltkarte-belege.mjs` gegen den **Production-Build** (`next start`), nicht gegen den Entwicklungsmodus.

Der Messbericht auf 390, 1280 und 1440 px:

| Messung | Ergebnis |
| --- | --- |
| Fremde Netzwerkherkünfte | **keine** – ausschliesslich `http://127.0.0.1:<port>` |
| Horizontaler Überlauf | 0 px auf allen drei Breiten |
| Konsolen- und Seitenfehler | keine |
| Kleinste Marker-Trefferfläche | 44 px |
| `path`-Elemente im Karten-SVG | 3 |
| SVG-Knoten gesamt | 22 |
| SVG-Titel / -Beschreibung | „Deine Welt“ / „Weltkarte mit Küstenlinien, Binnenseen und Landesgrenzen zur Orientierung. …“ |

Account-UI-Audit über alle Breiten und Zustände: `docs/evidence/REALISTIC_WORLD_CARTOGRAPHY_1_UI_2026-09-17.json`, 48/48 grün.

## 6. Nutzlast

| Client-Chunk mit „Deine Welt“ | roh | gzip | brotli |
| --- | ---: | ---: | ---: |
| vorher (`main@03842a64`) | 35 780 B | 12 145 B | 10 731 B |
| nachher | 102 431 B | 35 391 B | 25 983 B |
| Differenz | +66 651 B | +23 246 B | **+15 252 B** |

Beide Zahlen aus je einem echten `npm run build` in getrennten Arbeitsverzeichnissen. Vercel liefert Brotli aus: rund **15 KB** über die Leitung. Keine neue Abhängigkeit, keine Kartenbibliothek, keine neuen laufenden Kosten.

## 7. Sicherheit und Kosten

- Keine neue Route, kein neuer Endpunkt, keine Änderung an Auth, Rollen, Ownership oder RLS.
- Kein Service-Role-Zugriff, keine neue Abfrage, keine neue gespeicherte Angabe.
- Kein Secret berührt; die Quelladresse steht in Skript und Dokumentation, nie im ausgelieferten Modul.
- Keine kostenpflichtige Modell- oder Provider-Nutzung, keine neuen Infrastrukturkosten.
- Die Geometrie ist statisch und öffentlich unkritisch: sie enthält keine Nutzerdaten.

Ein Punkt gehört ausdrücklich genannt, auch wenn er hier nicht durchschlägt: Grenzverläufe sind politisch. Die Ebene ist als Orientierung gekennzeichnet – sichtbar an der Karte, im Kopf der erzeugten Datei und als Feld in `WORLD_MAP_GEOGRAFIE_HERKUNFT`. Sollte Jetnity später Einreise-, Visa- oder Transitwahrheit zeigen, darf diese niemals aus der Kartengeometrie abgeleitet werden.

## 8. Stand gegenüber `origin/main`

`origin/main` frisch geholt nach Abschluss der Arbeit:

```
origin/main   03842a64698cae1f4f20f54b7e6aa5016982562c   (= Canonical base)
merge-base    03842a64698cae1f4f20f54b7e6aa5016982562c
ahead         5 Commits (vor dem Dokumentations-Commit)
behind        0 Commits
Drift         keine
```

Commits auf dem Branch:

| SHA | Inhalt |
| --- | --- |
| `ba669768` | Taskdefinition (initial task head) |
| `856a4ad2` | Natural-Earth-Vektorgeografie statt Handzeichnung |
| `17efa8cf` | Belegskript: Skalierung wählbar, Repository-Evidenz als Vorgabe |
| `b48fce8d` | Testkommentar korrigiert: 192 statt geschätzter 130 Stützpunkte |
| `4b6ff53b` | Belegskript: Bilder als WebP ablegen (**gegateter Code-Head**) |

Dokumentation und Belege liegen in `f3e950b5eed65e039e6f6bb2f37712ef82b62aba`. Dieser Commit enthält ausschliesslich `docs/**` – keinen Code, keine Geometrie, keine Konfiguration – und verändert deshalb nichts an den oben genannten Gate-Ergebnissen.

Warum drei Code-Commits statt einem: die beiden kleinen Nachträge (`b48fce8d`, `4b6ff53b`) entstanden während der Beweisaufnahme. Nach jedem wurde der **vollständige** Gate-Satz neu gefahren; die Zahlen in Abschnitt 4 stammen aus dem Lauf auf `4b6ff53b`, nicht aus einem früheren.

## 9. CI und Vercel Preview auf dem finalen Head

Finaler Head: **`f3e950b5eed65e039e6f6bb2f37712ef82b62aba`**

| Check | Ergebnis |
| --- | --- |
| GitHub Actions Lauf `35173610481`, `headSha = f3e950b5…` | **success** |
| `Typecheck, Lint & Build` | pass, 2 m 18 s |
| `Auth-Konfiguration gegen config.toml` | pass, 29 s |
| `Vercel` | pass – „Deployment has completed“, Deployment `F7UmR3zZhixvh4hkJAftnxmbaDCK` |
| `Vercel Preview Comments` | pass |

Der nachfolgende reine Dokumentations-Commit `ff7e5f2306dee77ff6d79abd7ea43761c7956e64` lief ebenfalls grün: GitHub-Actions-Lauf `35173918323`, Vercel-Deployment `GpukT4iFfZeLY7FnMpM7f6wKESBV` abgeschlossen. Der einzige Commit nach `ff7e5f23` ist dieser Nachtrag selbst; sein Lauf steht in der PR-Beschreibung, damit die Kette hier endet statt sich fortzusetzen.

Einschränkung, ausdrücklich genannt: die Preview-URL steht hinter Vercel-SSO (Deployment Protection). Der Agent konnte den Build daher **nicht** im Browser öffnen. Belegt ist, dass die Preview auf dem exakten Head erfolgreich gebaut und ausgeliefert wurde – nicht, wie sie dort aussieht. Die Sichtbelege in Abschnitt 5 stammen aus einem lokalen Production-Build desselben Codes (`next build` + `next start`), nicht aus dem Entwicklungsmodus.

## 10. Offene Punkte und Risiken

| Punkt | Einschätzung |
| --- | --- |
| **Reales Gerät** | Nicht geprüft. Die Belege stammen aus Chromium und WebKit unter Playwright. Wenn für die Abnahme ein Real-Device-Test verlangt ist, gilt der Slice bis dahin als nicht abgenommen. |
| **Kartenhöhe auf 390 px** | Die gleichwinklige Vollweltkarte ergibt auf 390 px einen rund 140 px hohen Streifen. Das ist unverändert gegenüber World Map Polish 2 und kein Rückschritt, aber es ist auch nicht das Maximum des Möglichen. Eine mobile Komposition – etwa ein auf die eigenen Orte gezoomter Ausschnitt – wäre ein eigener, produktrelevanter Schritt und gehört nicht in diesen Slice. Empfehlung: als Backlog-Punkt führen. |
| **Kleine Inseln fehlen** | Flächen unter rund 620 km² entfallen (Malta, Malediven, Singapur als Landfläche). Sie wären auf 1280 px unter einem Bildpunkt. Marker an diesen Orten werden trotzdem gezeichnet, weil sie nicht aus der Geometrie kommen, sondern aus gespeicherten Koordinaten. |
| **Natural-Earth-Version** | Fest auf `v5.1.2` verdrahtet. Ein späteres Release ändert die Geometrie; `--pruefen` würde das als Drift melden. |
| **Grenzen politisch** | Siehe Abschnitt 7. Der Vorbehalt steht sichtbar; die Verantwortung dafür, keine Rechtsaussage daraus abzuleiten, bleibt bei künftigen Slices. |

## 11. Empfehlung

Technical-Lead-Exact-Head-Review von PR #443. Die Geometriedatei ist erzeugt – sie sollte nicht Zeile für Zeile gelesen, sondern über `node scripts/kartografie/weltkarte-geometrie.mjs --pruefen` und die Bildbelege geprüft werden. Der inhaltlich zu prüfende Code ist klein: der Erzeuger, die Kartenebene in `AccountWeltKarte.tsx`, zwei Texte und die neue Prüfgruppe im Test.

**Nicht Ready setzen. Nicht mergen. Explicit Visit History 1 nicht starten.**
