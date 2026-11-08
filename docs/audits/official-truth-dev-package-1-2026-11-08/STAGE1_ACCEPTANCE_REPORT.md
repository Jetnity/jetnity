# Stage1-Abnahmebericht — STAGE1-ACCEPTANCE-1 V3

**Datum:** 8. November 2026, Europe/Zurich.  
**Parent:** [#917](https://github.com/Jetnity/jetnity/issues/917), verbunden mit [#1139](https://github.com/Jetnity/jetnity/issues/1139).  
**Ausgewertete Code-Quellbasis:** `608414441651b407cf56ab976c1cd116db45de0c`, Tree `b7d6f19bddb035f9b445904f7e0582658047a6b6`; die Produkt-/SQL-Quellen sind auf der V3-Revisionsbasis unverändert.  
**Dokumentrevision V3:** Basis main `1b96936f0159578c063992407c650a0995b60895`, Tree `b6f46ef0e4efc06e6fa772c4d364d12c3a6317e6` nach #1160.  
**Aktueller Auftrag:** [DEV-PACKAGE-1 V3](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6727812983); V1/V2 bleiben historische Auftragstexte.  
**Verfasser:** ChatGPT / Technical Lead, Root. Unabhängige finale Dokumentenreviews und Artefakthashes stehen in [REVIEW.md](REVIEW.md) und [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json).

## 1. Entscheidung und Umfang

Dieser Bericht ist die konkrete Auswertung der **vorliegenden** Stage1-Evidence. Er ist kein ausgeführter Readback, keine neue Plattformfreigabe und kein Installationsauftrag.

- **Run2:** HUMAN_EXECUTION_SUCCESS / ARTIFACT_INTEGRITY_VERIFIED / SCOPED_METADATA_EVIDENCE_ACCEPTED.
- **Stage1:** APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, mit ausdrücklich anerkannten Funktions-, Body-/Konfigurations- und ACL-Teilnachweisen.
- **Tatsächliche Stage1-Ledger-ID und vollständiger Historienabgleich:** UNKNOWN / OPEN.
- **Stage2:** NOT_ATTEMPTED im dokumentierten Ausführungsablauf. Aktuelle Abwesenheit seiner Objekte ist durch Run2 nicht bewiesen.
- **#1139:** OPEN / P1 EFFECTIVE FIX NOT ACCEPTED. Der vorhandene #1142-Kandidat ist separat implementiert und nativ geprüft; seine tatsächliche Installation ist nicht abgenommen.
- **Gesamtes Einreisefeature / Accepted Store:** SQL_UNAPPLIED / FEATURE_NOT_LIVE. Diese Aussage über den Accepted Store wird nicht auf die bereits gemeldet erfolgreiche Stage1-Apply-Antwort übertragen.

**Dokumentationsabschluss und technische Gesamtabnahme sind getrennt.** Ein abgeschlossener Bericht kann ausdrücklich offene Abnahmekriterien enthalten. Ein aktueller zulässiger späterer Zielnachweis könnte aktuelle Kriterien erfüllen; er würde keine fehlende historische Originalquittung erzeugen.

## 2. Drei Zeitstände und die bestätigte historische Lücke

### 2.1 Ursprüngliche Vorbereitung und Apply am 14. Oktober 2026

Das [Entscheidungspaket 6163574059](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6163574059) und der [Preflight 6163936607](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6163936607) dokumentieren damals Dev/develop/`yfvbxvijcorffwxbxahl`, PostgreSQL 17.6, 78 Migrationshistorieneinträge mit damaligem letztem Wert 20261005000230, vorhandene notwendige Abhängigkeiten und Abwesenheit der drei vorgesehenen Funktionen sowie privaten Granttabelle. Das sind datierte Beobachtungen, keine aktuelle Inventur.

Die [Recovery-Quittung 6164171285](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6164171285) akzeptierte einen Work/UI-berichteten PHYSICAL-Backupstand vom **14. Oktober, 02:45:54 UTC** für die damaligen eng begrenzten additiven Artefakte. Kein originaler Dashboard-Capture, keine Backup-ID, kein Restoretest, Storage ausgeschlossen. Dies ist keine heutige oder datenverlustfreie Wiederherstellungsbasis für die ersetzenden #1139-Änderungen.

Die [Apply-/Refusal-Quittung 6164202501](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6164202501) dokumentiert genau einen unterstützten `apply_migration`-Aufruf mit der unveränderten genehmigten Stage1-Datei. Die Antwort war `{"success":true}`. Eine tatsächliche Ledger-ID wurde darin nicht zurückgegeben. Die anschließende lesende Katalog-/Ledger-Nachprüfung wurde von der Plattform abgewiesen und lieferte **kein Ergebnis**. Das ist keine Supabase-Migrationsfehlermeldung, kein Beleg eines Rollbacks und keine neue Ablehnung in der jetzigen Runde. Stage2 wurde nicht aufgerufen.

### 2.2 Owner-Bestätigung: keine zusätzlichen damaligen Unterlagen

Sasa bestätigt am 8. November im laufenden Auftrag: **„Alte Belege vom damaligen Stage1-Lauf habe ich keine weiteren, bitte dokumentiere die Lücke so.“** Der [dauerhafte Owner-Receipt 6726914934](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6726914934) hält diese Aussage fest.

Die Suche nach weiteren damaligen Unterlagen beim Owner ist damit abgeschlossen. Es werden keine nicht vorhandenen alten Belege erneut verlangt oder durch nachgestellte Screenshots ersetzt. Die vorhandenen Repository-Receipts bleiben gültig in ihrem jeweils begrenzten Umfang. Die Aussage betrifft ursprüngliche Stage1-Altbelege; sie wird nicht als Aussage über die Verfügbarkeit heutiger Run2-Unterlagen ausgeweitet.

### 2.3 Eigenständiger menschlicher Run2 am 8. November 2026

Der [Owner-Bericht 6726410780](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6726410780) beschreibt die vollständige unveränderte R2-Ausführung im SQL Editor gegen Dev/develop/`yfvbxvijcorffwxbxahl`, einschließlich BEGIN READ ONLY und ROLLBACK, am **8. November 2026, 20:40:22 Europe/Zurich**. Keine Fehlermeldung, eine Ergebniszeile. Der [unabhängige TL-Review 6726637224](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6726637224) akzeptiert den gelieferten Export und die unten genannten Teilbefunde.

Die SQL-Ausgabe bestätigt READ ONLY während des SELECT. Die tatsächliche Projektzuordnung und der nachfolgende vollständige Rollback sind menschlich berichtet; die SELECT-Ausgabe allein attestiert diese beiden Punkte nicht unabhängig. Das ist die dokumentierte Beleggrenze, keine Zurückweisung des menschlichen Laufs.

## 3. Unveränderte Artefakte und Integrität

| Artefakt | Exakte Identität |
| --- | --- |
| Genehmigte Stage1-Quelle | `supabase/migrations/20261002154952_official_truth_owner_reviewer_capability_1.sql`; Gitblob `43a590682f1d3f569f418fb2572b8fb010de9291`; 1.210 UTF8-Bytes; SHA256 `635151c127efde6e2953cc14c68e81ecccf10dba545329fe46c09dcdf50996a2` |
| Verwendetes R2-Auditskript | 448 Zeilen /24.271 Bytes; SHA256 `a260b66efe49a54ff223b78298b995b5f9a9789cb9b04b9f821a25ae79479601` |
| [Original-CSV](https://github.com/user-attachments/files/34553906/Supabase.Snippet.Untitled.query.csv) | 1.725.273 Bytes; SHA256 `96d6fc7ac398fcb8a0e73719c06730e4637090a141c2dbcbfaa731d62a732471` |
| Unveränderter JSON-Zelltext | 1.505.775 UTF8-Bytes; SHA256 `4d0ff64abe2cf6d12d8ada7fd418fe1d9047fb6a5a7da52616bf290d685b551c` |

Root und ein unabhängiger Reviewer luden den Originalanhang separat; Bytes und Hashes stimmen überein. CSV: eine `audit_report`-Spalte, eine Datenzeile. JSON: 16 Sektionen, 8.532 Metadateneinträge, alle `row_count`-Werte passend; 3.156 effektive Rechtekombinationen, 42 Rollenkombinationen und 987 Fingerprints vollständig. Keine doppelten JSON-Schlüssel. Wiederholte rohe Dependency-Tupel sind für diese pg_depend-Ausgabe möglich und wurden nicht als Dateifehler umgedeutet.

Envelope: `server_version_num=170006`, `transaction_read_only=true`, `report_status=metadata_only`, UTF8/UTF8. Zeitwert 1794166822.51567 entspricht **19:40:22.515670 UTC**. `migration_ledger` und `auth_user_session_rows` sind ausdrücklich `out_of_scope`; `actual_project_identity=not_attested_by_sql`, `database_security_verdict=not_assessed`. Die ergänzenden TL-Quellvergleiche präzisieren den Bericht, ohne diese Ausgabe in eine vollständige Laufzeitabnahme umzudeuten.

## 4. Anerkannte Stage1-Funktions- und Rechtebefunde

Im gelieferten Snapshot existiert **public.darf_official_truth_freigeben /OID 74181**:

- normale SQL-Funktion, keine Argumente, boolean, kein Set;
- STABLE, PARALLEL SAFE, SECURITY INVOKER;
- Owner postgres/OID 16388;
- eine Konfiguration, genau `search_path=pg_catalog`;
- explizite EXECUTE-Einträge für postgres/authenticated/service_role, kein PUBLIC-Eintrag;
- effektives EXECUTE für anon und authenticator false; für authenticated/service_role/postgres/supabase_admin true.

Der dokumentierte Routinefingerprint ist SHA256 über die UTF8-PostgreSQL-JSONB-Textdarstellung des geordneten Tupels `[prosrc, probin, prosqlbody::text, proargdefaults::text, proconfig, proargnames]`. Root und beide unabhängigen Reviewer rekonstruierten das erwartete Tupel aus der genehmigten unveränderten Stage1-Quelle. Erwartet und beobachtet:

`0895939fc771ac383246af55fe81b6e797a6de301f39d80117d421cd3936a221`.

Das belegt die ausgewählten Body-/Konfigurationsfelder; Signatur/Flags/Rechte sind separat ausgegebene Metadaten. Es ist kein Hash über sämtliche pg_proc-Felder oder pg_get_functiondef und kein Migrationshistorien- oder tatsächlicher Owner-JWT-Nachweis.

Zusätzliche akzeptierte Quellzuordnungen:

| Beobachtetes Objekt | Vergleich / Grenze |
| --- | --- |
| aktuelle_rolle/OID 72352 | Body-/Konfigurationstupel entspricht der erwarteten Profilrollen-Quelle. |
| hat_rolle_mindestens/OID 72353 | Entspricht der erwarteten Rollenrang-Quelle. |
| aktuelles_admin_aal2/OID 73031 | Entspricht der erwarteten AAL-Claim-Quelle. |
| profiles-Trigger 72440 → Routine 72416 | Eindeutiger Fingerprint passt zur Rollen-/Statusschutzquelle; tatsächliche Bindung vorhanden, enabled O, ohne WHEN. |
| profiles-Trigger 71919 → Routine 71396 | Eindeutiger Fingerprint passt zur Profil-Kerndatenquelle; tatsächliche Bindung vorhanden, enabled O, ohne WHEN. |

Die zwei Triggerroutinennamen sind im Export redigiert; belegt sind ausgewählte Definitionstupel und OID-Bindungen. Vollständige Hashes/Sourceblobs stehen im [Run2-TL-Review](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6726637224). Es erfolgte kein Auslösen eines Triggers und kein eigener Session-/Kontotest. Rollenrang-/Auth-Helper-Auflösung und tatsächliche JWT-Wirkung werden durch diese sechs Vergleiche nicht vollständig attestiert.

**Zusätzlicher Offline-Vergleich in diesem Paket:** Das ausgewählte Definitionstupel der Repository-Funktion `rollenrang(text)` aus Gitblob `41c9455bbc88a7b5165d4c929b8f86182cda8fd0` ergibt SHA256 `0b4f93560983e564b678d36d6b0e4bf37198a480e681b777d17ac7e24a52e041`. Genau dieser Fingerprint ist im unveränderten Run2-Export bei `public`/OID `72351` vorhanden; die getrennten Metadaten zeigen `(text) → integer`, SQL, IMMUTABLE, PARALLEL SAFE, INVOKER und `search_path=pg_catalog`. Der Name ist redigiert und gehört nicht zum Fingerprinttupel. Dies ist ein weiterer positiver Body-/Konfigurationsbeleg, aber noch kein unabhängiger Nachweis der tatsächlichen Namens-/Aufrufauflösung. Keine zusätzliche Datenbankabfrage wurde ausgeführt.

Die zwei ursprünglichen Stage2-RPC-Quelltupel ergeben keinen identischen Fingerprint im gelieferten Export. Gleichzeitig enthält dieser sieben öffentliche Routinen mit der passenden Signatur `(jsonb) → jsonb`, deren Namen redigiert sind. Eine abweichende Definition würde einen anderen Hash erzeugen. Aus den fehlenden exakten Hashmatches wird deshalb **keine aktuelle Abwesenheit** der Stage2-RPCs abgeleitet. Formel, Quellpins und begrenzte Ergebnisse stehen in [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json).

## 5. Abnahmematrix

| ID | Prüfpunkt / Abgrenzung | Evidence / Entscheidung |
| --- | --- | --- |
| S1-01 | Genehmigte unveränderte Stage1-Quelle | **BELEGT:** aktueller Gitblob und Dateihash entsprechen der damaligen Quelle. Keine Ledger-ID daraus abgeleitet. |
| S1-02 | Erfolgreiche erste Apply-Antwort | **HISTORISCH BELEGT:** Receipt 6164202501 berichtet success:true. Fehlende Original-Zusatzbelege dokumentiert, kein Wiederholungsauftrag. |
| S1-03 | Funktion/Signatur/Sicherheitsmodus/Konfiguration | **TEILNACHWEIS AKZEPTIERT:** Run2-Objekt 74181 und getrennte Metadaten. |
| S1-04 | Erwartetes Definitionstupel | **TEILNACHWEIS AKZEPTIERT:** exakter Fingerprintvergleich mit genehmigter Quelle, ergänzt um bekannte Helper. |
| S1-05 | Ausgegebene explizite/effective ACLs | **TEILNACHWEIS AKZEPTIERT:** Rollen-/Rechtematrix im Zeitpunkt des gelieferten Snapshots. Keine pauschale zukünftige Default-/Inherited-ACL- oder andere Caller-Freigabe. |
| S1-06 | Tatsächliche neue Ledger-ID, Einträge und Historienvergleich | **OPEN:** im R2-Export ausdrücklich außerhalb des Scopes. Weder Source-Zeitstempel noch angenommene Zahl 79 ist eine beobachtete Historie. |
| S1-07 | Fortbestehende Stage2-Abwesenheit | **OPEN:** Namen der zwei Pilot-RPCs und privaten Granttabelle nicht allowlisted. Redigiertes known_name=null bedeutet nicht abwesend. |
| S1-08 | Unveränderte übrige Source-Catalog-/Consumer-Verträge | **OPEN in diesem Gesamtumfang:** kein allgemeiner Drift-PASS aus einzelnen Tupelmatches oder ohne gleichartige Vergleichsbasis. |
| S1-09 | Unabhängige aktuelle Zielbindung | **TEILWEISE:** Dev/develop-Zuordnung von Sasa berichtet; R2-SQL selbst attestiert kein Projekt. Historische Branch-Inventur ist datiert. |
| S1-10 | Run2-Transaktionsnachweis | **TEILWEISE:** READ ONLY während SELECT belegt; vollständiger Ablauf/abschließender Rollback menschlich berichtet, keine unabhängige Abschlussquittung in der CSV. |
| S1-11 | Originale historische Nachprüfungs-/Recovery-Evidence | **LIMITATION DOKUMENTIERT:** vorhandene Receipts gelten begrenzt; keine weiteren alten Stage1-Belege beim Owner vorhanden; kein heutiger Restore-Nachweis daraus. |
| S1-12 | Abgrenzung zum späteren #1139-Owner-/Session-Nachweis | **KEIN ZUSÄTZLICHES STAGE1-GATE:** Der ursprüngliche Stage1-Auftrag verlangte keinen echten Owner-JWT-Lauf. Run2 als postgres/BYPASSRLS erfüllt auch nicht den separaten späteren #1139-Ziel-/Laufzeitnachweis. |

Historische Vergleichshashes werden nur unter ihrer damaligen Definition verwendet. Der ältere Ledger-Metadatenwert 678ac48f… und die spätere vollständige Ledger-Serialisierung 209e98f… haben unterschiedliche Formeln; ihre Verschiedenheit beweist keine Drift. Ein unbekannter alter Rohbestand wird nicht aus einem Hash rekonstruiert.

## 6. Relevante RLS-/Private-Beobachtungen

Run2 meldet RLS für alle 41 Tabellen: 21 public ohne FORCE,20 private mit FORCE. Für anon/authenticated/authenticator/service_role sind im erfassten private-Schema USAGE/CREATE und direkte Tabellen-/Sequenz-/Spaltenrechte false. Profiles 71476 besitzt RLS, user_id UUID/NOT NULL, role/status Text/NOT NULL sowie Constraint-/Policy-/Triggermetadaten. Der validierte user_id-FK mit ON DELETE CASCADE verweist auf eine externe numerische Relation; deren Name und vollständiger Auth-Lifecycle sind nicht attestiert.

Diese positiven Metadaten werden erhalten. RLS-Flags allein beweisen keine konkrete Zeilensichtbarkeit, indirekte Definer-Aufrufe oder Data-API-Exposition. Es entsteht kein pauschaler Datenbank-Sicherheits-PASS.

## 7. Konsequenz für #1139 und Wiederherstellung

Der beobachtete Capability-Body entspricht weiter dem ursprünglichen Owner-Rang+AAL2-Vertrag. Die zusätzliche eigene aktive Konto-/Sessionprüfung aus dem vorhandenen #1142-Kandidaten ist dadurch nicht als wirksame Ersetzung belegt. #1142 ist bereits umgesetzt; seine tatsächliche Zielbindung ist Gegenstand von [DEV_PACKAGE.md](DEV_PACKAGE.md) und [TARGET_EVIDENCE_MATRIX.json](TARGET_EVIDENCE_MATRIX.json).

Die historische Owner-Freigabe für die unveränderten damaligen additiven Artefakte bleibt gültig in ihrem Scope. Sie genehmigt keine neue ersetzende Auth-/DB-Korrektur. Diese benötigt das bestehende besondere PO-Gate nach tatsächlicher Zielbindung und unabhängigem Review. Die fehlende aktuelle Recovery-Basis darf weder durch den alten Backupbericht noch durch ein blindes Wiederherstellen des bekannten P1-Vertrags ersetzt werden; genaue Fälle in [POSTCHECK_AND_RECOVERY.md](POSTCHECK_AND_RECOVERY.md).

## 8. Nächster noch offener Schritt und Owner-Anteil

Für den betroffenen Live-Teil ist weiterhin kein verifizierter regulärer Freigabeweg für die ursprüngliche #917-Nachprüfung dokumentiert. Bereits zulässig vorliegende Evidence darf weiter ausgewertet werden. Eine tatsächliche Auflösung dieser Grenze oder ausreichende rechtmäßig vorliegende Restnachweise müssen belegt sein, bevor fehlende aktuelle Ledger-/Objekt-/Zielbedingungen abgenommen werden. Dieser Bericht enthält keine Ersatzabfrage, keinen delegierten Retry und keinen alternativen Operatorweg.

Sasa muss für diesen Bericht keine alten nicht vorhandenen Belege beschaffen und keinen SQL-Lauf ausführen. Die Paketvorbereitung ist ausdrücklich beauftragt. Eine neue allgemeine Zustimmung wird nicht verlangt. Eine spätere konkrete PO-Entscheidung ist erst sinnvoll, wenn das vollständige zielgebundene wirksame Paket mit Nachprüfung und Recovery abnahmefähig vorliegt.

**Gesamturteil:** Anerkannte Teilnachweise bleiben bestehen. Stage1-Gesamtabnahme bleibt offen. #917 ist zusätzlich ein übergeordneter Feature-Auftrag und würde durch Stage1 allein nicht abgeschlossen. #1139 bleibt P1/OPEN; Stage2 NOT_ATTEMPTED; #1131 und besondere Quellen-/Ziel-/Production-Gates bleiben separat. In dieser Berichtsrunde wurden nur Repository-/bereitgestellte Artefakte und öffentliche Primärquellen ausgewertet, keine Datenbank abgefragt oder verändert.

## 9. Verbindliche Produktfortschreibung und Quellenkorrektur V3

Während der Paketprüfung hat Sasa die sechs Produktvorgaben verbindlich präzisiert. Die in [TASK V2](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6727237878) zunächst verlangte Zwei-Quellen-Pflicht wurde nach Integration von #1160 ausdrücklich durch [TASK V3](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6727812983) ersetzt. V2 bleibt historische Evidence seines damaligen Auftrags; ihre frühere Mindestzahl ist keine aktive Abnahmebedingung mehr.

**Jetzt verbindlich:** Eine eindeutige amtliche Primärquelle des Ziellandes ist Pflicht. Eine unabhängige amtliche Quelle wird zur Gegenprüfung herangezogen, wenn verfügbar. Fehlt die zweite Quelle, bleibt automatische Veröffentlichung bei klarer qualifizierter Pflichtquelle zulässig. Nur ein echter relevanter Quellenwiderspruch oder eine unklare erforderliche Primärquelle blockiert den fachlichen Quellenentscheid und eskaliert an Sasa. Unterschiedliche Kontexte/Gültigkeitsbezüge sind nicht automatisch ein Widerspruch; eine fehlende oder unerreichbare optionale Gegenquelle macht die Primärquelle nicht automatisch unklar. Bekannte relevante Konflikte werden durch späteres Fehlen einer Gegenquelle nicht gelöscht.

[PRODUCT_TARGET_PLAN.md](PRODUCT_TARGET_PLAN.md) ordnet diese aktuelle Regel den vorhandenen Bausteinen zu. Der bestehende genau-eins-Vertrag im Accepted Store passt zur neuen Primärbeleg-Mindestzahl; daraus folgt keine zwingende Mehrstützenmigration. Er beweist jedoch keine tatsächliche Ziellandzuständigkeit oder fertige Methodenqualifikation. Die optionale Gegenprüfung benötigt eine nachvollziehbare versionierte Bindung an Fakt, Pflichtbeleg, Methode und Annahme-/Rückzugsentscheidung. Die konkreten zusätzlichen Speicher-/Proof-/Lifecycle-Änderungen sind später zu prüfen; eine bereits implementierte Gegenprüfung oder automatische Wiederannahme wird nicht behauptet.

Die übrigen Produktvorgaben bleiben bestehen: **keine routinemäßige Owner-Einzelfreigabe pro Regel**, strukturierte Fakten, automatische Pflege und Prüfspur, anbieterunabhängige Research-Vorschläge, ausschließlich Jetnity-eigener prüfender Import und öffentliche Antwort aus akzeptiertem Cache. Die seit dem 2. Oktober verbindliche Autonomieausrichtung bleibt anerkannt. Menschliche Methodengovernance und der geplante enge Maschinenvertrag sind getrennt; #1139 schützt weiterhin den bestehenden eigenen Owner-/Session-Vertrag. Menschliche Claims werden nicht zur Maschinenidentität umgedeutet.

Die Korrektur verändert keinen der beobachteten Stage1-Befunde. Sie liefert weder eine tatsächliche Ledger-ID noch eine installierte #1139-Korrektur, Plattformclearance oder geeignete Recovery-Basis. Technische Integritäts-/Auth-/Privacy-/Import-Gates und die besondere spätere Dev-Änderungsentscheidung bleiben erhalten. Die V3-Dokumente erhalten eine neue unabhängige Prüfung; V2-Hashes und Head-Gates werden nicht übertragen. #917/#1139 bleiben zuerst, CH→DE der bereits entschiedene Erstpfad. Kein Produkt-Folgeslice und kein menschlicher SQL-Ersatzlauf wurde gestartet.
