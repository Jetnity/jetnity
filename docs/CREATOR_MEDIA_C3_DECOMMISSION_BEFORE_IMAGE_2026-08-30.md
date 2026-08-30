# creator-media C3 Production Before Image

Captured read-only on 2026-08-30 immediately before C3 preparation.

## Repository evidence
- `main`: `e560026639ec56c38b3a17b47029e47997f9c5cf`.
- Current GitHub code search for `creator-media` returns cleanup/evidence material and the legacy-storage cleanup migration; no current Jetnity runtime file was identified as a consumer.

## Source bucket – exact required state
- ID/name: `creator-media`
- `public=false`
- `file_size_limit=null`
- `allowed_mime_types=null`
- object count: `3`
- total bytes: `9,092,490`
- distinct object eTags: `1`
- shared eTag: `"3af8e54d0183e045b501dca521a382a3"`
- source path MD5 set, sorted:
  - `80c895304fe937c27ece886087ba559a`
  - `a3aeff70bc13a3aa6f132ecdb2746862`
  - `e83fdb7bfb1c0c690fc2f1396eaafb91`

Object paths and owner identifiers are intentionally not recorded in repository documentation.

## Exact source policy set
All four are on `storage.objects`, `PERMISSIVE`, role exactly `authenticated`:

1. `creator-media: own uploads only 59k4xv_0`
   - command: `SELECT`
   - USING: `((bucket_id = 'creator-media'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]))`
   - WITH CHECK: null
2. `creator-media: own uploads only 59k4xv_1`
   - command: `INSERT`
   - USING: null
   - WITH CHECK: `((bucket_id = 'creator-media'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]))`
3. `creator-media: own uploads only 59k4xv_2`
   - command: `UPDATE`
   - USING: `((bucket_id = 'creator-media'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]))`
   - WITH CHECK: null
4. `creator-media: own uploads only 59k4xv_3`
   - command: `DELETE`
   - USING: `((bucket_id = 'creator-media'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]))`
   - WITH CHECK: null

Policy count: `4`.
The query-local policy fingerprint used in this C3 capture is `9809ed35fbf0659deba9c6cca51f5f8f`; exact names/attributes/expressions above are authoritative rather than the hash alone.

## Recovery bucket – must remain unchanged
- ID/name: `jetnity-legacy-recovery`
- `public=false`
- `file_size_limit=5000000`
- `allowed_mime_types=["image/png"]`
- object count: `1`
- total bytes: `3,030,830`
- distinct eTags: `1`
- eTag: `"3af8e54d0183e045b501dca521a382a3"`
- recovery path MD5: `6f449a0fc5dd219fe6ef5f82398a1bee`
- user/bucket-specific policy count from C2: `0`

## Recovery boundary
C3 may destroy the obsolete source bucket only. The recovery bucket/object is explicitly outside destructive scope.