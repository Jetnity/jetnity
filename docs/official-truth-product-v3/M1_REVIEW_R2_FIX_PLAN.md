# M1 — Review R2: Claim-Replay bleibt an seinen Erwerb gebunden

Root review: Draft #1166, Kommentar `6729792116`, P1 / CHANGES REQUIRED. Gleicher Autor und dieselbe Session `/root/v3_monitor_writer`. Root bestätigte diesen engen Plan am 2026-11-09. Kein Ready-/Merge-/Aktivierungs-PASS.

## Reproduzierter Befund

Die gemeinsame Queue-Bestätigung validierte den historischen Operationsrecord, ersetzte ihn anschließend aber durch den aktuellen Jobrecord. Beim Claim blieb danach nur die Lease-ID-Prüfung übrig. Wurde eine abgelaufene Lease unter einer anderen Operation mit derselben Lease-ID neu erworben, konnte ein Replay der alten Claimoperation dadurch die neue Revision und Generation erhalten und damit abschließen. Eine andere Lease-ID wurde korrekt abgewiesen. Root reproduzierte dies mit dem wirklichen Coordinator und dem isolierten atomaren Teststore; kein aktiver Produktionspfad ist betroffen.

## Enger Fix

Nur Claim erhält intern die Bestätigungsart `exact_operation`. Der vollständige bei dieser konkreten Operation gespeicherte Erwerbsrecord muss mit dem aktuell gelesenen Record übereinstimmen: Namespace/Jobidentität, erworbene Revision, Generation und vollständige Lease einschließlich Zeiten bleiben an die ursprüngliche Operation gebunden. Eine spätere Generation ist superseded, auch bei identischer Lease-ID. Gültiger identischer Replay und verlorener ACK dürfen denselben Erwerb ohne zweiten Write bestätigen.

Enqueue behält ausdrücklich seine aktuelle ACK-Semantik: Ein historischer queued-Receipt zeigt weiterhin den wirklichen gegenwärtigen Zustand und darf keinen abgeschlossenen Job als pending wiederbeleben. Es gibt keine öffentliche DTO-/S0-/Storage-Vertragsänderung. R1-Recoverycode und dessen Regressionen bleiben unverändert.

## Regression und Lieferung

In beiden Namespaces: legaler Replay, verlorener Claim-ACK, Reclaim mit gleicher und anderer Lease-ID, alter Complete/Fail abgewiesen, neuer Eigentümer darf abschließen, verlorener ACK nach Reclaim sowie Reclaim vor Rückkehr des ersten Claim-ACK. Die ursprüngliche unabhängige Root-Probe wird unverändert erneut ausgeführt. Danach volle lokale M1-/S0-Gates, aktualisierte Naht/Handoff/Manifest und STOP. Keine Writes außerhalb M1, keine DB-/Hosted-/Production-/GitHub-/Commit-/Push-Aktion.

## Tatsächlicher Red-/Green-Nachweis

Die zwölf neuen Regressionen wurden zuerst gegen den unveränderten Queuecode ausgeführt: sechs bestanden, sechs scheiterten genau an der unerlaubten Generationübernahme (gleiche Lease-ID, verlorener ACK nach Reclaim und Reclaim vor erster ACK-Rückkehr, jeweils Regel/Discovery). Nach dem engen Fix bestanden alle zwölf. Die unveränderte ursprüngliche Root-Probe lief ebenfalls mit Exit 0; beide Lease-ID-Varianten ergeben superseded und geben keine neue Generation aus. Vollständiger neuer Scope-Gate: 133/133; TypeScript, ESLint, Exporthygiene und Erreichbarkeit Exit 0. Diese Autorenprüfung ersetzt das unabhängige Root-Review nicht.
