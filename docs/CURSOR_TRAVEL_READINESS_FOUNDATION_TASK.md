# Cursor-Auftrag – Foundation C: Travel Readiness & Dokumente

Stand: 22. August 2026  
Branch: `feat/travel-readiness-foundation`  
Basis: `main` @ `315d9b31e69fcd5fd40227f65aa97587efc3bec4`  
Ziel: provider-unabhängige, logisch strenge Reisevorbereitungs-Foundation ohne sensiblen Dokumententresor

---

## 0. Arbeitsmodus

Du bist der Implementierungs-Agent für diesen Branch. Arbeite selbstständig bis zu einem vollständig reviewbaren Draft-PR, aber halte die Grenzen dieses Auftrags strikt ein.

Vor jeder Architekturentscheidung zuerst Repository, Datenmodell, vorhandene Sicherheitsgrenzen und aktuelle Produktlogik lesen. Keine parallelen Mini-Systeme bauen.

**Nicht mergen. Nichts auf Production migrieren oder aktivieren.** Falls eine DB-Migration nötig ist: nur Development anwenden und vollständig verifizieren.

Der verbindliche Leitsatz ist:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Bei Unsicherheit gilt: `unknown` bleibt `unknown`. Keine plausible Vermutung als Fakt darstellen.

---

## 1. Pflichtlektüre – zuerst vollständig lesen

Mindestens:

- `AGENTS.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/REISEN.md`
- `docs/DATENBANK.md`
- `docs/MOBILITY.md`
- `docs/RENTAL_CARS.md`
- `docs/PR31_REAL_DEVICE_ACCEPTANCE.md`
- `docs/PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md`
- relevante Supabase-Migrationen und RLS-Policies
- `types/trips.ts`
- `lib/trips/**`
- `lib/reiseaenderung/**`
- `components/trips/**`
- bestehende Guest-/Account-Persistenz
- bestehende Audit-/Browser-Test-Harnesses

Danach aktuellen Git-/PR-/CI-/Preview-/Development-/Production-Stand prüfen.

Wichtig: Foundation B / PR #31 ist inzwischen **gemergt**. `main` steht auf `315d9b31e69fcd5fd40227f65aa97587efc3bec4`; das Mietwagen-Schema `20260821200000_trip_items_rental_car` ist auf Production. Die produktive Mietwagensuche bleibt aus. Falls Handoff/Roadmap noch den Vor-Merge-Stand nennen, im Rahmen dieses PR sauber aktualisieren.

---

## 2. Produktziel

Jetnity soll nicht nur Flug, Unterkunft, Aktivitäten und Mobilität kennen, sondern auch verstehen, ob eine Reise **vorbereitet** ist.

Foundation C schafft dafür einen belastbaren Unterbau für:

- Einreise-/Visa-Prüfung
- Reisedokument-/Pass-Prüfung
- Versicherungs-Prüfung
- Ticket-/Buchungsbestätigungs-Prüfung
- weitere nicht-sensitive Reisevorbereitungen

Die Foundation soll später offizielle, aktuelle Quellen integrieren können, ohne heute so zu tun, als seien Anforderungen bereits verifiziert.

### Sehr wichtig

Diese Foundation baut **keinen sensiblen Dokumententresor**.

Nicht speichern/hochladen:

- Pass- oder ID-Scans
- Pass-/Ausweisnummern
- Geburtsdaten
- Kreditkartendaten
- Führerscheinnummern oder Führerscheinscans
- Visa-Dokumente/Scans
- Gesundheits-/Impfdaten
- andere hochsensible Identitätsdokumente

Keine Supabase-Storage-Buckets für Dokumente in diesem Auftrag. Keine OCR. Keine Dokumentenverschlüsselung „nebenbei“.

Ein späterer echter Vault braucht eine eigene Security-/Encryption-ADR und ausdrückliche Freigabe.

---

## 3. Harte Wahrheitsregel: zwei getrennte Ebenen

