# Official Truth — prüfbares Dev-Paket für #1139

**Version DEV-PACKAGE-1 / V2 / R0 — 8. November 2026, Europe/Zurich.**

**Dokumentationslieferung zur unabhängigen Prüfung. Effektive Dev-Änderung: NOT_RELEASE_READY.** Diese Version beschreibt die exakten vorhandenen SQL-Quellen und das vollständige verbleibende Zielpaket. Sie enthält keinen neuen Apply-Einstieg und erteilt keine Ausführungserlaubnis.

Auftrag: [TASK V2 / 6727237878](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6727237878), erweitert [TASK V1 / 6726886756](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6726886756). Autor: **Jetnity Official Truth Dev Decision Package 1 — Codex Generation 1**, Session **/root/dev_package_writer**. Root entscheidet allein über unabhängige Abnahme, Veröffentlichung, Ready und Merge.

## 1. Entscheidung, Ziel und Nutzen

**V2 erweitert das Paket um das verbindliche Automatisierungsziel.** [PRODUCT_TARGET_PLAN.md](PRODUCT_TARGET_PLAN.md) ordnet alle sechs Owner-Vorgaben den tatsächlichen Registry-/Proof-/Producer-/Store-/Reader-Verträgen zu. Routinefälle werden nach einmaliger Methodenfreigabe automatisch angenommen; der Owner entscheidet keine einzelne Regel. Das seit Oktober bestehende Autonomieziel wird weitergeführt. Die Vorgaben vom 8. November verlangen mindestens zwei übereinstimmende amtliche Primärquellen und Ausgabe erst aus akzeptierter Import-/Cacheversion. Es entsteht kein öffentlicher Live-Research-Kurzweg vor Annahme.

**#917 und #1139 bleiben der erste technische Schritt.** Der folgende SQL-Kandidat schützt die menschliche Administration und Methodengovernance. Er wird nicht durch gefälschte menschliche Claims zur Maschinenautorität umgedeutet. Der geplante Import-Dienst braucht einen eigenen engen versionierten Dienstvertrag; dieser Produktplan aktiviert ihn nicht.

Das bekannte P1 betrifft die geschützte Official-Truth-Autorität: Die ursprüngliche Stage1-Funktion verbindet die gespeicherte Owner-Rolle mit AAL2. Sie enthält keinen zusätzlichen eigenen aktiven Konto-/Session-Witness. Der menschliche Run2 bestätigt genau diese ursprüngliche Body-/Konfigurationsfassung. Der bestehende Korrekturkandidat ergänzt die aktuelle eigene Profil-, Auth- und Session-Prüfung und prüft an der tatsächlichen Pilot-Mutation nach relevanten Wartephasen erneut.

**Vorgesehenes einziges Änderungsziel:** Development, Branch develop, Ref **yfvbxvijcorffwxbxahl**. Die R4-Inventur band diesen Branch historisch an Parent **qscbgcdmivbbnzrcyegn**; der Parent ist Production und bleibt ausdrücklich außerhalb dieses Pakets. Der aktuelle Run2 ist diesem Dev-Ziel menschlich zugeordnet. Ein neuer tatsächlicher Verbindungs-/Ausführungskontext wird durch diese Dokumente nicht bestätigt.

