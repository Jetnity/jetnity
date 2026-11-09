# M04 — Unsicherheit über erneutes Einreihen hinweg, unabhängiges Advisory V1

**Statische Planungsprüfung; kein Implementierungsauftrag, Dispatch, Slice-PASS oder Aktivierung.** Reviewer: `/root/m04_uncertainty_advisory`, neue Review-Session nach Unterbrechung. Die früheren Berichte bleiben unverändert. Root entscheidet nach vollständigem MI1-Post-Merge-Abschluss über einen versionierten M04-Task.

## Ergebnis

Die von Root vermutete Lücke ist im vorhandenen Vertrag nachvollziehbar: Ein Journal, das offene Ausführungen nur unter `jobId`, Enqueue-Operation oder Claim-Fence findet, schützt nicht gegen einen neuen Job für dieselbe Arbeit. `queue.ts` erlaubt nach `succeeded` oder `exhausted` ausdrücklich einen neuen Job mit neuen IDs. Die Sperre muss daher an der **dauerhaften fachlichen Arbeitsidentität** hängen und alle noch ungeklärten Ausführungen dieser Identität erfassen.

Zwei zusätzliche Präzisierungen sind erforderlich: Die Regelidentität verwendet einen normalisierten Kontext ohne Support-Metadaten; ein neu erfundener Schlüssel aus dem unveränderten Rohkontext wäre nicht äquivalent. Außerdem verhindert ein äußerer Vorab-Read allein keinen Attempt-Verbrauch bei Konkurrenz. Die endgültigen nativen Claim-/Re-Enqueue-Transaktionen müssen dieselbe Sperre nach ihren tatsächlichen Wartezeiten erneut prüfen.

Die Zwei-Owner-SQL-Brücke bleibt als Phase-A-Kandidat plausibel. Sie braucht ausdrücklich einen **SECURITY-DEFINER-S1-Helper**, ein vollständiges Schema-USAGE-/Owner-/Default-ACL-Inventar und echte konsumierte Aufrufabhängigkeiten. Eigentum allein lässt einen SECURITY-INVOKER-Helper nicht mit S1-Rechten laufen. Für keinen dieser Vorschläge wurde hier SQL oder ein Test ausgeführt.

## 1. Verifizierte Source-Basis

Lokaler HEAD: `cd14956928e3cc0143f3d6279e517a7cd294dab3`; Tree: `2062a975b200d908a59e0c58c5ce5be6001615b6`. Der lokal bereits vorhandene tatsächliche Merge `7ae1394a00e2b23a60da98d2a029fd6a10c8189d` hat exakt denselben Tree. Der Worktree war beim Lesen sauber. Alle Git-Lesezugriffe verwendeten `GIT_NO_LAZY_FETCH=1`; kein Fetch, Ref- oder Index-Wechsel. Die begleitenden Source-Pins vergleichen die gelesenen lokalen Bytes mit den vorhandenen Git-Blobs. Die tatsächliche Main-CI-Abnahme gehört Root und wird hier nicht ersetzt.

| Gelesener Source-Fakt | Bedeutung |
| --- | --- |
| `monitor/queue.ts`, Enqueue: aktive Jobs werden dedupliziert; ein terminaler Job darf durch einen neuen Job mit anderer `jobId` ersetzt werden. `queue.test.ts` 132–143 beweist diesen Vertrag bereits als Test-Source. | Job-ID und Enqueue-Operation sind Zyklusidentitäten, keine dauerhafte Unsicherheitssperre. |
| `contract.ts` 291–305: Rule-Job-Key hängt an Kontextidentität, Methodenreferenz und Faktart. Missing/Recheck, Besucher und Operationen erzeugen absichtlich keine parallelen aktiven Jobs. | Ein Wechsel von `missing` zu `recheck_needed` darf eine ungeklärte Ausführung nicht freigeben. |
| `contract.ts` 245–257 sowie `regulierungs-anwendbarkeit.ts` 2266–2277: Kontextidentität verwendet normalisierten Scope und normalisierte Ausdrucksstruktur ohne Support. | Vollständige fachliche Identität ist etwas anderes als ein beliebiger Rohkontext-Hash. Support-Änderungen dürfen keine neue Sperrnamespace eröffnen. |
| `monitor/worker.ts` 83–99: `not_attempted` ermöglicht Execute; `unconfirmed` versucht `queue.fail(commit_unconfirmed)`. Claim erfolgt vorher. | Ungeklärte Arbeit muss schon vor neuem Claim angehalten werden; die private native Grenze muss konkurrierende Fälle zusätzlich abweisen. |
| `integration/coordinator.ts` 240–248: `artifacts.resume(not_attempted)` startet den Worker; Resume erhält nur Claim-Daten. | Resume muss den aktuellen Job und seine vollständige stabile Identität aus eigenem dauerhaften Bestand lesen. Eine unbekannte neue Claim-ID beweist keine fehlende alte Ausführung. |
| `integration/test-support/fixture.ts` 45–58, 67–94: Regel-Ergebnis folgt auf die tatsächliche I1-Decision; Discovery hält zunächst Digests; Resume benötigt ursprünglichen Claim und direkten succeeded-Nachfolger. | Chronologie und Fence-Bindung bleiben erhalten. Die Map-Fixture selbst ist kein Nachweis für dauerhafte Crash-Recovery. |

