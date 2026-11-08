# Autor-Handoff — Official Truth Dev Decision Package 1

**DEV-PACKAGE-1 / V3 / R0 — 8. November 2026, Europe/Zurich.**

Autor: **Jetnity Official Truth Dev Decision Package 1 — Codex Generation 1**.  
Tatsächliche Session: **/root/dev_package_writer**.  
Versionierter Auftrag: [TASK V3 / 6727812983](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6727812983), neue Owner-Korrektur nach dem V2-Merge #1160. V1/V2 bleiben historische Auftrags-/Review-Evidence.  
Dokumentbasis: **1b96936f0159578c063992407c650a0995b60895**, Tree **b6f46ef0e4efc06e6fa772c4d364d12c3a6317e6**. Unveränderte Implementierungsquellen bleiben auf **608414441651b407cf56ab976c1cd116db45de0c** gepinnt.  
Vorgesehener Root-Veröffentlichungsbranch: **docs/official-truth-dev-package-1-v3-20261108**.

**Status: Autoren-Dokumentation geliefert, STOP für unabhängige Root-/Reviewer-Prüfung. Keine TL-Abnahme, kein Ready/Merge und keine wirksame Datenbankfreigabe durch den Autor.**

## Umgesetzt und Dateien

Fünf Autorendokumente unter docs/audits/official-truth-dev-package-1-2026-11-08/:

| Datei | Inhalt |
| --- | --- |
| [DEV_PACKAGE.md](DEV_PACKAGE.md) | Versions-/Quellpins, vollständiges 13+4-DDL-/ACL-Inventar der vorhandenen Kandidaten, Autoritäts-/Lockvertrag, Authority-/Pilot-Abhängigkeiten, drei Entscheidungsphasen und verständliche Owner-Erklärung. |
| [TARGET_EVIDENCE_MATRIX.json](TARGET_EVIDENCE_MATRIX.json) | 28 unverändert getrennte Dev-Evidence-Punkte plus sechs Produktanforderungen; anerkannte historische/aktuelle Teile, konkrete Lücken, Phasen und Quellzuordnung. Produktplanung setzt kein zusätzliches Vor-PO-Gate für #1139. |
| [POSTCHECK_AND_RECOVERY.md](POSTCHECK_AND_RECOVERY.md) | Bestehende 27 native Fälle, messbare zukünftige Zielprüfungen, sichere Evidence-Ausgabe und neun Recovery-Zustände einschließlich getrennt committed Authority/Pilot. |
| [PRODUCT_TARGET_PLAN.md](PRODUCT_TARGET_PLAN.md) | Verbindliche sechs Produktvorgaben, tatsächliche Quellen-/Implementierungszuordnung, klare Zielland-Pflichtquelle und optionale Gegenprüfung, Dienst-/Cache-/Lifecycle-Anpassungen, Privacy und genau eine konkrete Methodenentscheidung samt Betriebsrahmen. |
| HANDOFF.md | Diese Autorenübergabe mit Grenzen, Prüfung und offenen Aufgaben. |

Root besitzt TASK.md und TASK_V2.md als unveränderte historische Aufträge sowie TASK_V3.md, STAGE1_ACCEPTANCE_REPORT.md, SOURCE_MANIFEST.json und REVIEW.md. Das Gesamtpaket umfasst elf Dateien. Veröffentlichung und Issue-Continuity liegen bei Root. Der Autor verändert nur seine fünf Dateien in der neuen V3-Arbeitskopie; die historische V2-Arbeitskopie bleibt unverändert.

## Präzise inhaltliche Ergebnisse

