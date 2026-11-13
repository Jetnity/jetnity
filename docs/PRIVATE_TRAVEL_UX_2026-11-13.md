# Private Jetnity UX-Runde — 13. November 2026

## Auftrag und Grenzen

Owner: Sasa. Sieben freigegebene Punkte: Stay22 Chrome-Handoff, gemeinsame Kalender,
persönlicher Einstieg, passende Zielbilder/Paris-Aktivitäten, Merkliste/Planübernahme,
Hotel-Filter, erhaltene Suchbereiche. Ausschliesslich private Vorschau.
Keine Veröffentlichung, kein Merge, keine Anbieteraktivierung, keine Production-/
Supabase-Schreibzugriffe. Auth, ENV, package/lock, CI, Schema und RLS unverändert.
Hauptplan 79/80 und sämtliche Dateien von #1196/#1197 haben Vorrang und sind gesperrt.

Ausnahme nach ausdrücklicher PO-Freigabe am 13. November: ausschließlich
`NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` aus
`feat/booking-cj-hotel-flight-search-20261109` unverändert als Preview-Variablen
für `feat/private-travel-ux-20261113` übernommen. Rücklesen bestätigt beide Werte
und den ausschließlichen Branch-/Preview-Scope. Der bestehende Schlüssel ist ein
öffentlicher Publishable-Key. Kein service_role, keine anderen kopierten Variablen,
keine Änderung an Production, Datenbank, Auth oder Vorschau-Schutz.

## Rekonstruierte Basis

Der angegebene Ordner enthält 18 ältere Git-Arbeitskopien. Keine offenen Codeänderungen;
zwei Arbeitskopien besitzen einen unversionierten node_modules-Link. Die letzte dort
vorhandene origin/main-Referenz ist `883c2a023b323a4b8072230285483a70eb2f5ed1`.
GitHub meldet main `63544e820e912bd275556588c956a09b99b1cf90`, 45 Commits voraus.
Der vollständige GitHub-Dateivergleich zeigt keine Änderung an den hier betroffenen
Suche-/Kalender-/Navigation-/Bildkomponenten. Diese lokale Basis wird explizit nicht
als aktueller main ausgegeben. Vor einer späteren Integration muss main aktualisiert
und die vollständige Überschneidungsprüfung wiederholt werden.

Eigene Arbeitskopie: `jetnity-private-ux`, Branch `feat/private-travel-ux-20261113`.
Direkter Shell-Netzzugriff auf GitHub scheitert mit DNS-Fehler; GitHub-Connector lesbar.
Ein lokaler Next-Server wurde versucht, aber die Ausführungsumgebung verweigert
`listen 127.0.0.1:4317` mit EPERM. Keine Berechtigungsumgehung. Regulärer HTTPS-Vorschauweg: bestehendes, SSO-geschütztes Vercel-Projekt; ausschließlich eigener Feature-Branch, kein Production-Ziel.

## Umsetzung und Prüfung

- Root: Stay22, erhaltene Suchbereiche, Zielbilder/Paris, Anbieter-/Merklistenvertrag.
- Separater Kalender-Branch: gemeinsame Komponente und Kalender-Verwendungen.
- Separater Navigations-Branch: reine Präsentation, vorhandene Identitätsprüfung bleibt.
- Ein Writer pro Branch; lokale Integration wird geprüft. Keine externen Agentenaufträge.
- Relevante reine Tests, TypeScript, Lint und private Browserprüfung. Der breite vorhandene Core-Lauf enthält zusätzlich lokale native DB-/Browser-Harness; deren Umgebungsausfälle werden separat berichtet, ohne diese Suites oder ihre Konfiguration zu ändern.
- Keine erfundenen Ergebnisse, Anbieterbilder, Preise oder Buchungen.
- Reale Hardware-/Safari-Prüfung wird nur bei tatsächlichem Nachweis als bestanden geführt.

## Bereits belegte Ursachen

1. `Organisieren` entfernt nicht aktive Kategorien. Formzustand und Anbieterframes gehen verloren.
2. `Hotelsuche.patch()` löscht die Anzeige bei jeder Eingabe-/Filteränderung.
3. `AktivitaetenBereich` verwechselt eine vorgewählte Etappe mit einer Reise ohne Ziel.
4. Der gemeinsame Bildresolver kennt Paris nicht und liefert ein generisches Bergbild.

## Offene Gates

Eine kontoweite Angebotsmerkliste braucht eine separat freizugebende Persistenz/RLS.
Fremde Widgets geben nicht automatisch strukturierte Angebote oder Speicherrechte frei.
Das genaue Datenmodell und die Anbietergrenzen werden vor einer Freigabe dokumentiert.
Veröffentlichung und Merge bleiben unabhängig vom Teststand gesperrt.

## Integrierte Umsetzung

