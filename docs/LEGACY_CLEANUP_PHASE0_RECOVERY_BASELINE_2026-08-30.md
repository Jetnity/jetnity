# Jetnity – Legacy Cleanup Phase 0: Recovery Baseline

Stand: 30. August 2026  
Status: **BEFORE-IMAGE / READ-ONLY / NO DELETE**  
Issue: #252

## 1. Repository Restore Point

- Repository: `Jetnity/jetnity`
- Start-`main`: `5ee8c7017180747bb29112f1c5a2cf3419fd062d`
- Audit-Branch: `audit/legacy-cleanup-creator-mediastudio-2026-08-30`
- P1 Migration-History Repair ist vor diesem Audit abgeschlossen und post-merge CI-grün.

Jede spätere Repository-Löschung muss auf einem eigenen Cleanup-Branch erfolgen. Der Restore-Punkt für den Zustand vor dem Legacy Cleanup ist mindestens der oben genannte Main-Commit; Git-History bleibt zusätzliche Recovery-Ebene.

## 2. Supabase Production Baseline

- Production Project Ref: `qscbgcdmivbbnzrcyegn`
- Phase 0 führt keine Production-Mutation aus.
- Keine aktuellen Public Creator-/MediaStudio-/Blog-/Session-/Render-Relationen oder -Funktionen im Live-Catalog gefunden.
- Historische Cleanup-Migrationen bleiben Teil der Migrationskette und werden nicht gelöscht.

## 3. Storage Before-Image

Alle elf Buckets sind Typ `STANDARD` und `avif_autodetection=false`.

| Bucket | Public | Object Count | Bytes | File Limit | MIME Limit |
| --- | --- | ---: | ---: | ---: | --- |
| `creator-media` | true | 3 | 9,092,490 | null | null |
| `masks` | false | 0 | 0 | null | null |
| `media-original` | false | 0 | 0 | null | null |
| `media-proxy` | false | 0 | 0 | null | null |
| `media-renders` | false | 0 | 0 | null | null |
| `media-thumbs` | false | 0 | 0 | null | null |
| `media-versions` | false | 0 | 0 | 10,485,760 | `application/json` |
| `public-media` | true | 0 | 0 | null | null |
| `renders` | true | 0 | 0 | null | null |
| `session-versions` | false | 0 | 0 | 10,485,760 | `application/json` |
| `subtitles` | true | 0 | 0 | null | null |

Erstellungszeitpunkte: `creator-media` 2025-07-01; `session-versions` 2025-08-22; die `media-*`-Gruppe 2025-08-22; `masks`/`renders`/`subtitles` 2025-08-27; `public-media` 2025-08-30.

### `creator-media` Object Manifest – ohne Pfad/PII

| Name MD5 | MIME | Bytes | Created | Updated |
| --- | --- | ---: | --- | --- |
| `a3aeff70bc13a3aa6f132ecdb2746862` | `image/png` | 3,030,830 | 2025-07-23 | 2025-08-20 |
| `e83fdb7bfb1c0c690fc2f1396eaafb91` | `image/png` | 3,030,830 | 2025-07-23 | 2025-08-20 |
| `80c895304fe937c27ece886087ba559a` | `image/png` | 3,030,830 | 2025-07-23 | 2025-08-20 |

Die drei Objekte gehören demselben weiterhin existierenden Auth-Konto. Konto-ID, E-Mail und Objektpfade werden in diesem Dokument bewusst nicht reproduziert.

## 4. Backup-Blocker

**Die Bytes der drei `creator-media`-Objekte wurden in Phase 0 noch nicht exportiert.**

Daher ist verbindlich:

- kein Delete dieser Objects;
- kein Delete des Buckets;
- keine Annahme, dass es Testdaten sind;
- kein Umschalten der Konfiguration als Teil dieses Audits.

Vor einer späteren Entfernung muss ein separates Backup-Artefakt oder ein gleichwertig überprüfter Restore-Pfad erstellt und mit diesem Manifest verknüpft werden.

## 5. Policy Before-Image

### `creator-media`

Vier Policies, alle Rolle `authenticated`, Folder-Owner über erstes Pfadsegment = `auth.uid()`:

- `creator-media: own uploads only 59k4xv_0` – SELECT;
- `creator-media: own uploads only 59k4xv_1` – INSERT / identische Folder-Owner-WITH-CHECK;
- `creator-media: own uploads only 59k4xv_2` – UPDATE;
- `creator-media: own uploads only 59k4xv_3` – DELETE.

### Owner-CRUD-Gruppen

Je vier Policies (SELECT/INSERT/UPDATE/DELETE), Rolle `authenticated`, Bedingung `bucket_id=<bucket> AND owner=auth.uid()`:

- `media-original_{sel,ins,upd,del}_owner`
- `media-proxy_{sel,ins,upd,del}_owner`
- `media-renders_{sel,ins,upd,del}_owner`
- `media-thumbs_{sel,ins,upd,del}_owner`
- `media-versions_{sel,ins,upd,del}_owner`

### `public-media`

- `Public read public-media` – Rolle `public`, SELECT, `bucket_id='public-media'`;
- `public-media-read` – zweite Rolle-`public`-SELECT-Policy mit derselben Bucket-Bedingung;
- `Auth upload public-media` – Rolle `authenticated`, INSERT, WITH CHECK `bucket_id='public-media'`;
- `Auth manage own public-media` – Rolle `public`, UPDATE, `bucket_id='public-media' AND owner=auth.uid()` für USING und WITH CHECK.

Damit existieren auf `public-media` zwei funktional gleichgerichtete Public-Read-Policies. Das ist ein zusätzlicher Legacy-/Hygiene-Hinweis, aber Phase 0 ändert nichts.

### Buckets ohne passende `storage.objects`-Policy im Live-Inventar

Für `masks`, `renders`, `session-versions` und `subtitles` wurde keine Bucket-spezifische `storage.objects`-Policy gefunden. Der Bucket-Public-Status bleibt davon getrennt: `renders` und `subtitles` sind als Bucket `public=true` konfiguriert.

Jede spätere Policy-Entfernung muss im selben Batch wie die zugehörige Storage-Entscheidung dokumentiert werden. Keine isolierte Policy-Massenlöschung.

## 6. Restore-Prinzip je späterem Batch

### Repository

Restore über exact pre-cleanup Git SHA bzw. Revert des Cleanup-Commits.

### Leere Storage-Buckets

Vor Delete nochmals Object Count `0`, Runtime-Referenzen `0`, relevante Policies und Public-Flag festhalten. Restore-Vertrag muss Bucket-Typ, Public-Flag, File-Limit, MIME-Limit und Policies enthalten.

### Nichtleerer Storage-Bucket

Vor Delete:

1. Objektbytes exportieren;
2. Pfad-/MIME-/Größe-/Hash-/Owner-Zuordnung in einem geschützten Recovery-Manifest festhalten;
3. Restore mindestens technisch beweisen bzw. in isoliertem Kontext testen;
4. erst danach Product-Owner-Gate für Production-Entfernung.

## 7. STOP Conditions

Sofort STOP bei:

- neuem Runtime-Treffer auf einen Kandidaten;
- Object Count > erwarteter Before-Image;
- neueren Storage-Updates seit dem Inventar;
- unbekannter Policy/Trigger/Function-Abhängigkeit;
- fehlendem Backup für nichtleere Ressourcen;
- Drift von `main` oder Production, die den Kandidatenstatus materiell verändert.
