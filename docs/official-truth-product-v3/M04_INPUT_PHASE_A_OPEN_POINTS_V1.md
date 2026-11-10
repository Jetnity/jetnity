# M04 — zwei offene Phase-A-Architekturpunkte, Advisory V1

**Status: ausschließlich statische Beratung. Kein Task, Autor, Dispatch, Implementierungsauftrag oder PASS. M04 bleibt nicht beauftragt.**

Reviewer: `/root/mi1_attempt3_ui_review`, 2026-11-09. Root bearbeitet das noch offene vollständige Main-Gate. Die abgeschlossene Main-UI-Evidence bleibt unverändert; daraus wird hier keine Gesamtfreigabe abgeleitet.

## Evidenzbasis und Lesart

Die 15 in `phase-a-source-pins-v1.json` aufgeführten lokalen Dateien stimmen bytegenau mit Git-Head `cd14956928e3cc0143f3d6279e517a7cd294dab3` überein. Dessen Tree ist `2062a975b200d908a59e0c58c5ce5be6001615b6`, identisch mit dem zuvor separat über Git-Daten verifizierten tatsächlichen Main `7ae1394a00e2b23a60da98d2a029fd6a10c8189d`. Alle Git-Lesezugriffe verwendeten `GIT_NO_LAZY_FETCH=1`; kein Checkout oder Ref wurde geändert.

**Fakt** bezeichnet gelesenen Code oder die unten verlinkte PostgreSQL-Dokumentation. **Vorschlag/Folgerung** bezeichnet noch nicht implementierte Architektur. Vorhandene Tests wurden nur gelesen, nicht ausgeführt. Diese Notiz präzisiert die eingefrorene `PLANNING_REVIEW_V1.md`; sie ändert keine frühere Evidence.

## 1. Ausführungsreservierung und ehrliche Wiederaufnahme

### 1.1 Tatsächlicher Portvertrag

| Gelesener Fakt | Konsequenz |
| --- | --- |
| `monitor/worker.ts` 15–28 und 83–99: Nur `results.lookup(...).status === 'not_attempted'` führt zu `work.execute`. `unconfirmed` löst vorhandenen `commit_unconfirmed`-Backoff aus. | Ein fehlender fertiger Ergebnisindex beweist keine nicht erfolgte Ausführung. |
| `queue.ts` 18–45: Commit enthält `operationId`, `commandKey`, vollständiges Vorher/Nachher, Frist und Audit; keine ursprüngliche Claim-DTO. | Der Adapter muss die vollständige Claim-Bindung zusätzlich privat erhalten oder vollständig rekonstruieren. |
| `queue.ts` 138–150, 240–288: Claim-Replay verlangt die exakt ursprüngliche aktuelle Jobfassung; Reclaim erhält eine neue Revision/Generation. Fail kann Backoff oder Exhausted erzeugen. | Ein späterer Fence darf einen alten Ausführungsversuch oder ein altes Ergebnis nicht umetikettieren. |
| `integration/coordinator.ts` 240–248: Nur `artifacts.resume(not_attempted)` lässt den Worker erneut anlaufen. | Auch diese vorgeschaltete Lesestelle muss offene Ausführungsreservierungen berücksichtigen. |
| `integration/test-support/fixture.ts` 67–69 und 75–94: Die synthetische Map enthält nur fertige Ergebnisse; Resume gibt bei unverändertem geleastem Job `not_attempted` zurück. | Diese Fixture modelliert keinen Prozessabbruch zwischen Dispatch und Ergebnisindex. Ihr Verhalten darf nicht ungeprüft zur nativen Abwesenheitsregel werden. |

### 1.2 Kleinste notwendige private Wahrheit

**Vorschlag:** ein dauerhaftes Ausführungsjournal, getrennt vom Queue-Operationsjournal. Die stabile Identität umfasst mindestens Job-Art, `jobId`, ursprüngliche Job-/Enqueue-`operationId`, `jobKey` und vollständige Methodenbindung. Jeder Ausführungsversuch bindet zusätzlich die kanonische ursprüngliche Claim-Operation und den vollständigen Fence. Die Prüfung muss auch ältere Versuche derselben stabilen Arbeit sehen; eine Abfrage ausschließlich unter der neuen Lease-ID wäre falsch.