## 2. Identität: drei getrennte Ebenen

**Empfohlene Phase-A-Festlegung:** Die neuen privaten Tabellen halten die drei Ebenen ausdrücklich getrennt. Keine öffentliche S0-/Queue-/Worker-DTO muss dafür erweitert werden.

| Ebene | Vollständige Bindung | Was ausdrücklich nicht zur Freigabe einer neuen Arbeit führt |
| --- | --- | --- |
| Dauerhaftes Arbeitssubjekt | Art; für Rule die bereits verwendete normalisierte Kontextidentität einschließlich Revision/Application-Beschränkung, Faktart und `{methodId, revision}`; für Discovery das normalisierte Länderpaar und dieselbe Methodenreferenz. Vollständige kanonische Identitätsdaten werden behalten und verglichen. | Neue Job-/Enqueue-/Claim-/Lease-IDs, Generation, Attempt, Zeitablauf, Prozessneustart, `missing`/Recheck-Grund, Support-Metadaten, neue Receipt-Instanz oder MA1-Epoch. |
| Queue-Zyklus | Exakter Job-Key, `jobId`, ursprüngliche Enqueue-Operation, vollständiger Jobrecord und kanonischer Enqueue-Befehl. | Ein neuer Zyklus entfernt kein offenes älteres Ausführungsereignis desselben Subjekts. |
| Ausführungsversuch | Vollständiger ursprünglicher Claim-Befehl einschließlich Lease-Dauer, Claim-Operation und Fence; feste tatsächliche MA1-Bindung einschließlich Methoden-/Paketdigest; unveränderliches Start-/Ergebnis-/Disposition-Journal. | Eine aktuelle neue Autoritätsbeobachtung darf einen alten Versuch prüfen, aber weder seinen Fence noch seine Identität umschreiben. |

`jobKey` kann als Locator und Serialisierungsschlüssel dienen. Er ist keine alleinige Gleichheits- oder Autoritätsprüfung. Beim ersten Anlegen wird eine vollständige kanonische Subjektbindung festgehalten; jeder spätere Zugriff vergleicht diese. Passt derselbe Hash-Key zu wirklich anderen vollständigen Identitätsdaten, lautet das Ergebnis Collision/Unconfirmed, nicht „zweites Subjekt im selben Hash-Bucket zulassen“. Semantisch gleiche Support-/Ausdrucksvarianten müssen durch **dieselbe bestehende Normalisierung** gleich bleiben; die originale vollständige Kontextfassung bleibt in der konkreten Job-/Artefaktbindung erhalten.

Die Methodenreferenz ist bereits Teil des bestehenden Job-Keys. Methoden-/Paketdigest werden daneben als feste echte Bindung geprüft; ein anderer Digest unter derselben Referenz darf keine Ausweichnamespace erzeugen. Eine Revocation/Reapproval-Epoch oder abgelaufene opaque Receipt setzt keine Ausführung zurück. Eine tatsächlich neue Methodenrevision hat nach dem bestehenden Vertrag eine andere Arbeitsidentität; eine darüber hinausgehende revisionsübergreifende Anbieter-Deduplizierung wäre eine eigene, hier nicht erteilte Policy. Ebenso ist Discovery eine andere Arbeitsart als Rule; keine unbelegte arbeitsartenübergreifende Exactly-once-Zusage.

Die genaue kanonische Bytebildung muss Phase A festschreiben. `schema2Kanonisch` ist nicht ungeprüft durch `jsonb::text` ersetzbar. SQL und Runtime müssen geschlossene Felder, Normalisierung und vollständige Gleichheit tatsächlich nachweisen; ein Caller-Hash darf diesen Nachweis nicht ersetzen.

