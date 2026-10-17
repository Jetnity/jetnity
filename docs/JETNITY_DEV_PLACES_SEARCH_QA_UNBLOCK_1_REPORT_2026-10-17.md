# Development Places Search QA Unblock 1 — REPORT

**Datum:** 17. Oktober 2026 · **Issue:** [#960](https://github.com/Jetnity/jetnity/issues/960) · **Draft:** [#961](https://github.com/Jetnity/jetnity/pull/961)  
**Ergebnis:** **Ausgang B — STOP. Mit begrenzten synthetischen Fixtures kein Source-Defekt reproduziert; die Hosted-Root-Cause ist nicht unabhängig festgestellt. Kein Produkt-Code geändert.** Kein QA-B PASS, kein Source PASS.

> **R48-Korrektur (17. Okt. 2026).** Technical-Lead-Review [R48](https://github.com/Jetnity/jetnity/pull/961#pullrequestreview-5557427258) auf `03b15c46` hat F1–F4 verlangt. Die frühere Fassung dieses REPORT schloss aus den zwei `200 []` zu viel (jede Teilabfrage null Zeilen, „Fehler liegt nicht im Code“) und las die UI-Meldung aus R46 als Beleg für ein abgeschlossenes `200 []`. Beides ist unten korrigiert (F1, F2). Die Development-Zuordnung ist offline geprüft (F3, §2a), der eigene Testserver ist beendet (F4, §8). Keine neue Datenbank- oder Hosted-Abfrage.

## 1. Identität

| Feld | Wert |
| --- | --- |
| Logischer Autor | `Jetnity Development Places Search QA Unblock 1 — Cursor Generation 1` |
| Generation | 1 |
| Cursor-Session | `bc-284c2472-d0a5-4d4c-adb6-167661010453` |
| Modell | `claude-opus-5-5-high` (live über Cloud-Run-Identität gelesen). Der erste Turn derselben Session lief als `grok-4.7-high-fast` und hat nur einen STOP-Kommentar ohne Diagnose oder Code gepostet. Nach der Umstellung durch den Product Owner wurde `claude-opus-5-5-high` erneut gelesen, bevor D0 begann. |
| Branch | `fix/development-places-search-qa-unblock-1` |
| Seed-Head / D0-Code-Head | `40220e9ab10db8dae00717c4b4be655a165ee127` |
| `main` / Merge-Base | `40566bbfaac6adace8e0f19fd4fcc7ee251d7eb5`, 1 ahead / 0 behind beim Start |
| Mode | `NORMAL` (live gelesen) |
| TASK-Blob | `b214661d5c44484d2b4726a518951a5428e3dfc7`, unverändert |

## 2. Root-Cause-Matrix

| Schicht | Befund | Status |
| --- | --- | --- |
| Client `OrtSuche` (R46-Beobachtung) | Die R46-Meldung „Kein passendes Reiseziel gefunden. Bitte wähle einen Eintrag aus der Liste.“ ist `ORT_MELDUNG.zielUnbekannt` im Zustand `empty`. `sucheLage()` geht nach `empty`, wenn die Liste offen ist, die Eingabe ≥ 2 Zeichen hat, keine Auswahl besteht, keine Treffer vorliegen und `laedt` falsch ist. Das belegt **nicht**, dass eine HTTP-Anfrage abgeschlossen war: Im Debounce-/Effekt-Lebenszyklus kann `empty` kurz vor der Antwort sichtbar sein. 503 zeigt „nicht erreichbar“, andere erkannte Fehler „fehlgeschlagen“. | **R46-Screenshot allein: kein Beleg für ein abgeschlossenes `200 []`.** Kein Client-Defekt reproduziert; der UI-Zustand zur Zeit von R46 ist NICHT VERIFIZIERT. |
| Route `/api/search/places` | Anonymer Route-Handler-Client, nur `public.places`. Ein von PostgREST gemeldeter Lesefehler geht über `lese()` → 500/503, nie still leer. | **Nachgewiesen** im bestehenden Code und in T04 (synthetisch). |
| Offline-Suche (`placesSuchen`, Filter, Abbildung, Ranking) | Mit kanonischen synthetischen Zeilen liefert derselbe Abfrageweg wie die Route, durch den echten `postgrest-js`-Encoder und einen **synthetischen PostgREST-Simulator**: `Japan` → Land zuerst (`ziel`), kein Land als `abreise`; `Zürich`/`Zurich`/`zürich` → Stadt zuerst und `ZRH` (`abreise`), Stadt ohne Flughafen (`ziel`). Bestehende 166 Places-/Such-/Airport-Tests grün. Namensfilter unverändert seit 20. Aug. 2026, Route/Lauf seit 29. Aug. 2026. | **Mit begrenzten synthetischen Fixtures kein Source-Defekt reproduziert.** Keine Integration gegen den echten Hosted-Katalog. |
| Hosted Development, zwei begrenzte GETs (eigene Beobachtung, getrennt von R46) | Am exakten Head: beide `200`, `application/json`, `no-store`, Body 2 Bytes, Array, **0 finale Optionen**, kein Fehler-Flag. | **Nachgewiesen nur:** Die Route gab zweimal `200 []` zurück, und kein klassifizierter Lesefehler erreichte die Route. **Nicht nachgewiesen:** dass jede einzelne PostgREST-Teilabfrage null Zeilen lieferte, dass `public.places` leer ist, sowie Datenmenge und RLS-/Grant-Zustand. Zeilen können ohne Fehler durch Abbildung (`ortAusZeile`: unbekannter `typ`/`source`), Rollenfilter oder Ranking-Schwellen wegfallen. |
| Ursache der leeren Antwort | Möglich, ohne Rangfolge: (a) `public.places` auf dem aktuellen Development-Branch leer, z. B. Branch mit `with_data=false` erstellt und Import nicht erneut gelaufen; (b) Zeilen vorhanden, aber für `anon` unsichtbar durch abweichende Policy oder Grants; (c) Zeilen vorhanden, aber ohne diese Namen oder Keywords; (d) Zeilen geliefert, aber durch Abbildung, Rolle oder Ranking verworfen, weil Hosted-Werte vom synthetischen Vertrag abweichen. Der Import vom 20. Aug. (124 811 Orte) belegt nichts über den heutigen Branch. | **NICHT VERIFIZIERT.** Unterscheidung braucht einen Hosted-DB-Readback, der unter DEV-PREP-1 gesperrt ist. |

**Schluss:** Mit begrenzten synthetischen Fixtures ist kein Source-Defekt reproduziert; die Hosted-Root-Cause ist nicht unabhängig festgestellt. Ob Datenbestand, Sichtbarkeit oder eine Wechselwirkung echter Hosted-Werte mit Abbildung oder Ranking die Ursache ist, bleibt offen. Das ist laut TASK §2.4 ein **sofortiger STOP**. Ein Code-Fix ohne reproduzierten Defekt wäre hohl oder unzulässig: hartkodierte Orte, erfundene IDs oder eine Umgehung von `reiseorteBestaetigen`.

## 2a. Development-Zuordnung (R48-F3, offline)

In derselben Cursor-Session, ohne neue Anfrage: Der Host-Ref der vorhandenen öffentlichen `NEXT_PUBLIC_SUPABASE_URL` wurde im Prozess mit dem vom Technical Lead in R48 genannten, freigegebenen nicht-default Development-Branch-Ref verglichen. Dieser ist zugleich der einzige 20-stellige Ref im unveränderlichen TASK. Ausgegeben wurde nur das Ergebnis, kein Wert.

**Ergebnis: MATCH.** Der GET-Server wurde aus genau dieser Variable gestartet (`QA_URL="$NEXT_PUBLIC_SUPABASE_URL"`); seine Umgebung wurde dafür nicht erneut gelesen.

## 3. Entscheidungspaket für Technical Lead und Product Owner

Benötigt wird eine Entscheidung, nicht Code.

1. **Diagnose freigeben (Voraussetzung):** Einen begrenzten, nur lesenden Development-Readback über einen freigegebenen Weg genehmigen: Zeilenzahl von `public.places` nach `typ`/`source`, Vorhandensein der Migration `20260820120000` in der Branch-Historie, Policy `places_lesen` und Grants. Das berührt das gesperrte DEV-PREP-1-Readback; die Sperre muss zuerst bewusst aufgehoben oder für genau diesen Read ausgenommen werden.
2. **Falls leer:** Einen Development-only-Lauf des bestehenden kontrollierten Imports nach `docs/ORTE.md` §7 durch einen benannten Writer genehmigen: Flughafenbestand zuerst prüfen, dann `npm run places:importieren -- --schreiben --entwicklung`. Der Import lädt den freien GeoNames-Dump (CC BY 4.0) herunter. Das ist ein externer Download und darum in diesem Slice nicht erlaubt. Danach dieselben zwei GETs und R46 wiederholen.
3. **Falls Zeilen vorhanden, aber unsichtbar:** Policy- oder Grant-Abweichung als eigenen Security-/RLS-Slice behandeln (Product-Owner-Gate), nicht als Places-Code-Fix.
4. **Falls Zeilen vorhanden und sichtbar:** Die Hosted-Werte (`typ`, `source`, `name`, `keywords`) dieser Orte gegen Abbildung, Rollenfilter und Ranking prüfen. Erst dann kann ein Source-Defekt reproduziert werden, als eigener bewiesener D1.
5. **Nicht empfohlen:** QA-B mit gefälschten oder direkt geschriebenen Place-IDs fortsetzen. Das verletzt `docs/ORTE.md` und `reiseorteBestaetigen`.

**Proaktiver Hinweis (nicht verifiziert):** `docs/ORTE.md` sagt noch „Production hat diese Tabelle noch nicht“. Der heutige Production-Bestand von `public.places` wurde hier **nicht** gelesen. Wäre er leer, blockierte dieselbe Pflicht-`OrtSuche` jede manuelle Reiseerstellung und den Startseiten-Einstieg auch auf Production. Das ist vor jedem Launch-Gate zu prüfen. Empfehlung für später: ein nicht privilegiertes Readiness-Signal „Ortskatalog befüllt“, damit ein leerer Katalog nicht erst in manueller QA auffällt.

## 4. Geänderte Dateien

Nur TASK-eigene Pfade (§4):

- `lib/places/qa-unblock-1/places-suche-diagnose.test.ts` — neu, rein synthetisch: T01, T02, T03, T04, T08.
- `docs/JETNITY_DEV_PLACES_SEARCH_QA_UNBLOCK_1_PLAN_2026-10-17.md`, `…_REPORT_…`, `…_SELF_REVIEW_…`, `…_HANDOFF_…` — neu.
- `docs/evidence/jetnity-dev-places-search-qa-unblock-1/d0-bounded-get.json` — neu, sanitisiert.

Keine Produktdatei, keine Migration, kein `package*.json`, kein #955-Pfad, keine Continuity-Datei außerhalb des TASK.

## 5. Gates (lokal, D0-Head plus diese Dateien; Stand vor R48)

Diese lokalen Werte gehören zum Head `03b15c46`. Der R48-Korrektur-Commit ändert nur diese Docs und die Evidence-Datei; seine Exact-Head-Gates (CI/Auth, Vercel Preview) stehen im PR-Kommentar zu R48.

| Gate | Ergebnis |
| --- | --- |
| Bestehende Places-/Such-/Airport-Tests | 166/166 PASS |
| Neue Diagnose | 6/6 PASS. Mutation: alle drei Filter gebrochen → 2 Zürich-Fälle rot, Japan bleibt über die IMATCH-Exaktklausel grün; Datei danach wiederhergestellt. |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 Fehler, 146 bestehende Warnungen, keine in der neuen Datei |
| `npm test` | 6922 Tests, 6921 PASS, 0 FAIL, 1 SKIP (bestehender Layout-Audit ohne `SHARED_LAYOUT_AUDIT_BASE`). Lauf mit lokal installiertem PostgreSQL 16 und ohne `SUPABASE_PROJECT_REF`/`SUPABASE_ACCESS_TOKEN` im Test-Environment, weil der bestehende Guard `local_proof_connection_override_forbidden` geerbte Ref-Variablen absichtlich ablehnt. Mit diesen Variablen: 7 native PG-Tests verweigert; ohne PG16: 10 mit `initdb ENOENT`. Kein Test- oder Guard-Code verändert. |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` | alle PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| Original GitHub CI/Auth, Vercel Preview | gehören zum neuen Head nach Push; Werte im PR-Kommentar, nicht hier eingebettet. Seed-CI ist kein Nachweis für diesen Head. |

`db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen` nicht ausgeführt: keine Datenbank- oder Auth-Änderung, und Hosted-Zugriff ist in diesem Slice ausgeschlossen.

## 6. T01–T10

| Test | Status |
| --- | --- |
| T01 Japan Land als `ziel`, nicht `abreise` | PASS offline |
| T02 Zürich Stadt / ZRH, Diakritik-Faltung | PASS offline |
| T03 `200 []` bleibt leer | PASS offline; hosted gab die Route zweimal `200 []`, Ursache offen |
| T04 Lesefehler 500, Netz 503, nie still leer | PASS offline |
| T05 Debounce/Race/Abort | bestehende `lib/suche/anfrage`-Tests grün; keine UI-Änderung |
| T06 freie Namen bleiben unbestätigt | unverändert, kein Code berührt |
| T07 Filter/Alias/Rollen/Relevanz unverändert | bestehende Tests grün, kein Code berührt |
| T08 kein externer Host, kein Provider, kein Service Role, kein Write | PASS offline; GET-Server ohne Management-Token oder Service Role |
| T09 vormals roter Fall wird grün | **NOT VERIFIED** — kein Code-Fix; die zwei Hosted-Antworten waren `200 []` |
| T10 Pfad-, Sanitization-, Gate-Audit | siehe SELF_REVIEW |

## 7. Was nicht getan wurde

Kein SQL, keine Management-API, kein `execute_sql`/`list_tables`, kein Service Role, kein Auth Admin, kein Login, keine Reise, kein Import, kein Seed, keine Migration, keine RLS-/Grant-Änderung, kein externer Geocoder, kein Provider/LLM, kein Production-Zugriff, keine Berührung von #955 oder #626. Kein Ready, kein Merge, kein Folge-Slice. In der R48-Korrektur keine weitere GET- oder Hosted-Abfrage.

## 8. Cleanup (R48-F4)

- Nur die eigene tmux-Session `places-qa-dev` beendet. Beide eigenen Prozesse (`next dev -p 3107` und sein `next-server`) sind danach weg; `127.0.0.1:3107` antwortet nicht mehr (TCP-Verbindung abgelehnt).
- Eigener temporärer Worktree `/tmp/jetnity-qa-places` mit `git worktree remove` entfernt und Worktree-Liste bereinigt. Das Haupt-`node_modules` ist unverändert.
- Eigene Hilfsdateien entfernt: Startskript, GET-Skript, Server-Log, Prototyp, Sicherungskopie, lokale Review- und Gate-Logs.
- Nicht berührt: der vom Umgebungs-Startskript betriebene `next dev` auf `:3000` (nicht TASK-eigen) und das lokal installierte PostgreSQL-16-Paket, das nur als Binärdatei für Tests dient (kein Dienst gestartet).

**STOP für unabhängigen ChatGPT Technical Lead R49.**
