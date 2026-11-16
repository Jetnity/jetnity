# saved_offers — vorbereitetes Production-Entscheidungspaket

**16.11.2026: UNAPPLIED / keine Ausführungsfreigabe.** Nur die vorhandene
Migration `supabase/migrations/20261113173644_saved_offers.sql` wird vorgesehen;
keine Kopie, neue Tabelle daneben, Auth-Änderung oder Änderung der #1198-Dateien.

## Tatsächlich gelesen

| Ziel | Tabelle | Migrationseintrag | RLS | Policies |
|---|---:|---:|---:|---:|
| Development `yfvbxvijcorffwxbxahl` | vorhanden | 1 | aktiv | 4 |
| Production `qscbgcdmivbbnzrcyegn` | fehlt | 0 | nicht vorhanden | 0 |

Dev hat keine Tabellenrechte für `anon`; `authenticated` darf genau acht
vorgesehene Spalten ändern. Diese Katalogzählung ist **kein** vollständiger
Policyvergleich und kein neuer angemeldeter Isolationstest. Vorhandene echte
Dev-Nutzung bleibt in `docs/PRIVATE_UX_SAVED_OFFERS_2026-11-13.md`; sie wird nicht
wiederholt oder als Production-Nachweis ausgegeben. Die eigene wiederverwendbare
Read-only-Abfrage liegt unter `scripts/db/saved-offers-production-preflight-20261116/`.

## Konkreter noch offener Sicherheitsblocker

Der aktuelle BG1-Katalog erfasst globale `pg_shdepend`-Verbindungen zu
`authenticated` und Abhängigkeiten zu `auth.users` in beide Richtungen:
`scripts/db/official-truth-v3-background-guard-1/parts/catalog.sql`.
Die vorhandene saved_offers-Migration fügt genau solche Grants, Policies und
FK-/Trigger-Abhängigkeiten hinzu. **Ein isolierter Apply ohne geprüfte additive
BG1-Transition kann daher die Einreiseauskunft sperren.** Keine pauschale
Neubaseline, kein Abschalten von BG1, kein PUBLIC-/Service-Role-Ersatz.
Dieser Befund ist eine Quellcodefolgenabschätzung; kein absichtlich erzeugter
Production-Incident. Die vollständige additive Transition ist noch nicht gebaut
und getestet. Das Paket ist daher noch **nicht zur sofortigen Installation bereit**.

## Vorzubereitender Freigabeumfang und Ausführungsweg

Nach einem gebündelten Dev-Nachweis der erlaubten Katalogtransition entscheidet
Sasa über genau: diese einzelne Migration plus ihre exakte BG1-Komposition,
anschliessend eine echte Merkliste-Abnahme mit legitimer Anmeldung. Keine weiteren
Migrationen durch ein unbeschränktes `db push`; keine neuen Secrets oder Kosten.

Die spätere Ausführung muss den festen Production-Projektbezug, unveränderte
kanonische Migrationsbytes, fehlende Tabelle/History und den aktuellen Guard-Stand
vor DDL prüfen. Abweichung oder ein paralleler Installationsversuch bedeutet STOP.
Migration und passende History werden über den vorhandenen migrationsgeführten
Weg genau einmal transaktional angewendet. Der BG1-Katalog darf ausschliesslich
um die vorab geprüften neuen saved_offers-Objekte/Abhängigkeiten erweitert werden.
Sonstige Katalogabweichungen bleiben Fehler. Kein ungeschütztes Zwischenfenster.

Danach einmal rücklesen: Spalten/Constraints/Index, vier genaue Own-Policies,
keine anonymen Rechte, nur SELECT/INSERT/DELETE und acht UPDATE-Spalten für
`authenticated`; keine Eigentümeränderung, Quellen-/URL-Änderung oder Fremdzugriff.
Eine normale angemeldete Nutzung muss Speichern, Neuladen und Entfernen sowie
Fremdnutzer-/anonyme Ablehnung belegen. Keine gefälschte Owner-/AAL2-Sitzung.
BG1 und bestehende CH→DE-Antwort dürfen durch die Transition nicht ausfallen.

## Abbruch und Rückweg

Fehler vor Commit: gesamte Transaktion zurückrollen. Unklarer Commit: zuerst
Tabelle und Migrationshistorie rücklesen, nicht blind erneut anwenden. Nach
bestätigtem Commit mit realen Merklisten keine Tabelle oder Nutzerdaten automatisch
löschen. Ein vorbereiteter, ownerfreigegebener Zugriffs-/UI-Rückweg muss mit der
BG1-Komposition zusammenpassen; pauschaler DROP oder Guard-Reset ist nicht erlaubt.

**Erster nächster Schritt:** eng begrenzte additive BG1-Komposition für genau die
bestehende Migration in Dev entwickeln und einmal testen, danach Sasa das konkrete
Production-Paket zur Freigabe vorlegen. Kein Production-Schreiben in diesem PR.
