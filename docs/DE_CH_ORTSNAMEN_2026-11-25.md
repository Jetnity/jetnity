# de-CH-Ortsnamen und Schweizer Besuchertexte — 25.11.2026

Auftrag #1314. Ein Draft-PR, Ausgang `main` mit #1308 und #1312. Keine Datenbankmigration, kein Production-Deploy, keine neuen Kosten, keine Überwachung. Ready und Merge bleiben beim Technical Lead. Nur «Jetnity Release & Production» deployt.

## Anzeige

`lib/places/titel-name.ts` bleibt die einzige Tabelle. `ortTitelName` ruft jetzt `ortAnzeigeName` auf; der Titelvertrag ist unverändert: neuer Reisetitel deutsch in Schweizer Schreibweise, gespeicherter Etappenname weiter der Katalogname.

Ein Name wechselt nur bei einem eindeutigen Tabellentreffer aus Typ, Land und exaktem Katalognamen. Fehlt der Typ, zählt der Treffer nur, wenn Land und Katalogname genau eine Zeile treffen. Vienna (US), Rome (US), ein unbekannter Name und ein Name ohne Land bleiben stehen. `ß` wird `ss`. Es wird kein Name erfunden und kein Freitext durchsucht.

Die Ortssuche lässt `label` als Katalognamen stehen. Sichtbar sind `anzeige` und das `aria-label`. `OrtSuche` gibt im `onChange` diesen Katalognamen als `name` weiter. «Wien» ist kein blosses Ranking nach dem Lesen: `ortAnzeigeAliasfilter` und der exakte Filter nennen `and(typ, country_code, Katalogname)`, und `placesSuchen` zieht genau diese Zeile im bestehenden Read-only-Weg nach. Vienna (US) kommt dadurch nicht als Wien herein. Vienne, Roma und Lisboa bleiben die vorhandenen Keyword-Filter.

## Abgedeckte Flächen

- Ortssuche: Liste, gewählter Text und `aria-label`, auch die Vorbelegung unter `/planen`, wenn der bestätigte Ort vorliegt.
- Meine Reisen: Etappen in `reiseOrte`. Der gespeicherte Reisetitel bleibt, auch wenn er persönlich oder noch englisch ist.
- Reiseplan und Etappen: Routenzeile, Etappenkachel, Tageskopf, Kartenmarkierung, Zielessentials, Änderungsvorschau und die sichtbaren Stopp-Texte.
- Unterkunft: Etappenkarten, Hotelsuche, Hotelbereich, Aktivitätsziel. Die Stay22-, Booking- und Aktivitätssuche behält den Katalognamen.
- Verbindungen: sichtbare Stationsauswahl. Die Fahrplanabfrage bleibt `name`, Place-ID und Land.
- Flugauswahl: Stadt in der Flughafenbeschreibung und der vorausgefüllte Name, wenn die Etappe ein Land hat. IATA, Flughafenname und Suchparameter bleiben.
- KI-Reisevorschau: Etappen mit Ländercode. Titel, Tagesüberschriften, Punkte und die Abreise ohne Land bleiben der Modelltext.

Eine bereits gespeicherte Reise braucht keine Migration: Anzeige aus gespeichertem Namen plus Land.

## Grenzen

- Die Abreise in «Meine Reisen», auf der Karte, im Flughafenhinhweis und bei den Verbindungen hat kein Land. Sie wird nicht übersetzt.
- Eine blosse Place-ID ohne Ort (Typ, Land, Katalogname) reicht der Funktion nicht. Die Suche und `/planen` lösen den Ort zuerst auf.
- Verbindungsnamen auf Mobilitätskanten, freie Omio-Eingaben und Natural-Earth-Länderbeschriftungen sind kein belegter Katalogort.
- Der Inspirationskatalog liegt ausserhalb dieses Auftrags.
- `lib/auth/passwort-richtlinie.ts` enthält weiter «Groß». Die Stelle steht nicht in den 15 genannten Texten und wurde nicht angefasst.

## Schweizer Texte

Genau die 15 genannten sichtbaren `ß`-Stellen in den acht Dateien, plus die Solltexte, die diese Zeichenketten festschreiben. Keine Admin-, Auth- oder Official-Truth-Logik.

## Konflikt mit offenen PRs

Die Branches von #1313 und #1307 wurden nicht verändert.

- #1313 (`cursor/workspace-niveau-2ba1`) ändert vor allem CSS, `FlughafenSuche.tsx` (eine Klasse), `useFlughafenVorschlag.ts` («großer» → «grosser») sowie `DECISIONS.md`, `DESIGN_SYSTEM.md` und `docs/ACTIVE_WORK_STATUS.md`. Dieser PR ändert die Flughafen-Hinweisdatei nicht. Gemeinsam sind die Entscheidungsdatei und der Arbeitsstatus; beides sind Anhängsel, kein gemeinsamer Codepfad. `lib/airports/suche.ts` und die Aufrufer von `useFlughafenVorschlag` liegen nicht in #1313.
- #1307 ändert `Organisieren.tsx`, `TripWorkspacePlan.tsx`, `DiscoverCarsMietwagen.tsx`, `docs/ACTIVE_WORK_STATUS.md` und `docs/JETNITY_GESAMTSTAND_RECONCILIATION_2026-11-18.md`. Dieser PR trifft dieselben Dateien an anderen Stellen (sichtbare Ortsnamen, nicht den Buchungsstatus). Ein späterer Merge braucht einen Abgleich dieser Dateien.

## Nachweis

`lib/places/de-ch-anzeige.test.ts` liest filtertreu: nur Zeilen, deren Name, Keyword oder die Tabellenzeile Land+Typ+Katalogname zum Filter passen. Wien/Vienna/Vienne, Rom/Rome/Roma, Lissabon/Lisbon/Lisboa, München/Munich, Genf und Prag.

`lib/places/de-ch-anzeige.browser.test.ts` mountet die echten Komponenten mit den Workspace-Tokens: Ortssuche per Klick (Anzeige Wien, Kanonisch Vienna), `Reisekarte`, `RouteListe`, `Hotelsuche`, `Verbindungen`, `FlughafenSuche` (IATA bleibt VIE) und `VorschlagVorschau`. Hell/Dunkel, 320/390/1280. Kein Stay22-, Fahrplan- oder Duffel-Aufruf; diese Anbieterflächen bleiben aus. Screenshots nur, wenn `DE_CH_ANZEIGE_EVIDENCE_DIR` gesetzt ist. Kein Schreiben nach `docs/evidence` oder `/opt/cursor/artifacts`.
