# Dev-Paket #1139 — Nachprüfung und Rollback-/Recovery-Plan

**DEV-PACKAGE-1 / V2 / R0 — 8. November 2026, Europe/Zurich.**

**Planstatus: prüfbar, nicht zur Ausführung freigegeben.** Eine wirksame Dev-Installation ist NOT_RELEASE_READY. Die unveränderten Kandidatquellen, Zielgrenzen und offenen Bedingungen stehen in [DEV_PACKAGE.md](DEV_PACKAGE.md) und [TARGET_EVIDENCE_MATRIX.json](TARGET_EVIDENCE_MATRIX.json). Hier werden messbare Abnahmebedingungen und Fehlerzustände festgelegt; kein Datenbankbefehl oder menschlicher Ersatzlauf wird angeordnet.

**V2-Abgrenzung:** Die nachfolgenden Zielgates betreffen weiterhin das konkrete #1139-Dev-Paket. Die besondere PO-Entscheidung erlaubt eine geprüfte Auth-/DB-Änderung; sie bedeutet keine Einzelregelfreigabe. Die automatische Routineannahme nach freigegebener Methode bleibt verbindliches Produktziel. Die gesonderten Erweiterungsprüfungen stehen in Abschnitt 7 und [PRODUCT_TARGET_PLAN.md](PRODUCT_TARGET_PLAN.md); sie sind heute nicht ausgeführte Zukunftsplanung.

## 1. Was bereits geprüft wurde

Die vier #1142-Dateien sind im jetzigen Repository an main 608414441651b407cf56ab976c1cd116db45de0c byteidentisch mit den abgenommenen Quellblobs. Ihre eigene ursprüngliche CI-Abnahme bleibt an deren historischen Prüfstand gebunden.

