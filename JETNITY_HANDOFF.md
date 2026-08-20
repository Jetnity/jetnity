# Jetnity – Handoff und nächste Schritte

Stand: 20. August 2026

Diese Datei ist der kompakte Übergabepunkt für einen neuen Chat, neuen Cursor-Agenten oder eine spätere Fortsetzung. Sie ergänzt `JETNITY_VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md` und die Fach-Dokumentation unter `docs/`.

## 1. Aktueller Stand

Phase 2.1 ist abgeschlossen und per Squash Merge in `main` übernommen.

- PR: #16 – Freitext zu strukturiertem Reisevorschlag
- Merge-Commit: `d9fc8d6ece7d7cce0d5409a784f7e09527dff011`
- Freitext → Modell-Routing → strikt geprüfter Reisevorschlag → Vorgabenprüfung → Vorschau → ausdrückliche Übernahme → Persistenz
- Modellstrategie: Terra als Standard, Sol für komplexe Abwägungen, Luna nicht automatisch für komplette Reisen
- Terra/Luna: 90 s harte Modellgrenze
- Sol: 120 s harte Modellgrenze
- `/planen`: `maxDuration = 300`
- Genau ein Terra-Fallback nach Sol-Fehler/Timeout
- Genau eine Korrekturrunde bei klarer Verletzung harter Vorgaben
- Progressive Loading statt leerem Warteschirm
- Keine erfundenen Live-Preise, Anbieter oder Buchungsangebote
- Modelloutput wird als untrusted input behandelt und mehrfach validiert
- Kosten-/Kontingentschranke liegt in der Datenbank und wird vor jedem Modellaufruf reserviert
- Direkter anon/auth RPC kann das Modellkontingent nicht verbrauchen; die beiden Kontingent-RPCs sind nur serverseitig ausführbar
- Development/Preview ist für echte Modelltests konfiguriert; Production-Aktivierung des Modellwegs ist weiterhin eine eigene Freigabeentscheidung

Die detaillierten Entscheidungen zu Phase 2.1 stehen insbesondere in `docs/MODELL.md` und ADR-0050 bis ADR-0056 in `DECISIONS.md`.

## 2. Produktprinzip, das alle nächsten Phasen leitet

Jetnity soll nicht nur mehr Funktionen anbieten, sondern bessere Reiseentscheidungen treffen.

Die Kernoptimierung ist die **Gesamtreise**, nicht der isoliert billigste Flug oder das billigste Hotel. Jetnity soll Preis, Zeit, Komfort, Lage, Verbindungen, Transfers, Tagesplanung, Folgekosten und Reibung gemeinsam bewerten und verständlich begründen.

Monetarisierung darf die Empfehlung niemals verzerren. Affiliate- oder Vermittlungsprovisionen sind Einnahmequellen, aber Jetnity muss weiterhin die beste Nutzeroption empfehlen, nicht die margenstärkste.

## 3. Nächster Entwicklungsschritt: Phase 2.2

**Phase 2.2 – bestehende Reise per Sprache ändern** ist der unmittelbare nächste PR.

Ziel: Ein Nutzer kann eine bereits bestehende Reise natürlich verändern, zum Beispiel:

- „Mach Florenz einen Tag kürzer und gib mir dafür zwei volle Tage am Meer.“
- „Entferne Los Angeles und verlängere Yosemite.“
- „Der Plan ist mir zu stressig. Mach ihn entspannter.“
- „Wir wollen jetzt mit Kind reisen und brauchen mehr Pausen.“

### Verbindlicher Ablauf

`bestehende Reise → Änderungswunsch verstehen → Änderungsvorschlag berechnen → harte Regeln prüfen → Vorher/Nachher anzeigen → Nutzer bestätigt → erst dann speichern`

Wichtig:

- Keine direkte Datenbankmutation aus einem Modelloutput.
- Bestehende Reise zuerst als vertrauenswürdigen strukturierten Zustand laden.
- Modelloutput erneut als untrusted input behandeln.
- Änderungen müssen auf das bestehende Reiseschema abbildbar und deterministisch prüfbar sein.
- Vorher/Nachher-Diff für den Nutzer verständlich zeigen.
- Harte Vorgaben wie Dauer, Orte, Ausschlüsse, Budgetziel, Flugverbot, Ruhetage und maximale Etappen weiter respektieren.
- Konflikte und offene Punkte ehrlich als Warnung anzeigen statt einen „perfekten“ Plan zu behaupten.
- Doppelklick, Retry und Idempotenz sauber behandeln.
- Kein Phase-2.2-Merge ohne relevante Unit-/Integration-/Browser-Tests, Typecheck, Lint, Build, CI und Dokumentationsupdate.