Foundation C darf **niemals** diese beiden Dinge vermischen:

### A. Anforderungs-Wahrheit

Was ist nach einer vertrauenswürdigen offiziellen Quelle für diese konkrete Reise / Person tatsächlich erforderlich?

Beispiele:

- Visum erforderlich oder nicht
- zulässiges Reisedokument
- Mindestpassgültigkeit
- Transitregel
- Pflichtversicherung

Diese Wahrheit ist in Foundation C ohne echten Provider / offizielle Quelle meist **unknown / nicht offiziell geprüft**.

### B. Nutzer-Vorbereitungsstand

Was hat der Nutzer selbst als erledigt, offen oder nicht relevant markiert?

Beispiele:

- „Einreisebedingungen geprüft“
- „Reisedokument kontrolliert“
- „Versicherung geprüft“
- „Buchungsbestätigung erhalten“

Das ist **User Evidence**, keine offizielle Bestätigung.

**Ein Nutzer-Häkchen darf niemals automatisch eine offizielle Anforderung als erfüllt/verifiziert darstellen.**

Beispiel:

> „Von dir als erledigt markiert“ + „Einreiseanforderung noch nicht offiziell verifiziert“

ist korrekt.

> „Reisebereit / Visum passt“

ist ohne belastbare Quelle falsch.

Diese Trennung muss im Domain-Modell, Persistenzmodell, UI und Tests sichtbar sein.

---

## 4. Kritische Reise-Logik, die nie geraten werden darf

Folgende Aussagen sind ohne belastbare Fakten verboten:

1. Zielland = Staatsangehörigkeit.
2. Abflugland = Wohnsitz oder Staatsangehörigkeit.
3. Eine Einreisebestimmung gilt automatisch für alle Reisenden.
4. Zwei Reisende haben automatisch dieselben Visa-/Passanforderungen.
5. Ein gebuchter Flug bedeutet, dass ein Ticket / eine Buchungsbestätigung vorliegt.
6. Eine Buchungsreferenz bedeutet, dass ein Dokument heruntergeladen oder geprüft wurde.
7. Eine vorhandene Versicherung bedeutet, dass Ziel, Zeitraum, Aktivitäten oder Mietwagen wirklich gedeckt sind.
8. Ein Pass bedeutet, dass seine Restgültigkeit ausreicht.
9. Eine bekannte Destination reicht für Visa-Wahrheit; Staatsangehörigkeit, Transit, Zweck, Dauer und andere Faktoren können relevant sein.
10. Eine alte offizielle Regel ist noch aktuell.
11. Ein fehlender Provider bedeutet „nicht erforderlich“.
12. Ein Nutzer markiert „erledigt“ → offizielle Anforderung erfüllt.
13. Eine Reiseroutenänderung lässt einen alten Check automatisch gültig.
14. Eine Reise mit mehreren Etappen hat nur die Anforderungen des Hauptziels.
15. Ein Country Label ohne kanonischen Country Code ist ein belastbarer Länderkontext.

Wo Kontext fehlt: `unknown` / „noch nicht offiziell geprüft“ / „erneut prüfen“.

---

## 5. Datenmodell – eigene Readiness-Domäne, nicht `trip_items`

Readiness ist kein Tagesplanpunkt und keine Buchung. **Nicht** als neuer `trip_items.kind` modellieren.

Baue eine eigene, kleine, normalisierte Readiness-Persistenz (bevorzugt `trip_readiness_items`) und dokumentiere die Entscheidung per ADR.

### Mindestanforderungen an das Modell

Die Persistenz speichert **Nutzer-Vorbereitungsstand**, nicht erfundene offizielle Regeln.

Sie muss mindestens sauber abbilden können:

- eindeutige ID / idempotente Client-Identität
- `trip_id`
- `user_id`
- fachliche Art, z. B.:
  - `entry_check`
  - `visa_check`
  - `travel_document_check`
  - `insurance_check`
  - `ticket_confirmation_check`
  - `booking_confirmation_check`
  - `preparation`
