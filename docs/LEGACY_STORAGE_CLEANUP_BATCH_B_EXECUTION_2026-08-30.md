# Legacy Storage Cleanup Batch B – Final Execution Evidence

Date: 2026-08-30
Issue: #255
Product Owner approval: granted in chat on 2026-08-30
Status at this commit: FINAL PRE-WRITE EVIDENCE / PRODUCTION POLICY DROP NOT YET APPLIED

## 1. Clean execution baseline

Final branch:

- `cleanup/legacy-storage-batch-b-final-2026-08-30`
- base `main @ 690f9d155c82db85149b08d5c4b563c5f2a25661`

The earlier working branch `cleanup/legacy-storage-batch-b-2026-08-30` is not used as the final execution branch because its history/final tree still contained a temporary migration-generator workflow. The final branch starts clean from current main and contains only durable Batch-B migration/evidence.

## 2. Approved scope

Production project: `qscbgcdmivbbnzrcyegn`

Ten already-approved obsolete Storage buckets:

- `masks`
- `media-original`
- `media-proxy`
- `media-renders`
- `media-thumbs`
- `media-versions`
- `public-media`
- `renders`
- `session-versions`
- `subtitles`

Only policies tied to those ten bucket ids may be removed.

Hard non-scope:

- bucket `creator-media`
- its three objects
- its four policies
- Auth users
- current Traveller/Trip/Provider/Payment schema
- current Production project identity
- existing `develop` branch
- historical migration rewrites/deletes

## 3. Storage bucket execution already completed

The ten empty Legacy buckets were already removed through the supported Supabase Storage API during the approved Batch-B operation. The temporary execution mechanism used for that call was removed afterwards.

Latest independent live preflight before the policy migration:

- legacy bucket count across the exact ten ids: `0`
- `creator-media` bucket count: `1`
- `creator-media` object count: `3`
- `creator-media` total object bytes: `9,092,490`

Therefore no bucket deletion remains in this migration.

## 4. Exact remaining Legacy-policy before-image

Latest read-only Production preflight immediately before final migration preparation:

- legacy candidate policy count: `24`
- exact candidate fingerprint MD5: `a9166c145523b0473af12199d8bac91a`
- `creator-media` policy count: `4`
- exact `creator-media` policy fingerprint MD5: `84f13dec01a78b2ae7cef5c00a396958`

The 24 expected names are encoded in the migration itself and are compared as an exact ordered set. Any partial or changed candidate state fails closed.

## 5. Replay-safety correction

The first generated migration draft required the 24 Legacy policies to exist unconditionally. Repository inspection showed those historical Storage policies are not part of the current replayable migration source in the same way as current public-schema migrations.

That unconditional requirement could make a clean fresh environment fail simply because it never contained the Legacy policies.

The final migration therefore supports exactly two valid states:

1. Production-style Legacy state: exactly 24 known candidate policies with exact fingerprint, plus the exact four-policy `creator-media` guard. In this state only the 24 Legacy policies are dropped.
2. Already-clean replay state: zero candidate policies. No drop occurs. `creator-media` may be absent on a fresh environment or, if present, must have the exact known four-policy fingerprint.

Any partial candidate set, changed fingerprint, unexpected `creator-media` policy state or post-operation residue raises an exception and aborts the migration.

## 6. Migration identity

Repository migration:

- `supabase/migrations/20260830150133_legacy_storage_policies_cleanup.sql`
- migration version `20260830150133`
- name `legacy_storage_policies_cleanup`

Before preparation, Production migration history was checked for version `20260830150133` and returned no row.

## 7. Required gates before Production DDL

Before applying the migration:

1. open PR from the clean final branch;
2. inspect exact final diff;
3. GitHub CI success on exact head;
4. Vercel success on exact head;
5. repeat live Production read-only preflight;
6. drift => STOP.

After applying:

1. candidate policies must be `0`;
2. `creator-media` bucket/object count and policy fingerprint must be unchanged;
3. migration-history row must exist with correct version/name;
4. create a fresh temporary Supabase replay branch only after a fresh explicit cost confirmation;
5. replay branch must be `ACTIVE_HEALTHY` and must not contain the removed Legacy policy set;
6. delete the temporary replay branch immediately after evidence collection;
7. update this document with exact after-image/replay evidence;
8. exact-head CI/Vercel gate again if documentation changes;
9. merge and close #255 only after all gates pass.