Wenn Phase 2.2 fertig ist, ist Phase 2 als konversationeller Kern abgeschlossen: Jetnity kann Reisen **erstellen und verändern**.

## 4. Danach: Phase 3 – echte Reiseprodukte und Monetarisierung

Nicht alle Provider gleichzeitig anbinden. Schrittweise und produktorientiert vorgehen.

### 4.1 Flüge zuerst

Erste echte Produktintegration: Flüge.

Ziel:

- reale Verbindungen und verfügbare Optionen in die Planung einbeziehen
- Zeit, Stopps, Abflug-/Ankunftszeiten, Flughäfen und Folgewirkungen auf die Reise bewerten
- keine reine Preisrangliste
- Affiliate-/Deeplink-/API-Strategie so bauen, dass ein späterer Providerwechsel möglich bleibt, ohne jetzt einen überdimensionierten Multi-Provider-Abstraktionslayer zu bauen

Amadeus bzw. ein geeigneter Flight-Provider ist der erste Kandidat. Vor konkreter Integration aktuelle API-Bedingungen, Kosten, Affiliate-Möglichkeiten, Produktionszugang und Datenqualität erneut prüfen.

### 4.2 Hotels danach

Hotels erst integrieren, wenn die Flug-/Reiseproduktbasis stabil ist.

Jetnity soll nicht nur den billigsten Zimmerpreis sehen, sondern vor allem:

- Lage zur tatsächlichen Tagesplanung
- Transferzeit und Transferkosten
- Qualität/Komfort
- Stornierbarkeit und relevante Bedingungen
- Gesamtwirkung auf die Reise

Start pragmatisch mit Affiliate/Deeplink oder einem passenden Anbieter; keine unnötige Buchungsplattform selbst bauen.

### 4.3 Aktivitäten danach

GetYourGuide ist ein Kandidat für Aktivitäten.

Aktivitäten sollen nicht als willkürliche Liste erscheinen, sondern in den vorhandenen Tagesplan passen und Zeit, Lage, Öffnungszeiten, Dauer und Transfers berücksichtigen.

### 4.4 Transfers / Bahn / Bus / Fähre

Danach die Lücken zwischen den Etappen und Aktivitäten mit realen Transferoptionen schließen. Besonders wichtig für Inselreisen, Roadtrips und Multi-City-Reisen.

## 5. Jetnitys eigentlicher Wettbewerbsvorteil

Sobald echte Produktdaten verfügbar sind, muss Jetnity die Reise **gesamtoptimieren**.

Beispiel:

Ein Flug ist CHF 80 billiger, landet aber sehr spät, verursacht einen teuren Transfer und kostet praktisch einen Urlaubstag. Ein etwas teurerer Flug kann für die Gesamtreise klar besser sein.

Jetnity soll deshalb Optionen anhand der gesamten Konsequenzen bewerten:

- Preis
- Reisezeit
- Anzahl und Qualität der Verbindungen
- Ankunfts-/Abflugzeiten
- Komfort
- Lage
- Transferaufwand
- Transferkosten
- verlorene oder gewonnene Urlaubstage
- Passung zum Tagesplan
- Folgekosten
- Stress/Reibung

Die Empfehlung soll die wichtigsten Trade-offs in verständlicher Sprache erklären.

**Keine Provision darf diese Rangfolge manipulieren.**

## 6. Monetarisierungsprinzip

Primärmodell:

- Affiliate
- Vermittlungsprovisionen
- später weitere Partnererlöse, wenn sie zur Nutzerreise passen

Die zentrale Reiseplanung sollte zum Launch nicht hinter einer harten Bezahlschranke verschwinden. Der Nutzer soll den Kernnutzen kennenlernen.

Ein mögliches Premium-Modell kann später Mehrwert bieten, zum Beispiel bei besonders umfangreichen Reisen, erweiterten Optimierungen, Kollaboration, Dokumenten, Offline-Funktionen oder weiteren Pro-Funktionen. Das konkrete Abo-Modell wird erst festgelegt, wenn echte Nutzungsmuster und Kosten vorliegen.

