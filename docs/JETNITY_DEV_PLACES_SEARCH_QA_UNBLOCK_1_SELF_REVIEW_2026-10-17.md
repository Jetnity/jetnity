# Development Places Search QA Unblock 1 — SELF_REVIEW

**Autor-Selbstprüfung. Kein Technical-Lead-PASS.**

## T10 Audit

- **Pfade:** Nur `lib/places/qa-unblock-1/**`, die vier TASK-eigenen Docs und `docs/evidence/jetnity-dev-places-search-qa-unblock-1/**`. Die TASK-Datei ist unverändert (Blob `b214661d…`). Keine Produktdatei, kein #955-Pfad, keine globale Continuity-Datei.
- **Source-Integrität:** Die zwei Mutationsproben an `lib/places/suche.ts` wurden aus einer Sicherung zurückgespielt; `git status` zeigt danach keine Änderung an versionierten Dateien. Die vom Start-Skript erzeugte `next-env.d.ts`-Drift wurde verworfen, nicht committet.
- **Sanitization:** Kein Projekt-Ref, kein Key, kein Token, keine Header außer `content-type`/`cache-control`, keine Antwortkörper außer der Länge, keine Server-Logs, keine Personendaten. Die Evidence nennt nur die Namen der Environment-Variablen.
- **Wahrheit:** Zwei leere Antworten werden nicht als „Tabelle leer“ ausgegeben. Der Import vom August und `with_data=false` stehen nur als Hypothesen.
- **Gates:** Siehe REPORT §5. Die Test-Umgebung wurde nur im Kindprozess angepasst: PG16 installiert, zwei Management-Variablen entfernt. Kein Test oder Guard wurde abgeschwächt.

## Grenzen der Diagnose

- Der Simulator bildet PostgreSQL-`ILIKE` als groß-/kleinschreibungsunabhängiges Unicode-Matching nach. Ein Collation-Sonderfall auf dem Hosted-Server ist damit nicht ausgeschlossen. Er würde aber nicht alle sechs Lesungen leeren, darunter `keywords ILIKE '%zurich%'` mit reinem ASCII.
- Dass `NEXT_PUBLIC_SUPABASE_URL` auf denselben Ref zeigt wie `SUPABASE_PROJECT_REF`, ist geprüft. Dass dieser Ref derselbe redigierte `develop`-Branch aus R46 ist, ist hier nicht vergleichbar, weil beide Werte redigiert sind. `ARCHITECTURE.md` dokumentiert `SUPABASE_PROJECT_REF` als Development-Branch.
- Der Simulator ist eine Nachbildung, kein PostgREST. Er beweist die Abfrageform und den Code-Pfad, nicht den Hosted-Bestand.

## Offene Risiken

- QA-B für #955 bleibt blockiert, bis der Development-Katalog lesbar befüllt ist.
- Der Production-Bestand von `public.places` ist unbekannt; siehe proaktiver Hinweis im REPORT §3.
- Der Lokal-Server auf `127.0.0.1:3107` läuft noch (tmux `places-qa-dev`). Er bindet nur an Loopback und nutzt nur den öffentlichen Anon-Key.
