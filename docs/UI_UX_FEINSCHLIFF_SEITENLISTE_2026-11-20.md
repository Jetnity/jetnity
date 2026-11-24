# UI/UX-Feinschliff – vollständige Seitenliste

Stand: 20.11.2026, Draft-PR #1264. Erzeugt aus dem Code: jede `page.tsx` unter `app/`, dazu die Fehler-, Lade- und 404-Dateien und alle Bereiche, Panels und Dialoge des Workspace. `lib/ui/seitenliste.test.ts` schlägt fehl, wenn eine Route im Code fehlt oder hier eine Route steht, die es nicht mehr gibt.

Abgehakt wird eine Seite erst, wenn sie bei 320, 390, 768, 1280 und 1920 px ohne seitliches Scrollen und mit 44-px-Bedienflächen gemessen und mit den gemeinsamen Bausteinen umgesetzt ist (`DESIGN_SYSTEM.md` 6 und 7). Die Schlussmessung (280–2560 px, Querformat, beide Themen, Video) folgt in Etappe 8 für alle Seiten gemeinsam.

Grenzen bleiben: Login-Logik, 2FA, Datenbank und Production werden nicht angefasst. Bei Login, Registrierung, Passwort und Sicherheit ändert sich nur das Aussehen.

## Nicht vorhanden

Blog, eine eigene Suchseite und eine Seite Hilfe/Kontakt gibt es im Code nicht. Heute stehen «So funktioniert’s» und «Häufige Fragen» als Abschnitte auf der Startseite (`/#so-funktionierts`, `/#fragen`), Kontakt ist `info@jetnity.ch` in der Fusszeile, gesucht wird in `/reisen`, `/entdecken` und in den Suchen von Organisieren. Eigene Seiten dafür wären neuer Produktumfang und brauchen einen Entscheid des Product Owners; sie sind nicht Teil dieses PR.

## Startseite, Inspiration, Einreise

- [x] `/` Startseite – Etappe 5 (Grundton in Etappe 1, Lesebreite in Etappe 4 und 5)
- [x] `/entdecken` Inspiration entdecken, mit Leer- und Fehlerzustand – Etappe 5
- [x] `/einreise` Einreise und Visum prüfen (öffentlich) – Etappe 5 Seitenrahmen; Etappe 8 nach dem Merge von #1254: Kicker, Überschrift und Lesebreite in den Schriftstufen
- [x] `/datenquellen` Datenquellen & Lizenzen – Etappe 5

## Reise planen bis fertige Reise

- [x] `/planen` ein Weg sichtbar, «In eigenen Worten» zuerst – Etappe 2
- [x] `/reisen` Meine Reisen (Gast und Konto, leer, Fehler, Archiv) – Etappe 1, Leerzustand Gast in Etappe 1
- [x] `/reisen/[tripId]` Reise-Workspace, Rahmen und Kopf – Etappe 1, Ladeplatzhalter Etappe 4

### Workspace – Ansichten

- [x] `/reisen/[tripId]?ansicht=uebersicht` Übersicht mit Als Nächstes, Route, Kosten, Einreise, Was schon organisiert ist – Etappe 2, Texte für Erstbesucher im Abschluss
- [x] `/reisen/[tripId]?ansicht=plan` Reiseplan mit Karte (geteilte Ansicht ab Desktop) – Etappe 1 und 3
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=fluege` – Etappe 3
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=unterkunft` – Etappe 3, Ladeplatzhalter Etappe 4
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=aktivitaeten` – Etappe 3, Ladeplatzhalter Etappe 4
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=mietwagen` – Etappe 3, Ladeplatzhalter Etappe 4
- [x] `/reisen/[tripId]?ansicht=organisieren&kategorie=verbindungen` – Etappe 3, Ladeplatzhalter Etappe 4
- [x] `/reisen/[tripId]?ansicht=vorbereitung` vier Bereiche: Einreise & Visum, Reisende & Dokumente, Tickets & Buchungsbestätigungen, Eigene Vorbereitung – Etappe 3
- [x] `/reisen/[tripId]?ansicht=einreise` – Etappe 3; Etappe 8 nach dem Merge von #1254: eine `h1`, der Prüfer beginnt im Workspace mit `h2`

