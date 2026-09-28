# Jetnity – Production Account Erasure Post-Merge Closure – 28 September 2026

Status: **ACTIVATION MERGED / POST-MERGE VERIFIED / SYNTHETIC E2E SMOKE BLOCKED**

## Integrated runtime

- PR #597 merge: `929d671edbcd673d336f97b9b6734ba9f0babe89`
- Post-merge GitHub Actions: `36429943337` — SUCCESS
- Vercel Production: `dpl_2zC37wt2pNRBEraSy1K2H6J1irpQ` — READY on exact merge SHA
- Production alias: `jetnity.com`
- Production migration: `20260927230000 reise_graph_kaskade_tiefe`
- Graph function: SECURITY INVOKER
- Graph trigger count: 9
- Production Edge Function: `account-delete-v1` ACTIVE v1
- Function id: `58a3892d-2743-4a6d-a301-acd311ad7fa7`
- JWT gateway verification: true
- Bundle SHA256: `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`

## Safety invariants retained

The merged account-erasure path retains typed confirmation, fresh password reauthentication, MFA/AAL requirements, JWT-derived target identity, no browser-controlled target user ID, owned-Storage cleanup, linked security-event cleanup, hard Auth deletion after cleanup, OAuth fail-closed behavior and generic logging/result classes.

## Production smoke boundary

A purpose-created disposable Production Auth identity is required for end-to-end destructive acceptance.

The current authorized Supabase tools do not expose an Auth Admin create-user action. Repository search found no approved Production synthetic-account creation/authentication workflow. Therefore the destructive synthetic smoke was **not run**.

The Technical Lead deliberately rejected these substitutes:
- any existing real Production account;
- raw SQL insertion into `auth.users`;
- an unreviewed privileged Production test endpoint created only to manufacture a user.

This is an evidence residual, not a hidden success claim.

## External/provider boundary

KAYAK remains WAITING FOR RESPONSE after the already sent bounded pre-application inquiry. No provider signup, Terms acceptance, credentials, paid calls or provider implementation follows from this closure.
