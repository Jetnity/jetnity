# Jetnity — menschlicher Katalogaudit für `public` und `private`

**Stand: 8. November 2026. Autorenlieferung: `SOURCE_PREPARATION / SQL_NOT_EXECUTED`.**

Dies ist das konkrete SQL-Artefakt zum [Owner-Auftrag](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6720761325) und zum [versionierten TASK V1](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6724680370). Die Datei `public-private-catalog.sql` enthält ausschliesslich `BEGIN READ ONLY;`, eine Katalogabfrage mit lesenden CTEs und `ROLLBACK;`. Es gibt keinen Runner, keine Verbindungsdaten und keine Einbindung in Migrationen, Anwendung oder CI.

Autor: **Jetnity Official Truth Human Read-only Audit Preparation 1 — Codex Generation 1**, Session `/root/human_audit_writer`. Ausgangsbasis ist main `b4a5afb95f6c4c39842755ddbe780128348ca0a5`, Tree `d09865e91093960026a61e003b43c78342b6a43a`. Die unabhängige TL-Abnahme und die unveränderlichen Dateihashes werden separat an die tatsächlich geprüften Bytes gebunden; diese Autorenlieferung ersetzt sie nicht.

## Umfang und Ergebnisform

Die Abfrage erzeugt **eine JSON-Zeile** mit 16 ausdrücklich benannten Abschnitten. Jeder Abschnitt enthält `row_count` und `records`; auch leere Abschnitte sind vorhanden. `schemas` enthält immer je einen Eintrag für `public` und `private` mit eigenem `exists`. Ein fehlendes Schema ist deshalb von einem vorhandenen, leeren Schema unterscheidbar. Die sechs fest benannten Rollen sind ebenfalls mit `exists` aufgeführt; fehlende Rollen erzeugen keine scheinbar negativen Berechtigungsnachweise.

| Abschnitt | Erfasste Metadaten |
| --- | --- |
| `schemas`, `principals` | Existenz, OIDs, Schemaeigentum; Status der festen Rollen `anon`, `authenticated`, `service_role`, `postgres`, `authenticator`, `supabase_admin` |
| `relations`, `columns` | Tabellen, Partitionstabellen, Views, Materialized Views, Foreign Tables und Sequenzen; RLS-Flags, Eigentümer, Spaltennummern/-typen, Null-/Identity-/Generated-Metadaten; nur ausdrücklich geprüfte Optionsmarker |
| `policies`, `routines` | Policy-Operation/-Rollen, vorhandene USING-/WITH-CHECK-Ausdrücke; Routinenarten, Typ-OIDs, Sprache, Security-Definer-/Volatilitäts-/Parallelitätsmerkmale und Search-Path-Metadaten |
| `acl_entries`, `default_acl_objects` | ACLs für Schema, Relation, Spalte und Routine; getrennte Default-ACLs für künftige Objekte, einschliesslich globaler Defaults |
| `role_inheritance`, `effective_privileges` | Mitgliedschaft und aktuell geerbte Rechte gegenüber referenzierten Rollen; tatsächliche ACL-Rechte der sechs festen Rollen auf Schema, Relation, Sequenz, Spalte und Routine |
| `constraints`, `triggers`, `indexes`, `rewrite_rules` | Lokale Struktur-/FK-/Trigger-/Index-/View-Regel-Metadaten; referenzierende Fremdschlüssel werden auch über ihre numerischen Verweise erfasst |
| `dependencies`, `fingerprints` | Relevante `pg_depend`-Kanten als OIDs und Fingerabdrücke ausdrücklich benannter roher Katalogfelder |

Unbekannte Objekt- und Rollennamen werden nicht ausgegeben. Objekte bleiben über Katalogklasse/OID und gegebenenfalls Spaltennummer unterscheidbar. Nur wenige feste, aus dem Repository bekannte Relations-/Funktions-/Spaltennamen und vier feste Sprachnamen dürfen als lesbare Bezeichnung erscheinen. Ein Name ist keine Bestätigung seiner Implementation. Policy-, Trigger-, Constraint- und Indexnamen werden vollständig weggelassen. Die Rollen-OID `0` (JSON `"0"`) bezeichnet bei ACLs beziehungsweise Policy-Rollen die Sammelrolle `PUBLIC`, kein Benutzerkonto.

