# Organisieren Desktop 1 — Prüfstand vom 02.11.2026

Status: Implementiert und unabhängig im lokalen Chrome geprüft; CI und Release
noch offen.

## Änderung

Der [Owner-Auftrag](ORGANISIEREN_DESKTOP_1_TASK_2026-11-02.md) vereinheitlicht
die Desktop-Darstellung der vier Organisieren-Kategorien. Navigation und aktiver
Inhalt überspannen jetzt jeweils das gesamte Raster. Der bisherige Sonderfall
für die Aktivitäten-Breite entfällt; der gemeinsame Zeilenabstand bleibt bei
Kategorie- und Suchwechseln gleich. Die Breitenmarkierung im DOM beschreibt
jetzt Organisieren insgesamt. Die bestehende Reiseplan-Aufteilung und kompakte
Navigation werden weiter von ihren bisherigen Regeln gesteuert.

Der Citrus-Akzent am Aktivitäten-Kartenkopf liegt in einer rein dekorativen,
abgerundeten Hülle ohne Zeigerinteraktion. Deren Rundung folgt der Karte; nur
diese Hülle beschneidet die Dekoration. Der Karteninhalt erhält keinen neuen
Overflow-Beschnitt, sodass Auswahllisten und Fokusrahmen erhalten bleiben.

Keine Änderung an Zustand, Sucheinstieg, Mount-/Provider-Lebenszyklus,
Browser-Zurück, Fokussteuerung, gespeicherter Reise, API, Datenbank, Auth/RLS,
Consent, Paketen oder Kosten. Keine neue Sticky-Navigation.

## Lokale Prüfung

- 77 bestehende Tests bestanden, keine Fehler oder übersprungenen Fälle:
  `cross-device-interaction-1`, `workspace-mode-2`,
  `organize-premium-experience-6`, `detail` sowie
  `ux-u1b-route-detail-1/anordnung` und `ux-u1b-route-detail-1/hinweis`.
- ESLint der beiden geänderten Komponenten: keine Fehler, fünf bestehende
  Hook-Warnungen. Der Vergleich mit dem unveränderten Ausgangsstand bestätigt
  dieselben Warnungen: drei in `TripWorkspace.tsx`, zwei in
  `AktivitaetenBereich.tsx`. Ihre Stellen liegen außerhalb des geänderten Codes.
- Keine zusätzlichen Tests, die nur die gewählten CSS-Klassen wiederholen.
  Der React-Check bestätigt: keine neuen Hooks, Effekte, Zustände, Listener oder
  Abhängigkeiten; die Dekoration bleibt für assistive Technologien verborgen.

Die bestehenden Rasterhelfer bleiben erhalten. Die neue Anordnung entsteht
durch das volle Überspannen ihrer Spalten; der Browser-Abgleich prüft die
resultierende Darstellung separat.

## Unabhängige Browser-Abnahme

Chrome über die Browser-Erweiterung, echte Komponenten im WorkspaceShell,
synthetische Bali-Reise in einer vor den Gates entfernten lokalen Prüfroute:

- 1440 px: Flüge, Unterkunft, Aktivitäten und Mobilität jeweils unter der
  Navigation, beide 1168 px breit und 24 px auseinander, kein Seitenüberlauf.
- 1080 px: Navigation und Unterkunft jeweils 808 px, Abstand 24 px.
- Aktivitäten: Karte und Dekoration jeweils Radius 24 px; nur Dekoration
  overflow hidden und pointer-events none, Karteninhalt overflow visible.
  Screenshot bestätigt sauber abgerundete Citrus-Enden.
- Hell und Grün geprüft; Tab von Ziel zu Reisetag erreicht sichtbaren Fokus.
- Browser-Zurück stellt Aktivitäten nach Mobilität wieder her.
- 390 px: kompakte Detailnavigation erhalten, Aktivitäten 366 px breit
  ohne Seitenüberlauf; Organisieren führt zur Kategorienübersicht zurück.
- Reiseplan/Tagesplan lässt sich weiterhin öffnen.

Lokale Bildnachweise: outputs/jetnity-organisieren-2026-11-02 im Arbeitsordner.
Keine Anbieterfreigabe oder Angebotsverfügbarkeit behauptet: lokale Prüfung
verwendet keine echten Zugangsdaten. Keine Real-Device-Abnahme.

## Noch offene Release-Abnahme

Typecheck, vollständiger Lint (0 Fehler, 192 Bestandswarnungen), alle fünf
Hygieneprüfungen und Production-Build erfolgreich. Prüfroute und automatisch
vom Devserver erzeugte Dateien sind entfernt beziehungsweise zurückgesetzt.
Unabhängiger Diff-/React-Review: keine neuen Zustände, Effekte, Datenzugriffe
oder Interaktionsänderungen; nur Darstellung und begrenzte Dekoration.

Vollständige CI und Vercel-Vorschau werden auf dem finalen Stand geprüft.
Die Vorschau nutzt nur die vorhandene öffentliche Develop-Verbindung,
auf diesen Preview-Branch begrenzt; keine Production- oder Admin-Zugangsdaten.
Production-Abnahme bleibt offen. Finale CI-/Deployment-Links im PR.
Ready, Merge und Veröffentlichung bleiben beim Technical Lead.
