# creator-media C2 – After Image / Restore Proof

Date: 2026-08-30
Issue: #269
Production: `qscbgcdmivbbnzrcyegn`

## Execution

One-shot GitHub Actions run:

- run id: `33326971580`
- job id: `99298727200`
- execution head: `d8145cf0bfe7c674e0168b7e5fc67758efccc4c6`
- conclusion: `success`
- OIDC step: success
- private backup + restore proof step: success
- temporary Edge Function removal step: success

The workflow used GitHub Actions OIDC for invocation. No Supabase service/secret key was committed to the repository. The temporary Edge Function used the server-side secret provided by the hosted Supabase environment.

## Source after-image

`creator-media` after C2:

- bucket exists: yes
- `public=false`
- object count: `3`
- total bytes: `9,092,490`
- distinct owner count: `1`
- distinct eTag count: `1`
- source policy count: `4`
- source policy fingerprint: `3d4c9be5beed38fa2af2dcb1caf2a95b`

Therefore the C2 operation did not delete, move or modify the three source objects or their authorization contract.

## Permanent recovery copy

Recovery bucket:

- id: `jetnity-legacy-recovery`
- `public=false`
- file size limit: `5,000,000`
- allowed MIME types: `image/png` only
- object count: `1`
- total bytes: `3,030,830`
- user/authenticated policies referencing the bucket: `0`
- recovery object path MD5: `6f449a0fc5dd219fe6ef5f82398a1bee`
- MIME: `image/png`
- eTag: `"3af8e54d0183e045b501dca521a382a3"`
- Storage owner is null/service-level rather than the old user owner

The recovery object path itself contains no old owner/user identifier and is not disclosed in repository documentation.

## Byte-level proof

The C2 executor downloaded the canonical source object, the private recovery copy, and the temporary restored copy and calculated SHA-256 over the actual bytes. The workflow required all three hashes to be identical before it could return success.

The SHA-256 value is intentionally not persisted in this public repository. The proof condition and successful workflow run are persisted instead.

## Restore proof

The executor:

1. created private temporary bucket `jetnity-legacy-restore-test-20260830`;
2. copied the private recovery object into it through the official Supabase Storage copy API;
3. verified restored object metadata;
4. downloaded the restored bytes and proved SHA-256 equality with the original source;
5. removed the temporary restored object;
6. verified the temporary bucket was empty;
7. deleted the temporary restore-test bucket.

Independent Production after-image confirms the restore-test bucket no longer exists.

## Temporary execution infrastructure

The temporary Edge Function `creator-media-c2-recovery` was deleted by the same successful one-shot workflow through the official Supabase Management API.

Independent Supabase verification after execution:

- deployed Edge Functions: `0`

The one-shot GitHub workflow file was removed from the C2 branch after successful execution.

## Recovery contract

Until C3 is completed, both the three original private `creator-media` objects and the one service-only recovery copy exist.

After a separately approved C3 removes `creator-media`, the private `jetnity-legacy-recovery` copy remains the recovery source. A restoration must be performed only by a privileged server-side operation using the Supabase Storage API; no public/authenticated read policy should be added merely for recovery.

## C2 result

`PASS` – one private recovery copy exists, byte-level restoration was proven, source remained unchanged, temporary restore infrastructure was removed, and no temporary Edge Function remains.