PostgreSQL serialisiert die hier verwendeten OID-Werte als dezimale **JSON-Strings**, beispielsweise `"1259"`; das gilt auch für die Elemente von `oid[]`. Integer-Spaltennummern, Zähler und Integer-Arrays bleiben JSON-Zahlen, die Flags JSON-Booleans und SQL-NULL JSON-null. OIDs sind opake Objektidentitäten, keine Namen oder Sicherheitsurteile; ihre Stringdarstellung darf nicht mit fehlenden Werten verwechselt werden.

## Schreibfreiheit und vertrauliche Inhalte

Die Quellprüfung muss die tatsächliche Abfrage bewerten, nicht lediglich ihre Transaktionsüberschrift. PostgreSQLs READ-ONLY-Modus allein verhindert nicht jede denkbare Nebenwirkung. Dieses Artefakt verwendet nur ausdrücklich qualifizierte Systemkataloge und feste Built-ins; alle ausdrücklich verwendeten Vergleichsoperatoren und Typcasts sind ebenfalls an `pg_catalog` gebunden. Es liest keine Anwendungsrelation, auch keine View, und ruft keine darin gespeicherte Funktion, Policy, Constraint-, Default-, Trigger- oder Indexexpression auf.

Nicht enthalten sind DML, DDL, Rechte-/Rollen-/Konfigurationsänderungen, schreibende CTEs, SELECT INTO, COPY, DO/CALL/EXECUTE, explizite Locks, Sequenzaufrufe, Datei-/Netzwerkfunktionen, Erweiterungen, dynamisches SQL oder eine Abfrage von Auth-/Session-/Migration-Ledger-Zeilen. Es werden keine fremdtypigen Katalogwerte wie `attmissingval` oder Statistikwerte serialisiert. Kein ganzer Katalogdatensatz wird pauschal in JSON umgewandelt.

Rohtexte von Funktionskörpern, Argumentdefaults, Policy-/Constraintausdrücken, Triggerargumenten, View-Regeln und Konfigurationen erscheinen ausschliesslich im internen Fingerprint-Eingang. Sie werden weder ausgeführt noch als Text ausgegeben. Decompiler wie `pg_get_functiondef`, `pg_get_expr` und `format_type` werden nicht verwendet. Es werden keine Anwendungs-, Auth-/Session- oder Secret-Store-Zeilen gelesen; Kommentare werden nicht abgefragt. Die ausgewählten rohen Katalogtexte sind jedoch inhaltlich nicht als geheimnisfrei geprüft: Sie können eingebettete Schlüssel, Tokens oder personenbezogene Literale enthalten und werden intern für Fingerabdrücke verarbeitet. Weder diese Rohdefinitionen und Konfigurationen noch freie Login-Namen oder unbekannte Bezeichner werden ausgegeben. Die Reduktion auf Hashwerte ist kein Geheimnisfreiheitsnachweis. Die Abfrage setzt unveränderte, vertrauenswürdige PostgreSQL-Systemkataloge und Built-ins voraus; sie attestiert keinen möglicherweise manipulierten Datenbankserver.

Das JSON meldet den tatsächlich beobachteten Read-Only-Zustand. Ist dieser nicht hergestellt, liefert es `refused_read_only_not_established` ohne Katalogbericht. Das spätere `ROLLBACK` kann nicht schon durch die zuvor erzeugte JSON-Zeile bewiesen werden. Auch eine bereits offene äussere Transaktion wird durch den Quelltext allein nicht ausgeschlossen: `BEGIN` kann darin wirkungslos sein und `ROLLBACK` diese äussere Transaktion beenden. Die vollständige Transaktionsgrenze gehört deshalb zur gesonderten Ausführungsevidenz.

## Genaue Bedeutung der Fingerabdrücke

`fingerprints` verwendet SHA-256 über die UTF-8-Bytes der PostgreSQL-JSONB-Textdarstellung des folgenden **geordneten Arrays**. SQL-NULL bleibt JSON-null; es wird nicht mit einem leeren String zusammengefasst. Jede Identität besteht aus `object_kind`, `object_oid` und `sub_id`.

| `object_kind` | Eingangsarray, in dieser Reihenfolge |
| --- | --- |
| `routine` | `prosrc`, `probin`, `prosqlbody::text`, `proargdefaults::text`, `proconfig`, `proargnames` |
| `policy` | `polqual::text`, `polwithcheck::text` |
| `column_default` | `adbin::text` |
| `constraint` | `conbin::text` |
| `trigger` | hexadezimales `tgargs`, `tgqual::text` |
| `index` | `indexprs::text`, `indpred::text` |
| `rewrite_rule` | `ev_qual::text`, `ev_action::text` |
| `relation_options` | `reloptions` |

