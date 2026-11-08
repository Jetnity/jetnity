## TASK DEV-PACKAGE-1 V1 — prüfbares #1139-Dev-Paket und Stage1-Abnahmebericht #917

**8. November 2026, neuer ausdrücklicher Owner-Auftrag im laufenden TL-Chat.** Sasa bestätigt: **Keine weiteren alten Belege vom damaligen Stage1-Lauf vorhanden.** Diese historische Lücke wird dokumentiert; sie wird weder durch einen neuen Screenshot nachgestellt noch mit dem erfolgreichen Run2 verwechselt. Bestehende Apply-Quittung und anerkanntes Run2 bleiben gültige Evidence ihres Umfangs.

Owner beauftragt jetzt ausdrücklich das prüfbare Dev-Paket (Version, genaue Änderungen, Review, Nachprüfung, Rollback-/Recovery-Plan) und den Stage1-Abnahmebericht. Dies autorisiert die konkrete Vorbereitung und Repository-Persistierung, **keinen echten DB-/Auth-/RLS-Apply, keine Wiederholung/Umleitung der verweigerten #917-Nachprüfung und keine Aktivierung**. Eine menschliche Ausführungsanleitung wird nur geliefert, wenn ein tatsächlich zulässiger, vollständig gebundener und freigegebener Schritt vorliegt. Kein neuer allgemeiner Permission-Dialog.

