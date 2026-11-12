# Stay22 mit dem Reiseplan verbinden — 11.11.2026

## Auftrag und Ausgangspunkt

Owner-Auftrag: bestätigte Vorschläge für Etappenwahl, Suche nahe Reiseorten, gemeinsame Kartenmarkierungen, sichtbare Filter und bessere Karten-/Listenbedienung professionell umsetzen. Bestehende lokale Vorschau auf `feat/stay22-hotelsuche`, Ausgangspunkt `e5280c3`; isolierter Worktree. Kein Eingriff in parallele M04-/CI-Arbeit. Anbieter-API weiterhin geschlossen, keine synthetischen Hotelangebote.

## Umsetzungsplan

- `Hotelsuche`, `Stay22Ergebnisse` und begrenzte Stay22-URL-Erzeugung erweitern: schnelle Etappenwahl, Suchentwürfe je Etappe während der geöffneten Ansicht, überprüfte Filter, Karten-/Listenansicht und vergrösserte Anzeige.
- Fachlicher Kontext in eigenem reinen Modul: vorhandene Etappenkoordinaten und strukturierte Ortsreferenzen aus zugeordneten Planpunkten. Freie Titel/Notizen sind keine geografische Quelle. Nur nahe Etappen werden als zusätzliche Kartenanker verwendet; unbekannte Positionen bleiben unbekannt.
- Reiseplan-Handoff über geprüfte, navigationsbezogene Ortsreferenz und Etappe; Stay22 erhält keine interne Reise-/Punkt-ID. Bestehende Kontextnavigation zu Aktivitäten/Verbindungen bleibt erhalten. Vor-/Zurück und gelöschte Referenzen prüfen.
- Keine Reiseänderung durch eine Suche. Keine Migration, neue API, Abhängigkeit oder bezahlte Infrastruktur. Bestehende Ortsauflösung für kanonische Ortsreferenzen; manuelle Umgebungssuche als expliziter Suchtext an Stay22, niemals als bestätigter Ort gespeichert.
- POIs auf dem Anbieterrahmen nur mit bekannten Koordinaten, begrenzter Anzahl und öffentlichen/generischen Labels; keine Notizen, Buchungsdaten oder Rücklinks mit Reise-IDs. Nur nach ausdrücklichem Suchstart und unter bestehendem CMP-Vertrag.
- Preisfilter erst aktivieren, wenn Einheit und Währung praktisch belegt sind. Keine Bestpreis-/Sortierbehauptung und keine unbestätigten Provider-Overrides.
- Tests: Kontext-/URL-Vertrag, Fremd-/gelöschte Referenzen, Stale-Entfernung, Entwurfswechsel, unveränderter Reisegraph, Tastatur/Vergrösserung, echte Klickbarkeit mobil, reale Anbieteranzeige getrennt von kontrollierten Tests. Danach TypeScript, Lint, Hygiene, Production-Build und unabhängige Prüfung.

## Status

Die freigegebene Stay22-Integration ist über PR #1185 auf jetnity.com veröffentlicht (Main `ddd8af51e34925c36e7fbf80b57a034407669fc8`, Production `dpl_FVb5GoXEwHGk7BDNKymG38LwSjXw`). Die Abschnitte mit „nur lokale Vorschau“ dokumentieren den früheren Verlauf. Ein im Live-Smoke gefundener Scrollfehler wird separat korrigiert; siehe den letzten Abschnitt. Physischer iPhone-Test sowie Stay22-Verifikation/Auszahlungsdaten bleiben offene externe Punkte.

## Umgesetzt

