# S1 — dauerhafter Proposal-Intake und Import-Quarantäne, TASK V1

9. November 2026. Auftrag von Root / Technical Lead innerhalb [PROGRAM_V1](PROGRAM_V1.md) und [Anschlussplanung V1](https://github.com/Jetnity/jetnity/issues/1162#issuecomment-6730597160). Der Owner beauftragt ausdrücklich die Fortsetzung bis zur fertigen Datenbank und Einreisefunktion. Diese Aufgabe liefert den nächsten echten Speicherbaustein, keine Hosted-Aktivierung.

## Baseline und Autor

- Live main `ce3366e26de73961d4682236af92347bfc3a4ca8`; NORMAL. E1-Basis `97629e9130a907b8b9b8072d06bda1956758aa6e`, Tree `8759d8a3e39143c84810c8cca1641c2c91cbdd66`, PR #1167. Vollständige CI42548474576 success, exakte Preview READY; E1 bleibt Draft.
- Branch `feat/official-truth-v3-intake-store-1-20261109`, bewusst auf dem geprüften, nicht gemergten E1 gestapelt. Kein Import aus #1135 oder anderen gehaltenen Drafts.
- Einziger Implementierungsautor: **Jetnity Official Truth V3 Intake Store 1 — Codex Generation 1**, Session `/root/v3_s1_storage_writer`. Kein aktiver Cursor wird behauptet. Root entscheidet allein über PASS, Ready, Veröffentlichung und Merge.
- Vor Code: einschlägige Repository-Regeln lesen und `S1_PLAN_V1.md` mit Dateiplan, Transaktions-/Rollenmodell, Fehlermodi und Tests abgeben. Zuerst gemeinsames Intake-API vorschlagen; Root friert es vor N1-Parallelstart ein. Keine stillen Änderungen am S0/I1-Vertrag.

## Ziel und Ownership

Originale untrusted Proposal-Bytes und vollständige Importergebnisse über Prozess-/Verbindungsneustart dauerhaft erhalten. Ein einziger PostgreSQL-Intake versorgt die vorhandene I1-Quarantäne und später den neutralen N1-Dateieingang. Kein paralleler Dateimanifest-Autoritätsstore.

Eigene Dateien unter `lib/readiness/official-truth-product-v3/storage/`, Kandidat/Native-Tests unter `scripts/db/official-truth-v3-intake-store-1/`, zwingend ausgeführter kleiner Native-Test-Wrapper unter dem bestehenden `lib/**/*.test.ts`-Discovery, und `docs/official-truth-product-v3/S1_*`. Keine Änderung bestehender Quellen-/Import-/Monitor-/Accepted-Store-Implementierungen, zentraler CI/Dependencies, produktiver Migrationen oder anderer Guards ohne ausdrücklichen TL-Nachtrag. Benötigte endliche Import-Guard-Ergänzungen vorher benennen; Scanner und alte Assertions bleiben erhalten.

## Verbindliche Eigenschaften

1. Intake akzeptiert exakten UTF-8-Text mit bestehendem `readV3ProposalUpload`, höchstens65536Bytes. Parser/Registry bleiben kanonisch. Originaltext/Bytes vor Reserve atomar speichern; JSONB ist kein Ersatz für Originalbytes. Unbekannte Felder, PII, schlechte Kodierung und Limits vor Write ablehnen. Identischer Operationsschlüssel mit anderen Bytes oder anderer serverseitiger Bindung kollidiert. Keine nachträgliche Normalisierung, kein Upload eines Trusted-Receipts.
2. Server-owned Bindung umfasst Operation, Job, Kontext, Methode sowie expliziten Delivery-/Runnerbezug nach eingefrorenem API. Researcher können weder Registry-/Methodenautorität, Fence/Lease noch bestätigte Herkunft liefern. Die Bindung ist ein Identitätscheck, noch kein tatsächlicher Job-/Quellenbeleg. Produktiver Eingang bleibt ungebunden.
3. Reserve/Finish/Confirm sind echte atomare PostgreSQL-Operationen. Reserve sperrt die relevante Zeile, prüft immutable Bytes/Identität und gibt genau eine gebundene Generation samt begrenzter Lease aus. Busy bleibt busy. Reclaim nach Ablauf erhöht monoton die Generation; alter Worker kann nicht finishen. Vollendete Operation liefert exakt das vollständige bestätigte Outcome zurück.
4. Finish prüft dieselbe Operation, Digest, Ticket, Generation und tatsächliche DB-Endzeit unter Sperre. Outcome, unveränderliches Audit und ggf. Eskalationsschlüssel werden gemeinsam gespeichert. Ticketkopie/ausgedachte Generation/abgelaufener Worker/fremder Kontext werden verweigert. Keine Verlängerung von Quellen-/Methodenfrische durch Quarantänepersistenz.
5. Unklarer Commit darf nur durch Confirm derselben Operation/Bindung aufgeklärt werden. Keine frische Operations-ID, kein blindes business retry. Confirm unterscheidet unbekannt, noch nicht abgeschlossen, Kollision und tatsächlich vollständiges Ergebnis. Verbindungs-/Abort-/Lockfehler spiegeln keine Bytes, Secrets oder personenbezogenen Inhalte.
6. Geschlossener vollständiger Outcome-/Audit-Codec vor jeder persistierten Rückgabe: alle Statusvarianten, gesamte Decision, previousDecision, archiveAppend, Version/Transition und untereinander passende Operation/Job/Context/Digest/Method. Vorhandene S0-Reader wiederverwenden; keine Typ-Casts als Prüfung und keine erfundenen privaten Receipts. Prepared bleibt `not_committed` und `required_before_commit`. Eskalationsschlüssel in der Quarantäne bedeutet weder Public-Suppression noch erfolgte Benachrichtigung.
7. Kandidat bleibt unter `scripts/db/` und UNAPPLIED. Private Schema-/Tabellen-/Rollen-/Grantgrenzen explizit, RLS als Defense in Depth. PUBLIC/anon/authenticated haben keinen direkten Zugriff; kein breit berechtigter Service-Role-Fallback. Engste erforderliche Rolle, keine neue menschliche Owner-/Sessionsemantik. Falls privilegierte interne Funktion nötig, vor Implementierung begründen und Root prüfen lassen; keine Definer-Abkürzung zur Fehlerbehebung.
8. Parameterisierte SQL-Adapter und echte Native-Ausführung; keine neue Runtime-Dependency ohne TL-Entscheid. Ein explizit injizierter, unveröffentlichter Verbindungsadapter ist zulässig, kein Environment-/Default-Fallback. Bestehenden lokalen Cluster-/Wire-Testweg wiederverwenden, nicht in produktiven Runtime-Code importieren. Kein zweiter Accepted Store, keine Quelle-/Registrykopie, kein Schema2-Bypass des alten Writers.
9. Bounded Ressourcen und tatsächliche Bereinigung: Abbruch/Timeout besitzen und beenden begonnene lokale Arbeit; nie bloß Promise.race mit unkontrolliert weiterlaufendem Write. Tatsächliche Transaktions-/Commit-Ergebnisse ehrlich als unbestätigt abbilden. Native Tests dürfen nur einen frisch erzeugten run-owned Cluster ohne externe Verbindung starten und räumen ihn vollständig auf.

## Nachweise und Tests

Erforderlich sind tatsächliche native Belege für: exakter Byte-Roundtrip einschließlich Whitespace; gleiche/fremde Operation; zwei konkurrierende Clients; Reserve-Busy; Ablauf und Reclaim mit gesperrtem altem Ticket; Neustart/erneuter Adapter und unveränderte Replay-Ergebnisse; Commit erfolgreich aber Antwort verloren mit Same-operation-Confirm; Fehler vor/innerhalb Commit ohne Teilzustand; alle vollständigen Outcomevarianten einschließlich Archiv/Predecessor; ungültiges Outcome/Audit; Method-/Context-/Jobkollision; Rollen-/Direct-DML-/Function-Zugriff; lokaler Kandidat-Rückbau und kontrollierte Neuinstallation. Keine Quarantäneprüfung als Quellenautorität ausgeben.

Fokussierte Unit-/Codec-/Integrationstests plus unveränderte vorhandene relevante V3-Tests, TypeScript, Lint, Hygiene. Native Tests müssen in vorhandener Pflicht-CI ausgeführt werden, nicht optional übersprungen werden. Root prüft vollständigen Diff, Originale, tatsächliche CI und Exact-Head-Preview selbst. Node22 wie im Repo; lokale fehlende Laufzeit/PG wahrheitsgemäß benennen, nicht skippen. Keine Verlängerung bestehender test budgets oder Entfernung bestehender Gates.

## Parallelisierung

S1 ist alleiniger Owner seines Speichermoduls und des neuen gemeinsamen Intake-API. N1 startet nach dessen Review/Freeze in eigenem Branch mit nur Dateieingang/Tests. D1 erstellt unabhängig den Methodenentscheidungsentwurf. Root führt gemeinsame Architektur-/Kontinuitätsupdates und Integration erst bei ruhenden Autoren zusammen. Review-Fixes gehen an denselben Autor/dieselbe Session; jeder neue Head braucht neue Gates.

## Grenzen, Rücknahme, STOP

Keine Hosted-DB-/Auth-/RLS-/ACL-/Migration-/Credential-Abfrage oder -Mutation, kein realer Quellen-/Provider-/Researcheraufruf, kein Scheduler/Notificationstart, keine Kosten/Secrets oder öffentliche Route. Datenbank-/Production-Aktivierung und tatsächliche Methodenfreigabe bleiben beim Owner nach reifem Dev-Paket. Lokale wegwerfbare PostgreSQL-Tests sind ausdrücklich im Code-/Testauftrag enthalten und brauchen keine neue pauschale Zustimmung.

#917 bleibt APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, Ledger UNKNOWN; Stage2 NOT_ATTEMPTED. Die konkret verweigerte Nachprüfung niemals wiederholen, umformulieren, delegieren oder über andere Verbindung bzw. menschlichen Ersatzoperator versuchen. #1139 NOT_ACCEPTED, Dev-Paket NOT_RELEASE_READY, vorhandenen #1142-Kandidaten wiederverwenden. #1131 Ready-STOP, #1135, #968 und Privacygates bleiben eigenständig.

Lokales Rollbackskript räumt ausschließlich den eigenen frischen Kandidaten unter belegten Voraussetzungen ab; keine destructive Defaultausführung und kein behaupteter Dev-Recoveryplan. Unangewendeter Code ist per normalem Revert rücknehmbar; Original-/Audit-Retention vor Hosted-Einsatz gesondert klären.

Lieferung: Code, SQL-Kandidat, Tests, tatsächliche Befehle/Resultate, Datei-/Hashmanifest, Status/Handoff/Selfreview, offene reale Anschlüsse und präziser nächster Schritt. **do not mark Ready; do not merge; do not start a follow-up slice.** Keine Remote-Schreiboperationen durch Autor; lokale Änderungen/Commits nur im eigenen Worktree. STOP zur unabhängigen Root-Prüfung. Selfreview ist kein TL-PASS.
