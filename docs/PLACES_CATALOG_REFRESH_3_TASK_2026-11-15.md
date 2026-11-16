# Places Catalog Refresh 3 — begrenzter Dev-Datenlauf
Stand: 2026-11-15. Technical Lead: Root. Autor: **Jetnity places catalog refresh 3**.

## Aktueller Owner-Auftrag — externer Starter, Ausführung gestoppt

Der Owner hat nach Abbruch von «Admin 3» ausdrücklich beauftragt, den Import als versioniertes Skript im passenden Draft-PR bereitzustellen und **jetzt nicht auszuführen**. Dieser aktuelle Auftrag ersetzt den früheren Docs-only-Scope und die frühere Erlaubnis zum MCP-Datenlauf weiter unten. Keine Geodaten, Importblöcke oder Massendaten über Chat-/Supabase-/GitHub-Connector; keine Hosted-Abfrage in dieser Runde. Historische Vorbereitungs-/Importbelege bleiben datiert.

Root ist alleiniger Writer in einer frischen Fortsetzungssitzung (`/root`); die ursprünglichen Chats sind voll. Der isolierte Arbeitsstand liegt unter `/workspace/scratch/f10628d65d6d/jetnity-places-external`. Geplanter Umfang: ein Dev-only-Kommando unter `scripts/places/catalog-external/`, eine wiederverwendete reine Abnahme-SQL-Vorlage, synthetische Sicherheitstests unter `lib/places/`, eigener Handoff und kompakter Status. Keine Paket-, CI-, Runtime-, Schema-, Rollen-, Login- oder Kostenänderung. Bestehender Parser/Importer unverändert.

Der Starter bindet den vorhandenen festen Quellsatz, Backups und 611 Batches; prüft den echten nicht-default Dev-Branch; schreibt nur fehlende IDs; hält Zwischenstand atomar fest; liest unklare Versuche vor jedem weiteren Schreiben zurück; stoppt bei Abweichungen; prüft Bestand/Rechte/BG1 vor und nachher. Ein lokales exklusives Lauf-Lock verhindert parallele Starter. Konsole nur ein kompakter Abschluss, niemals Daten/SQL/Antwortkörper/Secrets. Keine automatische Ausführung durch CI, Deployment oder Chat.

Abnahme dieser Runde: unabhängiger Quellreview, fokussierte synthetische Prüfungen und ein normaler CI-Lauf des gebündelten Codes. Der echte Import, seine vollständige Rücklesung und ein echter Lissabon-Suchlauf sind ausdrücklich **offen**. Die Übersetzungen #1211 bleiben CI-grün und warten zur echten Konto-Abnahme auf Owner-Login/2FA. CMS/Kampagnen bleiben bis zur koordinierten #1197-Integration unangetastet. Die acht grünen Pakete sowie #1197/#1198 sind fremder/unveränderlicher Scope. Danach STOPP; keine Merges oder Production-Aktionen.

## Historischer Auftrag und Baseline
Nutzer priorisiert zuerst CMS/Kampagnen-Datenbankanbindung (konkret blockiert durch unveränderliche Entry-Verträge), dann Übersetzungen (eigener aktiver Folge-Branch), dann Ortskatalog. Höchstens drei neue Pakete vor Merge der acht bestehenden grünen. Dieser Scope ist Paket 2; kein weiterer Slice.
Main-Basis: `63544e820e912bd275556588c956a09b99b1cf90`.
Branch: `feat/places-catalog-refresh-3-20261115`.
Worktree: `/workspace/scratch/8d4f63afa634/jetnity-places-catalog-3`.

Der Dev-Katalog enthält derzeit 270 repräsentative Orte und 5.332 Flughafenreferenzen; Lissabon fehlt. Ziel ist der vollständige aktuelle Bestand nach dem bereits bestehenden normalen GeoNames-Filter. Der historische lokale Zähler 289.453 ist kein Sollwert für einen neuen Snapshot.

## Scope und Grenzen
Erlaubte versionierte Dateien: dieser Task, `docs/PLACES_CATALOG_REFRESH_3_HANDOFF_2026-11-15.md`, `docs/evidence/places-catalog-refresh-3-2026-11-15/source-manifest.json` und kompakte nicht sensitive Ergebnis-/Receipt-JSONs unter genau diesem Evidence-Verzeichnis.
Keine Produkt-, Importer-, Migration-, Typen-, Scanner-, Workflow-, Paket- oder globalen Dokumentationsänderungen. Kein Rohdump im Git. Eigene temporäre Download-/Analysehelfer nur außerhalb des Repositories.
Alle Pfade von #1196–#1198 absolut unveränderlich; geschützte Liste: `/workspace/scratch/8d4f63afa634/round3-frozen-and-protected-paths.json`. Acht grüne PRs #1199/#1200/#1201/#1203/#1204/#1205/#1207/#1208 bleiben inklusive Quellen und Metadaten unangetastet.

