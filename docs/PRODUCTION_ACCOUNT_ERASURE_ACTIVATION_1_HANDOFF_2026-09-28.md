# Jetnity – Production Account Erasure Activation 1 HANDOFF

Stand: 28. September 2026  
Status: **CLOSED / PRODUCTION E2E DELETE PASS**

Issue #592 is complete.

## Runtime truth

- #597 runtime merge: `929d671edbcd673d336f97b9b6734ba9f0babe89`
- Production migration: `20260927230000 reise_graph_kaskade_tiefe`
- graph function: SECURITY INVOKER
- graph triggers: 9
- `account-delete-v1`: ACTIVE v1
- `verify_jwt=true`
- bundle SHA256: `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`

## Final E2E proof

A Product-Owner-authorized disposable Production test account was deleted via `jetnity.com`.

- UI reached `/konto-geloescht` and signed-out state.
- Function log recorded `kontoloeschung klasse=geloescht schritt=fertig`.
- Auth user, identity, sessions, MFA factors and one-time tokens all read back as 0.
- Jetnity profile/trips/travellers/visits/security events and owned Storage objects all read back as 0.

No open account-erasure activation or smoke residual remains.

Do not restart the completed Cursor writer. Future account-erasure work requires new evidence or a new scope.

KAYAK remains WAITING FOR RESPONSE separately.