## 3. Welche alten Ereignisse neue Arbeit blockieren

**Vorschlag:** Der native Sperrtest betrachtet alle unaufgelösten Ereignisse des Subjekts, nicht nur den letzten Job oder das jüngste Ereignis. Ein späterer Erfolgs-/Fehlerdatensatz darf einen anderen älteren unbekannten Versuch nicht verdecken.

| Tatsächliche dauerhafte Lage | Sichere Folge |
| --- | --- |
| Keine Startreservierung und kein unbekannter/pending Dispatch; Abwesenheit nach tatsächlicher Serialisierung bestätigt | Neuer Start kann atomar reserviert werden. Ein vorgelagerter Lookup allein gibt noch keine Startberechtigung. |
| `START_RESERVED`, ohne eindeutige terminale Disposition | Neue Starts, neue Fences und neue Queue-Zyklen bleiben blockiert. Keine Löschung/Freigabe durch Lease-Ablauf, Exhaustion, Backoff, Re-Enqueue oder Retention. |
| `PREPARED`, noch nicht durch exakte Queue-Completion konsumiert | Nur Fertigstellung unter demselben noch aktuellen gültigen ursprünglichen Claim/Fence. Keine Übernahme durch Reclaim oder neuen Job. Nach dessen Ablauf bleibt konservativ blockiert. |
| Exakte PREPARED-Custody und zugehörige Queue-Completion atomar bestätigt | Der Ausführungsversuch ist für diese Queue-Arbeit abgeschlossen. Ein bewusst neuer Enqueue-Zyklus kann gemäß bestehendem Vertrag wieder Arbeit beginnen; der alte Ergebnisindex darf dabei nicht als Ergebnis des neuen Jobs erscheinen. |
| Ausgewählte, nachgewiesene `SETTLED_FAILURE` mit exakt zugehöriger Failure-Disposition | Nur die ausdrücklich definierte Retry-Policy darf einen späteren Versuch erlauben. Gleicher Versuch/Fence wird nie erneut ausgeführt. |

Für `SETTLED_FAILURE` genügt weder ein Timeout noch eine Fehlerzeichenkette aus einem fremden Port. Es braucht den tatsächlich beendeten Produzentenpfad, beendete owned native Operationen, keine unbekannte Ergebnis-/COMMIT-Lage und eine unveränderliche Bindung an genau diesen Start/Fence/Fehlergrund. **Empfehlung für eine kleine erste Lieferung:** Die Freigabe der Sperre geschieht zusammen mit dem passenden Queue-Fail-Journal in derselben nativen Transaktion. Eine private, nicht serialisierbare Settlement-Custody darf dem festen Fail-Adapter den nachgewiesenen bekannten Fehler liefern. Ein offener Start wird dadurch nicht allein aufgrund des callerseitigen `reason`-Strings aufgehoben.

Bricht der Prozess zwischen bekanntem Produzentenfehler und dieser dauerhaften Disposition ab, bleibt der Start konservativ unbekannt. Eine separate sichere Reconciliation wäre späterer Scope. Alternativ kann Root zunächst nur die drei konservativen Zustände auswählen und bekannte Fehler ebenfalls blockieren; dann muss der Verfügbarkeitsverlust ausdrücklich beschrieben werden. Die vierte Unterscheidung darf nicht halb implementiert werden, indem schon ein generisches `failed` neue Starts freischaltet.

Die Queue-Completion ist weiterhin **keine** Accepted-/Versions-/Cache-Publikation. Ein späterer neuer Forschungszyklus löst keine unbekannte nachgelagerte Publikation auf. Diese Autoritätsgrenze bleibt außerhalb M04.

Ungeklärte Start-/Prepared-Ereignisse dürfen nicht durch einen begrenzten Scan oder TTL unsichtbar werden. Ein endlicher Materialized-Blocker pro Subjekt kann helfen, muss aber aus vollständiger unveränderlicher Historie überprüfbar sein und in derselben Transaktion fortgeschrieben werden. Erreicht ein Inventar-/Quota-Limit die festgelegte Grenze, ist die Antwort fail-closed; kein ältester-Eintrag-Löschen, das erneut `not_attempted` erzeugt.

## 4. Vorab-Stopp plus native Rennbedingungsprüfung

