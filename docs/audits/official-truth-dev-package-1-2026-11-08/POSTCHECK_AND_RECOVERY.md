# Dev-Paket #1139 — Nachprüfung und Rollback-/Recovery-Plan

**DEV-PACKAGE-1 / V3 / R0 — 8. November 2026, Europe/Zurich.**

**Planstatus: prüfbar, nicht zur Ausführung freigegeben.** Eine wirksame Dev-Installation ist NOT_RELEASE_READY. Die unveränderten Kandidatquellen, Zielgrenzen und offenen Bedingungen stehen in [DEV_PACKAGE.md](DEV_PACKAGE.md) und [TARGET_EVIDENCE_MATRIX.json](TARGET_EVIDENCE_MATRIX.json). Hier werden messbare Abnahmebedingungen und Fehlerzustände festgelegt; kein Datenbankbefehl oder menschlicher Ersatzlauf wird angeordnet.

**V3-Abgrenzung:** Die nachfolgenden Zielgates betreffen weiterhin das konkrete #1139-Dev-Paket. Die besondere PO-Entscheidung erlaubt eine geprüfte Auth-/DB-Änderung; sie bedeutet keine Einzelregelfreigabe. Die automatische Routineannahme nach freigegebener Methode bleibt verbindliches Produktziel. Die gesonderten Erweiterungsprüfungen stehen in Abschnitt 7 und [PRODUCT_TARGET_PLAN.md](PRODUCT_TARGET_PLAN.md); sie sind heute nicht ausgeführte Zukunftsplanung.

## 1. Was bereits geprüft wurde

Die vier #1142-Dateien bleiben an Dokumentbasis main 1b96936f0159578c063992407c650a0995b60895 byteidentisch mit den abgenommenen Implementierungsblobs am historischen Pin 608414441651b407cf56ab976c1cd116db45de0c. Dazwischen wurden nur die zehn #1160-Dokumente ergänzt. Frühere Source-Pässe und V2-Dokumentreviews sind keine V3-Head-Abnahme.

