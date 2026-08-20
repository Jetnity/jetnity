# Cursor-Auftrag – Phase 3.2b: Provider-unabhängiges Hotel-Hardening

Stand: 20. August 2026

## Rolle und Ausgangspunkt

Du bist der Hauptentwickler von Jetnity. Arbeite weiter auf dem bestehenden Branch `phase-3-2-hotel-foundation` und am bestehenden Draft-PR #22. Lies zuerst `AGENTS.md`, `JETNITY_HANDOFF.md`, `JETNITY_VISION.md`, `docs/HOTELS.md`, `ARCHITECTURE.md`, `DECISIONS.md` und den aktuellen PR-Stand.

Die Hotel-Foundation ist integrationsbereit und CI-grün. Es gibt bewusst noch **keinen echten Hotelprovider** und keinen Provider-Schlüssel. Dieser Auftrag schliesst die provider-unabhängigen Integritäts-, Security- und UX-Lücken, damit später nur noch ein schmaler echter Adapter ergänzt werden muss.

## Harte Grenzen

- PR #22 bleibt Draft.
- Nicht nach `main` mergen.
- Keine Production-Änderung.
- Keine Production-Migration.
- Kein echter Hotelprovider und keine Provider-Registrierung.
- Keine neuen Secrets.
- Keine neuen laufenden Kosten / externen Dienste / Routing- oder POI-Anbieter.
- Keine Fake-Hotels und keine erfundenen Preise, Wegezeiten, Verfügbarkeiten oder Booking-URLs.
- Production-Hotelsuche bleibt hart aus.
- Search-Provider und Affiliate-/Booking-Verantwortung getrennt halten.
- Ursache beheben, nicht nur Symptome oder Tests anpassen.

## Ziel

Die bestehende Phase 3.2 so härten, dass untrusted Browserdaten niemals als vertrauenswürdige kommerzielle Hotelfakten gespeichert werden, Reise-/Etappenbezüge sauber geprüft sind, der API-Vertrag robust ist und der spätere Provider nur noch an eine klar definierte serverseitige Vertrauensgrenze angeschlossen werden muss.

## 1. Kritische Vertrauensgrenze bei Hotelübernahme schliessen

Audit `lib/hotels/aktionen.ts`, `lib/hotels/uebernahme.ts`, Gastübernahme und die UI.

Aktuell darf eine Hoteloption aus dem Browser nicht allein deshalb als vertrauenswürdig gelten, weil sie Zod-validiert ist. Preis, Währung, Provider, External-Ref, Storno, Bewertung, Sterne, Frühstück und Verfügbarkeit sind kommerzielle Fakten und dürfen nicht frei vom Client erfunden und persistiert werden.

Verbindlich:

- Solange es keinen echten Hotelprovider bzw. keinen serverseitigen Nachweis einer Option gibt, muss die kommerzielle Hotelübernahme **fail closed** sein.
- Ein authentifizierter Nutzer darf nicht durch einen selbst gebauten Server-Action-Request einen erfundenen `stay` mit beliebigem Preis/Provider/External-Ref als echten kommerziellen Punkt speichern können.
- Definiere eine kleine provider-unabhängige Vertrauensnaht für eine spätere echte Option. Bevorzuge eine separate serverseitige Auswahl-/Nachweis-Abstraktion statt das schmale Search-Interface unnötig aufzublähen. Sie darf heute `unavailable` sein und in Tests mit einem Fake implementiert werden.
- Keine neue Secret-basierte Signatur erfinden und keinen vorhandenen Secret zweckentfremden.
- Keine provider-spezifische Annahme machen, die Booking.com/HBX/anderen später unnötig im Weg steht.
- Browser darf bei der Übernahme höchstens identifiers/selection input liefern; die persistierte kommerzielle Momentaufnahme muss aus einer serverseitig vertrauenswürdigen Quelle entstehen.
- Gastmodus klar einordnen: LocalStorage ist vom Nutzer manipulierbar. UI darf nur echte, vom Jetnity-Suchweg gelieferte Optionen übernehmen; die Doku darf Gastdaten nicht als serverseitig verifiziert darstellen.

Tests müssen den Missbrauch explizit belegen: manipulierte Preise, Provider, External-Refs bzw. frei erfundene Optionen dürfen nicht als vertrauenswürdiger kommerzieller Konto-`stay` gespeichert werden.

## 2. Reise-, Etappen-, Tag- und Zeitraum-Integrität serverseitig prüfen

Die Übernahme darf nicht auf vom Browser behaupteten Reisedaten vertrauen.

Verbindlich für Konto-Reisen:

- `stageId` muss zur angegebenen Reise und zum angemeldeten Nutzer gehören.
- Falls `dayId` gesetzt ist, muss der Tag zur selben Reise gehören und fachlich zur gewählten Etappe passen, soweit das aktuelle Schema diese Aussage trägt.
- Check-in/Check-out für die gespeicherte Momentaufnahme kommen aus dem **vertrauenswürdigen Reisegraphen** bzw. müssen exakt gegen ihn validiert werden; ein Client darf nicht eigenmächtig andere Hotelnächte speichern.
- Bei fehlendem oder unvollständigem Etappenzeitraum sauber fail closed statt Daten zu erfinden.
- Keine stillen Korrekturen, die dem Nutzer einen anderen Zeitraum unterschieben.

Prüfe dabei die aktuellen Fremdschlüssel und `trip_days.stage_id` aus späteren Migrationen, nicht nur die ursprüngliche Phase-1.5-Migration.