- Nutzerstatus, z. B. klar begrenzter Wertebereich wie:
  - `open`
  - `done`
  - `skipped`
- Evidenz in dieser Foundation ausschließlich `user`
- optionaler, sicherer Kontextbezug:
  - Country Code, wenn wirklich bekannt
  - related `trip_item`, wenn ein Check zu einer konkreten Buchung gehört
  - optional Stage-Bezug nur wenn architektonisch sauber
- optionaler kurzer Custom-Titel nur für `preparation`, streng längenbegrenzt
- Context/Fingerprint oder gleichwertige Logik, damit ein alter Nutzer-Check nach einer relevanten Reiseänderung **nicht still als aktuell** gilt
- `created_at` / `updated_at`

### Keine sensiblen Felder

Explizit **keine** Spalten für:

- passport_number
- document_number
- date_of_birth
- nationality
- residence
- visa_number
- health/vaccination
- raw document metadata/file path

### Scope / Referenzen

Wenn `trip_item_id` genutzt wird, muss der referenzierte Planpunkt zur selben Reise / demselben Eigentümer gehören. Keine Cross-Trip-Verknüpfung.

Wenn Country Codes genutzt werden: nur ISO-ähnlich streng validierte Codes; kein freies Country-Label als Wahrheit.

### Obsolete / stale Checks

Ein Check darf nach relevanter Kontextänderung nicht grün bleiben, wenn seine Bedeutung vom alten Kontext abhing.

Beispiele:

- Reisedatum geändert
- Zielland entfernt/ersetzt
- gebuchter Planpunkt ersetzt
- Buchungsstatus zurückgesetzt

Bevorzugt eine deterministische `contextFingerprint`-/`contextRevision`-Logik. Account-seitig darf der Browser nicht einfach behaupten, ein Fingerprint sei aktuell; serverseitig aus vertrauenswürdigen Trip-Fakten berechnen/verifizieren.

Dokumentiere exakt, welche Felder in welchen Fingerprint eingehen.

---

## 6. Gast und Konto – eine Form

Der aktuelle Grundsatz bleibt:

> Gastreise und Kontoreise haben dieselbe fachliche Form.

Erweitere das Trip-Modell sauber um Readiness, sodass:

- Guest/localStorage
- Account/Supabase
- Guest → Account Übernahme
- Reload
- Multi-Tab / Retry

logisch dieselben Readiness-Informationen erhalten.

Keine zweite parallele „Account-only Readiness“-Domäne bauen.

### Guest → Account

Die Übernahme muss idempotent sein und darf keine User-Evidence verdoppeln.

Wenn `reise_anlegen(jsonb)` erweitert wird, nur mit der **aktuellen** Production-Definition als Basis; keine ältere Funktion über bestehende Änderungen schreiben.

Alternativ darf eine separate, transaktional / idempotent saubere Readiness-Sync-Naht gewählt werden – per ADR begründen.

`reise_aendern(jsonb)` darf Readiness **nicht still durch natürliche Sprache** als done/skipped markieren.

Readiness-Zustände brauchen ausdrückliche Nutzeraktion.

---

## 7. RLS / Security

Security ist höchste Priorität.

Wenn neue Tabelle:

- RLS aktiv
- Owner-Isolation über `auth.uid()`
- INSERT/UPDATE/DELETE nur für eigene Reise
- `trip_id` und `user_id` müssen konsistent sein
- keine Cross-User/Cross-Trip-Verknüpfung
- sinnvolle FK-Strategie
- sinnvolle Indizes für `trip_id`, `user_id`, optionale Referenzen
- keine `service_role` im Browser
- keine Secrets im Client

Server-/API-Eingaben immer untrusted behandeln:

- Zod/strenge Validierung
- Body-Caps
- feste Enum-Werte
- Textlängen
- keine beliebigen URLs
- keine HTML-Ausführung
- keine offenen Redirects
- keine SSRF

Custom-Titel im UI ausdrücklich mit Hinweis versehen:

> Keine Passnummern, Ausweisdaten oder andere sensible Daten eintragen.

Readiness-Daten sind private Reisedaten und dürfen nicht öffentlich gecacht werden.

---

## 8. Offizielle Anforderungen – Provider-Naht vorbereiten, aber nicht vortäuschen

Baue eine kleine provider-neutrale Domain-Naht unter z. B. `lib/readiness/` für zukünftige offizielle Anforderungen.

Ein zukünftiger Provider muss mindestens strukturierte Evidence liefern können:

- Destination Country Code
- welche Traveller-Kontextfakten die Aussage voraussetzt
- Requirement Type
- Requirement Result (`required`, `not_required`, `unknown` o. ä.)
- Autorität / Quellenname
- belastbare Source URL
- `checkedAt`
- optional Validity Window
- keine freie Modellbehauptung als Quelle

### Mehrere Reisende

Der aktuelle Trip kennt nur eine Anzahl `travellers`, keine individuellen Identitäts-/Nationalitätsprofile.

Daher darf Foundation C **keine individuelle Visa-/Passaussage für alle Reisenden** treffen.

Wenn `travellers > 1`, muss die UI / Domain ausdrücklich verhindern, dass ein einzelner unbekannter Kontext als „für alle geprüft“ gilt.

Auch bei `travellers = 1` fehlt derzeit die Staatsangehörigkeit; deshalb bleiben offizielle Einreise-/Visaresultate ohne späteren expliziten Kontext `unknown`.

### Geschlossene API

Falls du eine Route wie `POST /api/readiness/requirements` baust:

- Provider-neutral
- kein Provider gewählt → ehrliches `unavailable` / `insufficient_context`
- Production hart fail closed
- eigener Kill Switch nur falls wirklich nötig
- keine Fake-Regeln
- keine generischen Modellantworten als Visa-/Einreisequelle
- keine Web-Scraping-Implementierung in diesem Auftrag
- keine neuen Secrets
- kein kostenpflichtiger Account

Ein Provider darf **nicht** allein aus Country Code eine scheinbar definitive Visa-Aussage erzeugen.

---

## 9. System-Checks vs. Fakten

Jetnity darf aus vorhandenen Reiseinformationen **Prüfaufgaben** ableiten, aber keine Anforderungen erfinden.

Zulässig:

- „Einreisebedingungen für Thailand noch prüfen“ wenn Thailand als kanonischer Reisekontext bekannt ist.
- „Buchungsbestätigung prüfen“ wenn ein kommerzieller Planpunkt ausdrücklich `booked` ist.

Nicht zulässig:

- „Visum erforderlich“ ohne offizielle Evidence.
- „Ticket vorhanden“ nur weil der Flug `booked` ist.
- „Versicherung ausreichend“ nur weil Nutzer eine Versicherung markiert hat.

System-abgeleitete Checks sollen nach Möglichkeit **nicht ungefragt persistiert** werden. Sie können deterministisch aus dem aktuellen Reisegraphen entstehen; Nutzeraktion persistiert dann den User-Status.

Vermeide Duplikate bei mehreren Etappen im selben Land und bei wiederholtem Render/Reload.

---

## 10. Readiness-Status / Aggregation

Baue eine konservative Domain-Aggregation, die mindestens unterscheiden kann:

- offiziell nicht geprüft / unknown
- Nutzeraktion offen
- Nutzeraktion erledigt
- von Nutzer übersprungen / nicht relevant markiert
- Kontext geändert → erneut prüfen / stale
- Provider nicht verfügbar

### Gesamtstatus

**Kein globales „Reisebereit“ / „Alles bereit“**, solange wichtige offizielle Anforderungen unbekannt sind.

Beispiel einer zulässigen Zusammenfassung:

> „4 von 5 Vorbereitungspunkten erledigt · Einreiseanforderungen noch nicht offiziell geprüft“

Nicht:

> „Deine Reise ist bereit“

wenn Visa-/Einreise-Wahrheit unbekannt ist.

Die nächste Foundation D wird die Gesamt-Abdeckung über alle Reisebereiche bauen. Foundation C soll dafür einen sauberen, provider-neutralen Readiness-Summary liefern, aber D nicht vorwegnehmen.

---

## 11. Booking-/Ticket-Truth

Bestehende Buchungslogik bleibt unverändert:

- `unconfirmed` ≠ booked
- `booked` nur nach ausdrücklicher Nutzerbestätigung / später vertrauenswürdiger Provider-Evidence

Für Readiness zusätzlich:

- booked ≠ ticket available
- booked ≠ confirmation downloaded
- external ref ≠ confirmation checked
- booking URL ≠ document stored

Ein Ticket-/Bestätigungscheck darf sich auf einen `trip_item` beziehen, aber nie dessen kommerzielle Fakten duplizieren oder überschreiben.

Wenn ein verknüpfter Planpunkt nicht mehr booked ist oder gelöscht/ersetzt wurde, muss die Readiness logisch neu bewertet / stale / entfernt werden – nicht weiter grün zählen.

---

## 12. UX – in Übersicht integrieren, kein sechster Haupt-Tab

Die fünf Hauptbereiche bleiben in dieser Foundation:

`Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`

**Keinen sechsten Top-Level-Tab hinzufügen.**

Foundation C wird zunächst als klarer Bereich **Reisevorbereitung** in der Übersicht integriert, damit der Nutzer das Gesamtbild sieht. Später kann der große integrierte UX-Pass die Informationsarchitektur neu bewerten.

### Erwartete UX

In der Übersicht:

- kompakte Readiness-Zusammenfassung
- klare Zahl offen / erledigt / erneut prüfen
- separater Hinweis, wenn offizielle Einreise-/Visa-Anforderungen nicht verifiziert sind
- CTA zum Öffnen/Erweitern der Reisevorbereitung

Im Detail:

- Einreise / Visa
- Reisedokumente
- Versicherung
- Tickets / Buchungsbestätigungen
- Sonstige Vorbereitung

Jeder Status muss seine Wahrheit verständlich zeigen:

- „Von dir erledigt“
- „Offen“
- „Erneut prüfen“
- „Noch nicht offiziell geprüft“
- „Nicht verfügbar“

Keine grüne Erfolgssprache, die User-Evidence mit offizieller Evidence verwechselt.

### Sensitive UX

Kein Upload-Button für Pässe oder Dokumente in Foundation C.

Keine Felder für Passnummer, Geburtsdatum, Nationalität oder Gesundheitsdaten.

Bei Custom-Tasks sichtbar: keine sensiblen Daten eintragen.

### Mobile

- mobile-first
- keine horizontale Seitenverschiebung
- keine Tab-Stack-Regression
- bestehende fünf Bereichsnavigation unverändert stabil
- Readiness-Karten nicht zu breit / keine abgeschnittenen Statuslabels
- 280/320/360/390/430 px sinnvoll nutzbar
- Landscape prüfen

---

## 13. Reiseänderungen / Context Truth

Readiness muss auf den gemeinsamen Reisegraphen reagieren.

Beispiele:

### Ziel geändert

Berlin → Bangkok wird zu Berlin → Tokyo.

Ein alter Bangkok-Einreisecheck darf nicht als Tokyo-Check weiterleben.

### Datum geändert

Reisezeitraum verschiebt sich deutlich.

Ein zeit-/regelabhängiger Check muss als `stale / erneut prüfen` gelten, wenn sein Context Fingerprint nicht mehr passt.

### Buchung geändert

Ein gebuchter Flug wird entfernt oder wieder `unconfirmed`.

