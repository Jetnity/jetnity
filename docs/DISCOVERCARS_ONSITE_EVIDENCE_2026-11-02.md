# DiscoverCars auf Jetnity — Implementierung und Nachweise

Stand: 2. November 2026. Basis `cd6ccc33e926897379999de918d21d90111ec77e` (PR #1103). Branch `codex/discovercars-onsite-20261102`. Dieser Bericht beschreibt den Stand vor Hosted-CI/Release; spätere SHA-/Deployment-Abnahme gehört in den PR-Releasebeleg.

## Ergebnis und Grenzen

Im vorhandenen Mietwagenbereich ersetzt `DiscoverCarsSuche` den Angebotsplatzhalter und die allgemeine/BKK-Radiokarte durch ein bewusst geladenes offizielles Suchformular. Abhol-/Rückgabeort, Mietdaten, Uhrzeit, Alter und Wohnsitz werden dort gewählt. Ergebnisse, Fahrzeuge, Preise, Mietbedingungen und Buchung öffnen extern. Der allgemeine Partnerlink ist jederzeit erreichbar. Bestehende Mietwagen, manuelles Anlegen und Buchungsstatus bleiben erhalten.

12Go verwendet einen dokumentierten allgemeinen Timetable-Dienst. DiscoverCars bietet laut [B4B](https://pages.discovercars.com/b4b) zusätzlich Search API, Full API und White-label, aber im untersuchten bestehenden Partnerkonto ist kein nutzbarer API-Zugang belegt. Es gibt deshalb keine neuen nativen Fahrzeugkarten, keine Website-internen API-Abfragen, kein Scraping von Angeboten und keine erfundenen Preise. `rentalCarProviderAus()` bleibt null. Eine konkrete Anfrage an die im Konto genannten Ansprechpartner ist als nicht versandter Entwurf vorbereitet.

## Quelle und Attribution

Der [offizielle Generator](https://www.discovercars.com/de/affiliate/widget) wurde mit `jetnity`, Deutsch/CHF, leerem Ort und neutraler Jetnity-Gestaltung bedient. [Originalausgabe](evidence/discovercars-onsite-2026-11-02/generator.html) und [strukturierter Laufzeitnachweis](evidence/discovercars-onsite-2026-11-02/contract-evidence.json). Der generierte Loader erzeugt ein 31-Parameter-Formular auf `https://widget.discovercars.com/de/locations/`. Diesen festen Vertrag verwendet Jetnity direkt, ohne das Loader-Skript im Jetnity-Dokument auszuführen. Die Herkunft wird aus der aktuellen Origin gebildet, nie aus URL-Pfad, Reise- oder Kontodaten.

Ein synthetischer Suchversuch (BKK, 4.–12. November 2026, 11 Uhr, Anbieter-Voreinstellung CH/30–65) öffnete eine echte DiscoverCars-Ergebnisseite mit Fahrzeugen. `a_aid=jetnity`, `utm_source=jetnity`, `utm_medium=widget` und CHF waren in der Übergabe vorhanden. Das ist ein Nachweis der URL-Zuordnung, kein Provisions- oder Buchungsnachweis. Es wurde nichts gebucht oder bezahlt. Der frühere Draft #1084 bleibt unverändert; seine vermutete fehlende `data-aff-value` wird nicht übernommen, weil der unveränderte offizielle Generatorweg die Partnerkennung tatsächlich weitergab.

## Isolation, Datenschutz und Lebenszyklus

- Vor dem Anzeigen gibt es keinen Anbieterrahmen, Loader, Preconnect oder Prefetch.
- Der Anbieterrahmen bleibt auf seinem fremden Ursprung. Sandbox erlaubt nur Scripts, Forms, Same-Origin auf diesem Anbieter, Popups und deren externen Buchungsweg. Keine Top-Navigation, Kamera, Mikrofon, Geolocation oder Payment-Berechtigung.
- `credentialless` isoliert in unterstützenden Browsern zusätzlich; DiscoverCars kann dennoch eigene Cookies/Technologien nutzen. Die Oberfläche und `/privacy` benennen das. Die äußere CSP kontrolliert nicht automatisch Unteranfragen des Anbieterdokuments.
- `referrerPolicy=origin` überträgt die öffentliche Jetnity-Origin, keine Reise-URL. Der bereits vorhandene Linkfallback behält `noopener noreferrer sponsored` und `no-referrer`.
- Höhenmeldungen müssen als begrenzter JSON-String von exakt der Anbieter-Origin **und** dem aktuellen Iframe stammen. Genau drei Felder, ausschließlich bekannte Aktion, Höhe 200–2400. Kein HTML oder Navigationsziel wird übernommen. Erst eine gültige Meldung zeigt Bereitschaft; nach 20 Sekunden ohne Bereitschaft wird der Rahmen entfernt und ein Fehler mit Linkfallback gezeigt.
- Ausblenden, Reisewechsel, Mobilitäts-Untertabwechsel, Workspace-Bereichswechsel und Unmount entfernen Rahmen, Timer und alle Event-Listener. Die Anzeigeentscheidung wird nicht gespeichert.
- Vorhandene CMP-Ablehnungen/Inkonsistenzen verhindern Laden. Ready-/Consent-Changed-/Focus-/Pageshow-Ereignisse lesen die echte API erneut; Ereignis-Payloads erteilen keine Freigabe. Eine bereits beobachtete verlorene CMP darf kein Wiederladen ermöglichen. Gemeinsame CMP-Release-Konstante, Host-Registry und bestehende Provider-Policies bleiben unverändert.

## Prüfungen

- `npm ci`: bestanden, Node 22.23.3.
- 19 fokussierte DiscoverCars-Tests: bestanden; unabhängiger Reviewer reproduzierte sie und ergänzte Gegenproben zu verspäteten Meldungen, Schrumpfen, Fehler, Timeout, Pageshow-Ablehnung und API-Verlust.
- Typecheck: bestanden. Gesamtlint: 0 Fehler, 192 bestehende Warnungen. Production-Build: bestanden.
- Alle fünf Hygieneprüfungen: bestanden (Erreichbarkeit, Exporte, Pakete, Admin-API-Schutz, Schema-Bezug).
- Lokaler Gesamttest gestartet: vier bekannte Linux-spezifische PostgreSQL-16-Prüfungen können auf diesem Mac nicht starten (`/usr/lib/postgresql/16/bin/initdb` fehlt bzw. `native_postgresql16_required`; lokal ist PostgreSQL 17 vorhanden). Tests werden nicht übersprungen oder umgeschrieben. Vollständige native CI muss den finalen Head prüfen.
- Unabhängiger Source-Review des uncommitteten Runtime-Diffs: kein belastbarer P1/P2-Befund. Das ersetzt keine Prüfung des finalen Commits.

Browser: tatsächliche `MobilitaetBereich`-/`MietwagenBereich`-/Suchkomponenten im lokalen React-StrictMode-Harness, synthetische Reise. Initial 0 Frames; nach Anzeigen genau 1; nach Ausblenden, Untertab-/Reise-/Workspace-Wechsel oder CMP-Widerruf jeweils 0. Rückkehr lädt nicht selbst. Mobile Datumsauswahl änderte 4. auf 10. November; anderer Rückgabeort öffnete eigenes Suchfeld. Echte Standortvorschläge, erster Suchübergang bis sichtbare externe Fahrzeugergebnisse. Breiten 280/320/360/375/390/430/768/1280 und 844×390: äußerer und innerer Inhalt ohne horizontalen Überlauf. Höhenmeldungen passen sich an. Browser-Ansichten unter `outputs/jetnity-discovercars-2026-11-02/` im Arbeitsbereich.

## Übergabe / Release

Noch ausstehend bei diesem Commit: finale unabhängige SHA-Prüfung, Hosted-CI, Preview/Releaseentscheidung und belegte produktive Einbindung. Browserzugriff auf `jetnity.com` wird weiterhin vom Tool verweigert; der Nutzer hat die Fehlersuche vertagt. Das wird nicht umgangen und nicht als bestandene Live-UI-Abnahme dargestellt. Chrome-Viewport-Prüfungen ersetzen keine physische iPhone-/WebKit-Abnahme.

Keine Datenbankmigration, Auth-/RLS-Änderung, neuen Secrets, Pakete, Verträge, Käufe oder laufenden Infrastrukturkosten. Native Fahrzeugvergleichsdaten sind der nächste sinnvolle Ausbau, sobald DiscoverCars den konkreten Search-API-/White-label-Zugang und die Anzeigerechte bestätigt.