1. Die vier #1142-Dateien sind weiterhin genau die integrierten Quellen. Die frühere R5-Pending-Prosa ist durch unabhängigen historischen POST-MERGE-PASS supersediert; kein Neubau oder erneutes Behaupten einer unerledigten Implementierung.
2. Beide SQL-Kandidaten haben eigene BEGIN-/COMMIT-Grenzen. Sie sind kein gemeinsames atomisches Installationsartefakt. Ein äußerer Transaktionsrahmen neutralisiert die inneren COMMITs nicht. Authority-committed/Pilot-fehlend, -fehlgeschlagen oder -unklar ist ein eigenständiger Recovery-Zustand.
3. Authority erzeugt einen neuen Namensraum und zwei neue interne Funktionen und ersetzt die öffentliche Capability. Pilot ersetzt nur einen bestehenden Funktionsvertrag und benötigt Stage2-Voraussetzungen. Der lokale Fixture-Apply der alten Stage2-Quelle ist keine Anweisung zu ihrer unveränderten Hosted-Installation.
4. Die Quelle verwendet CREATE SCHEMA ohne IF NOT EXISTS. Kollisions-/Wiederholungsfälle führen zur Reconciliation, nicht zu Adoption, Überschreiben, Löschen oder Retry.
5. Die beabsichtigten direkten Rechte werden von tatsächlicher effektiver Exklusivität getrennt. CREATE OR REPLACE bewahrt Owner/ACL; benannte REVOKEs bereinigen keine beliebigen Zusatzgrants. Default-ACLs, Vererbung, Owner-Mitgliedschaften und nötige reale Objektprivilegien bleiben explizite Zielpunkte.
6. Die in [STAGE1-HISTORICAL-GAP-V1 / 6726914934](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6726914934) persistierte historische Beleglücke betrifft laut Owner-Erklärung den ursprünglichen Stage1-Lauf. Die vorhandenen Run2-Artefakte und ihre menschliche Attestation bleiben anerkannt. Die fehlenden zusätzlichen alten Belege allein erzeugen kein neues unmögliches Freigabegate.
7. **Vor-PO-Freigabereife** verlangt konkrete Zielbaseline, endgültige Änderungsartefakte, vollständigen Nachprüfungs-/QA-Plan, Recovery und unabhängiges Review. **PO-Entscheidung** folgt danach. **Tatsächliche Post-Apply-Ergebnisse** gehören erst zur effektiven Abnahme; deren heutiges NOT_EXECUTED wird nicht als zirkuläre Voraussetzung für Paketvorbereitung behandelt.
8. Der Rollback-Plan verspricht keine Rücknahme nach bereits bestätigtem Commit und kein sicheres Zurückaktivieren des alten P1-Vertrags. Historische physische Backup-Metadaten sind kein aktueller getesteter Restore-/Zero-Loss-Nachweis.
9. Die seit 02.10. verbindliche autonome Routineannahme bleibt erhalten. TASK V3 ersetzt die aktive Zwei-Quellen-Pflicht aus V2 durch eine klare qualifizierte amtliche Primärquelle des Ziellandes und verfügbare unabhängige amtliche Gegenprüfung. Fehlende, unpassende, unklare, veraltete oder unerreichbare optionale Evidence allein sperrt nicht und erzeugt keine Owner-Routineeskalation. Proposal-only Researcher und Ausgabe erst nach Jetnity-Annahme/Import/Cacheversion bleiben fest.
10. Vorhandene Registry-/Research-/Preacceptance-/Provenienz-/Producer-/Refresh-Verträge werden wiederverwendet. Accepted Store bleibt ungebunden/ruhend mit genau einer Stütze in TypeScript/SQL, echter Nutzer-Reserve/Finalize und engem CH→DE-Tripreader. Die Anzahl passt zur neuen Mindestanforderung; sie beweist weder tatsächliche Zielland-Zuständigkeit noch eindeutige aktuelle Aussage oder Installation. Keine zwingende Mehrstützenmigration allein für den Normalfall ohne zweite Quelle.
11. Kryptographische Prüfsummen verleihen keine Origin-/Schreibautorität. Die geplante eigene versionierte Gegenprüfungsentscheidung bindet Primärbeleg, Fakten-/Kontext-/Gültigkeitsbezug, Quelle, Versuch/Prüfzeit, Ergebnis beziehungsweise Nichtverfügbarkeit und Methode an Annahme/Commit/Rückzug/Cache. Keine zweite Stütze in unveränderte genau-eins-Arrays, keine lose Lognotiz. Echte relevante Konflikte bleiben bis belegter methodengültiger Auflösung wirksam; Abruffehler löscht sie nicht. Ein belegter Kontext-/Gültigkeitswechsel kann sie auflösen.
12. Genau eine spätere D1 konkretisiert Quellenmethode und belegten Betrieb; die Grundregel wird nicht erneut gefragt. CH→DE bleibt Erstpfad, die Ausgabe eine bedingte Regelübersicht je Staatsangehörigkeit ohne persönlichen Fragebogen oder Besucherprofil. Menschliche Auth-/DB-/Rollout-Gates bleiben. Automatische Wiederannahme nach Konfliktklärung braucht einen ausdrücklich versionierten zulässigen Übergang: der aktuelle Store liefert ihn aus conflicted/withdrawn noch nicht. Keine ungeprüfte Reaktivierung und keine ewige manuelle Blockade.

