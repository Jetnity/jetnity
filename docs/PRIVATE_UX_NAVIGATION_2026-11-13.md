# Private Änderungsrunde: persönlicher Einstieg und Navigation

Stand: 13. November 2026. Teilauftrag 3 der privaten Jetnity-Änderungsrunde.
Baseline: `883c2a023b323a4b8072230285483a70eb2f5ed1`.
Branch: `feat/private-ux-navigation`.
Status: lokal implementiert, keine Veröffentlichung, kein Merge; Browserabnahme erfolgt im gemeinsamen privaten Vorschaukandidaten.

## Verhalten

- `/account` beginnt mit zwei klaren Wegen: eine gespeicherte Reise fortsetzen oder eine neue Reise beginnen. Die bestehenden Kontodaten und Verwaltungslinks bleiben darunter.
- `/reisen` verwendet denselben Einstieg. Die vorhandene, erfolgreich geladene erste ungefilterte Sammlungsseite liefert einen direkten Link zur zuletzt bearbeiteten offenen Reise. Archivierte Reisen werden nicht als Fortsetzung angeboten.
- Nur eine erfolgreich geladene, leere Kontosammlung zeigt „Erste Reise beginnen“. Bei einem Lesefehler bleibt die vorhandene Fehlermeldung; eine fehlgeschlagene Anfrage wird nicht als leeres Konto ausgegeben. Filter- und Folgeseiten erhalten keinen globalen Fortsetzen-Vorschlag.
- Die Auswahl behauptet keine nächste Abreise: Ohne Gerätekalendertag nutzt sie die vorhandene `naechsteReiseAus(reisen, null)`-Logik für die zuletzt geänderte offene Reise in den geladenen Daten.
- Die Sidebar enthält persönliche Reiseziele (Reisen, Welt, Reisende); Einstellungen und bestätigte Buchungen liegen im Kontomenü. Der doppelte Meine-Reisen-Menüpunkt und der alte Pro-Anker entfallen.
- Die Header-Symbole werden optisch auf 16 px und einen ruhigeren Strich verkleinert. Ihre Bedienflächen bleiben mindestens 44 × 44 px, mit sichtbarem Tastaturfokus.

## Grenzen

Die aktuellen Login-Ziele und sämtliche Auth-, Session-, MFA- und Redirect-Verträge bleiben unverändert. `/account` und `/reisen` bleiben vorhandene Adressen; sie erhalten einen gemeinsamen verständlichen Einstieg. Eine vollständige Zusammenführung dieser Adressen durch Redirects ist nicht Bestandteil dieses Auftrags.

Die bestehende Trennung der Datenleser bleibt erhalten: `/account` lädt keine zweite Reisesammlung. Der dortige Fortsetzen-Link führt zur vorhandenen persönlichen Reiseauswahl. Nur diese bietet den direkten Link zur konkreten Reise anhand tatsächlich geladener Daten.

Homepage und Gästeplanung über `/planen`, Gastspeicher, Datenbank, RLS, Schemas, Auth-Dateien, Umgebungsvariablen, Provideraktivierungen, package-/Lockfiles und CI werden nicht geändert. Keine neuen Endpunkte, Kosten oder externen Aufrufe. Keine Änderungen an #1196/#1197 oder deren Dateien; insbesondere keine Änderung an `ARCHITECTURE.md`, `DECISIONS.md` und `Reisevorbereitung.tsx`.

## Dateien

- `components/account/PersoenlicherReiseeinstieg.tsx`: gemeinsame reine Darstellung, vorhandene Auswahlregel, keine neue Datenquelle.
- `app/account/page.tsx`: persönlicher Einstieg vor der Kontoverwaltung, bestehender Auth-Aufruf unverändert.
- `components/trips/MyTripsCollection.tsx`: Einstieg aus vorhandener Sammlung, klarer erster Schritt bei nachgewiesener Leere.
- `components/workspace/WorkspaceAccountMenu.tsx`, `WorkspaceShell.tsx`, `workspace.css`: ergänzende Navigation und zurückhaltende Header-Symbole.

## Verifikation

- Gezieltes ESLint für alle fünf betroffenen TSX-Dateien einschließlich der neuen Komponente: bestanden.
- Vorhandene Tests: `lib/account/naechste-reise.test.ts`, `lib/account/navigation.test.ts`, `lib/trips/reisen-uebersicht.test.ts`, `lib/trips/create-entry.test.ts`: 72 Tests bestanden, 0 fehlgeschlagen, 0 übersprungen.
- Serverseitiges Rendern der echten neuen Komponente: Kontoeinstieg ohne Daten, nachgewiesen leeres Konto, konkrete offene Reise und ausschließlich archivierte Reise geprüft. Links und Leer-/Fortsetzen-Aussagen korrekt.
- `git diff --check`: bestanden.
- Vollständiges `tsc --noEmit --incremental false`: nicht grün wegen fehlendem lokal installiertem `leaflet` / Leaflet-Typen in den vorhandenen `Streckenkarte.tsx` und `Etappenkarte.tsx`; zusätzlich Folgefehler für deren Eventtyp. Keine TypeScript-Diagnose in diesem Änderungsscope. Keine Abhängigkeiten oder Lockfiles verändert.
- Kein eigener Production-Build; keine Browser-/Real-Device-Abnahme behauptet. Diese verbleiben beim integrierten privaten Vorschaukandidaten.

Nächster Schritt: unabhängige Root-Prüfung des lokalen Commits, Integration ausschließlich in den privaten UX-Branch, gemeinsame Chrome-/Safari-/Mobile-Prüfung. Keine Ready-, Merge- oder Veröffentlichungsfreigabe.
