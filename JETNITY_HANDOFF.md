# Jetnity – Handoff und nächste Schritte

Stand: 20. August 2026

Diese Datei ist der kompakte Übergabepunkt für einen neuen Chat, neuen Cursor-Agenten oder eine spätere Fortsetzung. Sie ergänzt `JETNITY_VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md` und die Fach-Dokumentation unter `docs/`.

## 1. Aktueller Stand

Phase 2.2 ist auf dem Feature-Branch implementiert. Phase 2.1 bleibt in `main` (PR #16, Merge `d9fc8d6`).

Phase 2 ist als konversationeller Kern fertig: Jetnity kann Reisen **erstellen und verändern**. Der Modellweg bleibt in Production aus.

Verbindlicher Ablauf der Änderung:

`vertrauenswürdige Reise → Änderungswunsch → strukturierte Operationen → deterministische Anwendung → Vorher/Nachher → ausdrückliche Bestätigung → atomisches Speichern`

- Das Modell schreibt nicht in die Datenbank und erhält keine SQL-Rechte
- Modellantworten sind untrusted input
- Preise, Provider, Booking-URLs und External-Refs kommen nicht aus dem Modell und werden auf unveränderten Einträgen erhalten
- `trip_days.stage_id` ordnet Tage einer Etappe zu, auch ohne Kalenderdaten
- `trips.revision` / `last_mutation_id` tragen optimistische Concurrency und Idempotenz
- Account: `public.reise_aendern()`, SECURITY INVOKER, RLS, atomisch
- Gast: derselbe fachliche Ablauf im LocalStorage
- Gemeinsames Modellkontingent mit `reisevorschlag` (38 Aufrufe / USD 3 pro Tag)
- `/planen` und `/reisen/[tripId]`: `maxDuration = 300`
- `reise_anlegen()` trägt keine eigene Missbrauchszählung; die Schranke bleibt im Auslöser (`20260820050000`)
- Feature-Branch / Draft-PR: `cursor/phase-22-reise-aendern-e90a`, https://github.com/Jetnity/jetnity/pull/18

Entscheidungen: ADR-0057 bis ADR-0060. Fachlich: `docs/REISEN.md`, `docs/MODELL.md`.

## 2. Produktprinzip, das alle nächsten Phasen leitet

Jetnity soll nicht nur mehr Funktionen anbieten, sondern bessere Reiseentscheidungen treffen.

Die Kernoptimierung ist die **Gesamtreise**, nicht der isoliert billigste Flug oder das billigste Hotel. Jetnity soll Preis, Zeit, Komfort, Lage, Verbindungen, Transfers, Tagesplanung, Folgekosten und Reibung gemeinsam bewerten und verständlich begründen.

Monetarisierung darf die Empfehlung niemals verzerren. Affiliate- oder Vermittlungsprovisionen sind Einnahmequellen, aber Jetnity muss weiterhin die beste Nutzeroption empfehlen, nicht die margenstärkste.

## 3. Nächster Entwicklungsschritt: Phase 3

Phase 2.2 ist umgesetzt. **Als Nächstes: Phase 3 – echte Reiseprodukte**, beginnend mit Flügen.

Kein Merge nach `main` und keine Production-Änderung ohne ausdrückliche Freigabe.

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

## 9. Offene Punkte nach Phase 2.2

Diese Punkte sind bekannt und blockieren Phase 3 nicht, müssen aber im Projektgedächtnis bleiben:

- `public.model_usage`: Aufbewahrungsfrist noch offen; vor Production-Freigabe entscheiden.
- Reload während einer noch nicht übernommenen Vorschau verwirft sie bewusst nach ADR-0050.
- Der Router arbeitet mit Mustern und kann ungewöhnliche Formulierungen falsch einordnen; manueller Modell-Stift bleibt möglich.
- Planpunkte über die bestehende Oberfläche erhöhen `revision` noch nicht (ADR-0058).
- Guest-`ohneTag` ist kein eigener LocalStorage-Bestand; Restpunkte hängen am letzten Tag.
- Preview-Tests sind keine Lasttests.
- Production-Modellaktivierung bleibt eine eigene Freigabe.
- Echte Reiseangebote/Preise sind noch nicht Teil von Phase 2.
- `db:sicherheit` 156/157: der eine Fehlschlag ist `der Dienstweg als Gast bekommt Kontingent`, weil Development heute 24 Gast-Aufrufe in `model_usage` hat (Tagesgrenze). Die Funktion selbst ist unverändert; der Nachweis sieht die live Zeilen. Die drei Wiederholungsfälle an der Reiseschranke sind nach `20260820050000` wieder grün. `db:kontingent` wurde bei vollem Gasttopf nicht erneut gegen die Live-Datenbank geschrieben.

## 10. Sofortiger Startpunkt im nächsten Chat

Wenn in einem neuen Chat gefragt wird „Wie geht es mit Jetnity weiter?“, ist die Antwort:

**Phase 2.2 nicht mergen und Production nicht anfassen, ohne ausdrückliche Freigabe. Als Nächstes: Phase 3 – echte Reiseprodukte, beginnend mit Flügen.**

Noch nicht gleichzeitig Hotels, GetYourGuide und Monetarisierung bauen. Erst Flüge, dann Hotels, dann Aktivitäten, dann Transfers; parallel die Gesamtoptimierung als Jetnity-DNA erhalten. Danach Launch-Reife.

Vor dem ersten Phase-3-Prompt den aktuellen Branch-Stand (PR #18) oder nach Freigabe `main` und die bestehende Dokumentation lesen.