- Schnelle Etappenleiste mit dem tatsächlichen Aufenthaltszeitraum. Pro Etappe bleiben Suchdatum, Gäste/Zimmer, Währung, Mindeststerne, Mindestbewertung und Suchumgebung während der geöffneten Unterkunftsansicht erhalten. „Reisedaten übernehmen“ setzt abweichende Suchtermine auf den Plan zurück. Andere Städte bleiben über die bestätigte bestehende Ortssuche erreichbar.
- In der Etappenübersicht führen Unterkünfte sowie „Unterkunft nahe einem Reiseort“ in denselben Unterkunftsreiter. Kategorie, Etappe und optionale Ortsreferenz überstehen URL-/History-Navigation; gelöschte, fremde oder ungeeignete Referenzen werden verworfen.
- Ortsnähe: bekannte Nachbarstopps bis 50 km; kanonische Ortsreferenzen aus zugeordneten Flügen/Transfers/Mietwagen; zusätzlich ausdrücklich eingegebene Adressen/Sehenswürdigkeiten. Nicht jeder Planpunkt besitzt eine Position. Keine automatische Auflösung freier Titel, keine behaupteten Gehzeiten oder Routen.
- Optional höchstens acht Kartenorte. Bekannte Koordinaten bleiben die Quelle. Kein Transfer von privaten IDs, Notizen, Buchungsreferenzen oder gespeicherten Gesamtbudgets. Manuelle Stopps erhalten generische Kartenlabels. Auflösungsantworten nach Wechsel/Unmount sind wirkungslos; nur bestätigte freie Ortsauswahl wird im Suchentwurf aufbewahrt.
- Karten-/Listensteuerung, mobile Startansicht Liste, Vergrösserung als nativer Dialog mit Fokus-Rückgabe und Escape. Der Rahmen bleibt beim Vergrössern erhalten. Ein Ansichtswechsel ist ausdrücklich ein Neuladen mit den oben gewählten Suchbedingungen; interne zusätzliche Anbieterfilter werden nicht als synchronisiert ausgegeben. Preis-Badge bezeichnet die Startansicht.
- Die Kartenhöhe berücksichtigt die festen Navigationsleisten auch bei 320 × 568 Pixeln. Der schwebende Zurück-nach-oben-Knopf wird während der Hotelsuche ausgeblendet, damit er keine Filter verdeckt. Die Stay22-Datenschutzhinweise beschreiben zusätzlich Suchumgebung, Filter und optionale Kartenorte.
- Budget und Unterkunftsart verbleiben im originalen Filter. Öffentliche Stay22-Implementierung am 11.11.2026 geprüft: `Data.min/max` sind USD pro Nacht, werden über Nächte und `currency.rate` in die Anzeige umgerechnet. Keine fehlerhafte direkte CHF-Übergabe. Dokumentierte Parameter: https://dev.stay22.com/docs/maps/parameters.

## Nachweise und Review

- 25/25 gezielte Tests für Stay22-URL-/Datenschutzvertrag, fehlende/fremde/gelöschte Reiseorte, geografische Grenze/Datumsgrenze, begrenzte POIs, Ansichtswechsel und Workspace-Navigation erfolgreich.
- Erweiterter `scripts/stay22-browser.mjs`: Desktop Chromium, Mobile Chromium, iPhone WebKit und Small mobile Chromium (320 × 568) erfolgreich. Prüft Etappenentwürfe, A → B → Etappenkarte A, Startdaten, echte Klickpositionen der Rahmenkontrollen, gleiches iframe beim Vergrössern und Schliessen, Fokus-Rückgabe, dokumentierte Filter-/POI-Parameter, Ortssuchtext ohne erfundene Koordinaten, Handoff aus der echten Etappenoberfläche und Browser zurück/vor, Ablehnung/Widerruf und unveränderten lokalen Reisegraphen. Der erste 320-Pixel-Lauf fand eine überdeckte untere Kartenbedienung; Mindesthöhe wurde korrigiert und dieser vollständige Browserlauf danach erfolgreich wiederholt.
- Im Desktoplauf zusätzlich kontrollierte verzögerte Antwort der vorhandenen Ortsbestätigung: Wechsel während der Anfrage, unbestätigter Entwurf bleibt leer, anschliessende erfolgreiche Bestätigung und gemerkter bestätigter Ort. Das ist ein UI-/Protokolltest; kein neuer Test der produktiven Ortsdatenbank. Der Anbieterrahmen dieser automatisierten Tests enthält ausdrücklich keine Hotel-Testangebote.
- Reale, getrennte Chrome-Prüfung im lokalen Vorschautab: Ko Chang mit mindestens vier Sternen zeigt originale Fotos, 4/5- und 5/5-Kategorien, CHF-Summen für sechs Nächte; vergrösserte Originalanzeige; Bangkok in Kartenansicht mit Anbieterpreisen und grünem Ortsmarker. Stay22 verarbeitet die übergebene POI-Liste als `hasPOIs=true`; keine Ergebnisdaten in Jetnity gespeichert. Keine Buchung ausgelöst. Die frühere reale Buchungsweiterleitung ist im Baseline-Nachweis dokumentiert.
- Unabhängiger read-only Reviewer `stay22_codeanalyse`: 25 Tests selbst ausgeführt; zwei P2-Befunde (abgebrochene Ortsbestätigung und wiederholte externe Etappenwahl) gefunden, behoben und erneut gelesen. Keine weiteren belegbaren P1/P2 im geprüften Umfang. Preis-Badge danach als „Startansicht“ präzisiert.
- Vollständiger Lint: 0 Fehler, 195 bestehende Warnungen. Gezielter Lint der finalen Änderung ohne Fehler/Warnungen. Alle fünf Hygieneprüfungen bestanden. TypeScript und abschliessender Production-Build erfolgreich.

