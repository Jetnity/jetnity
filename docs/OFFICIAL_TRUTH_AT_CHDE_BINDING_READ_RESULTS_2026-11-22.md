# AT und CH→DE — zwei autorisierte einmalige Bindungsreads, 22.11.2026

**Ergebnis:** Beide freigegebenen READ-ONLY-Dateien wurden nacheinander exakt einmal auf Production `qscbgcdmivbbnzrcyegn` ausgeführt. Beide vollständigen Toolantworten sind erfolgreich; beide unveränderten SQL-Dateien enden mit `ROLLBACK`. Die gespeicherten Ergebnisse bestanden getrennte Root- und unabhängige Offline-Prüfungen. Keine Wiederholung, zusätzliche Datenbankabfrage, Dev-Ausführung, Installation, Owneraktion, Quellenanforderung oder Veröffentlichung.

Die beiden auf Commit `9f372f00065e5570b70d59a9bc681b8b2387cf4f` erteilten Gos sind damit **verbraucht**. Alte Freigaben oder die neuen Beobachtungen dürfen nicht als Erlaubnis für weitere Abfragen oder Writes verwendet werden. Die fachliche AT-Quellenentscheidung ist bestätigt; dies ist keine neue technische Datenbank- oder Owner/AAL2-Quittung.

## 1. Tatsächliche Aufrufe und Integrität

| Paket | UTC-Aufruffenster | Zürich | SQL-SHA-256 | Ergebnis |
| --- | --- | --- | --- | --- |
| AT | 13:00:36.070–13:00:37.344 | 14:00:36–14:00:37 | `30ff328d1901297b1a76ba3ddabb9ebc6004de95b764ce989e45acc238c9a064` | 1 Versuch, vollständig erfolgreich, 1,274 s |
| CH→DE | 13:02:05.846–13:02:07.325 | 14:02:05–14:02:07 | `e642250349a993d8f70c805e52e02646d957301ec0e6f8951dbc85d32559535f` | 1 Versuch, vollständig erfolgreich, 1,479 s |

Die Fenster sind Connectorlaufzeiten, keine behaupteten reinen SQL-Laufzeiten. Die unveränderten SQL-Grenzen galten zusätzlich. Das tatsächliche Toolziel wurde am Aufrufargument geprüft; ein ausgegebener Projektname allein wurde nicht als Zielnachweis gewertet. Die exakten aus dem unveränderlichen Repository-Commit geladenen Querystrings wurden vor dem Start bytegleich mit den lokalen Dateien und ihren SHA-256 abgeglichen. Die vorbereiteten Manifeste und SQL-Dateien wurden nicht verändert.

Die Antworten liefern keinen separaten PostgreSQL-ROLLBACK-Command-Tag. Der Abschlussnachweis besteht aus der vollständig erfolgreichen Antwort auf die exakt gebundene vollständige Datei mit abschließendem `ROLLBACK`; kein nachträglicher zusätzlicher Datenbankread wurde vorgenommen. Die einzelne lokale AT-Envelope-Parserkorrektur verarbeitet ausschließlich dieselbe bereits gespeicherte Antwort; sie verursachte keinen SQL-Fehler und keinen zweiten Aufruf.

## 2. AT: Quellenentscheidung bestätigt, Aktivierung weiterhin offen

**Beobachtung:** 22.11.2026, **14:00:37.083384 Zürich / 13:00:37.083384 UTC**.

Die Ausgabe enthält exakt neun Relationen, 13 Funktionsmetadaten, einen Methodenkopf, drei Quellenpins, drei erhaltene Originale, neun Quellenbeobachtungen und einen korrelierten BG1-Beleg. Root und unabhängiger Reviewer bestätigten Ergebnisform, Typen, Grenzen, geschlossene Quellenlisten, eindeutige Zuordnungen, Hashes und Zeitfolge. Bestehende generierte Originalspalten wurden mit ihrem tatsächlichen Schema geprüft; sie wurden nicht fälschlich als neue Abweichung bewertet.