### Frische Basis
- main **608414441651b407cf56ab976c1cd116db45de0c**, Mode NORMAL.
- [Run2-TL-Review6726637224](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6726637224), [#1139-Teilbaseline6726648045](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6726648045), [Continuity6726660349](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6726660349).
- Keine neuere Issue-Evidence bei Start; zwölf bestehende offene PRs sämtlich Draft, kein kollidierender Paket-Writer.
- #1142 ist bereits implementiert/gemergt/nativ geprüft und bleibt außerhalb kanonischer Apply-Pfade. Kein Neubau dieser Implementierung.
- #917 Stage1 APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING mit positiv anerkannten Definition-/Konfiguration-/ACL-Teilnachweisen; Ledger UNKNOWN. Stage2 NOT_ATTEMPTED im dokumentierten Ablauf, aktuelle Abwesenheit nicht aus Run2 beweisbar.
- #1139 OPEN/P1; Accepted Store SQL_UNAPPLIED / FEATURE_NOT_LIVE. #1131 und besondere PO-/Quelle-/Ziel-/Production-Gates bleiben.

### Rollen und Ownership
Single package author: **Jetnity Official Truth Dev Decision Package 1 — Codex Generation 1**, neue vorgesehene Session **/root/dev_package_writer**. Dies ist kein Cursor-UI-/Rename-Nachweis. Cursor bleibt gemäß bestehender Continuity pausiert.
Root erstellt Stage1-Abnahmebericht, Task, endgültige Hash-/Quellenmanifest- und Review-Evidence und entscheidet allein über Abnahme/Veröffentlichung/Ready/Merge.
Unabhängige Reviewer: **/root/blocker_evidence_review** (Stage1, Gates, Recovery/Privacy) und **/root/release_live_audit** (genaue Source-/DDL-/Test-/Releasebindung).
Geplanter Branch: **docs/official-truth-dev-package-1-20261108**.

### Begrenzte Lieferung
Neuer Dokumentationsbereich: **docs/audits/official-truth-dev-package-1-2026-11-08/**.
Autor darf nur DEV_PACKAGE.md, TARGET_EVIDENCE_MATRIX.json, POSTCHECK_AND_RECOVERY.md und HANDOFF.md dort anlegen. Root besitzt TASK.md, STAGE1_ACCEPTANCE_REPORT.md, SOURCE_MANIFEST.json und REVIEW.md.
Keine Änderung an Produktcode, SQL-Kandidaten, kanonischen Migrationen, Rechten/Rollen/Auth/RLS, Tests/CI/Abhängigkeiten, Governance oder gehaltenen PRs. Keine neuen ausführbaren Apply-/Rollback-/Ledger-Abfrage-Skripte in diesem Vorbereitungspaket.

### Akzeptanzkriterien
1. Exakte Version/Quellpins des vorhandenen #1142-Kandidaten samt Gitblob/SHA256; vollständiges enges Objekt-/DDL-/ACL-Inventar und Abhängigkeiten aus den tatsächlichen Dateien. Unveränderte Source-Pins nicht als installiertes Ziel ausgeben.
2. Den tatsächlich durch Run2/R4/CI belegten Stand von fehlender Ziel-/Auth-/Session-/Owner-/ACL-/FK-/Trigger-/Expositions-/Lifecycle-Evidence je Abnahmepunkt unterscheiden. Je Lücke konkrete Auswirkung und vorhandene oder noch ungeklärte zulässige Evidence-Quelle benennen; keine UNKNOWN-Werte als sicher behandeln.
3. Konkretes zukünftiges Dev-Ziel yfvbxvijcorffwxbxahl/develop. Production qscbgcdmivbbnzrcyegn ausdrücklich außerhalb dieses Pakets. Tatsächliches Migrationsledger fehlt: kein erfundener Installations-/Ledger-Identifier, keine Migration-Reparatur, kein Stage1-Replay.
4. Funktionsänderungen, private Witness-/Mutationsguard-Rechte, Parallel-/Volatilitätsvertrag und Grant-Warte-/Recheck-Semantik präzise beschreiben. Authority- und Pilot-Änderungen weder automatisch koppeln noch eine fiktive unabhängige Deploybarkeit behaupten; vorhandene Quelle und reale Abhängigkeiten entscheiden.
5. Nachprüfungsplan mit messbaren positiven/negativen Akzeptanzfällen, Moment der Autorisierung, Ablauf/Widerruf/Konkurrenz, Fehler-/Abbruchkriterien und ehrlicher Unterscheidung von früheren nativen Fixtures, aktueller Source-Prüfung und noch nicht ausgeführten Hosted-Tests. Keine echten Konten sperren/manipulieren, keine Tokens/PII/Secrets in Reports.
6. Recovery-Plan unterscheidet offenen Transaktionsabbruch, bestätigten Commit und unklaren Commit-Ausgang. Keine blind angenommene Reversibilität; kein DROP CASCADE, History-Rewrite, blindes Reapply oder sicherheitswidriges Zurückaktivieren des alten P1-Vertrags. Notwendige tatsächlich geprüfte Wiederherstellungsbasis ausdrücklich offen lassen, falls sie fehlt.
7. Stage1-Bericht akzeptiert Run2-Teilnachweise und dokumentiert historische Beleglücke als nicht nachlieferbar durch Owner. Bericht abgeschlossen ist nicht gleich Stage1-Gesamtabnahme bestanden. Keine pauschale Rückstufung aller Definitionen auf UNKNOWN.
8. Klare getrennte Verdicts: Dokumentations-/Quellpaket prüfbar; effektive Zieländerung nur dann freigabereif, wenn alle tatsächlichen Bedingungen belegt sind. Reserviertes PO-Gate erst für ein vollständiges konkretes Zielpaket. Kein künstliches neues Freigabegate.
9. Verständliche Owner-Erklärung: was/warum/geprüft/wiederhergestellt und was Sasa jetzt tatsächlich tun muss. Fehlender zulässiger Readback-Weg bleibt offen; menschlicher Operator ist kein Ersatzweg.
10. Root plus beide unabhängigen Reviews auf finalen Bytes; unmittelbare Korrekturen in derselben Autor-Session. Jede neue Revision invalidiert frühere Artefakt-Reviews. Vollständige Veröffentlichung mit immutable Version/Links und Continuity in #917/#1139/#751.

### STOP
Nur Repository-/bereitgestellte Artefakte und öffentliche Primärquellen lesen; lokale Offline-Analyse erlaubt. **Keine Datenbankabfrage, SQL-Ausführung, Auth-/Konto-/Sessionaktion, Credential-Abfrage, neue Hosted-Supabase-Inventur, verweigerte Aktion, andere Person/Tool/Verbindung oder Live-/Provider-Aktivierung.**
**Do not mark Ready. Do not merge. Do not start a follow-up slice.** Autor liefert eingefrorene Dokumente und stoppt. Root entscheidet unabhängig; eine genehmigte Paketvorbereitung ist keine genehmigte wirksame Mutation.
