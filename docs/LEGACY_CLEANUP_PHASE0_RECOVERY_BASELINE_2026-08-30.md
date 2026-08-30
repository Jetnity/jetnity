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

| Bucket | Public | Object Count | Bytes |
| --- | --- | ---: | ---: |
| `creator-media` | true | 3 | 9,092,490 |
| `masks` | false | 0 | 0 |
| `media-original` | false | 0 | 0 |
| `media-proxy` | false | 0 | 0 |
| `media-renders` | false | 0 | 0 |
| `media-thumbs` | false | 0 | 0 |
| `media-versions` | false | 0 | 0 |
| `public-media` | true | 0 | 0 |
| `renders` | true | 0 | 0 |
| `session-versions` | false | 0 | 0 |
| `subtitles` | true | 0 | 0 |

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

## 5. Policy Before-Image – relevante Klassen

- `creator-media`: authenticated owner-folder SELECT/INSERT/UPDATE/DELETE.
- `media-original`: authenticated owner SELECT/INSERT/UPDATE/DELETE.
- `media-proxy`: authenticated owner SELECT/INSERT/UPDATE/DELETE.
- `media-renders`: authenticated owner SELECT/INSERT/UPDATE/DELETE.
- `media-thumbs`: authenticated owner SELECT/INSERT/UPDATE/DELETE.
- `media-versions`: authenticated owner SELECT/INSERT/UPDATE/DELETE.
- `public-media`: public SELECT, authenticated INSERT, owner-bound UPDATE.

Jede spätere Policy-Entfernung muss im selben Batch wie die zugehörige Storage-Entscheidung dokumentiert werden. Keine isolierte Policy-Massenlöschung.

## 6. Restore-Prinzip je späterem Batch

### Repository

Restore über exact pre-cleanup Git SHA bzw. Revert des Cleanup-Commits.

### Leere Storage-Buckets

Vor Delete nochmals Object Count `0`, Runtime-Referenzen `0`, relevante Policies und Public-Flag festhalten. Restore-Vertrag muss Bucket-Konfiguration und Policies enthalten.

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