## Grenzen und Betriebsstand

Keine neuen Bibliotheken, bezahlten Dienste, Migrationen, RLS-/Auth-Änderungen oder Support-Nachrichten. Die API-Freigabe ist nicht erweitert worden. Kein garantierter billigster Anbieter für dasselbe Zimmer und dieselben Bedingungen. Anbieter-intern veränderte Filter, gespeicherte Favoriten oder abgeschlossene Buchungen werden nicht aus dem fremden Rahmen ausgelesen oder automatisch im Reiseplan bestätigt.

Die produktive Darstellung auf einem physischen iPhone, die Verarbeitung von Kinderaltern/Mehrzimmerbelegung beim Buchungsanbieter sowie Stay22-E-Mail-Verifikation und Auszahlungsdaten bleiben gesonderte offene Punkte. Der aktuelle Veröffentlichungsstand steht oben unter Status. Testbare lokale Vorschau: http://127.0.0.1:3972/vorschau.

## Owner-Feinschliff der Darstellung — 11.11.2026, 02:49

Nach ausdrücklicher Bestätigung der Screenshots wurden das zusätzliche „Mit Stay22“-Schild, die erklärenden Absätze unter Suchformular und Ergebnissen, die zusätzliche Ergebnisüberschrift mit Budgeterklärung, die Beschreibung der Reisemarker/des Ansichtswechsels sowie „Anzeige leer oder unvollständig?“ entfernt. Karten-/Listenwahl, Preis-Startansicht und Vergrösserung stehen in einer kompakten Bedienleiste. Erneutes Laden und separates Öffnen bleiben erreichbar. Fehler- und Datenschutzeinstellungen funktionieren unverändert; die ausführlichen Informationen zu Stay22 stehen weiterhin auf `/privacy`.

Der grün hinterlegte „Unterstützt von Stay22“-Hinweis wird mit dem offiziell dokumentierten Parameter `hidebrandlogo=true` ausgeblendet: https://dev.stay22.com/docs/maps/parameters (UI Toggles, am 11.11.2026 geprüft). Keine Überlagerung oder CSS-Manipulation des fremden Inhalts; Kartenattribution bleibt sichtbar. In der realen Chrome-Vorschau geprüft: originale Ergebnisse vorhanden, auffälliger Markenbalken verschwunden. Keine Änderung am Partnertracking oder an den Suchdaten.

