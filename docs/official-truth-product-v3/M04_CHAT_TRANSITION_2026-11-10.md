# Jetnity — verbindlicher Chat-Übergang am 10. November 2026

## 1. Ergebnis und Anlass

**SAVED INTERRUPTION — M04 Phase B ist nicht fertig. CHANGES REQUIRED R9 ist offen; native PostgreSQL- und vollständige Exact-Head-Gates sind offen. Kein Technical-Lead-PASS, Ready, Merge oder Aktivierungsauftrag.**

Der Product Owner bat nach einer Verbindungsunterbrechung ausdrücklich darum, den Stand für einen neuen Chat zu speichern. Root hat deshalb die Implementierung gestoppt und sichert den vorhandenen, unabhängig geprüften V7-Quellstand als **Draft-Checkpoint in PR #1178**. Der Autor hat nach R9 ausschließlich bestehende Quellen gelesen. Es gibt keine R9-Implementierung und keinen neuen R9-Testlauf. Alle drei tatsächlichen Agentensessions haben ihren STOP bestätigt. Dieser Checkpoint ist kein Abschluss des Datenbank-/Einreiseprodukts.

Maßgeblicher Snapshot vor der Veröffentlichung: **2026-11-10 00:56 UTC / 01:56 CET**. Die eigene Commit-SHA dieses Dokuments wird nach Veröffentlichung im [PR #1178](https://github.com/Jetnity/jetnity/pull/1178), im [Live-Index #751](https://github.com/Jetnity/jetnity/issues/751) und im [Programm #1162](https://github.com/Jetnity/jetnity/issues/1162) exakt zurückgelesen und festgehalten. Diese Referenzen enthalten auch den dann tatsächlich beobachteten CI-/Preview-Stand. Eine Selbst-SHA wird hier nicht erfunden. Spätere Live-Evidence gewinnt immer.

## 2. Verbindlicher Einstieg für den nächsten Chat

1. `JETNITY_START_HERE.md` auf dem tatsächlichen aktuellen Arbeitsbranch lesen; `main` allein enthält diesen ungemergten Checkpoint noch nicht.
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` lesen.
3. [M04_HANDOFF_V1.md](M04_HANDOFF_V1.md), dieses Dokument und [ACTIVE_WORK_STATUS](../ACTIVE_WORK_STATUS.md) lesen.
4. [Phase-A-Freeze](M04_PHASE_A_FREEZE_V1.md), [TASK V1](M04_TASK_V1.md), [eingefrorenen Plan](M04_PLAN_V1.md), [technische Allokationen](M04_PHASE_B_TECHNICAL_ALLOCATIONS_V1.md), [Autorenstatus](M04_PHASE_B_STATUS_V1.md) und [Quellmanifest](M04_PHASE_B_SOURCE_MANIFEST_V1.json) lesen.
5. Die beiden unabhängigen V7-Reviews, Roots Offline-Receipt und insbesondere den [offenen R9-Befund](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6755677459) lesen.
6. `main`, offene PRs/Issues, tatsächlichen Branch/Head/Tree, Merge-Base/Ahead/Behind/Diff, Review-Kommentare und Threads, GitHub-Actions-Metadaten und Vercel Preview/Production erneut live verifizieren. Nicht den grünen früheren Dokumentationslauf als Code-Abnahme übernehmen.
7. Tatsächliche Agentensession und fortbestehende besondere Gates prüfen. Erst dann den unten genau begrenzten R9-Schritt fortsetzen. Den Product Owner nicht erneut nach rekonstruierbarer Projektgeschichte fragen.

Der Betriebsmodus ist im geprüften Repository `NORMAL`. Das ist keine Aufhebung der aufgabenspezifischen Owner-/Plattformgrenzen. Unfertige Arbeit bleibt unfertig.

## 3. Live-Stand vor diesem Checkpoint

| Gegenstand | Verifizierter Stand |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Aktueller Arbeitsbranch | `feat/official-truth-v3-durable-jobs-1-20261109` |
| PR #1178 vor Checkpoint | OPEN / DRAFT, Head `05b30109ec4daa57a2ffcad7cd4dab9db292d4e1`, Tree `d3eee5780fa481f726937c9152a0c7e9f55ff092`; 32 veröffentlichte Dokumentations-/Evidenzdateien gegenüber main |
| Eltern des früheren Heads | Task-Seed `14889b050bc6e8b814bc778730c80f70d20c0d47` und aktuelles main `be79ea2591e990111bfabea7ddf500023c20a188` |
| main / Merge-Base | `be79ea2591e990111bfabea7ddf500023c20a188`, Tree `60c349e3fdbe3c31a28d7af1282f9f242cc94cf4`; vorheriger PR-Head ahead 2 / behind 0 |
| Geplante reine Checkpoint-Veröffentlichung | Ein neuer Commit mit Parent `05b30109ec4daa57a2ffcad7cd4dab9db292d4e1`; exakter Tree/Head und Compare müssen im Veröffentlichungsreceipt bestätigt sein. Kein main-Update. |
| Frühere #1178-CI | [42717680469](https://github.com/Jetnity/jetnity/actions/runs/42717680469), Versuch 1, alle acht Jobs SUCCESS, Ende 2026-11-09 23:23:28 UTC. Gilt ausschließlich für den Dokumentationshead `05b30109…`. |
| Frühere #1178-Preview | `dpl_Gb9qpx79qBTT74xarhCSpkPgsE4r`, READY, exakt `05b30109…`; `jetnity-gks9gdooc-jetnity-e1b93c82.vercel.app` |
| main-CI | [42712761377](https://github.com/Jetnity/jetnity/actions/runs/42712761377), Versuch 1, alle acht Jobs SUCCESS, Ende 2026-11-09 22:48:01 UTC |
| Production | Beide Aliase `jetnity.com` und `jetnity-app.vercel.app` READY auf `dpl_3EJhkpbtraFP3yYAxDNuAkJt3z9v`, exakt main `be79ea…`; `aliasError=null`. Zuletzt 00:50–00:51 UTC live zurückgelesen. Metadatenprüfung, keine neue vollständige Release-Abnahme. |
| Review-Threads | #1178 vor Veröffentlichung: keine formalen Review-Submissions/Inline-Threads. Roots verbindliche CHANGES-REQUIRED-Kommentare existieren trotzdem; R9 ist nicht durch die Threadzahl geschlossen. |

Der grüne Lauf im vom Owner zuletzt gezeigten Screenshot gehört zur früheren Dokumentationsfassung. Der aktuelle Runtime-Quellstand wird erst durch diesen Checkpoint veröffentlicht. Ein automatisch ausgelöster CI-Lauf auf dem neuen Head kann den noch fehlenden R9-Test nicht ersetzen, selbst wenn die vorhandenen Tests grün werden.

**Separate parallele Arbeit:** Draft #1180 „Reiseplan mit Etappenkarte, zentrale Reisesuche und persönlicher Weltatlas“, Head `cf76d3fa2446bc9db5fc7d34ee71c2882d2e1742`, Base `be79ea…`, ist eine andere Arbeitslinie. Nicht verändern oder als M04-Ergebnis behandeln. Weitere offene PRs im Snapshot: #1169, #1135, #1131, #1086, #1084, #985, #937, #913, #52, #50, #40, #39, #28. Relevante Issues #1162, #751, #1139, #917 und #968 bleiben offen. Der Live-Index und die tatsächlichen späteren Heads gewinnen über diese Liste.

## 4. Was tatsächlich vorliegt

Der M04-Code implementiert den privaten dauerhaften Recherche-Auftragsspeicher, die begrenzte Queue-/Execution-Schnittstelle, Wiederaufnahme nach verlorener Bestätigung, tatsächlichen S1/I1/MA1-Anschluss, terminale Besitz- und Drain-Verwaltung sowie einen neuen SQL-Kandidaten und leeren geschützten Rollback. Der native Testeinstieg ist vorhanden und wird über die bestehende CI entdeckt. **Das sind vorhandene Quellen, keine behauptete Datenbankinstallation oder erfolgreich ausgeführte Persistenzprüfung.**

Die nach Phase A autorisierte Autorenmenge bleibt exakt **18 Code-/Test-/SQL-Dateien plus vier Nachweisdokumente**. Der eingefrorene Plan hat SHA256 `1952dc9c930021d32620f769595bb6f1641743574265f918cad6d36cfefdb88e`. Root ergänzt getrennte Review- und Kontinuitätsdokumente. S0/I1/S1, generische Queue/Worker/E1, MA1-SQL/Rollback, vorhandene native Hilfen, CI/Packages/Timeouts und UI bleiben geschützt. Nur die zwei ausdrücklich zugelassenen bestehenden Method-Adapter-/Testdateien gehören zur 18er-Autorenmenge.

Der **unveränderte V7-Quelldigest aller 18 Dateien** lautet:

`def1398352cf6ff7bbfbbe2043bf826f5f971870c7c376de39afec06efab2bdd`

Berechnung: für jeden lexikographisch sortierten Repositorypfad die UTF-8-Zeile `SHA256 SPACE decimalBytes SPACE repositoryPath LF`, dann SHA256 über die Konkatenation. Root und beide Reviewer haben die 18 Pins unabhängig reproduziert. Nach dem STOP wurden ausschließlich die vier Autorendokumente um den offenen R9-/Übergabestand ergänzt; keine Quellbytes geändert.

| Gespeicherter Nachweis | SHA256 / Bedeutung |
| --- | --- |
| [Aktuelles Quellmanifest](M04_PHASE_B_SOURCE_MANIFEST_V1.json) | `91dc3835c63a324d1f15cabc6a61e12a7c3d8d7ca16a9b929dad15799d425d78`; 22.065 Bytes; alle 18 Quellpins, ursprüngliche Prüfungen und R9 OPEN |
| [Unverändertes tatsächlich reviewtes V7-Manifest](M04_PHASE_B_REVIEWED_SOURCE_MANIFEST_V7.json) | `d8034825c45e3e5899e95ee402e6e297a623078b82993c4b5c1c2a031856c48f`; 21.710 Bytes. Nur nachträgliche Handoff-Metadaten unterscheiden es vom aktuellen Manifest; Quellpins identisch. |
| [Autorenstatus](M04_PHASE_B_STATUS_V1.md) | `fe75ce0b747ea4c29e71a5b1a25ce21b2ac5347f3455471d1d9328b9545f7991` |
| [Autoren-Self-Review](M04_PHASE_B_SELF_REVIEW_V1.md) | `044a306d65529d26a464c2f79cfe6629733bb6df1db7dca68b3e759865265c09`; niemals TL-PASS |
| [Native-Evidence-Status](M04_PHASE_B_NATIVE_EVIDENCE_V1.json) | `fcef5d63e5b68d699a66711df195eb2dba8544f0f79302428cb7554cdcfba8bb`; keine ausgeführte native Abnahme |
| [Runtime-Review V7](M04_PHASE_B_RUNTIME_REVIEW_V7.md) / [Pins](M04_PHASE_B_RUNTIME_REVIEW_PINS_V7.json) | Bericht `24f433b11452e5aacd80aa05186b8a4fd96819543047493b1230b61814decda7`; Pins `469d6b358942ffd8c20c4f3ffbf1c9159bea378de2f21355502ff52a8a65f486` |
| [SQL-Review V7](M04_PHASE_B_SQL_REVIEW_V7.md) / [Pins](M04_PHASE_B_SQL_REVIEW_PINS_V7.json) | Bericht `11e10c0442f6306e3a1e2bb0fd8de941512ec56f525cd991d2ad20b2a9b8a593`; Pins `d7ceba9b3b5bae7e8fadb36cdce46fc26d2d029c7dff357387ee715a7a4439ae` |

Die beiden Fachreviews fanden im jeweils zugewiesenen V7-Delta keinen neuen offenen statischen Blocker. Sie erklären ausdrücklich, dass die native Ausführung aussteht und Roots R9-Frage damit nicht erledigt ist. Ihre alten lokalen Snapshotpfade sind Provenienz; die vollständigen zugehörigen Quellen, Manifeste und Berichte sind mit diesem Checkpoint im Repository gesichert. Autorenaussagen „unpublished“ beschreiben den Autoren-Snapshot vor Roots Veröffentlichung und werden für den Veröffentlichungsstand durch den PR-Receipt ersetzt.

## 5. Was Root unabhängig ausgeführt hat

[Maschinenlesbares Root-Receipt](M04_PHASE_B_ROOT_OFFLINE_CHECKS_V1.json) und [vollständiges Unit-Log](M04_PHASE_B_ROOT_UNIT_LOG_V1.txt) enthalten Befehle, Versionen, Zeiten, Quellpins und Loghashes. Ausführung 2026-11-10 00:34:59–00:35:03 UTC; alle 18 Quellen vor/nach stabil.

| Prüfung | Tatsächliches Ergebnis und Grenze |
| --- | --- |
| Fünf gezielte nichtnative Testdateien | **61/61 bestanden**, 0 Fehler, 0 Abbrüche, 0 Skips; Contract, Owned Scope, Postgres-Protokolldouble, Komposition und bestehende Method-Authority. Kein nativer PostgreSQL-Nachweis. |
| Fokussierter TypeScript-Compilerlauf | 16 Wurzeln, 0 Diagnosen; TypeScript 5.9.3. Kein vollständiger Repository-Typecheck. |
| Gezielter ESLint-Lauf | 16 Wurzeln, 0 Fehler, 0 Warnungen. Kein pauschaler Clean-Lint-Anspruch für das ganze Repository. |
| Umgebung | Vorhandener lokaler Node 24.22.1 / bestehender Paketcache; CI verwendet Node 22. Keine neue Installation. |
| Nicht ausgeführt | Lokales PostgreSQL, SQL/Socket-/Native-Testlauf, vollständiger Core-Testlauf und lokaler Full-Build. |

Unit-Log SHA256 `a5d616818e69b68edb5fc7a5259da08ab7f6b00749028c01b6e1f4f17fab0a84`; fokussiertes TypeScript-Log `8eaa0f63402319fb9d5021bb64bf443c9b607a1fe449fefb05793b2b914ec636`. Das erfolgreiche Ergebnis einzelner Offline-Tests ist kein Nachweis für dauerhafte Transaktionen, reale native Nebenläufigkeit oder den noch fehlenden R9-Fall.

Root hat vor den aktuellen Governance-Updates 49 eingefrorene Eingänge gegen Dispatch `05b30109…` geprüft: 47 bytegleich, nur die zwei erlaubten Method-Dateien geändert. Die vier ursprünglichen Phase-A-Autorendokumente sind unverändert. Die jetzt aktualisierten Current-Pointer/Handoff-Blöcke sind ausdrücklich getrennte Root-Dokumentationsänderungen; die 47er-Aussage ist eine zeitgebundene Implementierungsprüfung und kein falscher Claim, dass später aktualisierte Governance-Dateien unverändert wären.

## 6. Exakter erster unerledigter Schritt: R9

Verbindlicher [Technical-Lead-Befund R9, Kommentar 6755677459](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6755677459), veröffentlicht und exakt zurückgelesen. **Beweislücke, kein bereits nachgewiesener Runtime-Implementierungsfehler.**

Der eingefrorene Plan verlangt in U06/N12, dass eine **tatsächliche verschachtelte I1/S1-Operation noch läuft, nachdem der I1-Facade-Race bereits zurückgegeben hat**, und dass der äußere M04-Aufruf diese Operation tatsächlich bis zum Ende besitzt. Die bisherigen getrennten Nachweise zu gehaltenen Promises, Evidence-Callbacks, verlorenem Finish-ACK und nativer Acquisition/Cancellation zeigen diesen kombinierten Ablauf noch nicht.

Der gleiche Autor soll nach Wiederaufnahme innerhalb des bestehenden Scopes ergänzen:

1. Einen begrenzten tatsächlichen Kompositions-Regressionsfall.
2. Einen tatsächlichen nativen Fall mit kontrolliert offener verschachtelter S1-Reserve-/Read-/Finish-Operation über die I1-Facade-Rückkehr hinaus; echter Wait mit PID, Backend-Geburtszeit und gehaltenem konkretem Aufruf.
3. Nachweis, dass der verschachtelte Executor Abort erhält, sein tatsächliches Promise aber noch pending ist; M04 bleibt bis zum tatsächlichen Drain nichtterminal und hält Slot/Kontext.
4. Währenddessen keine fälschlich abgeschlossene Failure-Disposition, kein Backoff/Complete und keine vorzeitige Slotfreigabe. Anschließend denselben gehaltenen Aufruf freigeben und joinen: nichtpositiver äußerer Abschluss, keine weitere S1-/SQL-Wirkung nach Drain.
5. Beide im Plan verlangten Race-Grenzen konkret belegen. Früheres Capture/Open oder nur ein Callback-Double genügt nicht. Der genaue Fixture-Hook war beim STOP noch nicht fertig ausgearbeitet.

Der vorhandene I1-`boundedInvocation` kann nach Abort `outcome_unknown` zurückgeben; das feste Kompositions-Importbudget beträgt 5.000 ms. Diese Beobachtung ist bereits dokumentierte Untersuchungsgrundlage, kein neuer freigegebener Timeout oder vollendeter Testentwurf. Keine geschützten Quellen/Hilfen, SQL-Aufrufzahl-/Prozessbudgets, Workflows, Pakete oder Timeouts zur Erleichterung der Prüfung ändern.

Danach fehlen: vollständige finale U01–U07-/N01–N15-Zuordnung auf konkrete Assertions, neue Quellen-/Belegpins, gezielte Checks, Roots unabhängige Nachprüfung, neuer veröffentlichter Head und vollständiges Re-Gating in unveränderter vorhandener CI. Den nativen Testcode, wahrheitsgemäße Child-/Cleanup-Receipts, tatsächlichen gesamten Prozessausgang und alle übrigen Gates prüfen. Bei Fehlern CHANGES REQUIRED an dieselbe Session, neuer Head, erneute Gates. Ein grüner Checkpoint-Lauf ohne den R9-Test schließt R9 ausdrücklich nicht.

## 7. Agenten und Review-Kette

| Rolle | Tatsächliche Identität / Status beim Speichern |
| --- | --- |
| Technical Lead / Publisher | ChatGPT `/root`; alleinige Verantwortung für Review-Entscheidung, Veröffentlichung, PASS/Ready/Merge |
| Einziger Implementierungsautor | **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation1**, tatsächliche Session `/root/m04_durable_jobs_writer`; STOP bestätigt, R9 nicht implementiert |
| SQL-Fachreview | `/root/m04_sql_phase_a_review`; finaler V7-Bericht gespeichert, STOP bestätigt |
| Runtime-/Lifetime-Fachreview | `/root/m04_uncertainty_advisory`; finaler V7-Bericht gespeichert, STOP bestätigt |

Cursor war in dieser Arbeitsumgebung nicht verfügbar. Dies ist der offen dokumentierte Codex-Fallback; keine erfundene Cursor-Generation, Cursor-UI oder Session-Evidence. Der neue Chat prüft die tatsächliche Fortsetzbarkeit dieser Session. Eine nicht verfügbare Session wird als solche ausgewiesen; eine neue Session darf nicht als dieselbe ausgegeben werden. Unmittelbare Review-Fixes gehen an den ursprünglichen Autor gemäß Betriebsstandard. Keine automatische Fortsetzung oder neuer Folgeslice nur aufgrund dieses Handoffs.

Die im PR persistierte Kette ist: [Dispatch 6753900537](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6753900537), R1 `6754049773`, R2 `6754220160`, R3 `6754295053`, R4 `6754421533`, R5 `6754652918`, R6 `6754713898`, R7 `6754873041`, R8 `6755046698`, **R9 `6755677459` offen**. Alle Befunde wurden an dieselbe Autorensession zurückgegeben. R1–R8-Quellkorrekturen und ihre Grenzen stehen in den finalen V7-Reviews; native Ausführung wird daraus nicht abgeleitet.

Endliche Root-Allokationen: T01 `6754518445` (nur nullable Epoch-Transport über festen NULLIF-Cast), T02 in R6 (nur neue Skripte/29 neue Funktionen `pg_catalog,pg_temp`, vorhandene elf Konfigurationspins unberührt), T03 `6754943624` plus R8 (ehrliche aggregierte native Verbindungs-/Observer-Erfassung unter bestehenden Limits). Der [Allokationsbeleg](M04_PHASE_B_TECHNICAL_ALLOCATIONS_V1.md) ist bindend. Kein Budget-/Berechtigungswachstum wird hier neu autorisiert.

## 8. Bereits erledigte Arbeit nicht erneut beginnen

MI1 #1177 ist am 9. November 2026 um 21:05:24 UTC auf `7ae1394a00e2b23a60da98d2a029fd6a10c8189d` gemergt und unabhängig POST-MERGE-PASS. [Abschlussdokument](MI1_POST_MERGE_CLOSURE_V1.md), [FINAL 6751433054](https://github.com/Jetnity/jetnity/pull/1177#issuecomment-6751433054), [POST 6751913752](https://github.com/Jetnity/jetnity/pull/1177#issuecomment-6751913752) sind historische Evidence. Die integrierten Komponenten-PRs sind bereits geschlossen; S0 #1163 ist gemergt. Nicht nochmals mergen, schließen oder ihre frühere Implementierung neu beginnen.

Die separate Booking-Änderung #1179 brachte danach main auf `be79ea…`; ihre sechs upstream-Pfade bleiben erhalten. Das aktuelle M04-Verfahren darf sie nicht überschreiben.

D1 #1169 bleibt ein getrenntes OPEN/DRAFT-Methodenpaket auf `300946991376b8969b383a087d47b49a7636f722` mit Base `97629e9130a907b8b9b8072d06bda1956758aa6e`. Alter D1-Autor STOP/nicht fortgesetzt. Die frühere 44er-Pinprüfung hatte 41 gleiche und drei abweichende Pins ([Kommentar 6752489536](https://github.com/Jetnity/jetnity/pull/1169#issuecomment-6752489536)); das Paket ist dadurch nicht freigegeben und erhält keinen stillen neuen Writer.

## 9. Besondere Gates, Plattformgrenzen und Produktwahrheit

- **Method NOT_APPROVED.** Eine qualifizierte eindeutige amtliche Primärquelle des Ziellands genügt nach Quellenregel V3; eine unabhängige amtliche Gegenquelle wird berücksichtigt, wenn vorhanden. Ihr bloßes Fehlen blockiert nicht. Echte vergleichbare Widersprüche/unklare Primärquellen eskalieren. Kein Importcode erteilt sich selbst die konkrete einmalige Owner-Methodenfreigabe.
- **#1139 NOT_RELEASE_READY:** 17 Vor-Owner-Lücken bleiben: E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. Das vollständige konkrete Dev-Paket ist noch nicht freigabereif. Kein pauschales Freigabeersuchen als Ersatz.
- **#917:** APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, tatsächliche Ledger-ID UNKNOWN, Stage2 NOT_ATTEMPTED. Die spezifische Plattformverweigerung des ursprünglichen Readbacks bleibt absolut bestehen: kein Retry, Umformulieren, Delegieren, Umleiten, Transportwechsel oder menschlicher Ersatz-SQL-Lauf. Auch nicht als „read-only Verifikation“ erneut anstoßen. Keine erneute Forderung nach alten Owner-Belegen; deren Nichtverfügbarkeit ist dokumentiert.
- #1131 ReadySTOP; #1135 ResearchHold **und** unabhängiger Plattform-ReadySTOP; #968 Preview-Isolation; #911/#913 Privacy bleiben unverändert.
- Keine Hosted-DB/Auth/RLS/ACL/Migration/Credentials-Lese- oder Schreibaktion. Kein erneuter Zugriff über einen anderen Connector/Transport. Keine echten Quellen-/Provider-/Research-Aufrufe, Scheduler, Benachrichtigungen, neue Kosten oder öffentliche V3-Aktivierung. Auth-CI ausschließlich Metadaten, keine Auth-Logs.
- Datenbank-/Production-Aktivierung bleiben an die konkrete Ownerfreigabe des vollständigen Dev-Pakets und der Methode gebunden. Dormante Codeintegration beweist weder Installation noch gültige öffentliche Einreiseregeln. Öffentliches p95 unter einer Sekunde ist weiterhin nicht nachgewiesen.

## 10. Umgebung und konkrete Risikogrenzen

Arbeitsverzeichnis beim STOP: `/workspace/scratch/01cbe1264212/jetnity-v3-durable-jobs`. Lokale temporäre Review-Snapshots liegen unter `recovery/`; alle für die Fortsetzung benötigten finalen Quellen/Reviews/Pins sind im Repository-Checkpoint enthalten. Ein neuer Chat soll keine bloße Existenz dieser temporären Pfade voraussetzen.

Alle Git-Leseoperationen mit `GIT_NO_LAZY_FETCH=1`; kein Fetch/Push. Veröffentlichung durch Root über vorhandenes GitData-Verfahren mit exaktem erwartetem Branch-Head, vollständigem Treevergleich und anschließendem Readback. Alte bereits ausgeführte Freeze-/Publikationsskripte niemals blind erneut ausführen. Es gibt 16 absichtlich nicht vorhandene lokale Binärinhalte mit ursprünglichen Objekt-IDs/skip-worktree: `data/omio/ch.katalog` und die 15 ursprünglichen Dateien unter `public/images/organisieren/`. Keine Nachbeschaffung und kein lokaler Full-Build-Claim. Kein lokales PostgreSQL/Socket-/Native-SQL-Verfahren; echte native Nachweise ausschließlich über die unveränderte bestehende CI.

| Stufe | Offener Stand / Bedeutung |
| --- | --- |
| P0 | Autoritäts-, Privacy-, Methoden- und Aktivierungsgrenzen bleiben gesperrt. Kein neuer bestätigter P0-Vorfall durch diesen Checkpoint. Ohne vollständige Gates keine positive Release-/Datenbankaussage. |
| P1 | R9 kombinierter verschachtelter Race-/Drain-Nachweis fehlt; reale Persistenz-, Nebenläufigkeits-, Identitäts-, Rechte-, Revocation-, Rollback- und Lifetime-Nachweise müssen auf dem finalen Head tatsächlich erfolgreich sein. Fachreviews allein schließen diese Prüfpflichten nicht. |
| P2 | Bewusste konservative Verfügbarkeit bei unbekanntem Ausgang/Lane-/Quota-Grenzen; fehlende Betriebsanschlüsse und öffentliches p95; geerbte 16 npm-Findings (9 moderate, 7 high) noch unklassifiziert; historisch 197 Lintwarnungen und zwei Skips. Kein aktueller Security-PASS aus alten Zählungen. |
| P3 | Geerbte schmale/200%-UI-Grenzen außerhalb dieses Scopes. V7-Fachreview nennt begrenzte Fehlerdiagnostik bei mehrfachen Cleanup-Fehlern; keine falsche positive Receipt vor finalen Checks. |

**Entscheidung am Unterbrechungspunkt:** Vorhandenen Quellstand und Evidence sichern, alle Implementierer stoppen, Draft beibehalten. Nächste Arbeitsentscheidung nach Live-Rekonstruktion ist der genau beschriebene R9-Fix, nicht Ready/Merge und kein automatischer Folgeslice.
