# CH→DE Zyklus 12 — konkret gebundene Schreibvorbereitung

**Status: Zielbindung abgeschlossen; Spezifikation vorbereitet; Schreibpaket nicht ausführungsreif.**

Diese Vorbereitung wertet ausschließlich den bereits einmal ausgeführten, freigegebenen Bindungsread aus Commit `9f372f00065e5570b70d59a9bc681b8b2387cf4f` aus. Sie erteilt keine weitere Abfrage-, Test-, Dev-, Production-, Owner-, Installations- oder Wiederanlaufbefugnis. Es gibt hier bewusst keine ausführbare Installations-, Probe-, Rücknahme- oder Ownerdatei. Der übernommene Schreibplan verlangt vor deren endgültiger Erstellung eine native Prüfung der tatsächlich verfügbaren Autorität.

## 1. Neu belegtes Ziel

Der Serverbeobachtungszeitpunkt ist **22.11.2026, 14:02:06.758776 Zürich / 13:02:06.758776 UTC**. `TARGET_BINDINGS.json` enthält die vollständigen beobachteten IDs, Zähler, Zeilen- und Funktionsdigests; keine Owner-Sitzung oder geheimen Token.

| Gegenstand | Exakte Bindung |
| --- | --- |
| Production | `qscbgcdmivbbnzrcyegn` |
| Vorgänger | `official_v3_guard_private.bg1_production_http_allocator_v4`, SHA-256 `c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4` |
| Zyklus | `12`, unverändert `blocked/resume`, acht Versuche, `retry_budget_exhausted`, `published=0` |
| Zyklus-Operation | `op3_4775995258e84e1782dd1c715ac27025` |
| Lease | `lease3_890f0128a96d476b8543c92ac7af5626`, abgelaufen am 16.11.2026 um 07:44:34.581 UTC |
| Job | `job3_2fd7149d9560d930957a0ca86fc65c73` |
| Enqueue-Operation | `op3_185d9cea2da6d4e6dd41439137f0f036` |
| Offener Versuch | `execution-attempt:v3:45128e7336cf585778e86a55f7531ff4a0a3bea2ac65341ecc2143142aa27981` |
| Subject-Vorbedingungen | `revision=38`, `attempt=1`, `attempt_limit=4`, `start_count=13`, `operation_count=38` |
| Intake | `op3_003e4bae5f19b85d2f0abde109afc3b4`, 1425 Bytes, vorhandener Inhalt nur als Digest gebunden |
| Eigentümerhistorie | Drei bestehende Owner-Operationen, davon null `retire_unknown`; geordneter Digest im Bindungsartefakt |

Der zuvor nur unzugeordnete Lease-Zähler ist jetzt eindeutig auf diesen Zyklus, diesen Job und diesen offenen Versuch bezogen: alle vier Start-/Lease-/Job-Korrelationsfelder sind `true`; genau ein passender Start besitzt null Ergebnisse und null Dispositionen. Zwei Archivoriginale sind vorhanden, ihre tatsächlich nachgerechneten Körperhashes stimmen mit den gespeicherten Digests überein. Dies ist ein Fortschritt bei der Zielzuordnung, keine Schreibberechtigung.

## 2. Konkrete technische Grenze

Die beobachteten Funktionen `official_v3_jobs_api.execute_v1`, `assert_history_v1` sowie die privaten Queue-CAS-/Claim-/Mutate-Funktionen haben für `postgres` **keine EXECUTE-Berechtigung**. Die geschützten Jobtabellen sind für diesen Akteur lesbar, aber **nicht UPDATE-berechtigt**. Die eine bestehende Mitgliedschaft lautet `grantor=supabase_admin, admin=true, set=false, inherit=false`. Eine Verwaltungsoption ist keine Erlaubnis zum Rollenwechsel oder zur geerbten Ausführung.

Der geprüfte Quelltext des normalen `tx_queue_mutate_v1` verweigert `complete/fail`, wenn die Lease bereits abgelaufen ist. Sein `settled_failure`-Pfad verlangt außerdem ein echtes Token, das weder gelesen noch rekonstruiert wurde. Das frühere Dev-Cycle5-Muster erzeugte seine Hilfsfunktionen über einen temporären GRANT/SET-ROLE-Pfad; dieser ist für das vorliegende Production-Paket ausdrücklich ausgeschlossen. Das ursprüngliche Owner-Muster ist an andere Start-/Operationszähler gebunden und darf nicht als passende Cycle12-Freigabe eingesetzt werden.

**Folge:** Der direkte beobachtete `postgres`-Schreibpfad ist nicht nutzbar belegt. Ein eventuell bereits bestehender geschützter Owner-Hilfspfad ist damit nicht pauschal ausgeschlossen, aber seine Existenz, genaue Definition und erfolgreiche eng begrenzte native Ausführung sind nicht nachgewiesen. Ohne diesen Nachweis bleibt die Umsetzung gesperrt; kein Ersatz durch neue Rollen, Grants, RLS-Abschaltung, einen neuen SECURITY-DEFINER-Bypass oder direkte Tabellenkorrekturen. Die Quellen- und Metadatengrundlagen stehen in `SOURCE_PROVENANCE.json`.

## 3. Genau vorgesehener späterer Schreibumfang