- **BG1:** natürlicher vollständiger Lauf Generation **1789**, `complete`, `fresh_complete=true`, Incident/Resume **108/108**. Prüfung 13:00:00.048695–13:00:05.323183 UTC, zum Beobachtungszeitpunkt frisch bis 13:05:30 UTC. Dies ist eine zeitgebundene Beobachtung und keine dauerhaft gültige Grünzusage.
- **Methode:** `jetnity-destination-primary-at-visa`, Revision/Epoche **1/1**, `approved/until_revoked`; Revision und bestehende Operationsquittung korreliert. Methodendigest `cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9`, Paketdigest `55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe`.
- **Natürliche Quellenbelege:** Batches **601–603**, neun eindeutige IDs **1236–1244**, alle HTTP200 mit passender Request→Response→Collector-Zuordnung und erneut aus den vorhandenen Responsebytes berechneten Hashes. Der neueste Batch **603** enthält **1242–1244**. Kein Abruf wurde durch diesen Read ausgelöst.
- **Qualifikationszustand:** alle drei Pins weiterhin `research_only=true/source_qualified=false`; die erhaltenen Originale weiterhin `legal_source_approved=false/customer_rule_approved=false`; kein Qualifikationsnachfolger vorhanden. **62 historische, null gültige AT-Fakten.**

### Tatsächlich vom Owner bestätigte Fassungen und Aussage

| Amtliche Fassung | SHA-256 |
| --- | --- |
| BMI-Visummatrix, Ausgabe 06.11.2026 | `fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778` |
| BMI-Einreisegrundlagen | `ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e` |
| BMEIA/Botschaft Bern, geprüfte neue Antragsseite | `2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe` |

Die Quellenentscheidung betrifft ausschließlich die Vorbereitung der Aussage **„Schweizer Staatsangehörige benötigen für die direkte Einreise nach Österreich mit gültigem Schweizer Reisepass kein Visum.“** Die konkrete bereits geprüfte BMEIA-Differenz wurde für diesen Umfang als regelneutral bestätigt. Der Whole-Document-Status bleibt korrekt `changed`; alte Originale, Pins und Historien wurden nicht umgeschrieben. Es gibt keine Freigabe anderer Pässe, Dokumente, Aufenthaltszwecke, Fristen oder Themen.

**Nächster konkreter Bindungsstand:** Die aktuellen Funktions-/Relationsmetadaten, der Methodenkopf 1/1, Quellenhashes und der installierte v4-Parent sind für einen getrennten append-only Quellen-/Methoden-/Runtime-Nachfolger dokumentiert. Positive Dev-Erneuerung, isolierter Negativtest einer unveränderten unqualifizierten Quelle, echte Owner/AAL2-Methodenaktion, Installation und neuer natürlicher BG1-Beleg bleiben eigene offene Gates. Das aktuelle Go erlaubt keinen dieser Runtime-Schritte. **AT bleibt „derzeit nicht verfügbar“.**

## 3. CH→DE: Zyklus-12-Zuordnung jetzt nachgewiesen

**Beobachtung:** 22.11.2026, **14:02:06.758776 Zürich / 13:02:06.758776 UTC**.

Der strikte Ergebnisvertrag bestand mit exakt neun Dispatches, fünf deterministisch neu berechneten Claim-Identitäten, einem korrelierten Start, zwei Queueoperationen, einem Intake, 13 Funktionen, zwölf Relationen, zwei archivierten Originalen und drei früheren Ownerquittungen. Die Root-Prüfung umfasst 138 protokollierte Assertions; die unabhängige Prüfung zusätzlich Typ-, Form-, Hash-, Privacy- und Korrelationseinzelprüfungen. Beide verwenden nur dieselbe gespeicherte Antwort.

- **Zyklus 12:** unverändert `blocked/resume`, acht Phasenversuche, `retry_budget_exhausted`, `published=0`. Dispatch 38 war 200/`queued`, 39 war 503/`unresolved`, 40 war 503/`unavailable`, 41–46 waren 503/`unresolved`; alle verarbeitet.
- **Echte Zuordnung:** der konkrete CH→DE-Job, seine Enqueue-/Claim-Identität, der geleaste Subject-Zustand und genau ein offener Versuch stimmen überein. Seine Lease ist seit **16.11.2026, 07:44:34.581 UTC** abgelaufen. Dieser Versuch hat **kein Ergebnis und keine Abschlussdisposition**; ein gebundener Intake ist vorhanden. Damit ist die früher lediglich aggregiert gezählte abgelaufene Lease erstmals diesem Zyklus eindeutig zugeordnet.
- **Gebundene Zähler:** Revision **38**, Startzähler **13**, Operationszähler **38**, Versuch **1/4**. Dies sind erhaltene Zustände, keine Reset-Ziele. Zwei Originale entsprechen weiterhin den gespeicherten SHA-256; drei alte Ownerquittungen sind unverändert als Count/Digest gebunden.
- **BG1/Methode:** derselbe natürliche BG1-Beleg **1789** war auch bei diesem Read frisch; die bestehende CH→DE-Methode ist `approved`.

### Konkrete Grenze des späteren Schreibpakets