Der bereits in [#1142](https://github.com/Jetnity/jetnity/pull/1142) integrierte Kandidat wird wiederverwendet. Keine neue Implementierung desselben Guards, keine globale Änderung der Rollen-/Admin-Helfer, keine Konto-/Sessionänderung und keine Änderung an managed Auth-RLS. Source-, Provider-, Accepted-Store-, Stage2- und Production-Aktivierung bleiben konkrete gesonderte Freigaben. Sie sind keine dauerhaften Einzelregelfreigaben.

## 2. Exakte Version und unveränderte Quellen

Repository-Basis: **608414441651b407cf56ab976c1cd116db45de0c**. Alle nachfolgenden Dateien wurden an dieser unveränderlichen Basis gelesen; Gitblob-Identitäten wurden zusätzlich aus den UTF-8-Bytes nachgerechnet und stimmen überein. Die vier #1142-Dateien entsprechen weiterhin den Blobs der gemergten PR-Lieferung.

| Quelle | Gitblob | UTF-8-Bytes | SHA-256 |
| --- | --- | ---: | --- |
| [authority-candidate.sql](https://github.com/Jetnity/jetnity/blob/608414441651b407cf56ab976c1cd116db45de0c/scripts/db/official-truth-owner-session-candidate-1/authority-candidate.sql) | 407c28bc7623f659e49c3f408bee28302ef717e1 | 5873 | 169c6b02c2776ac163590b1cd6ffb6d43133621c9dc9e31b687f083d2ab4aa50 |
| [pilot-candidate.sql](https://github.com/Jetnity/jetnity/blob/608414441651b407cf56ab976c1cd116db45de0c/scripts/db/official-truth-owner-session-candidate-1/pilot-candidate.sql) | e1cccc61773a5adf71d177252d12d047ecf2d627 | 2987 | d5eecdb50a4f00a1ba73bc6aa54f76a601bf0ee1461bb902aff3b1c5e561691e |
| [Native Source-/SQL-Test](https://github.com/Jetnity/jetnity/blob/608414441651b407cf56ab976c1cd116db45de0c/lib/readiness/official-truth-owner-session-candidate-local.test.ts) | 15f5ebd04452d1aff302dcc487087032863e293b | 39704 | 9498b7a2ee91c72bbd4c2dc96039664f1a903940c475adb81168abd1d594e36b |
| [R5-Quell-/Autorenbeschreibung](https://github.com/Jetnity/jetnity/blob/608414441651b407cf56ab976c1cd116db45de0c/docs/OFFICIAL_TRUTH_OWNER_SESSION_CANDIDATE_1_2026-11-06.md) | c09ee127e665846b139cee059ecc22ecdf89c382 | 16470 | d56acf3ca2b2b114157f4e2d2b6037b7258d5b1a524db2265a24acd135dc79d1 |
| [Ursprüngliche Stage1-Quelle](https://github.com/Jetnity/jetnity/blob/608414441651b407cf56ab976c1cd116db45de0c/supabase/migrations/20261002154952_official_truth_owner_reviewer_capability_1.sql) | 43a590682f1d3f569f418fb2572b8fb010de9291 | 1210 | 635151c127efde6e2953cc14c68e81ecccf10dba545329fe46c09dcdf50996a2 |
| [Ursprüngliche Stage2-Quelle](https://github.com/Jetnity/jetnity/blob/608414441651b407cf56ab976c1cd116db45de0c/supabase/migrations/20261013184409_official_truth_ch_de_application_pilot_1.sql) | 87639107883cb9771ed5b19db68994ba08a6c930 | 8781 | 5782f26d35c9a8e778f65a23383d324b9b5cb12c709bf45d21d2fce6873196f0 |

Die alten Pending-Sätze im R5-Autorenbericht sind durch den [TL-POST-MERGE-PASS vom 6. November](https://github.com/Jetnity/jetnity/pull/1142#issuecomment-6690979366) supersediert. Sie begründen keinen Neubau.

**Eine endgültige Dev-Migration und ihre Ledger-Kennung existieren in diesem Paket noch nicht.** Die Quellzeitstempel von Stage1/Stage2 sind keine festgestellten tatsächlichen Ledger-IDs. Paketversion, Gitblob, Commit und Datenbank-Migrationsversion sind unterschiedliche Identitäten. Die endgültige Installationsdatei muss nach Auflösung der Zielbedingungen separat exakt gebunden und geprüft werden.

## 3. Vollständiges Änderungsinventar der vorhandenen Kandidaten

Die Tabellen beschreiben ausschließlich die vorhandenen Quelloperationen. Sie sind keine auszuführende Schrittfolge.

### 3.1 Authority-Quelle: drei Funktionen und ein Schema

Die Quelle beginnt eine eigene Transaktion und beendet sie mit eigenem COMMIT. Innerhalb dieser Grenze stehen folgende 13 DDL-/ACL-Operationen:

| ID | Quelloperation | Beabsichtigte Wirkung |
| --- | --- | --- |
| A01 | Schema jetnity_ot_auth neu anlegen, Owner postgres | Separater interner Bereich; keine automatische Data-API-Exposition. Die tatsächliche Nicht-Exposition ist vor einer Änderung zu belegen. |
| A02 | Alle Schema-Rechte von PUBLIC, anon, authenticated, service_role entziehen | Diese direkten Grants werden auf eine bekannte Ausgangslage gebracht. |
| A03 | Schema-USAGE für authenticated und service_role | Erlaubt die Auflösung des eigenen Boolean-Witness; kein CREATE für diese Rollen. |
| A04 | jetnity_ot_auth.own_active_session_v1() neu anlegen | Argumentloser boolean, PL/pgSQL, STABLE, PARALLEL UNSAFE, SECURITY DEFINER, search_path=pg_catalog. |
| A05 | Owner dieser Funktion ausdrücklich postgres | Vorgeschlagener Ausführungsowner; seine realen Rechte sind zu belegen. |
| A06 | Alle Funktionsrechte des Witness von PUBLIC, anon, authenticated, service_role entziehen | Entfernung dieser direkten/default PUBLIC-Grants. |
| A07 | EXECUTE des Witness an authenticated und service_role | Kein Nutzer-/Sessionparameter und keine Detaildatenrückgabe. |
| A08 | public.darf_official_truth_freigeben() ersetzen | Gleiche argumentlose boolean-Signatur, SQL/STABLE/SECURITY INVOKER; zusätzlich Witness und coalesce(...,false); PARALLEL SAFE wird PARALLEL UNSAFE. |
| A09 | Alle Rechte der öffentlichen Capability von PUBLIC und anon entziehen | Diese Rollen erhalten keine direkte Ausführung. |
| A10 | EXECUTE der Capability an authenticated und service_role | Bestehende benannte Caller werden explizit erhalten. Ein Service-Key allein liefert keine menschliche Autorität. |
| A11 | jetnity_ot_auth.require_current_owner_session_v1() neu anlegen | Argumentloser void-Guard, PL/pgSQL, VOLATILE, PARALLEL UNSAFE, SECURITY DEFINER, search_path=pg_catalog, lock_timeout=2s. |
| A12 | Owner dieses Guards ausdrücklich postgres | Vorgesehener interner Ausführungsowner. |
| A13 | Alle Guard-Rechte von PUBLIC, anon, authenticated, service_role entziehen | Für diese Rollen kein direkter Guard-Einstieg; die geschützte Pilotfunktion ruft ihn als ihr Owner auf. |

**ACL-Grenze:** CREATE OR REPLACE erhält bestehende Ownership und ACLs der Capability; die anschließenden REVOKEs nennen nur bestimmte Rollen. Auch CREATE neuer Objekte kann von tatsächlichen Default-ACLs und Rollenvererbungen beeinflusst werden. Die Tabelle beweist deshalb keine exklusive effektive Zielberechtigung gegenüber unbekannten weiteren Rollen. Vollständige direkte, Default- und geerbte Rechte sowie Owner-Mitgliedschaften müssen für den tatsächlichen Installer und alle berührten Objekte abgeglichen werden. Unerwartete Rechte werden nicht durch eine still hinzugefügte globale Rechtebereinigung beseitigt. [PostgreSQL CREATE FUNCTION](https://www.postgresql.org/docs/17/sql-createfunction.html)

CREATE SCHEMA verwendet ausdrücklich kein IF NOT EXISTS; die zwei internen Funktionen sind CREATE, nicht CREATE OR REPLACE. Ein bereits vorhandener gleichnamiger Zielbestand ist ein Kollisions-/Reconciliation-Fall. Er erlaubt weder Wiederholung noch automatisches Übernehmen, Überschreiben oder Löschen.

### 3.2 Vollständiger Autoritätsvertrag

Der Boolean verlangt zusammen:

- einen JSON-Objekt-Requestkontext mit kanonisch geformter eigener sub- und session_id-UUID;
- Claim-Rolle authenticated, Claim-AAL aal2 und einen ganzzahligen numerischen zukünftigen exp-Wert;
- dieselbe UID in auth.uid() und Claim-sub;
- ein eigenes gespeichertes Profil mit Rolle owner und Status genau active;
- einen vorhandenen eigenen Auth-Nutzer, nicht gelöscht, nicht anonym und nicht aktuell gesperrt;
- genau die eigene Session mit gespeichertem AAL2 und nicht überschrittenem not_after, soweit gesetzt.

Der Boolean verwendet Statement-Snapshot und Statement-Zeit. Er ist kein später wiederverwendbarer Schreib-Grant. Der Kandidat ist ausdrücklich auf die bereits dokumentierte Dev-Policy timebox=0, inactivity_timeout=0, single_per_user=false, mfa_allow_low_aal=false begrenzt. Andere tatsächliche Regeln benötigen einen neu geprüften Vertrag. Er interpretiert refreshed_at nicht durch eine erfundene Zeitzone. Allgemeine Supabase-Sessiondokumentation begründet, warum bloße Sessionexistenz nicht beliebige Lifetime-/Inaktivitätsregeln nachweist; sie belegt keine Jetnity-Zielkonfiguration. [Supabase Sessions](https://supabase.com/docs/guides/auth/sessions)

Der private Guard verwendet denselben authentifizierten Request. Nach seiner anfänglichen Witness-Prüfung sperrt er eigene Auth-user-, Session- und Profilzeile in dieser Reihenfolge mit FOR SHARE NOWAIT. Danach bestimmt clock_timestamp() den Autorisierungszeitpunkt und liest die vollständige aktuelle Bedingung einschließlich Token-/Sessionablauf erneut. Fehler bleiben Fehler; fehlende beziehungsweise inkonsistente Zeugen erteilen keine Freigabe. Locks gelten bis zum Transaktionsende. Eine später serialisierte Sperrung macht zuvor korrekt serialisierte Arbeit nicht rückwirkend ungeschehen.

### 3.3 Pilot-Quelle: eine ersetzte Funktion

Die zweite Quelle besitzt eine **zweite eigene BEGIN-/COMMIT-Grenze** und vier DDL-/ACL-Operationen:

| ID | Quelloperation | Beabsichtigte Wirkung |
| --- | --- | --- |
| P01 | public.official_truth_application_pilot_run_v1(jsonb) ersetzen | JSONB-Rückgabe, PL/pgSQL/VOLATILE/SECURITY DEFINER, leerer search_path, lock_timeout=3s; PARALLEL UNSAFE als PostgreSQL-Default. |
| P02 | Owner ausdrücklich postgres | Der Pilot kann den internen Guard unter dem vorgesehenen Owner aufrufen. |
| P03 | Alle Pilot-Rechte von PUBLIC, anon, service_role entziehen | Kein direkter Einstieg dieser benannten Rollen. Weitere vorhandene/ererbte Grants bleiben im Zielabgleich relevant. |
| P04 | EXECUTE an authenticated | Öffentlicher, weiterhin intern autorisierter Pilot-Einstieg. |

Der native Quellvergleich bestätigt den ursprünglichen Pilotkörper plus den eng benannten Timeout-/Nach-Lock-Block. Nach dem gegebenenfalls wartenden Grant-Lock werden eigene Trip-Zeile und Revision erneut geprüft und mit FOR SHARE NOWAIT gehalten; dann läuft der private frische Autoritätsguard. Erst danach folgt die Prüfung des Grant-Ablaufs und gegebenenfalls der Verbrauch. Dies gilt für reserve und recheck. Payload, Einmal-Grant-Semantik und Antwortfelder bleiben unverändert.

Der Pilot erzeugt **keine Grant-Tabelle**, keinen Trip-Kontext-Speicher-RPC und keinen Grant-Datensatz. Beim späteren Aufruf darf reserve die bestehende Grantzeile verbrauchen; recheck bestätigt nur die passende bereits verbrauchte eigene Grantzeile. Der Quell-Apply selbst führt diese Produktaufrufe nicht aus.

### 3.4 Abhängigkeiten und Transaktionsentscheidung

Die Authority-Quelle referenziert die vorhandenen globalen Rollen-/AAL-Helfer, auth.uid/auth.jwt, auth.users, auth.sessions und public.profiles. Sie referenziert selbst keine Pilot-Granttabelle. Daraus folgt **keine geprüfte unabhängige Live-Deploybarkeit**: bestehende Caller, Default-ACLs, Zielrechte, Exposition und das Verhalten eines möglicherweise vorhandenen alten Piloten müssen zuerst bekannt sein.

Die Pilot-Quelle benötigt zusätzlich public.trips, private.official_truth_application_pilot_grants, die korrigierte Capability und den neuen internen Guard. Die native Fixture installiert hierfür die komplette ursprüngliche Stage2-Quelle. Das ist eine lokale Fixture-Voraussetzung, keine Anweisung, Stage2 unverändert auf Dev einzuspielen.

| Tatsächlicher Zielbefund | Konsequenz für das spätere wirksame Paket |
| --- | --- |
| Stage2-Objekte tatsächlich abwesend | Pilot-Kandidat allein ist unvollständig. Notwendiger Schema-/Trip-Kontext-/Pilotumfang muss ausdrücklich zusammengestellt werden; keine automatische Installation des alten Stage2-Artefakts. |
| Stage2-Objekte vorhanden und eindeutig passend | Tatsächliche Definitionen, Rechte, Daten-/Grantzustand und Abhängigkeiten vor Ersetzung abgleichen. Vorhandene Grants dürfen weder neu erzeugt noch zurückgesetzt werden. |
| Objekte vorhanden, abweichend oder nicht eindeutig zuordenbar | STOP für Ziel-Reconciliation; keine blinde Ersetzung oder Rechteausweitung. |
| Authority bereits committed, Pilot nicht angewandt/fehlgeschlagen/unklar | Separater Zwischenzustand; keine vollständige P1-Behebung oder Produktfreigabe. Weiterer Entscheid nach bestätigtem Iststand und Recovery-Plan. |

Die zwei unveränderten Kandidatdateien sind **kein gemeinsames atomisches Installationspaket**. Ein äußeres BEGIN hebt ihre inneren COMMITs nicht auf. Nach vollständiger Zielklärung muss Root entweder ein zusammenhängendes atomisches Zielartefakt oder einen ausdrücklich abgesicherten Mehrphasenplan prüfen. Diese Entscheidung und deren exakte Installations-/Recovery-Bytes sind noch offen. Die vorhandenen Quellen werden auch in V2 nicht verändert.

## 4. Anerkannte Evidence und verbleibende Freigabebedingungen

Die maschinenlesbare [TARGET_EVIDENCE_MATRIX.json](TARGET_EVIDENCE_MATRIX.json) trennt historische, menschlich attestierte, snapshot-belegte, fehlende und noch nicht ausgeführte Punkte. Der [Stage1-Bericht](STAGE1_ACCEPTANCE_REPORT.md) führt #917 separat fort.

**Drei Entscheidungsphasen bleiben getrennt:** Für ein freigabereifes PO-Paket müssen Zielbaseline, endgültige Änderungsartefakte, prüfbarer Nachprüfungsplan, konkrete QA-Bindung, Recovery und unabhängiges Review vollständig sein. Danach folgt die besondere PO-Entscheidung vor der wirksamen Änderung. Tatsächliche Installation, signierte Post-Apply-Prüfungen und deren Ergebnisse gehören erst zur anschließenden effektiven Abnahme beziehungsweise #1139-Schließung. Dass diese künftigen Prüfungen heute nicht ausgeführt sind, ist erwartbar und kein zusätzliches Vorbereitungsgate. Ein fehlender konkreter Prüf-/Recovery-Plan oder ungeklärte Zielvoraussetzungen bleiben dagegen echte Vorbereitungsblocker.

Anerkannt bleiben:

- der erfolgreiche Run2 mit vollständigem integritätsgeprüftem 16-Sektionen-Export;
- Capability-Body/Konfiguration, Signatur und ausgegebene ACLs passend zur ursprünglichen Stage1-Quelle;
- drei bereits zugeordnete Helfer- und zwei Profile-Trigger-Body-/Konfigurationstupel samt ausgegebener Bindungen;
- zusätzlich der positive rollenrang-Quelltupelvergleich: SHA-256 0b4f93560983e564b678d36d6b0e4bf37198a480e681b777d17ac7e24a52e041 aus Gitblob 41c9455bbc88a7b5165d4c929b8f86182cda8fd0 stimmt mit public/OID 72351 überein; separat passen (text) → integer, SQL, IMMUTABLE, PARALLEL SAFE, INVOKER und search_path=pg_catalog. Der redigierte Name und die tatsächliche Aufrufauflösung bleiben unbewiesen;
- vorhandene profiles-Spalten-/RLS-/FK-Metadaten im erfassten Umfang;
- R4s historische 13 Auth-Spalten und seine tatsächliche Dev-Session-CI-Evidence;
- zusätzlich die **aktuelle bestehende Main-CI 42513853717** auf genau 60841444: Root hat im Original-Core-Log 128832463566 den Source-Guard ok 1567 und den nativen Parent ok 1568 mit allen 27 erfolgreichen, nicht übersprungenen Fällen geprüft (22791.237512 ms); dies wurde für diese Dokumentation nicht neu gestartet;
- zusätzlich das **aktuelle bestehende Auth-Original 128832463670** vom 08.11.2026, 19:13:09 UTC: 55 erwartete Werte/243 Schlüssel, sämtliche Sollwerte stimmen. Root bestätigt die vier Policywerte 0 / 0 / false / false anhand der an main gepinnten Mapping-/Prüfquellen. Die Felder bleiben damit konkret belegt und werden nicht pauschal UNKNOWN.

Die [bestehende aktuelle CI](https://github.com/Jetnity/jetnity/actions/runs/42513853717) ist erfolgreich und enthält diese konkreten Nachweise; der Original-Log-Abgleich und die vier Policy-Source-Pins werden in [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json) festgehalten. Policyquellen: auth-erwartung.ts / Gitblob 0dfd71702f0d1226cd35cdac449b3260c961e31a, auth-bericht.ts / Gitblob 272db17b128c5f1f84b550fbfad9b4a0edadf9ff, scripts/auth/pruefen.ts / Gitblob c8fd418105c211a8827361300c92e13c8535bb8b und supabase/config.toml / Gitblob 43950d4d90e9ddb38487631aa83d2140bed5c04c. Der Autor hat diese vier Quellen ebenfalls an main gelesen. Der CI-Snapshot ist keine Production-Policy und ersetzt keine Prüfung konkreter zwischenzeitlicher Abweichungen vor einem späteren Apply.

Der zusätzliche lokale Vergleich der beiden ursprünglichen Stage2-Funktionsquellen findet keine exakten Body-/Konfigurationstupel im Run2-Fingerprintbestand. Gleichzeitig enthält dieser Bestand sieben public-Routinen mit Signatur jsonb → jsonb und redigierten Namen. Daraus folgt **keine Abwesenheit** der benannten Stage2-Funktionen oder Granttabelle: andere Definitionen können andere Fingerprints besitzen. Die genaue Formel, Quellpins, Hashes und OIDs stehen in [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json), die Abnahmegrenze im [Stage1-Bericht](STAGE1_ACCEPTANCE_REPORT.md). Der Vergleich verwendet ausschließlich die bereits gelieferten Dateien.

Echte **Vor-PO-Blocker** bleiben konkrete Zielbindung und Stage1-Ledger, eindeutiger Stage2-/Namespacebestand, nicht erfasste Auth-Owner-/Rechte-/FK-/Lifecycle-/Expositionsbedingungen, endgültige Migration/Transaktion, konkrete zulässige QA-Bindung und tatsächlich gesicherte Recovery-Basis. Die beiden Kandidaten schaffen diese fehlenden Voraussetzungen nicht durch ihr bloßes Vorhandensein.

Sasa hat am 8. November bestätigt, dass **keine weiteren alten Belege des ursprünglichen Stage1-Laufs** nachgeliefert werden können. Diese historische Lücke ist im [STAGE1-HISTORICAL-GAP-V1 / 6726914934](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6726914934) festgehalten. Sie ist von den noch vorhandenen Run2-Dateien und ihrer anerkannten menschlichen Attestation getrennt. Es wird weder ein alter Nachweis nachgestellt noch verlangt, den ursprünglichen Lauf zu wiederholen.

Für die ursprüngliche verweigerte Nachprüfung liegt weiterhin kein verifizierter regulärer Clearance-Weg vor. V2 enthält keine umformulierte Abfrage und keinen anderen Operator-/Tool-/Verbindungsweg. Auswertung bereits gelieferter zulässiger Evidence bleibt möglich; die Vorbereitung ersetzt keine Plattformfreigabe. [Aktueller Continuity-Receipt](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6726660349)

## 5. Review, Nachprüfung und Wiederherstellung

[POSTCHECK_AND_RECOVERY.md](POSTCHECK_AND_RECOVERY.md) enthält messbare Prüfbedingungen, die 27 bereits nativ abgenommenen Fälle als historische Basis, die noch offenen Zielprüfungen und die Entscheidung für jeden Commit-Zustand. Ein späteres Zurücksetzen des Codes auf die ursprüngliche Capability wäre keine sichere P1-Behebung. Ein Transaktionsabbruch kann nur Änderungen einer noch offenen Transaktion verwerfen; nach Commit ist eine konkret geprüfte Gegenänderung oder Wiederherstellung erforderlich.

Der historische Hinweis auf ein physisches Backup vom 14. Oktober ist kein geprüfter aktueller Restore-Punkt für diese ersetzenden Auth-/Funktionsänderungen. Recovery-ID, Umfang, Verlustfenster, Erreichbarkeit und Wiederherstellungsprobe sind auch in V2 nicht bestätigt.

V1/R1 wurde auf seinen damaligen sieben Dateien begrenzt unabhängig geprüft; die neue V2-Produktplanung übernimmt diesen PASS nicht. Root und beide unabhängigen Reviewer prüfen die finalen Dokumentbytes, Source-Pins, Rechteaussagen, Evidence-Grenzen und Recovery-Zustände. Der Autor setzt keinen TL-PASS. Ein endgültiger Review-/Veröffentlichungspin wird durch Root in REVIEW.md und den Live-Issues ergänzt. Änderungen an Paket oder Zielstand brauchen eine neue ausdrücklich gebundene Entscheidung.

## 6. Verständliche Erklärung und heutiger menschlicher Anteil

**Was würde jetzt mit #1139 geändert?** Die geschützte menschliche Owner-Autorität erhält zusätzlich zur Rolle und zweiten Anmeldestufe eine Prüfung des aktuellen eigenen Kontos und der eigenen gültigen Sitzung. Der Pilot prüft diese Berechtigung nach einer Wartephase nochmals, unmittelbar vor der geschützten Arbeit. Das ist die sichere Grundlage für Methodengovernance und Administration, kein dauerhaft manuelles Regelannahmemodell.

**Was muss für das Produkt zusätzlich angepasst werden?** Vorhandene Registry und autonome Proof-Verträge werden wiederverwendet. Der heutige ruhende Accepted Store verlangt in TypeScript und SQL genau eine Stütze und echte Nutzer-Reserve/Finalize; der Reader bedient einen engen CH→DE-Tripfall. Mindestens zwei Quellen, Maschinenautorität, öffentliche vorberechnete Ausgabe, Mehrfachstaatsangehörigkeiten und dauerhafte Hintergrundjobs benötigen deshalb ausdrücklich versionierte Erweiterungen. [PRODUCT_TARGET_PLAN.md](PRODUCT_TARGET_PLAN.md) beschreibt Änderungen und spätere Abnahme; ein funktionsfähiger öffentlicher Cache wird heute nicht behauptet.

**Warum?** Eine ältere noch nicht abgelaufene Anmeldung soll eine inzwischen gesperrte oder ungültige Berechtigung nicht weiterverwenden können. Die heutige bestätigte Stage1-Fassung enthält diese zusätzliche Prüfung nicht.

**Wie wurde geprüft?** Die exakten Kandidaten wurden in echten lokalen PostgreSQL-Fixtures mit 27 adversarial-/Konkurrenzfällen abgenommen; die bestehende heutige Main-CI führt alle 27 erneut erfolgreich aus. V2 verwendet diese bereits entstandene Evidence, prüft die unveränderte Quellidentität und gleicht vorhandene Zielnachweise ab. Für die Dokumentenprüfung von V1 und V2 hat der Autor keinen neuen Native-/Hosted-Test gestartet. Eine spätere reguläre automatische Docs-PR-CI wird von Root separat an den tatsächlichen neuen Head und ihre Ergebnisse gebunden; diese Ergebnisse werden hier nicht vorweggenommen. Reale Dev-Installation, signierte Post-Apply-Prüfungen und Ziel-Recovery sind damit noch nicht durchgeführt; ihre Ergebnisse wären nach einer späteren konkreten Freigabe zu liefern.

**Wie würde rückgängig gemacht?** Vor einem bestätigten Commit über den korrekt bestätigten Transaktionsabbruch. Nach Commit nur über den zum echten Zustand passenden vorher geprüften Recovery-Plan; kein Versprechen eines einfachen universellen Rückgängig-Knopfs. Der alte bekannte P1-Zustand wird nicht als sichere aktivierte Rückfallversion behandelt.

**Was muss Sasa jetzt tun?** Für diese Dokumentlieferung nichts in Supabase ausführen und keine alten Belege weiter suchen. Run2 ist anerkannt. Die spätere besondere Freigabe wird erst für das vollständig gebundene Paket mit exakten Änderungen und Recovery verlangt. Dieses V2 ist für die wirksame Dev-Änderung noch nicht entscheidungsreif. Eine ausführbare menschliche Schrittfolge wird erst an einen tatsächlich zulässigen, vollständig geprüften und freigegebenen Schritt gebunden; diese Dokumente sind keine solche Anleitung.

## 7. Abschlussgrenze

**Dokumente:** zur unabhängigen Root-/Reviewer-Prüfung geliefert.  
**Wirksame Dev-Änderung:** NOT_RELEASE_READY / NOT_EXECUTED.  
**Stage1:** APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING mit anerkannten Teilnachweisen.  
**#1139:** OPEN / P1 EFFECTIVE FIX NOT ACCEPTED.  
**Stage2:** NOT_ATTEMPTED im dokumentierten Ablauf; heutige Abwesenheit nicht bewiesen.  
**Accepted Store:** SQL_UNAPPLIED / FEATURE_NOT_LIVE.  
**Produktziel:** verbindlich / Umsetzung und Aktivierung dieser Erweiterungen nicht erfolgt.

Nächster notwendiger fachlicher Schritt: vorhandene zulässige Evidence den konkret offenen Matrixpunkten zuordnen; den verweigerten Umfang nur nach belegter zulässiger Klärung fortsetzen. Danach das tatsächliche Dev-Transaktions-/Migrations-/Recovery-Artefakt an den festgestellten Zielzustand binden und unabhängig prüfen. Die besondere PO-Entscheidung folgt erst dann. Kein automatischer Folgeslice durch den Autor.