Der äußere owned Entry Point darf vor dem unveränderten generischen Worker den aktuellen Subjektzustand lesen. Bei ungeklärtem Start oder fremdem/abgelaufenem PREPARED antwortet er mit dem vorhandenen `unconfirmed`, ohne einen neuen Claim anzustoßen. Ein exakter noch gültiger PREPARED-Originalclaim darf in den bereits dokumentierten reinen Fertigstellungspfad. Ein tatsächlich komplett bestätigter Originalclaim darf in Resume.

**Dieser Vorab-Stopp ist eine Optimierung, nicht die atomare Sicherheitsgrenze.** Zwischen Read und Claim kann eine konkurrierende Reservierung committed werden. Deshalb sind mindestens folgende feste Prüfstellen in der neuen privaten nativen Composition nötig:

1. Vor Commit eines neuen Claims/Reclaims oder eines neuen terminalen Enqueue-Zyklus: dieselbe Subjektserialisierung und aktuelle Journalprüfung; bei Blocker keine Jobrevision, kein Attempt und kein neues Operations-ACK schreiben. Vorhandener Rückgabewert `unconfirmed` reicht.
2. Beim erstmaligen Start: nach Serialisierung exaktes aktuelles Job-/Claim-Fence, vollständige Subjektbindung, kein offener älterer Versuch und aktuelle MA1-Autorität prüfen; Startreservierung committen. Nur der atomare Gewinner mit bestätigtem COMMIT erhält einmalige, instanzgebundene private Startcustody. Wiedergefundene Zeile oder rekonstruierter ACK gibt keinen neuen Starttoken aus.
3. Beim generischen Fail nach `commit_unconfirmed`/`verification_unavailable`: eine ungeklärte laufende Startreservierung darf dadurch nicht freigegeben oder als terminaler Anbieterfehler umetikettiert werden. Empfehlenswert ist eine nichtmutierende unconfirmed-Antwort, solange keine passend bewiesene Failure-Disposition vorliegt. Sonst könnte ein konkurrierender Replay desselben Claims einen noch arbeitenden ursprünglichen Versuch in Backoff verschieben.
4. Bei PREPARED/Complete: vollständiges Ergebnis, tatsächlicher S1-Bestand, ursprünglicher Fence und aktuelles Jobrecord gemeinsam prüfen. Der exakte zulässige Abschluss wird vom Blocker ausgenommen; fremde neue Fences nicht.

Alle vier Stellen verwenden eine konsistente Reihenfolge der Subjekt-/Command-/Job-/Result-/S1-Sperren; tatsächliche finale MA1-Prüfung nach den anderen möglichen Wartezeiten. Keine DB-Transaktion wird über die Produzentenausführung hinweg offen gehalten: Die **dauerhafte** Startreservierung trägt die Unsicherheit nach dem Reservierungs-COMMIT. Der äußere Scope versiegelt später seine Admission und joined die tatsächlichen owned nativen Kinder. Ein nachträglicher Callback kann kein neues SQL und keinen weiteren Start auslösen.

## 5. S1-Chronologie bleibt unverändert

Für Rule folgt auf den einmaligen Start die tatsächliche S1-/I1-Verarbeitung. Erst ein vollständiges reales I1-`prepared`- oder `escalation`-Ergebnis erlaubt einen Index mit dessen `decision.reference`. Danach kommen Queue-Complete, erneutes Öffnen der exakten S1-Originale und das vorhandene I1-Replay. Ein nach S1-Capture abgebrochener Versuch bleibt START_RESERVED; ähnliche Originalbytes oder eine später gefundene Completion ohne vollständiges manifestiertes Ergebnis sind kein Ersatz.

Discovery hält nach tatsächlicher S1-Capture zunächst die exakte begrenzte Menge eindeutiger Digest-/Referenzbindungen und beendet danach die Queue-Arbeit. Die spätere Integration führt I1 je Vorschlag aus. Weder Discovery-Fertigmeldung noch gespeicherte Originals erteilen Quellen- oder Annahmeautorität. Die voneinander abweichenden Reihenfolgen sind durch das vorhandene Portmodell begründet und erfordern keinen neuen `decisionRef`-Sinn.

## 6. SQL-Brücke: tragfähig als Kandidat, weitere genaue Anforderungen

