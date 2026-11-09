# M1 — Review R1: gemeinsame atomare Versionsgrenze

Root review: Draft #1166, Kommentar `6729597059`. Gleicher Autor und dieselbe Session `/root/v3_monitor_writer`. Root bestätigte diesen engen Fixplan am 2026-11-09. Kein Runtime-/Ready-/Merge-/Aktivierungs-PASS.

## Reproduzierter Befund

Der bisherige Coordinator prüfte Methode, Proof und Head nacheinander über asynchrone Ports. Root reproduzierte einen Headwechsel, Methodenwiderruf und Ablauf während des letzten Proof-Await; trotzdem erschien `confirmed`. Ein Widerruf während des Proof-Await am Write konnte außerdem noch einen Commit zulassen. Dies betrifft ruhenden neuen Code, keinen aktivierten Produktionspfad.

## Korrektur

Die bestehende historische Operationsauskunft `confirm` und eine Vorab-Lesung `readHead` bleiben nützlich, können aktuelle Autorität jedoch nicht gemeinsam bestätigen. M1 verlangt deshalb für jede Mutation und jeden aktuellen Erfolg einen neuen code-owned atomaren Boundary-Port. Ohne ihn bleibt die Transition vor Writes `unsupported`.

Der Boundary-Port erhält getrennte tatsächliche Methoden- und Proofreceipts, das vollständige vorbereitete Bündel und seine Operationsbindung, den erwarteten vollständigen Head sowie eine Deadline. Unter derselben Sperre und nach allen asynchronen Prüfungen liest er aktuelle Methodengültigkeit, Original-/Proof-/Archivzustand, Head und Enduhr einschließlich rechtlichem Datum. Erst dieser gemeinsame letzte Punkt darf Version/Archiv/Audit/Operation/Invalidierung atomar schreiben oder die aktuelle Version bestätigen. Die Prüffunktion des Coordinators allein ist ausdrücklich kein Ersatz für diese gemeinsame Prüfung.

Der synthetische Testadapter führt die Prüfung tatsächlich über seine Receipt-WeakMaps und aktuellen Zustände unter demselben Mutex aus. Keine echten Storage-/Methoden-/Source-Bindungen werden installiert. Replay braucht denselben aktuellen gemeinsamen Nachweis; ein historischer Commit allein reicht nicht.

## Regression und Grenzen

Alle vier Root-Gegenproben werden mit unveränderten Sicherheitszielen als lokale Tests aufgenommen: kein `confirmed` nach Headwechsel, Widerruf oder Ablauf beim letzten Proof-Await; kein Write nach Widerruf während des Write-Proofs. Hinzu kommen rechtlicher Datumswechsel, Proofwechsel, vollständige Archiv-/Recovery-/Replay-/Konkurrenzprüfungen. Danach vollständige neue M1-/S0-Tests, Typecheck, Lint, Handoff, Manifest und STOP. S0, I1, U1 und zentrale Importerinventare bleiben unverändert.
