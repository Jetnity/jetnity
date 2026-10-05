# Legacy Cleanup Batch C – creator-media Backup / Privacy Audit

Date: 2026-08-30
Issue: #262
Decision gate: #263
Baseline: `main @ 8e84323f7216800696a42dd4a14c11d1dd8f4b38`
Status: READ-ONLY AUDIT / NO STORAGE MUTATION

## 1. Scope

Target only the remaining legacy Supabase Storage bucket `creator-media` in Production `qscbgcdmivbbnzrcyegn`.

This audit does not download, move, copy, delete, rename or modify any object, bucket or policy. It records privacy-safe fingerprints only.

## 2. Live bucket state

Latest read-only Production evidence:

- bucket id: `creator-media`
- `public=true`
- created: `2025-07-01`
- object count: `3`
- total object bytes: `9,092,490`
- object MIME type: `image/png` for all three
- distinct object owners: `1`
- current Storage policies: `4`
- exact policy fingerprint MD5: `84f13dec01a78b2ae7cef5c00a396958`

Supabase documents that public buckets bypass access control for retrieving/serving objects: anyone possessing an object URL can access it. Private buckets require authorized download or a time-limited signed URL.

## 3. Object fingerprints without PII

The actual object paths and raw owner id are intentionally not stored in this public repository.

Object-path MD5 fingerprints:

1. `a3aeff70bc13a3aa6f132ecdb2746862`
2. `e83fdb7bfb1c0c690fc2f1396eaafb91`
3. `80c895304fe937c27ece886087ba559a`

All three objects:

- size: `3,030,830` bytes each
- MIME: `image/png`
- same Storage eTag: `3af8e54d0183e045b501dca521a382a3`
- same owner fingerprint MD5: `b835cc640a1604be2fdf10725acd1f58`
- created on `2025-07-23`
- last metadata update on `2025-08-20`

Because all three have the same size and the same content eTag, the Storage evidence shows one unique binary content replicated under three legacy object paths.

For recovery, one verified binary copy plus a manifest of the three original path fingerprints is sufficient to preserve content identity, provided restore mapping is handled through a private recovery procedure rather than committed to the public repository.

## 4. Current dependency evidence

Current repository search:

- `creator-media`: only cleanup/audit documentation; no current runtime consumer found
- `storage.from(`: no current repository result

Current Production database:

- function definitions referencing `creator-media`: `0`
- view definitions referencing `creator-media`: `0`
- trigger definitions referencing `creator-media`: `0`
- `public.profiles.avatar_url` rows referencing `creator-media`: `0`

Earlier Phase-0 evidence also found no current application/data dependency for the bucket.

Conclusion: no current Jetnity runtime dependency is known.

## 5. Privacy assessment

Keeping an unused legacy user-media bucket public has no current product benefit and leaves historical media retrievable by anyone who has or discovers a valid public object URL.

The lowest-risk first mutation is therefore not deletion. It is privacy hardening:

### Recommended C1

Change only `creator-media` bucket visibility:

- before: `public=true`
- after: `public=false`

Keep unchanged:

- all 3 objects
- all paths
- all object metadata
- all 4 existing authenticated owner/folder policies
- Auth owner

Supabase officially supports updating a bucket with `updateBucket(..., { public: false })`.

Expected effect: direct anonymous public serving is disabled while objects remain intact and recoverable under authenticated/RLS-controlled access.

This is a Production Storage mutation and remains blocked on explicit Product Owner approval under decision issue #263.

## 6. Backup / restore plan after C1

After the bucket is private, C2 should create a durable backup before any deletion:

1. obtain the exact three original paths only inside the protected execution environment;
2. download each object through authorized Supabase Storage access;
3. calculate independent cryptographic byte hashes;
4. prove all three downloads are byte-identical;
5. retain one binary copy plus encrypted/private restore manifest for all three path mappings;
6. perform a test restore into a temporary private recovery location or isolated temporary bucket;
7. verify restored bytes/hash;
8. remove the temporary restore location;
9. only then ask for a separate destructive gate to remove the original objects/bucket/policies.

No object bytes, raw paths or owner identifiers may be committed into public GitHub history.

The durable backup destination must be explicitly chosen before C2; moving historical user media into another external system without an explicit retention/recovery decision is not allowed by this audit.

## 7. Recommendation

Current recommendation:

- **C1: APPROVE PRIVATE HARDENING** — privacy improvement, reversible, preserves all data.
- **C2: BACKUP/RESTORE PROOF** — after C1, no deletion yet.
- **C3: eventual DELETE** — likely appropriate because no current dependency exists and the three objects are duplicates from the old product world, but only after C2 and a separate Product Owner destructive gate.

`creator-media` must not be deleted directly from the current state.
