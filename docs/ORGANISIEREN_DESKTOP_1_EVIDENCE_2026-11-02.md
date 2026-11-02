# Organisieren Desktop 1 — Prüfstand vom 02.11.2026

Status: Implementiert und fokussiert geprüft; unabhängige Abnahme und Release
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

## Noch offene unabhängige Abnahme

Der Technical Lead prüft Desktop-Kategoriewechsel, gemeinsame Breite und
Abstände, die runden Akzentenden sowie kompakte Ansicht, Hell/Grün,
Tastatur/Fokus und Zurück im Browser. Typecheck, Hygiene, Build, vollständige
CI und Vercel-Vorschau werden separat auf dem finalen Stand geprüft.
Dieser Bericht behauptet keinen Browser-, Production- oder Real-Device-Test.
Ready, Merge und Veröffentlichung bleiben beim Technical Lead.
