# R2 — unabhängiger Quellenreview zum leeren ACL-Array

**8. November 2026. Root-Entscheid zur Quelle: STATIC_SOURCE_REVIEW_PASS / CORRECTED_SQL_NOT_EXECUTED.**

Dieser Record bindet den unabhängigen Root-Review an die unten genannten Dateien. Er ist keine Datenbankabnahme und kein vorweggenommener Exact-Head-/Ready-/Merge-Entscheid. Die separaten Reviewer-Empfehlungen, vollständigen PR-Gates und spätere tatsächliche Main-/Production-Verifikation werden im Korrektur-PR und den Live-Indizes [#917](https://github.com/Jetnity/jetnity/issues/917) / [#751](https://github.com/Jetnity/jetnity/issues/751) dokumentiert.

## Identität und Verantwortung

| Datei | Bytes | Zeilen | SHA-256 |
| --- | ---: | ---: | --- |
| public-private-catalog.sql | 24.271 | 448 | `a260b66efe49a54ff223b78298b995b5f9a9789cb9b04b9f821a25ae79479601` |
| README.md | 20.087 | 105 | `427a0c5cfeb3a97fb1dff894f98c23450b801737ad95757bf2ad285b723516bd` |

SQL-Git-Blob: `24468d8e164512c062dc4d84a2b998e4cd6518ac`; README-Git-Blob: `3a94e5d8c81812c5e5bdad2bd58bae63ad83465c`.

Basis: main/merge #1158 `299409102aadca55945fb376d364dbaa63f65b48`, Tree `c89ce55bbd1b63652d7a80ac94fb7f8dd1125dda`. Alter Source-Head: `7de58271a2cac2e8376b19c98e602b131c752b44`. Korrekturbranch: `fix/official-truth-human-readonly-audit-1-empty-acl-20261108`.

Einziger SQL-/README-Autor bleibt **Jetnity Official Truth Human Read-only Audit Preparation 1 — Codex Generation 1**, dieselbe Session `/root/human_audit_writer`. Der [R2-Auftrag](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6725519762) wurde vor der Korrektur veröffentlicht und exakt zurückgelesen; [R2_TASK.md](R2_TASK.md) ist seine exakte Kopie, SHA-256 `d5ed3a4adb1f799dd9d6b10f011aa86e763bc681c36630e0c4d172c4e4c86885`.

Root verantwortet Quellenreview, Publikation, sämtliche späteren PASS-/Ready-/Merge-Entscheide und Continuity. Die separaten Reviewer `/root/blocker_evidence_review` und `/root/release_live_audit` sind read-only; ihre Empfehlungen ersetzen den Root-Review nicht. Der Autor lieferte die eingefrorenen Dateien und stoppte. Es wird keine Cursor-UI-Umbenennung behauptet.

## Tatsächlicher Fehler und Korrektur der früheren Aussage

Der [Owner-Bericht 6725329847](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6725329847), veröffentlicht um **18:25:54 UTC**, meldet einen einmaligen menschlichen Lauf um **19:21 Europe/Zurich / 18:21 UTC** auf dem ausgewählten Dev/develop-Projekt mit unverändertem #1158-Skript. Ergebnis: **SQLSTATE 22023, ACL arrays must be one-dimensional, null Ergebniszeilen**. Der Owner berichtet READ ONLY, vollständigen Abbruch und keine Änderungen.

Root las den Kommentar und sah den zugehörigen Screenshot: develop/PREVIEW, die genannte Fehlermeldung, 0 rows und das Skriptende sind sichtbar. Der Screenshot zeigt weder den vollständigen ausgeführten Text noch eine exakte Projekt-Ref oder den tatsächlich abgeschlossenen Rollback. Der Fehler liefert keine erfolgreiche Katalogbaseline und beweist keine fehlenden Objekte oder Rechte.

Die nach diesem Bericht veröffentlichten Aussagen in [#917 / 6725364502](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6725364502) und [#751 / 6725378486](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6725378486), es liege kein menschliches Ergebnis vor, waren bereits bei Veröffentlichung falsch. **Root hat den Kommentar bei der damaligen Closure übersehen.** [Korrektur-Checkpoint 6725536973](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6725536973) und der R2-Auftrag berichtigen dies ausdrücklich. Der ursprüngliche R1-Record bleibt in [REVIEW.md](REVIEW.md) mit historischem Hinweis erhalten.

Der frühere Review verfehlte einen realen Funktionsvorvertrag. Eine erfolgreiche Syntaxprüfung und die reguläre Repository-CI hatten die neue Auditabfrage nicht ausgeführt. R1 ist **HUMAN_RUN_1_FAILED**; die neue korrigierte Version bleibt **CORRECTED_SQL_NOT_EXECUTED**. Die historische Aussage, dass keine KI diesen Auditlauf ausgeführt hat, bleibt richtig.

## Unabhängig hergeleitete Ursache

Der Spaltenzweig erzeugt bei NULL-Spalten-ACL ein allgemeines `ARRAY[]::pg_catalog.aclitem[]`. PostgreSQLs allgemeiner Leerkonstruktor erzeugt dabei ein Array mit null Dimensionen. `aclexplode` ruft vor seiner ersten Iteration `check_acl` auf; dieses verlangt genau eine Dimension und erzeugt sonst genau die gemeldete Fehlermeldung.

Nicht jedes leere interne ACL-Array besitzt dieselbe Repräsentation: PostgreSQLs eigener ACL-Allokator kann eine eindimensionale ACL mit null Einträgen erzeugen. Diese ist akzeptabel und liefert ebenfalls keine Rechtezeile. Die Korrektur behandelt beide leeren Repräsentationen nach ihrer Eintragszahl; sie behauptet nicht, jedes leere ACL-Array sei von PostgreSQL verboten.

Die Source-Evidence erklärt den Defekt und passt zum gemeldeten Fehler. Welches konkrete Katalogobjekt im menschlichen Lauf zuerst betroffen war, wird daraus nicht erfunden.

## Genau eine SQL-Änderung

Der einzige zentrale Aufruf lautet jetzt:

```sql
CROSS JOIN LATERAL pg_catalog.aclexplode(
  CASE WHEN pg_catalog.cardinality(s.acl) OPERATOR(pg_catalog.=) 0::pg_catalog.int4
    THEN NULL::pg_catalog.aclitem[]
    ELSE s.acl
  END
) AS a
```

Das sichere Argument entsteht unmittelbar am Aufruf; die Korrektur setzt keine vorgelagerte WHERE-Auswertungsreihenfolge voraus. Es gibt keine zweite Default-Auflösung hinter dem Guard. `cardinality` ist ein bereits verwendetes Built-in. Es zählt die Dimensionen/Einträge, ohne ACL-Inhalte umzuschreiben oder fremde Typausgabefunktionen aufzurufen. `aclexplode` ist in den geprüften Katalogdefinitionen STRICT und SETOF: Bei NULL wird sein Funktionskörper nicht aufgerufen und die Ausgabe ist die leere Menge, keine einzelne NULL-Zeile.

| Fall | Erhaltene Bedeutung |
| --- | --- |
| NULL bei Schema, Relation/Sequenz oder Routine | Die bisherigen vorgelagerten Objektdefaults bleiben unverändert, einschliesslich Sequenzcode `s`. |
| NULL bei Spalten-ACL | Keine separaten Spaltengrants; Spalte und NULL-Marker bleiben im Inventar. |
| Explizit leere ACL aus jeder der fünf Quellen | Keine Grant-Zeile; niemals Ersatz durch Defaultrechte. Vorhandene NULL-Marker bleiben erhalten. |
| Leere Default-ACL | Das Objekt bleibt in `default_acl_objects`; seine Expansion erfindet keine Rechte. |
| Eindimensionale interne leere ACL | Weiterhin null Einträge, ohne semantischen Unterschied im Bericht. |
| Nichtleere gültige ACL | Dasselbe Array erreicht den bisherigen Decoder; alle Grantor-/Grantee-/Rechte-/Grant-Option-Informationen bleiben erhalten. |
| Nichtleeres Array mit ungültiger Dimension oder NULL-Elementen | Unveränderte Weitergabe; PostgreSQLs Validierungsfehler wird nicht in scheinbar fehlende Rechte umgedeutet. |
| Unmittelbares NULL-Argument | `cardinality(NULL)` bleibt NULL; ELSE bleibt NULL; STRICT/SETOF liefert keine Zeile. |
| Effektive Spaltenrechte durch Tabellenrechte | Die separate effektive Rechtematrix bleibt vollständig unverändert. |

## Tatsächlicher nichtausführender Review

Root las SQL, vollständiges README und den vollständigen Diff selbst. Der SQL-Diff ersetzt genau eine Zeile durch acht Zeilen einschliesslich zweier erklärender Kommentare. Ausserhalb dieser einen Stelle bleiben die Bytes identisch. Alle fünf ACL-Quellen, 16 Ausgabeabschnitte, Objekt-/NULL-Marker, Defaults, Referenzrollen, effektiven Rechte und Fingerprint-/Redaktionspfade bleiben unverändert.

Der unabhängige pglast-8.7-Parse mit PostgreSQL-Parser 18.6 akzeptiert genau drei Statements: BEGIN READ ONLY, SELECT, ROLLBACK. Der unveränderte begrenzte AST-/Allowlist-Checker ergibt keine Findings und besteht erneut seine 14 nichtausführenden Kontrollen. Inventar: 23 unterschiedliche qualifizierte Built-ins, 14 Katalogrelationen/-views, 137 explizite qualifizierte Casts und 52 qualifizierte Operator-Knoten einschliesslich Sortoperator. Keine neue Funktions-/Relations-/Typ-/Operatorart kommt hinzu.

Ein zusätzlicher struktureller Vergleich ersetzt im neuen Parserbaum ausschliesslich dieses eine Funktionsargument durch das alte. Nach Entfernung der reinen Parserpositionsfelder `location`, `stmt_location`, `stmt_len`, `list_start` und `list_end` sind beide vollständigen Bäume identisch. Das belegt den begrenzten strukturellen Diff, keine Laufzeitsemantik.

Root hat zusätzlich die folgenden unveränderlichen offiziellen PostgreSQL-Quellstände direkt gelesen. Für jede Version wurden `src/backend/utils/adt/acl.c`, `arrayfuncs.c`, `src/include/catalog/pg_proc.h`, `pg_proc.dat` und `src/backend/executor/execSRF.c` geprüft. Dimensionsprüfung, allgemeiner Leerkonstruktor, native ACL-Allokation, cardinality, STRICT-Katalogdefault und NULL-Verhalten des Executors stimmen für diesen Pfad überein.

| PostgreSQL-Branch | Geprüfter offizieller Commit |
| --- | --- |
| REL_15_STABLE | [21a53865fb5a199fc7f234a9f9fce5608a39e581](https://github.com/postgres/postgres/tree/21a53865fb5a199fc7f234a9f9fce5608a39e581) |
| REL_16_STABLE | [e9c45974adb439fcc6fee6175e11f92619fc5361](https://github.com/postgres/postgres/tree/e9c45974adb439fcc6fee6175e11f92619fc5361) |
| REL_17_STABLE | [e6b2f7c2b41d6261dac15825dede55e94ca35614](https://github.com/postgres/postgres/tree/e6b2f7c2b41d6261dac15825dede55e94ca35614) |
| REL_18_STABLE | [1da6ddbdc32c5bf640429828bc0353ffcb40628e](https://github.com/postgres/postgres/tree/1da6ddbdc32c5bf640429828bc0353ffcb40628e) |

Weitere Primärreferenzen: [Array-Funktionen](https://www.postgresql.org/docs/17/functions-array.html), [Auswertungsreihenfolge](https://www.postgresql.org/docs/17/sql-expressions.html#SYNTAX-EXPRESS-EVAL), [CASE-Grenzen](https://www.postgresql.org/docs/17/functions-conditional.html). Das ist Quellinspektion; weder dieser Abgleich noch die Parserkontrollen planen oder führen SQL aus. Die tatsächliche Hosted-Version und Symbolauflösung wurden nicht abgefragt.

## Grenzen und verbleibende Gates

R2 erweitert weder Datenzugriff noch Ausgabe. BEGIN READ ONLY, einzelner Katalog-SELECT und ROLLBACK bleiben erhalten; keine Anwendungs-/Auth-/Session-/Ledger-Zeilen, DML/DDL/Rechteänderungen oder Anwendungscode-Aufrufe kommen hinzu. Die bisher dokumentierten Grenzen von rohen Fingerprint-Eingängen, Encoding, RLS-/Authority-Semantik, MAINTAIN-Abdeckung, Zielattestation und Transaktionsabschluss gelten unverändert.

**Keine KI hat das Audit-SQL gegen irgendeine Datenbank ausgeführt.** Der vom Owner reservierte menschliche Erstlauf ist fehlgeschlagen; für R2 liegt bei diesem Quellenfreeze kein Laufresultat vor. Bestehende synthetische Repository-CI darf nicht als Ausführung dieser Auditdatei bezeichnet werden.

Issue #917 bleibt OPEN: historischer Stage1-Apply APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, installierte Ledger-ID UNKNOWN, Stage2 NOT_ATTEMPTED. Issue #1139 bleibt OPEN; PR #1131 behält seinen eigenständigen Hold. Keine Sperrenauflösung, neuer Ausführungsweg, Migration, Rollen-/Rechteänderung, Source-/Provider-/Production-/Feature-Aktivierung wird aus diesem Review abgeleitet.

Die endliche Quellenkorrektur beseitigt den nachgewiesenen P2-Vorvertragsfehler. Eine erfolgreiche tatsächliche R2-Ausführung und danach belastbare fachliche Baselinebewertung bleiben offen. Alle neuen PR-/Main-/Deployment-Gates sind zusätzlich erforderlich. Nur Root darf nach den vollständigen unabhängigen Gates Ready setzen oder regulär mergen; Autor STOP, kein automatischer Folgeslice.