### Workspace – Panels, Dialoge, Zustände

Diese Punkte haben keine eigene URL. Sie werden in Etappe 8 einzeln geöffnet, gemessen und abgehakt.

- [x] Planpunkt-Detail (Panel rechts, auf dem Handy eigene Fläche) – Etappe 3
- [x] Kostenleiste über der unteren Leiste – Etappe 2
- [x] Untere Leiste und Kopfzeile unter 360 px, im Querformat und bei grosser Schrift – Etappe 4
- [x] Reise ändern (`TripWorkspaceEditSurface`, `ReiseAenderung`, `AenderungVorschau`) mit Umschalter «Direkt bearbeiten» / «In eigenen Worten» – Etappe 8
- [x] Reisebegleiter (`Reisebegleiter`), Frage und Auskunft – Etappe 8
- [x] Stopp hinzufügen und Stopp-Vorschau (`StoppForm`, `StoppVorschau`) – Etappe 8
- [x] Reiseprüfung (`TripAuditV1Panel`) – Etappe 8
- [x] Reiseänderung mit Vorher/Nachher (`ReiseAenderungManuell`, `ReiseAenderungAuswirkungen`) – Etappe 8
- [x] Datumsauswahl (`Suchkalender`) in Unterkunft und Flug – Etappe 8
- [x] Suchmasken, Gäste- und Lagefelder, «Angebot selbst merken», Ladeplatzhalter und Fehlermeldungen der Anbieterflächen – Etappe 8. Die Ergebnisse selbst zeigen die Anbieter in ihren eigenen Fenstern; Jetnity gestaltet sie nicht
- [x] Karte im Vollbild (`components/trips/reisekarte/Reisekarte.tsx`) – Etappe 8, nur im Code: Sie öffnet sich aus Anbieterergebnissen («Auf Karte ansehen») und läuft nur mit dem Google-Maps-Schlüssel der Production. Lokal nicht erreichbar; korrigiert wurde die fehlende Farbvariable im Stil
- [x] Einwilligung für Anbieter-Inhalte (`WidgetConsentChoice`) – nicht eingebunden: Die Komponente ist in keiner Seite verwendet, nur in Testskripten
- [x] Archivieren einer Reise (`KontoReiseArchivAktion`), Menü und Rückmeldung – Etappe 8
- [x] Menü (Handy) und Kontomenü – Etappe 8
- [x] Leer, lädt und Fehler in jeder Ansicht und jedem Bereich – Etappe 8 (Gastreise leer, beschädigt und unbekannt; Meine Reisen leer, Fehler, Archiv; Konto-Reise leer; Ladeplatzhalter in Such- und Anbieterflächen seit Etappe 4)

## Konto

- [x] `/account` Dein Jetnity – Etappe 4
- [x] `/account/merkliste` Meine Merkliste (leer, Fehler, nicht angemeldet) – Etappe 4
- [x] `/account/travellers` Reisende (lädt, leer, Fehler) – Etappe 4
- [x] `/account/bookings` Bestätigte Buchungen (lädt, leer, Fehler) – Etappe 4
- [x] `/account/settings` Einstellungen – Etappe 4 (Kontolöschung unverändert)
- [x] `/account/welt` Meine Welt (mit Besuchen, leer, Fehler) – Etappe 5
- [ ] `/account/security` Anmeldung & Sicherheit, nur Aussehen – teilweise in Etappe 6: Eingabefelder auf Touch 44 px. Kartenrahmen und Lesebreite (Zeilen bis 122 Zeichen) liegen in Dateien von #1240 und folgen nach dessen Merge

## Anmeldung (nur Aussehen)