- Stay22: normales Sandbox-Iframe statt `credentialless`. Chromiums erzwungenes `noopener`
  für credentialless Popups passt zur reproduzierten leeren Weiterleitung; die kausale
  Bestätigung erfordert den privaten Browser-Gegentest. Sandbox, CMP und Parameter bleiben.
  Normale Anbieter-Cookies/-Storage sind damit wieder im üblichen Browserkontext verfügbar,
  statt im temporären credentialless-Kontext; Zustimmung/Widerruf werden weiter geprüft.
- Hotelentwurf und geladenes Suchergebnis sind getrennt. Änderungen an Filtern, Währung,
  Preisart und Daten löschen keine Ergebnisse; ausdrücklich „Suche aktualisieren“ lädt neu.
- Besuchte Suchkategorien bleiben montiert und inaktiv `hidden` + `inert`. Bereits geladene
  Providerframes werden nicht ersetzt; Kategorienwechsel löst keine neue Suche aus.
  Fenster-Scrollpositionen werden je Kategorie wiederhergestellt. Modale Kalender und
  Vollbildansichten schließen bei Deaktivierung, ohne den Anbieterframe zu entfernen.
- Kalender für zentrale Suche, Reise erstellen, Etappentage und erreichbare manuelle
  Editoren. Vergangene und optionale Daten bleiben möglich; lokale Zeiten bleiben separat.
  CSS wird appweit aus dem Layout geladen, damit echte Komponenten-SSR-Tests weiterlaufen.
- Gemeinsamer persönlicher Einstieg, ergänzendes Kontomenü/Sidebar, kleinere Symbole mit
  44-Pixel-Bedienflächen. Login-/Auth-Verträge unverändert.
- Zentraler Bildresolver, echtes belegtes Paris-Foto, korrigierter Aktivitäten-Leerzustand.
  Keine Behauptung weltweiter Bildabdeckung; Merkliste/Übernahme benötigen separate Freigaben.

Grenze der Zustandserhaltung: innerhalb derselben geöffneten Reise und Organisieren-Ansicht.
Ein Reload, eine andere Reise, eine neue Revisionsbasis oder ein ausdrücklich geänderter
Suchkontext ist kein bloßer Kategorienwechsel. Anbieter dürfen selbst abgelaufene Preise
anzeigen oder ihre Inhalte aktualisieren; Jetnity entfernt ihre Hinweise nicht.

## Prüfstand vor Browserabnahme

- 317 gezielte Tests in 26 Dateien bestanden, keine übersprungen. Enthalten sind Kalender,
  bestehende Speicher-/Fehler-/Abbrechen-Verträge, Paris, Navigation, Stay22-Lebenszyklus
  und 360 Filter-/Währungs-/Preisartkombinationen.
- Vollständiges `tsc --noEmit`: bestanden. ESLint der geänderten TS/TSX-Dateien: keine Fehler;
  bestehende Warnungen in Aktivitäten/Mobilität bleiben bestehen. `git diff --check`: bestanden.
- `next build --webpack --experimental-build-mode compile`: erfolgreich. Dies belegt die
  Kompilierung des Gesamtprojekts, nicht eine ausgeführte private Browserabnahme.
- Der breitere vorhandene Core-Lauf war nicht grün (8.579 Tests, 8.404 bestanden,
  81 fehlgeschlagen, 90 abgebrochen, 4 übersprungen). Er umfasst gesperrte lokale Server,
  native PostgreSQL-/Linux-Dateisystemtests und einen installationsgebundenen Security-Nachweis.
  Zusätzlich gefundene alte Kalender-Harness-Annahmen wurden gezielt korrigiert; diese
  25 Tests sind im grünen 317er-Nachlauf enthalten. Kein Vollsuite-Erfolg wird behauptet.
- Erneut geladene Dateilisten von #1196/#1197: keine Überschneidung. Auch der Vergleich
  883c2a0 → aktueller main 63544e8 enthält keine Änderung an den betroffenen Dateien.

## Fortsetzung: Vorschau und reale Browser-Harness

- GitHub live: Draft #1198, Ausgangshead `c20306e`, CI-Lauf `43447231427` fehlgeschlagen.
  Der Core-Teil hatte 8.775 Tests, 8.769 bestanden, vier fehlgeschlagen, zwei übersprungen.
  Vier Fehler reproduziert: Viator füllte ein entferntes Datum-Input; der Editor erwartete
  vier Label statt zwei Kalender-Buttons plus zwei Zeitfelder; zwei Navigationstests
  erwarteten Einstellungen noch in der Sidebar statt im Kontomenü.
- Die drei Browser-Harness bedienen nun die echten Kalender und die vereinbarte
  Navigation. Der November-Test setzt eine feste Browserzeit vor seinen Reisedaten;
  echte Zukunftsgrenzen werden nicht deaktiviert. Der echte Kalenderstil wird geladen.
  Dadurch wurde zusätzlich zu schwacher Text-/Rahmenkontrast im hellen Editor entdeckt
  und mit den bestehenden White/Mint-Farbtokens korrigiert. Kontrast-Gegenprobe bleibt aktiv.