## Eigene Prüfung und verwendete Evidence

In der bisherigen V1/V2-Prüfung las der Autor am festen Source-Pin 60841444 die beiden vollständigen Kandidaten, die native Testquelle mit 537 Zeilen, R5-Dokumentation, ursprüngliche Stage1-/Stage2-Quellen und Auth-Policy-Mapping-/Prüfkette. TASK V1, V2 und jetzt V3 wurden vollständig gelesen, ebenso zuvor Autonomy Directive, Repository-AGENTS-Standard und relevante R4-/R5-/Run2-/Continuity-Receipts. Die sechs ursprünglichen Paketquellhashes wurden aus den per GitHub gelesenen UTF-8-Bytes rekonstruiert. Die neue V3-Vorgabe erfordert Dokumentanpassungen, keinen Neubau des #1142-Kandidaten.

| Datei | Bestätigter Gitblob | Bestätigter SHA-256 |
| --- | --- | --- |
| authority-candidate.sql | 407c28bc7623f659e49c3f408bee28302ef717e1 | 169c6b02c2776ac163590b1cd6ffb6d43133621c9dc9e31b687f083d2ab4aa50 |
| pilot-candidate.sql | e1cccc61773a5adf71d177252d12d047ecf2d627 | d5eecdb50a4f00a1ba73bc6aa54f76a601bf0ee1461bb902aff3b1c5e561691e |
| Native-Test | 15f5ebd04452d1aff302dcc487087032863e293b | 9498b7a2ee91c72bbd4c2dc96039664f1a903940c475adb81168abd1d594e36b |
| R5-Dokumentation | c09ee127e665846b139cee059ecc22ecdf89c382 | d56acf3ca2b2b114157f4e2d2b6037b7258d5b1a524db2265a24acd135dc79d1 |
| Stage1-Quelle | 43a590682f1d3f569f418fb2572b8fb010de9291 | 635151c127efde6e2953cc14c68e81ecccf10dba545329fe46c09dcdf50996a2 |
| Stage2-Quelle | 87639107883cb9771ed5b19db68994ba08a6c930 | 5782f26d35c9a8e778f65a23383d324b9b5cb12c709bf45d21d2fce6873196f0 |

