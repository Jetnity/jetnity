# Places Catalog Refresh 3 — externer Importstarter; Ausführung gestoppt

Stand: 15. November 2026. Autor: **Jetnity places catalog refresh 3**. Auftrag: [TASK](PLACES_CATALOG_REFRESH_3_TASK_2026-11-15.md).

**Spätere Admin-Fortsetzung nach Merge #1197:** Der aktuelle gemeinsame Freigabestand steht im [Admin-Handoff](ADMIN_REFRESH_AFTER_1197_HANDOFF_2026-11-15.md). Die folgenden Paket-HOLDs beschreiben die vorherige Runde. Das Import-Ausführungsverbot bleibt bestehen; der externe Runner wurde auch in der Admin-Aktualisierung nicht gestartet. Der alte Katalog-CI bestätigte inzwischen sämtliche 13 Fälle einschließlich echtem isoliertem PostgreSQL; sein damaliger Auth-Fehler wird mit dem neuen Main im gemeinsamen Lauf erneut abgeglichen.

## Aktueller Fortsetzungsstand — Owner-Auftrag nach Admin 3

**Nur Code bereitstellen, danach STOPP. Der neue Starter wurde weder gegen Dev noch gegen Production ausgeführt.** In dieser Fortsetzung gab es keine Supabase-Abfrage, keinen Datenimport und keinen Login. Der folgende Vorbereitungsbericht ist historisch; seine Aussage „noch kein Dev-Import“ gilt nicht für den späteren, bereits unterbrochenen Datenlauf.