## 3. Kommerzielle `stay`-Punkte gegen Modell-/Sprachänderungen auditieren

Die Doku behauptet, kommerzielle `stay`-Punkte seien wie Flüge geschützt. Beweise das am aktuellen Code.

- Prüfe alle Reiseänderungsoperationen auf Inhalt, Termin, Tag-/Etappenzuordnung, Verschieben und Löschen.
- Ein `stay` mit kommerziellen Feldern darf nicht durch natürliche Sprache/Modelloperationen still verändert, verschoben oder gelöscht werden.
- Falls eine Lücke besteht: Ursache im gemeinsamen kommerziellen Schutz beheben, nicht einen Hotel-Sonderfall daneben bauen.
- Tests für Flug **und** Hotel erhalten; keine Regression des bestehenden Flugschutzes.

## 4. API-Hardening von `POST /api/hotels/search`

Audit Route, Schema, Rate-Limit, Fehlerantworten und Client-Sicht.

Mindestens prüfen und bei Bedarf verbessern:

- begrenzte Request-Grösse; kein praktisch unbegrenztes JSON einlesen
- nur `application/json` bzw. klarer Fehler für ungeeigneten Content-Type
- saubere 400/413/415/429-Semantik, soweit sinnvoll
- bei Rate-Limit `Retry-After` tatsächlich an den HTTP-Client geben, nicht nur intern berechnen
- `cache-control: no-store`
- keine internen Scores, Provider-Rohdaten, Secrets, Stacktraces oder Umgebungsinformationen in der Client-Antwort
- kein offener Provider-Proxy
- Production hard off bleibt auch bei falsch gesetzten Env-Variablen
- Timeout bleibt serverseitig begrenzt
- IP-Kennung nicht als Authentizitätsgarantie behandeln; In-Memory-Limit bleibt nur Preview-Schutz und wird so dokumentiert

Keine neue globale Rate-Limit-Infrastruktur in diesem Auftrag.

## 5. Provider-Contract für den späteren Adapter vorbereiten

Ohne einen echten Anbieter anzubinden:

- Halte `HotelProvider.suchen()` schmal.
- Definiere die minimale zusätzliche serverseitige Vertrauens-/Auswahlschnittstelle aus Punkt 1 so, dass der spätere erste Provider oder ein Jetnity-eigener serverseitiger Nachweis sie implementieren kann.
- Contract-Tests mit Fake/Fixture: ungültige/abgelaufene/unbekannte Auswahl, Providerfehler, Preisänderung bzw. nicht mehr verfügbare Option müssen sauber ablehnbar sein.
- Keine Annahme, dass Search-Provider und Affiliate-/Redirect-Partner identisch sein müssen.

## 6. UX ohne Provider sauber halten

Da noch kein Provider vorhanden ist:

- Keine Hotelkarte mit Fake-Daten.
- `unavailable` soll verständlich, ruhig und nicht wie ein Fehler der Reise wirken.
- Quartier-/Lagehinweise nur soweit die Evidenz sie trägt.
- Wenn aktuell nur der Etappenort statt eines echten Viertels bestimmbar ist, die UI darf das nicht als präzise Viertel-/Quartierempfehlung überverkaufen.
- Mobile-first, Accessibility und bestehendes Designsystem beibehalten.
- Keine unnötige neue Produktfläche bauen.

## 7. Tests und Qualität

Erweitere die Tests gezielt. Erwartet sind mindestens:

- manipulierte kommerzielle Browseroption wird für Konto nicht vertraut gespeichert
- serverseitig vertrauenswürdige Fake-Auswahl kann in Tests als `stay` gespeichert/abgebildet werden
- falscher `stageId`, falscher `dayId`, fremder/inkonsistenter Zeitraum werden abgewiesen
- kommerzieller `stay` bleibt gegen Reiseänderungs-/Modelloperationen geschützt
- Request-Grössen-/Content-Type-/Rate-Limit-Verhalten
- `Retry-After`, falls 429
- Client-Sicht ohne Score/Rohdaten/Secrets
- Production hard off
- bestehende Flight-Tests bleiben grün

Danach vollständig ausführen:

- `npm test`
- Typecheck
- Lint
- alle bestehenden Hygiene-Checks
- Production-Build
- GitHub CI
- Vercel Preview

Kein echter Providercall in Tests oder CI.

## 8. Dokumentation

Aktualisiere nur, was der tatsächliche Code danach belegt:

- `docs/HOTELS.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` nur falls wirklich eine neue Architekturentscheidung nötig wurde
- `ROADMAP.md`
- `JETNITY_HANDOFF.md`
- PR #22 Beschreibung, sofern der Agent sie bearbeiten darf; sonst den exakten Stand in Commits/Doku festhalten

Dokumentiere als weiterhin offen:

- erster echter Hotelprovider
- echte Preview-Verifikation mit Provider-Key
- globales/gespeichertes Rate-Limit vor Production
- reale Routing-/POI-/ÖV-Daten für echte Quartierwege
- Production-Aktivierung nur nach separater Freigabe

## Abschlussbericht

Am Ende kurz und überprüfbar berichten:

1. welche Integritäts-/Security-Lücken gefunden wurden
2. was konkret geändert wurde
3. welche Missbrauchsfälle jetzt getestet sind
4. Test-/Typecheck-/Lint-/Hygiene-/Build-Ergebnis
5. GitHub-CI und Vercel-Preview-Status
6. geänderte Dateien/Commits
7. verbleibende Risiken
8. ausdrücklich bestätigen: kein Provider, kein neuer Secret, keine Production-Änderung, kein Merge