Die [historische R5-Abnahme](https://github.com/Jetnity/jetnity/pull/1142#issuecomment-6690979366) belegt die damalige native Ausführung. Root las außerdem die **vorherige Main-CI 42513853717 auf 60841444** im Original: Source-Guard 1567, nativer Parent 1568 mit 27 PASS/keinen Skips, 22791.237512 ms; Auth 55/243 am 08.11.2026, 19:13:09 UTC. Der Autor hatte die Run-Metadaten selbst gelesen: push, completed/success, Head 60841444, erstellt 19:12:19 UTC, aktualisiert 19:30:32 UTC. Diese sourcegebundene Evidence bleibt anerkannt und wird nicht auf einen anderen Head umetikettiert. [Vorheriger Run](https://github.com/Jetnity/jetnity/actions/runs/42513853717)

Die inzwischen abgeschlossene reguläre **#1160-Post-Merge-CI 42527963600 auf main 1b96936** liefert zusätzlich bestehende Baseline-Evidence: Root bestätigt sieben erfolgreiche Jobs; Original-Core 128875685288 enthält den tatsächlichen Checkout, Source-Guard 1567, nativen Parent 1568 mit 27/27 PASS/0 Skip/0 Fail in 19859.855067 ms; gesamt 8200 Tests/8198 PASS/0 FAIL/2 bekannte UI-Skips. Original-Auth 128875685142 bestätigt um 22:01:11 UTC 55 Sollwerte/243 Schlüssel, alle passend. Diese Original-Log-Befunde werden als Root-Evidence übernommen, nicht als vom Autor neu ausgeführter Test. Task V3s Angabe „läuft noch“ ist dessen damaliger Publikationsstand. Die später geänderten V3-Dokumentbytes brauchen eigene Review-/Head-Gates. [Baseline-Run](https://github.com/Jetnity/jetnity/actions/runs/42527963600)

Die vier Policywerte sind durch die am unveränderten Source-Pin gelesenen Quellen abgedeckt: auth-erwartung.ts / Gitblob 0dfd71702f0d1226cd35cdac449b3260c961e31a, auth-bericht.ts / Gitblob 272db17b128c5f1f84b550fbfad9b4a0edadf9ff, pruefen.ts / Gitblob c8fd418105c211a8827361300c92e13c8535bb8b, config.toml / Gitblob 43950d4d90e9ddb38487631aa83d2140bed5c04c. Kein neuer Auth-Konfigurationsabruf.

Der Autor hat zusätzlich Roots lokale Offline-Vergleichsevidence und die entsprechenden finalen Manifest-/Stage1-Aussagen gelesen: rollenrang-Quelltupelhash 0b4f93560983e564b678d36d6b0e4bf37198a480e681b777d17ac7e24a52e041 passt zu public/OID 72351, (text) → integer; redigierter Name und tatsächliche Aufrufauflösung bleiben offen. Beide ursprünglichen Stage2-Funktionstupel haben keinen exakten Treffer; sieben public-Routinen mit jsonb → jsonb und redigierten Namen verhindern jedoch jeden daraus abgeleiteten Abwesenheitsschluss. E07/E09 erkennen genau diese begrenzten Zusatzbelege an. Keine neue Datenbankabfrage.

Öffentliche Primärquellen zu CREATE OR REPLACE/ACLs, Transaktionen/ROLLBACK, Volatilität/Locks und Supabase Session-/API-Grenzen wurden gelesen und in den Dokumenten verlinkt. Sie begründen die allgemeinen technischen Unterschiede und beweisen keine Jetnity-Hosted-Fakten.

## Wiederverwendete V2- und fokussierte V3-Quellenprüfung

In V2 las der Autor selbst am gepinnten 60841444 Source Registry, Search-Port, Research-Request, Refresh-Diff, Authority-Loader, Same-Request-Proof/Preacceptance-Witness, Provenienz-/Supportprimitive, globale blockierte Producer-Wurzel und Accepted-Store-Binding, Canonical, Producer, Datenbankadapter, Trip-Bindung, Reader sowie Requirements-Provider. Relevante Kompositions-/Extractorphasen bestätigen allgemeine Einzel-/Mehrbelegunterstützung, beide Produktionsregister bleiben leer. Die damalige Map product-source-map-v2.json, SHA-256 02d3a9de846896e8be08ea8a16701ba2c7eabd894df12e43eac4d2685613fd27, bindet 50 Source-Readbacks und 16 Testquellpins mit gekennzeichnetem Leseumfang. Keine vollständige eigene Prüfung aller 50 Dateien wird behauptet. Quellfakten bleiben verwendbar; damalige Ableitungen einer Pflicht zu zwei Stützen beziehungsweise zwingendem Mehrstützenumbau sind durch den neuen Ownerauftrag supersediert, nicht rückwirkend ein V2-Fehler.

Weiterhin konkrete Quellbedingungen: Canonical 958923cfc13ee1643d38e362f48931f78966e2ec verlangt evidenceVersions.length === 1; SQL c123817d2f332f6471fbf37a8cf91ec11fee98a1 begrenzt Stützen auf eins. Das passt zur V3-Mindestzahl. Trip-Binder e1ccee2cfef9ee47bcfb0806f618cfba24135384 verlangt eine einzige CH-Staatsangehörigkeit, Binding e926ee3fab1c7725583f62f7e070b99377999c99 hält DEPLOYMENTS leer. Es bleibt Source-Evidence, keine neue DB-Evidence.

Die fokussierte V3-Map von /root/release_live_audit wurde vollständig abgeglichen: product-source-map-v3.json, SHA-256 e3ddbbbaa4f9df590a2fae23f859584ed4a081dc4490fd1879ef94327677693e, sechs Zuordnungen, zehn unveränderte Source-Pins und acht vorgeschlagene Quellenfälle. Sie grenzt gezielten SQL-Invariantenread ausdrücklich von vollständigem SQL-Neureview ab. Der Autor las zusätzlich selbst den vollständigen CH→DE-Vertrag an main 1b96936, Gitblob 90b9dd0108ed3e4d8049a3f8d35323c09b52e23f: source/binding/coverage und Scope-/Gültigkeitsfelder, leere contracts, applicationPilotEnabled=false. Keine reale deutsche Quellenqualifikation wird behauptet.

Der Autor las den [Compare 60841444…1b96936](https://github.com/Jetnity/jetnity/compare/608414441651b407cf56ab976c1cd116db45de0c...1b96936f0159578c063992407c650a0995b60895) selbst: ahead 2, behind 0, Merge-Base 60841444, ausschließlich die zehn #1160-Dokumentzugänge. Dies begründet die unveränderte Implementierungsbasis; es ist kein V3-Dokument-PASS. Die direkte Quellenprüfung und die erhaltene Session-Evidence bleiben nach einer kurzen Verbindungsunterbrechung derselben Generation 1 zugeordnet.

## Tests / Build / Datenbank / Kosten

**Für die Dokumentenprüfung von V1/V2/V3 durch diesen Autor ausgeführt:** ausschließlich Repository-/öffentliche Quellenreads und lokale Offline-Datei-/Hash-/Dokumentkonsistenzprüfung. Dabei keine SQL-Ausführung und kein Testlauf gegen eine Datenbank.  
**Native-/Type-/Lint-/Build-Ausführung durch diesen Autor:** nicht gestartet; die Lieferung verändert nur Dokumentation. Vorhandene CI-Evidence wurde gelesen. Bei der späteren normalen Draft-PR-Veröffentlichung können reguläre automatische CI-Gates anlaufen; Root bindet deren tatsächliche Ergebnisse separat an den neuen Head. Sie werden hier weder vorweggenommen noch ausgeschlossen. Keine Workflowänderung oder [skip ci].  
**Datenbank:** keine Migration, keine Quelle verändert, kein Ledger repariert, keine Hosted-Inventur, kein Konto-/Session-/Rollen-/ACL-/RLS-Eingriff.  
**Security:** unveränderte P1-/Plattform-/besondere Owner-Gates; kein neuer Zugriff oder Ausweichweg.  
**Kosten:** keine neue laufende Infrastruktur, keine kostenpflichtige Provideraktivierung.  
**GitHub:** keine Schreiboperation durch den Autor; Publikation ausschließlich durch Root.

## Self-Review und verbleibender Review

Der Autor prüfte die 17 Quell-DDL-/ACL-Operationen vollständig gegen die beiden Dateien, die Zuordnung der 27 Fälle gegen die tatsächliche Teststruktur, alle Source-Pins und die Phase-A/B/C-Abgrenzung. Der Recovery-Plan unterscheidet offenen Abbruch, getrennte bestätigte Commits, unbekannte Ausgänge und bereits entstandene Datenwirkungen.

Die beiden vorläufigen Root-Hinweise wurden vor dem Autorenfreeze eingearbeitet: zusätzliche/default/geerbte ACLs dürfen nicht als bereinigt gelten; künftige tatsächliche Postchecks dürfen nicht zum Vor-PO-Zirkelschluss werden. Heute bereits belegte CI-Policy-/Native-Werte sowie die begrenzte zusätzliche rollenrang-/Stage2-Offline-Evidence wurden anerkannt. Der neue historische Gap-Receipt wird direkt referenziert; gewöhnliche Wort-/Zahlabstände und die zeitliche Abgrenzung späterer automatischer Docs-PR-CI wurden bereinigt.

**V1/R1 und V2 wurden an ihren damaligen Dateien und Anforderungen unabhängig geprüft; V2 ist in #1160 integriert. TASK V3 bindet neue Bytes und übernimmt keinen früheren Hash-/Head-PASS.** Der V3-Self-Review gleicht die geänderte Quellenregel, separate Gegenprüfungsentscheidung, positive Konfliktauflösung und fehlenden heutigen Wiederannahmeübergang ab. Die 28 Dev-Zielpunkte, 27 nativen Fälle, R0–R8, Phase A/B/C und besonderen Holds bleiben erhalten. Sämtliche neuen Quellen-/SLO-/Produktfälle sind geplante Kriterien, keine neue Ausführung.

**Das ist ein Autoren-Self-Review, kein unabhängiger TL-PASS.** Root und /root/blocker_evidence_review sowie /root/release_live_audit müssen die endgültigen Bytes unabhängig bewerten. Jede notwendige unmittelbare Korrektur bleibt in dieser Session und erhält eine neue Revision; alte Hashreviews werden nicht übertragen.

## Offene Punkte und Risiken

- P0: kein neuer P0-Befund im Dokumentationsumfang festgestellt; keine pauschale Datenbanksicherheitsbehauptung.
- P1: effektiver eigener Konto-/Session-Schutz ist auf dem Ziel noch nicht abgenommen; tatsächliche Ledger-/Stage2-/Auth-/Rechte-/Expositionsbindung und legitime Klärung der betroffenen #917-Nachprüfung fehlen. Finales zielgebundenes Installations-/Recovery-Artefakt noch nicht erstellt.
- P2: bekannte eigenständige Privacy-Holds werden durch diese Paketvorbereitung nicht geschlossen. Die Dokumente enthalten keine neuen Personen-/Session-/Credential-Daten.
- P3: die Dokumentationslieferung braucht noch unabhängigen Root-/Reviewer-Abschluss; bestehende fremde Lint-/Abhängigkeitsrisiken werden nicht bearbeitet.

**Menschlicher Anteil heute:** keine neue SQL-Ausführung, keine Wiederholung historischer Läufe und keine weitere pauschale Zustimmung. Das Paket ist konkret prüfbar, bleibt jedoch für eine wirksame Änderung NOT_RELEASE_READY.

## Exakter nächster Schritt / STOP

Root prüft diese fünf gefrorenen Autorendokumente zusammen mit seinem Stage1-Bericht, Source-/Evidence-Manifest und endgültigen Reviews und persistiert den begrenzten Ergebnisstand. Die wirkliche Freigabereife kann erst nach den benannten zulässigen Zielnachweisen und dem vollständigen finalen Installations-/Recovery-/QA-Vertrag entschieden werden. Ein erfolgreicher Bericht schließt weder Stage1 automatisch noch das breite Feature-Issue #917.

V3/R0 folgt der ausdrücklichen Owner-Korrektur nach #1160 und TASK V3. V1/V2 bleiben historisch unverändert; ihre Hashbindungen gelten nicht für neue Dateien. Dev-Zielgates, Run2-/Gap-/CI-Teilbelege und Recovery-Zustände bleiben erhalten. Root und beide Reviewer müssen dieselben zehn fachlichen Dokumente plus REVIEW.md bewerten. Kein Cursor-UI-/Rename-Beleg wird behauptet; Cursor bleibt pausiert. Keine neue Implementierung, SQL-, Provider-, Schedule- oder Production-Aktivierung.

**Writer RETURN / STOP. Do not mark Ready. Do not merge. Do not start a follow-up slice.**

