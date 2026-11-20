# UI/UX-Feinschliff – vollständige Seitenliste

Stand: 20.11.2026, Draft-PR #1264. Erzeugt aus dem Code: jede `page.tsx` unter `app/`, dazu die Fehler-, Lade- und 404-Dateien und alle Bereiche, Panels und Dialoge des Workspace. `lib/ui/seitenliste.test.ts` schlägt fehl, wenn eine Route im Code fehlt oder hier eine Route steht, die es nicht mehr gibt.

Abgehakt wird eine Seite erst, wenn sie bei 320, 390, 768, 1280 und 1920 px ohne seitliches Scrollen und mit 44-px-Bedienflächen gemessen und mit den gemeinsamen Bausteinen umgesetzt ist (`DESIGN_SYSTEM.md` 6 und 7). Die Schlussmessung (280–2560 px, Querformat, beide Themen, Video) folgt in Etappe 8 für alle Seiten gemeinsam.

Grenzen bleiben: Login-Logik, 2FA, Datenbank und Production werden nicht angefasst. Bei Login, Registrierung, Passwort und Sicherheit ändert sich nur das Aussehen.

## Nicht vorhanden

Blog, eine eigene Suchseite und eine Seite Hilfe/Kontakt gibt es im Code nicht. Heute stehen «So funktioniert’s» und «Häufige Fragen» als Abschnitte auf der Startseite (`/#so-funktionierts`, `/#fragen`), Kontakt ist `info@jetnity.ch` in der Fusszeile, gesucht wird in `/reisen`, `/entdecken` und in den Suchen von Organisieren. Eigene Seiten dafür wären neuer Produktumfang und brauchen einen Entscheid des Product Owners; sie sind nicht Teil dieses PR.

## Startseite, Inspiration, Einreise

- [ ] `/` Startseite – Etappe 5 (Grundton in Etappe 1, Lesebreite in Etappe 4)
- [ ] `/entdecken` Inspiration entdecken, mit Leer- und Fehlerzustand – Etappe 5
- [ ] `/einreise` Einreise und Visum prüfen (öffentlich) – Etappe 5; `EinreiseLaenderpruefer` bleibt wegen #1254 unverändert
- [ ] `/datenquellen` Datenquellen & Lizenzen – Etappe 5

## Reise planen bis fertige Reise

- [x] `/planen` ein Weg sichtbar, «In eigenen Worten» zuerst – Etappe 2
- [x] `/reisen` Meine Reisen (Gast und Konto, leer, Fehler, Archiv) – Etappe 1, Leerzustand Gast in Etappe 1
- [x] `/reisen/[tripId]` Reise-Workspace, Rahmen und Kopf – Etappe 1, Ladeplatzhalter Etappe 4

### Workspace – Ansichten

