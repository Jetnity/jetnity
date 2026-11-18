# Frankreich: Zwei spätere Quellenversionen nur als Recherche vergleichen (Dev)

**Stand: 18.11.2026.** [Original-Textspeicherung #1236](https://github.com/Jetnity/jetnity/pull/1236), [Offline-Textvergleich #1241](https://github.com/Jetnity/jetnity/pull/1241), [Dev-Lesezugang #1242](https://github.com/Jetnity/jetnity/pull/1242). Gestapelter und von allen drei PRs abhängiger, strikt **RESEARCH_ONLY**-Sicherheitsweg.

## Grund für diese eng begrenzte Abweichung

Die unveränderlich archivierte französische erste HTML-Version aus `jetnity_followup_source_monitor_private.source_originals_v1` hat einen **anderen SHA-256** als die erste vom nachfolgenden Behördenquellenmonitor als `unqualified_snapshot` registrierte Antwort (Batch 2). Der ursprüngliche Archivbeleg bleibt so bestehen. Ihn stillschweigend als erste Monitoringversion zu behandeln, seine Prüfsumme zu korrigieren oder daraus eine amtliche Einreiseregel zu erzeugen wäre unzulässig. Der ursprüngliche `#1242`-Leser blockiert den Fall deshalb weiterhin korrekt.

**Unabhängiger, enger Ausweg:** Nicht der alte Archivtext, sondern zwei **erst später, tatsächlich vom gleichen amtlichen Monitor registrierte** Versionen werden miteinander verglichen. Die frühere ist als unveränderlicher `changed_originals_v1`-Datensatz mit referenziertem Monitoring-Beleg gesichert; die spätere ist die *neueste* Monitoringbeobachtung mit vorhandenem `pg_net`-HTTP-Body, dessen HTTP-Code, Inhaltstyp, UTF-8-Bytezahl und SHA-256 zu jener späteren Beobachtung passen müssen. Der erste Monitoringbeleg **muss ausdrücklich von der Archiv-Prüfsumme abweichen**; andernfalls wird dieser Ausnahmeweg verweigert und der normale ursprüngliche Leser bleibt zuständig.

## Sicherheits- und Lebensdauergrenzen

- **Nur Supabase-Development-Branch** `yfvbxvijcorffwxbxahl`, bereits bestehender Management-PAT und die bestehende `ziel()`-Branchprüfung; keinerlei neuer Schlüssel, Dienst, Benutzer, Cost- oder Owner-Login.
- Feste, durch Endanwender nicht parametrisierbare `SELECT`-Abfrage, exakt `FOUR/FR/primary`; nur bereits registrierte Quelle. Die URLs der Quellenregistrierung und des Archivs müssen übereinstimmen. Original-/Sample-/Live-Beleg müssen dieselbe Destination, steigende Batch-Kette und byteexakte SHA-256-Werte haben.
- **Spätere Version muss der neueste Monitorbeleg und maximal 90 Minuten alt sein**; fehlt ihr HTTP-Original oder ist die Seite zu gross, abweichend, ungültig oder nicht `text/html`, liefert der Weg **keinen** Vergleich. Es gibt keinen Fallback auf eine ältere, möglicherweise zugängliche Antwort.
- Keine neue amtliche HTTP-Anfrage, kein Cron, keine Datenbankänderung, keine HTML-Ausgabe im Terminal, keine öffentliche Route. Alle Ergebnisse tragen die unmissverständliche Herkunftskennzeichnung `TWO_VERIFIED_POST_MONITOR_OBSERVATIONS_ONLY`; dies ist **nicht** die erste amtliche Ursprungsurkunde, keine historische Reparatur und keine rechtliche Qualifikation.
- Die unveränderten Prüfgrenzen `officialTruthQuellenTextVergleich()` und `reviewDevSourceDiff()` sind weiter aktiv: Das Ergebnis bleibt `research_only`, `legalRuleApproved=false`, `publicationAllowed=false`, `acceptedFacts=0`, `modelCalls=0` und `databaseWrites=0`. Auch textgleiche Seiten sind keine Freigabe.

## Dev-Probe und offener Integrationsnachweis

Die exakt in diesem PR hinterlegte SQL-Abfrage wurde am 18.11.2026 gegen Supabase Dev **read-only** mit ausschliesslich ausgegebenen **Bytezahlen statt Original-Base64-Inhalt** ausgeführt: **FR-Probe Batch 23 → neueste Beobachtung Batch 27**, je 93'694 Bytes, die Quellidentitäten stimmen überein; alle geforderten SHA-/Zeit-/HTTP-Bedingungen der SQL-Anweisung waren erfüllt. Das belegt den **Datenbankpfad**, nicht bereits einen erfolgreich gestarteten lokalen Node-CLI-Lauf und nicht die semantische Rechtmässigkeit der französischen Einreisebestimmungen.

Die separat ausführbare, nur Dev-gebundene CLI lautet:

```sh
node --import tsx scripts/official-truth-source-text-diff-dev-v2/run-fr-dev.ts --entwicklung
```

Sie läuft nur in einer bereits mit einem genehmigten **Dev**-Management-Token ausgestatteten Umgebung. Es wird kein Token in GitHub, Chat oder Protokoll geschrieben. Vor einer Freigabe muss die **vollständige GitHub-CI** inkl. negativer Belege grün sein. **Kein Merge**, keine Production-Installation, keine kostenpflichtigen Modelle und keine rechtliche Veröffentlichungsbefugnis hierdurch. Der normale FR-Baseline-Konflikt bleibt separat offen, bis eine echte Quellenhistorien-Qualifikation die Diskrepanz klärt.
