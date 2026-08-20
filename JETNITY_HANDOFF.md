# Jetnity – Handoff und nächste Schritte

Stand: 20. August 2026

Diese Datei ist der kompakte Übergabepunkt für einen neuen Chat, neuen Cursor-Agenten oder eine spätere Fortsetzung. Sie ergänzt `JETNITY_VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md` und die Fach-Dokumentation unter `docs/`.

## 1. Aktueller Stand

Phase 2.2 ist auf dem Feature-Branch implementiert und als PR #18 **Ready for Review**. Phase 2.1 bleibt bis zum Merge von PR #18 der aktuelle Code-Stand in `main` (PR #16, Merge `d9fc8d6`).

Phase 2 ist als konversationeller Kern fertig: Jetnity kann Reisen **erstellen und verändern**. Der Modellweg bleibt in Production aus.

Verbindlicher Ablauf der Änderung:

`vertrauenswürdige Reise → Änderungswunsch → strukturierte Operationen → deterministische Anwendung → Vorher/Nachher → ausdrückliche Bestätigung → atomisches Speichern`

- Das Modell schreibt nicht in die Datenbank und erhält keine SQL-Rechte
- Modellantworten sind untrusted input
- Preise, Provider, Booking-URLs und External-Refs kommen nicht aus dem Modell
- `trip_days.stage_id` ordnet Tage einer Etappe zu, auch ohne Kalenderdaten
- `trips.revision` / `last_mutation_id` tragen optimistische Concurrency und Idempotenz; die Fassung steigt bei jeder Graph- und Stammdatenänderung, nicht nur in `reise_aendern()`
- Account: `public.reise_aendern()`, SECURITY INVOKER, RLS, atomisch
- Gast: derselbe fachliche Ablauf im LocalStorage, inklusive ungeplanter Planpunkte
- Kommerzielle Planpunkte sind bei Modelloperationen bis Phase 3 vollständig gesperrt: Inhalt, Termin und Zuordnung bleiben unverändert; entfällt ihre Struktur, bleiben sie ungeplant erhalten
- `reise_aendern()` schiebt die Eindeutigkeit von `day_index`/`day_date` bis zum fertigen Graphen auf
- Gemeinsames Modellkontingent mit `reisevorschlag` (38 Aufrufe / USD 3 pro Tag)
- `/planen` und `/reisen/[tripId]`: `maxDuration = 300`
- `reise_anlegen()` trägt keine eigene Missbrauchszählung; die Schranke bleibt im Auslöser (`20260820050000`)
- Feature-Branch / PR: `cursor/phase-22-reise-aendern-e90a`, PR #18

Entscheidungen: ADR-0057 bis ADR-0061. Fachlich: `docs/REISEN.md`, `docs/MODELL.md`, `docs/DATENBANK.md`.

## 2. Production-Rollout am 20. August 2026

Vor dem GitHub-Merge von Phase 2.2 wurde Supabase Production kontrolliert auf den bereits auf dem Development-Branch getesteten V2-Datenbankstand gebracht.

### Ausgangslage

Production stand noch auf der historischen Baseline und enthielt 39 Tabellen aus der alten Jetnity-Produktidee. Development war bereits auf das V2-Schema mit 12 Public-Tabellen migriert.

In Production befanden sich noch wenige Bestandsdaten aus der alten Creator-/Media-/Blog-Struktur. Die wichtigen Kontodaten wurden davon getrennt behandelt:

- 3 Einträge in `auth.users`
- 3 zugehörige alte `creator_profiles`
- zusätzlich kleine Mengen alter Creator-/Session-/Upload-/Blog-Daten

### Freigegebene Bereinigung

Der Nutzer hat ausdrücklich freigegeben, die nicht mehr benötigten alten Creator-/Blog-/Media-/Session-Inhalte zu entfernen. Die Benutzerkonten und notwendigen Kontoprofile sollten erhalten bleiben.

Der Rollout erfolgte über den getesteten Supabase-Development-Branch und dessen Migrationen, nicht über manuelle Einzeländerungen am V2-Schema.

### Ergebnis nach dem Rollout

Production wurde erfolgreich auf denselben fachlichen Datenbankstand wie Development gebracht:

- 3 `auth.users` **erhalten**
- 3 `profiles` **erhalten und weiterhin mit den 3 Auth-Konten verknüpft**
- keine verwaisten Profile
- alte Creator-/Blog-/Media-/Session-Altlasten entfernt
- 12 Public-Tabellen
- 28 registrierte Migrationen
- neueste Migration: `20260820080000_reise_tage_eindeutig_aufgeschoben`
- Reisetabellen (`trips`, `trip_stages`, `trip_days`, `trip_items`) vorhanden und zum Rollout-Zeitpunkt leer
- Supabase Production nach dem Rollout gesund; der Branch-Merge endete mit `FUNCTIONS_DEPLOYED` / `ACTIVE_HEALTHY`
- bekannte Security-Advisor-Warnungen entsprechen dem bereits dokumentierten Development-Stand; durch den Rollout wurde keine neue Warnklasse eingeführt

Wichtig: **Der Modellweg bleibt in Production weiterhin deaktiviert.** Das Datenbankschema ist vorbereitet; eine spätere Modellaktivierung ist eine separate Production-Freigabe.

Der Production-Datenbankrollout erfolgte bewusst **vor** dem GitHub-Merge, damit der neue Phase-2.2-Code nach dem Merge nicht gegen ein veraltetes Production-Schema läuft.

## 3. Produktprinzip, das alle nächsten Phasen leitet

Jetnity soll nicht nur mehr Funktionen anbieten, sondern bessere Reiseentscheidungen treffen.

Die Kernoptimierung ist die **Gesamtreise**, nicht der isoliert billigste Flug oder das billigste Hotel. Jetnity soll Preis, Zeit, Komfort, Lage, Verbindungen, Transfers, Tagesplanung, Folgekosten und Reibung gemeinsam bewerten und verständlich begründen.

Monetarisierung darf die Empfehlung niemals verzerren. Affiliate- oder Vermittlungsprovisionen sind Einnahmequellen, aber Jetnity muss weiterhin die beste Nutzeroption empfehlen, nicht die margenstärkste.

Jetnity soll außerdem reale Änderungen als Kettenereignis verstehen. Beispiel: Wird ein Flug um einen Tag verschoben, analysiert Jetnity die Folgen für Hotelnächte, Aktivitäten, Transfers, Anschlussverbindungen, Budget und Reisezeit und bereitet einen Anpassungsvorschlag vor. Externe Änderungen dürfen niemals still andere Reiseelemente verändern.

Verbindlicher Ablauf:

`Änderung erkennen → Auswirkungen auf die Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen`

Die manuelle Grundfunktion kann Teil des kostenlosen Kerns sein; automatische Überwachung, proaktive Warnungen und fortlaufende Reiseoptimierung sind ein starker Kandidat für Jetnity Pro.

## 4. Nächster Entwicklungsschritt: Phase 3

Phase 2.2 ist umgesetzt und das Production-Datenbankschema vorbereitet. Nach dem kontrollierten Merge von PR #18 und erfolgreichem Production-Deploy folgt **Phase 3 – echte Reiseprodukte**, beginnend mit Flügen.

Kein weiterer Production-Eingriff ohne ausdrückliche Freigabe.

## 5. Phase 3 – echte Reiseprodukte und Monetarisierung

Nicht alle Provider gleichzeitig anbinden. Schrittweise und produktorientiert vorgehen.

### 5.1 Flüge zuerst

Erste echte Produktintegration: Flüge.

Ziel:

- reale Verbindungen und verfügbare Optionen in die Planung einbeziehen
- Zeit, Stopps, Abflug-/Ankunftszeiten, Flughäfen und Folgewirkungen auf die Reise bewerten
- keine reine Preisrangliste
- Affiliate-/Deeplink-/API-Strategie so bauen, dass ein späterer Providerwechsel möglich bleibt, ohne jetzt einen überdimensionierten Multi-Provider-Abstraktionslayer zu bauen

Amadeus bzw. ein geeigneter Flight-Provider ist der erste Kandidat. Vor konkreter Integration aktuelle API-Bedingungen, Kosten, Affiliate-Möglichkeiten, Produktionszugang und Datenqualität erneut prüfen.

### 5.2 Hotels danach

Hotels erst integrieren, wenn die Flug-/Reiseproduktbasis stabil ist.

Jetnity soll nicht nur den billigsten Zimmerpreis sehen, sondern vor allem:

- Lage zur tatsächlichen Tagesplanung
- Transferzeit und Transferkosten
- Qualität/Komfort
- Stornierbarkeit und relevante Bedingungen
- Gesamtwirkung auf die Reise

Start pragmatisch mit Affiliate/Deeplink oder einem passenden Anbieter; keine unnötige Buchungsplattform selbst bauen.

### 5.3 Aktivitäten danach

GetYourGuide ist ein Kandidat für Aktivitäten.

Aktivitäten sollen nicht als willkürliche Liste erscheinen, sondern in den vorhandenen Tagesplan passen und Zeit, Lage, Öffnungszeiten, Dauer und Transfers berücksichtigen.

### 5.4 Transfers / Bahn / Bus / Fähre

Danach die Lücken zwischen den Etappen und Aktivitäten mit realen Transferoptionen schließen. Besonders wichtig für Inselreisen, Roadtrips und Multi-City-Reisen.

## 6. Jetnitys eigentlicher Wettbewerbsvorteil

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

## 7. Monetarisierungsprinzip

Primärmodell:

- Affiliate
- Vermittlungsprovisionen
- später weitere Partnererlöse, wenn sie zur Nutzerreise passen

Die zentrale Reiseplanung sollte zum Launch nicht hinter einer harten Bezahlschranke verschwinden. Der Nutzer soll den Kernnutzen kennenlernen.

Ein mögliches Premium-Modell kann später Mehrwert bieten, insbesondere:

- automatische Überwachung gespeicherter Reisen
- proaktive Hinweise auf Flug-/Hotel-/Provideränderungen
- automatische Folgenanalyse auf die gesamte Reise
- mehrere optimierte Lösungsvorschläge nach Kosten, Zeit, Komfort und Reibung
- erweiterte Kollaboration, Dokumente und Offline-Funktionen

Nicht pro einzelne Änderung abrechnen. Jetnity Pro soll einen dauerhaften Begleit- und Schutzwert bieten.

## 8. Danach: Phase 4 – Launch-Reife

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

## 9. Architektur- und Qualitätsregeln für alle nächsten Arbeiten

- Cursor setzt große Implementierungsaufträge um; ChatGPT steuert mit Produkt, Architektur, Security, Kosten und Review.
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

## 10. Offene Punkte nach Phase 2.2

Diese Punkte sind bekannt und blockieren Phase 3 nicht, müssen aber im Projektgedächtnis bleiben:

- `public.model_usage`: Aufbewahrungsfrist noch offen; vor Production-Freigabe entscheiden.
- Reload während einer noch nicht übernommenen Vorschau verwirft sie bewusst nach ADR-0050.
- Der Router arbeitet mit Mustern und kann ungewöhnliche Formulierungen falsch einordnen; manueller Modell-Stift bleibt möglich.
- Preview-Tests sind keine Lasttests.
- Production-Modellaktivierung bleibt eine eigene Freigabe.
- Echte Reiseangebote/Preise sind noch nicht Teil von Phase 2. Phase 3 muss das Buchungs-/Providerverhalten für kommerzielle Planpunkte bewusst definieren; bis dahin sind sie bei Modelloperationen vollständig gesperrt.
- Der Sicherheitstest `der Dienstweg als Gast bekommt Kontingent` isoliert Live-Gastzeilen der letzten 24 Stunden nur innerhalb der Rollback-Transaktion. Das Development-Tageslimit bleibt 24 und wird nicht erhöht.

## 11. Sofortiger Startpunkt im nächsten Chat

Wenn PR #18 noch offen ist:

**PR #18 auf aktuellem Head und CI prüfen. Das Production-Datenbankschema ist bereits auf Phase 2.2 vorbereitet. Nach erfolgreichem Squash-Merge Production-Deploy und Runtime prüfen.**

Wenn PR #18 bereits gemergt und Production grün ist:

**Phase 3 starten – echte Reiseprodukte, beginnend mit Flügen.**

Noch nicht gleichzeitig Hotels, GetYourGuide und Monetarisierung bauen. Erst Flüge, dann Hotels, dann Aktivitäten, dann Transfers; parallel die Gesamtoptimierung und reaktive Folgenanalyse als Jetnity-DNA erhalten. Danach Launch-Reife.