| Privater Zustand | Bedeutung | Erlaubte Portabbildung |
| --- | --- | --- |
| **ABSENT** — kein Versuch vorhanden | Autoritative Abwesenheit unter dem serialisierten stabilen Arbeitsschlüssel; keine ältere offene oder vorbereitete Ausführung. | `results.lookup: not_attempted`; anschließend ist trotzdem eine atomare Reservierung nötig. |
| **START_RESERVED** | Der Beginn wurde vor möglicher Produzentenausführung dauerhaft reserviert. Ob die Ausführung schon gestartet oder beendet wurde, ist ohne weitere Evidence unbekannt. | `results.lookup: unconfirmed`; nie durch Zeitablauf, Neustart, Fail oder neue Lease zu ABSENT machen. |
| **PREPARED** | Vollständig gebundener Ergebnisindex mit exakten S1-Referenzen ist dauerhaft vorhanden. | Nur bei passendem aktuellem ursprünglichem Fence `prepared` mit neuem, instanzgebundenem opaque Receipt; bei Fremdbindung/älterem Fence `unconfirmed`. |
| **SETTLED_FAILURE** — nur falls bewusst ausgewählt | Ein bekannter abgeschlossener Fehlversuch ohne Ergebnisindex ist dauerhaft protokolliert; alle owned Operationen sind beendet. | Der gleiche Versuch wird nicht erneut gestartet. Ein ausdrücklich zulässiger späterer Versuch kann als für seinen neuen Fence `not_attempted` gelten, aber nur wenn kein älterer unbekannter oder vorbereiteter Versuch existiert. |

Für reine Sicherheit reichen die ersten drei Zustände. **Für nützliche Wiederholung der bestehenden `failed: unreachable/invalid_proposal`-Fälle ist die vierte Unterscheidung nötig.** Sonst muss auch jeder bekannte Fehler konservativ offen bleiben. Ein Timeout oder verlorener Reply ist ausdrücklich kein `SETTLED_FAILURE`. Auch ein bestätigter Fehler beweist nicht, dass ein externer Anbieter nie angesprochen wurde; er ist eine dokumentierte Retry-Policy, keine Exactly-once-Zusage.

Die physischen Zeilen können ein unveränderliches Start-Ereignis plus ein terminales Ereignis abbilden. Weder Reset/Delete noch das Überschreiben alter Fences ist erforderlich. Ein Ergebnisindex enthält keine zweite Originaltext-, I1-Decision- oder Accepted-Wahrheit.

### 1.3 Wo die Reservierung bei unveränderten Ports liegt

**Vorschlag:** Der codeeigene `V3ResearchWorkPort.execute` ist eine private Fassade. Ihr erster wirksamer Schritt reserviert den Start atomar, unter aktuellem Job/Fence, echter MA1-Prüfung nach allen Wartezeiten und owned Cancellation. Erst nach bestätigtem COMMIT darf sie den eingebundenen Produzenten aufrufen. Fachlich liegt die Reservierung vor der eigentlichen Rechercheausführung; sie liegt nicht vor dem ersten Eintritt in die bestehende Portmethode. Ein wörtlich vorgelagerter Aufruf vor Worker-Zeile 96 würde einen endlichen Worker-Hook oder eine zusätzliche private Vorstufe benötigen und ist keine notwendige DTO-Erweiterung.

Zwei gleichzeitige Aufrufe dürfen beide zuvor ABSENT gelesen haben. Deshalb reicht `lookup` allein nicht: Nur die atomar gewinnende Reservierung erhält eine einmalige, instanzgebundene Startberechtigung in privater Closure-Custody. Eine wiedergefundene Reservierungszeile erzeugt nach Neustart keine neue Startberechtigung. Bei verlorenem Reservierungs-ACK wird kein Produzent aufgerufen, auch wenn die Reservierung bereits committed haben könnte. Eine spätere Bestätigung der Zeile allein beweist nicht, dass dieser Prozess noch der ursprüngliche alleinige Starter ist.

**Konsequenz für Verfügbarkeit:** Ein Abbruch direkt nach dem Reservierungs-COMMIT, aber vor dem eigentlichen Aufruf, kann dauerhaft konservativ blockieren. Lease-Ablauf löst diese Unsicherheit nicht. Eine spätere Anbieter-Reconciliation oder eine ausdrücklich definierte Wiederholungsentscheidung wäre zusätzlicher Scope; diese Notiz erteilt ihn nicht.

