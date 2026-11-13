# Private UX: weitere aktive Kalender

Stand: 13. November 2026. Lokale Ergänzung im Branch
`feat/private-ux-calendars` nach Commit `6f00c9c`. Kein Remote-Push,
keine Veröffentlichung und kein Merge.

## Umfang

Die aktive Workspace-Flugsuche und die bereits erreichbaren KAYAK-
Vorschauoberflächen verwenden denselben Suchkalender. Die vorhandenen
Anbieteraufrufe und Freigabeschalter bleiben unverändert. Die bei der
nativen Datumswahl vorhandene Pflichtprüfung wird vor dem Absenden
weitergeführt; die KAYAK-Vorschau wird beim Übernehmen neuer Daten wie
bisher zurückgesetzt. Es wird keine Suche durch die Datumswahl ausgelöst.

Auch folgende manuelle Bearbeitungen verwenden die gemeinsame Datumswahl:

- Mietwagen: freiwillige Abhol- und Rückgabedaten, jeweils unabhängig.
- Verbindung: freiwillige Abfahrts- und Ankunftsdaten, jeweils unabhängig.
- Planpunkt: freiwilliges Anfangs- und Enddatum, jeweils unabhängig.
- Unterkunft: Check-in/Check-out als Zeitraum mit mindestens einer Nacht.
- Reise ändern: Reisebeginn; ein gesetztes Datum bleibt wie bisher nicht
  löschbar.
- Flugroute: unabhängige Abflug- und Ankunftsdaten je Segment. Eine lokal
  frühere Ankunft oder Datumsgrenzenüberschreitung wird nicht durch einen
  künstlichen Datumsbereich ausgeschlossen.

Die manuellen Kalender erlauben historische Angaben ab 1900 und verwenden
keine heutige Mindestgrenze. Optionale Daten können ausdrücklich gelöscht
werden. Die bestehenden Zeitfelder, Validierungen, Speicherfunktionen und
Schutzregeln für Buchungen bleiben unverändert. Leere Angaben bleiben
unbekannt, ein Datum wird nicht aus der Tageszuordnung erfunden. Erst das
ausdrückliche Speichern schreibt die bearbeiteten Angaben.

Vorhandene Fehler-IDs bleiben erhalten. Unterkunft und Flugroute fokussieren
auch Kalenderbuttons mit `data-invalid="true"`; die Fehlerbeschreibung wird
weiterhin über `aria-describedby` zugeordnet.

## Prüfung

- 195 Tests in 14 gezielten Testdateien bestanden: Kalender, Flughafenwahl,
  Trip-Schema, Unterkunft, manuelle Flugroute, manuelle Verbindungen,
  Mietwagen und bestehende Editor-Abschlusslogik. Die Flugtests prüfen
  weiterhin exakte Ortszeiten, Ankunft am Folgetag sowie die Datumsgrenze.
- Bestehende Unterkunft-/Flug-UI-Tests verwenden nun `Suchkalender.setzen`
  zum Auswählen und prüfen echte gerenderte Trigger-IDs und Beschriftungen.
  Assertions zu fehlgeschlagenem Speichern, exakten Nutzdaten, fehlendem
  Autosave, Abbrechen und unbekannten Angaben bleiben erhalten.
- Vier zusätzliche Tests sichern historische, optionale und getrennte
  lokale Datumsangaben sowie die Mindestnacht einer Unterkunft ab.
- TypeScript: `tsc -p tsconfig.json --noEmit` bestanden.
- ESLint über alle betroffenen TS/TSX-Dateien: keine Fehler; eine bereits
  vorhandene Warnung zu `UNTERBEREICHE` in `MobilitaetBereich.tsx` bleibt.
- `git diff --check` bestanden. Keine geschützte Datei verändert.

Der isolierte Kalender-Worktree enthält noch den CSS-Import aus dem ersten
Teilcommit. Für diesen Node-Testlauf wurde ausschliesslich ein temporärer
CSS-Ladeadapter ausserhalb des Repositories vorgeladen. Im Integrationsbranch
hat der Lead diesen Import bereits in `app/layout.tsx` verlegt; dort ist der
normale Testaufruf ohne Adapter erneut auszuführen. Der Lead ergänzt auch
Escape-Behandlung und den auf min/max begrenzten heutigen Startmonat zentral.
Diese gemeinsam bearbeiteten Dateien sind kein Bestandteil dieses Folgecommits.

## Manuelle Abnahme