Zusätzlich hat Root die **bereits vorhandene aktuelle Main-CI 42513853717** auf genau 60841444 unabhängig im Original gelesen: Core 128832463566 enthält Source-Guard ok 1567 und nativen Parent ok 1568, alle 27 Fälle PASS/keine Skips, 22791.237512 ms. Auth 128832463670 bestätigt am 08.11.2026, 19:13:09 UTC: 55 erwartete Werte/243 Schlüssel; die vier Kandidat-Policywerte 0 / 0 / false / false sind durch die aktuelle gepinnte Vergleichskette erfasst. Diese aktuellen Nachweise werden ebenfalls anerkannt. Sie wurden für die Dokumentenprüfung von V1/V2 nicht neu ausgeführt. [Aktuelle CI](https://github.com/Jetnity/jetnity/actions/runs/42513853717)

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

**Grenze:** Auth-Datensätze, FK-/Enum-/Rechtekontext und Request-Claims der Fixture sind synthetisch. Die Quellenprüfung und beide belegten nativen CI-Ausführungen beweisen keine Signatur echter Dev-JWTs und keine installierte Zielautorität. Für die Dokumentenprüfung von V1/V2 hat der Autor keine neuen SQL-/Native-/Hosted-Tests gestartet. Der Source-Review verwendet die bereits vorhandene main-CI. Eine spätere reguläre automatische Docs-PR-CI wird separat am tatsächlichen neuen Head bewertet; ihr Ergebnis wird nicht vorweggenommen. Die historische writer-local PG-SKIP-Aussage wird nicht mit der späteren tatsächlich erfolgreichen CI-Ausführung verwechselt.

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

**Derzeit als Vor-PO-Lücken offen:** konkret betroffene Teile von V01–V10: der benötigte zulässige Readback-Weg, tatsächliches Ledger/Stage2/Namespace, nicht erfasste Auth-/Rechte-/Lifecycle-/Expositionsbedingungen sowie endgültiges Installations-/Recovery-Artefakt und konkrete QA-Bindung. V11 wartet auf diese finale Zielrevision. R4-/Run2-Teile und der heutige CI-Policy-Snapshot aus V01/V03/V05–V07 sind bereits anerkannt und müssen nicht als vollständig unbekannt neu erfunden werden. Die tatsächlichen Phase-C-Ergebnisse werden erst nach der späteren Entscheidung erwartet. Die Matrix benennt jeden Umfang einzeln.

Für V08 genügt weder das Kopieren beider Kandidaten noch ein äußerer Transaktionsrahmen. Beide Dateien besitzen innere COMMITs. Eine mögliche spätere Änderung ihrer Transaktionsgrenzen erzeugt neue Bytes mit eigenen Tests und Reviews; V2 ändert sie nicht.

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

Ein tatsächlicher Dev-Readonly-Nachweis muss seine erlaubte Quelle benennen. V2 liefert kein SQL für das verweigerte Ledger-/Katalogreadback. Echte Accountsperren, fremde Sitzungseingriffe und neue Auth-/RLS-Privilegien sind keine impliziten Tests dieser Dokumentation.

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

**Diese konkreten Recovery-Artefakte sind auch in V2 nicht vorhanden oder nicht bestätigt.** Die vorhandene P1-Stage1-Quelle darf als historische Vergleichsbasis erhalten bleiben. Ihre Wiederherstellung unter weiterhin aktiver alter Freigabelogik wäre kein sicherer Rückfall. Eine kontrollierte Rückkehr zu vorherigen Definitionen wäre nur mit nachweislich wirksamer Sperre des betroffenen Produkts und separat geprüfter Zielentscheidung vertretbar; V2 erteilt sie nicht.

Ein globaler Datenbank-Restore kann spätere fremde Änderungen betreffen. Der historische [Recovery-Metadatenreceipt 6164171285](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6164171285) bestätigt keinen aktuellen getesteten Zero-Loss-Restore. Er darf nicht zum universellen Undo für die neue Funktions-/Auth-Ersetzung umgedeutet werden. Keine History-Reparatur, kein Rückdatieren von Migrationsversionen und kein Replay von Stage1 oder verbrauchten Grants.

## 6. Menschlicher Ablauf und konkrete Freigabegrenze

**Heute besteht keine menschliche Datenbank-Ausführungsaufgabe.** Sasa hat die zusätzliche historische Beleglücke erklärt; sie wird dokumentiert. Der erfolgreiche Run2 und seine Dateien bleiben anerkannt. Root benötigt keine weitere pauschale Zustimmung, um diese Unterlagen fertig zu prüfen.

Der spätere menschliche Entscheidungsablauf ist:

1. Root liefert eine neue vollständig gebundene Paketrevision mit genauer Dev-Identität, finalem Installations-/Recovery-Hash, unabhängiger Abnahme und allen erfüllten Vorbedingungen.
2. Sasa erhält die Erklärung der einzelnen wirksamen Änderungen, Nutzen, geprüften Grenzen und Recovery-Auswirkungen und entscheidet über genau dieses Paket.
3. Nur wenn tatsächlich eine zulässige menschliche Handlung erforderlich ist, liefert Root eine auf diese genehmigte Revision begrenzte Schrittfolge mit erwarteten Meldungen und klaren Abbruchpunkten.
4. Root bewertet die unveränderten tatsächlichen Ergebnisse; neue Fehler oder ein veränderter Head führen zurück zur Prüfung. Ein Erfolg erteilt keine zusätzliche Production-/Source-/Provider-/Launchfreigabe.

Das wirksame #1139-Paket steht auch in V2 noch bei Schritt 1 vor dessen Abschluss. Es enthält bewusst keine Klick-/Verbindungs-/SQL-Anleitung für die verweigerte Aktion. Ein anderer menschlicher Operator ist keine Plattformclearance.

## 7. Zusätzliche spätere Produktabnahme aus TASK V2

Diese Kriterien gehören zu künftigen konkret versionierten Produktpaketen. Die Mindestzahl von zwei amtlichen Primärquellen gilt bereits für jede erste öffentliche Regelantwort; alte Einquellenkandidaten erhalten keine neue Publikationsfreigabe. Sie ersetzen weder V01–V12 noch die tatsächlichen #917/#1139-Nachweise und sind kein Anlass, heute neue SQL-/Provider-/Jobaktionen zu starten.

| Fall | Erwartetes Ergebnis der späteren Umsetzung |
| --- | --- |
| Zwei amtliche Primärquellen, gleicher normalisierter Kontext, gültige Methode und vollständige Provenienz | Jetnity-Dienst nimmt automatisch an; kein menschlicher Klick je Regel. |
| Eine Quelle, Dublette, Spiegel, widersprüchlicher Fakt, zusätzliche relevante Gegenquelle, unklare Bedingung/Gültigkeit oder veraltete Stütze | Keine Veröffentlichung; keine 2:1-Mehrheitsabkürzung; verständlicher Pending-/Blockierungsgrund und deduplizierte Ausnahmeeskalation. |
| Einquellen-Altvertrag, altes Proofschema oder historische kopierte Annahme | Keine stillschweigende Erfüllung der neuen Methode; getrennte historische Evidence, erforderliche erneute Qualifikation. |
| Anbieter liefert accepted/trusted/role/policy-Claims, direkte SQL-Anweisung oder erfundene Source-Autorität | Vor Storage/Import zurückweisen; keine stärkeren Rechte für Researcher oder Modelle. |
| Maschinenimport ohne menschliche Sitzung | Nur über ausdrücklich geprüften eigenen Dienstvertrag erfolgreich; keine gefälschten Owner-/AAL2-/Sessionclaims und kein pauschaler service_role-Bypass. |
| Änderung an Supportzahl/-identität | TypeScript, SQL, Custody, Provenienz, Refresh, Commit/Confirm und Read-Reproof gemeinsam auf neue Version binden; fehlende oder abweichende Stütze muss in jedem Pfad scheitern. |
| Mehrere Staatsangehörigkeiten / Dokumentbedingungen | Bedingte Regelübersicht je Staatsangehörigkeit mit sichtbaren globalen Reise-/Dokumentbedingungen; kein zusätzlicher persönlicher Fragebogen, keine günstigste-Pass-Heuristik und kein Zusammenfallen ungleicher Cachezellen. |
| Cache-Miss / neue oder abgelaufene Regelzelle | Schnelles „wird geprüft“, höchstens ein aktiver Job je Kontext/Methode; bis bestätigtem Import und Cacheversion keine öffentliche Regelantwort. |
| Quellenwechsel, Rückzug, Konflikt oder Restore | Betroffene Cacheprojektionen invalidiert; keine automatische Reaktivierung einer heute ungültigen Altregel. |
| Wiederholter Job, parallele Ergebnisse, verlorene Commitantwort | Idempotenz/Vorgängerabgleich und echte Confirm-/Recovery-Evidence; keine doppelten oder veralteten Annahmen. |
| Cache-SLO und Forschungspfad | Vorgeschlagenes p95-Ziel unter 1.000 ms bei vereinbartem Referenznetz/Zielregion separat für Treffer/Pending messen; Research läuft nicht synchron auf dem Trefferpfad. Keine aktuelle Performancebehauptung. |
| Passnummer, MRZ, Passfoto, Nutzer-/Trip-/Sessionkennung oder personenbezogener Freitext in Proposal/Cache/Logs/Fehlern | Nicht in der öffentlichen Regelpipeline speichern oder zurückspiegeln; strikte Feldprüfung und gezielte Privacy-Abnahme einschließlich Hintergrundjobs. |
| Kill-Switch / Prozessneustart / Anbieterwechsel | Annahme kontrolliert gesperrt beziehungsweise Arbeit sicher wiederaufgenommen; kein laufender Chat und keine bestimmte Person als Betriebsabhängigkeit. |

Produkt-Recovery bindet an die aktuellen Quellen und die weiterhin gültige Methode. Ein alter Regeldatensatz ist trotz intakter Prüfsumme kein zulässiger aktiver Fallback, wenn seine Evidenz abgelaufen, widersprüchlich oder zurückgezogen ist. Audit-/Receipt-Historie bleibt erhalten. Bestehende #1131-/Privacy-/Rollout-Gates werden durch diese Abnahmematrix nicht geschlossen.

## 8. Aktuelles Verdict

**Autorenlieferung:** vollständiger Plan zur unabhängigen Prüfung, keine TL-Abnahme.  
**Tatsächliche Dev-Ausführung/Nachprüfung/Recovery-Probe:** NOT_EXECUTED.  
**Wirksames Paket:** NOT_RELEASE_READY.  
**#1139:** OPEN/P1.  
**Stage1-Gesamtabnahme:** INDEPENDENT_READBACK_PENDING mit anerkannten Teilnachweisen.

Root bindet sein endgültiges Dokumentationsverdict an die finalen Bytes in REVIEW.md. Dieses Verdict muss von einer späteren wirksamen Auth-/DB-Abnahme getrennt bleiben.
