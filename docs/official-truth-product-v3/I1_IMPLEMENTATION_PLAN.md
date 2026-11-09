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