- Nachlauf der drei vollständigen Browserdateien: 24/24 Tests bestanden, keine Skips.
  TypeScript vollständig und ESLint der geänderten Testdateien bestanden.
- Neubau von `c20306e`: Vercel `dpl_GfqnYsBmP2FGP929NMpS3rHFo9kT` READY, nur Preview.
  `/planen` liefert HTTP 200 und lädt in einem separaten sichtbaren Chrome-Fenster.
  Zeitraum 20.–25. November auswählbar; bei 390 × 844 liegt der Kalender vollständig
  im sichtbaren Bereich, kein horizontaler Überlauf, keine JavaScript-Seitenfehler.
  Dies ist noch keine vollständige Hotel-, Safari- oder iPhone-Abnahme.
- Der separate Hosted-PostgreSQL-Job scheiterte bereits beim Paket-/Schlüssel-Download
  mit Exit 28 (Zeitlimit). Keine Änderung am geschützten CI-Workflow.
- Für den Nachfolgecommit bleibt ein vollständiger grüner Core-/CI-Lauf erforderlich.
  Merge bleibt bis dahin und bis zur ausdrücklichen zeitlichen PO-Bestätigung gesperrt.

## Erneute vollständige PO-Abnahme: Arbeitsstand

Live-Basis: Draft #1198, Head `ef3a59b`, Preview `jetnity-odik02yw8-jetnity-e1b93c82.vercel.app`.
CI `43452401417` ist vollständig erfolgreich, Core 8.775 Tests / 8.773 bestanden /
0 fehlgeschlagen / 2 bestehende lokale Browser-Skips. Diese Skips sind keine Browserabnahme.
Der neue Auftrag verlangt acht einzeln belegte Produktpunkte. Vorgehen SINGLE_AGENT:
read-only Browseraudit plus eng begrenzte Korrekturen auf dem eigenen Branch;
keine weiteren ENV-/Auth-/DB-/Provider-Aktivierungen und kein Merge. Neue Commits
brauchen ihren eigenen vollständigen CI-Nachlauf.

Tatsächlich neu reproduzierter Defekt: `minguestrating=8` erzeugt im Stay22-Maps-
Fenster bei Paris eine leere Liste. Der alte Test bestätigte irrtümlich nur diesen
Parameter. Die öffentliche Maps-Implementierung nutzt 3 / 3.5 / 4 / 4.5 für
6 / 7 / 8 / 9 von 10 (`listview.159b5b88c508a1b2b459.js`, beobachtet 13.11.2026),
während die separate v3-API eine Zehnerskala dokumentiert. Korrektur am Maps-Adapter:
UI-Wert halbieren; Sterneskala, Partnerkennung und Reisedaten bleiben identisch.
Browser-Gegenprobe am offiziellen Fenster: Paris 20.–25.11., vier Sterne plus 8/10
liefert mit `minguestrating=4` wieder Angebote. Parameterquellen:
https://dev.stay22.com/docs/maps/parameters und
https://dev.stay22.com/docs/api/accommodations-v3/search .

Chrome-Weiterleitung mit realem Normandy Hotel Paris - Saint-Honoré: Liste und
Karte öffnen gefüllte Booking.com-Ergebnisse mit genau diesem Hotel an erster Stelle;
`dest_type=hotel`, `dest_id=51548`, 20.–25.11.2026, 2 Erwachsene, 1 Zimmer.
Listenübergabe geht über Stay22 Allez mit Jetnity-Kennung und `jetnity-unterkunft`;
beide Booking-Ziele haben `aid=1607597` und eigene Trackinglabels. Kein Kauf und
keine Behauptung einer im Partnerkonto verbuchten Provision.

Zweiter Live-Befund: Stay22 wählt automatisch teils Hotels.com. Dessen Antwort
zeigte trotz `minstarrating=4` echte Drei-Sterne-Hotels (u.a. Albe Hôtel Saint-Michel),
auch nach abgeschlossenem Laden. Der dokumentierte Maps-Parameter
`hotelsapi=booking` bindet die bereits verwendete Booking-Hotelquelle ausdrücklich;
dieselbe Browserprobe enthält dann nur klassifizierte Hotels ab vier Sternen.
Keine neue Anbieterfreigabe oder API, keine Änderung der Partnerkennung.
Ferienwohnungen bleiben Teil des Widgets; Hotelsterne sind keine Klassifizierung
von Ferienwohnungen. Für die Fixes wird ein neuer Exact-Head-Nachlauf abgewartet.

Der gemeinsame Bildresolver verwendet für Amsterdam, Lissabon und Zermatt jetzt
eigene Commons-Originale mit live geprüften Quellen-/Lizenznachweisen statt der
unbelegten Altdateien. Bilder visuell geprüft, Originaldateien nicht bearbeitet.
Weltweite Bildabdeckung, kontoweite Einzelangebotsmerkliste und intelligente
Anbieterübernahme bleiben offen und werden nicht aus grüner CI abgeleitet.
