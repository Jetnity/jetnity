# Realistic World Cartography 1 – Agent-Self-Review

Stand: 17. September 2026
Draft PR: #443 · Issue: #442 · Direktive: #441
Gegateter Code-Head: `4b6ff53bcbe41978dfab2f11b5911dee99b4b5ef`

**Ein Agent-Self-Review ist kein Technical-Lead-PASS.** Dieses Dokument sagt, was ich selbst an meiner Arbeit für belastbar halte und was nicht – damit der Review dort anfangen kann, wo es sich lohnt.

---

## Die eine Frage, an der dieser Slice hängt

Die Direktive war ausdrücklich: *„A prettier colour treatment over the existing coarse shapes is not enough. The geometry itself must materially improve.“*

Meine Antwort, überprüfbar:

| | vorher | nachher |
| --- | ---: | ---: |
| Landflächen | 11 | 278 |
| Stützpunkte Land | 192 | 4 326 |
| Binnenseen | 0 | 14 |
| Grenzlinien | 0 | 397 |
| Quelle | Originalzeichnung in diesem Repository | Natural Earth 50m, `v5.1.2`, gemeinfrei |

Die Farbe ist fast gleich geblieben. Die Geometrie ist eine andere. Der direkte Bildvergleich steht in `docs/evidence/realistic-world-cartography-1/vorher-1280-karte.webp` gegen `nachher-1280-karte.webp`.

## Wo ich mir sicher bin

**Die Projektion stimmt, und das ist geprüft statt behauptet.** Die gefährlichste stille Regression wäre eine Karte, die schön aussieht und deren Küsten neben den Markern liegen – ein vertauschtes Vorzeichen fällt visuell kaum auf. Der Test rechnet deshalb für sieben bekannte Städte eine Punkt-in-Fläche-Prüfung gegen die erzeugten Ringe und für vier bekannte Meerespunkte die Gegenprobe. Ein gespiegelter, verschobener oder vertauschter Achsensatz fiele sofort durch.

**Nichts wird zur Laufzeit geladen.** Das ist nicht nur durch Lesen des Codes belegt, sondern durch Mitschnitt: der Belegelauf protokolliert jede Netzwerkanfrage der Seite. Auf drei Breiten gegen den Production-Build war die einzige Herkunft der lokale Server.

**Der Erzeuger ist reproduzierbar.** In einem frischen Arbeitsverzeichnis ohne Zwischenspeicher lädt er die Quellen neu, erhält dieselben SHA-256-Werte und schreibt eine byte-identische Datei.

**Die Nutzlast ist gemessen, nicht geschätzt.** Zwei echte Builds in getrennten Arbeitsverzeichnissen, derselbe Chunk: +15,3 KB brotli. Und ein Test zieht eine Obergrenze ein, damit die nächste Verfeinerung nicht unbemerkt teuer wird.

## Wo ich Entscheidungen getroffen habe, die ein Review kippen darf

**Grenzlinien überhaupt zu zeichnen.** Der Task erlaubte sie („only if visually helpful“), verlangte sie aber nicht. Ohne sie ist Europa eine grüne Fläche, und Orientierung ist der Zweck dieser Karte. Der Preis ist ein politischer: gezeichnete Grenzen können als Position gelesen werden. Ich habe den Vorbehalt deshalb sichtbar an die Karte gesetzt statt nur in die Dokumentation. Wenn der Technical Lead das Risiko anders gewichtet, ist die Ebene eine Zeile im Bauteil und ein Datensatz weniger im Erzeuger.

**Natural Earth 50m statt 110m.** 110m wäre der übliche, kleinere Weg. Ich habe beide erzeugt, nebeneinander gerendert und gemessen: 50m mit Toleranz 0,25 Grad kostet praktisch dasselbe wie 110m mit Toleranz 0,12 Grad, zeigt aber Indonesien, die Philippinen, die Karibik, die Ägäis und Patagonien als das, was sie sind. Die Messtabelle steht in der Provenienz; die Entscheidung ist damit nachrechenbar und nicht Geschmack.

**Die Handzeichnung gelöscht statt behalten.** `lib/account/world-map-land.ts` ist entfernt, nicht auskommentiert. Zwei Geometriequellen nebeneinander wären eine Einladung, versehentlich die falsche zu benutzen. Die alte Datei bleibt in der Historie.

**Kleine Inseln weggelassen.** Flächen unter rund 620 km² entfallen. Auf 1280 px wären sie unter einem Bildpunkt. Das ist eine Kartenentscheidung, keine Produktentscheidung: Marker kommen aus gespeicherten Koordinaten und erscheinen dort weiterhin.

## Wo ich unsicher bin oder nicht geprüft habe

**Reales Gerät.** Nicht geprüft. Chromium und WebKit unter Playwright sind kein Telefon in der Hand. Wenn die Abnahme einen Real-Device-Test verlangt, ist dieser Slice bis dahin nicht abgenommen.

**Die mobile Kartenhöhe.** Auf 390 px bleibt die Karte ein rund 140 px hoher Streifen – so wie vorher. Die Geografie darin ist jetzt echt, aber klein. Ich halte das für den ehrlichsten offenen Punkt dieses Slice und habe ihn bewusst nicht gelöst: eine mobile Komposition wäre eine Produktentscheidung über den Kartenausschnitt und gehört nicht in eine Kartografie-Etappe.

**Farbkontrast der Landfläche.** Land liegt bei 20 % `brand-700` über der Wasserfläche. Das ist bewusst ruhig gehalten, damit die Marker die stärksten Elemente bleiben. Ob das die richtige Balance für „premium“ ist, ist eine Gestaltungsfrage, die ich nicht allein entscheiden sollte; die Bildbelege zeigen sie auf drei Breiten.

**`npm ci` nicht ausgeführt.** Die Abhängigkeiten sind unverändert, die Läufe benutzten den installierten Stand. CI führt `npm ci` ohnehin aus.

## Gates

Alle in einem frischen Arbeitsverzeichnis auf dem gegateten Code-Head: Typecheck grün, Lint 0 Fehler, Tests 3 240/3 240, Erreichbarkeit/Exporte/Pakete/API-Schutz/Schema-Bezug grün, Production-Build grün, Account-UI-Audit 48/48, Geometrie-Drift-Check grün. Zahlen und Befehle im Handoff.

Datenbank- und Auth-Gates wurden nicht ausgeführt und sind nicht einschlägig – der Slice fasst weder `supabase/**` noch Anmeldung an.

## Scope-Treue

Angefasst wurden nur `components/account/AccountWeltKarte.tsx`, `lib/account/world-map-ansicht.ts`, `lib/account/world-map-geografie.ts` (neu, erzeugt), `lib/account/world-map-land.ts` (entfernt), `lib/account/world-map.test.ts`, zwei neue Skripte unter `scripts/kartografie/` und slice-eigene Dokumente unter `docs/`.

Nicht angefasst: `components/trips/**`, `lib/reisebegleiter/**`, `lib/modell/**`, `supabase/**`, `types/supabase.ts`, `lib/account/world-map.ts`, `components/account/AccountAuditClient.tsx`, Dateien der PRs #435 und #439, globale Continuity-/Roadmap-/`ACTIVE_WORK_STATUS`-Dokumente, `package.json`, Lockfile, CI-Workflows.

Kein Folge-Slice begonnen. Explicit Visit History 1 nicht angefangen.

## Governance

Nicht Ready gesetzt. Nicht gemergt. Keine Produktentscheidung eigenmächtig getroffen. Endzustand: **STOP FOR TECHNICAL-LEAD REVIEW.**