- [ ] `/login` – teilweise in Etappe 6: Eingabefelder auf Touch 44 px, ein Fokusrahmen pro Feld. Seite und Formular liegen in Dateien von #1240 und folgen nach dessen Merge
- [x] `/register` – Etappe 6
- [x] `/auth/update-password` (prüft, kein Link, Formular, Fehler, gespeichert) – Etappe 6
- [x] `/auth/callback` Anmeldung wird abgeschlossen (lädt, angemeldet, Fehler) – Etappe 6
- [x] `/konto-geloescht` – Etappe 6
- [x] `/unauthorized` (kein Zugriff, Prüfung fehlgeschlagen) – Etappe 6

## Rechtliches

- [x] `/impressum` – Etappe 5
- [x] `/privacy` Datenschutzerklärung – Etappe 5
- [x] `/terms` Nutzungsbedingungen / AGB – Etappe 5

## Fehler- und Leerseiten

- [x] `app/not-found.tsx` (404 ausserhalb der öffentlichen Gruppe, jetzt mit Kopf- und Fusszeile) – Etappe 5
- [x] `app/(public)/not-found.tsx` (404) – Etappe 5
- [x] `app/(public)/error.tsx` – Etappe 5
- [x] `app/account/error.tsx` – Etappe 5
- [x] `app/(admin)/admin/error.tsx` – Etappe 7
- [x] `app/(admin)/admin/not-found.tsx` (greift bei `notFound()` innerhalb des Admin; eine unbekannte Admin-Adresse zeigt die allgemeine 404) – Etappe 7
- [x] `app/(admin)/admin/loading.tsx` – Etappe 7
- [x] `app/account/bookings/loading.tsx`, `app/account/travellers/loading.tsx` – Etappe 4

## Admin

- [x] `/admin/login` (nur Aussehen; Formular, Fehler, Magic Link gesendet) – Etappe 7
- [x] `/admin/mfa` (nur Aussehen; prüft, Fehler, Einrichtung nötig) – Etappe 7
- [x] `/admin` Übersicht – Etappe 7
- [x] `/admin/analytics` – Etappe 7
- [x] `/admin/content` – Etappe 7
- [x] `/admin/content/editor` – Etappe 7
- [x] `/admin/localization` (auf dem Handy als Liste statt Tabelle) – Etappe 7
- [x] `/admin/marketing` – Etappe 7
- [x] `/admin/official-truth/at-50-method` – Etappe 8 (mit #1254 auf main gekommen; Seitenkopf und Lesespalte wie die übrigen amtlichen Quellen)
- [x] `/admin/official-truth/at-source-v3` – Owner-only CH→AT Quellennachfolger V3 (gesperrt ohne BG1/Owner-AAL2/Featureflag, keine Besucherfreigabe)
- [x] `/admin/official-truth/at-method` – Etappe 7
- [x] `/admin/official-truth/guard` – Etappe 7
- [x] `/admin/official-truth/import` – Etappe 7
- [x] `/admin/official-truth/method` – Etappe 7
- [x] `/admin/payments` – Etappe 7
- [x] `/admin/provider-ops` – Etappe 7
- [x] `/admin/security` – Etappe 7
- [x] `/admin/settings` – Etappe 7
- [x] `/admin/system-health` – Etappe 7
- [x] `/admin/users` – Etappe 7
- [x] `/einreise/betrieb` Schutzprüfung der Einreiseauskunft (nur Owner) – Etappe 7

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
- `/ui-audit/hotel-discovery` (aus #1265)
- `/ui-audit/meine-reisen`
- `/ui-audit/runtime` (aus #1265, nur im QA-Branch von #1265, sonst 404)
- `/ui-audit/trip-workspace`
- `/account/ui-audit/w2-angebot` – ausschliesslich die isolierte Dev-Preview #1302; rein browserlokale synthetische Angebots-/Buchungsmarkierungen; Production 404.
