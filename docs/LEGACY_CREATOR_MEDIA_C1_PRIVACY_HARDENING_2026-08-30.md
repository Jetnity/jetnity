# Legacy creator-media C1 – Privacy Hardening

Date: 2026-08-30
Issue: #263
Product Owner approval: granted in chat on 2026-08-30
Status: COMPLETED / PRODUCTION AFTER-IMAGE PASS

## Scope

Production Supabase project: `qscbgcdmivbbnzrcyegn`

Exact mutation only:

- Storage bucket `creator-media`
- `public=true` -> `public=false`

Hard non-scope:

- no object delete
- no object move or rename
- no owner mutation
- no Storage policy mutation
- no Auth mutation
- no Traveller / Trip / Provider / Payment mutation
- no develop reset/rebase

## Audit basis

The preceding read-only Batch-C audit proved:

- current Jetnity runtime has no active `creator-media` Storage consumer;
- no current database function, view or trigger references `creator-media`;
- `profiles.avatar_url` has zero references to `creator-media`;
- three legacy PNG objects remain, one owner;
- all three objects are byte-equivalent at Storage metadata level: same size and same eTag;
- bucket was still public despite no current runtime use.

## Before-image

Immediately before C1:

- bucket count: `1`
- public: `true`
- object count: `3`
- total bytes: `9,092,490`
- distinct owners: `1`
- distinct eTags: `1`
- creator-media policy count: `4`
- creator-media policy fingerprint MD5: `84f13dec01a78b2ae7cef5c00a396958`

No object path, owner UUID, Auth identifier or user media bytes are written to repository evidence.

## Execution

The change was executed through the supported Supabase Storage API `updateBucket()` rather than direct mutation of `storage.buckets`.

A short-lived Edge executor was deployed with a hard-coded target bucket and exact before-state guard. Invocation was restricted by custom GitHub Actions OIDC validation to:

- repository: `Jetnity/jetnity`
- repository id: `1020187087`
- owner id: `217454461`
- branch: `ops/creator-media-private-2026-08-30`
- workflow: `.github/workflows/creator-media-private.yml`
- audience: `jetnity-creator-media-c1`

GitHub Actions workflow run:

- run id: `33322807328`
- head: `ddba9170598e01038e69edd6a119e0ed9efbd0bb`
- result: `success`
- OIDC token acquisition: success
- Storage API privacy mutation: success
- temporary Edge executor removal through official Supabase Management API: success

No Supabase service-role key, secret API key, PAT or OIDC token was committed or printed into repository evidence.

The one-shot workflow was removed from the final branch after execution.

## Independent after-image

Read-only Production verification after the operation:

- bucket count: `1`
- public: `false`
- object count: `3` — unchanged
- total bytes: `9,092,490` — unchanged
- distinct owners: `1` — unchanged
- distinct eTags: `1` — unchanged
- creator-media policy count: `4` — unchanged
- creator-media policy fingerprint MD5: `84f13dec01a78b2ae7cef5c00a396958` — unchanged
- deployed Edge Functions: `0`

Therefore C1 changed only the bucket visibility from public to private and left all protected objects, ownership and policies unchanged.

## Next gate

C1 does not authorize destructive deletion.

Recommended next sequence:

1. C2: create a private verified backup of the one unique binary content plus a restore manifest for the three original path fingerprints;
2. prove restore capability without exposing user media in the public repository;
3. C3: only after backup/restore proof, decide whether to delete the three legacy objects, their four policies and the now-private legacy bucket.
