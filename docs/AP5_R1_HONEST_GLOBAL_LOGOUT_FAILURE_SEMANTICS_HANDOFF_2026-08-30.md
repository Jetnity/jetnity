# Jetnity – AP-5-R1 – Handoff

Stand: 30. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN FOLGESLICE**  
Cursor-Agent: **`Account plattform audit vorbereitung 22`**  
Cursor-Session/Run-ID: `bc-f631838b-21f3-4290-aa1f-db450a037ac3`  
Issue: [#241](https://github.com/Jetnity/jetnity/issues/241)  
Branch: `feat/ap5-r1-honest-global-logout-2026-08-30`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/242

## Zuerst lesen

1. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_TASK_2026-08-30.md`
2. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_STATUS_2026-08-30.md`
3. ADR-0200 in `DECISIONS.md`
4. `docs/AP5_S3_ACCOUNT_SECURITY_LOGOUT_SCOPES_HANDOFF_2026-08-29.md`
5. Issue #241

## Was ein neuer Chat wissen muss

AP-5-R1 schließt das Residual, dass allgemeines/admin `signOut()` den Auth-`{ error }` ignorierte und trotzdem redirected.

Harte Wahrheiten:

1. Allgemeines Logout bleibt Supabase-default / unscoped / global.
2. Success-Redirect nur nach bestätigtem `signOut()` ohne Fehler.
3. `{ error }` oder Wurf = logout not confirmed. Keine Erfolgsnavigation. Keine „abgemeldet“-Behauptung.
4. Public-Ziel `/`. Admin-Login-Ziel `/admin/login`. Admin-Topbar bleibt ein öffentlicher `signOutAction`-Caller auf `/`.
5. AP-5-S3 `local` / `others` / `global` ist eine getrennte Authority und bleibt unverändert.
6. Keine Rohtexte, Tokens, Cookies, Session-IDs oder Secrets in der UI.
7. Kein Open Redirect.
8. Generation 22 ist nur für AP-5-R1. Kein AP-6/AP-7/AP-8 und kein weiterer AP-5-Residual aus diesem Slice.

Exact Cursor-Session-ID: `bc-f631838b-21f3-4290-aa1f-db450a037ac3`.  
Beobachteter Titel: `Ehrliche globale abmeldefehlersemantik`. Keine Rename-Fähigkeit; UI nicht als umbenannt behauptet.

## Caller-Inventar

`signOutAction`: PublicNavbar, FooterSitzung, Unauthorized, AdminTopbar.  
`signOutToAdminLoginAction`: nur Admin-Login-Seite.  
Nicht geändert: S3 scoped Action, MFA local, Admin-Login-Denial-Cleanup.

## Was bewusst nicht gebaut wurde

Service Role, `auth.sessions`, Session-Registry, Migration/RLS/Identity, Auth-/MFA-Config, Consumer-AAL2, Passkeys/OAuth/Recovery-Neuarchitektur, PrivacyBee, AP-6/AP-7/AP-8, globales Notification-Framework, Default-Logout-Wechsel auf `local`.

## Residuals

- Admin-Topbar-Erfolg bleibt `/`.
- Admin-Login-Denial-`signOut()` bleibt außerhalb.
- Kein authentifizierter Browser-/Real-Device-Beweis.
- Agent-Self-Review ist kein PASS.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #242. Nicht Ready. Nicht mergen. Keinen Folgeslice starten.