## 7. Danach: Phase 4 – Launch-Reife

Erst wenn Erstellen, Ändern und die wichtigsten Produktintegrationen stabil sind, kommt der vollständige Launch-Pass.

Dazu gehören mindestens:

- Security-Endprüfung
- RLS/Auth/Permissions erneut vollständig prüfen
- DSG/CH-DSG und – bei EU-Zielgruppe – DSGVO sauber abdecken
- rechtliche Texte nur mit ausdrücklicher Freigabe, nicht automatisch erfinden
- Monitoring und Fehlertracking
- Kostenmonitoring und harte Ausgabengrenzen
- Performance und Ladezeiten
- echte iPhone-/Android-Gerätetests zusätzlich zu WebKit/Chromium
- Accessibility
- SEO
- Analytics
- Affiliate-Tracking und Attribution
- Produktionsfreigabe des Modellwegs
- kontrollierte öffentliche Beta

Vor Production-Aktivierung des Modellwegs ist zusätzlich die Aufbewahrungsfrist für `public.model_usage` verbindlich festzulegen.

## 8. Architektur- und Qualitätsregeln für alle nächsten Arbeiten

- Cursor ist technischer Lead/Hauptentwickler; ChatGPT steuert Produkt, Architektur, Security, Kosten und Qualität mit.
- Größere Aufgabe: analysieren → entscheiden → implementieren → relevante Tests → Build/CI → Dokumentation → PR.
- Ursachen beheben, nicht Symptome verstecken.
- Keine Demos oder Wegwerfarchitektur als Produktionsbasis.
- Keine neuen wiederkehrenden Kosten oder materiell neue Architektur-/Produkt-/Businessentscheidungen ohne ausdrückliche Freigabe.
- Kostenrahmen Infrastruktur: maximal USD 100/Monat; darüber vorher fragen.
- Dev/Test und Preview dürfen autonom genutzt werden; Production bleibt kontrolliert.
- Keine destruktiven Production-Datenaktionen, riskanten direkten Production-DB-Eingriffe, DNS-/Domainänderungen oder neue Production-Secrets ohne ausdrückliche Freigabe.
- Keine Secrets in Chat, Logs, Screenshots oder Commits.
- Relevante DB-Migrationen zuerst Development; Production nur über getesteten, dokumentierten Weg.
- Security/RLS/Auth/Tests/Mobile/Accessibility/Performance/Loading/Error States/Permissions/Kostenkontrollen nicht aus Spargründen überspringen.
- Starke Modelle dort einsetzen, wo sie messbar mehr Qualität bringen; effiziente Modelle für Routinearbeit. Qualität pro Token optimieren, nicht blind Kosten minimieren.

## 9. Aktuelle offene Punkte aus Phase 2.1

Diese Punkte sind bekannt und blockieren den Start von Phase 2.2 nicht, müssen aber im Projektgedächtnis bleiben:

- `public.model_usage`: Aufbewahrungsfrist noch offen; vor Production-Freigabe entscheiden.
- Reload während einer noch nicht übernommenen Vorschau verwirft sie bewusst nach ADR-0050.
- Der Router arbeitet mit Mustern und kann ungewöhnliche Formulierungen falsch einordnen; manueller Modell-Stift bleibt möglich.
- Preview-Tests sind keine Lasttests.
- Production-Modellaktivierung bleibt eine eigene Freigabe.
- Echte Reiseangebote/Preise sind noch nicht Teil von Phase 2.1.

## 10. Sofortiger Startpunkt im nächsten Chat

Wenn in einem neuen Chat gefragt wird „Wie geht es mit Jetnity weiter?“, ist die Antwort:

**Phase 2.2 starten: bestehende Reise per natürlicher Sprache ändern.**

Noch nicht gleichzeitig Amadeus, Hotels, GetYourGuide und Monetarisierung bauen. Erst Phase 2.2 vollständig, getestet, dokumentiert und gemergt. Danach Phase 3 in der Reihenfolge Flüge → Hotels → Aktivitäten → Transfers; parallel die Gesamtoptimierung als Jetnity-DNA erhalten. Danach Launch-Reife.

Vor dem ersten Phase-2.2-Prompt soll der aktuelle `main`-Stand und die bestehende Dokumentation gelesen werden. Danach einen klar abgegrenzten PR für Phase 2.2 anlegen.
