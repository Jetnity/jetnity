# Jetnity – Production Account Erasure Activation 1 HANDOFF

Stand: 28. September 2026  
Status: **PRODUCTION BACKEND ACTIVE / PR #597 POST-DEPLOY CONTINUITY RE-GATE / NOT MERGED**

Issue: #592  
Draft PR: #597  
Branch: `feat/production-account-erasure-activation-1`  
Cursor session: `bc-27f20108-d06f-4bf1-b5d4-b9629f5a5b06` — completed/stopped  
Accepted pre-deploy exact head: `1b5e2b708c26e294c7216b4cd65559ff7d0d34aa`  
TL FINAL PASS review: `5339269517`

## Live Production truth

Production project: `qscbgcdmivbbnzrcyegn`.

- migration history: `20260927230000 reise_graph_kaskade_tiefe`;
- `reise_graph_geaendert()`: SECURITY INVOKER;
- trigger count: 9;
- `account-delete-v1`: ACTIVE v1;
- Function id: `58a3892d-2743-4a6d-a301-acd311ad7fa7`;
- `verify_jwt=true`;
- bundle SHA256: `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`;
- live Function source was read back after deployment;
- no real Production account has been used or deleted.

The Product Owner authorized this bounded activation. Technical Lead performed the Production migration/history alignment and Function deployment. Cursor performed neither.

## Repository contract

- exact Production HTTPS is allowed;
- Production HTTP and Development HTTP are denied;
- unknown `*.supabase.co`, arbitrary hosts and malformed URLs are denied;
- no second feature flag was added;
- fresh password/MFA/JWT identity/Storage cleanup/Auth-delete order remain unchanged;
- OAuth-only deletion remains unsupported/fail-closed.

## Current next step

The post-deploy continuity edits create a newer docs-only PR head. Do **not** merge using the old pre-deploy PASS alone.

1. Gate the new exact head with GitHub CI and Vercel Preview.
2. TL re-review that exact head.
3. Mark Ready and merge only with expected-head SHA locking.
4. Verify post-merge CI + Vercel Production on exact main.
5. Run bounded synthetic Production account deletion proof only if a safe synthetic-account creation/authentication path is available.
6. If no safe path exists, STOP before smoke and document the dependency. Do not use a real account and do not insert directly into `auth.users`.

KAYAK remains a separate external WAITING FOR RESPONSE path.
