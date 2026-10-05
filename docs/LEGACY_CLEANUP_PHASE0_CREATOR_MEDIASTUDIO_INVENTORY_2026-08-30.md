# Jetnity – Legacy Cleanup Phase 0: Creator / MediaStudio Inventar

Stand: 30. August 2026  
Status: **READ-ONLY LIVE INVENTORY / NO DELETE**  
Issue: #252  
Baseline: `main @ 5ee8c7017180747bb29112f1c5a2cf3419fd062d`

## 1. Executive Finding

Der frühere Creator-Hub-/MediaStudio-Komplex ist **nicht mehr Teil der aktuellen Jetnity-V2-Runtime**. Große Teile wurden bereits bewusst entfernt. Die aktuell stärkste verbliebene Altlast befindet sich in **Supabase Storage**, nicht in aktiven Creator-/MediaStudio-Seiten oder Public-Tabellen.

## 2. Repository / Runtime

### 2.1 Bereits entfernt / resolved

Aktuelle Architektur-Evidence dokumentiert:

- Creator Hub, Media Studio, Feed, Blog und alte Admin-Copilot-Oberflächen wurden in Phase 1.1b entfernt (209 Dateien).
- 63 alte Endpunkte einschließlich Media-/Video-Render-Pipeline, Creator-, Feed-, Session-, Publishing- und Content-Endpunkten wurden entfernt.
- `creator_profiles` wurde in Phase 1.5 auf das generische `public.profiles` umgestellt; creator-spezifische Profilfelder wurden entfernt.
- `creator_sessions` wurde als letzte Tabelle der alten Produktidee entfernt, nachdem Admin-Kennzahlen auf Reise-RPCs umgestellt worden waren.

### 2.2 Aktuelle Treffer mit `creator*`

Die verbleibenden Treffer im Anwendungscode sind überwiegend historische Kommentare bzw. Schutz-/Audit-Evidence:

- `components/admin/home/AdminTimeSeries.tsx`: historische Erklärung, Runtime nutzt `admin_reisen_zeitreihe()`.
- `components/admin/home/AdminStatsStrip.tsx`: historische Erklärung, Runtime nutzt `admin_reisen_kennzahlen()`.
- `lib/auth/admin-guard.ts`: historische Erklärung; tatsächliche Rollen-Tabelle ist `profiles`.
- `scripts/db/sicherheit.mjs`: Security-/Capability-Nachweise; nicht als Altdatei aus Namen löschen.

Klassifikation: **KEEP / HISTORICAL-EVIDENCE**, nicht Runtime-Legacy.

### 2.3 MediaStudio-/Render-Namen

Aktuelle Code-Suche ergab keine Runtime-Treffer für:

- `MediaStudio`
- `creator-media`
- `media-original`
- `media-renders`
- `public-media`
- `storage.from`

`render_jobs` erscheint nur in Datenbank-Dokumentation, nicht in Runtime-Code.

Klassifikation: starkes Indiz, dass die alten Storage-Namen keine aktuellen Anwendungskonsumenten besitzen. Vor Löschung bleibt eine breitere Import-/Config-/URL-Prüfung Pflicht.

## 3. Supabase Production – relationales Schema

Read-only Live-Catalog-Prüfung ergab keine aktuellen Public-Tabellen oder Funktionen des früheren Creator-/MediaStudio-/Blog-/Session-/Render-Komplexes.

Historische Cleanup-Migrationen belegen den bewussten Abbau:

- `20260817110000_legacy_entfernen`: 29 obsolete Legacy-Tabellen plus zugehörige Funktionen/Enums ohne `CASCADE` entfernt; vorab leer und dependency-geprüft.
- `20260817120200_creator_sessions_entfernen`: letzte Tabelle der alten Produktidee entfernt; ebenfalls dependency-geprüft und ohne `CASCADE`.

Diese Migrationen sind **KEEP / HISTORICAL-EVIDENCE**. Sie dürfen nicht als „alte Dateien“ gelöscht werden, weil sie die Datenbank-Historie und Replay-Fähigkeit dokumentieren.

## 4. Supabase Production – Storage

### 4.1 Bucket-Inventar

| Bucket | Public | Objekte | Bytes | Erstellt | Vorläufige Klasse |
| --- | --- | ---: | ---: | --- | --- |
| `creator-media` | ja | 3 | 9,092,490 | 2025-07-01 | **BLOCKED-BACKUP / REVIEW** |
| `masks` | nein | 0 | 0 | 2025-08-27 | DELETE-SAFE-CANDIDATE |
| `media-original` | nein | 0 | 0 | 2025-08-22 | DELETE-SAFE-CANDIDATE |
| `media-proxy` | nein | 0 | 0 | 2025-08-22 | DELETE-SAFE-CANDIDATE |
| `media-renders` | nein | 0 | 0 | 2025-08-22 | DELETE-SAFE-CANDIDATE |
| `media-thumbs` | nein | 0 | 0 | 2025-08-22 | DELETE-SAFE-CANDIDATE |
| `media-versions` | nein | 0 | 0 | 2025-08-22 | DELETE-SAFE-CANDIDATE |
| `public-media` | ja | 0 | 0 | 2025-08-30 | DELETE-SAFE-CANDIDATE |
| `renders` | ja | 0 | 0 | 2025-08-27 | DELETE-SAFE-CANDIDATE |
| `session-versions` | nein | 0 | 0 | 2025-08-22 | DELETE-SAFE-CANDIDATE |
| `subtitles` | ja | 0 | 0 | 2025-08-27 | DELETE-SAFE-CANDIDATE |