Das ACL-Problem des vorherigen Berichts ist in den tatsächlichen Sources bestätigt: Test-`postgres` ist `NOINHERIT NOSUPERUSER BYPASSRLS`; die alten S1-Objekte geben ihm keine USAGE-/EXECUTE-Rechte. Die MA1-Checkerfunktion gehört dagegen `postgres`. Die vorgeschlagenen zwei neuen Helper können die bestehenden ACLs unverändert lassen, **wenn** die folgenden Punkte explizit eingefroren und später nativ nachgewiesen werden:

- S1-Helper im neuen Companion-Schema gehört `ot_v3_intake_owner` **und ist SECURITY DEFINER**, mit festem Suchpfad und geschlossenem, exakt typisiertem Aufruf der alten S1-Read-Funktion. Der PostgreSQL-eigene Ownership-Wechsel allein reicht nicht für einen INVOKER-Body. Sein vollständiger Rückgabewert wird tatsächlich validiert und verwendet.
- Das neue Schema und seine USAGE-/CREATE-Rechte sind Teil der ACL-Matrix. Interner `postgres` braucht die genau erforderliche Erreichbarkeit des neuen S1-Helpers; der äußere Caller braucht nur das M04-API-Schema und feste API-Funktionen. Keine implizite Annahme, dass Funktionseigentum automatisch beliebige Schema-Rechte liefert. Falls ein nicht privilegierter Installer einen Owner-Wechsel vornehmen soll, sind dessen tatsächliche Voraussetzungen separat zu binden; daraus folgt keine neue Hosted-Installationsberechtigung.
- Vorhandene Rollenattribute, Memberships, MA1-/S1-Schemas, Funktionsdefinitionen, Grants und Defaults bleiben unverändert. Die neuen Helper werden in einer Transaktion erstellt, PUBLIC-Rechte geschlossen und fremde geerbte Creator-Defaults **vor pauschaler Normalisierung** erkannt. `ALTER OWNER` löscht fremde Default-Grants nicht zuverlässig aus der benötigten Inventur.
- SQL-Standard-Bodies mit festen schemaqualifizierten Funktionsaufrufen liefern den zu prüfenden OID-Abhängigkeitskandidaten. Stringbasierte PL/pgSQL-Wrapper allein sind kein Dependency-Beleg. Keine tote/wegoptimierbare Referenz; tatsächliche S1-Antwort konsumieren, tatsächlichen MA1-Checker im endgültigen Mutationspfad ausführen.
- Keine `STRICT`-Deklaration, die bei NULL die erforderliche Prüfung überspringt und durch ein ignoriertes NULL/void einen Erfolgspfad offenlässt. Geschlossene NULL-/Fehler-/Statusbehandlung, zutreffende Volatility/Parallel-Safety und vollständige Körperinventur gehören zur Phase-A-Spezifikation. Der Caller darf keinen direkten Helper-/MA1-Oracle-/Tabellenzugriff erhalten.
- SQL-Ausdrucksreihenfolge ist kein Ersatz für eine bewiesene Lock-Reihenfolge. Der endgültige MA1-Check muss nach dem tatsächlichen S1-Warten liegen. Keine positive Antwort vor echtem COMMIT und owned Cleanup; spätere Fristüberschreitung bleibt nichtpositiv/unklar.
- Companion zuerst exakt entfernen. Solange er existiert, müssen die unveränderten S1-/MA1-RESTRICT-Rollbacks atomar verweigern. Die S1-Owner-Abhängigkeit ist eine zusätzliche Verweigerungsursache; der gezielte MA1-Dependency-Test braucht eine leere gültige MA1-History, damit der bestehende frühere History-Guard den Test nicht verdeckt. Kein CASCADE, DROP OWNED, REASSIGN OWNED oder Privilegiennormalisieren.

