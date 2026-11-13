# Private UX: gemeinsame Kalender

Stand: 13. November 2026. Implementiert im lokalen Branch
`feat/private-ux-calendars`, Basis `883c2a023b323a4b8072230285483a70eb2f5ed1`.
Keine Veröffentlichung, kein Remote-Push und kein Merge. Integration und
Browserabnahme liegen beim übergeordneten Technical Lead.

## Verhalten

Der vorhandene Hotel-/Flugkalender wird wiederverwendet für:

- Omio und die alternative Verbindungssuche: einzelner, optionaler Reisetag.
- DiscoverCars, beide Darstellungen: Abholung und Rückgabe als Zeitraum;
  Uhrzeiten bleiben getrennt und gelten vor Ort. Rückgabe am selben Tag bleibt
  möglich; der bestehende Suchvertrag verlangt eine spätere Rückgabezeit und
  höchstens 365 Tage. Der Kalender behauptet keine Mietdauer aus blossen Daten.
- Reise erstellen: Zeitraum mit höchstens 366 eingeschlossenen Kalendertagen,
  weiterhin derselbe Validierungs-/Speicherablauf und Fehlerfokus.
- Optionale Tageszuordnung zu Etappen: auf die tatsächlichen Reisedaten
  begrenzter Zeitraum; eine eintägige Zuordnung bleibt möglich.
- Viator-Angebotsprüfung: einzelner Termin; Änderung verwirft weiterhin die
  bisherige Prüfung und Startzeit.

Auswahl wird erst mit «Übernehmen» angewendet. Abbrechen und Escape lassen den
Wert unverändert. Freiwillige Daten können ausdrücklich gelöscht werden.
Suchaktionen werden dadurch nicht automatisch ausgeführt. Bestehende
Invalidierung einer bearbeiteten Suchanfrage wird explizit aufgerufen, da
Kalenderbuttons keine native Formular-`change`-Meldung erzeugen.

Die Komponente lädt ihre Gestaltung selbst, auch auf `/planen`. Sie unterstützt
kontextbezogene Texte, gesperrte Formulare sowie IDs, Fehlerbeschreibungen und
Refs für den vorhandenen Formularfokus. `aria-current=date` bezeichnet den
heutigen Gerätetag und nicht länger die minimale Datumsschranke.

Die Position berücksichtigt den sichtbaren Viewport einschliesslich Zoom-
Offsets, begrenzt die tatsächliche Dialoggrösse und reagiert auf Resize/Scroll.
Auf schmalen Geräten passen Tagesbuttons in ihre Rasterzelle. Monats- und
Schliessen-Buttons haben 44 px. Die Fussaktionen können umbrechen.

## Prüfung

- `node --import tsx --test lib/trips/suchkalender.test.ts lib/trips/private-ux-calendar.test.ts`:
  11 Tests bestanden. Abgedeckt sind Monatsraster, Schaltjahr/DST,
  Hotelnächte, Einzeltermin, Etappengrenzen, Mietwagen mit Rückgabe am selben
  Tag, 365-Tage-Grenze und Position bei Desktop, Mobile, Landscape und Zoom.
- Gezielter ESLint-Lauf über alle geänderten TS/TSX-Dateien: bestanden.
- `tsc -p tsconfig.json --noEmit`: bestanden mit den bereits vorhandenen
  Abhängigkeiten aus `jetnity-travelpayouts-verifizierung/node_modules`.
  Der zunächst verwendeten älteren Installation fehlte Leaflet. Keine Pakete
  oder Lockfiles geändert.
- Kein Production-Build und keine Browser-/Real-iPhone-Abnahme durch diesen
  Teilauftrag. Der Root führt die private Vorschau und Gesamtprüfung aus.

## Abnahme in der privaten Vorschau

1. `/planen`: «Abreise» öffnen (`#feld-start`), Start/Ende wählen,
   «Abbrechen» prüfen; erneut öffnen und «Übernehmen». Leeres Formular absenden:
   Datumsfehler bleiben beschriftet und der vorhandene Fehlerfokus greift.
2. Mehrere Ziele: Tageszuordnung aktivieren, «Von»/«Bis» für eine Etappe öffnen.
   Tage ausserhalb der Reise müssen gesperrt sein; eintägige Etappe und
   «Zeitraum löschen» prüfen.
3. Verbindungen: «Reisedatum» öffnen, auswählen/abbrechen/löschen. Es startet
   keine Suche vor der Suchaktion. Reisedatum und Personenzahl bleiben im
   mobilen Formular sinnvoll angeordnet.
4. Mietwagen: «Abholung»/«Rückgabe» wählen, gleiche Tage mit späterer Uhrzeit
   zulassen; gleiche oder frühere Uhrzeit wird weiterhin vom Suchvertrag
   abgelehnt. Beide Darstellungsvarianten prüfen.
5. Viator: «Datum» ändern; bisherige Preisprüfung wird nicht als aktuell
   weitergeführt. Keine Anbieteraktivierung für diese Prüfung durchführen.
6. Chrome und Safari bei 1440×900, 390×844, 320×568 und Landscape 844×390:
   Öffnen am rechten/unteren Fensterrand, Monatswechsel, Escape, Tab/Pfeiltasten,
   Textzoom, Fokus zurück zum Auslöser und vollständige Erreichbarkeit der
   Fussaktionen. Echtes iPhone zusätzlich erforderlich.

Stabile Selektoren: `.reise-datum-trigger`, `dialog.reise-kalender`,
`[data-datum="YYYY-MM-DD"]`, Buttons «Abbrechen», «Übernehmen»,
«Vorheriger Monat», «Nächster Monat» und «Kalender schliessen».

## Grenzen

Keine Auth-, ENV-, Paket-, CI-, Supabase-, Schema-, RLS-, Readiness- oder
Production-Änderung. Keine Anbieter freigeschaltet und keine neuen Kosten.
Die Provider-/Speicherverträge bleiben unverändert. Die Unteraufgabe behandelt
die aktive Suche und Reiseerstellung. Historische/manuelle Buchungseditoren
und Geburtsdaten behalten vorerst ihre bestehenden Datumsfelder; ein
Geburtsdatum braucht eine geeignete Jahreswahl und ist kein Reisezeitraum.

Nächster Schritt: unabhängiger Root-Review, lokale Integration und die oben
genannte Browserabnahme. Grüne Logiktests ersetzen diese Abnahme nicht.