| Abbruchstelle | Wahrheit beim Neustart |
| --- | --- |
| Vor bestätigtem Reservierungs-COMMIT | Kein Aufruf. Ohne Zeile nur nach tatsächlicher, serialisierter DB-Abwesenheitsprüfung erneut reservierbar; bei unbekannter DB-Lage `unconfirmed`. |
| Nach Reservierungs-COMMIT, vor oder während Produzent | START_RESERVED bleibt sichtbar; kein blinder zweiter Aufruf. |
| Nach S1-Capture/I1, vor vollständigem Ergebnisindex | START_RESERVED bleibt; S1-Originale sind keine automatische Fertigmeldung. Kein Scan nach ähnlichen Bytes ersetzt die vollständige manifestierte Bindung. |
| Nach PREPARED, vor Queue-Complete | Exaktes Ergebnis kann unter dem noch gültigen ursprünglichen Fence bestätigt und fertiggestellt werden. Ein späterer Fence kann es nicht übernehmen. |
| Nach erfolgreichem Queue-Complete, Reply verloren | `artifacts.resume` kann exakt diese ursprüngliche Claim-Operation aus dauerhaftem Journal und aktuellem succeeded Job rekonstruieren. |

### 1.4 Bestehende Queue-/Worker-/Integration-Ports unverändert nutzbar

- **`results.lookup`** prüft das Journal über alle relevanten älteren Fences. START_RESERVED ist auch nach Reclaim `unconfirmed`. DB-/Decodierfehler sind keine Abwesenheit. PREPARED wird nur für die zulässige exakte Bindung zurückgegeben.
- **`results.confirm` und Queue-Complete** prüfen den tatsächlichen S1-Bestand und den vollständigen Ergebnisindex erneut; die endgültige Queue-Transaktion verifiziert aktuellen Fence, Methode und Fristen nach den Wartezeiten. Ein `decisionRef` allein genügt nicht.
- **`artifacts.resume`** gibt `completed` nur für einen aktuellen succeeded Job als direkten Nachfolger der ursprünglichen Claim-Fassung mit passendem Ergebnis zurück. Eine offene START_RESERVED-Ausführung gibt `unconfirmed`, auch wenn eine neu eingereichte Claim-ID im Queue-Journal noch fehlt. Der Adapter muss dafür die stabile Arbeit zum `jobKey` mitlesen.
- **Vorbereiteter, noch geleaster Originalversuch:** Der vorhandene Rückfall `resume(not_attempted) → Worker → results.lookup(prepared)` kann zur reinen Fertigstellung verwendet werden. Das bedeutet hier fehlende integrierte Completion, nicht „Recherche nie begonnen“. Es ist nur zulässig, wenn die private Composition den exakten noch aktuellen Claim und vollständige PREPARED-Custody bewiesen hat; der Work-Port bleibt durch die eigene Reservierung zusätzlich gegen erneuten Dispatch gesperrt. Alternativ bleibt Resume konservativ `unconfirmed` und eine später ausdrücklich ausgewählte private Finalisierung wäre nötig.
- **Unbekannte Versuche und Backoff:** Der generische Worker darf unverändert `queue.fail(commit_unconfirmed)` versuchen. Das darf das Ausführungsjournal nicht löschen oder freigeben. Ohne einen privaten Vorab-Stopp können spätere direkte Worker-Aufrufe weitere Queue-Attempts verbrauchen, bis Exhausted erreicht ist, obwohl keine neue Recherche startet. Root muss diese Verfügbarkeitsfolge bewusst wählen oder einen endlichen privaten Pause-/Reconciliation-Pfad festlegen.

Eine konkrete Grenze bestehender Tests: `monitor/worker.test.ts` 94–100 bestätigt ein verlorenes Ergebnis in einer neuen Claim-Generation, verwendet dabei jedoch eine Fixture ohne vollständigen Fence-Nachweis. Die strengere Integrations-Fixture 69–72 weist einen alten Fence zurück. **Der neue native Adapter darf diese permissive Unit-Fixture nicht als Erlaubnis zum Fence-Transfer auslegen.** Geht der PREPARED-Reply verloren und der Worker hat bereits Backoff geschrieben, ist eine erfolgreiche Übernahme unter neuer Generation mit dem hier vorgeschlagenen Minimalvertrag nicht belegt.

### 1.5 Vollständige Claim-Custody ohne neuen öffentlichen Vertrag

