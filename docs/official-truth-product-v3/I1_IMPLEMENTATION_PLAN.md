# I1 — Umsetzungsplan TASK V1

Autor: **Jetnity Official Truth V3 Import 1 — Codex Generation 1**. Tatsächliche Session: `/root/v3_import_writer`, kein Cursor-UI-Rename. Draft #1164, Seed `9f982e7a4f3e9679412f0936e8eb07f83828aa96`, gemeinsamer eingefrorener Entwicklungsvertrag S0 `19c4736a73f639daaf5337465386155607792a4f`. Kein Ready, Merge oder Aktivierungs-PASS.

**Aktualisierte Basis gemäß `I1_TASK_R2.md`:** Root integrierte ausschließlich die additive S0-R3-Discovery und das Amendment. Aktueller Autoren-HEAD vor Codepublikation ist `9c5c2bad4201be45376b1ebbb7debc368794b689`, gemeinsamer S0-Pin `ab26914ff01dde64020879b9e41cea8b1e1738aa`. Die eigene I1-Implementierung bleibt uncommittet; der ursprüngliche Plan/Seed oben ist historische Startevidence. Sämtliche finalen Gates werden auf der neuen Basis wiederholt.

## Ziel und Dateien

`lib/readiness/official-truth-product-v3/import/interface.ts` liest einen anbieterneutralen, begrenzten UTF-8-JSON-Vorschlag über den bestehenden S0-Reader. Es liefert einen exakten Upload-Fingerprint und ein unverändert untrusted normalisiertes Proposal. Ein maschinenlesbares Interface-Manifest beschreibt Version, Medienformat, Felder, Grenzen und den kanonischen Leser.

`service-server.ts` verbindet diesen Eingang mit atomarem Quarantäne-/Replay-Port, getrenntem Methodenautoritätsport, aktuellem History-Port und Quellen-/Originalprüfport. Nur servereigene verifizierte Quellenbeobachtungen bestimmen die Regel; vorgeschlagene Fakten und behauptete Abrufdaten sind keine Eingabe der Quellenprüfung. Der Dienst baut Quellenentscheidung, Eskalation oder neue vorbereitete Version samt CAS-Plan deterministisch. Ein zweiter Methoden-/Original-/History-Reproof ist vor der Übergabe Pflicht. Die Übergabe bleibt `prepared`, niemals `accepted`/`published`.

`service.test.ts` verwendet echte vorhandene Runtime-Leser und die kanonische Extraktor-Ausführung mit ausschließlich synthetischen `.example`-Originalen. Atomare Testports prüfen konkurrierende Uploads, Idempotenz/Kollision, Fehler/unklaren Commit, Methodenwiderruf während Await, manipulierte Quellen-/Context-/Fact-Bindungen, optionale Ausfälle, echte Konflikte und History-Erhalt. Positive Testports werden niemals zur Produktionsfactory importiert.

Die Dokumente `I1_INTERFACE.md` und `I1_SELF_REVIEW_HANDOFF.md` beschreiben konkrete Beispiele, Wiederverwendung, tatsächliche Tests und verbleibende Bindungen.

## Grenzen und Integrationsentscheidung

Keine SQL-/Migration-/Datenbank-/Auth-/RLS-/ACL-/Credential-/Provider-/Modell-/Scheduler-Aktion. Keine Route, UI, neue Dependency oder Kosten. Der zusammenhängende Reisegraph wird nicht verändert. Neue globale Regelrecords behalten alle Bedingungen; der Legacy-Writer nimmt nicht alle bedingten beziehungsweise Schema2-Fakten an. Daher keine Casts, kein Abflachen und kein erfundener Store-Receipt. E1/M1 muss den vorbereiteten Plan mit erneutem Reproof und echtem atomaren Commit/Confirm anbinden.

Ein Quellenprüfport ist eine zukünftige code-owned Original-/Qualifikations-/Vergleichsgrenze. Ein übergebenes Datenobjekt, Hash oder Status stellt diese Autorität nicht her. Die öffentliche Produktionsfunktion besitzt keine einspritzbaren positiven Ports und bleibt unbound. Die allgemeinen Ports dienen der geprüften Orchestrierung und den isolierten lokalen Tests; ihre spätere reale Bindung benötigt gesonderten Review und die reservierte Methoden-/Dev-Freigabe.

#917-Readback bleibt gesperrt, ohne Wiederholung, Umformulierung, Delegation oder menschlichen Ersatz. #1131 STOP, #1135 separat, #968 Preview ist keine nachgewiesen isolierte DB-Umgebung.

## Geplante Prüfung und STOP

Node 22.23.4, gezielte echte Modultests, `tsc --noEmit --incremental false`, fokussiertes ESLint, Export-/Erreichbarkeitshygiene soweit relevant. Keine Behauptung eines vollständigen Builds, einer realen amtlichen Regel, Datenbankpersistenz oder öffentlich gemessenen SLO ohne Lauf. Root besitzt zentrale Dokumente, GitHub-Veröffentlichung, unabhängigen Review und alle Ready-/Merge-Entscheidungen. Nach eigener Lieferung STOP, unmittelbare Fixes nur in derselben Session.

## Unmittelbare Reviewkorrektur R1

