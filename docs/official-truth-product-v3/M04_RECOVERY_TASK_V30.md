# M04 Recovery Task V30 — R39 exact historical profiler reuse

Source: https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6811167237

## M04 Recovery V30 v1 — R39: exakte Wiederverwendung der vorhandenen G3-Diagnostik

Root Technical Lead,12.11.2026. Fortsetzung des ausdrücklich priorisierten CH→DE-Wegs. Ausgewählter Umfang ist ausschließlich die Messung des tatsächlich fehlgeschlagenen R38-SQL; kein neuer Algorithmus, kein neuer Implementierungsautor und keine wiederbelebte Session.

### Ausgangslage und Entscheidung

[#1184](https://github.com/Jetnity/jetnity/pull/1184) DRAFT, Head **2ee54f59cb86ac03ee6a35b3c2d5a819eadda364**, Tree **a607fb6ae8c1f45ac5f5b32030e2f7e936e4bafb**. Aktuelles main/Mergebase **8b479a24b43b28aad12fc73748ceffba5a1d73ee**,4ahead/0behind. [Root CHANGES REQUIRED](https://github.com/Jetnity/jetnity/pull/1184#pullrequestreview-5867339258): [CI43127654239/#4112/attempt1](https://github.com/Jetnity/jetnity/actions/runs/43127654239) terminal FAILURE, M04 24/31am240s-Limit, vollständiger256erLedger,51vollständigeCycles, folgender CLAIM UNKNOWN; alle6BegleiterSUCCESS. Native-/Cleanup-/Core-/Companion-Evidence wird vollständig als neuer datierter R38-Nachweis erhalten. Frühere Fehler werden nicht umgeschrieben.

Der direkte Follow-up an den ursprünglichen Autor **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**, Session **/root/m04_durable_jobs_writer_g3**, ergab `live agent path ... not found`. Die vorhandene G3-Profiler-Datei darf als unverändertes historisches Artefakt wiederverwendet werden; dies behauptet weder dieselbe laufende Session noch eine Ersatzimplementierung. Neue Source-Implementierung nach der Messung ist durch V30 nicht autorisiert und benötigt eine wahrheitsgemäße Agenten-/Sessionbindung.

Operating Standard4B/4C und der ausdrücklich ausgewählte V28v2-Messumfang unterscheiden eine technische Dateigrenze von Sicherheits-/Abnahmegrenzen. Root hebt für diese einzelne Diagnose die ausgeschöpfte V29-Native-Dateifreeze ausdrücklich auf; keine Quoten, Testbedingungen, Sicherheitskontrollen oder Plattform-STOPs werden gelockert. Die aktuelle PO-Autorisierung ist [hier](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6810491439) bindend.

### Einzige ausführbare Änderung: unveränderter vorhandener Blob

Setze ausschließlich **scripts/db/official-truth-v3-durable-jobs-1/native.ts** exakt auf den bereits geprüften G3-R37-Profiler:
- Blob **15923a09e760438a9e62a534aa757a11317c23a5**
-206062UTF8Bytes
-SHA256 **19289ec373b5de36c7db6fab68a15ec9a6e93cb2416bd8dc9bef293a383b4623**
-Ursprung: `994eed7511d612db5158a2af77b5ad3d35f4b6c6`.

R38-SQL bleibt exakt Blob **1bb764344f22569dec9d3320667e0125d64c1cbf**,161095Bytes/SHA256 **868778c647464bf51ff179e39b86c2f4d6771cad07998165898f2f222e5fa84a**. Alle anderen17geschützten Quellen unverändert. Neue18Quellen-Aggregation **bc01075a7422e82745feed7dfcaa0460b43193e3f60c8a224d50d5e2f2ce2e2f** (UTF8 SHA256 SPACE bytes SPACE path LF, sortiert,finalLF).

Root und beide unabhängigen Reviewer verifizierten die acht historischen Instrumentierungsspannen: jede kommt einmal vor; ihre komplette Rücknahme rekonstruiert exakt die aktuelle Originaldatei **0b3f7d9906687ec42171de5af60fed009d07b39f**,191098Bytes/SHA256 **f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0**. Alle31Originalnachweise, ihre Reihenfolge, Inputs, Assertions und Receipt bleiben erhalten.29SQL-Funktionsdeklarationen/-Modifier sind kompatibel; tatsächlich geladene SQL-/Rollback-Bytes werden dynamisch gehasht. Kein alter R36-/R37-Head oder SQL-Hash wird als aktueller Messinput verwendet. Der historische Kommentar „R37 diagnostic-only“ bleibt unverändert und wird nicht als aktueller Laufstatus interpretiert.

### Messgrenzen und Interpretation

Unveränderte bestehende Instrumentierung: ein schon vorhandener Jobs-Runtime-Backend, keine neue Verbindung/Cluster/Prozess; maximal12abgeschlossene Prefix-Snapshots×29Funktionen,45zusätzlicheQueries und131072UTF8Bytes inklusiveReceipt-Präfix.9SetupQueries,jeSnapshot3Queries. VollständigerLedger254/255/256,Starts64/65,alle31Gruppen sowie240000msEffect/60000msCleanup/300000msGesamt bleiben bestehen.

Der feste Test-Login erhält nur im vorhandenen isolierten CI-Cluster kurz track_functions=all als Datenbank-Sessiondefault; sofortige exakte Wiederherstellung vor späteren Verbindungen. Einschränkungen des echten Test-Callers, Owner-/Observer-Settings und Restore werden geprüft. Bei bereits abgebrochener Lifetime kein weiteres SQL; fehlende Restore-Bestätigung wird nicht erfunden. Fehler werden nicht übersprungen. Keine Änderung von Berechtigungen, Auth-Daten, RLS, ACL oder Hosted-Konfiguration.

Beobachtungen erst nach echten ACKs/Counter-Updates: vorLedger,64/128/192/254undnachvollständigemLedger; vorCycles,16/32/48/64undnachvollständigenCycles. Fehlende/interruptedAufrufe bleiben UNKNOWN, NULL bleibt NULL. Keine Summe über überlappende inklusive Zeiten, keine CPU-/I/O-/Plan-/Peak-RSS-Aussage. Setup/Snapshotzeiten enthalten nicht den vollständigen Trackingaufwand. R37-Messungen sind Vorgängermessungen; R38-Walltimes ergeben keinen kontrollierten Speedupvergleich.

### Endliches Publikationspaket

Root erstellt einen unveröffentlichten Commit mit EINEM Parent2ee54; Veröffentlichung nur nach vollständigem Root-/Peer-Readback und frischen Gates durch nonforce expected-headUpdate auf derselben Draft-Branch.

Exakt10geändertePfade:
1.die Native-Datei als vorhandenerBlob;
2.–7.sechs aktuelle Einstiege/Handoff: JETNITY_START_HERE.md,docs/ACTIVE_WORK_STATUS.md,ROADMAP.md,JETNITY_HANDOFF.md,ARCHITECTURE.md,docs/official-truth-product-v3/M04_HANDOFF_V1.md;
8.docs/official-truth-product-v3/M04_RECOVERY_TASK_V30.md;
9.docs/official-truth-product-v3/M04_RECOVERY_ROOT_REVIEW_V30.md;
10.docs/official-truth-product-v3/M04_RECOVERY_R38_FAILURE_AND_R39_PLAN_V30.json.

Alle fünf Marker-Außenbereiche und das gesamte vorherige M04-Handoff exakt erhalten. Sämtliche V27/V28/V29-Artefakte bleiben ganze Dateien unverändert. Alle aktuelle Main-/parallel1181-Inhalte bleiben erhalten. Erwartung:7modifiziert/3neu,9468Blätter/844VerzeichnisseeinschließlichRoot/10311Tree-Einträge,9458alteBlätterunverändert; kumulativ20Pfadegegenmain,5ahead/0behind. Diese Erwartungen müssen am tatsächlichen Tree/Diff geprüft werden.

### Gates, Auswertung und zwingender STOP

Root und unabhängige Reviewer prüfen vollständige Quelle/Inverse/Pins/alleDokumente/Tree/Diff vor Ref-Advance. Frische main/head/Mergebase/aheadbehind/NORMAL/Rules/noBypass/Owner/Review-/Toolbar-Gates. Der geänderte Head löst genau einen vorhandenen vollständigen8Job-CI-Lauf aus; kein unveränderter Rerun. Root bestätigt Terminalmetadaten vor erlaubten nicht-AuthOriginal-Logs; unabhängige Prüfer lesen parallel. Native- und Profile-Receipts vollständig erhalten; Messdatenqualität separat vom Test-/Runtimeergebnis bewerten. ExactPreview und Production weiterhin auseinanderhalten.

**R39 ist unter allen Umständen NICHT MERGEFÄHIG, auch bei grüner CI.** Keine Ready-Aktion. Nach Messung Root-Auswertung, konkrete nächste Source-Korrektur auswählen und tatsächliche Agentenbindung klären. Vor jeder späteren finalen Abnahme Original-native.ts wieder exakt0b3f/f5d849herstellen; neuer vollständiger nichtinstrumentierterHead-/main-/Production-Nachweis erforderlich. Kein automatischer neuer Produktslice; der explizite CH→DE-Auftrag bleibt das einzige Produktziel.

Unverändert: keine lokale/ersetzende Projekt-/Parser-/SQL-/Native-/Socket-/Build-/Testausführung; kein Download/Install/Clone/GitFetch/Push; vorhandeneCIallein führt Projektcode aus. KeineAuthLogs,keineHostedDB/Auth/RLS/ACL/Migration/Credentials/Provider-/Research-/Scheduler-/Nachrichten-/Neukosten-/Publicaktivierung durch dieseDiagnose. #917/#1131-STOPs werden nicht wiederholt,umformuliert,delegiertoderumgangen.17technische#1139Lücken offen;D1POgenehmigt/technischnichtoperativ;#968Isolation/#911/#913Privacy/#1135separateGates bleiben. Endliche8PfadDocs-Schließung weiterhinHELD bis echter korrigierterActual-mainAbnahme.

Reviewer: /root/ch_de_ci_reconstruction (Quellen/Messung), /root/ch_de_release_gate_audit (Paket/Gates). Diese sind keine Implementierungsautoren und keine Reaktivierung alterG3Sessions. Root alleinPublikation/PASS/Ready/Merge; hierwederRuntimePASSnochReady/Merge.