**Empfehlung:** Vor dem unveränderten Coordinator hält die owned Invocation eine defensive, unveränderliche Kopie der geschlossenen Claim-Daten `{operationId, jobKey, leaseId, leaseMilliseconds}`. Es handelt sich um kanonische DTO-Bytes, nicht um einen vorhandenen rohen Uploadtext. Accessors, unbekannte Felder und wechselnde Caller-Objekte dürfen nicht einfließen. Keine globale „letzte Claim“-Variable; parallele Aufrufe benötigen getrennte, begrenzte Custody.

Am Storage-Commit muss der private Adapter exakt den bestehenden Schlüssel `key('queue-command', {action:'claim', input: claim})` neu ableiten und mit `commit.commandKey` vergleichen. Außerdem müssen `operationId`, Job-Key, Lease-ID und die positive ganzzahlige Differenz `expiresAt - acquiredAt` exakt zur Claim-Dauer passen. Diese vollständigen kanonischen Bytes und der originale geleaste Record gehören atomar in das Queue-Operationsjournal. Queue-Confirm/Resume vergleichen später dieselben Bytes und den gespeicherten Schlüssel. Fehlende private Custody ist fail-closed.

Eine Rekonstruktion aus Claim-Operations-ID, Key und ursprünglichem leased Record ist prinzipiell möglich, wenn alle vier Felder einschließlich Dauer eindeutig gewonnen und derselbe kanonische Schlüssel neu geprüft werden. **Empfohlen ist die vorgelagerte private Kopie**, weil der Commit-Port selbst die ursprünglichen Eingabefelder nicht liefert. Diese Kopie ist keine Autorität: echte MA1-Custody und native aktuelle Job-Wahrheit bleiben zusätzlich erforderlich. Gleichartige Befehlsbindung der anderen Queue-Aktionen muss in Phase A endlich inventarisiert werden; kein generischer Public-Port wird erweitert.

Die Regelchronologie bleibt erhalten: Ein Regel-Ergebnis referenziert die tatsächliche abgeschlossene I1/S1-Decision, die spätere Integration spielt diese erneut ein. Discovery kann S1-Originale vor dem späteren I1-Import indexieren. `decisionRef` wird nicht umgedeutet.

## 2. Echte PostgreSQL-Abhängigkeit bei unverändertem MA1/S1-Rollback

### 2.1 Antwort aus offizieller Dokumentation

