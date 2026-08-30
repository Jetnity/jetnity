# C3 – creator-media final decommission task

Date: 2026-08-30
Issue: #271
Base: `main@e560026639ec56c38b3a17b47029e47997f9c5cf`
Production: `qscbgcdmivbbnzrcyegn`
Product Owner: explicitly approved in chat on 2026-08-30.

## Goal
Permanently remove obsolete Production bucket `creator-media`, its three legacy objects and its four bucket-specific RLS policies, while preserving the verified C2 recovery object in private bucket `jetnity-legacy-recovery`.

## Non-negotiable safety rules
- Storage objects/buckets are mutated only through the official Supabase Storage API. Never delete rows from `storage.objects` or `storage.buckets` via SQL.
- `creator-media` must be private and match the exact C2/pre-C3 before-image before any delete.
- Exactly three source objects must exist, totaling 9,092,490 bytes, with one shared eTag and the three recorded path MD5 fingerprints.
- Recovery must remain private with exactly one 3,030,830-byte PNG, one expected eTag, no user policy and the recorded recovery path fingerprint.
- Exactly the four known `creator-media` policies must exist with exact names/commands/roles/expressions before policy migration.
- Any deviation is STOP.
- The private recovery object is never deleted in C3.

## Execution order
1. Re-run exact read-only Production preflight immediately before mutation.
2. Deploy a temporary, narrowly scoped Edge executor authenticated only by the exact GitHub OIDC workflow identity. It may delete only the exact three source paths after validating their path hashes/size/eTag and the recovery contract. It must not delete the bucket.
3. One-shot GitHub workflow calls the executor and removes it. Verify `creator-media` remains present/private but empty, recovery unchanged, zero Edge Functions.
4. Apply a replay-safe Production migration dropping exactly the four known `creator-media` policies. The migration must accept only either (a) the exact four-policy before-state or (b) a clean fresh-replay state where all four are already absent; any partial/changed state must abort.
5. Verify zero `creator-media` policies.
6. Deploy/call a second narrowly scoped one-shot executor (or a single newly reviewed equivalent) that validates `creator-media` is private and empty, recovery unchanged, then calls official Storage `deleteBucket('creator-media')`; remove executor immediately.
7. Independent Production after-image: source bucket absent, source objects 0, source policies 0, recovery exact/private, zero Edge Functions.
8. Query Supabase migration history, record the actual migration version, and store the exact canonical SQL under the matching repository migration filename.
9. Final PR may contain only permanent migration/evidence/task files; no one-shot workflow or Edge executor source.
10. Exact-head CI + Vercel; merge with head lock; post-merge CI + Vercel; close #271.

## Scope exclusions
No current product code, Auth/MFA/AAL, Account/Traveller, providers, payments, `develop`, branch protection or recovery deletion.