Alle Buckets sind deutlich älter als der 4-Monats-Stichtag. Alter allein begründet die Einstufung nicht; entscheidend sind zusätzlich fehlende Runtime-Referenzen und – bei 10 Buckets – leerer Datenbestand.

### 4.2 Nichtleerer Bucket `creator-media`

Drei PNG-Objekte, jeweils 3,030,830 Bytes, gehören demselben alten Auth-Konto. Objektpfade werden in diesem Inventar aus Datenschutzgründen nicht ausgeschrieben; stattdessen werden MD5-Fingerprints der Pfadnamen gespeichert:

1. `a3aeff70bc13a3aa6f132ecdb2746862`
2. `e83fdb7bfb1c0c690fc2f1396eaafb91`
3. `80c895304fe937c27ece886087ba559a`

Alle drei wurden am 23. Juli 2025 angelegt; letzter Metadaten-Update 20. August 2025. Der Owner-Account existiert weiterhin. Damit sind diese Objekte **nicht als wertlose Testdaten bewiesen**.

Folge: keine Löschung, keine Bucket-Löschung und keine Datenmutation, bis die Bytes gesichert, Restore getestet bzw. ausreichend beweisbar und Herkunft/Bedarf bewertet sind.

### 4.3 Storage-Policies

Es existieren weiterhin Creator-/MediaStudio-bezogene Policies:

- `creator-media`: SELECT / INSERT / UPDATE / DELETE für authenticated, an Owner/Folder gebunden;
- `media-original`, `media-proxy`, `media-renders`, `media-thumbs`, `media-versions`: Owner-CRUD-Policies;
- `public-media`: öffentliche SELECT-Policies, authenticated INSERT und Owner-UPDATE.

Die Policy-Gruppe ist selbst Legacy-Kandidat, aber nur zusammen mit der jeweiligen Bucket-Entfernung bzw. einer klaren Storage-Zielarchitektur zu bereinigen.

## 5. Security / Privacy

Vier alte Buckets sind als `public=true` markiert:

- `creator-media`
- `public-media`
- `renders`
- `subtitles`

Die letzten drei sind leer. `creator-media` enthält drei alte Nutzerbilder. Ein Public-Bucket ist über einen bekannten Objektpfad grundsätzlich öffentlich lesbar; deshalb ist `creator-media` ein **prioritärer Privacy-/Security-Review**, aber Phase 0 verändert die Production-Konfiguration nicht.

## 6. Capability-/Auth-Rest

Die Capability `inhalte-moderieren` existiert weiterhin, obwohl `creator_sessions` als letzter früherer Moderationsgegenstand entfernt wurde. Die damalige Migration dokumentiert, dass dies bewusst so belassen wurde, weil die Capability Teil des zentralen Rollenvertrags ist.

Klassifikation: **REVIEW**. Nicht im Legacy-Cleanup still entfernen; Änderungen am Capability-/Admin-Vertrag sind ein separates Auth-/Authorization-Gate.

## 7. Vorläufige Cleanup-Batches

### Batch A – Repository semantic hygiene (nicht destruktiv gegenüber Daten)

- Current-Truth-Dokumentation auf veraltete Creator-/MediaStudio-Zielbilder prüfen.
- historische Kommentare nur entfernen, wenn sie nachweislich keine wertvolle Architektur-/Security-Evidence mehr sind.
- keine historischen Migrationen löschen.

### Batch B – leere Legacy-Storage-Ressourcen

Kandidaten: zehn leere Buckets plus zugehörige Legacy-Policies. Vor Production-Änderung nochmals exakte Runtime-/Config-/URL-Referenzen und Before-Image prüfen. Eigener Product-Owner-Gate.

### Batch C – `creator-media`

1. Byte-Backup der drei Objekte;
2. Metadaten-/Fingerprint-Manifest;
3. Restore-Nachweis;
4. Herkunft/Produktbedarf klären;
5. erst dann Entscheidung über Private-Schaltung, Archivierung oder vollständige Entfernung.

### Batch D – Governance / Cloud

Separate spätere Themen wie altes Supabase-Projekt, Branch-Massenbereinigung und Capability-Hygiene werden nicht in Creator/MediaStudio-Storage-Batch vermischt.

## 8. Phase-0-Status

Noch **kein DELETE-SAFE final**. Die zehn leeren Buckets sind `DELETE-SAFE-CANDIDATE`; `creator-media` bleibt `BLOCKED-BACKUP`; Capability-Reste bleiben `REVIEW`; historische Migrationen bleiben `KEEP`.