**Ja, statisch begründbar:** Ein echter SQL-Standard-Body `LANGUAGE SQL ... BEGIN ATOMIC ... END` wird beim Anlegen geparst und speichert erkannte Objektabhängigkeiten. Feste schemaqualifizierte Funktionsaufrufe mit exakten Argumenttypen können dadurch auf die tatsächlichen Funktions-OIDs binden. Ein stringbasierter SQL-/PL/pgSQL-Body oder dynamisch zusammengesetzter Name liefert diesen Body-Abhängigkeitsnachweis nicht automatisch. Quellen: [CREATE FUNCTION](https://www.postgresql.org/docs/16/sql-createfunction.html), [Dependency Tracking](https://www.postgresql.org/docs/16/ddl-depend.html).

Die erwarteten normalen `pg_depend`-Kanten machen `DROP ... RESTRICT` des referenzierten Objekts unzulässig, solange der abhängige Helper existiert. Das ist eine Folgerung aus der dokumentierten Mechanik, **noch kein ausgeführter Nachweis für den künftigen Companion**. Quelle: [pg_depend](https://www.postgresql.org/docs/16/catalog-pg-depend.html).

### 2.2 Korrektur der zuvor erwogenen einzelnen postgres-Funktion

**Fakt:** MA1s `auth-fixture.ts` 56 erstellt `postgres` als NOLOGIN, NOINHERIT, **NOSUPERUSER**, BYPASSRLS. S1s API-Schema und `read_v1(jsonb,text,integer)` gehören `ot_v3_intake_owner`; zusätzlich hat ausschließlich `ot_v3_intake_caller` die benötigten Rechte. MA1s privater Checker gehört dagegen `postgres` und ist keinem dieser S1-Rollen freigegeben. BYPASSRLS ersetzt keine Schema-/EXECUTE-Rechte. Quellen: die gepinnten Candidates sowie [CREATE ROLE](https://www.postgresql.org/docs/16/sql-createrole.html).

Ein einzelner `postgres`-Definer darf deshalb nicht einfach als berechtigt für den direkten S1-Aufruf angenommen werden. Ein zusätzlicher Grant auf den bestehenden S1-Objekten würde deren aktuelle ACL-Inventur verändern. Das wäre eine echte endliche S1-Erweiterung, nicht „unverändert“.

**Empfohlene unveränderte-ACL-Alternative:** zwei feste Companion-Helper ausschließlich im neuen M04-Schema:

1. Ein Helper unter `ot_v3_intake_owner` ruft das unveränderte `official_v3_intake_api.read_v1(jsonb,text,integer)` über einen echten SQL-Standard-Body auf. Nur die ausdrücklich benannte interne M04-Verarbeitung unter `postgres` erhält EXECUTE auf diesem **neuen** Helper; kein neuer Grant am alten S1-Schema oder der alten API.
2. Ein Helper/Wrapper unter `postgres` bindet durch tatsächliche feste Aufrufe an diesen neuen S1-Helper und an `official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)`. Damit besteht eine direkte Kante zum MA1-Checker und eine transitive Kette bis zum S1-Reader. Keine reine tote Referenz als scheinbarer Beleg; die Helper müssen tatsächliche Teilnehmer der festgelegten Transaktion sein.

Die exakten Signaturen, Rückgaben, Validierungen und der wirklich ausgeführte Aufrufgraph sind noch zu fixieren. Die S1-Antwort muss vollständig konsumiert und geprüft werden; `invalid`, `not_attempted` oder `collision` dürfen nicht in einem verworfenen SELECT verschwinden. Der Abhängigkeitsnachweis allein ersetzt weder Ergebnisvalidierung noch Autorisierung. Eine SQL-Ausdrucksauswertung darf nicht als garantierte Lock-Reihenfolge angenommen werden: zuerst alle S1-/Job-Wartepunkte, zuletzt tatsächliche MA1-Prüfung und frische Fristen. Falls ein Helper MA1 nur vorläufig prüft und danach S1 liest, ist eine weitere endgültige MA1-Prüfung nach diesem Warten zwingend.

Die M04-Caller-Rolle erhält nur feste M04-Operationen, keinen direkten Zugriff auf den S1-Bridge-Helper, keine private MA1-Epoch-Abfrage, keine Tabellenrechte, kein `SET ROLE` und keine beliebigen SQL-Callbacks. Beide Helper brauchen feste Suchpfade, geschlossene Signaturen, exaktes Owner-/ACL-Inventar und atomare Behandlung der Default-EXECUTE-Rechte. Die private MA1-WeakMap-/Factory-Brücke bleibt unabhängig davon erforderlich; die SQL-Abhängigkeit exportiert keine Receipt-Epoch.

### 2.3 Bestehende Guards: erwartete Kompatibilität und erwartete Verweigerung

| Tatsächlicher Guard | Statische Folgerung für die zwei neuen Helper |
| --- | --- |
| S1-Install-ACL-Prüfung, `intake-candidate.sql` 446–466, filtert auf die beiden S1-Schemas. Die nativen Objektinventare in `native.ts` 69–91 ebenfalls. | Ein genau inventarisierter Helper außerhalb dieser Schemas verändert die alten Objektzählungen/ACLs nicht. Bestehende Rollenattribute, Mitgliedschaften und Defaults bleiben unverändert. |
| MA1-Install-/Rollback-Inventar zählt die zehn Funktionen in seinen zwei Schemas und prüft deren exakte Rechte. | Companion-Objekte außerhalb davon benötigen keine Lockerung des alten Inventars. |
| S1-Rollback 17–20 entfernt `read_v1` mit RESTRICT; alles liegt in einer Transaktion. | Die echte Helper-Abhängigkeit soll den Rollback verweigern und auch frühere Teardown-Schritte zurückrollen. |
| S1-Rollback 43–45 entfernt zuletzt seine Rollen. `native.ts` 330–351 enthält bereits den negativen Fall eines zusätzlichen externen Objekts unter `ot_v3_intake_owner`. | Solange der Companion-Helper diesem Owner gehört, ist zusätzlich die Rollenlöschung blockiert. Das ist erwarteter Schutz, kein Grund, den Guard zu lockern. [DROP ROLE](https://www.postgresql.org/docs/16/sql-droprole.html) bestätigt die Eigentums-/Rechteabhängigkeit. |
| MA1-Rollback prüft zunächst leere History und entfernt den Checker in Zeile 211 mit RESTRICT. | Bei vorhandener History verweigert er bereits vorher; für einen gezielten Dependency-Nachweis muss eine separate leere gültige Fixture die RESTRICT-Stelle tatsächlich erreichen. |

**Erforderliche Teardown-Reihenfolge, noch ungeprüft:** zuerst den vollständig inventarisierten M04-Companion in umgekehrter Abhängigkeitsreihenfolge entfernen; erst danach können unveränderte S1-/MA1-Rollbacks ihre bisherigen positiven Fälle erfüllen. M04 muss alle eigenen Objekte und alle ausschließlich an ihnen erteilten Grants beseitigen, damit keine zusätzlichen Owner-Abhängigkeiten zurückbleiben. Kein CASCADE, DROP OWNED, REASSIGN OWNED oder Normalisieren fremder Privilegien.

Ein kompletter Standalone-S1-Test, der während noch installierter M04-Helper einen erfolgreichen S1-Rollback erwartet, wäre falsch zusammengesetzt. Die neue Composition muss ausdrücklich beide Fälle unterscheiden: „Companion vorhanden → Verweigerung mit unverändertem Bestand“ und „Companion korrekt entfernt → ursprünglicher positiver Rollback“. Für künftige Prüfung auch erfassen: SQL-Body/OIDs und `pg_depend`-Kanten, unveränderte MA1/S1-Funktionsdefinitionen/ACLs, keine unerwarteten Default-Grants und keine verstreuten Owner-Objekte. Hier wurde keiner dieser nativen Tests ausgeführt.

## 3. Konkrete offene Entscheidungen für Root

1. **Ausführungszustände:** drei konservative Zustände oder zusätzlich eindeutig bestätigte terminale Fehler für begrenzte Retry-Fähigkeit? Empfehlung: die vierte Unterscheidung nur mit präzisem Nachweis echten terminalen Settlements; niemals Timeout als solchen Fehler behandeln.
2. **Unsicherheits-/Verfügbarkeitsgrenze:** offener Start bleibt ohne automatischen Re-Dispatch blockiert, auch nach Lease-Ablauf. Ist diese bewusste Grenze für M04 akzeptiert, einschließlich möglichem Stopp nach Abbruch direkt vor tatsächlichem Aufruf? Falls nicht, wäre zusätzliche spezifische Reconciliation zu planen, nicht stillschweigend einzubauen.
3. **Prepared-vor-Complete:** exakter noch aktueller Claim darf über bestehenden Resume-Rückfall und `lookup(prepared)` fertiggestellt werden; altes Ergebnis unter neuer Generation bleibt blockiert. Root muss den verlorenen PREPARED-Reply plus bereits erfolgten Backoff ausdrücklich abgrenzen; die permissive Unit-Fixture beweist keine Lösung.
4. **Claim-Bindung:** private vollständige kanonische Claim-Custody vor dem Coordinator, erneute Schlüssel-/Dauerprüfung und atomare Speicherung im Operation-Journal? Empfehlung: ja; keine Hash-only-Autorität und keine Erweiterung von S0 oder `V3QueueCommit`.
5. **Companion-Abhängigkeiten:** zwei Owner-getrennte echte SQL-Body-Helper im neuen M04-Schema mit unveränderten alten Grants/Guards und erwarteter Rollback-Verweigerung, solange installiert? Empfehlung: als Phase-A-Kandidat festhalten; genauen Aufruf-/Rückgabevertrag und späteren nativen Dependency-Nachweis vor Implementierungsfreigabe konkretisieren.

Diese Fragen sind interne Architekturentscheidungen für den Technical Lead, keine jetzt an den Product Owner gerichtete Freigabe. Die erforderlichen künftigen Belege sind endlich: Crash an den genannten Grenzen, zwei Starter derselben Claim-Identität, veränderte Claim-Dauer, ältere ungeklärte Generation, exakte S1-Replays, tatsächliche dependencybedingte Rollback-Verweigerung und unveränderte Alt-Inventare. Sie werden hier nicht gestartet.

**Grenzen:** Keine Runtime-Code-, SQL-, Schema-, Ref-, Ready-, Merge-, Test-, Build-, Socket-, Hosted-/Auth-, Provider-, Quellen- oder #917-Aktion. Nur lokale Planungsnotiz/Source-Pins sowie offizielle Dokumentation gelesen. Supabase-Changelog gelesen; keine Abhängigkeits-/CLI-/Konfigurationsänderung ausgewählt. #1139 bleibt NOT_RELEASE_READY mit den bestehenden 17 Lücken; Methodenfreigabe bleibt NOT_APPROVED. M04 bleibt eingefroren. **STOP für Root.**