Prüfung: 7 bestehende Stay22-Vertragstests erfolgreich, gezielter ESLint ohne Befunde, Exportprüfung erfolgreich und Production-Build erfolgreich. Vorhandene vollständige Browserabläufe Desktop Chromium und Small mobile Chromium (320 × 568) erneut erfolgreich, einschliesslich echter Klickpositionen, Vergrösserung/Fokus, Reiseplanübergabe und Datenschutz-Ablehnung. Weiterhin nur lokale Vorschau; keine Veröffentlichung.

## Standardkarte Strassen — 11.11.2026

Auf Owner-Wunsch startet die Unterkunftssuche mit `mapstyle=streets` statt `light`. Die öffentliche Stay22-Widgetimplementierung ordnet `streets` dem Standard-Strassenstil `osm_bright` zu; die übrige native Kartenauswahl bleibt verfügbar. Nach erneutem Production-Build und neuer Suche in der bestehenden Chrome-Vorschau geprüft: farbige Strassenkarte mit originalen Hotelangeboten und Kartenattribution. Sieben bestehende Stay22-Vertragstests erfolgreich. Weiterhin nur lokale Vorschau, keine Veröffentlichung.

## Kompakter Ergebnisbereich — 11.11.2026, 03:07

Auf Owner-Wunsch wurde „Suche separat öffnen“ samt unterer Zusatzleiste entfernt. Erneut laden, Vergrössern und Ausblenden sind als beschriftete, tastaturbedienbare Symbolschaltflächen mit mindestens 44 Pixeln Höhe erreichbar. Die vorhandene Suche und Karten-/Listenwahl bleiben bestehen. Auch die Fehlertexte verweisen nicht mehr auf die entfernte Funktion.

Die gesamte Ergebnisfläche einschliesslich Überschrift und Bedienleiste richtet sich nach der verfügbaren Bildschirmhöhe (maximal 700 Pixel), statt ausschliesslich die iframe-Höhe zu begrenzen. Auf kurzen Handys bis 700 × 700 Pixel scrollt der Kopfbereich während der Hotelsuche mit; dadurch verdeckt er die Ergebnisse nicht. Der erste neue Test bei 320 × 568 Pixeln deckte den zu hohen festen Kopfbereich auf. Nach der gezielten Korrektur passen Ergebnisfläche und Bedienung zwischen die sichtbaren Navigationsbereiche. Vergrössern erhält weiterhin denselben Anbieterrahmen und dessen aktuelle Auswahl.

Prüfung: abschliessender Production-Build und gezielter ESLint erfolgreich; Exportprüfung erfolgreich. Alle vier vollständigen Browserabläufe (Desktop Chromium, Mobile Chromium, iPhone WebKit und Small mobile Chromium) mit zusätzlicher Prüfung des gesamten sichtbaren Ergebnisbereichs erfolgreich. Echte Klickpositionen, Vergrösserung/Fokus, Etappenwechsel, Reiseplanübergabe, Datenschutz-Ablehnung und unveränderter Reisegraph weiter erfolgreich. Die automatisierten Rahmen enthalten keine Hotel-Testangebote. Getrennt davon in der bestehenden sichtbaren Chrome-Vorschau originale Stay22-Fotos, Preise, Strassenkarte, vollständige Kartenbedienung und fehlenden separaten Suchlink geprüft. Kein Test auf einem physischen iPhone.

Anpassungsgrenzen anhand der offiziellen Parameter erneut geprüft: Karte/Liste, Kartenstil, Farben, Preis pro Nacht/Aufenthalt, Stern-/Gästebewertungsanzeige und Punkt- statt Preismarker sind konfigurierbar. Freie Anordnung der einzelnen Kartenfelder oder beliebige Fotoformate werden durch die dokumentierten Einbettungsparameter nicht angeboten. Keine neue API-Freigabe oder frei gestaltbare eigene Ergebnisliste daraus ableiten. Quelle: https://dev.stay22.com/docs/maps/parameters.

Weiterhin ausschliesslich lokale Vorschau; kein Push, Pull Request oder Deployment für diesen Feinschliff.

## Grössere Karte und Vergrösserung innerhalb Jetnity — 11.11.2026

