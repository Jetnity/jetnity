# creator-media C2 – Private Recovery Backup + Restore Proof

Date: 2026-08-30
Issue: #269
Production: `qscbgcdmivbbnzrcyegn`
Branch: `ops/creator-media-c2-recovery-2026-08-30`

## Goal

Create one private service-only recovery copy of the single unique legacy `creator-media` image content and prove that the recovery copy can be restored, without deleting or modifying the three source objects.

## Hard source invariants

Immediately before execution all of the following must be true:

- source bucket id/name: `creator-media`
- `public=false`
- source object count: `3`
- source total bytes: `9,092,490`
- distinct source owners: `1`
- distinct source eTags: `1`
- each source object size: `3,030,830` bytes
- each source MIME type: `image/png`
- shared source eTag: `"3af8e54d0183e045b501dca521a382a3"`
- source policy count: `4`
- source policy fingerprint: `3d4c9be5beed38fa2af2dcb1caf2a95b`
- no deployed Edge Functions at C2 start

Source object names and owner UUID are deliberately not written into repository documentation.

## Source path fingerprints

Sorted by original object name, the non-reversible path fingerprints are:

1. `e83fdb7bfb1c0c690fc2f1396eaafb91`
2. `a3aeff70bc13a3aa6f132ecdb2746862`
3. `80c895304fe937c27ece886087ba559a`

## Recovery target

Permanent recovery bucket:

- `jetnity-legacy-recovery`
- private (`public=false`)
- no public/authenticated Storage policy is to be added
- one canonical PNG object only
- object path must not expose the original user/owner identifier

Temporary restore-test bucket:

- `jetnity-legacy-restore-test-20260830`
- private
- must be deleted again in the same successful execution after restore verification

## Execution method

Use the official Supabase Storage API only. Direct writes/deletes in `storage.buckets` or `storage.objects` are forbidden.

A temporary Edge Function may be deployed solely as an execution bridge. It must:

1. use Supabase's server-side secret key from the hosted Edge Function environment;
2. implement custom GitHub OIDC authentication and accept only the exact Jetnity repository + C2 branch + one-shot workflow identity;
3. recursively enumerate `creator-media` without returning object names;
4. fail unless all source invariants above match;
5. create the permanent recovery bucket only if absent and with the exact private configuration;
6. copy exactly one canonical source object to a non-user-identifying recovery path;
7. verify recovery copy size/eTag;
8. create a private temporary restore-test bucket;
9. copy the recovery object into the restore-test bucket;
10. verify restored size/eTag;
11. delete the temporary restored object and temporary bucket;
12. re-check that all three original source objects and the source bucket/policies are unchanged;
13. return only non-sensitive counts/hashes/status.

Any temporary workflow/Edge Function is removed after execution.

## C2 non-scope

C2 MUST NOT:

- delete or move any `creator-media` source object;
- change source Storage policies;
- change source owner metadata;
- change Auth users/sessions;
- change current application runtime;
- touch traveller/account/provider/commercial data;
- remove the `creator-media` bucket.

## C3 gate

Permanent removal of `creator-media`, its objects and policies is a separate destructive C3 slice after C2 completes and is independently reviewed.