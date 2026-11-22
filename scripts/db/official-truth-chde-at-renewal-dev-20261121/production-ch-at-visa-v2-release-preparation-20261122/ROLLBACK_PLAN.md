# CH→AT: Rücknahmevertrag für eine *später* gesondert autorisierte Production-Installation

**Stand nach einmaligem freigegebenem Production-Read 22.11.2026: BLOCKED / nicht installationsreif.** Die exakte 00-READONLY-SQL (SHA-256 `2bd2163109d408f8d06a104eee15a926bde9abfef3f14e82af833a6f32aba5ec`) scheiterte in Production an SQLSTATE `42P01` (`official_v3_at_private.whole_originals_v2` existiert dort nicht). Einzig Lesezugriff, **kein DDL/DML**, kein Installationsversuch und keine Wiederholung. Da der eigentliche SELECT fehlgeschlagen ist, liegen **keine vollständigen Production-Katalog-Readback-Daten** vor. Die neue schema-tolerante Datei `01-PRODUCTION-CATALOG-V2.READONLY.sql` wurde separat ausschliesslich gegen **Dev** überprüft und darf auf Production erst nach einem **neuen expliziten READ-ONLY-Go** ausgeführt werden.
Production bleibt unangetastet. Ein Dev-Owner/AAL2-Beleg darf nie als Production-Owner-Aktion wiederverwendet werden.

## A. Vor COMMIT

Vorbedingung ist der unabhängig autorisierte, zeitnahe, unveränderliche Production-PREFLIGHT-Nachweis mit Zielobjekt-/ACL-/RLS-/Funktionshashes, aktuellem BG1-Katalog und ursprünglichem v4-HTTP-ID-Allocator. Ein fehlender Beleg oder eine geänderte Basis stoppt die Installation. Es muss zunächst eine atomare Production-Probe mit **vollständigem ROLLBACK** gelingen, bevor ein separates COMMIT-Go erteilt werden kann. Keine externen HTTP-/Owner-/Cron-Aufrufe in der Probe. Neue Tabellen/feste Quellenedition müssen ausschließlich append-only und privat sein; alter Research-Originalbody und alte Ergebnisse bleiben erhalten. Keine neuen Rollen/Grants für den direkten DB-Zugang.

## B. Unklare COMMIT-Antwort

**Sofort stoppen; nicht blind wiederholen.** Erst eine separat freigegebene Readback-Abfrage (40-PRODUCTION-POSTCOMMIT.READONLY.sql) stellt die tatsächliche installierte Katalogidentität fest. Exakte, zeitlich noch gültige Funktions-/Tabellen-/ACL-/RLS-Digests vergleichen. Der HTTP-ID-Allocator bleibt unangetastet, keine `nextval/setval`.

## C. Nach COMMIT, bevor Owner handelt

Der Dev-Code ist keine direkt installierbare Production-Migration. Ein erst nach dem Production-PREFLIGHT erstelltes und vollständig gehashtes Schutz-/Rollback-SQL muss den **tatsächlich installierten** Nachfolger atomar auf Default-Closed zurückführen; ein Restore alter Funktionen darf nur mit nachgerechneter aktuellen und gesicherter vorheriger Definition, Rolle und ACL stattfinden. BG1 muss die Rücknahme vollständig kennen und einen neuen **natürlichen** Vollbeleg erbringen. Der Scheduler-/CH→DE-Cycle12-Block, Dispatches38–46, alte Owner-Quittungen und der Production-v4-HTTP-ID-Allocator werden nicht gelöscht oder umnummeriert.

## D. Nach echtem Production Owner/AAL2 oder amtlichem Quellenlauf

Bereits erzeugte echte Quellenbelege, Quellenjournal, Besitzer-Quittungen, Faktenversionen und IDs sind **unveränderliche Historie**. Deshalb keine Löschung oder rückwirkende Fälschung; stattdessen zusätzliches Sperr-/Widerrufsereignis und Customer-Ausgabe fail-closed bis zu einer eigenen geprüften Korrektur. Ein Owner-Methodenwiderruf ist eine echte separate Owner/AAL2-Aktion. Automatische Quellenüberwachung darf frühere Prüfungen nicht überschreiben; ein späterer negativer Status sperrt die Kundenanzeige.

## E. Exakte Grenzen

Es werden nur CH Staatsangehörigkeit, gültiger gewöhnlicher Schweizer Reisepass, AT direkte Einreise, Visumfreiheit qualifiziert. IN/DE/US/TR/CN und alle übrigen ungeprüften Pässe/anderen Themen bleiben «derzeit nicht verfügbar». Eine fachlich als regelneutral bestätigte geänderte BMEIA-Version bleibt technisch **`changed`**, niemals künstlich `unchanged`.

**Aktuell existiert noch kein unzweideutig auf den heute tatsächlich installierten Production-Katalog gebundener Installations-/Rücknahmecode. Dieser Vertrag allein ist keine ausführbare Rücknahme.**