Root hat die **bereits vorhandene frühere Main-CI 42513853717** auf genau 60841444 im Original gelesen: Core 128832463566, Source-Guard ok 1567, nativer Parent ok 1568, alle 27 Fälle PASS/keine Skips, 22791.237512 ms. Auth 128832463670 am 08.11.2026, 19:13:09 UTC bestätigt 55 erwartete Werte/243 Schlüssel und die vier gepinnten Policywerte 0 / 0 / false / false. Dieser begrenzte Snapshot bleibt anerkannt. [Vorherige CI](https://github.com/Jetnity/jetnity/actions/runs/42513853717)

Zusätzlich bestätigt Root die **inzwischen abgeschlossene reguläre #1160-Post-Merge-CI 42527963600** an main 1b96936: sieben erfolgreiche Jobs. Original-Core 128875685288 belegt den tatsächlichen Checkout, Source-Guard 1567 und nativen Parent 1568 mit 27/27 PASS, 0 Skip, 0 Fail, 19859.855067 ms. Original-Auth 128875685142 bestätigt um 22:01:11 UTC erneut 55 Sollwerte/243 Schlüssel, alle passend. Das ist bestehende Baseline-Evidence des neuen Main-Heads; kein vom V3-Autor gestarteter Test, keine neue Dev-Installation und kein PASS für die erst geänderten V3-Dokumentbytes. Task V3s damalige Angabe „läuft noch“ bezeichnet dessen Publikationszeitpunkt. Neue V3-PR-/Head-Gates folgen separat. [Baseline-CI](https://github.com/Jetnity/jetnity/actions/runs/42527963600)

Der [TL-POST-MERGE-PASS 6690979366](https://github.com/Jetnity/jetnity/pull/1142#issuecomment-6690979366) dokumentiert tatsächliches main 9f3553602066d1e11171eaf36e720c2ac21061f8, CI 42257254001, den Source-Guard und die vollständig ausgeführten **27 nativen Unterfälle**. Die damalige Gesamtausführung meldete 7952 Tests/7950 PASS/0 FAIL/2 bekannte Browser-Layout-Skips. Die 27 Kandidatenfälle hatten keinen Skip.

| Historische native Fälle | Geprüftes Verhalten in der isolierten Fixture |
| --- | --- |
| N01 | Aktiver eigener Owner erfolgreich; echte Katalog-Owner/Sicherheitsmerkmale/ACLs und direkte unerlaubte Einstiege geprüft. |
| N02 | Dieselben Claims nach Status-, Rollen-, Auth-user- oder Sessionänderung; Capability sowie reserve/recheck verweigern beziehungsweise fehlende Nutzerzeilen erteilen keine Autorität. |
| N03 | Fehlende, fremde, falsch geformte oder abgelaufene Claims; User-/App-Metadata erzeugt keine Autorität. |
| N04 | Tatsächlich erreichbarer Profile-Trigger blockiert Selbstreaktivierung/Selbstpromotion; vorangestelltes No-op-UPDATE beweist, dass der Negativfall nicht bloß an unsichtbaren Zeilen vorbeiläuft. |
| N05 | Echte ACL-Entfernung und Schemalücke führen zu Fehlern und unverbrauchtem Grant. |
| N06–N13 | reserve nach beobachtetem Grant-Warten: Profil deaktiviert, Session gelöscht, Auth-Ban, Sessionablauf, Tokenablauf, Trip-Revision geändert, Trip-Owner geändert, Grant abgelaufen. |
| N14–N21 | Dieselben acht beobachteten Warte-/Invalidierungsfälle für recheck. |
| N22 | Konflikte durch nicht-schlüsseländernde Locks an Account/Session/Profil/Trip scheitern fail-closed mit NOWAIT. |
| N23 | Tatsächlich beobachtetes Grant-Warten endet am begrenzten Lock-Timeout ohne Verbrauch. |
| N24 | Echte synthetische Auth-delete-/FK-Cascade-Inversion scheitert begrenzt statt erfolgreich weiterzulaufen. |
| N25–N26 | Veraltete Snapshots unter repeatable read und serializable propagieren 40001. |
| N27 | Nach RPC-Rückgabe gehaltene Authority-Locks schützen bis zum Commit; spätere Sperrung serialisiert anschließend und blockiert neue Arbeit. |

Native erfolgreich mit NULL zurückgekehrte Negativtransaktionen wurden vor dem Nichtverbrauchsvergleich committed; ein vorheriger Rollback hätte einen fehlerhaften Verbrauch verdecken können. Locktests beobachteten wartenden und blockierenden Backend-PID sowie den echten Lockzustand. Diese Nicht-Leerheitsbedingungen müssen bei einer späteren gezielten Anpassung erhalten bleiben.

**Grenze:** Auth-Datensätze, FK-/Enum-/Rechtekontext und Request-Claims der Fixture sind synthetisch. Die Quellenprüfung und belegten nativen CI-Ausführungen beweisen keine Signatur echter Dev-JWTs und keine installierte Zielautorität. Für die Dokumentenprüfung von V1/V2/V3 hat der Autor keine neuen SQL-/Native-/Hosted-Tests gestartet. Der Source-Review verwendet die bereits vorhandenen, exakt zugeordneten Main-CI-Snapshots. Eine spätere reguläre automatische Docs-PR-CI wird separat am tatsächlichen neuen Head bewertet; ihr Ergebnis wird nicht vorweggenommen. Die historische writer-local PG-SKIP-Aussage wird nicht mit der späteren tatsächlich erfolgreichen CI-Ausführung verwechselt.

## 2. Phasen und Bedingungen vor einer späteren wirksamen Änderung

**Phase A — freigabereifes Paket:** Zielbaseline, exakte Änderungen, geplanter Nachprüfungs-/QA-Vertrag, geprüfte Recovery und unabhängiger Source-/Zielreview müssen vollständig sein. **Phase B — besondere PO-Entscheidung:** entscheidet erst über dieses vollständige Paket. **Phase C — Ausführung und effektive Abnahme:** tatsächlicher Apply, Postchecks, reale signierte Ergebnisse und Abschlussentscheidung folgen der Freigabe.

Die folgende Reihenfolge ist ein Abnahmeplan für Root, keine aktuelle Ausführungsanweisung. V01–V11 betreffen die Vorbereitung, V12 ist die danach reservierte Entscheidung. Die noch nicht ausgeführten Postchecks aus Abschnitt 3 sind erwartete Phase-C-Arbeit; ihr heutiges NOT_EXECUTED ist kein zirkuläres Vor-PO-Gate. Fehlende Zielbindung, Installationsdatei, konkreter Testplan oder Recovery verhindern dagegen die Freigabereife.

| ID | Prüffrage | Erforderliches Ergebnis |
| --- | --- | --- |
| V01 | Ist das tatsächliche Ziel eindeutig gebunden? | Genau Dev/develop/yfvbxvijcorffwxbxahl; Verbindungs-/Ausführungskontext aktuell belegt; Production-Parent ausgeschlossen. |
| V02 | Ist der ursprünglich verweigerte Umfang zulässig geklärt? | Benötigte tatsächliche Evidence darf regulär erhoben/verwendet werden. Kein Retry oder anderer Operator als Ausweichweg. |
| V03 | Ist Stage1 samt realem Ledger eingeordnet? | Anerkannte Run2-Teile übernommen; tatsächliche Ledger-ID/Historyabweichungen und fehlende Restteile konkret geklärt, keine blind angenommene Version. |
| V04 | Ist der Stage2-/Namensraumzustand eindeutig? | Anwesenheit/Abwesenheit und genaue Identität der Pilot-RPCs, Granttabelle und jetnity_ot_auth bekannt; keine unerwartete Kollision. |
| V05 | Passen Auth-/Profil-/Trip-/Grant-Verträge? | Typen, Enumlabels, FKs/Trigger/Lifecycle, relevante Constraints/Policies und abhängige Funktionen passen nachweislich zu den Kandidatenvoraussetzungen. |
| V06 | Passen tatsächliche Owner-/ACL-Rechte? | Benötigte Reads und Row-Locks sind rechtlich erlaubt; alle direkten/Default-/geerbten Rechte entsprechen dem konkreten Paket, keine zusätzliche Client-Autorität. BYPASSRLS ist kein Ersatz für Objektprivilegien. |
| V07 | Passen Session-Policy und Exposition? | Vier festgelegte Dev-Policywerte aktuell gebunden; internes Schema außerhalb exponierter APIs; erlaubte Caller eindeutig. |
| V08 | Ist das tatsächliche Installationsartefakt vollständig? | Genauer finaler Text/Hash, sämtliche Änderungen, endgültige Transaktionsgrenze, reguläre Migrations-/Ledgerzuordnung und eventuelle Stage2-Voraussetzungen festgelegt. |
| V09 | Ist Recovery vor der Änderung ausführbar und geprüft? | Tatsächlicher Vorherstand, anwendbare sichere Gegenänderung beziehungsweise Restore-Basis, Nachprüfung und Verlustgrenzen belegt; Zustände aus Abschnitt 5 abgedeckt. |
| V10 | Sind Prüfumgebung und Nachweise vorbereitet? | Konkreter isolierter QA-Vertrag; kein echtes Owner-/Produktivkonto wird für destruktive Negativfälle verändert; Redaktions- und Ergebnisschema festgelegt. |
| V11 | Liegt unabhängige exakte Abnahme vor? | Root und unabhängige Sicherheits-/Zielprüfung beurteilen dasselbe endgültige Artefakt und denselben Zielstand; keine alten Head-Pässe übertragen. |
| V12 | Ist die reservierte besondere Entscheidung getroffen? | PO entscheidet über das vollständige konkrete Dev-Paket. Allgemeines Weiterarbeiten oder der Auftrag zum Zusammenstellen ersetzt dieses spätere Auth-/DB-Gate nicht. |

**Derzeit als Vor-PO-Lücken offen:** konkret betroffene Teile von V01–V10: der benötigte zulässige Readback-Weg, tatsächliches Ledger/Stage2/Namespace, nicht erfasste Auth-/Rechte-/Lifecycle-/Expositionsbedingungen sowie endgültiges Installations-/Recovery-Artefakt und konkrete QA-Bindung. V11 wartet auf diese finale Zielrevision. R4-/Run2-Teile und der bereits vorhandene Baseline-CI-Policy-Snapshot aus V01/V03/V05–V07 sind bereits anerkannt und müssen nicht als vollständig unbekannt neu erfunden werden. Die tatsächlichen Phase-C-Ergebnisse werden erst nach der späteren Entscheidung erwartet. Die Matrix benennt jeden Umfang einzeln.

Für V08 genügt weder das Kopieren beider Kandidaten noch ein äußerer Transaktionsrahmen. Beide Dateien besitzen innere COMMITs. Eine mögliche spätere Änderung ihrer Transaktionsgrenzen erzeugt neue Bytes mit eigenen Tests und Reviews; V3 ändert sie nicht.

## 3. Messbare Nachprüfung des zukünftigen tatsächlichen Zielpakets

Alle folgenden Prüfungen haben in dieser Lieferung den Status **NOT_EXECUTED_ON_TARGET**. Sie sind nur nach vollständiger Erfüllung von Abschnitt 2 und innerhalb des dann ausdrücklich freigegebenen Umfangs anwendbar.

### 3.1 Installations- und Rechtevergleich

Erforderlicher Ergebnisdatensatz:

1. Paketversion, exakter Installationshash, tatsächliches Dev-Ziel, Start-/Endzeit und eindeutig beobachteter Transaktionsausgang.
2. Tatsächlicher Ledger-Eintrag beziehungsweise die vom genehmigten Migrationsweg erwartete Historienänderung; keine aus dem Quelldateinamen abgeleitete Ersatz-ID.
3. Exakte neuen Body-/Konfigurationsvergleiche für Capability, Witness, Guard und gegebenenfalls Pilot, jeweils zusammen mit Signatur, Owner, Sicherheitsmodus, Volatilität/Parallelklassifikation und Konfiguration.
4. Tatsächliche direkte, Default-/geerbte und effektive Rechte aller relevanten Rollen einschließlich nicht erlaubter Zusatzgrants.
5. Bestätigte neue Namespace-/API-Exposition und abgegrenzte unveränderte Nachbarobjekte/Caller.
6. Keine unerwarteten Schema-/Daten-/Rollen-/RLS-/Policyänderungen; anwendbare Produkt-/Providerfreigaben bleiben geschlossen.

Erwartete Funktionsverträge:

| Objekt | Erwarteter neuer Vertrag |
| --- | --- |
| public.darf_official_truth_freigeben() | boolean, SQL, STABLE, PARALLEL UNSAFE, SECURITY INVOKER, search_path=pg_catalog; bestehender Owner erhalten, zusätzliche eigene aktive Sessionbedingung. |
| jetnity_ot_auth.own_active_session_v1() | boolean, PL/pgSQL, STABLE, PARALLEL UNSAFE, SECURITY DEFINER, Owner postgres, search_path=pg_catalog; zulässige direkte Boolean-Caller authenticated/service_role, keine fremde Identität als Argument. |
| jetnity_ot_auth.require_current_owner_session_v1() | void, PL/pgSQL, VOLATILE, PARALLEL UNSAFE, SECURITY DEFINER, Owner postgres, search_path=pg_catalog/lock_timeout=2s; keine direkten Grants an PUBLIC/anon/authenticated/service_role und keine unzulässige geerbte/zusätzliche Ausführung. |
| public.official_truth_application_pilot_run_v1(jsonb), falls im konkreten Zielpaket enthalten | jsonb, PL/pgSQL, VOLATILE, PARALLEL UNSAFE, SECURITY DEFINER, Owner postgres, leerer search_path/lock_timeout=3s; authenticated als beabsichtigter Client-Caller und vollständiger effektiver ACL-Abgleich. |

Die Quelle fordert keine pauschalen SELECT-/UPDATE-Grants für Clients auf Auth- oder Granttabellen und kein breiteres USAGE auf bestehendem private. Ein fehlendes Privileg des vorgesehenen Owners darf nicht still durch eine solche Erweiterung ersetzt werden.

### 3.2 Verhalten und Autorisierungszeitpunkt

Für eine tatsächliche Dev-Funktionsabnahme braucht es den konkret zugelassenen authentifizierten Requestpfad. Ein SQL-Editor-Aufruf als postgres und synthetische Request-GUCs sind dafür kein Signatur-/Sessionbeweis.

| Bedingung | Messbares Soll |
| --- | --- |
| Eigener aktiver Owner mit gültigem eigenen Auth-Nutzer, signierter AAL2-Session und gültigen Ablaufbedingungen | Capability true; ein genehmigter eigener Pilot-Grant erlaubt genau seinen vorgesehenen Versuch. |
| Niedrigere Rolle, AAL1, fehlender/fremder/ungültiger Witness | Keine Freigabe; Boolean false oder der ausdrücklich erwartete technische Fehler, kein erfolgreicher Grantverbrauch. |
| Profilstatus pending/disabled/banned, Auth-Sperre/Löschung/Anonymität oder fehlende/widerrufene Session | Keine Berechtigung trotz wiederverwendeter noch unexpired Claims. Destruktive Veränderungen bleiben isolierten explizit zugelassenen QA-Identitäten vorbehalten. |
| Token-/Sessionablauf während des Wartens | Nach dem Wait keine erfolgreiche Autorisierung; kein geänderter Grantverbrauch. |
| Eigener Trip-Owner oder Revision nach dem Vorabcheck verändert | Kein erfolgreicher Ergebnis-/Verbrauchspfad; sourcevertraglich NULL oder geeigneter Fehler. |
| Grant abgelaufen, deaktiviert, schon verbraucht oder falsche recheck-ID | Keine neue erlaubte Ausführung/kein unzulässiger erneuter Verbrauch. |
| Zulässiger recheck | Passende eigene bereits verbrauchte Grantidentität; erneuter frischer Authoritycheck, keine zweite Verbrauchsänderung. |
| Direkter Client-Aufruf des internen Guards, unzulässiger Tabellenzugriff oder Metadaten-Promotion | Verweigerung; kein Detaildatenleck und keine neue Autorität. |
| Fehlende erforderliche Tabelle oder Owner-ACL | Fehler bleibt sichtbar und fail-closed; kein Catch-and-allow, kein stiller Rollen-Fallback. |

Für die Race-Abnahme reicht „zwei Aufrufe parallel“ nicht: Nachweislich muss der tatsächliche Pilot nach dem Vorabcheck am konkreten Grant warten; die Invalidierung muss vor seiner Fortsetzung committed sein. Anschließend darf weder reserve noch recheck erfolgreich autorisieren. Das Rückkehr-NULL darf einen fälschlichen Verbrauch nicht durch einen Test-Rollback verdecken. Bestehende native Tests belegen diese Methode bereits; Ziel-/Vertragsunterschiede müssen vor einer Übertragung bewertet werden.

Nichtschlüsseländernde Locks, FK-Cascade-Inversionen und stärkere Isolation müssen begrenzt verweigern oder die erwartete 40001/55P03-Semantik liefern. Die erfolgreiche Autorisierung wird am frischen Check nach allen relevanten Locks bewertet; später committed Revokation beendet keine zuvor korrekt serialisierte Transaktion rückwirkend. [PostgreSQL Locking](https://www.postgresql.org/docs/17/explicit-locking.html), [Volatilität](https://www.postgresql.org/docs/17/xfunc-volatility.html)

## 4. Fehlerschwellen und Evidence-Ausgabe

Jedes unerwartete Objekt/ACL, jede falsche Zielbindung, jeder unbekannte Commitzustand, jede unzulässige Erfolgsantwort, jeder nicht abgeglichene erforderliche Vertrag und jeder Widerspruch zwischen Quelle und Ziel stoppt die wirksame Freigabe. „Keine Fehlermeldung“ ist kein vollständiger Nachweis.

Öffentliche Evidence enthält nur freigegebene Metadaten: Paket-/Quellhashes, abstrakte Testfallkennung, Datum/Zeit, SQLSTATE-/HTTP-Kategorie soweit geprüft, Soll/Ist, Commitzustand und den begrenzten Verdict. Keine Kontenlisten, Mailadressen, rohen JWTs/Cookies/Keys, Sessionwerte, Pass-/Reiseinhalte, Rohfehler mit Personenwerten oder unredigierten Auth-Dumps. Testbezeichnungen verwenden synthetische Labels.

Ein tatsächlicher Dev-Readonly-Nachweis muss seine erlaubte Quelle benennen. V3 liefert kein SQL für das verweigerte Ledger-/Katalogreadback. Echte Accountsperren, fremde Sitzungseingriffe und neue Auth-/RLS-Privilegien sind keine impliziten Tests dieser Dokumentation.

## 5. Rollback- und Recovery-Entscheidung nach beobachtetem Zustand

Die Tabelle benennt spätere technische Verantwortlichkeiten. Sie ist nicht zur heutigen Ausführung bestimmt.

| Zustand | Erlaubte Aussage | Erforderliche Recovery-Entscheidung |
| --- | --- | --- |
| R0 — Noch kein Apply begonnen | Keine Kandidatänderung durch dieses Paket wirksam. | Aktuellen Zustand erhalten; offene Voraussetzungen klären. Das ist der tatsächliche Zustand dieser Lieferung. |
| R1 — Authority-Transaktion nachweislich offen, noch kein COMMIT gesendet/bestätigt | Die Änderungen dieser offenen Transaktion können abgebrochen werden. | Der im genehmigten Ausführungsweg vorgesehene Transaktionsabbruch muss tatsächlich bestätigt werden; danach Vorherstand zulässig vergleichen. Eine allgemeine Erfolgsmeldung eines anderen Befehls genügt nicht. |
| R2 — Authority-COMMIT bestätigt, Pilot noch nicht begonnen | Schema/Witness/Guard/Capability können bereits verändert sein; keine gemeinsame Atomarität. | Produktpfad bleibt gesperrt. Tatsächlichen Zustand und Caller bewerten; nur eine vorher geprüfte passende Weiterführung oder sichere Gegenänderung. Kein blindes erneutes Ausführen der Authority-Datei. |
| R3 — Authority committed, Pilot-Transaktion fehlgeschlagen oder vor eigenem Commit abgebrochen | Pilot-Abbruch macht den vorherigen Authority-Commit nicht rückgängig. | R2 als eigenständigen Zustand behandeln. Kein pauschales „alles zurückgerollt“. Vorhandener alter Pilot erhält durch die Boolean-Ersetzung allein keinen bewiesenen frischen Post-Lock-Guard. |
| R4 — Ein COMMIT wurde gesendet, Ergebnis ist unklar oder Verbindung abgebrochen | Erfolg und Rücknahme sind beide unbewiesen. | Keine Wiederholung und kein Apply-/Rollback-Erfolg behaupten. Über den tatsächlich zulässigen, vorab festgelegten Nachweisweg Ausgangszustand klären; ohne diesen bleibt der Vorgang angehalten. |
| R5 — Beide vorgesehenen Änderungen committed, Nachprüfung scheitert | DDL kann wirksam sein; ein nachträgliches ROLLBACK eines neuen Statements macht vergangene Commits nicht rückgängig. | Geschützten Pfad gesperrt halten; die vorher geprüfte kompensierende sichere Änderung oder den konkret passenden Restore-Plan verwenden, jeweils mit eigener Nachprüfung. |
| R6 — Nach Commit fanden erlaubte Prüf-/Produktaufrufe statt | Grantverbrauch oder andere genehmigte Datenänderungen können unabhängig von Funktionsdefinitionen dauerhaft sein. | Datenwirkungen getrennt inventarisieren. Kein Zurücksetzen von consumed_at, kein Wiederherstellen verbrauchter Grants oder Entfernen von Historie zum Ermöglichen eines zweiten Versuchs. |
| R7 — Zielobjekt kollidiert mit CREATE SCHEMA/CREATE FUNCTION oder widerspricht Vorherstand | Der installierte Zustand passt nicht zum freigegebenen Ausgangspunkt. | STOP/Reconciliation. Keine automatische Adoption, IF-NOT-EXISTS-Änderung, DROP CASCADE oder improvisierte Wiederholung. |
| R8 — Wiederherstellungspunkt/Inverse nicht nachweislich geeignet | Reversibilität ist unbewiesen. | Kein wirksamer Apply. Zuerst geeignetes Wiederherstellungs-/Gegenänderungsartefakt und dessen Prüfung fertigstellen. |

PostgreSQL ROLLBACK verwirft Änderungen der aktuellen Transaktion; außerhalb einer Transaktion macht es frühere Commits nicht rückgängig. Ein erfolgreicher Commit ist eine dauerhafte Grenze. Das sind grundlegende Transaktionsregeln, keine Zusage über das konkrete Ausführungswerkzeug oder eine vorhandene Jetnity-Sicherung. [PostgreSQL Transactions](https://www.postgresql.org/docs/17/tutorial-transactions.html), [ROLLBACK](https://www.postgresql.org/docs/17/sql-rollback.html)

### 5.1 Konkrete Voraussetzungen des späteren Recovery-Artefakts

Vor einer wirksamen Änderung benötigt Root:

- den tatsächlich gebundenen Vorherstand jeder ersetzten Funktion samt Owner, vollständiger Konfiguration/ACL, relevanten Abhängigkeiten und erwarteten Callern;
- eine eindeutige Aussage, welche Objekte neu sind und welche schon existieren; aktuelle Grant-/Datenwirkungen im genehmigten Umfang;
- den genauen vorgesehenen technischen Sperrmechanismus für den geschützten Pfad während Installation und Recovery, einschließlich direkter RPC-Einstiege; nur UI-Ausblenden genügt nicht;
- für jede Commitgrenze eine geprüfte Weiterführungs- oder Gegenänderungsoption mit neuen Artefakthashes und zulässiger Nachprüfung;
- bei Restore: tatsächliche Sicherungs-/Restore-ID, Ziel, Zeitpunkt, abgedeckte Objekte/Daten, Auswirkungen auf spätere Auth-/Trip-Änderungen, akzeptiertes Verlustfenster und ein angemessener Wiederherstellungsnachweis.

**Diese konkreten Recovery-Artefakte sind auch in V3 nicht vorhanden oder nicht bestätigt.** Die vorhandene P1-Stage1-Quelle darf als historische Vergleichsbasis erhalten bleiben. Ihre Wiederherstellung unter weiterhin aktiver alter Freigabelogik wäre kein sicherer Rückfall. Eine kontrollierte Rückkehr zu vorherigen Definitionen wäre nur mit nachweislich wirksamer Sperre des betroffenen Produkts und separat geprüfter Zielentscheidung vertretbar; V3 erteilt sie nicht.

Ein globaler Datenbank-Restore kann spätere fremde Änderungen betreffen. Der historische [Recovery-Metadatenreceipt 6164171285](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6164171285) bestätigt keinen aktuellen getesteten Zero-Loss-Restore. Er darf nicht zum universellen Undo für die neue Funktions-/Auth-Ersetzung umgedeutet werden. Keine History-Reparatur, kein Rückdatieren von Migrationsversionen und kein Replay von Stage1 oder verbrauchten Grants.

## 6. Menschlicher Ablauf und konkrete Freigabegrenze

**Heute besteht keine menschliche Datenbank-Ausführungsaufgabe.** Sasa hat die zusätzliche historische Beleglücke erklärt; sie wird dokumentiert. Der erfolgreiche Run2 und seine Dateien bleiben anerkannt. Root benötigt keine weitere pauschale Zustimmung, um diese Unterlagen fertig zu prüfen.

Der spätere menschliche Entscheidungsablauf ist:

1. Root liefert eine neue vollständig gebundene Paketrevision mit genauer Dev-Identität, finalem Installations-/Recovery-Hash, unabhängiger Abnahme und allen erfüllten Vorbedingungen.
2. Sasa erhält die Erklärung der einzelnen wirksamen Änderungen, Nutzen, geprüften Grenzen und Recovery-Auswirkungen und entscheidet über genau dieses Paket.
3. Nur wenn tatsächlich eine zulässige menschliche Handlung erforderlich ist, liefert Root eine auf diese genehmigte Revision begrenzte Schrittfolge mit erwarteten Meldungen und klaren Abbruchpunkten.
4. Root bewertet die unveränderten tatsächlichen Ergebnisse; neue Fehler oder ein veränderter Head führen zurück zur Prüfung. Ein Erfolg erteilt keine zusätzliche Production-/Source-/Provider-/Launchfreigabe.

Das wirksame #1139-Paket steht auch in V3 noch bei Schritt 1 vor dessen Abschluss. Es enthält bewusst keine Klick-/Verbindungs-/SQL-Anleitung für die verweigerte Aktion. Ein anderer menschlicher Operator ist keine Plattformclearance.

## 7. Spätere Produktabnahme nach TASK V3

[Die neue Owner-Quellenregel](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6727812983) gilt bereits für die erste öffentliche CH→DE-Regelantwort: **eine eindeutige amtliche Primärquelle des Ziellandes genügt; unabhängige amtliche Gegenprüfung, wenn verfügbar.** Fehlende, unpassende, unklare oder unerreichbare optionale Evidence allein erzeugt weder Sperre noch Routineeskalation. Echte relevante Konflikte und unklare Pflichtquellen blockieren den fachlichen Quellenentscheid; technische Grenzen bleiben bestehen. Der bestehende genau-eins-Store passt zur Mindestzahl, beweist aber weder Zielland-Zuständigkeit noch fertige Methodenumsetzung.

Alle folgenden Fälle sind **geplante Abnahmekriterien, NOT_EXECUTED**. Die bestehenden 27 Owner-/Sessiontests validieren diese neue Methode nicht. Sie ersetzen weder V01–V12 noch #917/#1139-Nachweise und schaffen kein zusätzliches Gate für die Vorbereitung des engen #1139-Fixes.

| Fall | Erwartetes Ergebnis der späteren Umsetzung |
| --- | --- |
| S01 Klare qualifizierte gültige Zielland-Primärquelle, keine zweite Quelle verfügbar | Jetnity nimmt nach normalen technischen Importgates automatisch an und veröffentlicht; kein Owner-Einzelklick. Begrenzte Gegenprüfungsstrategie und tatsächliches Ergebnis sind nachvollziehbar. |
| S02 Klare Pflichtquelle plus passende unabhängige amtliche Gegenquelle mit gleicher Aussage | Automatische Annahme; Quellen-/Prüfzeit-/Fakt-/Kontext-/Gültigkeitsbindung der Gegenprüfung wird exakt versioniert. |
| S03 Optionale Quelle fehlt, ist unerreichbar, veraltet oder selbst unklar; Pflichtquelle bleibt gültig und klar | Für sich keine Veröffentlichungssperre und keine manuelle Routineeskalation. Nichtverfügbarkeit und unklare Pflichtquelle bleiben verschiedene Zustände. |
| S04 Gegenquelle nennt andere Voraussetzungen oder nicht vergleichbare rechtliche Gültigkeit | Nichtvergleichbarkeit dokumentieren; nicht automatisch als echter Widerspruch oder Zustimmung werten. Ein separat bekannter relevanter Konflikt wird dadurch nicht gelöscht. |
| S05 Echter relevanter Widerspruch zum gleichen normalisierten Fakt, vergleichbarem Kontext und Gültigkeitsbezug | Keine neue Veröffentlichung; betroffene aktuelle Projektion invalidieren/zurückziehen und dedupliziert eskalieren. Weder Mehrheit noch pauschaler Primärquellenvorrang hebt den Konflikt auf. |
| S06 Pflichtquelle unklar/unqualifiziert; Sekundärquelle eindeutig | Keine Veröffentlichung; Sekundärquelle ersetzt die vorgeschriebene Zielland-Primärquelle nicht. Quellenklasse, Behördenname oder Domain allein beweist keine Zuständigkeit. |
| S07 Bekannter echter relevanter Konflikt; Gegenquelle später fehlend/unerreichbar | Konflikt bleibt wirksam bis methodengültiger tatsächlicher Auflösung. Weglassen oder Abruffehler setzt keinen accepted-Status wieder ein. |
| S08 Belegte sachliche Klärung oder relevanter Kontext-/Gültigkeitswechsel löst den Konflikt auf | Neue geprüfte Version und ausdrücklich versionierter zulässiger Übergang können automatisch neu annehmen. Heutige SQL-/Producer-Verträge liefern noch keinen Wiederannahmeübergang aus conflicted/withdrawn. Keine direkte Statusüberschreibung, Historiensäuberung oder ewige manuelle Blockade. |
| S09 Bekannte verfügbare passende Gegenquelle ausgelassen oder Gegenprüfungsrecord manipuliert | Methoden-/Integritätsverletzung erkennen. Pflichtbeleg bleibt singular; Gegenprüfungsrecord bindet aktuelle Entscheidung an Annahme/Commit/Rückzug/Cache. Keine lose Lognotiz und kein zweites Element in unveränderten genau-eins-Arrays. Keine erschöpfende Weltsuche verlangen. |
| S10 Auth-, Herkunfts-, Integritäts-, Privacy- oder aktuelles Versionsgate scheitert | Technisch fail-closed. Gegenquellenoptionalität verleiht weder Quellenautorität noch Schreib- oder Publikationsrechte. |
| B01 Researcher sendet accepted/trusted/role/policy-Claims, SQL-Anweisung oder erfundene Source-Autorität | Vor Speicherung/Import zurückweisen; Anbieter bleibt austauschbarer Lieferant untrusted Vorschläge. Alte Hashes/Receipts werden nicht zu V3-Annahmebeweisen. |
| B02 Maschinenimport ohne menschliche Sitzung | Nur über ausdrücklich geprüften eigenen Dienstvertrag erfolgreich; keine gefälschten Owner-/AAL2-/Sessionclaims, kein pauschaler service_role-Bypass. |
| B03 Mehrere Staatsangehörigkeiten und Dokumentbedingungen | Bedingte Regelübersicht je Staatsangehörigkeit, sichtbare globale Bedingungen; kein zusätzlicher persönlicher Fragebogen, keine günstigste-Pass-Heuristik oder Vermischung von Cachezellen. |
| B04 Cache-Miss oder ungeklärte/ungültige Pflichtquellenzelle | Schnell „wird geprüft“, höchstens ein aktiver Job je Kontext/Methode; bis bestätigter Annahme/Import/Cacheversion keine öffentliche Regelantwort. Allein fehlende optionale Gegenquelle erzeugt keinen solchen dauerhaften Miss. |
| B05 Wiederholter Job, parallele Ergebnisse, verlorene Commitantwort | Idempotenz, Vorgängerabgleich und echte Confirm-/Recovery-Evidence verhindern doppelte oder veraltete Annahmen. |
| B06 Cache-SLO und Recherchepfad | Vorgeschlagenes p95-Ziel unter 1.000 ms bei vereinbartem Referenznetz/Zielregion getrennt für Treffer/Pending messen; Recherche bleibt im Hintergrund. Kein bestehendes Leistungsergebnis behauptet. |
| B07 Passnummer, MRZ, Passfoto, Nutzer-/Trip-/Sessionkennung oder personenbezogener Freitext in Proposal/Cache/Logs/Fehlern | Nicht in der öffentlichen Regelpipeline speichern oder zurückspiegeln; Privacy-Abnahme einschließlich Hintergrundjobs. Amtliche Originale folgen gesonderten bestehenden Custody-/Retention-Verträgen. |
| B08 Kill-Switch, Prozessneustart, Anbieterwechsel oder Restore | Annahme kontrolliert sperren beziehungsweise sicher wiederaufnehmen; kein laufender Chat oder bestimmter Mensch als Runtimeabhängigkeit. Keine aktuelle ungültige oder ungelöst widersprüchliche Version reaktivieren. |

Produkt-Recovery verlangt die heute gültige Methode, klare zulässige Pflichtquelle und aktuellen Konfliktentscheid. Eine fehlende oder inzwischen veraltete optionale Quelle sperrt allein keine weiterhin gültige Primärversion. Ein bekannter relevanter Konflikt bleibt bis positiver methodengültiger Auflösung bestehen; ein belegter Gültigkeits-/Kontextwechsel darf ihn auflösen. Audit-/Receipt-Historie bleibt erhalten. Exakte Gegenprüfungs-, Speicher-/Proof- und Wiederannahmeverträge sind spätere Implementierungsarbeit; kein zwingender Mehrstützenumbau nur für den Normalfall ohne zweite Quelle. Bestehende #1131-/Privacy-/Rollout-Gates bleiben.

## 8. Aktuelles Verdict

**Autorenlieferung:** vollständiger Plan zur unabhängigen Prüfung, keine TL-Abnahme.  
**Tatsächliche Dev-Ausführung/Nachprüfung/Recovery-Probe:** NOT_EXECUTED.  
**Wirksames Paket:** NOT_RELEASE_READY.  
**#1139:** OPEN/P1.  
**Stage1-Gesamtabnahme:** INDEPENDENT_READBACK_PENDING mit anerkannten Teilnachweisen.

Root bindet sein endgültiges Dokumentationsverdict an die finalen Bytes in REVIEW.md. Dieses Verdict muss von einer späteren wirksamen Auth-/DB-Abnahme getrennt bleiben.
