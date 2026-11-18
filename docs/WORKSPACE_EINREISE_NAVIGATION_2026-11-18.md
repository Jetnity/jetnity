# Einreiseprüfung in der Reisenavigation

Auftrag vom 18.11.2026: Die vorhandene Einreiseprüfung innerhalb des Reise-Workspaces erreichbar machen, direkt unter «Vorbereitung» und ohne Überschneidung mit laufenden Länderarbeiten.

## Verhalten

- «Einreise & Visum» mit Passbuch-Symbol (`BookUser`) ist der fünfte Reisebereich.
- Die bestehende `EinreiseLaenderpruefer`-Oberfläche wird erst beim Öffnen geladen und innerhalb derselben Reise angezeigt. Die Adresse lautet `/reisen/<id>?ansicht=einreise`; Neuladen und Browser-Zurück/Vorwärts erhalten den Bereich.
- Desktop-Seitenleiste und mobiles Menü führen den vollständigen Titel. Die mobile Kurzleiste zeigt «Einreise» mit dem vollständigen zugänglichen Namen. Unter 360 Pixeln oder bei vergrösserter Schrift verwendet sie die bestehende Navigation im Seitenfluss.
- Zielland und Pass werden weiterhin ausdrücklich im bestehenden Prüfer ausgewählt. Die Änderung speichert keine neuen Reisedaten, startet keinen Import und verändert keine Faktenfreigabe, API, Datenbank oder Sicherheitsprüfung. `/einreise` bleibt erreichbar.

## Abgrenzung und Prüfung

Eigener Clone und Branch ab `main` (`46303dcb5158285f663da80bc2b51c9381e4cde5`). Keine gemeinsamen Arbeitskopien geändert; keine Dateiüberschneidung mit dem offenen PR #1218. Kein Merge und kein Production-Rollout in diesem Auftrag.

Geprüft: URL-Vertrag, tatsächliche Bereichswechsel, Tastaturfokus, Neuladen, Zurück/Vorwärts und Rückkehr zum Reiseplan bei 1440, 390 und 320 Pixeln in Chromium. Mobile Prüfung ist emuliert. Bestehende Workspace-Browsertests prüfen zusätzlich Routen, Tageswahl, Dialoge und grünes Design.

Der erste vollständige Lauf CI4458 fand sechs Fehler im alten Navigationsvertrag mit vier Bereichen. Auch die Navigation ohne Workspace-Hülle verwendet jetzt die kurze Beschriftung «Einreise» in ihrer unteren Leiste mit dem vollständigen zugänglichen Namen. Die bestehenden Prüfungen wurden auf fünf Bereiche erweitert; Schriftgrösse, Klickflächen, Überlappung, Safe Area und Tastaturbedienbarkeit bleiben vollständig geprüft. Alle 15 Tests der drei betroffenen Browser-Suiten sind lokal grün, zusätzlich zu den 23 gezielten Workspace-/URL-Tests. Der korrigierte Stand durchläuft erneut die vollständige CI.

Lokale Prüfung: `npm ci`, TypeScript, gezieltes ESLint (nur bestehende Warnungen), Production-Build und die fünf Hygieneprüfungen. Der erste Build wurde durch eine vorhandene Next.js-Sicherheitswarnung unterbrochen; der unveränderte zweite Aufruf war erfolgreich. Kein Framework-Upgrade in diesem begrenzten Navigationsauftrag. Vollständige CI und Vorschau sind im zugehörigen PR nachzulesen.
