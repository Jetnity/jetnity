# Jetnity – TW6 Day→Stage Truth Contract – Product-Owner-approved follow-up

Stand: 26. August 2026  
Cursor-Agent: **`Trip workspace audit architecture`**  
Branch: `feat/tw6-rest-progressive-stages`  
PR: #87 (bleibt Draft bis unabhängiger Technical-Lead-Finalreview)  
Typ: **RUNTIME + SHARED CONTRACT + DEVELOPMENT MIGRATION ARTIFACT**

## 1. Product-Owner-Entscheid

Der Product Owner hat am 26. August 2026 die vom Technical Lead empfohlene Richtung ausdrücklich freigegeben:

1. **B ist das Fundament:** Eine Multi-Ziel-Reise darf echte bestätigte `trip_stages` besitzen, während ihre Reisetage ehrlich **noch keinem Ziel zugeordnet** sind.
2. Jetnity darf ohne Nutzerentscheidung **keine proportionale Day→Stage-Zuordnung als Reise-Wahrheit erzeugen oder anzeigen**.
3. **A folgt darauf als explizite Nutzeraktion:** Aufenthalte bzw. Day→Stage-Zuordnungen können später vom Nutzer festgelegt werden; erst nach Bestätigung werden sie Hard Truth.
4. Ein intelligenter/automatischer Vorschlag darf später höchstens als klarer **Vorschlag** existieren und wird erst nach Nutzerbestätigung zur Wahrheit.

Dieser Entscheid löst den Product-Gate von `TW6-B-P1-01`, aber **nicht automatisch den technischen Merge-Blocker**. Der Blocker gilt erst als geschlossen, wenn der neue Contract implementiert, adversarial geprüft und vom Technical Lead unabhängig als PASS bewertet wurde.

## 2. Aktuelle bestätigte Fehlsemantik

PR #87 hat korrekt mehrere bestätigte Ziele aufgebaut, aber der bestehende Vertrag erzeugt danach eine falsche sichtbare Zuordnung:

- `public.reise_anlegen()` verteilt unzugeordnete Tage proportional auf Stages;
- `reiseLaden()` / `gastspeicherLaden()` wenden `tageEtappenZuordnen()` an;
- `timelineAbleiten()` behandelt die dadurch gesetzte `stageId` als echte Etappenzugehörigkeit.

Beispiel: Paris → Rom → Paris, 12.–17. September wird ohne Nutzerentscheid zu 2/2/2 Tagen verteilt. Das ist verboten.

## 3. Verbindliche Zielsemantik

### 3.1 Neue Multi-Ziel-Reise ohne Aufenthaltsentscheidung

Nach Create gilt:

- die bestätigten Ziele existieren in Eingabereihenfolge als echte `trip_stages`;
- Stage-Namen/Land/Koordinaten/Place-ID stammen nur aus bestätigter Places-Evidence;
- `arrival_date` / `departure_date` bleiben leer, solange der Nutzer sie nicht festgelegt hat;
- alle Trip-Tage bleiben wirklich ohne Stage-Zuordnung;
- Persistenz, Reload, Guest→Account und Timeline dürfen daraus **keine** Zuordnung ableiten;
- UI muss diesen Zustand ehrlich als „noch nicht zugeordnet“ ausdrücken.

### 3.2 Eine Ziel-Reise

Bestehendes Verhalten bleibt fachlich wahr und regressionsfrei:

- genau eine Stage;
- globaler Reisezeitraum kann für diese eine Stage verwendet werden;
- alle Tage gehören zur einzigen Stage.

### 3.3 Historische Reisen

Bestehende/alte Reisen dürfen nicht still umgedeutet oder beschädigt werden.

Der bisherige proportionale Fallback darf nur dort weiterwirken, wo der gespeicherte Vertrag eindeutig als **Legacy-Fallback** gekennzeichnet ist bzw. durch die Migration als solcher erhalten wird.

Ein globales Abschalten von `tageEtappenZuordnen()` ist verboten.

### 3.4 Zukünftige explizite Nutzerzuordnung

Der jetzt eingeführte Contract muss einen späteren Slice ermöglichen, in dem der Nutzer Aufenthalte/Tage explizit festlegt.

Dieser aktuelle Auftrag baut **nicht** die komplette Aufenthalts-UX. Er schafft zuerst das truth-safe Fundament.

## 4. Erforderlicher persistenter Contract

