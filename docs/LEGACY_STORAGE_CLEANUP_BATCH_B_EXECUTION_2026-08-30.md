# Legacy Storage Cleanup Batch B – Final Execution Evidence

Date: 2026-08-30
Issue: #255
PR: #260
Product Owner approval: granted in chat on 2026-08-30
Status: COMPLETED / PRODUCTION AFTER-IMAGE PASS / FRESH REPLAY PASS

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

Final read-only verification after the migration and after replay cleanup:

- legacy candidate policy count: `0`
- legacy bucket count across the exact ten ids: `0`
- `creator-media` policy count: `4`
- `creator-media` policy fingerprint MD5: `84f13dec01a78b2ae7cef5c00a396958` — unchanged
- `creator-media` bucket count: `1` — unchanged
- `creator-media` object count: `3` — unchanged
- `creator-media` total object bytes: `9,092,490` — unchanged
- migration `20260830155711 / legacy_storage_policies_cleanup`: exactly one Production history row

Therefore the Production cleanup removed the exact Legacy-policy set and did not mutate the protected `creator-media` bucket, objects or policies.

## 8. Fresh replay proof

A fresh temporary Supabase branch was created from current Production only after a new live branch-cost quote and explicit Product Owner confirmation.

Cost confirmation:

- current quote: USD `0.01344` per hour
- recurrence: hourly
- Product Owner confirmation: granted in chat on 2026-08-30

Replay branch:

- branch id: `8fec9533-e19c-4933-b1be-cecd661159ad`
- name: `replay-legacy-storage-batch-b-2026-08-30`
- project ref: `qhjhjelkggrwolhtltzf`
- parent Production ref: `qscbgcdmivbbnzrcyegn`
- `with_data=false`
- final observed preview status before verification: `ACTIVE_HEALTHY`

Read-only replay verification on the fresh branch:

- migration `20260830155711 / legacy_storage_policies_cleanup`: `1`
- Legacy policy count across the exact ten removed bucket ids: `0`
- Legacy bucket count across the exact ten ids: `0`
- `creator-media` policy count: `0`
- `creator-media` bucket count: `0`

The absence of `creator-media` on the fresh branch is expected because the branch was created without Production data and the old bucket/policies are not part of current replay source. This proves the migration's already-clean replay path works without requiring obsolete Storage state.

The temporary replay branch was deleted immediately after evidence collection. A subsequent Production branch listing showed only:

- `main` / `qscbgcdmivbbnzrcyegn` — `ACTIVE_HEALTHY`
- existing `develop` / `yfvbxvijcorffwxbxahl` — `ACTIVE_HEALTHY`

No temporary replay branch remains, so hourly replay-branch cost has stopped.

## 9. Final completion criteria

Batch B is technically complete when the final evidence head passes exact-head GitHub CI and Vercel, then PR #260 may be merged and issue #255 closed.

No Batch-C mutation of `creator-media` is included here. The three protected legacy PNG objects remain a separate backup/restore-gated decision.
