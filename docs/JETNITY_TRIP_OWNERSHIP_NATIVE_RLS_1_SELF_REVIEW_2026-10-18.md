# JETNITY R76 — Trip Ownership Native RLS 1 — SELF REVIEW

**Autor-Selbstprüfung, kein Technical-Lead-PASS.** Agent-Self-Review ersetzt den unabhängigen R77-Review nicht.
**Geprüfter Code-HEAD:** `0c9e9b1775a50e79f0d52fba15b72fbfc56f5849` (Tree `b206a807842e14cd351dd3370130656f331d7365`) · PR [#965](https://github.com/Jetnity/jetnity/pull/965)

## Task-Treue

| Anforderung | Stand |
| --- | --- |
| Nur neue Dateien aus TASK §2 | ja: Testdatei, `scripts/db/trip-ownership-native-rls-1/bootstrap.sql`, vier Doku-Dateien |
| Verbotene Writes (TASK, `local-cluster.ts`, `rls.mjs`, `lib/trips/**` ausser Testdatei, `supabase/**`, `package.json`, Lockfile, `.github/**`, `.jetnity/**`, #955) | keiner. `git diff --name-status origin/main...HEAD` zeigt nur `A`-Einträge |
| Unveränderte Original-Migration, keine Ersatz-Policy | Blob im Test vor jeder Anwendung geprüft; exakt diese Bytes per stdin angewandt; Policies im Katalog verifiziert |
| Eigener isolierter Cluster, kein TCP, keine Remote-Variablen | `startLocalProofCluster()`, Einschluss-Test, `assertLocalProofEnvironment()` vor jeder Verbindung |
| Nur synthetische Konten/Reisen | ja; echte Konten A/B und ihre Reisen wurden weder gelesen noch berührt |
| Mac ohne Binaries = SKIP/NOT VERIFIED, CI ohne Binaries = FAIL | ja; lokaler SKIP-Grund wörtlich ausgegeben, CI-Pflichttest vorhanden |
| T01–T11 echte SQLSTATE/Zero-Row/Positive Controls, beide Richtungen | ja, 70 Proben, im CI-Log je Probe mit Rolle, UID und Antwortklasse |
| T12 auf echtem Linux-CI | Code-HEAD: CI, Auth, Preview SUCCESS. Finaler Doku-HEAD: Gates werden im PR-Kommentar nachgewiesen |
| Kein Ready, kein Merge, kein Folge-Slice, kein neuer Branch/PR | eingehalten |

## Bewusst geprüfte Schwachstellen

1. **Kann eine kaputte Harness als „0 Zeilen“ grün werden?** Nein. Jede Probe prüft Kontext vorher und nachher. Die positiven Kontrollen T06 laufen mit denselben Rechten, und die Mutanten `auth_uid_ignoriert_claim` und `trips_update_grant_fehlt` zeigen, dass solche Defekte rot werden. Ein Fehler ausserhalb des `DO`-Blocks beendet `psql` mit `ON_ERROR_STOP` und lässt den Test scheitern.
2. **Superuser-/Eigentümer-Verwechslung?** Die Proben laufen nie als Superuser. Die Sitzung ist `authenticator` (kein Superuser, kein BYPASSRLS), die Rolle `authenticated`/`anon`. Eigentümerin ist `postgres`. Die Mutante `trips_eigentuemer_ist_testrolle` wird erkannt.
3. **Messen die Negativfälle leere Tabellen?** Nein. Vor und nach jeder Probe bestätigt ein getrennter Superuser-Leser, dass alle vier Reisen und beide Etappen in der Seed-Belegung vorhanden sind.
4. **Verdeckt der Fremdschlüssel die Policy?** Getrennt geprüft: Bei T07 gibt es eine Probe ohne Kind, eine mit Kind und eine reine UPDATE-Policy-Probe. Bei T08 sind die FK-Fälle (23503) und die RLS-Fälle (42501) getrennt. Die Mutante zeigt, dass der FK RLS nicht ersetzt.
5. **SELECT-Policy auf der neuen Zeile.** Bei der Mutante ohne `WITH CHECK` blieben die gefilterten Übernahmeproben unerwartet bei 42501. Ursache ist die SELECT-Policy auf der neuen Zeile, wenn die Anweisung Spalten liest. Die ungefilterte Probe isoliert die UPDATE-Policy. Ich hatte das vorher nicht sicher gewusst; die Matrix verlangt je Mutante nur die gezielten Präfixe und hat es deshalb korrekt erkannt.
6. **Meldungstexte als Klassifikation.** Die Unterscheidung `rechte` gegen `rls` liest die englische Primärmeldung. Der Cluster läuft mit `initdb --no-locale` (`lc_messages=C`), daher ist sie stabil. Die SQLSTATE wird zusätzlich immer exakt verglichen.
7. **String-Interpolation im SQL.** Es werden nur feste Konstanten (UUIDs, Rollennamen, feste Texte) interpoliert, keine Eingaben von aussen. JSON-Claims stehen in einem SQL-String-Literal, die Proben in einem `$r76$`-Dollar-Quote. `psql` ersetzt in beiden keine Variablen.
8. **Mögliche Flakiness.** `drop database` wartet bis zu 5 s auf sich beendende Backends (PostgreSQL-Standard). T10 wartet begrenzt (höchstens 5 s), bis keine Sitzung mehr offen ist. Im ersten CI-Lauf trat keines davon auf.
9. **Source-Parität per Regex.** Der Scanner ist heuristisch, nicht ein SQL-Parser. Seine Gegenprobe (12 Treffer auf der Original-Migration) und ein ad-hoc-Selbsttest mit 11 positiven und 6 negativen Mustern sprechen gegen eine leere Aussage. Eine exotische Formulierung (z. B. dynamisches SQL in `EXECUTE format(...)`) würde er nicht sehen.
10. **Bootstrap-Abweichungen** sind im REPORT §5 einzeln begründet. Die wichtigste: `service_role` hier ohne BYPASSRLS und niemandem gewährt. `auth.uid()` ist nach der bekannten Supabase-Definition nachgebildet und nicht gegen die gehostete Funktion verglichen.

## Offene Punkte für R77

- Lokaler Production-Build nicht gelaufen (Sandbox `EPERM` auf das `tsx`-IPC-Pipe; bewusst nicht ausserhalb der Sandbox wiederholt). Der CI-Production-Build ist SUCCESS.
- `docs/ACTIVE_WORK_STATUS.md` wurde wegen des TASK-Datei-Scopes nicht aktualisiert.
- Ausserhalb des Nachweises (REPORT §10): Hosted Development, Production, `SECURITY DEFINER`-RPCs, `trip_days`/`trip_items`, #955 T09, Guardian P1.
