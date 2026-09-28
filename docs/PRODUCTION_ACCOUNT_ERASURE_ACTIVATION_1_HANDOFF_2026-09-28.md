# Jetnity – Production Account Erasure Activation 1 HANDOFF

Stand: 28. September 2026  
Status: **#597 MERGED / POST-MERGE VERIFIED / SYNTHETIC SMOKE BLOCKED**

Issue: #592  
PR #597 merge: `929d671edbcd673d336f97b9b6734ba9f0babe89`

## Live truth

Production:
- Vercel deployment `dpl_2zC37wt2pNRBEraSy1K2H6J1irpQ`: READY on `929d671edbcd673d336f97b9b6734ba9f0babe89`, including `jetnity.com`;
- GitHub post-merge CI `36429943337`: SUCCESS;
- migration `20260927230000 reise_graph_kaskade_tiefe`: APPLIED;
- `reise_graph_geaendert()`: SECURITY INVOKER, 9 triggers;
- `account-delete-v1`: ACTIVE v1;
- `verify_jwt=true`;
- bundle SHA256 `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`.

Security contract:
- exact Production/Development Supabase hosts require HTTPS;
- hosted HTTP, unknown Supabase projects, arbitrary hosts and malformed URLs remain denied;
- typed confirmation, fresh password, MFA/AAL, JWT-derived identity, Storage cleanup and Auth-delete ordering remain intact;
- OAuth-only account deletion remains fail-closed.

No real Production account was used/deleted. No Production Auth/MFA/OAuth/indexing/provider/payment configuration changed.

## Remaining evidence residual

Bounded synthetic Production deletion smoke is **BLOCKED / NOT RUN**.

Do not improvise. Current tool surface has no safe Auth Admin create-user action, and the repo has no approved Production synthetic test-account creation path. Never use an existing real account, direct `auth.users` insertion or an unreviewed privileged test endpoint.

If a safe disposable Production Auth identity path becomes available later, reconstruct live state first and run only the bounded smoke. That future proof does not require reopening the completed Cursor writer.

KAYAK remains WAITING FOR RESPONSE separately.