1. In einem manuellen Mietwagen, einer Verbindung und einem Planpunkt ein
   einzelnes Datum setzen, abbrechen, erneut öffnen und löschen. Uhrzeit und
   das jeweils andere Datum bleiben unverändert; keine automatische Speicherung.
2. Unterkunft ändern: bestehender Zeitraum ist markiert; mindestens eine
   Nacht wählen, Übernehmen und anschliessend Speichern. Fehlerfokus prüfen.
3. Reise ändern → Zeitraum: Reisebeginn öffnen; Abbrechen lässt den Wert
   unverändert. Nach Rückkehr aus der Änderungsvorschau ist der Kalender
   wieder mit der Tastatur erreichbar.
4. Manuellen Flug mit mehreren Segmenten bearbeiten: Abflug am Abend und
   Ankunft am Folgetag auswählen; separat einen erlaubten Datumsgrenzenfall
   prüfen. Ortszeiten und Segmentreihenfolge dürfen nicht verändert werden.
5. In geöffnetem Editor Escape im Kalender drücken: nur der Kalender
   schliesst, der Editorentwurf bleibt. Dann den Editor ausdrücklich abbrechen.
6. Chrome und Safari, Desktop und echtes iPhone: Trigger am unteren und
   rechten Rand, Scrollen, Kalenderauswahl, Abbrechen/Übernehmen und
   Rückkehr des Fokus. Dies ist keine durch Node-Tests belegte Browserabnahme.

Selektoren: `.reise-datum-trigger`, `dialog.reise-kalender`,
`[data-datum="YYYY-MM-DD"]`, Buttons «Abbrechen», «Übernehmen» und
«Datum löschen». Flug-IDs enthalten `-departureDate` bzw. `-arrivalDate`;
Unterkunfts-IDs enden mit `-check-in` bzw. `-check-out`.

## Verbleibende Grenzen

Der zusätzliche Scan erfasst auch dynamische Datumsinputs. Ausgenommen
bleiben die geschützte `Reisevorbereitung.tsx` sowie Geburts- und
Reisedokumentdaten im Konto; diese erfordern eine eigene Jahresauswahl und
gehören nicht zur Reisezeitauswahl. Anbieterfenster bleiben unter Kontrolle
des jeweiligen Anbieters. Keine Auth-, ENV-, Paket-, CI-, Supabase-, Schema-,
RLS- oder Production-Änderung. Die private Browserabnahme übernimmt der Lead.

## Nachprüfung des breiteren Core-Laufs

Der integrierte Core-Lauf fand zwei weitere Testdateien mit Annahmen zur
alten nativen Datumswahl. `flug-route-form-validation.test.ts` behandelt
jetzt Text-/Zeitinputs und Kalender gemeinsam. Alle bisherigen Assertions
zu Feldfehlern, DOM-Reihenfolge, erneutem Fehlerfokus, Segmentgrenzen,
Schreibsperre und Escape bleiben erhalten. Für Kalenderfehler wird zusätzlich
die echte SSR-Ausgabe auf Trigger-ID, Namen, `data-invalid`,
`aria-describedby` und Dialogzuordnung geprüft. Der Hook-Harness behauptet
weiterhin keine native Browser- oder Screenreader-Abnahme.

`organisieren-action-recovery-1.test.ts` prüft weiterhin exakt zehn
Mietwagenfelder, ihre gesperrten Zustände, Nutzdaten, Fehlererhaltung und
Rücksetzung nach erfolgreichem Speichern. Zwei Felder werden über den
Kalender-Callback statt über `input.onChange` gesetzt. Auch ein direkt
injiziertes ungültiges Datum bleibt als defensive Speichervertragsprüfung
erhalten; der Kalender selbst bietet dieses Datum nicht zur Auswahl an.

Der Vollquelltext-Hash der manuellen Verbindung wird ausdrücklich als
Kalenderrevision vom 13. November geführt. Nur die zwei Datums-Renderblöcke
wurden in dieser Funktion geändert; Speicher-, Lifecycle- und Zeitlogik
sind unverändert. Die historischen Completion-Berichte und deren Hashes
werden nicht nachträglich umgeschrieben.

Beide Node-Testdateien: 25/25 Tests bestanden, ohne Browser-/DB-Harness.
TypeScript und gezieltes ESLint bestanden. Der isolierte Worktree benötigt
weiterhin den oben beschriebenen temporären CSS-Adapter; im integrierten
Stand ist der Standardaufruf ohne Adapter zu wiederholen.
