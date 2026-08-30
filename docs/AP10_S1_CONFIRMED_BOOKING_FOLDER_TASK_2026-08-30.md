# Jetnity – AP-10-S1 Confirmed Booking Folder

Stand: 30. August 2026  
Status: **TECHNICAL-LEAD TASK / VERSIONED BEFORE CURSOR START**  
Parent Issue: #245  
Cursor-Agent: **`Account plattform audit vorbereitung 23`**  
Branch: `feat/ap10-s1-confirmed-booking-folder-2026-08-30`

---

## 1. Verifizierte Slice-Baseline

Dieser Task wurde nach frischem Binding Slice Precheck erstellt.

Verifizierte Live-Wahrheit beim Slice-Cut:

- Repository: `Jetnity/jetnity`
- `main`: `30c0493c38cd4bf3ceb904ef443126808c79add6`
- letzter Runtime-Baseline-Commit: `4549b0264b57052d1ab6737add9bbe7fd8801c3b`
- Diff Runtime-Baseline → aktuelles `main`: ausschließlich Continuity-Dokumentation; keine Runtime-Änderung
- GitHub Actions auf aktuellem `main`: SUCCESS
- Vercel Production auf aktuellem `main`: READY
- offene historischen Draft-PRs #52/#50/#40/#39/#28 werden nicht fortgesetzt
- letzter Cursor-Agent: `Account plattform audit vorbereitung 22`, Session `bc-f631838b-21f3-4290-aa1f-db450a037ac3`; abgeschlossen
- Agent 23 war vor diesem Slice nicht gestartet
- Supabase Production-P1 bleibt offen: Migration-History `20260829140000_trip_item_commercial_provenance` enthält nur einen Prosa-Marker, obwohl die S5-B-Objekte live existieren; Development besitzt diese S5-B-Wahrheit nicht
- dieses P1 wird **nicht** in AP-10-S1 repariert, umgangen oder verändert
- Branch Protection bleibt unverändert und ist nicht Scope dieses Tasks

Bindende Grundlagen:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
- `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`, Abschnitt AP-10
- `docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`
- `docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`
- bestehende Account-/Trip-/Booking-Implementierung auf `main`

---

## 2. Warum dieser Slice jetzt zulässig ist

Andere naheliegende Pfade sind aktuell blockiert oder brauchen ein besonderes Product-Owner-Gate:

- AP-6a: PrivacyBee/Domain-/Legal-Abhängigkeit
- AP-6b: Consent/Export/Delete + Persistenz-/Production-Gate
- AP-8: Identity-/Profilvertrag + Production-Gate
- AP-9: vorgelagerte Product-Owner-Nutzenfrage
- AP-11: Consent-/Notification-Persistenz
- AP-12: Entitlement/Payments-Gates
- TW-8 / Provider-live: Provider-S5-/Commercial-Provenance-Gates
- Strategic Opportunity Register: ausdrücklich keine automatische Baufreigabe

AP-10 ist dagegen laut Account-Plan read-only zulässig, solange keine neue Booking-/Commercial-Wahrheit erfunden und keine Persistenz hinzugefügt wird.

### Differentiation / Enabler Justification

AP-10-S1 ist kein Feature-Paritäts-Selbstzweck. Der Slice:

1. reduziert das Suchen über einzelne Reisen hinweg;
2. macht bereits vorhandene, owner-gesicherte Booking-Truth kontoweit nutzbar;
3. schafft einen kleinen, belastbaren Enabler für spätere Journey-Integrity-/Trip-Audit-/Next-Best-Action-Fähigkeiten;
4. erzeugt **keine** zweite Booking-Truth und keine kommerzielle Behauptung.

Leitfrage: **Macht das Jetnity einzigartiger oder nur größer?**  
Antwort für diesen Slice: Als isolierte Liste wäre der Wert begrenzt; als read-only Account-Enabler auf Jetnitys bestehender Trip-Truth reduziert sie Reibung und bereitet spätere zusammenhängende Reiseprüfung vor. Deshalb bleibt der Scope bewusst klein und truth-first.

---

## 3. Produktziel

Baue eine kontoweite, **read-only** Übersicht der Reisebestandteile, die durch den bestehenden Jetnity-Vertrag ausdrücklich als `booking_status = 'booked'` bestätigt wurden.

Der Nutzer soll von seinem Account aus beantworten können:

> **„Welche Reisebestandteile habe ich in Jetnity ausdrücklich als gebucht bestätigt, und zu welcher Reise gehören sie?“**

Dieser Slice ist **kein** Provider-Buchungsimport, kein Reservierungs-CRM und kein Payment-/Affiliate-System.

---

## 4. Verbindliche Produktwahrheit

