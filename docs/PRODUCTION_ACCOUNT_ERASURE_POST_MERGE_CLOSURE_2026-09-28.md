# Jetnity – Production Account Erasure Post-Merge Closure – 28 September 2026

Status: **COMPLETE / PRODUCTION E2E DELETE PASS**

## Integrated runtime

- PR #597 runtime merge: `929d671edbcd673d336f97b9b6734ba9f0babe89`
- PR #598 docs closure merge: `7342aabe54b9ef8c196d88811bbca38acf1033ca`
- #598 post-merge CI: `36433054255` — SUCCESS
- #598 Vercel Production: `dpl_12MrSETHMWbo4a1rpAskgPWKsS8M` — READY
- Production alias: `jetnity.com`
- Production migration: `20260927230000 reise_graph_kaskade_tiefe`
- Graph function: SECURITY INVOKER
- Graph trigger count: 9
- Production Edge Function: `account-delete-v1` ACTIVE v1
- JWT gateway verification: true
- Bundle SHA256: `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`

## Production end-to-end deletion proof

The Product Owner explicitly selected a disposable Production account for the final destructive test.

Before deletion the account had no Jetnity trip/traveller/visit/security-event/Storage data and no verified MFA factor.

Observed live result:
- deletion submitted through the real Jetnity account settings UI;
- application redirected to `/konto-geloescht`;
- application returned to signed-out state.

Independent backend evidence after deletion:
- Function log at `2026-09-28T14:20:41.117Z`: `kontoloeschung klasse=geloescht schritt=fertig`;
- Auth user/identity/session/MFA/one-time-token rows: all 0;
- profile/trip/account-traveller/account-visit/security-event/owned-Storage rows: all 0.

Conclusion: **Production account deletion E2E PASS**.

The earlier blocked synthetic-account residual is superseded by this Product-Owner-authorized disposable Production test-account proof. No unrelated Production configuration was changed.

## External/provider boundary

KAYAK remains WAITING FOR RESPONSE after the already sent bounded pre-application inquiry. No provider signup, Terms acceptance, credentials, paid calls or provider implementation follows automatically.
