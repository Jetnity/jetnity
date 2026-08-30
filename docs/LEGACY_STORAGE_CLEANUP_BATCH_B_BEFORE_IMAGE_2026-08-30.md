# Jetnity – Legacy Storage Cleanup Batch B: Production Before Image

Stand: 30. August 2026  
Issue: #255  
Baseline Main: `25de0a9f374e1bf8470333281a7bc77c7aa8f905`  
Production Supabase: `qscbgcdmivbbnzrcyegn`

## 1. Bucket-Before-Image

Unmittelbarer Live-Recheck vor Write:

| Bucket | Public | File size limit | MIME limit | Objects | Bytes |
| --- | --- | ---: | --- | ---: | ---: |
| `masks` | false | null | null | 0 | 0 |
| `media-original` | false | null | null | 0 | 0 |
| `media-proxy` | false | null | null | 0 | 0 |
| `media-renders` | false | null | null | 0 | 0 |
| `media-thumbs` | false | null | null | 0 | 0 |
| `media-versions` | false | 10485760 | `application/json` | 0 | 0 |
| `public-media` | true | null | null | 0 | 0 |
| `renders` | true | null | null | 0 | 0 |
| `session-versions` | false | 10485760 | `application/json` | 0 | 0 |
| `subtitles` | true | null | null | 0 | 0 |

## 2. Protected Non-Scope

`creator-media` live unmittelbar vor Write:

- bucket exists: yes
- `public = true`
- objects: **3**
- bytes: **9,092,490**
- latest object metadata update: `2025-08-20 16:56:27.037068+00`

Dieser Zustand ist After-Image-Gate und darf durch Batch B nicht verändert werden.

## 3. Exakt zu entfernende Storage-Policies

Auf `storage.objects` existieren exakt folgende 24 Legacy-Policies, die die zehn Kandidaten referenzieren. Davon betreffen 20 die fünf `media-*`-Buckets und 4 `public-media`. Für `masks`, `renders`, `session-versions` und `subtitles` existieren keine eigenen Policies.

### `public-media`

- `Auth manage own public-media` – UPDATE – role `public`
- `Auth upload public-media` – INSERT – role `authenticated`
- `Public read public-media` – SELECT – role `public`
- `public-media-read` – SELECT – role `public`

### `media-original`

- `media-original_del_owner`
- `media-original_ins_owner`
- `media-original_sel_owner`
- `media-original_upd_owner`

Alle Rolle `authenticated`; Owner-Bindung gegen `auth.uid()`.

### `media-proxy`

- `media-proxy_del_owner`
- `media-proxy_ins_owner`
- `media-proxy_sel_owner`
- `media-proxy_upd_owner`

Alle Rolle `authenticated`; Owner-Bindung gegen `auth.uid()`.

### `media-renders`

- `media-renders_del_owner`
- `media-renders_ins_owner`
- `media-renders_sel_owner`
- `media-renders_upd_owner`

Alle Rolle `authenticated`; Owner-Bindung gegen `auth.uid()`.

### `media-thumbs`

- `media-thumbs_del_owner`
- `media-thumbs_ins_owner`
- `media-thumbs_sel_owner`
- `media-thumbs_upd_owner`

Alle Rolle `authenticated`; Owner-Bindung gegen `auth.uid()`.

### `media-versions`

- `media-versions_del_owner`
- `media-versions_ins_owner`
- `media-versions_sel_owner`
- `media-versions_upd_owner`

Alle Rolle `authenticated`; Owner-Bindung gegen `auth.uid()`.

## 4. Storage System Protection

Production besitzt den Trigger `protect_buckets_delete` auf `storage.buckets`.

`storage.protect_delete()` wirft bei direktem SQL-Delete `42501` mit der Aussage:

> Direct deletion from storage tables is not allowed. Use the Storage API instead.

Daher ist ein direkter SQL-Delete explizit nicht Teil dieses Batches.

## 5. Dependency Recheck

Phase-0 Evidence und unmittelbarer Read-only-Recheck ergeben weiterhin:

- keine aktuelle Runtime-Referenz auf die zehn Bucket-IDs;
- keine bekannte Current-Data-Referenz;
- keine Function/View/Trigger-Referenz außerhalb der Storage-Policies;
- alle zehn Buckets leer.

## 6. STOP Conditions

STOP vor Write bei:

- irgendeinem Object Count > 0;
- fehlendem oder neu hinzugekommenem Kandidaten-Bucket;
- Drift bei `creator-media`;
- neuem Consumer/DB-Definition-Treffer;
- fehlendem offiziellen Storage-API-Ausführungsweg;
- Scope-Erweiterung über die zehn IDs oder 24 Policies hinaus.