Ein „Buchungsbestätigung geprüft“-Check für diesen alten Flug darf nicht weiter als aktuelle Abdeckung zählen.

### Mehrere Länder

Jedes tatsächlich bekannte Zielland separat; keine „Hauptziel reicht“-Logik.

### Unbekannter Country Code

Kein Country-spezifischer Requirement-Fakt erfinden. UI darf sagen, dass der Länderkontext nicht vollständig bestimmbar ist.

---

## 14. Migration

Wenn eine neue Tabelle / neue DB-Felder nötig sind:

1. neue versionierte Migration im Repo
2. **nur Development anwenden**
3. danach verifizieren:
   - Migration History
   - Tabellen/Spalten
   - CHECKs
   - FKs
   - Indizes
   - RLS enabled
   - Policies
   - Guest→Account / RPC-Funktionen
   - Security Invoker / search_path bei geänderten Funktionen
   - bestehende Daten unverändert gültig
   - `db:typen -- --pruefen`
   - `db:rechte`
   - `db:rls`
   - `db:sicherheit`
4. Production unverändert lassen

Nie eine Production-Funktion mit einer älteren Repository-Definition überschreiben.

Keine Production-Migration ohne separate ausdrückliche Freigabe des Nutzers.

---

## 15. Tests – Logic Standard ist Pflicht

Mindestens Unit-/Integration-/DB-/UI-Tests für:

### Truth Layer

- User `done` + official unknown → official bleibt unknown
- User `skipped` → nicht als offiziell not_required ausgeben
- kein Provider → keine Visa-/Passbehauptung
- fehlende Traveller-Identität → keine individuelle Einreisebehauptung
- mehrere Reisende → niemals „für alle geprüft“ ohne individuelle Evidence

### Context

- Ziel-Land geändert → alter Check stale/irrelevant
- Datum geändert → relevanter Context Check stale
- gleiches Land mehrfach → keine falschen Duplikate
- fehlender Country Code → unknown, kein Guess
- gebuchter Trip Item ersetzt/gelöscht → alter Confirmation Check nicht aktuell
- booked → Confirmation nicht automatisch done
- unconfirmed → kein booked-confirmation Fakt

### Persistenz

- Guest create/update/delete readiness
- Account create/update/delete readiness
- Reload
- Guest→Account idempotent
- Retry/Doppelklick keine Duplikate
- Cross-user Zugriff blockiert
- Cross-trip Referenz blockiert
- ungültige Enum-/Text-/ID-Eingaben blockiert

### Security / privacy

- API body cap
- keine Provider-Evidence vom Browser vortäuschbar
- keine sensiblen Dokumentfelder in Payload/Schema
- Custom Title Längenlimit
- keine arbitrary URLs / HTML
- RLS/ownership

### Gesamtstatus

- 0 Items
- nur User Items done
- User Items done + official unknown
- offene Items
- stale Items
- mehrere Länder
- mehrere Reisende
- Provider unavailable

Jeder gefundene Logic-Bug bekommt möglichst einen Regressionstest.

---

## 16. Browser-/Real-Device-Audit

Automatisierter Browser-Audit mindestens WebKit + Chromium bei:

- 280x…
- 320x…
- 360x…
- 390x…
- 430x…
- 768x…
- 844x390 Landscape
- 1280 Desktop

Prüfzustände:

- keine Readiness Items
- mehrere offene Items
- alle User-Items erledigt aber official unknown
- stale / erneut prüfen
- lange Destination-Namen
- mehrere Länder
- mehrere Reisende
- long custom preparation title

Bestehende Workspace-Tab-Sequenzen weiter testen:

`Übersicht → Flüge → Unterkunft → Aktivitäten → Mobilität → Übersicht`

plus gemischte Reihenfolge.

Computed layout / inert / hidden prüfen, nicht nur DOM-Attribute.

Activities-Regression weiterlaufen lassen.