- Letzter **lokal gesicherter** Stand: **287 von 611 Blöcken bestätigt**, zusammen **140.582 bestätigte Eingabezeilen**. Das ist keine frische Hosted-Zählung und keine Behauptung zusätzlicher Inserts. **324 Blöcke bleiben**, einschließlich des ungeklärten nächsten Versuchs (Index 287, nullbasiert). Seine gespeicherte Absicht wurde in dieser Runde nicht ausgeführt oder als Commit gewertet.
- Vollständiger Sollbestand: **294.833 Orte** aus dem bereits geprüften festen Quellsatz. Daten, Batchdateien und Einzelreceipts bleiben außerhalb Git und Chat. Der neue Code liefert nur einen kompakten Abschluss auf stdout; keine Ortszeilen, SQL-Texte, Antwortkörper oder Zugangsdaten.
- Der vorhandene lokale Arbeitsbranch war noch nicht als PR veröffentlicht. Dieser bestehende Ortskatalog-Scope wird jetzt als eigener Draft-PR bereitgestellt; kein zusätzliches Produktpaket neben dem bereits beauftragten Ortskatalog.
- Übersetzungen [#1211](https://github.com/Jetnity/jetnity/pull/1211): **CI grün**, belegt durch [normalen Gesamtlauf](https://github.com/Jetnity/jetnity/actions/runs/43739148292). Head `f4363205b16991143c9111c33b059ca1619b786b`. Echte Konto-Abnahme wartet auf legitime Owner-Anmeldung/2FA; danach gespeichertes EN auf der Sicherheitsseite prüfen und DE wiederherstellen. Keine Passwörter/Faktoren/echten Abmeldungen verändern.
- CMS-/Kampagnen-Anbindung [#1206](https://github.com/Jetnity/jetnity/pull/1206), [#1209](https://github.com/Jetnity/jetnity/pull/1209), [#1210](https://github.com/Jetnity/jetnity/pull/1210): **unberührt und blockiert bis zur koordinierten #1197-Integration**. Ein Merge allein ist noch kein Nachweis der gemeinsamen BG1-/Typen-/Scanner-/Dev-Installation. #1202 bleibt ebenfalls hinter #1197.
- Die acht grünen Pakete **#1199 → #1200 → #1201 → #1203 → #1204 → #1205 → #1207 → #1208** bleiben unverändert. #1197/#1198 gehören anderen Chats. **Keine Merges, Production-, Kosten- oder Login-Aktionen.** Ziel bleibt jetnity.com bis **30.11.2026**.

### Externe Ausführung — erst in einer späteren Arbeitsrunde

Einstieg: [`scripts/places/catalog-external/run.mjs`](../scripts/places/catalog-external/run.mjs), Begleitvorlage [`acceptance.sql`](../scripts/places/catalog-external/acceptance.sql). Node **22 oder neuer**, keine neue Dependency. Das vorhandene vollständige Datenverzeichnis enthält `source/`, `places-combined.jsonl`, `source-manifest.json`, `batch-manifest.json`, `batches/`, `backup/`, `receipts/` und `current-attempt.json`. Der weiter unten dokumentierte gesicherte Rohsnapshot ersetzt nicht ungeprüft die neuesten Zwischenreceipts; das Arbeitsverzeichnis vollständig erhalten und dem externen Operator übergeben. Keine dieser Dateien in Git hochladen. Im kompakten historischen Validierungsbeleg wurde die einzelne rohe Ortsprobe für die PR-Veröffentlichung ausgelassen; ihr Originalbeleg ist extern erhalten, die Prüfung wurde nicht wiederholt.

Der Operator stellt **außerhalb des Chats** das bereits autorisierte `SUPABASE_ACCESS_TOKEN` und `SUPABASE_PROJECT_REF=yfvbxvijcorffwxbxahl` in seiner geschützten Terminal-Umgebung bereit. Keine Token in Befehlszeilen, PRs, Logs oder neue CI-Secrets kopieren. Es werden keine Credentials aus GitHub, Browser oder anderen Anwendungen extrahiert.

Ein normaler externer Lauf, nachdem die Ausführung wieder beauftragt wurde:

```sh
node scripts/places/catalog-external/run.mjs --daten-verzeichnis /absoluter/pfad/places-catalog-refresh-3-data --schreiben --entwicklung
```

Ohne die beiden Schreibflags prüft derselbe Starter nur lokale Dateien und stellt **keine Netzwerkverbindung** her. Auch diese Prüfung wurde hier nicht auf dem echten Datenpaket ausgeführt. Importieren des Moduls durch Tests startet den CLI nicht. Schreiben in CI, GitHub Actions und Vercel wird ausdrücklich abgelehnt; es gibt keine automatische Pipeline-/Deployment-Verknüpfung und keinen Production-Modus.

### Ablauf und harte Stopps

1. Fester Quell-/Manifest-/Backup-Abgleich und Prüfung **aller** Batches vor dem ersten API-Aufruf. Kein neuer Download, kein neuer Filter und keine veränderten Ortsidentitäten. Bestehender `scripts/places/importieren.ts` unverändert.
2. Live-Zielkontrolle über die Management API: exakter Ref, Projekt-Endpunkt 404, Branch-Endpunkt 200, Elternprojekt stimmt, Branch `develop`, **`is_default=false`**. Fremde Ziele/Redirects/unklare Antworten stoppen. Nur serverseitig bereitgestellte Terminal-Berechtigung; kein Service-Role-Key auslesen.
3. Vorprüfung der ursprünglichen 270 Places einschließlich Zeitstempel, aller 5.332 Airports, Spalten, Indizes, Grants, RLS, Policies, Constraints, Trigger, Eigentümer und ACL. Vorhandene Funktion `official_v3_guard_private.assert_catalog_v1()` ausschließlich aufrufen; **keine Baseline, Rechte oder Guard-Implementierung ändern**. Die vorhandene Kapazitätsgrenze bleibt verbindlich.
4. Ausschließlich sequentielle atomare `INSERT … ON CONFLICT(id) DO NOTHING`-Batches. Bestehende Daten müssen vollständig identisch sein. Keine Updates oder Löschungen. Jeder Schreibversuch wird vorher mit Dateisync und Verzeichnissync gespeichert; bestätigte Ergebnisse werden atomar quittiert. Ein exklusives lokales Lock verhindert zwei Starter im selben Datenverzeichnis.
5. Ein ungeklärter Versuch wird **zuerst nur rückgelesen**. Nur ein vollständiger identischer Bestand darf als bestätigt gelten. Fehlende/teilweise/abweichende Daten stoppen ohne automatischen Schreibretry; danach ist eine gezielte Betreiberklärung nötig. Kein manueller Sprung über offene Blöcke. Bereits bestätigte Receipts werden vor Fortsetzung durch tatsächliche Rücklesung an ihre fest gepinnten Eingaben gebunden; selbstkonsistente geänderte Receipt-Dateien sind keine Wahrheit.
6. Zum Abschluss **eine vollständige Rücklesung in einem SQL-Snapshot**, inklusive Gesamtdigest, ursprünglichem Bestand, Airports, Rechten, Schema und BG1. Ergebnis lokal in `external-runner-acceptance.json`; Konsole nur Anzahl/Endstand. Ein anderer oder unvollständiger Katalog ist kein PASS. Danach genau **ein echter Lissabon-Such-/Auswahl-/Speicherlauf nach Owner-Login**; diese UI-Abnahme erledigt der Starter nicht.

Bei hartem Prozessabbruch kann `external-runner.lock` bestehen bleiben. Vor einer manuellen Entfernung muss der Operator sicherstellen, dass der vorherige Prozess wirklich beendet ist. Niemals ein Lock automatisch löschen oder den noch unklaren `current-attempt.json`-Marker verwerfen. Bei Teilbestand bleibt der gezielte Wiederaufnahme-Schritt offen, statt den Import blind erneut zu senden.

### Prüfung und Lieferstatus dieser Runde

Unabhängiger Quellreview durch `/root/translation_status`; zwei Befunde (Bindung alter Receipts an Eingaben, Abschlussmarker bei Abbruch) im gebündelten Kandidaten behoben. Synthetische Tests liegen in `lib/places/catalog-external.test.ts` und werden vom **unveränderten** normalen CI-Selektor erfasst. Die zwölf synthetischen lokalen Tests sowie TypeScript und Lint bestanden. Der zusätzliche echte Wegwerf-PostgreSQL-Test konnte lokal wegen verweigerter Unix-Sockets nicht starten; kein Hosted-/TCP-Ersatz und kein behaupteter lokaler Native-PASS. Er ist in normaler CI zwingend. Der endgültige CI-Stand wird im PR nachgetragen; dieser vorab versionierte Text behauptet keinen noch nicht abgeschlossenen Lauf.

Offen bleiben die externe Ausführung, vollständige Hosted-Rücklesung und Lissabon-Abnahme sowie die Owner-Anmeldung für #1211. Alle übrigen Pakete bleiben geparkt. **Nach Ablage und CI STOPP.**

### Verbindliche Einreise-Produktanforderung zur Übergabe

Die Einreise-Lane liegt weiterhin außerhalb dieses PRs. Der Owner verlangt ab Start die vollständige Anzeige: Visum, ETA, Pass, Impfungen, Gesundheit, Formulare mit Kosten/Betrugswarnung, Gebühren, Ticket-/Geldnachweis, Transit, Minderjährige, Zoll, Sonderfälle, Quelle/Datum, Hinweis, Änderungen und amtliche Links. Fehlendes bleibt **„derzeit nicht verfügbar“**, ohne Vermutungen. Keine Änderung an Einreise-Code oder Daten durch diesen Ortskatalog-PR.

## Historischer Vorbereitungsbericht

## Historischer Status vor dem später unterbrochenen Import

**Vorbereitung abgeschlossen; noch kein Dev-Import, keine Hosted-Abnahme und keine Production-Freigabe.** Der unveränderte normale GeoNames-Parser und der unveränderte Airport-Konverter erzeugen einen vollständigen geprüften Importbestand. Root übernimmt ausschließlich den noch ausstehenden Dev-Datenlauf und dessen Rücklesung/Abnahme.

Main-Basis: `63544e820e912bd275556588c956a09b99b1cf90`. Eigener Branch: `feat/places-catalog-refresh-3-20261115`. Die acht grünen PRs und sämtliche Entry-Dateien blieben unberührt. Dieses Paket verändert weder Runtime noch Schema, Rechte, RLS, Auth, Migrationen, Importfilter oder Abhängigkeiten.

## Gesicherte Originalquelle

Vier Dateien einmal erfolgreich von [GeoNames](https://download.geonames.org/export/dump/) heruntergeladen, jeweils mit URL, Abrufzeit, Last-Modified, tatsächlicher Bytezahl und SHA-256 im [Quellmanifest](evidence/places-catalog-refresh-3-2026-11-15/source-manifest.json). Die drei Verwaltungs-/Dump-Dateien tragen Last-Modified 15.11.2026 03:39:51 GMT; countryInfo 03:45:58 GMT. Die Dateien bilden einen festgehaltenen Abrufsatz; es wird kein atomarer serverseitiger Gesamtsnapshot behauptet.

GeoNames ist gemäß [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) attribuiert. Keine GeoNames-Webservice-Anmeldung, kein API-Key oder kostenpflichtiger Anbieter. Rohdaten und JSONL-Exporte liegen außerhalb Git.

| Datei | Bytes | SHA-256 |
| --- | ---: | --- |
| allCountries.zip | 422.550.841 | `1bb5c62d025a66f47d64eee201e92016937d96870089f58b133662b8e300df9d` |
| countryInfo.txt | 32.112 | `79f8f59ea01cbb40438bf1856dd6c2ff201f03f8fc72d0530b2646aaf603ef04` |
| admin1CodesASCII.txt | 151.571 | `2e4867f5397acb056ea26377601b57af37cb4c81399770225018e9e439e91ad3` |
| admin2Codes.txt | 2.371.387 | `67492a022984623460aaaec97f4d1d49e74356c8b5730be9fe23e736223b71dc` |

## Tatsächliche Probe

Der vorhandene `scripts/places/importieren.ts` lief unter Node `v22.23.5` mit dem festen Quellverzeichnis, `--export` und ohne Schreibflags. Er las 13.483.991 Quellzeilen und exportierte 289.501 GeoNames-Orte. Keine ungültige TSV-Zeile und keine doppelte Quell-ID wurden gemeldet. Alle 252 countryInfo-Identitäten wurden berücksichtigt; die zwei historischen Einträge CS/8505033 und AN/8505032 bleiben ausgeschlossen. Der historische Zähler vom 01.11.2026 wurde nicht als Sollzahl erzwungen.

| Typ | GeoNames | OurAirports | Kombiniert |
| --- | ---: | ---: | ---: |
| Land | 250 | 0 | 250 |
| Stadt | 100.864 | 0 | 100.864 |
| Region | 13.351 | 0 | 13.351 |
| Insel | 175.036 | 0 | 175.036 |
| Flughafen | 0 | 5.332 | 5.332 |
| **Gesamt** | **289.501** | **5.332** | **294.833** |

Der normale Aliasfilter ließ **105.432 ganze Alias-Tokens** wegen der vorhandenen 800-Zeichen-Grenze aus. Es gibt kein Vollständigkeitsversprechen für jede Schreibweise weltweit und keine Sprache pro Alias. **92 GeoNames-Orte haben keinen bestätigten Ländercode; dieser bleibt null.** Länderzugehörigkeit wurde nicht ergänzt oder geraten.

Lissabon ist als Stadt `geonames:2267057`, Name `Lisbon`, Land `PT`, einschließlich exaktem Alias `Lissabon` im Export enthalten. Das belegt die Quelle, noch keinen Suchtreffer aus einer beschriebenen Dev-Datenbank.

Maschinenbelege: [normaler Probelauf](evidence/places-catalog-refresh-3-2026-11-15/dry-run-receipt.json), [vollständige Exportprüfung](evidence/places-catalog-refresh-3-2026-11-15/dry-run-validation.json).

## Flughäfen und vorhandener Dev-Bestand

Root stellte einen vollständig gesicherten öffentlichen Places-Bestand und elf Airport-Teile bereit. Die Airport-Backups tragen vor und nach dem Export denselben vollständigen Datenbank-Digest; das ist eine konsistente geordnete Rücklesung, kein behaupteter transaktionaler Snapshot.

Der unveränderte `ortAusFlughafen` aus `lib/places/importieren.ts` wurde lokal auf alle 5.332 gesicherten Airports angewendet. Keine fehlende IATA und kein durch den Konverter verworfener Airport. Alle 14 übergebenen Backup-Datei-Prüfsummen wurden vor der Konvertierung bestätigt. [Konvertierungsbeleg](evidence/places-catalog-refresh-3-2026-11-15/airport-conversion.json).

Der kombinierte Bestand hat 294.833 eindeutige IDs und 294.833 eindeutige Quellschlüssel. Keine ungültigen Koordinaten, Text-/Längenwerte, Unicode-/NUL-Werte, Featurecodes oder Quellen-/ID-Zuordnungen. Alle Koordinaten sind vorhanden und innerhalb des erlaubten Bereichs.

**Vergleich mit allen 270 vorhandenen Places-Zeilen:**

- Alle bisherigen IDs bleiben im kombinierten Bestand.
- Keine Änderung an `id`, `source`, `source_id`, `country_code` oder `typ`.
- Keine Kollision eines bisherigen Quellschlüssels mit einer anderen ID.
- Auch Name, Land, Region, Koordinaten, IATA, Keywords, Population und Featurecode sind für alle 270 Zeilen unverändert.
- `updated_at` ist bewusst nicht Quellinhalt; der normale Writer setzt den Zeitpunkt neu. Der vollständige alte Wert bleibt im Backup.
- Der vorbereitete Bestand enthält **294.563 zusätzliche IDs**.

Die konkreten Änderungslisten sind daher leer; es wurde nichts durch eine pauschale Freigabe verdeckt. [Vollständiger kombinierter Preflight](evidence/places-catalog-refresh-3-2026-11-15/combined-preflight.json).

## Aufgetretene Fehler und gebündelte Korrektur

1. Beim ersten Downloadlauf lieferte ausschließlich countryInfo HTTP 503. Nur diese noch nicht gesicherte Datei wurde erneut vom gleichen offiziellen Endpunkt abgerufen, danach HTTP 200. Die drei bereits fixierten Dateien blieben unangetastet. Fehlversuch und erfolgreiche Metadaten stehen im Manifest.
2. Der erste unveränderte Probelauf erschöpfte den Node-Standard-Heap und endete vor Export/DB-Zugriff. Nach Prüfung des vorhandenen lokalen freien Arbeitsspeichers lief derselbe Parser mit `--max-old-space-size=4096` einmal erfolgreich durch. Keine Parser-/Filteränderung und keine neue Dependency. Beide Protokolle samt Digest sind im Receipt referenziert.

Die abschließenden lokalen Datenprüfungen sind erfolgreich. Source-CI, Production-Build, Live-SQL-Schreiben und Hosted-Abnahme wurden von diesem Autor **nicht** ausgeführt oder als grün behauptet. Das Paket enthält ausschließlich Task-/Evidence-/Handoff-Dateien; Root veröffentlicht und prüft den endgültigen Paketstand.

## Wiederaufnahme durch Root

Lokales festes Datenverzeichnis:

`/workspace/scratch/8d4f63afa634/places-catalog-refresh-3-data/`

| Artefakt | Pfad innerhalb dieses Verzeichnisses | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| GeoNames-Export | `places-geonames.jsonl` | 97.653.414 | `da5d7531dbce106993a60453b5f216e0f6e7de1fc7fa97702b75405ad6ffe415` |
| Airport-Export | `places-airports.jsonl` | 1.612.035 | `d9237f9743fb94f5a91a55246cb06e9a098b9b15bf17e347ae344bf257c9c456` |
| **Kombinierter Importbestand** | **`places-combined.jsonl`** | **99.265.449** | **`626eda801321471285889859e2025165c6032b7b45e67abe3de27164d12fb991`** |

Die Originale liegen unter `source/`; die von Root erzeugten Sicherungen unter `backup/`. Hilfsprogramme für Download, lokale Qualitätsprüfung und vorhandene Airport-Konvertierung liegen ausschließlich neben den Daten. Sie sind keine neue Produktimplementierung. Keine Zugangsdaten wurden gelesen.

Vor einem zulässigen Dev-Schreiben prüft Root weiterhin das feste Branch-Ziel `yfvbxvijcorffwxbxahl`, Kapazität ohne neue Kosten, unveränderte Backups/Identitäten und das bestehende Guard-Signal. Keine Quelle beim Schreiben erneut als „latest“ herunterladen. Der vorhandene Rohsnapshot/Export muss für eine längere Unterbrechung dauerhaft erhalten bleiben; Git enthält absichtlich nur kompakte Evidence.

Nach dem Datenlauf: kontrollierte Rücklesung aller erwarteten Identitäten, erhaltene Bestands-IDs und unveränderte Rechte sowie genau ein echter angemeldeter Such-/Auswahl-/Speicherlauf für den zuvor fehlenden Ort. Keine echte Buchung. Production, Merges, Kostenänderungen, Anmeldungen/2FA und echte Erstattungen bleiben beim Product Owner.

**STOPP erreicht. do not mark Ready; do not merge; do not start a follow-up slice.**