1. **Gebundener Katalognachfolger:** Nur die im späteren Code-Review einzeln festgeschriebenen privaten Receipt-/Dispatch-Gate-Objekte und exakt benannten vorhandenen Funktionen dürfen sich ändern. Der Scheduler-Namensraum muss im Nachfolger ausdrücklich vollständig erfasst sein; seine bisherige partielle Abdeckung darf nicht als vollständiger Schutz ausgegeben werden. Jede unbekannte Katalogdifferenz führt zum Abbruch. Der v4-HTTP-ID-Zähler bleibt erhalten.
2. **Echte Abschlussquittung:** Der normale geschützte Ablauf lautet Review → echte aktuelle Owner/AAL2-Handlung → unabhängige Bestätigung. Die neue unveränderliche Quittung bindet den Zyklusdigest, alle neun Dispatchdigests, Job/Versuch/Intake, Archiv- und Vorgängerdigests sowie die Entscheidung `unknown_retired`. Keine Actor-ID, Sitzung oder neue Operation wird vorgetäuscht. Die neue Operation-ID wird erst durch den tatsächlichen autorisierten Ablauf erzeugt; dieses Paket enthält keinen erfundenen Platzhalter dafür.
3. **Enger nativer Abschluss:** Nur der eindeutig zugeordnete abgelaufene offene Versuch darf über einen zuvor bewiesenen vorhandenen geschützten Autoritätspfad abgeschlossen werden. Der Vergleich aller in `TARGET_BINDINGS.json` festgelegten Vorbedingungen und die Mutation müssen unter einem gemeinsamen atomaren Schutz erfolgen. Andere Subjects/Versuche bleiben unberührt. Der konkrete zulässige Abschlussdelta ist erst nach dem nativen Autoritätsnachweis festzuschreiben; keine heimliche Quotenerweiterung oder Zurücksetzung der Werte 13/38.
4. **Historischer Zyklus bleibt unverändert:** Zyklus 12 bleibt physisch `blocked` und feldgleich, ebenso Dispatch 38–46. Die fachliche Erledigung wird allein über die neue korrelierte, unveränderliche Abschlussquittung dargestellt. Keine Umdeutung in einen erfolgreichen Quellenlauf, keine neue positive Auskunft und keine Löschung des unbekannten Ausgangs.
5. **Scheduler erkennt ausschließlich diese Quittung:** Der genau gebundene Nachfolger darf nur den so bestätigten Zyklus 12 als erledigten Altblocker behandeln. Jeder andere blockierte Zyklus bleibt sperrend.

Das spätere Mutationspaket darf keine Bestandteile aus einer anderen Umgebung, keine Dev-Ownerquittung und keinen bereits vorhandenen Freigabetext als neue Production-Ownerhandlung verwenden.

## 4. Wiederanlauf bleibt geschlossen

Ein eigener Dispatch-Vertrag beginnt zwingend geschlossen. Installation, native Schließung und Owner-Abschlussquittung öffnen ihn **nicht**. Auch bei eingeschaltetem Scheduler und fälligem Cron muss er vor dem Anlegen eines Zyklus und vor jedem HTTP-Auftrag `closed_waiting_restart_approval` liefern. Das ist ein gesondert zu prüfender negativer Erfolgspfad des Abschlusses.

Erst eine später ausdrücklich freigegebene unveränderliche Wiederanlaufautorisierung darf atomar genau **einen neuen natürlichen Zyklus** samt dessen begrenzten Fortsetzungen zuordnen. Sie bindet den tatsächlichen neuen Katalog und die echte Abschlussquittung. Weitere neue Zyklen brauchen eine eigene Entscheidung. Die ursprüngliche HTTP503-Ursache bleibt unbewiesen: der jetzt korrelierte alte Versuch erklärt den verbleibenden Zustand, rekonstruiert aber keinen verlorenen historischen HTTP-Fehlerkörper. Ein neuer Lauf benötigt vorher ausreichend belegten aktuellen nativen Ablauf, qualifizierte Quellen, freigegebene Methode und frischen natürlichen BG1-Vollbeleg.

## 5. Vorbedingungen für endgültige Dateien

`NATIVE_VALIDATION_PLAN.md` legt die nächste getrennte Abnahme fest. Erst nach erfülltem Autoritätsgate, nativen Positiv-/Negativnachweisen und unabhängigem Review werden echte Probe-, Installations-, Nachlese- und Rücknahmedateien geschrieben/gehasht und einzeln zur Freigabe vorgelegt. Bis dahin ist keine Installations-SHA vorhanden. Ein Kandidat mit unbekannter Mutationsautorität wäre keine sichere, freigabefähige Installation.

Der beobachtete BG1-Beleg 1789 war beim Read frisch; er ist kein dauerhafter Ausführungsausweis. Jede zukünftige Aktion verlangt einen dann neuen passenden natürlichen Vollbeleg. Ändert vorher das AT-Paket oder eine andere genehmigte Änderung den Vorgänger, ist diese Schreibvorbereitung neu zu binden; kein blindes Neuversiegeln.

## 6. Was diese Vorbereitung tatsächlich leistet

Fertig sind die unveränderlichen Zielbindungen, konkret nachgewiesenen Autoritätsgrenzen, der zulässige Schreibvertrag, der getrennte Wiederanlaufvertrag und die Abnahme-/Rücknahmespezifikation. Es wurden keine SQL-Dateien, Tests oder Runtimeaktionen ausgeführt. CH→DE bleibt gesperrt; AT bleibt „derzeit nicht verfügbar“.