Es braucht einen **dauerhaften, unterscheidbaren Assignment-Source/Mode-Vertrag**. Eine reine UI-Bedingung oder ein Browser-only Flag reicht nicht.

Bevorzugte Semantik des Technical Lead:

- `legacy_fallback` – historische Reise; bestehender proportionaler Fallback bleibt erlaubt;
- `unassigned` – mehrere bestätigte Ziele, aber noch keine Nutzerzuordnung; **kein Fallback**;
- `single_destination` – genau ein Ziel; alle Tage dürfen der einzigen Stage zugeordnet werden;
- `user` – reserviert für später explizit bestätigte Nutzerzuordnung.

Bevorzugter DB-Name: `day_stage_assignment_source` auf der Trip-Wahrheit. Ein gleichwertiger Name ist erlaubt, wenn er sich nach Live-Inspektion besser in den bestehenden Contract einfügt; die vier Semantiken dürfen jedoch nicht in ein unklares Boolean kollabieren.

WICHTIG:

- Client darf diesen Wahrheitsstatus nicht frei behaupten und dadurch Serverregeln umgehen.
- Create-Server/RPC muss den Zustand aus dem fachlich bestätigten Create-Kontext ableiten bzw. kontrolliert setzen.
- Bestehende Rows müssen backward-compatible auf `legacy_fallback` landen.
- Kein neues Schattenmodell und keine zweite Stage-Tabelle.

Wenn die Live-Architektur zeigt, dass diese vier Semantiken mit einem anderen minimalen, saubereren Contract abgebildet werden müssen: dokumentieren, begründen und nur dann abweichen. Keine stillen Zusatzannahmen.

## 5. Runtime-Anforderungen

Der Agent prüft und passt nur die minimal nötigen Flächen an, insbesondere soweit wirklich erforderlich:

- Trip-/Graph-Typen und Schema
- Create-Nutzlast / Abbildung
- Guest storage
- Guest→Account transfer
- Account read path
- `tageEtappenZuordnen`
- `public.reise_anlegen()` als versioniertes Migration-Artefakt
- generated/db types soweit nötig
- Timeline-Darstellung für wirklich unassigned Tage
- Tests
- Status-/ADR-/Slice-Dokumentation

### Verbindliches Verhalten

1. Neue Multi-Ziel-Reise ohne Aufenthalte → Assignment Source `unassigned`.
2. `public.reise_anlegen()` darf für `unassigned` den proportionalen CTE **nicht** anwenden.
3. Guest-Load darf für `unassigned` `tageEtappenZuordnen()` **nicht** proportional anwenden.
4. Account-Load darf für `unassigned` keine proportionale Zuordnung erzeugen.
5. Guest→Account muss Source + leere Day→Stage-Zuordnung verlustfrei erhalten.
6. Timeline muss unassigned Tage als ehrlichen unassigned Zustand darstellen; nicht unter Paris/Rom gruppieren.
7. Legacy-Reisen behalten bisherigen Fallback.
8. Single-Destination bleibt regressionsfrei.
9. Kein automatischer Wechsel `unassigned` → `user`.
10. Kein automatischer Aufenthalt-/Datums-/Tagesvorschlag als Hard Truth.

## 6. Migration / Supabase-Grenze

Dieser Auftrag darf ein **versioniertes Supabase-Migration-Artefakt** erstellen und – falls für Tests nötig und die aktuelle Jetnity-Governance es erlaubt – ausschließlich gegen die Development/Test-Umgebung anwenden.

**VERBOTEN ohne neue Product-Owner-Freigabe:**

- Production-Supabase-Migration anwenden;
- Production-RLS/Ownership ändern;
- destructive Production data changes;
- Production-Secrets oder Provider-Aktivierungen.

Production bleibt vollständig unangetastet.

Migration muss:

- bestehenden Datenbestand backward-compatible behandeln;
- alten Trips nicht rückwirkend eine neue Nutzerentscheidung zuschreiben;
- klare CHECK-/Constraint-Semantik besitzen, falls das bestehende Schema das trägt;
- Rollback-/Failure-Risiko dokumentieren;
- keine unnötige neue Tabelle einführen.

## 7. UX-Grenze dieses Auftrags

Jetzt bauen:

- Multi-Ziel Create wie in PR #87;
- nach Create ehrliche Darstellung, dass Aufenthalte/Tage noch nicht den Zielen zugeordnet sind;
- bestehende Timeline darf einen professionellen unassigned Bereich zeigen;
- verständliche Copy, keine technische Bezeichnung wie `stageId`.

