# Supabase Migration-History Replay Defect – Gate 0 Recommendation

Stand: 29. August 2026  
Status: **EMPFEHLUNG NUR / KEIN REPAIR AUTORISIERT / NO MUTATION**  
Cursor-Agent: `Jetnity infrastructure migration audit 1`

Diese Datei plant einen **späteren** Repair-Slice. Sie autorisiert keine Aktion.

## 1. Empfehlung

**Kleinste verantwortbare spätere Reparatur:** nur den gespeicherten Production-History-Body von `20260829140000` durch gültiges, replay-fähiges SQL ersetzen. Den Production-Katalog nicht erneut anwenden. Den Erfolg mit einem **neuen temporären Preview-Branch** beweisen. Den bestehenden `develop`-Branch erst danach und nur nach eigenem Plan anfassen.

Begründung:

- Production-S5-B-Objekte sind vorhanden und der Runtime-Write bleibt geschlossen.
- Der Replay bricht, weil Statement 0 Prosa ist, nicht weil die Tabelle fehlt.
- Offizielles Reset/Rebase spielt genau diese gespeicherten Statements erneut ab.
- Ein zweites `CREATE TABLE` auf Production wäre unsicher.

## 2. Optionen

### Option A – History-Body ersetzen, Katalog nicht anfassen (empfohlen)

Was: `supabase_migrations.schema_migrations.statements` für `20260829140000` auf die kanonische Repo-SQL (oder eine dokumentiert replay-sichere, semantisch gleiche Fassung) setzen. Kein zweites DDL auf Production.

Nutzen: neue Branches/Resets können an der Version vorbeikommen und die Objekte auf leerer DB erzeugen.

Risiken: Production-Metadatenmutation; falscher Body kann den nächsten Replay erneut brechen; Repo-SQL ist gegen **existierenden** Katalog nicht idempotent.

Aufwand: klein, aber gegatet. Möglicher kostenpflichtiger Preview-Branch zur Probe.

PO-Gate: ja.

### Option B – History unverändert lassen und Rebase dauerhaft vermeiden

Was: keine Mutation. Künftige Migrationen nur als neue Versionen mit echtem SQL-Body. `develop` nicht resetten/rebasen.

Nutzen: null Production-Risiko jetzt.

Risiken: jeder Reset/neue Replay-Branch scheitert weiter an Statement 0. Operational tax wächst. Parallel-Workstreams bleiben brüchig.

Priorität: nur als Zwischenzustand, nicht als Dauerlösung.

### Option C – `migration repair --status reverted` und Repo-SQL auf Production neu anwenden

Was: Zeile löschen, Datei erneut ausführen.

Bewertung: **nicht verantwortbar.** Tabelle, Rollen, Policies, Trigger existieren. `CREATE TABLE` ohne `IF NOT EXISTS` scheitert oder erzeugt Teilzustände. Offizielle CLI-Repair ändert nur Tracking, führt kein SQL aus und ersetzt keinen Body.

### Option D – Repo-SQL zuerst idempotent machen, dann Production re-applyen

Was: `IF NOT EXISTS` / `DROP POLICY IF EXISTS` etc., dann Apply.

Bewertung: Scope-Ausweitung, immer noch Production-DDL, unnötig wenn der Katalog schon stimmt. Behebt den History-Body nicht von selbst.

### Option E – nur Support-Ticket ohne eigenen Repair-Plan

Was: Supabase Support bitten, History oder Branching zu reparieren.

Bewertung: sinnvoll als **Eskalation**, wenn nach Option A ein neuer Preview-Replay weiter scheitert oder kein Body-Replace-Pfad verfügbar ist. Allein ohne Before-Image und Acceptance Criteria zu dünn.

## 3. Bevorzugter späterer Ablauf (nicht jetzt)

1. Frischen Binding-Slice-Precheck ausführen. Dieser Audit startet den Repair nicht.
2. Product-Owner-Freigabe für Production-`schema_migrations`-Mutation einholen.
3. Production-Backup / PITR-Fenster bestätigen.
4. Before-Image der Zeile `20260829140000` sichern.
5. Gewählten Body-Replace-Pfad dokumentieren:
   - bevorzugt ein von Supabase unterstützter Body-Write, falls vorhanden;
   - sonst transaktionaler `UPDATE` **nur** `statements` (und bei Bedarf `name`), ohne DDL;
   - Support, falls der Replace-Pfad unklar bleibt.
