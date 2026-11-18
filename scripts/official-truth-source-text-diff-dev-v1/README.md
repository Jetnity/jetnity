# Official Truth – geschützter Dev-Quellenvergleich V1

**Stand:** 18.11.2026, vorerst **manuell ausführbarer, nur lesender Dev-Worker**. Er setzt den offline geprüften Textvergleich aus [#1241](https://github.com/Jetnity/jetnity/pull/1241) auf zwei von Supabase Dev tatsächlich gespeicherte Originalversionen an; Voraussetzung ist die unveränderliche Quellensicherung aus [#1236](https://github.com/Jetnity/jetnity/pull/1236). **Kein KI-/Bot-Aufruf, kein automatischer Cron, keine rechtliche Freigabe.**

## So bleibt der echte private Quellenbeleg geschützt

- Das Skript akzeptiert nur `--entwicklung --familie SIX|FOUR --ziel XX --quelle source-key`. Es erzwingt `SUPABASE_PROJECT_REF=yfvbxvijcorffwxbxahl` und prüft über die **bereits vorhandene** `scripts/auth/ziel.ts`-Grenze, dass die Management-API tatsächlich einen **Development-Branch** erkennt. Keine Produktion und keine alternative Ref.
- Es verwendet die **bereits vorhandenen** Umgebungsvariablen `SUPABASE_ACCESS_TOKEN` und `SUPABASE_PROJECT_REF` und das vorhandene read-only `scripts/db/sql.mjs`; kein Schlüssel wird angelegt, gespeichert, ins Terminal kopiert oder an ein Modell geschickt.
- Für genau eine ausgewählte amtliche registrierte Quelle führt es eine feste **SELECT-only**-Abfrage aus. Der Abruf hat `LIMIT 1` und liest aus den privaten PostgreSQL-Tabellen nur den ersten nachgewiesenen Quelltext, das begrenzte spätere geänderte Sample und den neuesten Monitoring-Beleg; er erstellt keine DB-Zeile und ruft keine Behördenseite neu ab.
- Der **gesamte** Originalinhalt muss zu den unveränderlichen Monitoring-Hashes, Bytezahlen und passender Quellen-/Batch-Identität passen. Für `FOUR` wird der ursprüngliche Archivtext **zusätzlich** exakt an einen tatsächlich beobachteten initialen `unqualified_snapshot`-Hash gebunden. Kann dieser Nachweis nicht erbracht werden, bleibt die Quelle **gesperrt**.
- Der vorhandene `parse5`-Vergleich extrahiert im Speicher getrennte Text-, Link-/Formular- und übrige HTML-Änderungsfingerprints. Ergebnis: **nur neutrale Hash-/Zählwerte**, `legalRuleApproved=false`, `publicationAllowed=false`, `acceptedFacts=0`; niemals Originaltexte, URLs, Passnummern, SQL-Fehlermeldungen, Token oder KI-Prompts.
- Ein tägliches Sample kann **älter** als der neueste amtliche Abruf sein; in diesem Fall wird ausdrücklich `HISTORICAL_SAMPLE_NOT_CURRENT` ausgegeben. Ein aktuelles Sample heisst immer noch `LATEST_SOURCE_SAMPLE_RESEARCH_ONLY`, **nicht** aktuelle amtliche Einreisebestimmung.

## Ausführung (nur innerhalb einer bereits berechtigten Dev-Umgebung)

```sh
node --import tsx scripts/official-truth-source-text-diff-dev-v1/run-dev.ts --entwicklung --familie SIX --ziel TH --quelle thai-tdac
node --import tsx scripts/official-truth-source-text-diff-dev-v1/run-dev.ts --entwicklung --familie FOUR --ziel IT --quelle primary
```

Nur mit bereits vorhandener, **separat sicher verwalteter** Supabase-Management-Umgebung. Keine Zugangsdaten in Chat, Issue, Log oder Skript. Wenn der Token/Dev-Branch fehlt, wird *vor* dem eigentlichen Quellenabruf kontrolliert abgebrochen. Die CLI darf **nicht** im öffentlichen Vercel-Request-/Besucherpfad, mit Produktions-Ref oder als frei erreichbarer HTTP-Endpunkt verwendet werden.

## Echte Dev-Vorabtests (kein KI-Test)

Am 18.11.2026 wurde in Supabase Development der gleiche Quelle/Batch-/SHA-/Original-Join **read-only** überprüft, ohne den Behördentext in Chats/Logs auszugeben:
- **SIX, TH/TDAC:** erstes archiviertes Original und späteres Sample sind SHA-/Byte-konsistent, aber der neueste Quellenmonitor kennt bereits einen späteren Batch ⇒ **historische Probe**, keine aktuelle Rechtsaussage.
- **FOUR, IT/PT:** ihre archivierten Ausgangstexte stimmen mit dem tatsächlich überwachten ersten Quelle-SHA überein.
- **FOUR, FR:** das archivierte erste Original ist **nicht** identisch mit dem ersten Monitoring-`unqualified_snapshot`. **Dieser Worker verweigert daher diese Paarbildung**, bis durch einen separaten amtlichen Provenienz-/Abrufnachweis die Diskrepanz geklärt wurde. Kein stilles Ersatzdatum/-hash.
- Grenztests gegen falsche Quellenkennung, mehrdeutige Zeilen, manipulierte Bytes/SHA, ungültiges base64, falsche Rollen, stale Latest-Status und neue Veröffentlichungsbefugnisse bleiben negativ. Neue positive Rechtsregeln: **0**.

Das eigentliche Node-Skript kann nur in einer bereits mit **Dev-PAT** versorgten, geschützten Laufumgebung ausgeführt werden. Ein echter Dev-MCP-`SELECT` beweist die Datenbank-Query, **nicht** die erfolgreiche Node-CLI-Ausführung; letzteres muss zusätzlich anhand eines tatsächlich beendeten Node-Runs dokumentiert werden. Für Live-KI-Inhaltsprüfung braucht es danach separat genehmigte Modellkosten, Datenschutz, Zitatprüfung, MA1-/BG1-Freigabemethode und Owner-Gates.

## Release

Der Branch beruht auf dem noch nicht gemergten [#1241](https://github.com/Jetnity/jetnity/pull/1241); der neue PR muss bis zu dessen Merge **auf diesen Branch** zeigen. Es gibt **keine** neue Migration, keine Erweiterung von Supabase-Rollen/Grants, keine Secrets, keine Provideraktivierung, keinen Cron und keine Production-Mutation. Merges bleiben ausschließlich beim Owner.