- [x] `/reisen/[tripId]?ansicht=uebersicht` Übersicht mit Als Nächstes, Route, Kosten, Einreise, Gut organisiert – Etappe 2
- [x] `/reisen/[tripId]?ansicht=plan` Reiseplan mit Karte (geteilte Ansicht ab Desktop) – Etappe 1 und 3
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=fluege` – Etappe 3
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=unterkunft` – Etappe 3, Ladeplatzhalter Etappe 4
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=aktivitaeten` – Etappe 3, Ladeplatzhalter Etappe 4
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=mietwagen` – Etappe 3, Ladeplatzhalter Etappe 4
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=verbindungen` – Etappe 3, Ladeplatzhalter Etappe 4
- [x] `/reisen/[tripId]?ansicht=vorbereitung` vier Bereiche: Einreise & Visum, Reisende & Dokumente, Tickets & Buchungsbestätigungen, Eigene Vorbereitung – Etappe 3
- [x] `/reisen/[tripId]?ansicht=einreise` – Etappe 3, minimal wegen #1254

### Workspace – Panels, Dialoge, Zustände

Diese Punkte haben keine eigene URL. Sie werden in Etappe 8 einzeln geöffnet, gemessen und abgehakt.

- [x] Planpunkt-Detail (Panel rechts, auf dem Handy eigene Fläche) – Etappe 3
- [x] Kostenleiste über der unteren Leiste – Etappe 2
- [x] Untere Leiste und Kopfzeile unter 360 px, im Querformat und bei grosser Schrift – Etappe 4
- [ ] Reise ändern (`TripWorkspaceEditSurface`) – Etappe 8
- [ ] Reisebegleiter (`Reisebegleiter`) – Etappe 8
- [ ] Stopp hinzufügen und Stopp-Vorschau (`StoppForm`, `StoppVorschau`) – Etappe 8
- [ ] Reiseprüfung (`TripAuditV1Panel`) – Etappe 8
- [ ] Reiseänderung mit Vorher/Nachher (`ReiseAenderungManuell`, `ReiseAenderungAuswirkungen`) – Etappe 8
- [ ] Datumsauswahl (`Suchkalender`) – Etappe 8
- [ ] Flugergebnisse, Unterkunftsergebnisse, Mietwagen-Details (Dialoge der Anbieter) – Etappe 8
- [ ] Karte im Vollbild (`Reisekarte`) – Etappe 8
- [ ] Einwilligung für Anbieter-Inhalte (`WidgetConsentChoice`) – Etappe 8
- [ ] Archivieren einer Reise (`KontoReiseArchivAktion`) – Etappe 8
- [ ] Menü (Handy) und Kontomenü – Etappe 8
- [ ] Leer, lädt und Fehler in jeder Ansicht und jedem Bereich – Etappe 8 (Ladeplatzhalter in Such- und Anbieterflächen seit Etappe 4)

## Konto

- [x] `/account` Dein Jetnity – Etappe 4
- [x] `/account/merkliste` Meine Merkliste (leer, Fehler, nicht angemeldet) – Etappe 4
- [x] `/account/travellers` Reisende (lädt, leer, Fehler) – Etappe 4
- [x] `/account/bookings` Bestätigte Buchungen (lädt, leer, Fehler) – Etappe 4
- [x] `/account/settings` Einstellungen – Etappe 4 (Kontolöschung unverändert)
- [ ] `/account/welt` Meine Welt – Etappe 5
- [ ] `/account/security` Anmeldung & Sicherheit, nur Aussehen – Etappe 6

## Anmeldung (nur Aussehen)

- [ ] `/login` – Etappe 6
- [ ] `/register` – Etappe 6
- [ ] `/auth/update-password` – Etappe 6
- [ ] `/auth/callback` Anmeldung wird abgeschlossen – Etappe 6
- [ ] `/konto-geloescht` – Etappe 6
- [ ] `/unauthorized` – Etappe 6

## Rechtliches

- [ ] `/impressum` – Etappe 5
- [ ] `/privacy` Datenschutzerklärung – Etappe 5
- [ ] `/terms` Nutzungsbedingungen / AGB – Etappe 5

## Fehler- und Leerseiten

- [ ] `app/not-found.tsx` (404 ausserhalb der öffentlichen Gruppe) – Etappe 5
- [ ] `app/(public)/not-found.tsx` (404) – Etappe 5
- [ ] `app/(public)/error.tsx` – Etappe 5
- [ ] `app/account/error.tsx` – Etappe 5
- [ ] `app/(admin)/admin/error.tsx` – Etappe 7
- [ ] `app/(admin)/admin/not-found.tsx` – Etappe 7
- [ ] `app/(admin)/admin/loading.tsx` – Etappe 7
- [x] `app/account/bookings/loading.tsx`, `app/account/travellers/loading.tsx` – Etappe 4

## Admin

- [ ] `/admin/login` (nur Aussehen) – Etappe 7
- [ ] `/admin/mfa` (nur Aussehen) – Etappe 7
- [ ] `/admin` Übersicht – Etappe 7
- [ ] `/admin/analytics` – Etappe 7
- [ ] `/admin/content` – Etappe 7
- [ ] `/admin/content/editor` – Etappe 7
- [ ] `/admin/localization` – Etappe 7
- [ ] `/admin/marketing` – Etappe 7
- [ ] `/admin/official-truth/at-method` – Etappe 7
- [ ] `/admin/official-truth/guard` – Etappe 7
- [ ] `/admin/official-truth/import` – Etappe 7
- [ ] `/admin/official-truth/method` – Etappe 7
- [ ] `/admin/payments` – Etappe 7
- [ ] `/admin/provider-ops` – Etappe 7
- [ ] `/admin/security` – Etappe 7
- [ ] `/admin/settings` – Etappe 7
- [ ] `/admin/system-health` – Etappe 7
- [ ] `/admin/users` – Etappe 7
- [ ] `/einreise/betrieb` Schutzprüfung der Einreiseauskunft (nur Owner) – Etappe 7

## Ausgenommen

Diese Seiten antworten ausserhalb der Preview eines einzelnen Feature-Branches (`feat/private-travel-ux-20261113`, nur Reise `paris-beispiel`) immer mit 404. Sie werden nicht poliert, solange das so bleibt.

- `/reisen/[tripId]/kartenvorschau`
- `/reisen/[tripId]/kartenvorschau/fluege`
- `/reisen/[tripId]/kartenvorschau/unterkunft`
- `/reisen/[tripId]/kartenvorschau/aktivitaeten`

## Nur für den lokalen UI-Audit

Diese Seiten antworten in Production immer mit 404 und dienen nur als Messfläche ohne Anmeldung. Sie werden nicht poliert.

- `/ui-audit/account`
- `/ui-audit/account-settings-security`
- `/ui-audit/account-travellers`
- `/ui-audit/activities`
- `/ui-audit/admin-provider-ops`
- `/ui-audit/admin-system-health`
- `/ui-audit/flight-discovery`
- `/ui-audit/meine-reisen`
- `/ui-audit/trip-workspace`