Noch **nicht** bauen:

- vollständigen „Aufenthalte festlegen“-Editor;
- Drag-and-drop;
- automatische Aufenthaltsverteilung;
- KI-/LLM-Vorschlag;
- TW-7/TW-8/TW-9.

Die explizite Nutzerzuordnung (Product Direction A) erhält nach Integration dieses Fundaments einen separaten, vom Technical Lead geschnittenen Auftrag.

## 8. Harte Non-Scope-Grenzen

Nicht ändern/aktivieren:

- Auth/MFA/AAL/Session
- RLS/Ownership außer falls eine reine, bereits bestehende Trip-Spalten-Policy technisch automatisch greift; keine neue Production-Aktivierung
- Traveller/Citizenship/Documents
- Route/Transit Shared Contract
- Provider/Commercial
- Payments
- D0/D1/G0/G1
- robots/sitemap/canonical/domain/DNS/indexing
- Homepage/Marketing
- Admin
- Production Supabase
- neue laufende Infrastrukturkosten

Bei Kollisionsbedarf mit einem dieser Contracts: STOPP und Technical Lead informieren.

## 9. Pflicht-Tests – adversarial

Mindestens:

1. **Paris → Rom → Paris / 12.–17. September** nach Create, Persistenz und Reload:
   - drei Stages in Reihenfolge;
   - sechs Tage;
   - alle sechs Tage bleiben unassigned;
   - Timeline zeigt keine 2/2/2-Erfindung.
2. Dasselbe für Guest.
3. Dasselbe für Account/Development-DB.
4. Guest→Account erhält `unassigned` und null Day→Stage verlustfrei.
5. Single-Destination-Regression: eine Stage, alle Tage korrekt zugeordnet.
6. Legacy-Fixture ohne neuen Source-Wert bzw. migriert als `legacy_fallback`: bisherige proportionale Zuordnung bleibt erhalten.
7. Manipulierter Client kann `user` / `legacy_fallback` nicht frei setzen, um Server-Truth zu umgehen.
8. Reload darf `unassigned` nicht in irgendeine zugeordnete Form umwandeln.
9. Timeline-Gruppierung: Stages bleiben sichtbar, unassigned Tage aber nicht als Aufenthalt darunter behauptet.
10. Paris → Rom → Paris bleibt nicht dedupliziert.
11. Keine erfundenen Stage-Daten.
12. Keine Regression Guest-One-Trip, clientRef, Account RLS/ownership, Places-Evidence.
13. Bestehende Traveller/Route/Commercial/D0 Tests bleiben grün.
14. Migration auf Development/Test ist wiederholbar/sauber und Production wird nicht berührt.

Danach vollständige Repo-Gates: Typecheck, Lint, Tests, Production Build, Hygiene/API/Schema/Auth gemäß aktuellem Workflow.

## 10. Evidence / Deliverables

Aktualisieren/erstellen:

- `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_STATUS.md`
- relevante Migration-/Contract-Tests
- ADR in der bestehenden Decisions-Struktur, sofern der Shared-Contract tatsächlich implementiert wird
- PR #87 Body mit aktuellem, ehrlichem Stand

Status muss enthalten:

- Live main
- Exact Head
- Merge-Base
- Ahead/Behind
- vollständige Changed Files
- final gewählter Assignment-Source/Mode-Contract
- warum Altbestand kompatibel bleibt
- Guest/Account-Parität
- Development-Migration-Evidence
- explizite Aussage: Production Migration **NICHT** angewendet
- Tests
- GitHub Actions Exact Head
- Vercel Exact Head
- P0/P1/P2/P3
- offene Restpunkte

## 11. Review-/Merge-Governance

Agent:

- darf PR #87 **nicht** Ready setzen;
- darf **nicht** mergen;
- darf keinen Folgeslice beginnen;
- darf den P1 erst dann als „technisch behoben / awaiting TL review“ einstufen, wenn Runtime und Tests ihn tatsächlich schließen.

ChatGPT / Technical Lead führt danach erneut einen vollständigen unabhängigen Finalreview durch.

## 12. STOPP

Nach Implementierung, Self-Review, Exact-Head-CI und Vercel:

**STOPP.**

Kein TW-7/TW-8/TW-9. Keine Aufenthalts-UX aus Direction A. Keine Production-Migration.