Die tatsächlichen Metadaten zeigen `postgres_execute=false` für die native Jobs-API sowie die privaten History-/Queue-/CAS-Funktionen. Die vorhandene Mitgliedschaft in `ot_v3_jobs_owner` ist `ADMIN=true`, aber **SET=false und INHERIT=false**; geschützte Jobs-Tabellen sind für `postgres` nicht direkt aktualisierbar. ADMIN ist keine Erlaubnis aus diesem Go, die Mitgliedschaft oder Rechte zu ändern. Der frühere Dev-Weg mit zeitweiligem GRANT/SET ROLE wird nicht nach Production übernommen.

Die exakten Ziele und Erhaltungsbedingungen sind jetzt gebunden. Ein ohne neue Rechte nutzbarer nativer Abschlussweg und dessen native Prüfung sind dadurch **noch nicht bewiesen**. `existing_claim_authority_is_proven`, `production_write_is_authorized` und `original_http503_error_body_is_proven` bleiben ausdrücklich `false`. Der offene Versuch erklärt die aktuelle Blockade und grenzt den historischen Fehlerpfad ein; er beweist nicht die ursprüngliche Ursache aller HTTP503.

Die [separate gebundene Schreibvorbereitung](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-bound-write-preparation-20261122/WRITE_SPEC.md) enthält die beobachteten Zielbindungen, den präzisen Änderungsvertrag, einen nativen Abnahmeplan mit 16 Fällen und den Rücknahmevertrag. Ihr [Manifest](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-bound-write-preparation-20261122/MANIFEST.json) hat SHA-256 `e9d728fcdab9f2606e0154d54cb10860ef9f66e86e52bd4a18d86cbcbbcb1c0a`; sieben Dateien und alle 14 Zielbindungsbereiche wurden unabhängig mit dem Ergebnis abgeglichen. Eine ausführbare Rehearsal-/Installations-/Owner-/Fence-/Wiederanlaufdatei wird nicht durch Platzhalter oder erfundene Autorität vorgetäuscht. Vor deren Finalisierung müssen der unveränderte native Autoritätspfad und die konkrete Dev-Abnahme separat ermöglicht und nachgewiesen werden.

Der spätere Abschluss darf nur eine echte Owner/AAL2-bestätigte append-only Abschlussquittung und den exakt zugeordneten nativen Abschluss einführen; Zyklus 12, seine Dispatchhistorie, Archive, Quotas und HTTP-IDs bleiben erhalten. Ein Scheduler-/BG1-Nachfolger muss nach Abschluss **geschlossen** bleiben. Ein eigener späterer Wiederanlaufentscheid darf höchstens einen neuen natürlichen Zyklus mit begrenzter Fortsetzung erlauben. **CH→DE bleibt gesperrt.**

## 4. Unveränderte Ausführungsgrenzen

Beide aktuellen Reads ändern keine fachlichen Daten. Keine Rollen-/Rechte-/Login-/2FA-/Passkey-/Secretänderung, keine Kosten, keine Wiederverwendung von Datei 20/40/50, kein Cursorauftrag, kein App-Deploy oder Main-Merge. Es wurde kein aktueller Owner-/AAL2-Sitzungszustand gelesen oder nachgebildet.

Für ein späteres Schreibpaket gilt: vor COMMIT bei jeder Abweichung vollständiges ROLLBACK; bei unklarem COMMIT STOP ohne Wiederholung; nach bestätigtem COMMIT nur ein eigenständig gebundener, geprüfter und freigegebener Schutz-/Rücknahmenachfolger. Erzeugte Historie oder HTTP-IDs werden nicht zurückgesetzt. Ändert ein anderes Paket den v4-Vorgänger, müssen weitere Schreibpakete neu gebunden werden; dieser Read erlaubt kein blindes Neuversiegeln.

## 5. Belege

Die vollständigen unveränderten Ausführungsantworten, extrahierten Ergebnisse, Root-/unabhängigen Prüfungen und die AT-Quellenentscheidung liegen im eigenen Verzeichnis [docs/evidence/official-truth-at-chde-binding-reads-20261122](evidence/official-truth-at-chde-binding-reads-20261122/). Sie wurden im Ausführungscheckpoint `bf045082371d1be3026424c66a6ba24946e2ae57` auf dem bestehenden Featurezweig gesichert. Ein [Auslieferungsmanifest](evidence/official-truth-at-chde-binding-reads-20261122/DELIVERY-MANIFEST.json) bindet die exakten Dateien und SHA-256. Die alten vorbereiteten Paketdateien bleiben als historische UNAPPLIED/NOT-EXECUTED-Vorbereitung unverändert; ausschließlich dieser neue Ausführungsnachweis dokumentiert die nun erfolgten zwei Reads.
