# Jetnity – Production Account Erasure Activation 1 STATUS

Stand: 28. September 2026  
Status: **COMPLETE / MERGED / PRODUCTION ACTIVE / E2E DELETE PASS**

Issue: #592  
PR #597 runtime merge: `929d671edbcd673d336f97b9b6734ba9f0babe89`  
PR #598 docs closure merge: `7342aabe54b9ef8c196d88811bbca38acf1033ca`

## Production backend

- migration `20260927230000 reise_graph_kaskade_tiefe`: APPLIED;
- `reise_graph_geaendert()`: SECURITY INVOKER;
- trigger count: 9;
- `account-delete-v1`: ACTIVE v1;
- `verify_jwt=true`;
- bundle SHA256: `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`.

## Final Production E2E proof

A Product-Owner-authorized disposable Production test account was deleted through the live Jetnity UI.

Observed application result:
- redirect to `/konto-geloescht`;
- signed-out navigation state.

Function evidence:
- `2026-09-28T14:20:41.117Z`;
- `kontoloeschung klasse=geloescht schritt=fertig`.

Post-delete independent readback:
- `auth.users=0`;
- `auth.identities=0`;
- `auth.sessions=0`;
- `auth.mfa_factors=0`;
- `auth.one_time_tokens=0`;
- `profiles=0`;
- `trips=0`;
- `account_travellers=0`;
- `account_visits=0`;
- `security_events=0`;
- `storage.objects=0`.

Conclusion: **PRODUCTION E2E DELETE PASS**.

The previous synthetic-smoke evidence residual is superseded. No unrelated Production Auth/MFA/OAuth/indexing/provider/payment configuration was changed.

Cursor session `bc-27f20108-d06f-4bf1-b5d4-b9629f5a5b06` remains completed/stopped and must not be restarted.