[TL CHANGES REQUIRED R1](https://github.com/Jetnity/jetnity/pull/1164#issuecomment-6729246568) wurde in derselben Session aufgenommen: exakter aktueller History-Archivappend als vierter S0-Leserparameter; Ungewissheit schon vor dem mutierenden Reserveaufruf; begrenztes lokales Budget mit Abort-Race/Cleanup und keine Weiterarbeit nach verspäteter Antwort. Regressionsfälle verwenden tatsächliche Archivfortschreibung und konkurrierende beziehungsweise bewusst hängende lokale Promises. Quarantäne-Lease/Fencing ist ein ausdrücklicher künftiger Durable-Portvertrag, keine behauptete produktive Persistenz.

## Enger Fixplan für TL CHANGES REQUIRED R2

Basis vor diesem Fix: sauber publizierter Autoren-HEAD `a02beb141f5266b0c332e3040c79c6f1782c0fcd`, gemeinsamer S0-Pin unverändert `ab26914ff01dde64020879b9e41cea8b1e1738aa`. Root reproduzierte [A2-F1 / R2](https://github.com/Jetnity/jetnity/pull/1164#issuecomment-6729499351) für beide Gründe `primary_unclear` und `comparable_conflict`: Wird gleichzeitig ein zuvor gelöster Konflikt archiviert, verwirft das Eskalationsergebnis den bereits geprüften Archivappend und den unmittelbaren Vorgänger. Ein späterer S0-Read des persistierten Ergebnisses scheitert dann zu Recht. Dieser Plan wird vor der Codeänderung durch Root bestätigt.

Root bestätigte diesen Plan ausdrücklich vor der Codeänderung. Die vier neuen Regressionen wurden zunächst gegen den unveränderten Service ausgeführt: Beide positiven Eskalationsfälle scheiterten am fehlenden Vorgänger, beide Gruppen ungültiger Archive wurden weiterhin korrekt abgewiesen. Danach wurde ausschließlich die unten beschriebene Korrektur umgesetzt.

1. Ausschließlich die Eskalationsvariante von `V3ImportOutcome` um `previousDecision` und `archiveAppend` erweitern. Der Rückgabepfad übernimmt genau `history.decision` und den bereits vom S0-Leser validierten sowie vom Evidence-Port erneut geprüften `archiveValue`. Kein neuer Reader, kein aus Referenzen rekonstruierter Archivinhalt, keine Abschwächung von S0.
2. Den Quarantänevertrag explizit auf das vollständige gebundene Ergebnis erweitern: Entscheidung, geprüfter Vorgänger und exakter Archivappend gehören gemeinsam zur atomaren Ergebnis-/Audit-/Outboxpersistenz und zum bestätigten Replay. Ein Outboxschlüssel oder Archive-Head ersetzt diese Records nicht. Die vorhandenen Lease-/Fencing-/Revisionspflichten bleiben bestehen; kein produktiver Adapter wird ergänzt.
3. Beide Eskalationsgründe als echte lokale Regression aufbauen: vorherige gültige Entscheidung mit gelöstem Konflikt, geprüfter Archivappend, gleichzeitige neue Eskalation. Ein serialisierender Quarantäne-Testport speichert und liest JSON. Der unmittelbar zurückgegebene und der aus gespeichertem JSON replayte vollständige Ausgang müssen mit dem unveränderten S0-Leser samt Vorgänger/Archiv erfolgreich lesbar sein. Fehlender, fremder oder manipulierter Archivnachweis bleibt abgewiesen; kein Accepted-Erfolg und keine zweite Verifikation beim bestätigten Replay.
4. Schnittstellenbeschreibung und Self-Review/Handoff auf den neuen exakten Stand aktualisieren, einschließlich historischer R1-Lieferung, R2-Ursache, tatsächlicher Tests, Dateimanifest und weiterhin ungebundener Produktionsanschlüsse.
5. Vollständige S0+I1-Modultests, vollständiges TypeScript, fokussiertes ESLint, Export-/Erreichbarkeitshygiene und Whitespaceprüfung erneut mit Node 22 ausführen. Keine Commits, Pushes, GitHub-/DB-/Provideraktionen. Danach STOP in derselben Session.

## Unmittelbare Reviewkorrektur R3 — Foundation-Importerinventar

Nach Veröffentlichung des R2-Stands und der zwei separat geprüften S0-Importerergänzungen ist die neue saubere Basis `ae22ea79068a4946e68b08dc5a9b101fb3f55ab5`. Der vollständige Auftrag `I1_REVIEW_R3_TASK.md` betrifft ausschließlich den dritten, vorhandenen Foundation-Guard. Root bestätigte vor Code den in `I1_REVIEW_R3_FIX_PLAN.md` festgehaltenen engen Plan: ein exaktes Pfad/Modul/Symbolmengen-Tupel für den bereits bestehenden I1-Import von `ownRecord` und `immutable`, zusätzliche Negativproben und unveränderte Scanner/Assertions. Kein Runtimefix oder neue Autorität.

Die Korrektur fügt dem Foundation-Test 22 Zeilen hinzu und löscht keine. Alle fünf vollständigen Korpora bestanden 242/242 Tests ohne Skips; vollständiges TypeScript und fokussiertes ESLint bestanden. Die bisherigen I1-Runtime/Testbytes und die zwei exklusiv vom S0-Autor besessenen Guards blieben nach Hashvergleich unverändert. Der Fixplan enthält exakte Gates, Manifest und Handoff. Root muss nach Veröffentlichung vollständige CI auf dem neuen Head erneut prüfen; danach keine automatische Folgearbeit. Autor STOP.