### 4.1 Was `booked` bedeutet

Bestehende Wahrheit bleibt unverändert:

- `unconfirmed` = ausgewählt / geplant
- `booked` = durch ausdrückliche Nutzeraktion als gebucht bestätigt
- `booking_source = 'user'`
- Jetnity behauptet daraus **nicht**, dass ein Provider, eine Airline, ein Hotel, ein Zahlungsdienst oder ein Affiliate die Buchung bestätigt hat

Die UI muss dies sprachlich ehrlich halten.

### 4.2 Was in S1 angezeigt wird

S1 zeigt **nur `booked`**.

Nicht als gebucht bestätigte `unconfirmed`-Planpunkte werden in diesem Slice **nicht** in den Buchungsordner aufgenommen. Sie bleiben im jeweiligen Trip Workspace sichtbar.

Damit wird ein geplanter Punkt niemals versehentlich als Buchung ausgegeben.

### 4.3 Welche Item-Arten dazugehören

Verwende den **aktuellen implementierten Booking-Vertrag** als Autorität. Nur Arten, die nach dem aktuellen Runtime-Vertrag als gebucht markiert werden können, dürfen in diese Übersicht gelangen.

Aktuell relevant sind nach `lib/trips/buchung.ts`:

- `flight`
- `stay`
- `transfer`
- `rental_car`

`activity` und `note` gehören in AP-10-S1 nicht in die bestätigte Buchungsübersicht, solange der bestehende Booking-Vertrag sie nicht als buchbar zulässt.

Keine parallele Hardcode-Wahrheit einführen, wenn die bestehende Helper-/Domain-Authority sauber wiederverwendet werden kann.

---

## 5. UX / Informationsarchitektur

### 5.1 Route

Neue geschützte Account-Unterseite:

- `/account/bookings`

Sie läuft unter der bestehenden Account-Shell und deren Auth-Schutz.

### 5.2 Kein fünfter Account-Haupttab

**AP-UX-NAV1 bleibt unverändert.**

Die verbindliche Hauptnavigation bleibt exakt:

1. Übersicht
2. Reisen
3. Reisende
4. Einstellungen

`ACCOUNT_NAVIGATION` wird für diesen Slice **nicht** um „Buchungen“ erweitert.

### 5.3 Einstieg

Füge auf `/account` einen kleinen, klaren Einstieg zur Buchungsübersicht hinzu, ohne das Account-Zuhause mit Flug-/Hotelkarten oder einem zweiten Workspace zu überladen.

Ziel:

- kleiner Account-Utility-/Secondary-Link oder kompakter Abschnitt
- Text ungefähr im Sinn von „Buchungen ansehen“ / „Bestätigte Buchungen“
- keine detaillierten Booking-Karten auf `/account`
- bestehende nächste-Reise-Primäraktion bleibt primär

### 5.4 Buchungsübersicht

Pro bestätigtem Item dürfen nur bereits vorhandene, unkritische Fakten dargestellt werden, z. B.:

- Item-Titel
- verständliche Art (Flug / Unterkunft / Verbindung / Mietwagen)
- zugehöriger Trip-Titel
- vorhandenes Datum / vorhandene Uhrzeit, wenn tatsächlich gespeichert
- bestehender Trip-Status, insbesondere `archived`
- interne Aktion „Reise öffnen“ → `/reisen/<trip-id>`

Keine erfundenen Werte bei fehlenden Daten.

### 5.5 Archivierte Reisen

Bestätigte Buchungen aus archivierten Reisen werden **nicht still ausgeblendet**.

Sie bleiben auffindbar und müssen als zu einer archivierten Reise gehörend erkennbar sein. Archiviert bedeutet nicht „Daten löschen“ und nicht „Buchung ungültig“.

Sortierung/Grouping darf aktive/nicht archivierte Reisen priorisieren, muss aber deterministisch, verständlich und getestet sein.

### 5.6 Empty / Error / Unavailable

Diese Zustände müssen getrennt bleiben:

- erfolgreich gelesen, aber keine bestätigten Buchungen → ehrlicher Empty State
- Datenbank-/Lesefehler → Fehlerzustand, **nicht** „keine Buchungen“
- fehlende optionale Einzelinformationen → entsprechende Information auslassen/neutral kennzeichnen, nicht erfinden

Ein Konto ohne Reisen oder ohne `booked`-Items ist ein normaler Empty State.

---

## 6. Daten- und Security-Vertrag

### 6.1 Read-only

AP-10-S1 erzeugt keinerlei Write-Pfad.

Verboten:

- INSERT / UPDATE / DELETE
- Server Action für Buchungen
- neue RPC
- neue Tabelle/View/Function/Trigger
- Mutation des Booking-Status aus der Account-Seite

