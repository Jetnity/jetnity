# Flugsuche und Flugziele entdecken – 18.11.2026

Owner-Auftrag: bessere Ortssuche und Zielkarten unter der Flugsuche, effizient als Vorschau; andere Chats nicht stören, CI nicht fortlaufend überwachen.

Basis: main 0c9ed603. Eigener Worktree/Branch feat/flight-discovery-20261118. Offene PRs #1218, #1228 und #1230 betreffen getrennte Official-Truth-Dateien; keine Überschneidung der Implementierung.

Plan: lokale Flughafensuche um deutsche/englische Länderpräfixe mit ISO-Referenz ergänzen, Dropdown verbreitern; offizielle Travelpayouts-Zielkarten in separaten, CMP-geschützten Frames. Native Zielwahl übernimmt nur den Flughafen, vorhandene Daten/Passagiere bleiben. Keine Datenbankmigration, keine Secrets oder neue kostenpflichtige API. Länder bleiben Suchbegriffe für konkrete Flughäfen, keine versprochene landesweite Live-Preissuche. Widgetpreise sind Orientierung, nicht für die Reise garantierte Preise.

Scope: lib/airports, vorhandene Flughafen-GET-Route/Komponente, Flugvergleich/Flugkarten, Travelpayouts-Frame und isolierter Widget-Host. Keine Änderungen an Einreise, anderen Reisebereichen, CI, Production oder Konten. Prüfungen: fokussierte Such-/Provider-Tests, TypeScript/Lint/Build, Desktop-/Mobilvorschau. Kein Merge/Production-Rollout im Auftrag.

## Implementierung und Prüfung

- Länderpräfixe auf Basis des vorhandenen ISO-Katalogs und deutscher/englischer Ländernamen; Datenbankabfrage berücksichtigt `country_code`, Rangfolge zeigt konkrete IATA-Flughäfen. Grössere Trefferliste mit getrenntem Code. Auf Mobilgeräten reicht die Liste über beide Flugfelder.
- Drei offizielle Karten (Wien, Barcelona, Lissabon) mit Foto und vier eingehenden Routen, Deutsch/CHF und Jetnity-Grün. Native Übernahme ersetzt nur das Ziel. Keine landesweite Live-Preissuche behauptet.
- 34 fokussierte Airport-/Travelpayouts-Tests erfolgreich. TypeScript erfolgreich; gezieltes ESLint ohne Fehler, zwei bestehende Effekt-Warnungen in FlughafenSuche unverändert. Fünf Hygieneprüfungen erfolgreich (dead, exports, deps, API-Schutz, Schema-Bezug).
- Echter lesender Airport-GET: „österr“ liefert GRZ, INN, KLU, LNZ, SZG, VIE. Chrome/Chromium: Tastaturauswahl, Zielwechsel auf BCN, Termine 14.–20.12.2026 und zwei Reisende bleiben; Such-URL enthält ZRH1412BCN20122. Drei echte CHF-Karten geladen. Desktop 1440px und Mobil 390px geprüft.
- Separater Widget-CSP-Test: vier Preislinks laden mit produktiver CSP. HTTP-Telemetrie wird lokal blockiert; HTTPS-Deployment verwendet upgrade-insecure-requests. Fehlende tp.media-Bildfreigabe korrigiert. Provider rendert seine Daten selbst; keine Übernahme von Preisen in Jetnitys Reisegraph.
- npm ci erfolgreich. Production-Build erfolgreich nach Wiederholung des vom Framework angehaltenen Upgrade-Hinweises; keine Paketversion geändert. Der bestehende Next-Sicherheitshinweis bleibt ein separater Wartungspunkt.

## Übergabe

Lokale Vorschau: http://127.0.0.1:3191/ui-audit/flight-discovery (UI-Audit-Flag erforderlich, auf VERCEL_ENV=production immer 404). Separater lokaler Widget-Host: Port 3991. Browsernachweise und Prüfscripte liegen unter outputs/flight-discovery-20261118 im übergeordneten Arbeitsbereich.

Keine Datenbank-/Auth-/Providerkontoänderung und keine neuen laufenden API-Kosten. App und Widget-Host wurden nicht veröffentlicht. Für eine spätere Veröffentlichung zuerst den isolierten Widget-Host mit neuen Dateien/CSP aktualisieren; danach App veröffentlichen. Hosted-HTTPS-/physische Mobilprüfung bleibt offen. Ein gebündelter Draft-PR; keine fortlaufende CI-Beobachtung.

Abschliessende Browserprüfung nach Mobilkorrektur erfolgreich: breite Trefferliste ohne horizontalen Überlauf, sichtbare echte Karten nach Scrollen, alle drei Frames werden bei fehlender/ungültiger Einwilligung entfernt. Keine Browser-JavaScript-Fehler. Abschliessender Build und 34 Tests erfolgreich.
