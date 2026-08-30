# Legacy Storage Cleanup Batch B – Final Execution Evidence

Date: 2026-08-30
Issue: #255
PR: #260
Product Owner approval: granted in chat on 2026-08-30
Status: PRODUCTION CLEANUP APPLIED / AFTER-IMAGE PASS / FRESH REPLAY PENDING

## 1. Clean execution baseline

Final branch:

- `cleanup/legacy-storage-batch-b-final-2026-08-30`
- base `main @ 690f9d155c82db85149b08d5c4b563c5f2a25661`

The earlier working branch `cleanup/legacy-storage-batch-b-2026-08-30` is not used as the final execution branch because its history/final tree still contained a temporary migration-generator workflow. The final branch starts clean from current main and contains only durable Batch-B migration/evidence.

## 2. Approved scope

Production project: `qscbgcdmivbbnzrcyegn`

Ten approved obsolete Storage buckets:

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

Only policies tied to those ten bucket ids were eligible for removal.

Hard non-scope:

- bucket `creator-media`
- its three objects
- its four policies
- Auth users
- current Traveller/Trip/Provider/Payment schema
- current Production project identity
- existing `develop` branch
- historical migration rewrites/deletes

## 3. Storage bucket execution

The ten empty Legacy buckets were removed through the supported Supabase Storage API during the approved Batch-B operation. The temporary execution mechanism used for that call was removed afterwards.

Final pre-policy live state:

- legacy bucket count across the exact ten ids: `0`
- `creator-media` bucket count: `1`
- `creator-media` object count: `3`
- `creator-media` total object bytes: `9,092,490`

No bucket deletion was performed by the policy migration.

## 4. Exact policy before-image

Immediate read-only Production preflight before DDL:

- legacy candidate policy count: `24`
- exact candidate fingerprint MD5: `a9166c145523b0473af12199d8bac91a`
- `creator-media` policy count: `4`
- exact `creator-media` policy fingerprint MD5: `84f13dec01a78b2ae7cef5c00a396958`
- legacy bucket count: `0`
- `creator-media` bucket count: `1`
- `creator-media` object count: `3`
- `creator-media` bytes: `9,092,490`

The PR head used for the Production-write gate was `99e0b04a5274efed2218ce3d7fb7d63073acfc71`.

Exact-head gates before DDL:

- GitHub Actions CI #1372 / run `33320888836`: `SUCCESS`
- Vercel: `SUCCESS`
- exact PR diff: only Batch-B migration + this evidence document

## 5. Replay-safety correction

The first generated migration draft required the 24 Legacy policies to exist unconditionally. Repository inspection showed those historical Storage policies are not part of the current replayable migration source in the same way as current public-schema migrations.

That unconditional requirement could make a clean fresh environment fail simply because it never contained the Legacy policies.

The final migration supports exactly two valid states:

1. Production-style Legacy state: exactly 24 known candidate policies with exact fingerprint, plus the exact four-policy `creator-media` guard. In this state only the 24 Legacy policies are dropped.
2. Already-clean replay state: zero candidate policies. No drop occurs. `creator-media` may be absent on a fresh environment or, if present, must have the exact known four-policy fingerprint.

Any partial candidate set, changed fingerprint, unexpected `creator-media` policy state or post-operation residue raises an exception and aborts the migration.

## 6. Production migration execution

The exact reviewed SQL body was applied through Supabase's migration operation with name `legacy_storage_policies_cleanup`.

Result: `success=true`.

Supabase assigned the canonical Production migration identity:

- version: `20260830155711`
- name: `legacy_storage_policies_cleanup`
- history statement count: `1`
- stored history body MD5: `a0a948fca4e4b9f6ecf9cc376de413ca`

The repository filename was therefore aligned to the real Production history:

- `supabase/migrations/20260830155711_legacy_storage_policies_cleanup.sql`

The earlier preparation-only filename `20260830150133_legacy_storage_policies_cleanup.sql` was removed from the final branch. Production never contained a history row for preparation version `20260830150133`.

## 7. Independent Production after-image

Read-only verification after the migration:

- legacy candidate policy count: `0`
- legacy bucket count across the exact ten ids: `0`
- `creator-media` policy count: `4`
- `creator-media` policy fingerprint MD5: `84f13dec01a78b2ae7cef5c00a396958` — unchanged
- `creator-media` bucket count: `1` — unchanged
- `creator-media` object count: `3` — unchanged
- `creator-media` total object bytes: `9,092,490` — unchanged

Therefore the Production policy cleanup removed the exact Legacy-policy set and did not mutate the protected `creator-media` bucket, objects or policies.

## 8. Remaining completion gate: fresh replay

Before Batch B may be closed and merged as complete:

1. obtain a fresh current Supabase branch cost quote;
2. obtain explicit cost confirmation;
3. create a new temporary branch from current Production;
4. require `ACTIVE_HEALTHY` / no migration failure;
5. verify migration `20260830155711` is present;
6. verify the ten Legacy policies are absent;
7. inspect whether obsolete Legacy buckets reappear in a fresh branch; any reappearance is a STOP/follow-up defect, not something to ignore;
8. verify `creator-media` behavior is consistent with fresh-branch semantics and no protected Production object data is copied;
9. delete the temporary branch immediately after evidence collection;
10. update this document with replay evidence;
11. exact-head CI/Vercel gate after the final evidence commit;
12. merge PR #260 and close #255 only after all gates pass.