### 6.2 RLS / Ownership

Verwende ausschließlich den bestehenden serverseitigen Supabase-Client im normalen eingeloggten `authenticated`-Kontext und die bestehenden RLS-/Ownership-Regeln.

Verboten:

- Service Role
- Admin-Client
- RLS-Bypass
- Client-vertraute `user_id`-Autorisierung
- neue RLS-Policy

Wenn ein eigener Lesepfad entsteht, soll er wie `lib/trips/daten.ts` server-only sein und **Empty ≠ Error** respektieren.

### 6.3 Effiziente Aggregation

Kein unnötiges N+1 über alle Reisen.

Inventarisiere vor Implementierung:

- bestehende `trip_items`-RLS
- aktuell verfügbare Relationen zu `trips`
- bestehende Lesemodule / Mapping-Helper

Wähle den kleinsten serverseitigen owner-scoped Read-Pfad, der die benötigten Spalten liefert.

Wenn du einen technischen Limit-/Pagination-Schutz brauchst, darf er keine Daten still verschwinden lassen. Eine harte Abschneidung ohne sichtbare/honest Semantik ist nicht akzeptabel.

### 6.4 Keine Traveller-PII

Nicht lesen oder anzeigen:

- Citizenship
- Dokumente / Aussteller / Ablaufdaten
- Traveller Registry
- Pass-/Ausweisdaten
- Readiness-sensitive Details

### 6.5 Keine Admin-/Payment-Daten

Nicht lesen oder anzeigen:

- Admin `payments`
- Stripe-/Payment-Objekte
- Finanz-/Buchhaltungsdaten

---

## 7. Commercial-Truth-Grenze

Der offene Supabase-P1 und S5-B bleiben außerhalb dieses Slices.

AP-10-S1 darf insbesondere **nicht**:

- S5-B-Provenance reparieren oder voraussetzen
- Provider-Live aktivieren
- aus `provider`, `external_ref`, `booking_url` eine Provider-Bestätigung ableiten
- Preisverfügbarkeit behaupten
- eine Conversion behaupten
- Affiliate-Attribution behaupten
- Jetnity als Seller/Booking-Agent darstellen

### Verbindliche S1-Entscheidung zu Preisen

**AP-10-S1 zeigt keine Preise/Beträge an.**

Grund: Die kontoweite Buchungsübersicht soll zuerst die bereits bestätigte Booking-Status-Truth aggregieren. Commercial Provenance und belegte aktuelle Beträge bleiben ein getrenntes System. Damit entsteht keine unehrliche Preiswahrheit aus historischen oder user-seitigen Planungsfeldern.

Ebenso in diesem Slice nicht anzeigen:

- Provider als „bestätigender Anbieter“
- Affiliate-Links
- externe Booking-URLs

---

## 8. Accessibility / Mobile / Design

- mobile-first
- vorhandene Jetnity-V2-Tokens und Account-Shell verwenden
- keine horizontale Seitenüberbreite
- Links/Controls mit ausreichender Touch-Fläche
- semantische Überschriftenstruktur
- Fehlerzustand mit geeigneter `role="alert"`-Semantik
- Status nicht nur über Farbe vermitteln
- Account-Navigation aus AP-UX-NAV1 nicht regressieren
- keine neue Sticky-/Swipe-/Navigation-Mechanik

---

## 9. Hard Non-Scope

Nicht anfassen / nicht nebenbei bauen:

- DB-Migrationen
- RLS-/Ownership-/Identity-Architektur
- Supabase Production oder Development Migration History
- S5-B Repair
- Provider S5 / Provider-Live / Secrets / Paid Calls
- TW-8 / TW-9
- Payments / Stripe / Entitlements
- Affiliate Tracking
- AP-6 / AP-7 / AP-8 / AP-9 / AP-11 / AP-12
- PrivacyBee / Legal Text
- Auth/MFA/AAL/Session-Grundarchitektur
- Traveller-/Multi-Citizenship-/Document-Funktionen
- Collaboration
- Homepage / Planner
- Native App
- Branch Protection
- Strategic Opportunity Register Runtime-Funktionen
- globale TL-Continuity-Dateien (`JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`) – diese integriert nur der Technical Lead

Wenn du feststellst, dass eine ehrliche AP-10-S1-Umsetzung eine dieser Grenzen erfordern würde: **STOP und dokumentiere den Gate. Scope nicht erweitern.**

---

## 10. Acceptance Criteria

Der Slice ist erst agentenseitig fertig, wenn mindestens Folgendes erfüllt ist:

1. `/account/bookings` existiert und bleibt durch bestehende Account-Auth geschützt.
2. Seite liest ausschließlich bestehende owner-scoped Trip-/Trip-Item-Daten über normalen RLS-Pfad.
3. Kein Service Role / Admin Client / neuer Write-Pfad.
4. Nur ausdrücklich `booked` bestätigte, nach aktuellem Booking-Vertrag buchbare Items erscheinen.
5. `unconfirmed` wird nicht als Buchung dargestellt.
6. Archivierte Reisen werden nicht still ausgeblendet und sind klar erkennbar.
7. Keine Preise, Provider-Bestätigung, Affiliate-/Conversion-Claims oder externen Booking-Links.
8. Item → zugehöriger Trip ist eindeutig und intern öffnbar.
9. Empty und Error sind getrennt.
10. `/account` besitzt nur einen kleinen Einstieg; keine Booking-Dashboard-Duplizierung.
11. AP-UX-NAV1 Hauptnavigation bleibt exakt vier Punkte und regressionsfrei.
12. Keine Traveller-/Citizenship-/Document-PII.
13. Kein unnötiges N+1; Aggregationspfad ist im Self-Review begründet.
14. Mobile 280/360/390 und Desktop ohne horizontalen Overflow oder unzugängliche Controls.
15. Bestehende Account-, Trip- und Booking-Tests bleiben grün.

---

## 11. Pflicht-Tests / Gates

Vor dem finalen Push:

### Fokussiert

Ergänze/verwende Tests für mindestens:

- Mapping/Filter: nur `booked`
- nicht buchbare Arten ausgeschlossen
- archivierter Trip bleibt enthalten/gekennzeichnet
- Empty ≠ Error
- fehlende optionale Daten erzeugen keine erfundene Copy
- Account-Navigation unverändert
- interner Trip-Link korrekt

### Vollständig

Führe mindestens aus:

- `npm test`
- `npx tsc -p tsconfig.json --noEmit`
- `npm run lint`
- vorhandene Repo-Hygiene-/Dead-Code-/Exports-/Deps-/API-Schutz-/Schema-Bezug-Gates, soweit im Repo definiert
- `npm run build`

Wenn ein Gate wegen Umgebung/Tooling nicht ausführbar ist, dokumentiere exakt warum. Nicht als PASS ausgeben.

### Browser Evidence

Auf Vercel Preview oder lokalem Produktionsnahen Build mindestens:

- 280 px
- 360 px
- 390 px
- Desktop

Prüfen:

- Seite lädt
- kein horizontaler Seitenoverflow
- Empty/Error-Layouts robust
- Hauptnavigation bleibt bedienbar
- interne Reise-Aktion funktioniert
- keine Price-/Provider-/Affiliate-Copy

Wenn kein authentifiziertes Testkonto verfügbar ist, darfst du das nicht simuliert als verifiziert ausgeben; dokumentiere die Grenze klar.

---

## 12. Deliverables

Erwartete Runtime-/Test-Dateien nur soweit notwendig.

Zusätzlich zwingend diese slice-lokalen Dokumente:

1. `docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_STATUS_2026-08-30.md`
2. `docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_SELF_REVIEW_2026-08-30.md`
3. `docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_HANDOFF_2026-08-30.md`

Diese müssen enthalten:

- exact baseline
- exact final head
- vollständige Changed-File-Liste
- Ahead/Behind gegen aktuellen `main`
- Tests/Gates mit Ergebnissen
- Browser-/Preview-Evidence
- Security/RLS/Privacy/Commercial-Truth-Review
- bekannte Restgrenzen
- ausdrückliche Aussage: kein Ready, kein Merge, kein Folgeslice

Keine globalen Current-State-/Continuity-Dateien ändern.

---

## 13. Cursor-Governance / STOP

Cursor-Agent **`Account plattform audit vorbereitung 23`** implementiert ausschließlich diesen Task.

Cursor darf:

- Branch-Dateien im Scope ändern
- Tests schreiben/ausführen
- slice-lokale Evidence-Dokumente aktualisieren
- zum bestehenden Draft-PR pushen

Cursor darf **nicht**:

- PR Ready setzen
- mergen
- Product-Owner-Gates überschreiten
- Supabase Production/Development mutieren
- neue Kosten auslösen
- Branch Protection ändern
- globalen TL-Continuity-State schreiben
- AP-10-S2 oder einen anderen Folgeslice starten

### Finaler STOP

Nach finalem Push und agenteneigenem Self-Review:

> **STOP für unabhängigen ChatGPT Technical-Lead Exact-Head-Review.**

Agenten-Self-Review ist niemals Technical-Lead-PASS. Jeder neue Head invalidiert frühere Exact-Head-Gates.