Dokumentationsbasis: PostgreSQL 16 [CREATE FUNCTION](https://www.postgresql.org/docs/16/sql-createfunction.html) für Definer-/Invoker- und SQL-Body-Eigenschaften, [Privileges](https://www.postgresql.org/docs/16/ddl-priv.html) für separate Objekt-/Schema-Berechtigungen, [Dependency Tracking](https://www.postgresql.org/docs/16/ddl-depend.html) für gespeicherte Body-Abhängigkeiten und RESTRICT, [ALTER FUNCTION](https://www.postgresql.org/docs/16/sql-alterfunction.html) für Owner-Wechsel-Voraussetzungen. Die genaue künftige Companion-Wirksamkeit ist eine daraus abgeleitete, noch nicht ausgeführte Hypothese.

## 7. Endliche zusätzliche Proof-Matrix für einen künftigen Task

1. START_RESERVED → Prozessabbruch → Lease-Ablauf → terminaler alter Job → anderer Enqueue-/Job-/Claim-/Lease-Identifier bei gleicher Arbeit: null neue Produzentenstarts, kein neues positives Queue-ACK.
2. Dasselbe mit `missing` gegenüber jedem Recheck-Grund sowie mit lediglich geänderten Support-Metadaten/normalisierungsäquivalenter Ausdrucksstruktur; dieselbe Sperre bleibt erhalten.
3. Unterschiedliche vollständige Identitätsdaten unter absichtlich gleich vorgegebenem Locator: Collision; kein Hash-only-Erfolg. Wirklich verschiedene gültige Subjekte behalten getrennte Arbeit.
4. Gleichzeitige ABSENT-Reads, danach zwei Reservierer: exakt ein bestätigter Gewinner; verlorener Reservierungs-ACK, Restart und gefundenes Startrow erzeugen keinen zweiten Starttoken.
5. Vorab-Read sieht ABSENT, konkurrierender Start commitet vor tatsächlichem Claim/Re-Enqueue-CAS: native Sperrprüfung verhindert Mutation/Attempt-Verbrauch. Beobachteter realer Lock-Wait erforderlich.
6. Replay desselben Claims während noch laufendem Start: keine konkurrierende Failure-Disposition, kein vorzeitiges Backoff, kein zusätzlicher Start.
7. PREPARED vor Complete: gültiger ursprünglicher Claim kann nur fertigstellen; neuer/abgelaufener Fence und neuer Job können weder übernehmen noch erneut starten.
8. Complete-ACK verloren: exakter Originalclaim kann den tatsächlichen succeeded-Nachfolger wiederfinden; danach bewusst neuer Queue-Zyklus startet nur als neue Arbeit, nie mit altem Ergebnis. Nicht mit Accepted-Publikation verwechseln.
9. Falls SETTLED_FAILURE gewählt: tatsächlicher bekannter Fehler plus atomare zugehörige Failure-Disposition erlaubt festgelegten späteren Retry; Timeout, verlorener Reply, nachlaufendes SQL, fremder Grund, anderer Fence und nur callerbehauptete Failure erlauben ihn nicht. Crash vor dieser Disposition bleibt blockiert.
10. Viele alte abgeschlossene Versuche und ein älterer unbekannter Versuch: kein latest-only-/Scanlimit-/Retention-Bypass. Grenzen verweigern; keine vergessene Unsicherheit.
11. Tatsächliche Rule-I1/S1-Decision und Discovery-S1-Originale über Prozessneustart öffnen; verschiedene Chronologie, vollständige Referenz-/Byte-/Fence-Bindung und S1-Fehlerstatus prüfen.
12. Native Helper-Aufruf-/USAGE-/EXECUTE-/Owner-/Default-ACL-/NULL-/OID-/Rollback-Positive und -Negative unter den tatsächlichen nicht-superuser Rollen; bestehende S1-/MA1-Inventare bleiben identisch, frühere Teardown-Schritte rollen bei Abhängigkeitsverweigerung zurück.

## 8. Einordnung und STOP

P1 vor einer künftigen M04-Abnahme: unbekannte Ausführung durch neue Jobidentität oder Grund/Support-Variante vergessen; erneuter Dispatch; alter Fence umetikettiert; privilegierter Helper ohne vollständige Autoritäts-/ACL-Grenze. Dies sind latente Risiken eines noch nicht implementierten Adapters, kein hier nachgewiesener aktiver Production-Vorfall. P2: konservativ dauerhaft blockierte Arbeit und genaue Retry-/Disposition-Policy müssen ehrlich im Scope stehen. P3: Retention-/Durchsatz-/Betriebskosten sind später zu lösen, ohne Ungewissheit still zu löschen.

Methodenfreigabe bleibt NOT_APPROVED, #1139 NOT_RELEASE_READY mit den bestehenden 17 Lücken. #917 wurde weder aufgerufen noch umformuliert, delegiert oder umgangen. Keine Hosted-/Auth-/RLS-/ACL-/Credential-Abfrage, kein SQL/Socket, kein Test/Build, kein Provider-/Quellenzugriff, keine Code-/Ref-/PR-Änderung, kein Ready/Merge/Dispatch. Nur diese Planungsnotiz, zugehörige Pins und gelesene öffentliche PostgreSQL-Dokumentation. **STOP für Root; M04 weiterhin nicht beauftragt.**
