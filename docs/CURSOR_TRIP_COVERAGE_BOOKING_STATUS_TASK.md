# Cursor-Auftrag – Trip Coverage & Booking Status

Stand: 21. August 2026

## Status

Umgesetzt auf Branch `feat/trip-coverage-booking-status`, Draft-PR #29.

Parent auf `main`: Merge-Commit `70e471b00c7505356fe13f8185b204200c4bb781` (PR #27, Trip Workspace Mobile UX Iteration 1–3).

**PR bleibt Draft. Nicht mergen. Nichts in Production aktivieren oder migrieren.**

---

## 0. Verbindlich zuerst lesen

Bevor Code geändert wird, aktuellen Repository-Stand und mindestens diese Quellen lesen:

- `AGENTS.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/REISEN.md`
- `docs/FLUEGE.md`
- `docs/HOTELS.md`
- `types/trips.ts`
- `lib/trips/**`
- `lib/flights/**`
- `lib/hotels/**`
- relevante Reise-/Trip-Migrationen unter `supabase/migrations/`

Vor Implementierung bestehende Persistenz-, Revision-, RLS-, Auth-, Commercial-Protection- und Guest/Account-Wege nachvollziehen. Nicht aus diesem Auftrag allein auf bestehende Implementierungsdetails schließen.

---

## 1. Produktziel

Jetnity soll im zentralen Reise-Dashboard und in den Bereichen **Flüge** und **Unterkunft** sofort ehrlich zeigen:

1. was für diese Reise bereits ausgewählt/geplant ist,
2. was der Nutzer ausdrücklich als **gebucht** bestätigt hat,
3. was noch fehlt,
4. bei Unterkünften: welche Nächte des Reise-/Etappenzeitraums bereits abgedeckt sind und welche Nächte noch offen sind.

Die Oberfläche soll dadurch wie ein zusammenhängendes Reise-Dashboard wirken – nicht wie voneinander unabhängige Suchmaschinen.

### Zielbild Flüge

Oben im Flugbereich zuerst der bestehende Reisebestand/Status, erst darunter Suche.

Beispielhafte Semantik, keine Fake-Daten:

- `Zürich → Bali · 30. Aug.` – **Gebucht**
- `Bali → Zürich · 13. Sept.` – **Noch offen**

Bei mehreren Etappen entsprechend mehrere relevante Flugabschnitte, soweit sie aus dem echten Reisegraphen deterministisch ableitbar sind.

### Zielbild Unterkunft

Oben im Unterkunftsbereich zuerst Abdeckung/Bestand, erst darunter Gegend-/Hotelsuche.

Beispielhafte Semantik:

- **10 von 14 Nächten abgedeckt**
- `30. Aug. – 05. Sept. · Bali` – ausgewählt/gebucht
- `09. – 13. Sept. · 4 Nächte fehlen` – offen

Fehlende Zeiträume sollen verständlich sichtbar sein. Überlappende Stay-Einträge dürfen Nächte nicht doppelt zählen.

### Dashboard-Rückspiegelung

Die Übersicht `/reisen/[tripId]` soll kompakte, ehrliche Statuszeilen erhalten, z. B.:

- `Flüge – Hinflug gebucht · Rückflug offen`
- `Unterkunft – 10/14 Nächte abgedeckt`

Nur anzeigen, was aus echten Daten sicher ableitbar ist. Bei unvollständigen Daten lieber `noch nicht vollständig bestimmbar` als eine erfundene Vollständigkeit.

---

## 2. Fachliche Grundregeln

### 2.1 „Gebucht“ ist ein starker Status

Ein vorhandener `trip_item` bedeutet **nicht automatisch gebucht**.

Jetnity darf `Gebucht` nur anzeigen, wenn:

- der Nutzer den betreffenden kommerziellen Planpunkt ausdrücklich als gebucht bestätigt hat, oder
- später ein serverseitig vertrauenswürdiger Provider dies bestätigt.

In dieser Phase gibt es **keine echte Provider-Buchungsbestätigung**. Falls ein Quellenfeld eingeführt wird, darf der Browser niemals selbst `provider`/`verified` behaupten.

### 2.2 Offen ist normalerweise kein gespeicherter Buchungsdatensatz

`Offen` soll primär aus einer **fehlenden Abdeckung** abgeleitet werden:

- erforderlicher Flugabschnitt ohne passenden gespeicherten Flug,
- Reise-/Etappennacht ohne passenden Stay.

Nicht für jede Lücke künstlich einen DB-Datensatz erzeugen.

### 2.3 Ausgewählt/geplant vs. gebucht

Ein kommerzieller Planpunkt, der im Reisegraphen gespeichert ist, kann als ausgewählt/geplant gelten. `Gebucht` ist eine zusätzliche explizite Bestätigung.

Die endgültige Benennung der internen Zustände muss zum bestehenden Modell passen. Keine parallele zweite Wahrheit schaffen.

### 2.4 Provider-neutral

Kein Booking.com-, Duffel-, HBX- oder sonstiger Provider darf in das fachliche Kernmodell eingebrannt werden.

Provider-Anbindung bleibt eine spätere Quelle für denselben neutralen Buchungsstatus.

---

## 3. Datenmodell – erst prüfen, dann minimal erweitern

Aktuell besitzt `TripItem` u. a. `provider`, `externalRef` und `bookingUrl`, aber keinen expliziten Buchungsstatus.

Prüfe das reale Schema und die bestehenden Mutationswege. Wenn ein persistenter strukturierter Buchungsstatus erforderlich ist, gilt:

- **keine `metadata`-Abkürzung** für einen Zustand, nach dem UI/Fachlogik fragt; bestehende Schema-Regel beachten: Was abgefragt wird, bekommt eine strukturierte Spalte.
- minimale, provider-neutrale Erweiterung von `trip_items` bevorzugen.
- CHECK-Constraints im Stil des bestehenden Schemas statt unnötigem PostgreSQL Enum.
- Guest- und Account-`Trip` müssen weiterhin dieselbe fachliche Form haben.
- Mapper, Supabase-Typen, Guest Store, Account Store, Transfer Gast→Konto und Tests vollständig mitziehen.
- bestehende Daten müssen einen sicheren Default/Backfill erhalten, der **niemals historische Einträge automatisch als gebucht markiert**.

Wenn du zusätzliche Felder wie Statusquelle oder Bestätigungszeitpunkt für eine spätere verifizierte Provider-Quelle brauchst, halte sie minimal und begründe sie in ADR/Doku. Client darf keine vertrauenswürdige Provider-Quelle vortäuschen.

### Production-Grenze

Eine notwendige Migration darf als Datei im Repository entstehen und in einer sicheren lokalen/Test-/Preview-Umgebung geprüft werden, **aber nicht auf Production angewendet werden**.

Keine neuen bezahlten Ressourcen anlegen. Bestehende Test-/Preview-Infrastruktur nur nutzen, wenn sie bereits vorhanden und dafür vorgesehen ist.

---

## 4. Unterkunfts-Abdeckung – deterministisch und korrekt

Baue eine reine, gut getestete Domain-Funktion für die Nachtabdeckung.

### 4.1 Zeitraum

- Reise-/Etappenzeitraum aus dem echten Reisegraphen verwenden.
- Check-in/Check-out als halboffenes Intervall behandeln: `[checkIn, checkOut)`.
- Eine Unterkunft vom 30. Aug. bis 5. Sept. deckt die Nächte 30→31, 31→1, …, 4→5 ab; Check-out-Nacht nicht zusätzlich zählen.
- Mehrere Etappen getrennt korrekt behandeln, wenn der Graph die Zuordnung hergibt.

### 4.2 Stay-Daten

Für `kind='stay'` vorhandene strukturierte Datumsfelder (`startsOn`/`endsOn` bzw. reale kanonische Quelle nach Repo-Inspektion) nutzen.

- fehlende/ungültige Daten nicht erfinden,
- überlappende Stays unionieren, nicht doppelt zählen,
- offene Lücken als konkrete Datumsintervalle liefern,
- Abdeckung sowohl `selected/planned` als auch `booked` unterscheiden können, wenn für die UI sinnvoll,
- vollständig unbekannte Abdeckung als unbekannt markieren statt `0/14` zu behaupten.

### 4.3 Tests

Mindestens:

- 1 Nacht,
- vollständige Abdeckung,
- Anfangslücke,
- Endlücke,
- Lücke in der Mitte,
- mehrere angrenzende Stays,
- überlappende Stays,
- Stay außerhalb Reisezeitraum,
- fehlende Daten,
- Multi-Stage,
- Leap-/Monatswechsel soweit Datumshelfer betroffen,
- kein Off-by-one am Check-out.

---

## 5. Flug-Abdeckung – ehrlich und nicht überintelligent

Definiere eine reine Domain-Auswertung für den Flugstatus einer Reise.

Ziel: relevante benötigte Reiseabschnitte nur dann als offen/ausgewählt/gebucht benennen, wenn sie aus Origin, Etappen und Daten fachlich sicher bestimmbar sind.

- keinen Flug erfinden,
- keine Route aus Ortsnamen raten, wenn die Zuordnung nicht kanonisch genug ist,
- gespeicherte `flight`-Items anhand vorhandener strukturierter Felder/Stage-Zuordnung auswerten,
- bei Multi-Stage sauber mit vorhandenen Graphdaten umgehen,
- wenn ein Abschnitt nicht sicher matchbar ist, Status `unbestimmt`/vergleichbare ehrliche Semantik statt falscher Zuordnung.

Die erste Version muss nicht globale Transportlogik lösen. Sie soll für die heute unterstützten Reisegraphen deterministisch und testbar sein.

---

## 6. Explizite Buchungsaktion

Der Nutzer braucht für vorhandene kommerzielle Flug-/Stay-Planpunkte eine klare Aktion, z. B.:

- `Als gebucht markieren`
- bei bereits gebuchtem, manuell bestätigtem Element eine verständliche Möglichkeit, den Status wieder zu korrigieren.

### Sicherheits-/Persistenzregeln

- bestehende Auth/RLS-Grenzen verwenden,
- kein Service-Role-Weg,
- fremde `trip_id`/`item_id` niemals blind vertrauen,
- Account-Item muss serverseitig zum authentifizierten Nutzer und zur Reise gehören,
- bestehende Revision-/Idempotenz-Mechanismen nicht umgehen,
- Guest-Store erhält analoge fachliche Semantik lokal,
- Buchungsstatus gehört zu den kommerziellen Fakten und darf durch natürliche Sprache/Modelländerungen **nicht still verändert, gelöscht oder erfunden** werden.

Wenn die bestehende Commercial-Protection erweitert werden muss, mit Tests nachweisen.

---

## 7. UI/UX

### 7.1 Flüge

Im Bereich `Flüge`:

1. kompakter Block `Deine Flüge` / Reisebestand,
2. vorhandene Flug-Items mit verständlichem Status,
3. erkennbare offene Abschnitte, soweit sicher ableitbar,
4. erst danach bestehende Flugsuche.

Die bestehende Production-Flugsuche bleibt aus. Kein Fake-Ergebnis.

### 7.2 Unterkunft

Im Bereich `Unterkunft`:

1. kompakter Block `Deine Unterkunft` / `Nächte-Abdeckung`,
2. z. B. `10 von 14 Nächten abgedeckt`,
3. gespeicherte Stay-Zeiträume + Status,
4. offene Datumsbereiche,
5. erst danach bestehende Gegend-/Hotelsuche.

Die bestehende Production-Hotelsuche bleibt aus. Kein Fake-Hotel.

### 7.3 Übersicht

Die bereits gemergte Trip-Workspace-Informationsarchitektur aus PR #27 bleibt erhalten:

- `Übersicht`, `Flüge`, `Unterkunft`, `Aktivitäten`
- Übersicht enthält Tagesplan
- keine Rückkehr zu einer langen Kartenkette
- keine neue separate `Plan`-Navigation
- `Meine Reisen` vorerst unverändert

Statuskarten/-zeilen sollen auf einen Blick verständlich sein und auf den jeweiligen Bereich führen, ohne das Mobile-Dashboard zu überladen.

### 7.4 Responsive / Accessibility

- unter 1024 px die neue kompakte Workspace-IA respektieren,
- Desktop nicht unnötig redesignen,
- Touch-Ziele mindestens 44 px,
- sichtbarer Tastaturfokus,
- Status nicht nur über Farbe kommunizieren,
- Screenreader-Namen sinnvoll,
- horizontale Scrollbereiche dürfen Seite/Container nicht seitlich verschieben,
- Loading/Empty/Error/Unknown klar unterscheiden.

---

## 8. Was ausdrücklich NICHT Teil dieses Blocks ist

- echte Provider-Buchungsbestätigung
- Booking.com/HBX/Duffel Production-Aktivierung
- Affiliate-/Redirect-Neubau
- Payment oder Direktbuchung
- E-Mail-/PDF-Buchungsimport
- automatische Buchungserkennung aus fremden Quellen
- neue Activity-Funktionalität
- Collaboration-Feature/PR #28
- Redesign von Startseite, `Meine Reisen` oder Reise-Erstellung
- globale Transport-/Rail-/Bus-/Ferry-Abdeckung
- Production-Migration oder Production-Kill-Switch-Änderung

---

## 9. Architektur-/Qualitätsanforderungen

Verbindlich:

- UI, Domain, Persistenz und Provider-Seams getrennt halten.
- Coverage-Berechnung als reine Domainlogik, nicht im React-Rendering verstecken.
- keine provisionsgetriebene Logik.
- keine Fake-Daten.
- unbekannt bleibt unbekannt.
- keine neue Dependency ohne zwingenden Grund.
- keine Secrets loggen oder committen.
- keine neue laufende Kostenposition.
- bestehende Flight-/Hotel-/Activity-Security und Trust Boundaries dürfen nicht geschwächt werden.
- `npm test`, Typecheck, Lint, Hygiene/Repo-Checks und Production Build müssen grün sein.
- bei relevanten UI-Änderungen bestehende WebKit-/Chromium-Audits erweitern; echte Mobile-Zustände wie leer/teilweise/vollständig/gebucht/unbestimmt prüfen.

---

## 10. Dokumentation – Definition of Done

Gemäß `docs/CONTINUITY_STANDARD.md` sind mindestens aktuell zu halten, soweit betroffen:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` mit ADR, falls eine dauerhafte Daten-/Statusentscheidung entsteht
- `DESIGN_SYSTEM.md`, falls neue verbindliche UI-Regel entsteht
- `docs/REISEN.md`
- `docs/FLUEGE.md`
- `docs/HOTELS.md`
- ggf. `docs/PRODUCTION_ROLLOUT.md`

Dokumentation darf nur tatsächliche Tests/Preview/Migrationsstände behaupten.

---

## 11. Abschlussbericht von Cursor

Am Ende exakt berichten:

1. **Umgesetzt** – fachliche Status-/Coverage-Logik und UI.
2. **Datenmodell** – neue/keine Spalten, Default/Backfill, Mapper/Stores.
3. **Migration / RLS** – was erstellt und wo tatsächlich angewendet/verifiziert wurde; Production ausdrücklich separat nennen.
4. **Security** – Auth/RLS/Ownership, Client-Trust, Commercial-Protection.
5. **Tests / CI / Build / Browser-Audit** – echte Zahlen und Resultate.
6. **Provider / Production** – weiterhin aus/an; keine unbestätigte Aktivierung behaupten.
7. **Kosten** – neue laufende Kosten oder `keine`.
8. **Dokumentation** – aktualisierte Dateien/ADRs.
9. **Offene Risiken** – insbesondere unvollständige Graphdaten oder noch nicht provider-verifizierte Buchungen.
10. **Nächster Schritt** – Preview/iPhone-Review oder notwendiger Folgeblock.

**PR bleibt Draft. Nicht mergen.**