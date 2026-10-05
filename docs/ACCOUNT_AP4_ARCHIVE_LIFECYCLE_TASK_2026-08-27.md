# Jetnity – AP-4 Account Archive Lifecycle

Stand: 27. August 2026  
Status: **TECHNICAL-LEAD TASK / RUNTIME-SLICE FREIGEGEBEN / KEIN MERGE DURCH AUTOR-AGENT**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 3`**  
Live-Startbaseline bei Auftrag: `b7eacedae23feb006f85f52445f483c8016dde6b` (Merge PR #107)

## 1. Anlass und Rotation

Der Audit-/Reconciliation-Slice aus PR #107 / Issue #105 ist abgeschlossen und auf `main` integriert. Er empfiehlt **AP-4 als nächsten Account-Runtime-Kandidaten**. Das ist eine neue logische Arbeitseinheit; gemäß `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md` wird deshalb ein frischer nummerierter Agent verwendet.

Historische Agenten bleiben Evidence:

- `Account plattform audit vorbereitung` = Generation 1 / historische Evidence
- `Account plattform audit vorbereitung 2` = Generation 2 / PR #107 / abgeschlossen
- **neu aktiv für AP-4: `Account plattform audit vorbereitung 3`**

Live-Evidence gewinnt. Der Autor-Agent muss vor jedem Write `origin/main`, relevante PRs und die betroffenen Dateien erneut prüfen und darf diese Start-SHA nicht als bewegliche Live-Wahrheit behandeln.

## 2. Ziel

AP-4 schließt genau den Account-Lifecycle-Gap rund um `trips.status = 'archived'`:

- angemeldete Nutzer können eine eigene Konto-Reise ausdrücklich **archivieren**;
- archivierte Reisen verschwinden aus den normalen AP-3-Gruppen Aktiv / Kommend / Vergangen / Ohne Datum;
- archivierte Reisen bleiben unter `/reisen` in einem klar getrennten **Archiv** erreichbar;
- neu durch AP-4 archivierte Reisen können **wiederhergestellt** werden, ohne ihren früheren Status zu erfinden;
- `/account` behandelt archivierte Reisen weiterhin nicht als „Fortsetzen“;
- Gast-Reisen erhalten keinen Archiv-Lifecycle.

Keine Löschung. Archivieren ist eine reversible Lifecycle-Aktion, kein Delete-Ersatz.

## 3. Verbindliche Current Truth

- `TripStatus = 'draft' | 'planned' | 'booked' | 'archived'` ist bereits Schema- und App-Vertrag.
- `reisenLaden()` liest `status`, filtert aber aktuell nicht.
- AP-3 gruppiert aktuell auch `archived` rein nach Datum; genau das wird durch AP-4 korrigiert.
- `/account` filtert `archived` bereits lesend aus „Fortsetzen“.
- Es gibt auf `main` noch keinen Runtime-Write `status = 'archived'`.
- `Reisekarte` / `TripSummary.stages` / `reiseOrte()` aus TW7-A sind integriert und dürfen nicht zurückgebaut oder neu definiert werden.
- Owner-RLS auf `trips` bleibt die Autorisierung. Kein Service Role. Kein `user_id` aus Client-Nutzlast.
- Production-AAL2 ist bereits angewendet; AP-4 ändert Auth/AAL/MFA nicht.

## 4. Archiv-/Restore-Provenienz – fail-closed

Eine naive Wiederherstellung auf pauschal `planned`, `draft` oder `booked` ist verboten, weil dadurch der frühere Status erfunden bzw. verloren würde.

AP-4 nutzt **keine Migration**. Die bestehende `trips.metadata` ist ausdrücklich für Begleitinformation vorgesehen, nach der nicht gefiltert/sortiert wird.

### 4.1 Beim Archivieren

Nur wenn der aktuelle Status exakt `draft`, `planned` oder `booked` ist:

- `status` → `archived`
- bisherigen Status als namespaced Begleitinformation erhalten, z. B. unter `metadata.account_archive.previous_status`
- alle bestehenden fremden `metadata`-Keys unverändert erhalten
- keine zweite Lifecycle-Wahrheit außerhalb dieser Restore-Provenienz erzeugen
- Status-Write mit optimistischem Guard gegen den gelesenen Ausgangsstatus ausführen; bei zwischenzeitlicher Änderung **fail-closed / Konflikt**, nicht blind überschreiben

Bereits `archived` darf nicht nochmals seinen `previous_status` überschreiben.

### 4.2 Beim Wiederherstellen

- nur `status === 'archived'`
- nur wenn `metadata.account_archive.previous_status` exakt `draft`, `planned` oder `booked` ist
- genau auf diesen verifizierten Wert zurücksetzen
- Restore-Provenienz danach entfernen, übrige `metadata` unverändert lassen
- Update mit Guard `status = archived`; bei Stale/Concurrent Change fail-closed

### 4.3 Historische archivierte Reihen ohne Provenienz

Für einen bereits archivierten Datensatz ohne gültige AP-4-Provenienz darf Jetnity **keinen früheren Status erfinden**.

UI/Action müssen diesen Zustand ehrlich als nicht automatisch wiederherstellbar behandeln. Kein Default-Status. Kein stilles `planned`/`draft`.

## 5. Einziger Schreibweg

Bevorzugt im bestehenden Server-Action-Modul `lib/trips/aktionen.ts` oder in einem eng benannten account/trips-Modul, falls das die Testbarkeit klar verbessert.

Pflicht:

- `'use server'`
- Eingabe via Zod, mindestens UUID + beabsichtigte Aktion
- serverseitig `auth.getUser()` über bestehenden `konto()`-/Server-Action-Vertrag
- Supabase Anon-Key als `authenticated`; RLS erzwingt Ownership
- **kein** `.eq('user_id', clientValue)`
- **keine** Service Role
- Read current `status` + `metadata` durch RLS
- Write nur auf exakt die eine RLS-sichtbare Reise
- keine Exception als UI-Vertrag; bestehendes `Aktionsergebnis`-Muster verwenden
- nach Erfolg mindestens `/reisen` und `/account` revalidieren; Workspace-Pfad nur falls dort Status sichtbar gecacht wird und live belegt nötig

Keine neue RPC, kein SQL-Runner, keine Edge Function, keine Migration.

## 6. `/reisen` UX

### 6.1 Normale Gruppen

Aktiv / Kommend / Vergangen / Ohne Datum enthalten **nur nicht archivierte** Konto-Reisen. Die bestehende date-only AP-3-Klassifikation bleibt unverändert; Archivfilter und Datumsableitung sind zwei getrennte Verantwortlichkeiten.

### 6.2 Archiv

- eigener klar benannter Abschnitt **„Archiv“** unter den normalen Gruppen
- nur anzeigen, wenn mindestens eine archivierte Reise in der geladenen Auswahl existiert; kein künstlicher Empty-Fehlerzustand
- Suche darf archivierte Reisen finden, aber sie bleiben im Archiv und springen nicht in eine Datumsgruppe
- 200er-Grenze bleibt ehrlich: Filter/Gruppen/Archiv gelten nur für die geladene Auswahl; keine neue Behauptung über nicht geladene Reisen

### 6.3 Aktionen

- nicht archivierte Konto-Reise: explizite Aktion **„Archivieren“**
- archivierte AP-4-Reise mit gültiger Provenienz: **„Wiederherstellen“**
- archivierte Reise ohne gültige Provenienz: kein erfundener Restore; ehrliche, zugängliche Rückmeldung
- keine Aktion auf Gast-Reisen
- Kartenidentität und Route bleiben TW7-A-konform

`Reisekarte` ist aktuell selbst ein Link. Keine verschachtelten interaktiven Elemente in diesen Link einbauen. Falls nötig einen account-spezifischen Wrapper/Aktionsbereich außerhalb des Links verwenden. Guest-Karte nicht regressieren.

## 7. `/account`

Bestehendes Verhalten beibehalten:

- archivierte Reise ist kein „Fortsetzen“/nächste Reise
- Restore muss nach erfolgreicher Revalidation wieder in die normale Account-Ableitung eingehen
- kein zweites Account-Lifecycle-Modell

## 8. Tests – Pflicht

Mindestens gezielte Regressionen für:

1. Archivfilter getrennt von AP-3-Datumsgruppen.
2. Archivierte Reise taucht nicht gleichzeitig in Aktiv/Kommend/Vergangen/Ohne Datum auf.
3. Archiv-Suche bleibt im Archiv.
4. Archivieren `draft` → Provenienz `draft` → `archived`.
5. Archivieren `planned` und `booked` erhält den jeweiligen exakten vorherigen Status.
6. Bereits archiviert überschreibt Provenienz nicht.
7. Wiederherstellen nutzt exakt gültigen `previous_status`.
8. Fehlende/ungültige Restore-Provenienz → fail-closed, kein Default.
9. Stale/concurrent Ausgangsstatus → kein blindes Update.
10. Fremde/unsichtbare UUID → keine Information über Existenz / kein Write.
11. Nicht angemeldet → kein Write.
12. Bestehende `metadata`-Keys bleiben bei Archive und Restore erhalten.
13. Gast-Lifecycle unverändert, kein Archiv in Local Storage.
14. `TripSummary.stages`, `reiseOrte`, `stageCount`, `itemCount` aus TW7-A unverändert.
15. `/account` wählt archivierte Reise weiter nicht als Fortsetzen.

Bestehende Account-/TW7-A-/Guest→Account-/Traveller-Contract-Tests müssen grün bleiben.

## 9. Security / Privacy / Datenbank

- keine Migration
- keine RLS-/Policy-Änderung
- kein Service Role
- kein Admin-Zugriff auf private Trips
- kein Auth-/MFA-/AAL-Change
- kein Production-Write durch Agent/Runner
- keine Dokument-/Citizenship-/Traveller-Truth-Änderung
- keine neuen sensitiven Daten

RLS-Fehler oder nicht sichtbare Reise → STOP/fail-closed, nicht umgehen.

## 10. Strikter Non-Scope

Nicht in AP-4 ziehen:

- AP-7 Account-Traveller-Registry
- P2-TA-06 Readiness-Hardening
- TW-8 Commercial
- Homepage/Search
- Provider/Admin/Growth
- AAL2 oder Auth
- neue Lifecycle-Statuswerte
- Delete-Redesign
- Guest-Archive
- Pagination jenseits der bestehenden 200er-Grenze
- neue DB-Spalten/Migrationen
- allgemeines `Reisekarte`-Redesign
- Workspace-Redesign

Wenn während der Implementierung eine Migration, RLS-/Ownership-Änderung, neue Statussemantik oder ein anderer Shared Contract nötig erscheint: **STOPP und an Technical Lead eskalieren. Nicht selbst erweitern.**

## 11. Arbeitsweise / Deliverables

`Account plattform audit vorbereitung 3`:

1. startet einen **frischen Branch vom dann aktuellen `origin/main`**, nicht von PR #39/#107 oder einem alten Agent-Branch;
2. liest zuerst `JETNITY_START_HERE.md`, die verbindlichen Governance-/Logic-/Continuity-Standards, diese Task-Datei, AP-3 Status/Handoff, PR-#107-Reconciliation, TW7-A Status und relevante ADRs;
3. rekonstruiert die betroffenen Runtime-Verträge vor dem ersten Edit;
4. implementiert nur AP-4;
5. schreibt/aktualisiert versionierten AP-4 Status + Handoff + erforderliche Continuity auf seinem Branch, ohne historische Evidence zu löschen;
6. führt Self-Review/adversarial Review aus;
7. führt gezielte Tests sowie vollständige Repository-Gates aus (`npm test`, Typecheck, Lint, Hygiene, Production Build; falls Repository-Standard inzwischen abweicht, aktuellen Standard verwenden);
8. eröffnet einen **Draft-PR**;
9. wartet auf Exact-Head GitHub Actions + Vercel Preview und prüft offene Review-Threads;
10. meldet Exact Head, Tests, Build, Security, DB, Kosten, offene Risiken;
11. **STOPP. Kein Ready, kein Merge durch den Autor-Agenten.**

ChatGPT / Technical Lead führt danach den unabhängigen vollständigen Exact-Head-Review durch und entscheidet autonom über Ready/Merge, sofern keine besondere Product-Owner-Gate-Bedingung entstanden ist.

## 12. Kosten

Keine neuen laufenden Kosten. Keine Provideraktivierung. Keine bezahlten Calls.