Die Struktur- und Sicherheitsmerkmale in den übrigen Abschnitten sind zusätzlich zu vergleichen. Ein `routine`-Fingerprint ist ausdrücklich **kein Hash einer vollständigen SQL-Funktionsdefinition**, keine Signatur, kein Geheimnisfreiheitsnachweis und kein Beweis richtiger Autorisierungslogik. Rohes PostgreSQL-Ausdrucksformat, OIDs und JSON-Darstellung können sich zwischen Serverversionen oder Installationen ändern. Gleiche oder verschiedene Hashes ersetzen daher weder eine fachliche Definitionenprüfung noch den Abgleich mit dem konkreten freigegebenen SQL-Artefakt.

`textsend` kann über `pq_sendtext` eine Client-Encoding-Konvertierung aufrufen. Deshalb liegt der einzige Hashpfad hinter einer `CASE`-Bedingung, die **Server- und Client-Encoding jeweils exakt `UTF8`** verlangt. Nur dann werden `textsend`, `sha256` und `encode` erreicht. Andernfalls bleiben alle Fingerprints NULL, die beiden Encoding-Flags sind sichtbar und `report_status` lautet `partial_fingerprints_unavailable_encoding`. Es gibt keinen Fallback und keine Änderung von Einstellungen. Die geprüften PostgreSQL-Quellen sind [textsend](https://doxygen.postgresql.org/varlena_8c_source.html), [pq_sendtext](https://doxygen.postgresql.org/pqformat_8c_source.html) und [Encoding-Konvertierung](https://doxygen.postgresql.org/mbutils_8c_source.html).

## Was das Artefakt nicht bestätigt

Die Rechtefunktionen prüfen Katalogberechtigungen, keine wirkliche Zeilensichtbarkeit und keine wirksame Nutzer-/Owner-/AAL2-/Sessionentscheidung. `MEMBER` und `USAGE` werden getrennt ausgegeben; die Mitgliedschaft allein ist keine Aussage über gegenwärtig geerbte Rechte. Die effektive Rechtematrix ist auf die sechs ausdrücklich aufgeführten Rollen und die folgenden Rechte begrenzt: Schema **USAGE/CREATE**; Relationen **SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER**; Sequenzen **USAGE/SELECT/UPDATE**; Spalten **SELECT/INSERT/UPDATE/REFERENCES**; Routinen **EXECUTE**. **MAINTAIN ab PostgreSQL 17 wird in dieser effektiven Matrix nicht ausgewertet.** Das fehlende Feld bedeutet keine negative Berechtigungsentscheidung. `acl_entries` kann entsprechende Grants aus expliziten ACLs beziehungsweise Objektdefaults enthalten; dies ist keine vollständige effektive MAINTAIN-Prüfung. Rollenwechsel, beliebige andere Anmeldeidentitäten, Daten-API-/GraphQL-Exposition, Auth-Konfiguration und dynamische SQL-Abhängigkeiten sind nicht vollständig erfasst.

Ein NULL-Objekt-ACL wird mit dem PostgreSQL-Objektdefault ausgewiesen. Separate Default-ACLs beeinflussen die Erstellung zukünftiger Objekte und sind keine rückwirkende Änderung bestehender Rechte. Eine NULL-Spalten-ACL ist kein Nachweis fehlender Tabellenrechte; die zusätzliche effektive Spaltenmatrix berücksichtigt vorhandene Tabellenrechte. RLS-Flags und Policy-Präsenz allein sind kein RLS-Verhaltenstest. Optionsmarker einer View sind Präsenzangaben für die exakt genannten Werte, keine allgemeine Sicherheitsbewertung. Der `pg_depend`-Ausschnitt ist keine vollständige Analyse von Funktionskörpern, impliziten beziehungsweise dynamischen Abhängigkeiten oder allen Shared Dependencies.

Die beabsichtigte spätere Development-Zuordnung ist `yfvbxvijcorffwxbxahl`. Die SQL-Ausgabe behauptet keine tatsächliche Projektidentität: `actual_project_identity` bleibt `not_attested_by_sql`. Die Produktionsreferenz wird nicht als Ziel verwendet. Es wird keine Live-Ausführung, keine Supabase-Sperrenauflösung, keine neue Ledger-ID oder installierte Version behauptet.

Der frühere Stage1-Apply bleibt `APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING`, seine tatsächliche Ledger-ID UNKNOWN und Stage2 `NOT_ATTEMPTED`. Die Original-Nachprüfung umfasst auch Migration-History und semantisch ausreichende Definitions-/Autoritätsnachweise, die dieses engere public/private-Metadatenartefakt nicht vollständig liefert. #1139, der eigenständige #1131-Hold und die echten Quellen-/Ziel-/Aktivierungsgates bleiben offen. Ein vorhandenes oder später geliefertes Auditresultat ist kein automatischer Abschluss dieser Punkte.

## Bewertung eines später tatsächlich gelieferten menschlichen Ergebnisses

Ein menschliches Ergebnis kann technische Evidence sein. Für eine belastbare Bewertung fehlen bis zu seiner tatsächlichen Lieferung insbesondere:

1. Die unveränderte, unabhängig geprüfte Skriptversion mit Commit-/Dateiidentität und SHA-256; kein ausgeschnittener oder ergänzter SQL-Text.
2. Ein unabhängiger, bereinigter Nachweis der tatsächlichen Development-Projektzuordnung. Die im Skript dokumentierte Absicht oder eine Datenbankbezeichnung genügt dafür nicht; Zugangsdaten werden nicht benötigt oder angefordert.
3. Ausführungszeit, das vollständige ungekürzte Ergebnis mit allen 16 Abschnitten und passenden Zeilenzahlen sowie sämtliche Fehler-/Abbruchmeldungen. Der beobachtete Epoch-Wert ist UTC-basiert, jedoch keine unabhängige Zeitattestation.
4. Das vollständige Transaktionsprotokoll einschliesslich tatsächlich hergestelltem Read-Only-Modus und abschliessendem Rollback. Die JSON-Ausgabe allein kann den späteren Rollback nicht belegen.
5. Ein unabhängiger Vergleich mit den erwarteten, ausdrücklich ausgewählten Verträgen und eine Bewertung von Abweichungen und nicht erfassten Bereichen.

Fehlende oder abgeschnittene Evidence bleibt unvollständig. `metadata_only` beschreibt lediglich die Art der gelieferten Daten; `database_security_verdict` bleibt ausdrücklich `not_assessed`. Ein erfolgreicher menschlicher Lauf erteilt keiner KI zusätzliche Zugriffsrechte und ist keine pauschale Plattformfreigabe oder Produktaktivierung. Diese Dokumentation enthält keinen alternativen Ausführungs- oder Zugangsweg.

## Tatsächliche Verifikation dieser Autorenlieferung

Die SQL-Datei wurde **nicht gegen eine Datenbank ausgeführt**. Der ausschliesslich lokal arbeitende PostgreSQL-Parser **pglast 8.7** hat den Quelltext syntaktisch akzeptiert: genau drei Top-Level-Statements, `TransactionStmt(BEGIN READ ONLY)`, `SelectStmt`, `TransactionStmt(ROLLBACK)`.

Das ist eine Syntaxprüfung ohne SQL-Planung, Katalogauflösung, Berechtigungsprüfung oder Laufzeitbeweis. Die verwendeten Katalogfelder sind für PostgreSQL 15–18 vorgesehen; tatsächliche Serverversion und Ausführbarkeit im konkreten Ziel sind unbestätigt. Runtime-, RLS- und Migrationsabnahme bleiben `NOT_EXECUTED`. Root und ein unabhängiger Reviewer prüfen die genauen Dateibytes, sämtliche Ausgabewege und den Built-in-/Operator-/Cast-Umfang vor einer separaten statischen Abnahme. Der Autor setzt weder Ready noch Merge und startet keinen Folgeslice.

Grundlagen: [PostgreSQL READ ONLY](https://www.postgresql.org/docs/current/sql-set-transaction.html), [Berechtigungs- und Kataloginformationsfunktionen](https://www.postgresql.org/docs/current/functions-info.html), [pg_proc](https://www.postgresql.org/docs/current/catalog-pg-proc.html), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Diese Quellen sind Referenzen für die Prüfung, keine Evidence über Jetnitys installierte Datenbank.