Auf erneuten Owner-Wunsch erhält der Ergebnisbereich wieder mehr Höhe: maximal 820 statt 700 Pixel, weiterhin begrenzt durch die verfügbare Bildschirmhöhe. Die dekorative Zeile „Dein Aufenthalt“ entfällt; auf breiten Bildschirmen stehen Suchzeitraum und Belegung neben dem Titel. Die erste Browserprüfung zeigte einen knappen unteren Überstand durch doppelte Berücksichtigung des Kopfbereichs beim Scrollen. Der zusätzliche Scroll-Abstand wurde entfernt; die globale Scroll-Polsterung berücksichtigt den Kopfbereich bereits.

Der offiziell dokumentierte Stay22-Parameter `hideenlargemap=true` blendet das anbieterinterne Vergrösserungssymbol aus, das eine separate Stay22-Seite öffnete. Quelle am 11.11.2026 geprüft: https://dev.stay22.com/docs/maps/parameters, „UI Toggles“. Keine Überlagerung oder Manipulation des fremden Rahmeninhalts. Karten-Zoom, Anbieterfilter, Attribution und Buchungslinks bleiben verfügbar. Die Jetnity-Vergrösserung oben verwendet weiterhin denselben Rahmen im lokalen Dialog.

Prüfung: sieben bestehende Stay22-Vertragstests, gezielter ESLint und abschliessender Production-Build erfolgreich. Nach der Scrollkorrektur alle vier vollständigen Browserabläufe (Desktop Chromium, Mobile Chromium, iPhone WebKit und Small mobile Chromium mit 320 × 568 Pixeln) erfolgreich: vollständige Ergebnisfläche zwischen den Navigationsleisten, tatsächliche Klickpositionen, derselbe Rahmen beim Vergrössern/Schliessen, Fokus-Rückgabe, Etappen-/Reiseplanübergabe, Datenschutz und unveränderter Reisegraph. Die automatisierten Rahmen enthalten keine Hotel-Testangebote.

Zusätzlich im bestehenden sichtbaren Chrome-Tab mit realen Stay22-Fotos, Preisen und Strassenkarte geprüft: internes Vergrösserungssymbol fehlt, Plus/Minus bleiben sichtbar. Jetnity-Vergrösserung und Rückkehr funktionieren auf derselben Vorschau-URL. Keine Buchung ausgelöst. Weiterhin nur lokale Vorschau, keine Veröffentlichung auf jetnity.com.

## Veröffentlichung freigegeben — 11.11.2026

Der Owner hat nach der letzten Vorschau ausdrücklich „ok. fertig und veröffentlichen bitte“ beauftragt. Dies ersetzt den bisherigen Vorschau-Hold für diese Stay22-Integration einschliesslich aller abgenommenen Darstellungsänderungen. Der Stand `474b690` wurde mit dem aktuellen Main `fbcb72e` konfliktfrei zusammengeführt. Die separate M04-Arbeit wird nicht verändert. Keine Migration, neue Secrets, Vertragsänderung oder Zahlung erforderlich. Veröffentlichung bleibt bis zu den Prüfungen des integrierten Standes und tatsächlicher Production-Verifikation offen; die Freigabe allein ist kein Live-Nachweis.

## Integrierte Prüfung und CSS-Korrektur — 11.11.2026

PR #1185, erster Head `03a1280`: CI #4100 / Run 42947919062 fehlgeschlagen. Neben dem bereits auf Main beobachteten M04-Zeitlimit (240 Sekunden, 24/31 Gruppen) verursachte der direkte CSS-Import in `Hotelsuche.tsx` fünf weitere Testfehler beim Import des Workspace in Node. Die Gestaltung wird jetzt wie die bestehenden Reiseplan- und Organisationsstile im Reise-Layout sowie auf der isolierten Audit-Seite eingebunden. Keine Testausschlüsse, Loader-Ausnahmen oder Änderungen an M04.