## Vorbereitung durch Autor
1. AGENTS, relevante Orts-/Import-Dokumentation und bestehenden Normal-Importer lesen.
2. Vier Originaldateien von `https://download.geonames.org/export/dump/` einmal in `/workspace/scratch/8d4f63afa634/places-catalog-refresh-3-data/source` sichern: allCountries.zip, countryInfo.txt, admin1CodesASCII.txt, admin2Codes.txt. Abrufzeit, URL, tatsächliche Bytes, HTTP Last-Modified und SHA-256 im Manifest dokumentieren. Dieselben Bytes für Probe und späteren Lauf; kein erneuter Latest-Download beim Schreiben.
3. Unveränderten `scripts/places/importieren.ts` mit Node 22, vorhandenen Abhängigkeiten und `--quelle-verzeichnis ... --export ...` im Probe-Modus ausführen. Kein `--schreiben`. Export außerhalb Git. Alle Fehler eines Laufs sammeln; nicht durch geänderte Filter/Identitäten kaschieren.
4. Tatsächliche Anzahl, Typverteilung, eindeutige IDs/Quellschlüssel, gültige Koordinaten, Länderidentität, Alias-Auslassungen und Lissabon-Beleg berichten. Keine erfundenen Orte, keine künstliche Kurzliste oder sprachbezogene Aliasbehauptung.
5. Reproduzierbare öffentliche Quellen/Lizenz und klare Wiederaufnahme-Hinweise festhalten. Keine Credentials lesen, keine Auth- oder SQL-Schreibversuche.
6. Snapshot/Export-Handoff an Root; danach stoppen.

## Dev-Schreiben ausschließlich durch Root
Ziel ausschließlich der live bestätigte nicht-default Branch `yfvbxvijcorffwxbxahl`. Production `qscbgcdmivbbnzrcyegn` ist nicht Schreibziel.
Vor jedem Datenlauf: vollständiger unveränderter Bestands-Backup mit Digest, öffentlicher Airport-Snapshot, Prüfung auf ID-/Quell-/Länder-Kollisionen, vorhandene Kapazität ohne neue Kosten und bestehendes Guard-Statussignal. Keine Rechte-/RLS-/Schemaänderung, keine neue RPC/Tabelle, kein zweiter Store, kein Rebaseline/Disable des Entry-Guards.
Vorhandenes Import-Datenformat und Flughafen-Konverter verwenden; atomare sequentielle begrenzte Upsert-Batches mit geprüfter Anzahl, Quellidentität, externem Fortschrittsbeleg. Unklarer Commit wird rückgelesen, nicht blind wiederholt. Bestehende IDs bleiben erhalten; keine Löschung von Katalog, Reisen oder Konten.
Der direkte Normal-Importer setzt sicher vorhandene Management-Secrets voraus; keine Extraktion aus CI oder Credential-Abfrage. Die vorhandene autorisierte Supabase-MCP-Verbindung darf für denselben normalen DML-Datenlauf genutzt werden.
Eine abschließende vollständige Daten-/Rechteprüfung und ein echter angemeldeter Dev-Planer-Lauf für den vorher fehlenden Ort genügen. Keine wiederholte allgemeine Reviewrunde. Keine neuen Browser-/Provider-/Reisekosten, keine echte Buchung.

## Evidence, Risiken, Kosten und STOPP
Öffentliche Originalquellen, tatsächliche Filterergebnisse, vorhandene Backup-/Rücklese-Digests, Datenlauf-Receipts, Grenzen und Dev-UI-Ergebnis gehören in eigene Handoff/Evidence. Source CI nur einmal für den endgültigen eigenen Paketstand; DB-Datenlauf darf nicht als Source-Merge oder Production-Freigabe bezeichnet werden.
Keine neuen laufenden Kosten, kein Upgrade, kein neuer Branch/Provider. Unklare Quota/Transport-/Identitätsgrenze stoppt den Schreibteil bei weiterhin nutzbarer Probe.
**do not mark Ready; do not merge; do not start a follow-up slice.** Autor stoppt nach Vorbereitung; Root übernimmt ausschließlich zulässige Dev-Datenoperationen und Veröffentlichung als eigenen Draft.

## Root-Präzisierung nach vollständigem Quellvergleich

Alle 270 bestehenden Quellzeilen sind im neuen Export vollständig identisch. Der Datenlauf wird deshalb enger als der normale Refresh ausgeführt: nur fehlende IDs per `INSERT ... ON CONFLICT(id) DO NOTHING` ergänzen. Bestehende Zeilen einschließlich Zeitstempel bleiben unverändert. Jeder Batch sperrt bei abweichenden bestehenden Nutzdaten oder kollidierender Quellidentität. Maximal 500 Zeilen / 180.000 JSON-UTF8-Bytes, keine Parallelmutationen; vor SQL dauerhafte Versuchsinformation, danach geprüfte Counts und vollständige PostgreSQL-kanonische Inhaltsdigests. Der vorhandene Parser/Konverter und vollständige Datensatz bleiben unverändert. Nach Abschluss genügt ein vollständiger Gesamtdigest plus bekannte Rechte-/Guard-Rücklesung und ein echter Dev-Lauf.

## Root-Ergänzung: Bestandsvergleich und Flughafen-Konvertierung

Root stellt am 15.11.2026 die öffentlichen Dev-Backups unter `places-catalog-refresh-3-data/backup/` bereit: vollständige 270 Places-Zeilen, 5.332 Airports in elf Teilen sowie Checksummen/Schema. Autor darf ausschließlich lokal alle bisherigen IDs, Quellidentitäten, Typen und Länder gegen den neuen Export vergleichen und jede Änderung konkret auflisten. Der vorhandene unveränderte `ortAusFlughafen` darf auf diese gesicherten Airport-Zeilen angewendet werden; ein kombinierter vollständiger JSONL-Export mit Unique-/Koordinatenprüfung und Digest bleibt außerhalb Git. Kein SQL-Schreiben, keine Quelle-/Filteränderung, kein neuer Runtime- oder Folge-Slice.
