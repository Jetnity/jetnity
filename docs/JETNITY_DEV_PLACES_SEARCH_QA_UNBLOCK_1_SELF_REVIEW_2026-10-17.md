# Development Places Search QA Unblock 1 — SELF_REVIEW

**Autor-Selbstprüfung. Kein Technical-Lead-PASS.**

## T10 Audit

- **Pfade:** Nur `lib/places/qa-unblock-1/**`, die vier TASK-eigenen Docs und `docs/evidence/jetnity-dev-places-search-qa-unblock-1/**`. Die TASK-Datei ist unverändert (Blob `b214661d…`). Keine Produktdatei, kein #955-Pfad, keine globale Continuity-Datei.
- **Source-Integrität:** Die zwei Mutationsproben an `lib/places/suche.ts` wurden aus einer Sicherung zurückgespielt; `git status` zeigt danach keine Änderung an versionierten Dateien. Die vom Start-Skript erzeugte `next-env.d.ts`-Drift wurde verworfen, nicht committet.
- **Sanitization:** Kein Projekt-Ref, kein Key, kein Token, keine Header außer `content-type`/`cache-control`, keine Antwortkörper außer der Länge, keine Server-Logs, keine Personendaten. Die Evidence nennt nur die Namen der Environment-Variablen.
- **Wahrheit:** Zwei leere Antworten werden nicht als „Tabelle leer“ ausgegeben. Der Import vom August und `with_data=false` stehen nur als Hypothesen.
- **R48-Korrektur:** Die erste Fassung schloss aus `200 []` auf null Zeilen in jeder Teilabfrage und auf „Fehler nicht im Code“, und sie las die R46-UI-Meldung als abgeschlossenes `200 []`. Beides war zu weit und ist im REPORT §2 korrigiert. Belegt ist nur: zweimal `200 []`, kein klassifizierter Lesefehler an der Route, kein Source-Defekt mit synthetischen Fixtures reproduziert.
- **Gates:** Siehe REPORT §5. Die Test-Umgebung wurde nur im Kindprozess angepasst: PG16 installiert, zwei Management-Variablen entfernt. Kein Test oder Guard wurde abgeschwächt.

## Grenzen der Diagnose

- Der Simulator bildet PostgreSQL-`ILIKE` als groß-/kleinschreibungsunabhängiges Unicode-Matching nach. Ein Collation-Sonderfall auf dem Hosted-Server ist damit nicht ausgeschlossen; ob er eine Rolle spielt, ist mit zwei `200 []` und ohne Zeilenzahlen je Teilabfrage nicht entscheidbar.
- Development-Zuordnung (R48-F3): Der Host-Ref von `NEXT_PUBLIC_SUPABASE_URL` wurde offline im Prozess mit dem in R48 genannten, freigegebenen Development-Branch-Ref verglichen; dieser ist auch der einzige Ref im TASK. Ergebnis **MATCH**, kein Wert ausgegeben. Die frühere Einschränkung („nicht vergleichbar“) ist damit erledigt.
- Abbildung, Rollenfilter und Ranking können echte Hosted-Zeilen ohne Fehler verwerfen, wenn deren Werte vom synthetischen Vertrag abweichen. Das ist mit den zwei Antworten nicht ausgeschlossen.
- Der Simulator ist eine Nachbildung, kein PostgREST. Er beweist die Abfrageform und den Code-Pfad, nicht den Hosted-Bestand.

## Offene Risiken

- QA-B für #955 bleibt blockiert, bis der Development-Katalog lesbar befüllt ist.
- Der Production-Bestand von `public.places` ist unbekannt; siehe proaktiver Hinweis im REPORT §3.
- Der eigene Lokal-Server auf `127.0.0.1:3107` ist seit der R48-Korrektur beendet; Port geschlossen, Worktree und Hilfsdateien entfernt (REPORT §8).