Alle fünf betroffenen Testdateien danach vollständig erfolgreich: 97/97 Tests, keine Skips. Gezielter ESLint und neuer Production-Build erfolgreich. Alle vier vollständigen Stay22-Browserabläufe (Desktop Chromium, Mobile Chromium, iPhone WebKit, 320 × 568) gegen diesen Build erfolgreich, einschliesslich Kartenhöhe, Vergrösserung, Fokus, Etappen-/Ortsübergabe und unverändertem Reisegraphen. CSS-Inhalt und freigegebene Gestaltung bleiben unverändert.

Die Vercel-Vorschau des ersten Heads wurde erfolgreich gebaut. Der Test einer synthetischen Gastreise dort scheiterte jedoch an fehlenden bestehenden Supabase-Browser-Umgebungsvariablen der Preview-Umgebung. Das ist kein erfolgreicher Remote-Funktionstest; keine Production-Zugangsdaten wurden kopiert. Vollständige CI des korrigierten Heads, Merge und tatsächliche Production-Verifikation bleiben offen.


## Production-Nachweis und Rückkehr aus der Kartenansicht — 11.11.2026

PR #1185 wurde nach vollständigem PASS auf `af1b4297d0da01aa422f8c0099c6c1d8b61276d9` gemergt: CI 42950648202 mit allen acht Jobs erfolgreich, 8712 Tests erfolgreich / 0 Fehler / 2 bestehende Skips; auch alle 31 M04-Gruppen erfolgreich. Vercel Preview READY. Der tatsächliche Merge/Main ist `ddd8af51e34925c36e7fbf80b57a034407669fc8`. Production `dpl_FVb5GoXEwHGk7BDNKymG38LwSjXw` ist READY und dem Alias jetnity.com zugeordnet. Post-Merge-CI 42952694524 läuft zum Zeitpunkt dieses Nachtrags noch.

Live-Smoke in einem isolierten Browserkontext mit synthetischer lokaler Gastreise und blockierten schreibenden Jetnity-API-Aufrufen: originale Stay22-Hotelbilder, Namen und CHF-Preise geladen; Strassenkarte, fehlendes externes Vergrössern, eigene Vergrösserung und gleicher Anbieterrahmen bestätigt. Keine Buchung, kein neuer Tab und kein veränderter Reisegraph. Runtime-Fehlerabfrage für diese Production-Version ohne Treffer. Der eigene Chrome-Vorschautab wurde auf die produktive Unterkunftsansicht umgestellt.

Dabei blieb die Seite nach einer länger geöffneten grossen Karte am Seitenanfang (Scrollposition 894 → 0). Ein sofortiges Escape im bisherigen Test hatte den Fehler verdeckt. Der bestehende Browserablauf wartet jetzt auf die stabilisierte grosse Ansicht und prüft nach Escape die Sichtbarkeit von Kartenbedienung und Anbieterrahmen. Dieser Test schlug gegen die unveränderte veröffentlichte Version fehl.

Korrektur: Scrollposition vor dem Öffnen merken, nach Rückkehr des normalen Layouts vor dem nächsten Bild wiederherstellen. Der native Dialog, Fokus, dieselbe Anbieterinstanz und deren Auswahl bleiben bestehen. Keine Suche oder Buchung wird dadurch ausgelöst; keine Änderung an Tracking, Datenschutz, Datenbank, Infrastruktur oder Kosten. Unmount gibt die Scrollsperre weiter frei.

Lokale Prüfung der Korrektur: gezielter ESLint und Production-Build erfolgreich. Alle vier vollständigen Browserabläufe (Desktop Chromium, Mobile Chromium, iPhone WebKit und 320 × 568) einschliesslich der neuen Regression erfolgreich. Zusätzlich mit realem Stay22-Widget geprüft: Scrollposition 894 → grosse Ansicht → 894, Karte wieder vollständig sichtbar, derselbe Rahmen, geladene Fotos/Preise und unveränderter lokaler Reisegraph. Die Korrektur benötigt noch den eigenen Exact-Head-CI-/Preview-PASS und anschliessenden Production-Nachweis; nicht mit der bereits veröffentlichten Hauptintegration gleichsetzen.