Vor Ready später echter iPhone-Test durch Nutzer.

---

## 17. Accessibility / Product Quality

- klare Überschriftenhierarchie
- Status nicht nur über Farbe
- Buttons min. Touch-Ziele
- sichtbare Focus States
- Screenreader-Texte sinnvoll
- Fehlerzustände verständlich
- Loading-/Empty-/Unavailable-Zustände
- kein Layout Shift durch Statuswechsel
- keine unnötige Fachsprache im UI
- keine irreführende Sicherheitssprache

---

## 18. Dokumentation / ADR

Neu mindestens:

- `docs/TRAVEL_READINESS.md`

ADR(s) in `DECISIONS.md` für:

1. Readiness als eigene Domäne/Tabelle statt `trip_items`
2. Trennung Official Requirement Truth vs User Preparation Truth
3. Context Fingerprint / Stale-Semantik
4. bewusster Ausschluss des sensiblen Dokumententresors
5. UX zunächst in Übersicht statt sechster Haupt-Tab

Aktualisieren:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DESIGN_SYSTEM.md` falls nötig
- `docs/REISEN.md`
- `docs/DATENBANK.md`
- `docs/PRODUCTION_ROLLOUT.md`
- `AGENTS.md` nur falls neue dauerhafte Agent-Regel nötig

Dokumentiere klar:

- PR #31 ist gemergt
- Foundation B ist auf main + Production-Schema
- Mietwagensuche bleibt aus
- Foundation C Status
- Development vs Production
- kein Vault
- kein echter Requirement Provider
- welche Truth-Semantik gilt

---

## 19. CI / Definition of Done

Vor Abschluss des Cursor-Auftrags müssen grün sein:

- `npm test`
- Typecheck
- Lint
- Hygiene (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`)
- Production Build
- Auth-Konfig-Check
- DB-/RLS-/Security-Checks wenn Schema geändert
- WebKit-Audit
- Chromium-Audit
- Activities Regression
- GitHub CI auf aktuellem Head
- Vercel Preview `READY`

Keine bekannten Logic-/Truth-Blocker offen lassen.

PR bleibt Draft.

---

## 20. Kosten / externe Dienste

- keine neuen laufenden Kosten
- keinen kostenpflichtigen Provider buchen
- keine neue Storage-Nutzung für Dokumente
- keine neue externe Identity-/Visa-API ohne vorherige Produktentscheidung
- keine Production-Aktivierung

Wenn eine externe Lösung später Geld kosten würde, nur dokumentieren – nicht bestellen.

---

## 21. Out of Scope

Nicht in Foundation C:

- echter Pass-/Dokumententresor
- Upload echter Identitätsdokumente
- OCR
- Dokumentverschlüsselungsprodukt
- Health-/Impfdaten
- individuelle Traveller-Profile mit Nationalität/Geburtsdatum
- echter Visa-/Einreiseprovider
- Web Scraping offizieller Behörden
- Production Requirement Search
- Kreuzfahrten
- Hotelprovider Phase 3.4
- Mietwagenprovider
- große neue globale Navigation
- Foundation D Gesamt-Abdeckung vollständig vorwegnehmen
- breite Design-Neugestaltung außerhalb Readiness

---

## 22. Abschlussbericht

Am Ende einen klaren Bericht liefern:

1. Architekturentscheidung / ADR
2. Datenmodell
3. Official Truth vs User Truth
4. Context-Fingerprint / stale Logik
5. Guest-/Account-Persistenz
6. RLS / Security / Privacy
7. UI / mobile
8. Provider-Naht und warum fail closed
9. Development-Migration ja/nein
10. Production unverändert bestätigt
11. Tests / genaue Zahlen
12. Browser-Audits / genaue Zahlen
13. CI / Preview / exakter Head
14. Kosten
15. offene Risiken / bewusste Grenzen
16. nächster Schritt

**Nicht mergen. Nicht Mark Ready. Keine Production-Migration.**