6. After-Image prüfen: Statement-Anzahl, Hash, erstes ausführbares Token = gültiges SQL.
7. Production-Katalog gegen die Gate-0-Evidence erneut read-only prüfen: Tabelle, RLS, Grants, Rollen, Gate `false`, 0 Rows unverändert.
8. **Neuen** temporären Preview-Branch erzeugen (nicht `develop` resetten). Erfolg = Branch wird healthy und enthält `trip_item_commercial_provenance`.
9. Preview-Branch nach Evidence löschen, sofern er nur zur Probe diente.
10. `develop` separat entscheiden: neuer Branch vs. Reset erst nach bewiesenem Replay. Die Extra-Versionen `20260826052735`, `20260828120000` und die S2-Versionsdrift `20260829204547` vs `20260829210052` müssen in diesem Plan vorkommen.
11. Apply-Regel festschreiben: History speichert den echten SQL-Body, niemals einen Prosa-Marker.

## 4. Acceptance Criteria vor jeder Repair-Aktion

Eine spätere Repair-Aktion darf erst starten, wenn alle Punkte wahr sind:

1. Eigenes versioniertes Repair-Task existiert. Dieser Gate-0-Audit ist nicht das Task.
2. Product-Owner-Freigabe für die konkrete Production-History-Mutation liegt vor.
3. Technical-Lead Exact-Head-Review des Repair-Heads ist PASS.
4. Production-Backup / PITR ist bestätigt und das Restore-Fenster ist bekannt.
5. Before-Image von `20260829140000` ist im Repair-Branch versioniert.
6. Der Ersatz-Body ist gültiges SQL und auf leerer DB replay-fähig.
7. Es gibt keinen Plan, die Repo-Datei gegen den bestehenden Production-Katalog auszuführen.
8. RLS, Grants, Ownership, Auth, MFA, AAL, Provider-Write und Traveller-Runtime sind Non-Scope.
9. Nach dem Replace folgt eine Replay-Probe auf einem neuen Preview-Branch, nicht ein blinder `develop`-Reset.
10. Abbruchregel: bei Katalogabweichung gegenüber Gate-0-Evidence sofort STOP und Restore-Review, kein Nachbessern im selben Schwung.

Nach dem Repair zusätzlich:

11. Production-Katalog unverändert gegenüber Gate 0 für S5-B-Objekte, Grants, Gate-Row und Rowcount 0.
12. History-Hash der Version ist nicht mehr der Marker-Hash `bef6912d…`.
13. Neuer Preview-Replay ist healthy und trägt die Provenance-Tabelle.
14. Kein Ready/Merge durch einen Cursor-Agenten.

## 5. Was ausdrücklich nicht empfohlen wird

- Production- oder Development-Mutation aus diesem Audit
- `develop` jetzt resetten oder rebasen
- Marker-Zeile löschen
- Writer-Gate öffnen
- Repo-SQL auf Production erneut anwenden
- History still auf `IF NOT EXISTS` umschreiben, ohne Replay-Beweis
- AP-7-S3 oder Account-Traveller-Runtime vermischen

## 6. Kosten / Dependencies

- Dieser Audit erzeugt keine neuen laufenden Kosten.
- Ein späterer temporärer Preview-Branch kann kostenpflichtig sein. S5-B hat das Muster bereits verwendet und den Validation-Branch danach gelöscht.
- Keine neuen Provider, Secrets oder paid API-Calls.
- Unter der USD-100-Richtlinie bleiben, bevor ein dauerhafter zusätzlicher Branch angelegt wird.

## 7. Priorität

- **Kein Production-Runtime-P0.** Write-Pfad geschlossen, 0 Provenance-Rows, Owner-Read intakt.
- **P1 vor jedem zukünftigen Supabase-Rebase/Reset/Replay-Branch.**
- Nicht vor AP-7-S3-Produktarbeit zwingend, solange niemand `develop` resetten oder einen Replay-Branch aus Production erzeugen muss.
- Nicht still in einen Traveller- oder Provider-Slice ziehen.
